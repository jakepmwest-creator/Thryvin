import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Alert,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ExerciseVideoPlayer } from '../src/components/ExerciseVideoPlayer';
import { useWorkoutStore } from '../src/stores/workout-store';
import { COLORS } from '../src/constants/colors';
import ConfettiCannon from 'react-native-confetti-cannon';
import { 
  ExpoSpeechRecognitionModule, 
  useSpeechRecognitionEvent 
} from 'expo-speech-recognition';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type TabType = 'warmup' | 'workout' | 'recovery';

const TABS: { id: TabType; label: string }[] = [
  { id: 'warmup', label: 'Warm Up' },
  { id: 'workout', label: 'Workout' },
  { id: 'recovery', label: 'Recovery' },
];

export default function WorkoutHubScreen() {
  const router = useRouter();
  const { currentWorkout, activeSession, startWorkoutSession, completeSet, finishWorkoutSession } = useWorkoutStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('warmup');
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [currentSet, setCurrentSet] = useState(0);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [effortRating, setEffortRating] = useState<number>(3);
  const [setNotes, setSetNotes] = useState('');
  const [showTips, setShowTips] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');
  
  const scrollX = useRef(new Animated.Value(0)).current;

  // Start workout session when component mounts
  useEffect(() => {
    if (currentWorkout && !activeSession) {
      startWorkoutSession(currentWorkout.id);
    }
  }, [currentWorkout, activeSession, startWorkoutSession]);

  // Split exercises into blocks intelligently
  const exercises = currentWorkout?.exercises || [];
  
  let warmupExercises: any[] = [];
  let mainExercises: any[] = [];
  let recoveryExercises: any[] = [];
  
  // Smart splitting based on exercise count
  if (exercises.length <= 3) {
    // Too few exercises, put all in main workout
    mainExercises = exercises;
  } else if (exercises.length === 4) {
    // Split: 1 warmup, 2 main, 1 recovery
    warmupExercises = exercises.slice(0, 1);
    mainExercises = exercises.slice(1, 3);
    recoveryExercises = exercises.slice(3);
  } else {
    // Standard split: first 2 for warmup, last 2 for recovery, rest for main
    warmupExercises = exercises.slice(0, 2);
    mainExercises = exercises.slice(2, -2);
    recoveryExercises = exercises.slice(-2);
  }

  const getExercisesForTab = (tab: TabType) => {
    switch (tab) {
      case 'warmup':
        return warmupExercises;
      case 'workout':
        return mainExercises;
      case 'recovery':
        return recoveryExercises;
      default:
        return [];
    }
  };

  const currentExercises = getExercisesForTab(activeTab);
  const completedCount = activeSession?.completedExercises.size || 0;
  const totalCount = exercises.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleExercisePress = (index: number) => {
    setExpandedExercise(expandedExercise === index ? null : index);
    setCurrentSet(0);
    setWeight('');
    setReps('');
  };

  const handleCompleteSet = (exerciseIndex: number) => {
    if (!reps) {
      Alert.alert('Missing Data', 'Please enter reps');
      return;
    }

    const actualIndex = activeTab === 'warmup' ? exerciseIndex : 
                        activeTab === 'workout' ? exerciseIndex + warmupExercises.length :
                        exerciseIndex + warmupExercises.length + mainExercises.length;

    completeSet(
      actualIndex,
      currentSet,
      parseInt(reps),
      weight ? parseFloat(weight) : undefined,
      'Medium'
    );

    const exercise = currentExercises[exerciseIndex];
    if (currentSet < (exercise?.sets || 0) - 1) {
      setCurrentSet(currentSet + 1);
      setWeight('');
      setReps('');
    } else {
      Alert.alert('Exercise Complete!', 'Great work! Ready for the next one?', [
        {
          text: 'Next',
          onPress: () => {
            setExpandedExercise(null);
            setCurrentSet(0);
          },
        },
      ]);
    }
  };

  const handleFinishWorkout = async () => {
    Alert.alert(
      'Finish Workout?',
      'Are you done with your training?',
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Finish',
          onPress: async () => {
            try {
              await finishWorkoutSession();
              console.log('✅ Workout finished successfully');
            } catch (error) {
              console.error('❌ Error finishing workout:', error);
              // Don't show error to user, just log it
            }
            
            // Show celebration regardless
            setShowCelebration(true);
            confettiRef.current?.start();
            
            // Navigate back after celebration
            setTimeout(() => {
              setShowCelebration(false);
              router.replace('/(tabs)');
            }, 3000);
          },
        },
      ]
    );
  };

  const handleExit = () => {
    Alert.alert(
      'Exit Workout?',
      "Your progress won't be saved.",
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  // Safety check: if no workout, show message
  if (!currentWorkout || exercises.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Workout Hub</Text>
          </View>
          <View style={styles.finishButton} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="barbell-outline" size={64} color={COLORS.mediumGray} />
          <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 16 }}>
            No Workout Available
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.mediumGray, marginTop: 8, textAlign: 'center' }}>
            Please select a workout from the Home or Workouts tab to begin.
          </Text>
          <TouchableOpacity 
            style={{ marginTop: 24, backgroundColor: COLORS.lightGray, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
            onPress={() => router.back()}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.gradientStart }}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleExit}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {currentWorkout?.date 
              ? new Date(currentWorkout.date).toLocaleDateString('en-US', { weekday: 'long' })
              : new Date().toLocaleDateString('en-US', { weekday: 'long' })}
          </Text>
          <Text style={styles.headerDate}>
            {currentWorkout?.date 
              ? new Date(currentWorkout.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
              : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity style={styles.finishButton} onPress={handleFinishWorkout}>
          <Text style={styles.finishButtonText}>Finish</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${progressPercentage}%` }]}
          />
        </View>
        <Text style={styles.progressText}>
          {completedCount} of {totalCount} exercises • {Math.round(progressPercentage)}%
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              {isActive ? (
                <LinearGradient
                  colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                  style={styles.tabGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.tabTextActive}>{tab.label}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.tabText}>{tab.label}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Exercise List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.exercisesGrid}>
          {currentExercises.map((exercise, index) => {
            const isExpanded = expandedExercise === index;
            // Calculate actual index in the full exercise list
            const actualIndex = activeTab === 'warmup' ? index : 
                                activeTab === 'workout' ? index + warmupExercises.length :
                                index + warmupExercises.length + mainExercises.length;
            const exerciseSetData = activeSession?.exerciseData.get(actualIndex);
            const completedSets = exerciseSetData?.completedSets || [];

            return (
              <View key={index} style={styles.exerciseContainer}>
                {/* Exercise Box */}
                <TouchableOpacity
                  style={styles.exerciseBox}
                  onPress={() => handleExercisePress(index)}
                  activeOpacity={0.8}
                >
                  <View style={styles.exerciseBoxContent}>
                    <View style={styles.exerciseNumber}>
                      <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseMeta}>
                        {exercise.sets} sets × {exercise.reps} reps
                      </Text>
                    </View>
                    {completedSets.length === exercise.sets && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Expanded Exercise Detail */}
                {isExpanded && (
                  <Modal
                    visible={isExpanded}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={() => setExpandedExercise(null)}
                  >
                    <SafeAreaView style={styles.modalContainer} edges={['top']}>
                      {/* Modal Header */}
                      <View style={styles.modalHeader}>
                        <TouchableOpacity
                          style={styles.modalBackButton}
                          onPress={() => setExpandedExercise(null)}
                        >
                          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{exercise.name}</Text>
                        <View style={styles.modalBackButton} />
                      </View>

                      <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                        {/* Video Player */}
                        {exercise.videoUrl && (
                          <View style={styles.videoContainer}>
                            <ExerciseVideoPlayer
                              videoUrl={exercise.videoUrl}
                              exerciseName={exercise.name}
                              autoPlay={false}
                            />
                          </View>
                        )}

                        {/* Exercise Info */}
                        <View style={styles.exerciseDetailCard}>
                          <Text style={styles.exerciseDetailTitle}>Exercise Details</Text>
                          <View style={styles.exerciseStats}>
                            <View style={styles.statItem}>
                              <Ionicons name="repeat" size={20} color={COLORS.gradientStart} />
                              <Text style={styles.statValue}>{exercise.sets} Sets</Text>
                            </View>
                            <View style={styles.statItem}>
                              <Ionicons name="fitness" size={20} color={COLORS.gradientStart} />
                              <Text style={styles.statValue}>{exercise.reps} Reps</Text>
                            </View>
                            <View style={styles.statItem}>
                              <Ionicons name="timer" size={20} color={COLORS.gradientStart} />
                              <Text style={styles.statValue}>{exercise.restTime}s Rest</Text>
                            </View>
                          </View>
                        </View>

                        {/* Tips Dropdown */}
                        <TouchableOpacity
                          style={styles.tipsCard}
                          onPress={() => setShowTips(!showTips)}
                        >
                          <View style={styles.tipsHeader}>
                            <Ionicons name="bulb" size={22} color={COLORS.gradientStart} />
                            <Text style={styles.tipsTitle}>Form Tips</Text>
                            <Ionicons
                              name={showTips ? 'chevron-up' : 'chevron-down'}
                              size={20}
                              color={COLORS.mediumGray}
                            />
                          </View>
                          {showTips && (
                            <Text style={styles.tipsText}>
                              Keep your core engaged and maintain proper form throughout the movement. 
                              Focus on controlled motion rather than speed.
                            </Text>
                          )}
                        </TouchableOpacity>

                        {/* Set Logging */}
                        <View style={styles.loggingCard}>
                          <Text style={styles.loggingTitle}>
                            Set {currentSet + 1} of {exercise.sets}
                          </Text>

                          <View style={styles.inputRow}>
                            <View style={styles.inputWrapper}>
                              <View style={styles.weightLabelRow}>
                                <Text style={styles.inputLabel}>Weight</Text>
                                <View style={styles.unitSwitcher}>
                                  <TouchableOpacity
                                    style={[styles.unitButton, weightUnit === 'lbs' && styles.unitButtonActive]}
                                    onPress={() => setWeightUnit('lbs')}
                                  >
                                    <Text style={[styles.unitText, weightUnit === 'lbs' && styles.unitTextActive]}>lbs</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[styles.unitButton, weightUnit === 'kg' && styles.unitButtonActive]}
                                    onPress={() => setWeightUnit('kg')}
                                  >
                                    <Text style={[styles.unitText, weightUnit === 'kg' && styles.unitTextActive]}>kg</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                              <TextInput
                                style={styles.input}
                                placeholder="0"
                                keyboardType="numeric"
                                value={weight}
                                onChangeText={setWeight}
                              />
                            </View>
                            <View style={styles.inputWrapper}>
                              <Text style={styles.inputLabel}>Reps</Text>
                              <TextInput
                                style={styles.input}
                                placeholder="0"
                                keyboardType="numeric"
                                value={reps}
                                onChangeText={setReps}
                              />
                            </View>
                          </View>

                          {/* Effort Rating */}
                          <View style={styles.effortSection}>
                            <Text style={styles.inputLabel}>How did it feel?</Text>
                            <View style={styles.ratingRow}>
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <TouchableOpacity
                                  key={rating}
                                  style={[
                                    styles.ratingButton,
                                    effortRating === rating && styles.ratingButtonActive,
                                  ]}
                                  onPress={() => setEffortRating(rating)}
                                >
                                  <Text
                                    style={[
                                      styles.ratingText,
                                      effortRating === rating && styles.ratingTextActive,
                                    ]}
                                  >
                                    {rating}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                            <View style={styles.ratingLabels}>
                              <Text style={styles.ratingLabelText}>Too Easy</Text>
                              <Text style={styles.ratingLabelText}>Perfect</Text>
                              <Text style={styles.ratingLabelText}>Too Hard</Text>
                            </View>
                          </View>

                          {/* Optional Notes */}
                          <View style={styles.notesSection}>
                            <Text style={styles.inputLabel}>Notes (optional)</Text>
                            <TextInput
                              style={styles.notesInput}
                              placeholder="How did this set feel? Any adjustments needed?"
                              multiline
                              numberOfLines={2}
                              value={setNotes}
                              onChangeText={setSetNotes}
                            />
                          </View>

                          <TouchableOpacity
                            style={styles.completeButton}
                            onPress={() => handleCompleteSet(index)}
                          >
                            <LinearGradient
                              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                              style={styles.completeGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                            >
                              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
                              <Text style={styles.completeText}>Complete Set</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>

                        {/* Completed Sets */}
                        {completedSets.length > 0 && (
                          <View style={styles.completedCard}>
                            <Text style={styles.completedTitle}>Completed Sets</Text>
                            {completedSets.map((set, i) => (
                              <View key={i} style={styles.completedSet}>
                                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                                <Text style={styles.completedText}>
                                  Set {set.setIndex + 1}: {set.reps} reps
                                  {set.weight ? ` @ ${set.weight} lbs` : ''}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}

                        <View style={{ height: 40 }} />
                      </ScrollView>
                    </SafeAreaView>
                  </Modal>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Celebration Modal */}
      <Modal
        visible={showCelebration}
        transparent
        animationType="fade"
      >
        <TouchableOpacity 
          style={styles.celebrationOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowCelebration(false);
            router.replace('/(tabs)');
          }}
        >
          {showCelebration && (
            <ConfettiCannon
              count={200}
              origin={{ x: SCREEN_WIDTH / 2, y: -10 }}
              autoStart={true}
              fadeOut
            />
          )}
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Animated.View style={styles.celebrationCard}>
              <TouchableOpacity 
                style={styles.celebrationClose}
                onPress={() => {
                  setShowCelebration(false);
                  router.replace('/(tabs)');
                }}
              >
                <Ionicons name="close-circle" size={32} color={COLORS.white} />
              </TouchableOpacity>
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.celebrationGradient}
            >
              <View style={styles.celebrationIcon}>
                <Ionicons name="trophy" size={64} color={COLORS.white} />
              </View>
              <Text style={styles.celebrationTitle}>Workout Complete! 🎉</Text>
              <Text style={styles.celebrationSubtitle}>
                Amazing work! You crushed it today!
              </Text>
              <View style={styles.celebrationStats}>
                <View style={styles.celebrationStat}>
                  <Text style={styles.celebrationStatValue}>{exercises.length}</Text>
                  <Text style={styles.celebrationStatLabel}>Exercises</Text>
                </View>
                <View style={styles.celebrationStat}>
                  <Text style={styles.celebrationStatValue}>{currentWorkout?.duration || 45}</Text>
                  <Text style={styles.celebrationStatLabel}>Minutes</Text>
                </View>
                <View style={styles.celebrationStat}>
                  <Text style={styles.celebrationStatValue}>{completedCount}</Text>
                  <Text style={styles.celebrationStatLabel}>Completed</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerDate: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  finishButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
  },
  finishButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gradientStart,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  tab: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.lightGray,
  },
  tabActive: {
    backgroundColor: 'transparent',
  },
  tabGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mediumGray,
    paddingVertical: 12,
    textAlign: 'center',
  },
  tabTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  content: {
    flex: 1,
  },
  exercisesGrid: {
    padding: 16,
    gap: 12,
  },
  exerciseContainer: {
    marginBottom: 12,
  },
  exerciseBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.gradientStart,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  exerciseBoxContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exerciseNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.gradientStart}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gradientStart,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  exerciseMeta: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
  },
  videoContainer: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  videoContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.black,
  },
  exerciseDetailCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  exerciseDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  exerciseStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  tipsCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipsTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  tipsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 12,
  },
  loggingCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  loggingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  weightLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  unitSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 2,
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unitButtonActive: {
    backgroundColor: COLORS.gradientStart,
  },
  unitText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  unitTextActive: {
    color: COLORS.white,
  },
  input: {
    height: 50,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    backgroundColor: COLORS.lightGray,
  },
  completeButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  completeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  completeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  completedCard: {
    backgroundColor: `${COLORS.success}10`,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  completedSet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  completedText: {
    fontSize: 14,
    color: COLORS.text,
  },
  // Effort Rating
  effortSection: {
    marginTop: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  ratingButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ratingButtonActive: {
    backgroundColor: COLORS.gradientStart,
    borderColor: COLORS.gradientStart,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.mediumGray,
  },
  ratingTextActive: {
    color: COLORS.white,
  },
  ratingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  ratingLabelText: {
    fontSize: 11,
    color: COLORS.mediumGray,
    fontWeight: '600',
  },
  // Notes Section
  notesSection: {
    marginTop: 16,
  },
  notesInput: {
    marginTop: 8,
    minHeight: 60,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.lightGray,
    textAlignVertical: 'top',
  },
  // Celebration Modal
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  celebrationCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: COLORS.gradientStart,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
    position: 'relative',
  },
  celebrationClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationGradient: {
    padding: 40,
    alignItems: 'center',
  },
  celebrationIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  celebrationTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  celebrationSubtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 32,
  },
  celebrationStats: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  celebrationStat: {
    alignItems: 'center',
  },
  celebrationStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  celebrationStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
