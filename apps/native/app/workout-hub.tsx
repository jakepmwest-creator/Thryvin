import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ExerciseVideoPlayer } from '../src/components/ExerciseVideoPlayer';
import { VoiceInputButton } from '../src/components/VoiceInputButton';
import { CustomAlert } from '../src/components/CustomAlert';
import { useWorkoutStore } from '../src/stores/workout-store';
import { setStorageItem } from '../src/lib/storage';
import { COLORS } from '../src/constants/colors';
import ConfettiCannon from 'react-native-confetti-cannon';

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
  const [setNotes, setSetNotes] = useState('');
  const [showTips, setShowTips] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');
  // New state for different workout types
  const [duration, setDuration] = useState(''); // For cardio/yoga - time in minutes
  const [distance, setDistance] = useState(''); // For cardio - distance
  const [distanceUnit, setDistanceUnit] = useState<'mi' | 'km'>('mi');
  const [holdTime, setHoldTime] = useState(''); // For yoga - hold duration in seconds
  
  // Workout timer state
  const [workoutStartTime, setWorkoutStartTime] = useState<number>(Date.now());
  const [workoutElapsedSeconds, setWorkoutElapsedSeconds] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [pausedAtSeconds, setPausedAtSeconds] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // CustomAlert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });
  
  const showAlert = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>
  ) => {
    setAlertConfig({ visible: true, type, title, message, buttons });
  };
  
  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };
  
  const scrollX = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef<any>(null);

  // Determine exercise type based on name, category, or type
  const getExerciseType = (exercise: any): 'strength' | 'cardio' | 'yoga' | 'hiit' | 'stretching' => {
    const name = (exercise.name || '').toLowerCase();
    const category = (exercise.category || '').toLowerCase();
    const type = (exercise.type || '').toLowerCase();
    
    // Cardio exercises
    const cardioKeywords = ['run', 'jog', 'sprint', 'cycling', 'bike', 'swim', 'rowing', 'elliptical', 'treadmill', 'walk', 'stair', 'jump rope', 'skipping'];
    if (cardioKeywords.some(k => name.includes(k) || category.includes(k) || type.includes(k))) {
      return 'cardio';
    }
    
    // Yoga and flexibility exercises
    const yogaKeywords = ['yoga', 'pose', 'asana', 'flow', 'meditation', 'breathing', 'pranayama', 'sun salutation', 'warrior', 'downward dog', 'child\'s pose', 'cobra', 'pigeon'];
    if (yogaKeywords.some(k => name.includes(k) || category.includes(k) || type.includes('yoga'))) {
      return 'yoga';
    }
    
    // Stretching exercises
    const stretchKeywords = ['stretch', 'mobility', 'flexibility', 'foam roll', 'hold', 'static'];
    if (stretchKeywords.some(k => name.includes(k) || category.includes(k) || category.includes('cooldown') || category.includes('recovery'))) {
      return 'stretching';
    }
    
    // HIIT exercises
    const hiitKeywords = ['burpee', 'mountain climber', 'jumping jack', 'high knee', 'box jump', 'battle rope', 'kettle swing'];
    if (hiitKeywords.some(k => name.includes(k)) || type.includes('hiit') || type.includes('circuit')) {
      return 'hiit';
    }
    
    // Default to strength for weight training
    return 'strength';
  };

  // Get contextual tips based on exercise type
  const getExerciseTips = (exercise: any, exerciseType: string): string => {
    const tips: Record<string, string> = {
      cardio: `🏃 Focus on maintaining a steady pace. Keep your breathing rhythmic - try breathing in for 3 steps, out for 2. Stay hydrated and choose routes with good surfaces. If outdoors, vary your terrain for better training.`,
      yoga: `🧘 Move slowly and mindfully into each pose. Never force a stretch - breathe into tight areas. Hold each position for the full duration, focusing on your breath. Modify poses as needed for your body.`,
      stretching: `🤸 Breathe deeply and relax into the stretch. Don't bounce - hold steady. You should feel tension, not pain. Hold for the full duration to allow your muscles to release.`,
      hiit: `⚡ Give maximum effort during work intervals! Rest fully during breaks. Focus on form even when tired. Keep your core engaged throughout. Push through the burn!`,
      strength: `💪 Keep your core engaged and maintain proper form throughout. Focus on controlled motion - 2 seconds up, 3 seconds down. Breathe out on exertion. Don't sacrifice form for heavier weight.`,
    };
    return tips[exerciseType] || tips.strength;
  };

  // Handle voice transcription for notes
  const handleVoiceTranscription = (text: string) => {
    setSetNotes(prev => prev ? `${prev} ${text}` : text);
  };

  // Start workout session when component mounts
  useEffect(() => {
    if (currentWorkout && !activeSession) {
      startWorkoutSession(currentWorkout.id);
    }
  }, [currentWorkout, activeSession, startWorkoutSession]);
  
  // Workout timer effect
  useEffect(() => {
    if (!timerPaused) {
      timerIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - workoutStartTime) / 1000) + pausedAtSeconds;
        setWorkoutElapsedSeconds(elapsed);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerPaused, workoutStartTime, pausedAtSeconds]);
  
  // Format timer display (MM:SS)
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Toggle pause/resume
  const togglePause = () => {
    if (timerPaused) {
      // Resume
      setWorkoutStartTime(Date.now());
      setTimerPaused(false);
    } else {
      // Pause
      setPausedAtSeconds(workoutElapsedSeconds);
      setTimerPaused(true);
    }
  };

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
    setDuration('');
    setDistance('');
    setHoldTime('');
    setSetNotes('');
  };

  const handleCompleteSet = (exerciseIndex: number, exercise: any) => {
    const exerciseType = getExerciseType(exercise);
    
    // Validate based on exercise type
    if (exerciseType === 'strength' || exerciseType === 'hiit') {
      if (!reps) {
        showAlert('warning', 'Missing Data', 'Please enter reps');
        return;
      }
    } else if (exerciseType === 'cardio') {
      if (!duration) {
        showAlert('warning', 'Missing Data', 'Please enter time/duration');
        return;
      }
    } else if (exerciseType === 'yoga' || exerciseType === 'stretching') {
      if (!holdTime && !reps) {
        showAlert('warning', 'Missing Data', 'Please enter hold time or reps');
        return;
      }
    }

    const actualIndex = activeTab === 'warmup' ? exerciseIndex : 
                        activeTab === 'workout' ? exerciseIndex + warmupExercises.length :
                        exerciseIndex + warmupExercises.length + mainExercises.length;

    // Build performance data based on exercise type
    let performanceValue = 0;
    let performanceWeight: number | undefined = undefined;
    
    if (exerciseType === 'cardio') {
      performanceValue = parseInt(duration) || 0; // Store duration as main value
      performanceWeight = distance ? parseFloat(distance) : undefined; // Store distance as secondary
    } else if (exerciseType === 'yoga' || exerciseType === 'stretching') {
      performanceValue = holdTime ? parseInt(holdTime) : (parseInt(reps) || 0);
    } else {
      performanceValue = parseInt(reps) || 0;
      performanceWeight = weight ? parseFloat(weight) : undefined;
    }

    completeSet(
      actualIndex,
      currentSet,
      performanceValue,
      performanceWeight,
      'Medium'
    );

    if (currentSet < (exercise?.sets || 1) - 1) {
      setCurrentSet(currentSet + 1);
      setWeight('');
      setReps('');
      setDuration('');
      setDistance('');
      setHoldTime('');
    } else {
      showAlert('success', 'Exercise Complete!', 'Great work! Ready for the next one?', [
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
    // Pause the timer first
    if (!timerPaused) {
      setPausedAtSeconds(workoutElapsedSeconds);
      setTimerPaused(true);
    }
    
    showAlert('success', 'Finish Workout?', `Great effort! \ud83d\udcaa\n\nYou worked out for ${formatTimer(workoutElapsedSeconds)}.\n\nAre you sure you want to finish?`, [
      { text: 'Not Yet', style: 'cancel', onPress: () => {
        // Resume timer if they continue
        if (timerPaused) {
          setWorkoutStartTime(Date.now());
          setTimerPaused(false);
        }
      }},
      {
        text: 'Finish',
        onPress: async () => {
          try {
            // Save actual workout duration (in minutes)
            const actualDurationMinutes = Math.ceil(workoutElapsedSeconds / 60);
            await finishWorkoutSession(actualDurationMinutes);
            console.log(`✅ Workout finished successfully - Duration: ${actualDurationMinutes} minutes`);
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
    ]);
  };

  const handleExit = () => {
    // Check if any exercises have been completed
    const hasProgress = activeSession && activeSession.completedExercises.size > 0;
    
    if (hasProgress) {
      showAlert('info', 'Save Your Progress?', `You've completed ${activeSession.completedExercises.size} exercise(s).\n\nWould you like to save your progress?`, [
        { text: 'Exit Without Saving', style: 'destructive', onPress: () => router.back() },
        { text: 'Save Progress', onPress: async () => {
          // Save the session but don't mark workout as complete
          try {
            // Just save the activeSession to storage for later
            await setStorageItem('saved_workout_session', JSON.stringify({
              workoutId: currentWorkout?.id,
              session: {
                ...activeSession,
                completedExercises: Array.from(activeSession.completedExercises),
                exerciseData: Array.from(activeSession.exerciseData.entries()),
              },
              savedAt: new Date().toISOString(),
            }));
            console.log('✅ Progress saved');
          } catch (error) {
            console.error('Error saving progress:', error);
          }
          router.back();
        }},
      ]);
    } else {
      showAlert('warning', 'Exit Workout?', "You haven't completed any exercises yet.", [
        { text: 'Stay', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => router.back() },
      ]);
    }
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
      
      {/* Workout Timer */}
      <View style={styles.timerContainer}>
        <View style={styles.timerContent}>
          <Ionicons name="time-outline" size={20} color={COLORS.gradientStart} />
          <Text style={styles.timerText}>{formatTimer(workoutElapsedSeconds)}</Text>
          <TouchableOpacity 
            style={styles.pauseButton}
            onPress={togglePause}
          >
            <Ionicons 
              name={timerPaused ? "play" : "pause"} 
              size={16} 
              color={COLORS.mediumGray} 
            />
          </TouchableOpacity>
        </View>
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
                        {(() => {
                          const exType = getExerciseType(exercise);
                          if (exType === 'cardio') {
                            return exercise.duration ? `${exercise.duration} min` : `${exercise.sets} rounds`;
                          } else if (exType === 'yoga' || exType === 'stretching') {
                            return exercise.duration ? `Hold ${exercise.duration}s` : `${exercise.reps}`;
                          } else {
                            return `${exercise.sets} sets × ${exercise.reps}`;
                          }
                        })()}
                      </Text>
                    </View>
                    {completedSets.length >= (exercise.sets || 1) && (
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

                        {/* Exercise Info - Adaptive based on type */}
                        {(() => {
                          const exType = getExerciseType(exercise);
                          return (
                            <View style={styles.exerciseDetailCard}>
                              <View style={styles.exerciseTypeTag}>
                                <Text style={styles.exerciseTypeText}>
                                  {exType === 'cardio' ? '🏃 Cardio' : 
                                   exType === 'yoga' ? '🧘 Yoga' : 
                                   exType === 'stretching' ? '🤸 Stretching' :
                                   exType === 'hiit' ? '⚡ HIIT' : '💪 Strength'}
                                </Text>
                              </View>
                              <Text style={styles.exerciseDetailTitle}>Exercise Details</Text>
                              <View style={styles.exerciseStats}>
                                {exType === 'cardio' ? (
                                  <>
                                    <View style={styles.statItem}>
                                      <Ionicons name="time" size={20} color={COLORS.gradientStart} />
                                      <Text style={styles.statValue}>{exercise.duration || exercise.reps}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                      <Ionicons name="navigate" size={20} color={COLORS.gradientStart} />
                                      <Text style={styles.statValue}>Track Distance</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                      <Ionicons name="speedometer" size={20} color={COLORS.gradientStart} />
                                      <Text style={styles.statValue}>Track Pace</Text>
                                    </View>
                                  </>
                                ) : exType === 'yoga' || exType === 'stretching' ? (
                                  <>
                                    <View style={styles.statItem}>
                                      <Ionicons name="hourglass" size={20} color={COLORS.gradientStart} />
                                      <Text style={styles.statValue}>Hold {exercise.duration || exercise.reps}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                      <Ionicons name="repeat" size={20} color={COLORS.gradientStart} />
                                      <Text style={styles.statValue}>{exercise.sets || 1} Round{(exercise.sets || 1) > 1 ? 's' : ''}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                      <Ionicons name="leaf" size={20} color={COLORS.gradientStart} />
                                      <Text style={styles.statValue}>Breathe Deep</Text>
                                    </View>
                                  </>
                                ) : (
                                  <>
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
                                  </>
                                )}
                              </View>
                            </View>
                          );
                        })()}

                        {/* Tips Dropdown - Contextual based on exercise type */}
                        <TouchableOpacity
                          style={styles.tipsCard}
                          onPress={() => setShowTips(!showTips)}
                        >
                          <View style={styles.tipsHeader}>
                            <Ionicons name="bulb" size={22} color={COLORS.gradientStart} />
                            <Text style={styles.tipsTitle}>
                              {getExerciseType(exercise) === 'cardio' ? 'Running Tips' :
                               getExerciseType(exercise) === 'yoga' ? 'Pose Tips' :
                               getExerciseType(exercise) === 'stretching' ? 'Stretch Tips' : 'Form Tips'}
                            </Text>
                            <Ionicons
                              name={showTips ? 'chevron-up' : 'chevron-down'}
                              size={20}
                              color={COLORS.mediumGray}
                            />
                          </View>
                          {showTips && (
                            <Text style={styles.tipsText}>
                              {getExerciseTips(exercise, getExerciseType(exercise))}
                            </Text>
                          )}
                        </TouchableOpacity>

                        {/* Set Logging - Adaptive based on exercise type */}
                        {(() => {
                          const exType = getExerciseType(exercise);
                          
                          return (
                            <View style={styles.loggingCard}>
                              <Text style={styles.loggingTitle}>
                                {exType === 'cardio' ? 'Log Your Session' :
                                 exType === 'yoga' || exType === 'stretching' ? `Round ${currentSet + 1} of ${exercise.sets || 1}` :
                                 `Set ${currentSet + 1} of ${exercise.sets}`}
                              </Text>

                              {/* CARDIO INPUTS: Time + Distance */}
                              {exType === 'cardio' && (
                                <View style={styles.inputRow}>
                                  <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>Time (min)</Text>
                                    <TextInput
                                      style={styles.input}
                                      placeholder="0"
                                      placeholderTextColor={COLORS.mediumGray}
                                      keyboardType="numeric"
                                      value={duration}
                                      onChangeText={setDuration}
                                    />
                                  </View>
                                  <View style={styles.inputWrapper}>
                                    <View style={styles.weightLabelRow}>
                                      <Text style={styles.inputLabel}>Distance</Text>
                                      <View style={styles.unitSwitcher}>
                                        <TouchableOpacity
                                          style={styles.unitButtonWrapper}
                                          onPress={() => setDistanceUnit('mi')}
                                        >
                                          {distanceUnit === 'mi' ? (
                                            <LinearGradient
                                              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                                              style={styles.unitButtonGradient}
                                              start={{ x: 0, y: 0 }}
                                              end={{ x: 1, y: 1 }}
                                            >
                                              <Text style={styles.unitTextActive}>mi</Text>
                                            </LinearGradient>
                                          ) : (
                                            <View style={styles.unitButtonInactive}>
                                              <Text style={styles.unitText}>mi</Text>
                                            </View>
                                          )}
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                          style={styles.unitButtonWrapper}
                                          onPress={() => setDistanceUnit('km')}
                                        >
                                          {distanceUnit === 'km' ? (
                                            <LinearGradient
                                              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                                              style={styles.unitButtonGradient}
                                              start={{ x: 0, y: 0 }}
                                              end={{ x: 1, y: 1 }}
                                            >
                                              <Text style={styles.unitTextActive}>km</Text>
                                            </LinearGradient>
                                          ) : (
                                            <View style={styles.unitButtonInactive}>
                                              <Text style={styles.unitText}>km</Text>
                                            </View>
                                          )}
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                    <TextInput
                                      style={styles.input}
                                      placeholder="0.0"
                                      placeholderTextColor={COLORS.mediumGray}
                                      keyboardType="decimal-pad"
                                      value={distance}
                                      onChangeText={setDistance}
                                    />
                                  </View>
                                </View>
                              )}

                              {/* YOGA/STRETCHING INPUTS: Hold Time or Reps */}
                              {(exType === 'yoga' || exType === 'stretching') && (
                                <View style={styles.inputRow}>
                                  <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>Hold Time (sec)</Text>
                                    <TextInput
                                      style={styles.input}
                                      placeholder={exercise.duration || '60'}
                                      placeholderTextColor={COLORS.mediumGray}
                                      keyboardType="numeric"
                                      value={holdTime}
                                      onChangeText={setHoldTime}
                                    />
                                  </View>
                                  <View style={styles.inputWrapper}>
                                    <Text style={styles.inputLabel}>Breaths</Text>
                                    <TextInput
                                      style={styles.input}
                                      placeholder="5"
                                      placeholderTextColor={COLORS.mediumGray}
                                      keyboardType="numeric"
                                      value={reps}
                                      onChangeText={setReps}
                                    />
                                  </View>
                                </View>
                              )}

                              {/* STRENGTH/HIIT INPUTS: Weight + Reps */}
                              {(exType === 'strength' || exType === 'hiit') && (
                                <View style={styles.inputRow}>
                                  <View style={styles.inputWrapper}>
                                    <View style={styles.weightLabelRow}>
                                      <Text style={styles.inputLabel}>Weight</Text>
                                      <View style={styles.unitSwitcher}>
                                        <TouchableOpacity
                                          style={styles.unitButtonWrapper}
                                          onPress={() => setWeightUnit('lbs')}
                                        >
                                          {weightUnit === 'lbs' ? (
                                            <LinearGradient
                                              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                                              style={styles.unitButtonGradient}
                                              start={{ x: 0, y: 0 }}
                                              end={{ x: 1, y: 1 }}
                                            >
                                              <Text style={styles.unitTextActive}>lbs</Text>
                                            </LinearGradient>
                                          ) : (
                                            <View style={styles.unitButtonInactive}>
                                              <Text style={styles.unitText}>lbs</Text>
                                            </View>
                                          )}
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                          style={styles.unitButtonWrapper}
                                          onPress={() => setWeightUnit('kg')}
                                        >
                                          {weightUnit === 'kg' ? (
                                            <LinearGradient
                                              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                                              style={styles.unitButtonGradient}
                                              start={{ x: 0, y: 0 }}
                                              end={{ x: 1, y: 1 }}
                                            >
                                              <Text style={styles.unitTextActive}>kg</Text>
                                            </LinearGradient>
                                          ) : (
                                            <View style={styles.unitButtonInactive}>
                                              <Text style={styles.unitText}>kg</Text>
                                            </View>
                                          )}
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                    <TextInput
                                      style={styles.input}
                                      placeholder="0"
                                      placeholderTextColor={COLORS.mediumGray}
                                      keyboardType="numeric"
                                      value={weight}
                                      onChangeText={setWeight}
                                    />
                                  </View>
                                  <View style={styles.inputWrapper}>
                                    <View style={styles.repsLabelRow}>
                                      <Text style={styles.inputLabel}>Reps</Text>
                                    </View>
                                    <TextInput
                                      style={styles.input}
                                      placeholder="0"
                                      placeholderTextColor={COLORS.mediumGray}
                                      keyboardType="numeric"
                                      value={reps}
                                      onChangeText={setReps}
                                    />
                                  </View>
                                </View>
                              )}

                              {/* Optional Notes with Voice Input - for all types */}
                              <View style={styles.notesSection}>
                                <View style={styles.notesHeader}>
                                  <Text style={styles.inputLabel}>
                                    {exType === 'cardio' ? 'How was your run?' :
                                     exType === 'yoga' ? 'How did you feel?' : 'Notes (optional)'}
                                  </Text>
                                  <VoiceInputButton
                                    onTranscription={handleVoiceTranscription}
                                    size="small"
                                  />
                                </View>
                                <TextInput
                                  style={styles.notesInput}
                                  placeholder={
                                    exType === 'cardio' ? "Rate the route, how you felt, any pain..." :
                                    exType === 'yoga' ? "Was it easy to hold? Any tight areas?" :
                                    "How did this set feel? Tap Voice to speak..."
                                  }
                                  placeholderTextColor={COLORS.mediumGray}
                                  multiline
                                  numberOfLines={2}
                                  value={setNotes}
                                  onChangeText={setSetNotes}
                                />
                              </View>

                              <TouchableOpacity
                                style={styles.completeButton}
                                onPress={() => handleCompleteSet(index, exercise)}
                              >
                                <LinearGradient
                                  colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                                  style={styles.completeGradient}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 1 }}
                                >
                                  <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
                                  <Text style={styles.completeText}>
                                    {exType === 'cardio' ? 'Log Session' :
                                     exType === 'yoga' || exType === 'stretching' ? 'Complete Round' : 'Complete Set'}
                                  </Text>
                                </LinearGradient>
                              </TouchableOpacity>
                            </View>
                          );
                        })()}

                        {/* Completed Sets - Adaptive display */}
                        {completedSets.length > 0 && (
                          <View style={styles.completedCard}>
                            <Text style={styles.completedTitle}>
                              {getExerciseType(exercise) === 'cardio' ? 'Session Logged' : 'Completed'}
                            </Text>
                            {completedSets.map((set, i) => {
                              const exType = getExerciseType(exercise);
                              return (
                                <View key={i} style={styles.completedSet}>
                                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                                  <Text style={styles.completedText}>
                                    {exType === 'cardio' 
                                      ? `${set.reps} min${set.weight ? ` • ${set.weight} ${distanceUnit}` : ''}`
                                      : exType === 'yoga' || exType === 'stretching'
                                        ? `Round ${set.setIndex + 1}: ${set.reps}s held`
                                        : `Set ${set.setIndex + 1}: ${set.reps} reps${set.weight ? ` @ ${set.weight} ${weightUnit}` : ''}`
                                    }
                                  </Text>
                                </View>
                              );
                            })}
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
      
      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
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
  timerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  timerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 1,
  },
  pauseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000000',
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
  exerciseTypeTag: {
    alignSelf: 'flex-start',
    backgroundColor: `${COLORS.gradientStart}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  exerciseTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gradientStart,
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
  },
  weightLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 28,
    marginBottom: 8,
  },
  repsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    marginBottom: 8,
  },
  unitSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  unitButtonWrapper: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  unitButtonGradient: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unitButtonInactive: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  unitText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  unitTextActive: {
    fontSize: 11,
    fontWeight: '600',
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
  ratingLabelText: {
    fontSize: 11,
    color: COLORS.mediumGray,
    fontWeight: '600',
  },
  // Notes Section with Voice
  notesSection: {
    marginTop: 16,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesInput: {
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
