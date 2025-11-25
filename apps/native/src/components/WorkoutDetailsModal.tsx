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
import { useWorkoutStore } from '../stores/workout-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  primary: '#A22BF6',
  secondary: '#E94560',
  gradientStart: '#A22BF6',
  gradientEnd: '#E94560',
  background: '#FFFFFF',
  cardBg: '#F5F5F7',
  text: '#1C1C1E',
  lightGray: '#E5E5EA',
  mediumGray: '#8E8E93',
  success: '#34C759',
  shadow: 'rgba(162, 43, 246, 0.3)',
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface WorkoutDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  onStartWorkout: () => void;
  selectedDate?: number;
  workout?: any;
}

export function WorkoutDetailsModal({
  visible,
  onClose,
  onStartWorkout,
  selectedDate = 23,
  workout
}: WorkoutDetailsModalProps) {
  const { weekWorkouts } = useWorkoutStore();
  
  const getTodayDayIndex = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0 = Monday
  };
  
  const [currentDayIndex, setCurrentDayIndex] = useState(getTodayDayIndex());
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState<number | null>(null);
  const swipeX = useRef(new Animated.Value(0)).current;
  
  // Get workout for current day from weekWorkouts or use provided workout
  const currentWorkout = workout || weekWorkouts[currentDayIndex];
  
  useEffect(() => {
    if (visible) {
      setCurrentDayIndex(getTodayDayIndex());
      setExpandedExerciseIndex(null);
    }
  }, [visible]);
  
  // Swipe gesture handler
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20;
      },
      onPanResponderMove: (_, gestureState) => {
        swipeX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 80) {
          // Swipe right - previous day
          handlePreviousDay();
        } else if (gestureState.dx < -80) {
          // Swipe left - next day
          handleNextDay();
        }
        Animated.spring(swipeX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;
  
  const handleNextDay = () => {
    setCurrentDayIndex((prev) => (prev === 6 ? 0 : prev + 1));
    setExpandedExerciseIndex(null);
  };
  
  const handlePreviousDay = () => {
    setCurrentDayIndex((prev) => (prev === 0 ? 6 : prev - 1));
    setExpandedExerciseIndex(null);
  };
  
  const formatDate = () => {
    if (currentWorkout?.date) {
      const date = new Date(currentWorkout.date);
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };
  
  const currentDay = DAYS[currentDayIndex];
  
  const warmupExercises = currentWorkout?.exercises?.filter((e: any) => e.category === 'warmup') || [];
  const mainExercises = currentWorkout?.exercises?.filter((e: any) => e.category === 'main') || [];
  const cooldownExercises = currentWorkout?.exercises?.filter((e: any) => e.category === 'cooldown') || [];
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerLabel}>Workout Details</Text>
            <View style={styles.placeholder} />
          </View>
          
          {/* Day Navigation */}
          <View style={styles.dayNavigation}>
            <TouchableOpacity style={styles.navButton} onPress={handlePreviousDay}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.dayInfo}>
              <Text style={styles.dayName}>{currentDay}</Text>
              <Text style={styles.dateText}>{formatDate()}</Text>
            </View>
            
            <TouchableOpacity style={styles.navButton} onPress={handleNextDay}>
              <Ionicons name="chevron-forward" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          {/* Workout Title */}
          <Text style={styles.workoutTitle}>{currentWorkout?.title || 'Workout'}</Text>
          
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color={COLORS.text} />
              <Text style={styles.statText}>{currentWorkout?.duration || 45} min</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="fitness-outline" size={20} color={COLORS.text} />
              <Text style={styles.statText}>{currentWorkout?.exercises?.length || 0} exercises</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="flame-outline" size={20} color={COLORS.text} />
              <Text style={styles.statText}>{currentWorkout?.caloriesBurn || 300} cal</Text>
            </View>
          </View>
        </LinearGradient>
        
        {/* Swipeable Content */}
        <Animated.View
          style={[styles.content, { transform: [{ translateX: swipeX }] }]}
          {...panResponder.panHandlers}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Overview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <Text style={styles.overviewText}>
                {currentWorkout?.overview || 'Complete workout designed for your fitness level.'}
              </Text>
            </View>
            
            {/* Warmup */}
            {warmupExercises.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.categoryBadge}>
                    <Ionicons name="sunny-outline" size={16} color={COLORS.gradientStart} />
                    <Text style={styles.categoryText}>Warm Up</Text>
                  </View>
                  <Text style={styles.exerciseCount}>{warmupExercises.length} exercises</Text>
                </View>
                {warmupExercises.map((exercise: any, index: number) => (
                  <ExerciseCard
                    key={`warmup-${index}`}
                    exercise={exercise}
                    index={index}
                    isExpanded={expandedExerciseIndex === index}
                    onToggle={() => setExpandedExerciseIndex(expandedExerciseIndex === index ? null : index)}
                  />
                ))}
              </View>
            )}
            
            {/* Main Workout */}
            {mainExercises.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.categoryBadge}>
                    <Ionicons name="barbell-outline" size={16} color={COLORS.gradientStart} />
                    <Text style={styles.categoryText}>Main Workout</Text>
                  </View>
                  <Text style={styles.exerciseCount}>{mainExercises.length} exercises</Text>
                </View>
                {mainExercises.map((exercise: any, index: number) => (
                  <ExerciseCard
                    key={`main-${index}`}
                    exercise={exercise}
                    index={index + warmupExercises.length}
                    isExpanded={expandedExerciseIndex === (index + warmupExercises.length)}
                    onToggle={() => setExpandedExerciseIndex(expandedExerciseIndex === (index + warmupExercises.length) ? null : (index + warmupExercises.length))}
                  />
                ))}
              </View>
            )}
            
            {/* Cooldown */}
            {cooldownExercises.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.categoryBadge}>
                    <Ionicons name="water-outline" size={16} color={COLORS.gradientStart} />
                    <Text style={styles.categoryText}>Cool Down</Text>
                  </View>
                  <Text style={styles.exerciseCount}>{cooldownExercises.length} exercises</Text>
                </View>
                {cooldownExercises.map((exercise: any, index: number) => (
                  <ExerciseCard
                    key={`cooldown-${index}`}
                    exercise={exercise}
                    index={index + warmupExercises.length + mainExercises.length}
                    isExpanded={expandedExerciseIndex === (index + warmupExercises.length + mainExercises.length)}
                    onToggle={() => setExpandedExerciseIndex(expandedExerciseIndex === (index + warmupExercises.length + mainExercises.length) ? null : (index + warmupExercises.length + mainExercises.length))}
                  />
                ))}
              </View>
            )}
            
            <View style={{ height: 120 }} />
          </ScrollView>
        </Animated.View>
        
        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.editButton} onPress={() => alert('Edit Workout coming soon!')}>
            <View style={styles.editButtonContent}>
              <Ionicons name="create-outline" size={20} color={COLORS.primary} />
              <Text style={styles.editButtonText}>Edit Workout</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.startButton} onPress={onStartWorkout}>
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startButtonGradient}
            >
              <Ionicons name="play" size={24} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Start Workout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ExerciseCard({ exercise, index, isExpanded, onToggle }: any) {
  return (
    <View style={styles.exerciseCard}>
      <TouchableOpacity style={styles.exerciseHeader} onPress={onToggle}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <View style={styles.exerciseDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="repeat-outline" size={14} color={COLORS.mediumGray} />
              <Text style={styles.detailText}>{exercise.sets} sets</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="trending-up-outline" size={14} color={COLORS.mediumGray} />
              <Text style={styles.detailText}>{exercise.reps} reps</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="timer-outline" size={14} color={COLORS.mediumGray} />
              <Text style={styles.detailText}>{exercise.restTime}s rest</Text>
            </View>
          </View>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.mediumGray}
        />
      </TouchableOpacity>
      
      {isExpanded && exercise.videoUrl && (
        <View style={styles.videoContainer}>
          <ExerciseVideoPlayer
            videoUrl={exercise.videoUrl}
            exerciseName={exercise.name}
            autoPlay={false}
          />
        </View>
      )}
      
      {isExpanded && !exercise.videoUrl && (
        <View style={styles.noVideoContainer}>
          <Ionicons name="videocam-off-outline" size={32} color={COLORS.mediumGray} />
          <Text style={styles.noVideoText}>Video not available</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  dayNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayInfo: {
    marginHorizontal: 30,
    alignItems: 'center',
  },
  dayName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  overviewText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.mediumGray,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gradientStart,
  },
  exerciseCount: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.mediumGray,
  },
  exerciseCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  exerciseDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  videoContainer: {
    height: 220,
    backgroundColor: '#000',
  },
  noVideoContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  noVideoText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 8,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  editButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  startButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLORS.gradientStart,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
