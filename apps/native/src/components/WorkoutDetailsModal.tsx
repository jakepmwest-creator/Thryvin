import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  PanResponder,
  Animated,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseVideoPlayer } from './ExerciseVideoPlayer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  accent: '#a259ff',
  accentSecondary: '#3a86ff',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  shadow: 'rgba(162, 89, 255, 0.1)',
  success: '#34C759',
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const createExercise = (name: string, sets: number, reps: string, rest: string) => ({
  name,
  sets,
  reps,
  rest,
});

const WORKOUT_DATA: Record<string, any> = {
  Monday: {
    title: 'Upper Body Push',
    date: 'Monday, Oct 21',
    duration: '45 min',
    exercises: 8,
    difficulty: 'Intermediate',
    caloriesBurn: 420,
    targetMuscles: 'Chest, Shoulders, Triceps',
    overview: 'Progressive overload focused session targeting the pushing muscles. Start with compound movements and finish with isolation work.',
    exerciseList: [
      createExercise('Bench Press', 4, '8-10', '2 min'),
      createExercise('Incline Dumbbell Press', 3, '10-12', '90 sec'),
      createExercise('Overhead Press', 4, '6-8', '2 min'),
      createExercise('Lateral Raises', 3, '12-15', '60 sec'),
      createExercise('Tricep Dips', 3, '10-12', '90 sec'),
      createExercise('Cable Flyes', 3, '12-15', '60 sec'),
      createExercise('Tricep Pushdowns', 3, '12-15', '60 sec'),
      createExercise('Face Pulls', 3, '15-20', '60 sec'),
    ],
  },
  Tuesday: {
    title: 'Lower Body Power',
    date: 'Tuesday, Oct 22',
    duration: '50 min',
    exercises: 7,
    difficulty: 'Advanced',
    caloriesBurn: 480,
    targetMuscles: 'Quads, Glutes, Hamstrings',
    overview: 'Heavy compound leg movements focusing on building strength and power in the lower body.',
    exerciseList: [
      createExercise('Squats', 5, '5-8', '3 min'),
      createExercise('Romanian Deadlifts', 4, '8-10', '2 min'),
      createExercise('Leg Press', 3, '10-12', '90 sec'),
      createExercise('Walking Lunges', 3, '12 each', '90 sec'),
      createExercise('Leg Curls', 3, '12-15', '60 sec'),
      createExercise('Calf Raises', 4, '15-20', '60 sec'),
      createExercise('Core Planks', 3, '60 sec', '60 sec'),
    ],
  },
  Wednesday: {
    title: 'Upper Body Pull',
    date: 'Wednesday, Oct 23',
    duration: '45 min',
    exercises: 8,
    difficulty: 'Intermediate',
    caloriesBurn: 400,
    targetMuscles: 'Back, Biceps, Rear Delts',
    overview: 'Pull-focused workout targeting back thickness and width with bicep isolation.',
    exerciseList: [
      createExercise('Pull-ups', 4, '8-12', '2 min'),
      createExercise('Barbell Rows', 4, '8-10', '2 min'),
      createExercise('Lat Pulldowns', 3, '10-12', '90 sec'),
      createExercise('Face Pulls', 3, '15-20', '60 sec'),
      createExercise('Barbell Curls', 3, '10-12', '90 sec'),
      createExercise('Hammer Curls', 3, '12-15', '60 sec'),
      createExercise('Cable Curls', 3, '12-15', '60 sec'),
      createExercise('Shrugs', 3, '12-15', '60 sec'),
    ],
  },
  Thursday: {
    title: 'Active Recovery',
    date: 'Thursday, Oct 24',
    duration: '30 min',
    exercises: 5,
    difficulty: 'Beginner',
    caloriesBurn: 200,
    targetMuscles: 'Full Body Mobility',
    overview: 'Light mobility work and stretching to promote recovery and reduce soreness.',
    exerciseList: [
      createExercise('Dynamic Stretching', 1, '10 min', 'None'),
      createExercise('Foam Rolling', 1, '10 min', 'None'),
      createExercise('Yoga Flow', 1, '10 min', 'None'),
      createExercise('Light Cardio', 1, '15 min', 'None'),
      createExercise('Cool Down Stretch', 1, '5 min', 'None'),
    ],
  },
  Friday: {
    title: 'Full Body Strength',
    date: 'Friday, Oct 25',
    duration: '55 min',
    exercises: 9,
    difficulty: 'Advanced',
    caloriesBurn: 500,
    targetMuscles: 'Full Body',
    overview: 'Complete full-body workout hitting all major muscle groups with compound movements.',
    exerciseList: [
      createExercise('Deadlifts', 4, '5-8', '3 min'),
      createExercise('Bench Press', 4, '8-10', '2 min'),
      createExercise('Squats', 4, '8-10', '2 min'),
      createExercise('Overhead Press', 3, '8-10', '90 sec'),
      createExercise('Pull-ups', 3, '10-12', '90 sec'),
      createExercise('Dips', 3, '10-12', '90 sec'),
      createExercise('Barbell Rows', 3, '10-12', '90 sec'),
      createExercise('Leg Curls', 3, '12-15', '60 sec'),
      createExercise('Core Work', 3, '15-20', '60 sec'),
    ],
  },
  Saturday: {
    title: 'HIIT Cardio',
    date: 'Saturday, Oct 26',
    duration: '30 min',
    exercises: 6,
    difficulty: 'Intermediate',
    caloriesBurn: 350,
    targetMuscles: 'Cardiovascular System',
    overview: 'High-intensity interval training to boost metabolism and burn calories.',
    exerciseList: [
      createExercise('Warm-up Jog', 1, '5 min', 'None'),
      createExercise('Sprint Intervals', 8, '30 sec', '60 sec'),
      createExercise('Burpees', 4, '15', '60 sec'),
      createExercise('Jump Rope', 4, '60 sec', '60 sec'),
      createExercise('Mountain Climbers', 4, '30 sec', '30 sec'),
      createExercise('Cool Down Walk', 1, '5 min', 'None'),
    ],
  },
  Sunday: {
    title: 'Rest Day',
    date: 'Sunday, Oct 27',
    duration: '0 min',
    exercises: 0,
    difficulty: 'Rest',
    caloriesBurn: 0,
    targetMuscles: 'Recovery',
    overview: 'Complete rest day for muscle recovery and growth. Stay hydrated and eat well.',
    exerciseList: [],
  },
};

interface WorkoutDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  onStartWorkout: () => void;
  selectedDate?: number;
  workout?: any; // The actual workout data from store
}

const API_URL = 'https://workout-buddy-622.preview.emergentagent.com';

export function WorkoutDetailsModal({ 
  visible, 
  onClose, 
  onStartWorkout, 
  selectedDate = 23,
  workout 
}: WorkoutDetailsModalProps) {
  const getDayIndexFromDate = (date: number) => {
    const baseDate = 21;
    return (date - baseDate) % 7;
  };
  
  const initialDayIndex = getDayIndexFromDate(selectedDate);
  const [currentDayIndex, setCurrentDayIndex] = useState(initialDayIndex);
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const [exercisesExpanded, setExercisesExpanded] = useState(false);
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState<number | null>(null);
  const [exerciseVideos, setExerciseVideos] = useState<Map<string, string>>(new Map());
  const [loadingVideos, setLoadingVideos] = useState(false);
  
  // Set tracking state: exerciseIndex -> setIndex -> {weight, reps, feeling}
  const [setData, setSetData] = useState<Map<number, Map<number, {weight: string, reps: string, feeling: string}>>>(new Map());
  const [completedSets, setCompletedSets] = useState<Map<number, Set<number>>>(new Map());
  const [activeSet, setActiveSet] = useState<{exerciseIndex: number, setIndex: number} | null>(null);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  
  const swipeX = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      const newDayIndex = getDayIndexFromDate(selectedDate);
      setCurrentDayIndex(newDayIndex);
    }
  }, [visible, selectedDate]);

  // Fetch exercise videos when exercises are expanded
  useEffect(() => {
    const fetchExerciseVideos = async () => {
      const safeExerciseList = currentWorkout?.exerciseList || [];
      
      if (exercisesExpanded && safeExerciseList.length > 0) {
        setLoadingVideos(true);
        try {
          const exerciseNames = safeExerciseList
            .map((ex: any) => ex?.name)
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
      }
    };

    fetchExerciseVideos();
  }, [exercisesExpanded, currentDayIndex, currentWorkout]);

  const currentDay = DAYS[currentDayIndex];
  // Use provided workout data or fallback to hardcoded data
  const currentWorkout = workout || WORKOUT_DATA[currentDay];
  
  // Safe access to workout properties with defaults
  const exerciseList = currentWorkout?.exerciseList || [];
  const workoutTitle = currentWorkout?.title || 'Workout';
  const workoutDate = currentWorkout?.date || currentDay;
  const workoutDuration = currentWorkout?.duration || '30 min';
  const workoutDifficulty = currentWorkout?.difficulty || 'Moderate';
  const workoutOverview = currentWorkout?.overview || '';
  const targetMuscles = currentWorkout?.targetMuscles || currentWorkout?.type || 'Full Body';
  const exerciseCount = exerciseList.length > 0 ? exerciseList.length : (currentWorkout?.exercises?.length || 0);
  const caloriesBurn = currentWorkout?.caloriesBurn || (typeof currentWorkout?.duration === 'number' ? Math.round(currentWorkout.duration * 8) : 240);

  const handlePreviousDay = () => {
    setCurrentDayIndex((prev) => (prev === 0 ? 6 : prev - 1));
  };

  const handleNextDay = () => {
    setCurrentDayIndex((prev) => (prev === 6 ? 0 : prev + 1));
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        swipeX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 100) {
          handlePreviousDay();
        } else if (gestureState.dx < -100) {
          handleNextDay();
        }
        Animated.spring(swipeX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ translateX: swipeX }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.dateNav}>
              <TouchableOpacity style={styles.navButton} onPress={handlePreviousDay}>
                <Ionicons name="chevron-back" size={24} color={COLORS.accent} />
              </TouchableOpacity>
              
              <View style={styles.dateContainer}>
                <Text style={styles.dateText}>{workoutDate}</Text>
                <Text style={styles.dayText}>{currentDay}</Text>
              </View>
              
              <TouchableOpacity style={styles.navButton} onPress={handleNextDay}>
                <Ionicons name="chevron-forward" size={24} color={COLORS.accent} />
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Ionicons name="time-outline" size={20} color={COLORS.accent} />
                <Text style={styles.statValue}>{workoutDuration}</Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>

              <View style={styles.statBox}>
                <Ionicons name="list-outline" size={20} color={COLORS.accent} />
                <Text style={styles.statValue}>{exerciseCount}</Text>
                <Text style={styles.statLabel}>Exercises</Text>
              </View>

              <View style={styles.statBox}>
                <Ionicons name="speedometer-outline" size={20} color={COLORS.accent} />
                <Text style={styles.statValue}>{workoutDifficulty}</Text>
                <Text style={styles.statLabel}>Level</Text>
              </View>

              <View style={styles.circularStat}>
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentSecondary]}
                  style={styles.circularGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.circularValue}>{caloriesBurn}</Text>
                  <Text style={styles.circularLabel}>cal</Text>
                </LinearGradient>
              </View>
            </View>

            <View style={styles.titleSection}>
              <Text style={styles.workoutTitle}>{workoutTitle}</Text>
              <Text style={styles.targetText}>Target: {targetMuscles}</Text>
            </View>

            {workoutOverview && (
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setOverviewExpanded(!overviewExpanded)}
              >
                <View style={styles.dropdownHeader}>
                  <Ionicons name="document-text-outline" size={22} color={COLORS.accent} />
                  <Text style={styles.dropdownTitle}>Overview</Text>
                  <Ionicons 
                    name={overviewExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={COLORS.mediumGray} 
                  />
                </View>
                {overviewExpanded && (
                  <View style={styles.dropdownContent}>
                    <Text style={styles.overviewText}>{workoutOverview}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {exerciseList.length > 0 && (
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setExercisesExpanded(!exercisesExpanded)}
              >
                <View style={styles.dropdownHeader}>
                  <Ionicons name="barbell-outline" size={22} color={COLORS.accent} />
                  <Text style={styles.dropdownTitle}>All Exercises ({exerciseCount})</Text>
                  <Ionicons 
                    name={exercisesExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={COLORS.mediumGray} 
                  />
                </View>
                {exercisesExpanded && (
                  <View style={styles.dropdownContent}>
                    {loadingVideos && (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={COLORS.accent} />
                        <Text style={styles.loadingText}>Loading videos...</Text>
                      </View>
                    )}
                    {exerciseList.map((exercise: any, index: number) => {
                      // Safe access to exercise properties
                      const exerciseName = exercise?.name || 'Exercise';
                      const videoUrl = exerciseVideos.get(exerciseName);
                      const isExpanded = expandedExerciseIndex === index;
                      const sets = exercise?.sets || 3;
                      const reps = exercise?.reps || '10-12';
                      const restTime = exercise?.restTime || exercise?.rest || '';
                      
                      return (
                        <View key={index} style={styles.exerciseItemContainer}>
                          <TouchableOpacity
                            style={styles.exerciseItem}
                            onPress={() => setExpandedExerciseIndex(isExpanded ? null : index)}
                          >
                            <Text style={styles.exerciseNumber}>{index + 1}</Text>
                            <View style={styles.exerciseInfo}>
                              <View style={styles.exerciseHeader}>
                                <Text style={styles.exerciseName}>{exerciseName}</Text>
                                {videoUrl && (
                                  <Ionicons
                                    name="play-circle"
                                    size={20}
                                    color={COLORS.accent}
                                  />
                                )}
                              </View>
                              <Text style={styles.exerciseDetails}>
                                {sets} sets × {reps} {restTime ? `• ${restTime}s rest` : ''}
                              </Text>
                            </View>
                            <Ionicons
                              name={isExpanded ? "chevron-up" : "chevron-down"}
                              size={20}
                              color={COLORS.mediumGray}
                            />
                          </TouchableOpacity>
                          
                          {isExpanded && videoUrl && (
                            <View style={styles.videoPlayerContainer}>
                              <ExerciseVideoPlayer
                                videoUrl={videoUrl}
                                exerciseName={exerciseName}
                                autoPlay={false}
                              />
                              <Text style={styles.videoHint}>
                                Tap for controls • Full screen available
                              </Text>
                            </View>
                          )}

                          {isExpanded && !videoUrl && (
                            <View style={styles.noVideoContainer}>
                              <Ionicons
                                name="videocam-off-outline"
                                size={32}
                                color={COLORS.mediumGray}
                              />
                              <Text style={styles.noVideoText}>
                                Video not available for this exercise
                              </Text>
                            </View>
                          )}
                          
                          {/* Set Tracking UI */}
                          {isExpanded && (
                            <View style={styles.setTrackingContainer}>
                              <View style={styles.setTrackingHeader}>
                                <Ionicons name="checkmark-circle" size={22} color={COLORS.accent} />
                                <Text style={styles.setTrackingTitle}>Track Your Sets</Text>
                              </View>
                              
                              {Array.from({ length: sets }).map((_, setIndex) => {
                                const isCompleted = completedSets.get(index)?.has(setIndex) || false;
                                const setInfo = setData.get(index)?.get(setIndex);
                                
                                return (
                                  <View key={setIndex} style={styles.setRow}>
                                    <View style={styles.setNumber}>
                                      {isCompleted ? (
                                        <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                                      ) : (
                                        <Text style={styles.setNumberText}>{setIndex + 1}</Text>
                                      )}
                                    </View>
                                    
                                    <TextInput
                                      style={styles.setInput}
                                      placeholder="Weight"
                                      placeholderTextColor={COLORS.mediumGray}
                                      keyboardType="numeric"
                                      value={setInfo?.weight || ''}
                                      onChangeText={(text) => {
                                        const newData = new Map(setData);
                                        if (!newData.has(index)) newData.set(index, new Map());
                                        const exerciseData = newData.get(index)!;
                                        exerciseData.set(setIndex, { ...setInfo, weight: text, reps: setInfo?.reps || '', feeling: setInfo?.feeling || '' });
                                        setSetData(newData);
                                      }}
                                    />
                                    
                                    <TextInput
                                      style={styles.setInput}
                                      placeholder="Reps"
                                      placeholderTextColor={COLORS.mediumGray}
                                      keyboardType="numeric"
                                      value={setInfo?.reps || ''}
                                      onChangeText={(text) => {
                                        const newData = new Map(setData);
                                        if (!newData.has(index)) newData.set(index, new Map());
                                        const exerciseData = newData.get(index)!;
                                        exerciseData.set(setIndex, { ...setInfo, weight: setInfo?.weight || '', reps: text, feeling: setInfo?.feeling || '' });
                                        setSetData(newData);
                                      }}
                                    />
                                    
                                    <TouchableOpacity
                                      style={[styles.completeSetButton, isCompleted && styles.completeSetButtonDone]}
                                      onPress={() => {
                                        const newCompleted = new Map(completedSets);
                                        if (!newCompleted.has(index)) newCompleted.set(index, new Set());
                                        const exerciseCompleted = newCompleted.get(index)!;
                                        
                                        if (isCompleted) {
                                          exerciseCompleted.delete(setIndex);
                                        } else {
                                          exerciseCompleted.add(setIndex);
                                        }
                                        setCompletedSets(newCompleted);
                                      }}
                                    >
                                      <Ionicons 
                                        name={isCompleted ? "checkmark" : "checkmark-outline"} 
                                        size={18} 
                                        color={isCompleted ? COLORS.white : COLORS.accent} 
                                      />
                                    </TouchableOpacity>
                                  </View>
                                );
                              })}
                              
                              {/* Feeling Selector */}
                              <View style={styles.feelingContainer}>
                                <Text style={styles.feelingLabel}>How did it feel?</Text>
                                <View style={styles.feelingButtons}>
                                  {['Easy', 'Good', 'Hard'].map((feeling) => {
                                    const exerciseData = setData.get(index)?.get(0);
                                    const selected = exerciseData?.feeling === feeling;
                                    return (
                                      <TouchableOpacity
                                        key={feeling}
                                        style={[styles.feelingButton, selected && styles.feelingButtonSelected]}
                                        onPress={() => {
                                          const newData = new Map(setData);
                                          if (!newData.has(index)) newData.set(index, new Map());
                                          const exerciseData = newData.get(index)!;
                                          // Apply feeling to all sets of this exercise
                                          for (let i = 0; i < sets; i++) {
                                            const currentSet = exerciseData.get(i) || { weight: '', reps: '', feeling: '' };
                                            exerciseData.set(i, { ...currentSet, feeling });
                                          }
                                          setSetData(newData);
                                        }}
                                      >
                                        <Text style={[styles.feelingButtonText, selected && styles.feelingButtonTextSelected]}>
                                          {feeling}
                                        </Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </TouchableOpacity>
            )}

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.editButton}>
                <Ionicons name="create-outline" size={20} color={COLORS.accent} />
                <Text style={styles.editButtonText}>Edit Workout</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.startButton}
                onPress={onStartWorkout}
              >
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentSecondary]}
                  style={styles.startGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="play" size={20} color={COLORS.white} />
                  <Text style={styles.startButtonText}>Complete Workout</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
    paddingTop: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.mediumGray,
  },
  circularStat: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
  },
  circularGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  circularLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  titleSection: {
    marginBottom: 20,
  },
  workoutTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  targetText: {
    fontSize: 15,
    color: COLORS.mediumGray,
  },
  dropdown: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  dropdownTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 12,
  },
  dropdownContent: {
    padding: 16,
    paddingTop: 0,
  },
  overviewText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  exerciseItemContainer: {
    marginBottom: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  exerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${COLORS.accent}20`,
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  exerciseDetails: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  videoPlayerContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  videoHint: {
    fontSize: 11,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  noVideoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  noVideoText: {
    fontSize: 13,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.white,
    gap: 8,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.accent,
  },
  startButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  startGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  setTrackingContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${COLORS.accent}20`,
  },
  setTrackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  setTrackingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  setNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.accent}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  setInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.lightGray,
  },
  completeSetButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.accent}15`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  completeSetButtonDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  feelingContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  feelingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  feelingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  feelingButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  feelingButtonSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  feelingButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.mediumGray,
  },
  feelingButtonTextSelected: {
    color: COLORS.white,
  },
});
