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
import { EditWorkoutModal } from './EditWorkoutModal';

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
  selectedDate?: number; // Day of month
  selectedFullDate?: Date; // Full date object for 3-week navigation
  workout?: any;
  initialDayIndex?: number;
}

export function WorkoutDetailsModal({
  visible,
  onClose,
  onStartWorkout,
  selectedDate = 23,
  selectedFullDate,
  workout,
  initialDayIndex
}: WorkoutDetailsModalProps) {
  const { weekWorkouts, updateWorkoutInWeek, setCurrentWorkout } = useWorkoutStore();
  
  // Find workout by date from weekWorkouts (now has 21 days)
  const findWorkoutByDate = (date: Date) => {
    const dateStr = date.toDateString();
    return weekWorkouts.find((w: any) => {
      const workoutDate = new Date(w.date);
      return workoutDate.toDateString() === dateStr;
    });
  };
  
  // Get workout index by date
  const getWorkoutIndexByDate = (date: Date) => {
    const dateStr = date.toDateString();
    return weekWorkouts.findIndex((w: any) => {
      const workoutDate = new Date(w.date);
      return workoutDate.toDateString() === dateStr;
    });
  };
  
  const getTodayDayIndex = () => {
    const today = new Date();
    return getWorkoutIndexByDate(today);
  };
  
  // State to track current workout index in the 21-day array
  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState(0);
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState<number | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const swipeX = useRef(new Animated.Value(0)).current;
  
  // Get workout for current index
  const currentWorkout = weekWorkouts[currentWorkoutIndex] || workout;
  const currentWorkoutDate = currentWorkout?.date ? new Date(currentWorkout.date) : new Date();
  const dayName = DAYS[currentWorkoutDate.getDay() === 0 ? 6 : currentWorkoutDate.getDay() - 1];
  
  // Debug logging
  useEffect(() => {
    console.log('📅 [MODAL] Current workout index:', currentWorkoutIndex);
    console.log('📅 [MODAL] Week workouts count:', weekWorkouts?.length || 0);
    console.log('📅 [MODAL] Current workout:', currentWorkout?.title || 'none');
    console.log('📅 [MODAL] Is rest day:', currentWorkout?.isRestDay);
  }, [currentWorkoutIndex, weekWorkouts, currentWorkout]);
  
  useEffect(() => {
    if (visible) {
      if (selectedFullDate) {
        // Find index by full date
        const index = getWorkoutIndexByDate(selectedFullDate);
        setCurrentWorkoutIndex(index >= 0 ? index : 0);
      } else if (initialDayIndex !== undefined) {
        // Fallback to day index for current week
        setCurrentWorkoutIndex(initialDayIndex);
      } else {
        const todayIndex = getTodayDayIndex();
        setCurrentWorkoutIndex(todayIndex >= 0 ? todayIndex : 0);
      }
      setExpandedExerciseIndex(null);
    }
  }, [visible, initialDayIndex, selectedFullDate]);
  
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
    setCurrentWorkoutIndex((prev) => Math.min(prev + 1, weekWorkouts.length - 1));
    setExpandedExerciseIndex(null);
  };
  
  const handlePreviousDay = () => {
    setCurrentWorkoutIndex((prev) => Math.max(prev - 1, 0));
    setExpandedExerciseIndex(null);
  };
  
  const formatDate = () => {
    if (currentWorkout?.date) {
      const date = new Date(currentWorkout.date);
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };
  
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
            <TouchableOpacity 
              style={[styles.navButton, currentWorkoutIndex === 0 && styles.navButtonDisabled]} 
              onPress={handlePreviousDay}
              disabled={currentWorkoutIndex === 0}
            >
              <Ionicons name="chevron-back" size={24} color={currentWorkoutIndex === 0 ? "rgba(255,255,255,0.3)" : "#FFFFFF"} />
            </TouchableOpacity>
            
            <View style={styles.dayInfo}>
              <Text style={styles.dayName}>{dayName}</Text>
              <Text style={styles.dateText}>{formatDate()}</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.navButton, currentWorkoutIndex >= weekWorkouts.length - 1 && styles.navButtonDisabled]} 
              onPress={handleNextDay}
              disabled={currentWorkoutIndex >= weekWorkouts.length - 1}
            >
              <Ionicons name="chevron-forward" size={24} color={currentWorkoutIndex >= weekWorkouts.length - 1 ? "rgba(255,255,255,0.3)" : "#FFFFFF"} />
            </TouchableOpacity>
          </View>
          
          {/* Workout Title */}
          <Text style={styles.workoutTitle}>{currentWorkout?.title || 'Workout'}</Text>
          
          {/* Rest Day or Stats Row */}
          {currentWorkout?.isRestDay ? (
            <View style={styles.restDayBanner}>
              <Ionicons name="bed-outline" size={24} color="#FFFFFF" />
              <Text style={styles.restDayText}>Recovery Day</Text>
            </View>
          ) : (
            <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color="#FFFFFF" />
              <Text style={styles.statText}>{currentWorkout?.duration || 45} min</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="fitness-outline" size={20} color="#FFFFFF" />
              <Text style={styles.statText}>{currentWorkout?.exercises?.length || 0} exercises</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="flame-outline" size={20} color="#FFFFFF" />
              <Text style={styles.statText}>{currentWorkout?.caloriesBurn || 300} cal</Text>
            </View>
          </View>
          )}
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
            {/* Rest Day Content */}
            {currentWorkout?.isRestDay ? (
              <View style={styles.restDayContent}>
                <Ionicons name="moon-outline" size={64} color={COLORS.gradientStart} />
                <Text style={styles.restDayTitle}>Rest & Recover</Text>
                <Text style={styles.restDayDescription}>
                  {currentWorkout?.overview || 'Take time to recover. Stay hydrated and get good sleep!'}
                </Text>
                <View style={styles.restDayTips}>
                  <View style={styles.tipItem}>
                    <Ionicons name="water-outline" size={24} color={COLORS.gradientStart} />
                    <Text style={styles.tipText}>Stay hydrated</Text>
                  </View>
                  <View style={styles.tipItem}>
                    <Ionicons name="bed-outline" size={24} color={COLORS.gradientStart} />
                    <Text style={styles.tipText}>Get 7-9 hours sleep</Text>
                  </View>
                  <View style={styles.tipItem}>
                    <Ionicons name="leaf-outline" size={24} color={COLORS.gradientStart} />
                    <Text style={styles.tipText}>Light stretching is okay</Text>
                  </View>
                </View>
              </View>
            ) : (
              <>
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
            </>
            )}
            
            <View style={{ height: 120 }} />
          </ScrollView>
        </Animated.View>
        
        {/* Action Buttons - hide for rest days */}
        {!currentWorkout?.isRestDay && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.editButton} onPress={() => setEditModalVisible(true)}>
            <View style={styles.editButtonContent}>
              <Ionicons name="create-outline" size={20} color={COLORS.primary} />
              <Text style={styles.editButtonText}>Edit Workout</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.startButton} 
            onPress={() => {
              // Set the current workout before starting
              if (currentWorkout) {
                setCurrentWorkout(currentWorkout);
              }
              onStartWorkout();
            }}
          >
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
      
      {/* Edit Workout Modal */}
      <EditWorkoutModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        workout={currentWorkout}
        onSaveWorkout={async (updated) => {
          console.log('💾 Saving updated workout for day', currentDayIndex);
          await updateWorkoutInWeek(currentDayIndex, updated);
          setEditModalVisible(false);
        }}
      />
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
      
      {isExpanded && (
        exercise.videoUrl ? (
          <View style={styles.videoContainer}>
            <ExerciseVideoPlayer
              videoUrl={exercise.videoUrl}
              exerciseName={exercise.name}
              autoPlay={false}
            />
          </View>
        ) : (
          <View style={styles.noVideoContainer}>
            <Ionicons name="videocam-off-outline" size={32} color={COLORS.mediumGray} />
            <Text style={styles.noVideoText}>Video Unavailable</Text>
          </View>
        )
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
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
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
