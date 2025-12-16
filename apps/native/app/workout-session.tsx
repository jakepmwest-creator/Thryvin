import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WorkoutVideoPlayer } from '../src/components/ExerciseVideoPlayer';
import { CustomAlert } from '../src/components/CustomAlert';
import { useWorkoutStore } from '../src/stores/workout-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  accent: '#a259ff',
  accentSecondary: '#3a86ff',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  success: '#34C759',
  warning: '#FF9500',
  background: '#FAFAFA',
};

export default function WorkoutSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const { 
    currentWorkout, 
    activeSession, 
    startWorkoutSession, 
    completeSet, 
    addExerciseNote,
    navigateToExercise,
    finishWorkoutSession 
  } = useWorkoutStore();

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [effort, setEffort] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [note, setNote] = useState('');
  const [sessionStartTime] = useState(new Date());
  
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

  useEffect(() => {
    if (currentWorkout && !activeSession) {
      startWorkoutSession(currentWorkout.id);
    }
  }, [currentWorkout]);

  if (!currentWorkout) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading your workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const exercises = currentWorkout.exercises || [];
  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;
  const isLastExercise = currentExerciseIndex === totalExercises - 1;
  const exerciseData = activeSession?.exerciseData.get(currentExerciseIndex);
  const completedSets = exerciseData?.completedSets || [];
  const isExerciseComplete = completedSets.length >= (currentExercise?.sets || 0);

  const handleCompleteSet = () => {
    if (!reps || parseInt(reps) === 0) {
      showAlert('warning', 'Missing Data', 'Please enter the reps you completed');
      return;
    }

    const repsNum = parseInt(reps);
    const weightNum = weight ? parseFloat(weight) : undefined;

    completeSet(currentExerciseIndex, currentSetIndex, repsNum, weightNum, effort);

    // Move to next set
    if (currentSetIndex < (currentExercise?.sets || 0) - 1) {
      setCurrentSetIndex(currentSetIndex + 1);
      setWeight('');
      setReps('');
    } else {
      // Exercise complete
      showAlert('success', 'Exercise Complete! 💪', `Great work on ${currentExercise?.name}!`, [
        { text: 'Next Exercise', onPress: handleNextExercise },
      ]);
    }
  };

  const handleNextExercise = () => {
    if (isLastExercise) {
      handleFinishWorkout();
    } else {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(0);
      setWeight('');
      setReps('');
      setEffort('Medium');
      setNote('');
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      setCurrentSetIndex(0);
      setWeight('');
      setReps('');
    }
  };

  const handleSaveNote = () => {
    if (note.trim()) {
      addExerciseNote(currentExerciseIndex, note);
      showAlert('success', 'Note Saved', 'Your note has been saved');
    }
  };

  const handleFinishWorkout = async () => {
    const sessionDuration = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 60000);
    
    showAlert('info', 'Finish Workout?', `You've been training for ${sessionDuration} minutes. Ready to wrap up?`, [
      { text: 'Keep Going', style: 'cancel' },
      {
        text: 'Finish Workout',
        onPress: async () => {
          try {
            await finishWorkoutSession();
            router.replace('/(tabs)');
            
            setTimeout(() => {
              showAlert('success', 'Workout Complete! 🎉', `Awesome job! You completed ${totalExercises} exercises in ${sessionDuration} minutes.`);
            }, 500);
          } catch (error) {
            showAlert('error', 'Error', 'Failed to save workout. Please try again.');
          }
        },
      },
    ]);
  };

  const handleExit = () => {
    showAlert('warning', 'Exit Workout?', "Your progress won't be saved if you leave now.", [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Exit',
        style: 'destructive',
        onPress: () => router.back(),
      },
    ]);
  };

  if (!currentExercise) {
    return null;
  }

  const progress = ((currentExerciseIndex + 1) / totalExercises) * 100;

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
        <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.workoutTitle}>{currentWorkout.title}</Text>
          <Text style={styles.exerciseCounter}>
            Exercise {currentExerciseIndex + 1} of {totalExercises}
          </Text>
        </View>
        <View style={styles.exitButton} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${progress}%` }]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}% Complete</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Exercise Name & Block */}
        <View style={styles.exerciseHeader}>
          <View style={styles.blockBadge}>
            <Text style={styles.blockBadgeText}>Main Workout</Text>
          </View>
          <Text style={styles.exerciseName}>{currentExercise.name}</Text>
          <Text style={styles.targetMuscles}>
            Target: {currentWorkout.targetMuscles || 'Full Body'}
          </Text>
        </View>

        {/* Video Player - Auto-plays 3x then stops */}
        {currentExercise.videoUrl ? (
          <View style={styles.videoContainer}>
            <WorkoutVideoPlayer
              videoUrl={currentExercise.videoUrl}
              exerciseName={currentExercise.name}
              isVisible={true}
            />
          </View>
        ) : (
          <View style={styles.noVideoContainer}>
            <Ionicons name="videocam-off" size={48} color={COLORS.mediumGray} />
            <Text style={styles.noVideoText}>Video not available</Text>
          </View>
        )}

        {/* Exercise Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="repeat" size={20} color={COLORS.accent} />
              <Text style={styles.infoValue}>{currentExercise.sets}</Text>
              <Text style={styles.infoLabel}>Sets</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="fitness" size={20} color={COLORS.accent} />
              <Text style={styles.infoValue}>{currentExercise.reps}</Text>
              <Text style={styles.infoLabel}>Reps</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="timer" size={20} color={COLORS.accent} />
              <Text style={styles.infoValue}>{currentExercise.restTime}s</Text>
              <Text style={styles.infoLabel}>Rest</Text>
            </View>
          </View>
        </View>

        {/* Current Set Tracker */}
        <View style={styles.setTrackerCard}>
          <View style={styles.setTrackerHeader}>
            <Text style={styles.setTrackerTitle}>
              Set {currentSetIndex + 1} of {currentExercise.sets}
            </Text>
            <View style={styles.setDots}>
              {Array.from({ length: currentExercise.sets }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.setDot,
                    completedSets.some(s => s.setIndex === i) && styles.setDotComplete,
                    i === currentSetIndex && styles.setDotActive,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Input Fields with AI Suggestions */}
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Weight (lbs)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={COLORS.mediumGray}
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
              />
              {/* Weight suggestion hint */}
              <View style={styles.suggestionHint}>
                <Ionicons name="sparkles" size={12} color={COLORS.accent} />
                <Text style={styles.suggestionText}>
                  {completedSets.length > 0 && completedSets[completedSets.length - 1]?.weight
                    ? `Last: ${completedSets[completedSets.length - 1].weight}lbs`
                    : 'Start with a comfortable weight'}
                </Text>
              </View>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Reps</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={COLORS.mediumGray}
                keyboardType="numeric"
                value={reps}
                onChangeText={setReps}
              />
              {/* Reps suggestion hint */}
              <View style={styles.suggestionHint}>
                <Ionicons name="fitness" size={12} color={COLORS.accent} />
                <Text style={styles.suggestionText}>
                  Target: {currentExercise?.reps || '8-12'} reps
                </Text>
              </View>
            </View>
          </View>

          {/* Effort Selector */}
          <View style={styles.effortContainer}>
            <Text style={styles.effortLabel}>How did it feel?</Text>
            <View style={styles.effortButtons}>
              {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.effortButton,
                    effort === level && styles.effortButtonActive,
                  ]}
                  onPress={() => setEffort(level)}
                >
                  <Text
                    style={[
                      styles.effortButtonText,
                      effort === level && styles.effortButtonTextActive,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Complete Set Button */}
          <TouchableOpacity
            style={styles.completeSetButton}
            onPress={handleCompleteSet}
          >
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={styles.completeSetGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
              <Text style={styles.completeSetText}>Complete Set</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Notes Section */}
        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>Exercise Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="How did this feel? Any adjustments for next time?"
            placeholderTextColor={COLORS.mediumGray}
            multiline
            numberOfLines={3}
            value={note}
            onChangeText={setNote}
          />
          {note.trim() && (
            <TouchableOpacity style={styles.saveNoteButton} onPress={handleSaveNote}>
              <Text style={styles.saveNoteText}>Save Note</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Completed Sets Summary */}
        {completedSets.length > 0 && (
          <View style={styles.completedSetsCard}>
            <Text style={styles.completedSetsTitle}>Completed Sets</Text>
            {completedSets.map((set, index) => (
              <View key={index} style={styles.completedSetRow}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.completedSetText}>
                  Set {set.setIndex + 1}: {set.reps} reps
                  {set.weight ? ` @ ${set.weight} lbs` : ''} • {set.effort}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Navigation Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, currentExerciseIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePreviousExercise}
          disabled={currentExerciseIndex === 0}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={currentExerciseIndex === 0 ? COLORS.mediumGray : COLORS.accent}
          />
          <Text
            style={[
              styles.navButtonText,
              currentExerciseIndex === 0 && styles.navButtonTextDisabled,
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
              {isLastExercise ? 'Finish Workout' : 'Next Exercise'}
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
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.white,
  },
  exitButton: {
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
    marginBottom: 6,
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  exerciseHeader: {
    marginBottom: 16,
  },
  blockBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${COLORS.accent}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  blockBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
  },
  exerciseName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  targetMuscles: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  videoContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  noVideoContainer: {
    height: 200,
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noVideoText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  setTrackerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  setTrackerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  setTrackerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  setDots: {
    flexDirection: 'row',
    gap: 6,
  },
  setDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.lightGray,
  },
  setDotComplete: {
    backgroundColor: COLORS.success,
  },
  setDotActive: {
    backgroundColor: COLORS.accent,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
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
  suggestionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  suggestionText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '500',
  },
  effortContainer: {
    marginBottom: 20,
  },
  effortLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  effortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  effortButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  effortButtonActive: {
    backgroundColor: `${COLORS.accent}20`,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  effortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  effortButtonTextActive: {
    color: COLORS.accent,
  },
  completeSetButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  completeSetGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  completeSetText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  notesCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  notesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  notesInput: {
    height: 80,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.lightGray,
    textAlignVertical: 'top',
  },
  saveNoteButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: `${COLORS.accent}15`,
    borderRadius: 8,
  },
  saveNoteText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
  },
  completedSetsCard: {
    backgroundColor: `${COLORS.success}10`,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  completedSetsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  completedSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  completedSetText: {
    fontSize: 14,
    color: COLORS.text,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
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
    borderRadius: 14,
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
