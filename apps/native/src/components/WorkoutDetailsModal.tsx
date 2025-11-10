import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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

// Days of the week
const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// Mock workout data for each day
const WORKOUT_DATA: any = {
  'Monday': {
    title: 'Upper Body Push',
    date: 'Monday, Oct 21',
    duration: '45 min',
    exercises: 8,
    difficulty: 'Intermediate',
    caloriesBurn: 420,
    targetMuscles: 'Chest, Shoulders, Triceps',
    overview: 'Progressive overload focused session targeting the pushing muscles. We\'ll start with compound movements and finish with isolation work to maximize muscle growth and strength gains.',
    exerciseList: [
      { name: 'Bench Press', sets: 4, reps: '8-10', rest: '2 min' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', rest: '90 sec' },
      { name: 'Overhead Press', sets: 4, reps: '6-8', rest: '2 min' },
      { name: 'Lateral Raises', sets: 3, reps: '12-15', rest: '60 sec' },
      { name: 'Tricep Dips', sets: 3, reps: '10-12', rest: '90 sec' },
      { name: 'Cable Flyes', sets: 3, reps: '12-15', rest: '60 sec' },
      { name: 'Tricep Pushdowns', sets: 3, reps: '12-15', rest: '60 sec' },
      { name: 'Face Pulls', sets: 3, reps: '15-20', rest: '60 sec' },
    ],
  },
  'Tuesday': {
    title: 'Lower Body Power',
    date: 'Tuesday, Oct 22',
    duration: '50 min',
    exercises: 7,
    difficulty: 'Advanced',
    caloriesBurn: 480,
    targetMuscles: 'Quads, Glutes, Hamstrings',
    overview: 'Heavy compound leg movements focusing on building strength and power in the lower body.',
    exerciseList: [
      { name: 'Squats', sets: 5, reps: '5-8', rest: '3 min' },
      { name: 'Romanian Deadlifts', sets: 4, reps: '8-10', rest: '2 min' },
      { name: 'Leg Press', sets: 3, reps: '10-12', rest: '90 sec' },
      { name: 'Walking Lunges', sets: 3, reps: '12 each', rest: '90 sec' },
      { name: 'Leg Curls', sets: 3, reps: '12-15', rest: '60 sec' },
      { name: 'Calf Raises', sets: 4, reps: '15-20', rest: '60 sec' },
      { name: 'Core Planks', sets: 3, reps: '60 sec', rest: '60 sec' },\n    ],\n  },\n  'Wednesday': {\n    title: 'Upper Body Pull',\n    date: 'Wednesday, Oct 23',\n    duration: '45 min',\n    exercises: 8,\n    difficulty: 'Intermediate',\n    caloriesBurn: 400,\n    targetMuscles: 'Back, Biceps, Rear Delts',\n    overview: 'Pull-focused workout targeting back thickness and width with bicep isolation.',\n    exerciseList: [\n      { name: 'Pull-ups', sets: 4, reps: '8-12', rest: '2 min' },\n      { name: 'Barbell Rows', sets: 4, reps: '8-10', rest: '2 min' },\n      { name: 'Lat Pulldowns', sets: 3, reps: '10-12', rest: '90 sec' },\n      { name: 'Face Pulls', sets: 3, reps: '15-20', rest: '60 sec' },\n      { name: 'Barbell Curls', sets: 3, reps: '10-12', rest: '90 sec' },\n      { name: 'Hammer Curls', sets: 3, reps: '12-15', rest: '60 sec' },\n      { name: 'Cable Curls', sets: 3, reps: '12-15', rest: '60 sec' },\n      { name: 'Shrugs', sets: 3, reps: '12-15', rest: '60 sec' },\n    ],\n  },\n  'Thursday': {\n    title: 'Active Recovery',\n    date: 'Thursday, Oct 24',\n    duration: '30 min',\n    exercises: 5,\n    difficulty: 'Beginner',\n    caloriesBurn: 200,\n    targetMuscles: 'Full Body Mobility',\n    overview: 'Light mobility work and stretching to promote recovery and reduce soreness.',\n    exerciseList: [\n      { name: 'Dynamic Stretching', sets: 1, reps: '10 min', rest: 'None' },\n      { name: 'Foam Rolling', sets: 1, reps: '10 min', rest: 'None' },\n      { name: 'Yoga Flow', sets: 1, reps: '10 min', rest: 'None' },\n      { name: 'Light Cardio', sets: 1, reps: '15 min', rest: 'None' },\n      { name: 'Cool Down Stretch', sets: 1, reps: '5 min', rest: 'None' },\n    ],\n  },\n  'Friday': {\n    title: 'Full Body Strength',\n    date: 'Friday, Oct 25',\n    duration: '55 min',\n    exercises: 9,\n    difficulty: 'Advanced',\n    caloriesBurn: 500,\n    targetMuscles: 'Full Body',\n    overview: 'Complete full-body workout hitting all major muscle groups with compound movements.',\n    exerciseList: [\n      { name: 'Deadlifts', sets: 4, reps: '5-8', rest: '3 min' },\n      { name: 'Bench Press', sets: 4, reps: '8-10', rest: '2 min' },\n      { name: 'Squats', sets: 4, reps: '8-10', rest: '2 min' },\n      { name: 'Overhead Press', sets: 3, reps: '8-10', rest: '90 sec' },\n      { name: 'Pull-ups', sets: 3, reps: '10-12', rest: '90 sec' },\n      { name: 'Dips', sets: 3, reps: '10-12', rest: '90 sec' },\n      { name: 'Barbell Rows', sets: 3, reps: '10-12', rest: '90 sec' },\n      { name: 'Leg Curls', sets: 3, reps: '12-15', rest: '60 sec' },\n      { name: 'Core Work', sets: 3, reps: '15-20', rest: '60 sec' },\n    ],\n  },\n  'Saturday': {\n    title: 'HIIT Cardio',\n    date: 'Saturday, Oct 26',\n    duration: '30 min',\n    exercises: 6,\n    difficulty: 'Intermediate',\n    caloriesBurn: 350,\n    targetMuscles: 'Cardiovascular System',\n    overview: 'High-intensity interval training to boost metabolism and burn calories.',\n    exerciseList: [\n      { name: 'Warm-up Jog', sets: 1, reps: '5 min', rest: 'None' },\n      { name: 'Sprint Intervals', sets: 8, reps: '30 sec', rest: '60 sec' },\n      { name: 'Burpees', sets: 4, reps: '15', rest: '60 sec' },\n      { name: 'Jump Rope', sets: 4, reps: '60 sec', rest: '60 sec' },\n      { name: 'Mountain Climbers', sets: 4, reps: '30 sec', rest: '30 sec' },\n      { name: 'Cool Down Walk', sets: 1, reps: '5 min', rest: 'None' },\n    ],\n  },\n  'Sunday': {\n    title: 'Rest Day',\n    date: 'Sunday, Oct 27',\n    duration: '0 min',\n    exercises: 0,\n    difficulty: 'Rest',\n    caloriesBurn: 0,\n    targetMuscles: 'Recovery',\n    overview: 'Complete rest day for muscle recovery and growth. Stay hydrated and eat well.',\n    exerciseList: [],\n  },\n};\n\ninterface WorkoutDetailsModalProps {\n  visible: boolean;\n  onClose: () => void;\n  onStartWorkout: () => void;\n  selectedDate?: number;\n}\n\nexport function WorkoutDetailsModal({ visible, onClose, onStartWorkout, selectedDate = 23 }: WorkoutDetailsModalProps) {\n  // Map date to day of week (21=Mon, 22=Tue, 23=Wed, etc.)\n  const getDayIndexFromDate = (date: number) => {\n    const baseDate = 21; // Monday is 21\n    return (date - baseDate) % 7;\n  };\n  \n  const initialDayIndex = getDayIndexFromDate(selectedDate);\n  const [currentDayIndex, setCurrentDayIndex] = useState(initialDayIndex);\n  const [overviewExpanded, setOverviewExpanded] = useState(false);\n  const [exercisesExpanded, setExercisesExpanded] = useState(false);\n  const router = useRouter();\n  const swipeX = useRef(new Animated.Value(0)).current;\n\n  // Update day when modal opens with new selectedDate\n  React.useEffect(() => {\n    if (visible) {\n      const newDayIndex = getDayIndexFromDate(selectedDate);\n      setCurrentDayIndex(newDayIndex);\n    }\n  }, [visible, selectedDate]);\n\n  const currentDay = DAYS[currentDayIndex];\n  const currentWorkout = WORKOUT_DATA[currentDay];\n\n  const handlePreviousDay = () => {\n    setCurrentDayIndex((prev) => (prev === 0 ? 6 : prev - 1));\n  };\n\n  const handleNextDay = () => {\n    setCurrentDayIndex((prev) => (prev === 6 ? 0 : prev + 1));\n  };\n\n  // Swipe gesture handler\n  const panResponder = useRef(\n    PanResponder.create({\n      onMoveShouldSetPanResponder: (_, gestureState) => {\n        return Math.abs(gestureState.dx) > 10;\n      },\n      onPanResponderMove: (_, gestureState) => {\n        swipeX.setValue(gestureState.dx);\n      },\n      onPanResponderRelease: (_, gestureState) => {\n        if (gestureState.dx > 100) {\n          // Swipe right - previous day\n          handlePreviousDay();\n        } else if (gestureState.dx < -100) {\n          // Swipe left - next day\n          handleNextDay();\n        }\n        Animated.spring(swipeX, {\n          toValue: 0,\n          useNativeDriver: true,\n        }).start();\n      },\n    })\n  ).current;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Date Navigation */}
            <View style={styles.dateNav}>
              <TouchableOpacity style={styles.navButton} onPress={handlePreviousDay}>
                <Ionicons name="chevron-back" size={24} color={COLORS.accent} />
              </TouchableOpacity>
              
              <View style={styles.dateContainer}>
                <Text style={styles.dateText}>{MOCK_WORKOUT.date}</Text>
              </View>
              
              <TouchableOpacity style={styles.navButton} onPress={handleNextDay}>
                <Ionicons name="chevron-forward" size={24} color={COLORS.accent} />
              </TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Ionicons name="time-outline" size={20} color={COLORS.accent} />
                <Text style={styles.statValue}>{MOCK_WORKOUT.duration}</Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>

              <View style={styles.statBox}>
                <Ionicons name="list-outline" size={20} color={COLORS.accent} />
                <Text style={styles.statValue}>{MOCK_WORKOUT.exercises}</Text>
                <Text style={styles.statLabel}>Exercises</Text>
              </View>

              <View style={styles.statBox}>
                <Ionicons name="speedometer-outline" size={20} color={COLORS.accent} />
                <Text style={styles.statValue}>{MOCK_WORKOUT.difficulty}</Text>
                <Text style={styles.statLabel}>Level</Text>
              </View>

              {/* Circular Stat */}
              <View style={styles.circularStat}>
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentSecondary]}
                  style={styles.circularGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.circularValue}>{MOCK_WORKOUT.caloriesBurn}</Text>
                  <Text style={styles.circularLabel}>cal</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Workout Title & Target */}
            <View style={styles.titleSection}>
              <Text style={styles.workoutTitle}>{MOCK_WORKOUT.title}</Text>
              <Text style={styles.targetText}>Target: {MOCK_WORKOUT.targetMuscles}</Text>
            </View>

            {/* Overview Dropdown */}
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
                  <Text style={styles.overviewText}>{MOCK_WORKOUT.overview}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Exercises Dropdown */}
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setExercisesExpanded(!exercisesExpanded)}
            >
              <View style={styles.dropdownHeader}>
                <Ionicons name="barbell-outline" size={22} color={COLORS.accent} />
                <Text style={styles.dropdownTitle}>All Exercises ({MOCK_WORKOUT.exercises})</Text>
                <Ionicons 
                  name={exercisesExpanded ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={COLORS.mediumGray} 
                />
              </View>
              {exercisesExpanded && (
                <View style={styles.dropdownContent}>
                  {MOCK_WORKOUT.exerciseList.map((exercise, index) => (
                    <View key={index} style={styles.exerciseItem}>
                      <Text style={styles.exerciseNumber}>{index + 1}</Text>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <Text style={styles.exerciseDetails}>
                          {exercise.sets} sets × {exercise.reps} reps • {exercise.rest} rest
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>

            {/* Action Buttons */}
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
        </View>
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
