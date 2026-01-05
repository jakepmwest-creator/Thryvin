import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ExerciseVideoPlayer } from '../src/components/ExerciseVideoPlayer';
import { CustomAlert } from '../src/components/CustomAlert';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://testauth.preview.emergentagent.com';

const COLORS = {
  accent: '#a259ff',
  accentSecondary: '#3a86ff',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
};

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restTime: number;
  videoUrl?: string;
  instructions?: string;
}

interface Workout {
  id: string;
  title: string;
  exercises: Exercise[];
  duration: number;
}

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Parse workout data from params
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseVideos, setExerciseVideos] = useState<Map<string, string>>(new Map());
  const [loadingVideos, setLoadingVideos] = useState(false);
  
  // CustomAlert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
  }>({ visible: false, type: 'info', title: '', message: '' });
  
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, buttons?: any[]) => {
    setAlertConfig({ visible: true, type, title, message, buttons });
  };
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  // Current exercise
  const currentExercise = workout?.exercises[currentExerciseIndex];
  const totalExercises = workout?.exercises.length || 0;
  const isFirstExercise = currentExerciseIndex === 0;
  const isLastExercise = currentExerciseIndex === totalExercises - 1;

  // Fetch workout data from params or store
  useEffect(() => {
    loadWorkout();
  }, []);

  // Fetch exercise videos when workout loads
  useEffect(() => {
    if (workout && workout.exercises.length > 0) {
      fetchExerciseVideos();
    }
  }, [workout]);

  const loadWorkout = () => {
    // For now, use mock data - will integrate with workout store later
    const mockWorkout: Workout = {
      id: 'workout_1',
      title: 'Upper Body Push',
      duration: 45,
      exercises: [
        {
          id: '1',
          name: 'Bench Press',
          sets: 4,
          reps: '8-10',
          restTime: 120,
          instructions: 'Lie on bench, grip barbell slightly wider than shoulders. Lower to chest, press up explosively. Keep shoulder blades retracted.',
        },
        {
          id: '2',
          name: 'Incline Dumbbell Press',
          sets: 3,
          reps: '10-12',
          restTime: 90,
          instructions: 'Set bench to 30-45 degrees. Press dumbbells up and slightly together. Control the negative.',
        },
        {
          id: '3',
          name: 'Overhead Press',
          sets: 4,
          reps: '6-8',
          restTime: 120,
          instructions: 'Stand with barbell at chest height. Press overhead, engage core throughout. Lock out at top.',
        },
        {
          id: '4',
          name: 'Lateral Raises',
          sets: 3,
          reps: '12-15',
          restTime: 60,
          instructions: 'Slight bend in elbows. Raise arms to sides until parallel with ground. Lead with elbows, not hands.',
        },
        {
          id: '5',
          name: 'Tricep Dips',
          sets: 3,
          reps: '10-12',
          restTime: 90,
          instructions: 'Lean forward slightly, elbows back. Lower until upper arms parallel to ground. Press back up.',
        },
      ],
    };

    setWorkout(mockWorkout);
  };

  const fetchExerciseVideos = async () => {
    if (!workout) return;

    setLoadingVideos(true);
    try {
      const exerciseNames = workout.exercises
        .map(ex => ex.name)
        .filter(Boolean)
        .join(',');

      if (!exerciseNames) {
        setLoadingVideos(false);
        return;
      }

      const response = await fetch(
        `${API_URL}/api/exercises?names=${encodeURIComponent(exerciseNames)}`
      );

      if (response.ok) {
        const data = await response.json();
        const videoMap = new Map<string, string>();

        if (data?.exercises) {
          data.exercises.forEach((ex: any) => {
            if (ex && ex.videoUrl) {
              videoMap.set(ex.name, ex.videoUrl);
            }
          });
        }

        setExerciseVideos(videoMap);
        console.log(`Fetched ${videoMap.size} exercise videos`);
      }
    } catch (error) {
      console.error('Error fetching exercise videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handlePreviousExercise = () => {
    if (!isFirstExercise) {
      setCurrentExerciseIndex(prev => prev - 1);
    }
  };

  const handleNextExercise = () => {
    if (!isLastExercise) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      // Last exercise - show completion confirmation
      showAlert('success', 'Workout Complete! 🎉', 'Ready to finish this workout?', [
        { text: 'Not Yet', style: 'cancel' },
        { text: 'Complete Workout', onPress: handleCompleteWorkout },
      ]);
    }
  };

  const handleCompleteWorkout = () => {
    showAlert('success', 'Great Job! 💪', 'Workout completed successfully!', [
      { text: 'Done', onPress: () => router.back() },
    ]);
  };

  const handleBack = () => {
    showAlert('warning', 'Exit Workout?', "Your progress won't be saved.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Exit', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  if (!workout || !currentExercise) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const videoUrl = exerciseVideos.get(currentExercise.name);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.workoutTitle}>{workout.title}</Text>
          <Text style={styles.exerciseCounter}>
            Exercise {currentExerciseIndex + 1} of {totalExercises}
          </Text>
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressBarFill,
              { width: `${((currentExerciseIndex + 1) / totalExercises) * 100}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Exercise Name */}
        <View style={styles.exerciseNameContainer}>
          <Text style={styles.exerciseName}>{currentExercise.name}</Text>
          <View style={styles.exerciseBadge}>
            <Ionicons name="barbell" size={20} color={COLORS.accent} />
          </View>
        </View>

        {/* Exercise Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="repeat" size={20} color={COLORS.accent} />
            <Text style={styles.statValue}>{currentExercise.sets}</Text>
            <Text style={styles.statLabel}>Sets</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="fitness" size={20} color={COLORS.accent} />
            <Text style={styles.statValue}>{currentExercise.reps}</Text>
            <Text style={styles.statLabel}>Reps</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="timer" size={20} color={COLORS.accent} />
            <Text style={styles.statValue}>{currentExercise.restTime}s</Text>
            <Text style={styles.statLabel}>Rest</Text>
          </View>
        </View>

        {/* Video Player */}
        {loadingVideos ? (
          <View style={styles.videoLoading}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.videoLoadingText}>Loading video...</Text>
          </View>
        ) : videoUrl ? (
          <View style={styles.videoContainer}>
            <ExerciseVideoPlayer
              videoUrl={videoUrl}
              exerciseName={currentExercise.name}
              autoPlay={false}
            />
          </View>
        ) : (
          <View style={styles.noVideoContainer}>
            <Ionicons name="videocam-off" size={48} color={COLORS.mediumGray} />
            <Text style={styles.noVideoText}>Video not available</Text>
          </View>
        )}

        {/* Instructions */}
        {currentExercise.instructions && (
          <View style={styles.instructionsContainer}>
            <View style={styles.instructionsHeader}>
              <Ionicons name="information-circle" size={22} color={COLORS.accent} />
              <Text style={styles.instructionsTitle}>Form Tips</Text>
            </View>
            <Text style={styles.instructionsText}>{currentExercise.instructions}</Text>
          </View>
        )}

        {/* Placeholder for Set Tracking - Coming in Step 2 */}
        <View style={styles.comingSoonContainer}>
          <Ionicons name="construct" size={32} color={COLORS.mediumGray} />
          <Text style={styles.comingSoonText}>Set tracking coming in next step!</Text>
          <Text style={styles.comingSoonSubtext}>
            You'll be able to log weight and reps for each set
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, isFirstExercise && styles.navButtonDisabled]}
          onPress={handlePreviousExercise}
          disabled={isFirstExercise}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={isFirstExercise ? COLORS.mediumGray : COLORS.accent}
          />
          <Text
            style={[
              styles.navButtonText,
              isFirstExercise && styles.navButtonTextDisabled,
            ]}
          >
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextButton} onPress={handleNextExercise}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.nextButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.nextButtonText}>
              {isLastExercise ? 'Complete Workout' : 'Next Exercise'}
            </Text>
            <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.mediumGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  exerciseCounter: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  progressBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  exerciseNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  exerciseName: {
    flex: 1,
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
  },
  exerciseBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.accent}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  videoContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoLoading: {
    height: 200,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  videoLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  noVideoContainer: {
    height: 200,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  noVideoText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  instructionsContainer: {
    backgroundColor: `${COLORS.accent}08`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  comingSoonContainer: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  comingSoonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
  },
  comingSoonSubtext: {
    fontSize: 13,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginTop: 6,
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    gap: 6,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.accent,
  },
  navButtonTextDisabled: {
    color: COLORS.mediumGray,
  },
  nextButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
