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
  const swipeX = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      const newDayIndex = getDayIndexFromDate(selectedDate);
      setCurrentDayIndex(newDayIndex);
    }
  }, [visible, selectedDate]);

  const currentDay = DAYS[currentDayIndex];
  // Use provided workout data or fallback to hardcoded data
  const currentWorkout = workout || WORKOUT_DATA[currentDay];

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
                <Text style={styles.dateText}>{currentWorkout.date}</Text>
                <Text style={styles.dayText}>{currentDay}</Text>
              </View>
              
              <TouchableOpacity style={styles.navButton} onPress={handleNextDay}>
                <Ionicons name="chevron-forward" size={24} color={COLORS.accent} />
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Ionicons name="time-outline" size={20} color={COLORS.accent} />
                <Text style={styles.statValue}>{currentWorkout.duration}</Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>

              <View style={styles.statBox}>
                <Ionicons name="list-outline" size={20} color={COLORS.accent} />
                <Text style={styles.statValue}>{currentWorkout.exercises?.length || currentWorkout.exercises || 0}</Text>
                <Text style={styles.statLabel}>Exercises</Text>
              </View>

              <View style={styles.statBox}>
                <Ionicons name="speedometer-outline" size={20} color={COLORS.accent} />
                <Text style={styles.statValue}>{currentWorkout.difficulty}</Text>
                <Text style={styles.statLabel}>Level</Text>
              </View>

              <View style={styles.circularStat}>
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentSecondary]}
                  style={styles.circularGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.circularValue}>{currentWorkout.caloriesBurn || Math.round(currentWorkout.duration * 8)}</Text>
                  <Text style={styles.circularLabel}>cal</Text>
                </LinearGradient>
              </View>
            </View>

            <View style={styles.titleSection}>
              <Text style={styles.workoutTitle}>{currentWorkout.title}</Text>
              <Text style={styles.targetText}>Target: {currentWorkout.targetMuscles || currentWorkout.type}</Text>
            </View>

            {currentWorkout.overview && (
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
                    <Text style={styles.overviewText}>{currentWorkout.overview}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {currentWorkout.exerciseList.length > 0 && (
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setExercisesExpanded(!exercisesExpanded)}
              >
                <View style={styles.dropdownHeader}>
                  <Ionicons name="barbell-outline" size={22} color={COLORS.accent} />
                  <Text style={styles.dropdownTitle}>All Exercises ({currentWorkout.exercises})</Text>
                  <Ionicons 
                    name={exercisesExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={COLORS.mediumGray} 
                  />
                </View>
                {exercisesExpanded && (
                  <View style={styles.dropdownContent}>
                    {(currentWorkout.exerciseList || currentWorkout.exercises || []).map((exercise: any, index: number) => (
                      <View key={index} style={styles.exerciseItem}>
                        <Text style={styles.exerciseNumber}>{index + 1}</Text>
                        <View style={styles.exerciseInfo}>
                          <Text style={styles.exerciseName}>{exercise.name}</Text>
                          <Text style={styles.exerciseDetails}>
                            {exercise.sets} sets × {exercise.reps} {exercise.rest ? `• ${exercise.restTime || exercise.rest}s rest` : ''}
                          </Text>
                        </View>
                      </View>
                    ))}
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
                  <Text style={styles.startButtonText}>Start Workout</Text>
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
  exerciseItem: {
    flexDirection: 'row',
    marginBottom: 16,
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
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 13,
    color: COLORS.mediumGray,
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
});
