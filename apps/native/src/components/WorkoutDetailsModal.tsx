import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import * as SecureStore from 'expo-secure-store';
import { PreviewVideoPlayer, isValidVideoUrl } from './ExerciseVideoPlayer';
import { useWorkoutStore } from '../stores/workout-store';
import { EditWorkoutModal } from './EditWorkoutModal';
import { CustomAlert } from './CustomAlert';
import { useCoachStore } from '../stores/coach-store';
import { ExternalActivityModal, ExternalActivityLog } from './ExternalActivityModal';
import { ExerciseStatsModal } from './ExerciseStatsModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://bugzapper-55.preview.emergentagent.com';

const COLORS = {
  primary: '#A22BF6',
  secondary: '#FF4EC7',
  accent: '#A22BF6',
  gradientStart: '#A22BF6',
  gradientEnd: '#FF4EC7',
  // Green gradient for completed workouts
  completedGradientStart: '#34C759',
  completedGradientEnd: '#2ECC71',
  background: '#FFFFFF',
  cardBg: '#F5F5F7',
  text: '#1C1C1E',
  lightGray: '#E5E5EA',
  mediumGray: '#8E8E93',
  success: '#34C759',
  warning: '#FF9500',
  shadow: 'rgba(162, 43, 246, 0.3)',
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface WorkoutDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  onStartWorkout: () => void;
  selectedDate?: number;
  selectedFullDate?: Date;
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
  const { openChat } = useCoachStore();
  
  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState(0);
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState<number | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [externalActivityModalVisible, setExternalActivityModalVisible] = useState(false);
  const [workoutSummary, setWorkoutSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [exerciseStatsVisible, setExerciseStatsVisible] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | undefined>(undefined);
  const [currentWorkoutId, setCurrentWorkoutId] = useState<string | undefined>(undefined);
  const [thisWorkoutExerciseData, setThisWorkoutExerciseData] = useState<any>(null);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
  }>({ visible: false, type: 'info', title: '', message: '' });
  
  const swipeX = useRef(new Animated.Value(0)).current;
  
  // Open exercise stats detail with workout context
  const openExerciseDetail = (exerciseId: string) => {
    // Find exercise data from summary for "this workout" context
    const exerciseFromSummary = workoutSummary?.exercises?.find((ex: any) => ex.exerciseId === exerciseId);
    if (exerciseFromSummary) {
      setThisWorkoutExerciseData(exerciseFromSummary);
    }
    // Get workoutId from current workout or summary
    const workoutId = workoutSummary?.workoutId || currentWorkout?.id;
    setCurrentWorkoutId(workoutId);
    setSelectedExerciseId(exerciseId);
    setExerciseStatsVisible(true);
    
    // Debug logging
    if (__DEV__) {
      console.log('📊 [Summary→Detail] Opening exercise detail:', {
        exerciseId,
        workoutId,
        hasThisWorkoutData: !!exerciseFromSummary,
        thisWorkoutSets: exerciseFromSummary?.sets?.length || 0,
      });
    }
  };
  
  // Fetch workout summary data from API
  const fetchWorkoutSummary = useCallback(async (workoutId: string) => {
    try {
      setSummaryLoading(true);
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      const response = await fetch(`${API_BASE_URL}/api/stats/workout-summary/${workoutId}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });
      if (response.ok) {
        const data = await response.json();
        setWorkoutSummary(data);
      }
    } catch (err) {
      console.error('Error fetching workout summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);
  
  // Helper functions
  const findWorkoutByDate = (date: Date) => {
    const dateStr = date.toDateString();
    return weekWorkouts.find((w: any) => {
      const workoutDate = new Date(w.date);
      return workoutDate.toDateString() === dateStr;
    });
  };
  
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
  
  // Check if workout date is in the past
  const isPastWorkout = (workoutDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(workoutDate);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };
  
  // Check if workout date is in the future
  const isFutureWorkout = (workoutDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(workoutDate);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate > today;
  };
  
  // Get completed workouts to check for actual duration
  const completedWorkouts = useWorkoutStore(state => state.completedWorkouts);
  
  const currentWorkout = weekWorkouts[currentWorkoutIndex] || workout;
  const currentWorkoutDate = currentWorkout?.date ? new Date(currentWorkout.date) : new Date();
  const dayName = DAYS[currentWorkoutDate.getDay() === 0 ? 6 : currentWorkoutDate.getDay() - 1];
  
  // State for refreshed exercises with updated video URLs
  const [refreshedExercises, setRefreshedExercises] = useState<any[]>([]);
  
  // CRITICAL: Helper to get exercises from any workout structure (local or database-loaded)
  const getWorkoutExercises = (workout: any): any[] => {
    if (!workout) return [];
    // Check top-level first (local workouts)
    if (workout.exercises && Array.isArray(workout.exercises) && workout.exercises.length > 0) {
      return workout.exercises;
    }
    // Check payloadJson (database-loaded workouts)
    if (workout.payloadJson?.exercises && Array.isArray(workout.payloadJson.exercises)) {
      return workout.payloadJson.exercises;
    }
    // Check exerciseList alias
    if (workout.exerciseList && Array.isArray(workout.exerciseList)) {
      return workout.exerciseList;
    }
    return [];
  };
  
  // Refresh video URLs from database
  const refreshExerciseVideos = async (workout: any) => {
    // Use the same helper to get exercises from any structure
    const exercises = getWorkoutExercises(workout);
    if (!exercises.length) return;
    
    try {
      const exerciseNames = exercises
        .map((ex: any) => ex.name)
        .filter(Boolean)
        .join(',');
      
      if (!exerciseNames) return;
      
      const response = await fetch(
        `${API_BASE_URL}/api/exercises?names=${encodeURIComponent(exerciseNames)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const videoMap = new Map<string, string>();
        
        if (data?.exercises) {
          data.exercises.forEach((ex: any) => {
            if (ex && ex.videoUrl && ex.videoUrl.includes('cloudinary')) {
              if (ex.name) {
                videoMap.set(ex.name.toLowerCase(), ex.videoUrl);
              }
            }
          });
        }
        
        // Update exercises with fresh video URLs
        const updated = exercises.map((ex: any) => {
          const freshVideoUrl = videoMap.get(ex.name?.toLowerCase());
          if (freshVideoUrl) {
            return { ...ex, videoUrl: freshVideoUrl };
          }
          return ex;
        });
        
        setRefreshedExercises(updated);
        console.log(`📹 WorkoutDetails: Refreshed ${videoMap.size} video URLs`);
      }
    } catch (error) {
      console.error('Error refreshing exercise videos:', error);
    }
  };
  
  // Refresh videos when workout changes
  useEffect(() => {
    // Use the helper to check if exercises exist in any structure
    const exercises = getWorkoutExercises(currentWorkout);
    if (exercises.length > 0) {
      refreshExerciseVideos(currentWorkout);
    }
  }, [currentWorkout?.id, currentWorkoutIndex]);
  
  // Use refreshed exercises if available, otherwise fall back to original
  const displayExercises = refreshedExercises.length > 0 ? refreshedExercises : getWorkoutExercises(currentWorkout);
  
  // Find the completed workout to get actual duration
  const completedWorkout = completedWorkouts.find(
    (cw: any) => cw.id === currentWorkout?.id || 
    (cw.date && currentWorkout?.date && new Date(cw.date).toDateString() === new Date(currentWorkout.date).toDateString())
  );
  const actualDuration = completedWorkout?.duration || currentWorkout?.duration || 45;
  
  const isPast = currentWorkout ? isPastWorkout(currentWorkoutDate) : false;
  const isFuture = currentWorkout ? isFutureWorkout(currentWorkoutDate) : false;
  
  useEffect(() => {
    if (visible) {
      if (selectedFullDate) {
        const index = getWorkoutIndexByDate(selectedFullDate);
        setCurrentWorkoutIndex(index >= 0 ? index : 0);
      } else if (initialDayIndex !== undefined) {
        setCurrentWorkoutIndex(initialDayIndex);
      } else {
        const todayIndex = getTodayDayIndex();
        setCurrentWorkoutIndex(todayIndex >= 0 ? todayIndex : 0);
      }
      setExpandedExerciseIndex(null);
      setWorkoutSummary(null);
    }
  }, [visible, initialDayIndex, selectedFullDate]);
  
  // Fetch summary when viewing a completed workout
  useEffect(() => {
    if (visible && currentWorkout?.completed && currentWorkout?.id) {
      fetchWorkoutSummary(currentWorkout.id);
    }
  }, [visible, currentWorkout?.id, currentWorkout?.completed, fetchWorkoutSummary]);
  
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
          handlePreviousDay();
        } else if (gestureState.dx < -80) {
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
  
  // Handle start workout button
  const handleStartWorkoutPress = () => {
    // Check if this is an external activity (like Boxing)
    if (currentWorkout?.type === 'external_activity') {
      setExternalActivityModalVisible(true);
      return;
    }
    
    if (isPast && !currentWorkout?.completed) {
      // Show friendly message for past workouts
      setAlertConfig({
        visible: true,
        type: 'info',
        title: 'Previous Day',
        message: "This is a previous day now. 📅\n\nWant to catch up or adjust your schedule? Ask the AI Coach for help!",
        buttons: [
          { text: 'Cancel', style: 'cancel', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) },
          { text: 'Ask Coach', onPress: () => {
            setAlertConfig(prev => ({ ...prev, visible: false }));
            onClose();
            openChat("I missed yesterday's workout. Can I still do it or should I move on?");
          }}
        ]
      });
      return;
    }
    
    if (isFuture) {
      const workoutDay = new Date(currentWorkoutDate).toLocaleDateString('en-US', { weekday: 'long' });
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      setAlertConfig({
        visible: true,
        type: 'info',
        title: 'Future Workout',
        message: "Want to do this workout today? 🗓️\n\nAsk the AI Coach to swap your workout days!",
        buttons: [
          { text: 'Cancel', style: 'cancel', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) },
          { text: 'Ask Coach', onPress: () => {
            setAlertConfig(prev => ({ ...prev, visible: false }));
            onClose();
            openChat(`I want to swap ${workoutDay}'s workout with ${today}. Can we do that?`);
          }}
        ]
      });
      return;
    }
    
    // Check if today's workout is already completed - let them view it
    if (currentWorkout?.completed) {
      // For completed workouts, just close and go to workout hub to view summary
      if (currentWorkout) {
        setCurrentWorkout(currentWorkout);
      }
      onStartWorkout(); // This will navigate to workout hub to view completed workout
      return;
    }
    
    // Today's workout - proceed normally
    if (currentWorkout) {
      setCurrentWorkout(currentWorkout);
    }
    onStartWorkout();
  };
  
  // Handle external activity completion
  const handleExternalActivityComplete = async (log: ExternalActivityLog) => {
    try {
      // Mark the external activity as completed
      const completedWorkout = {
        ...currentWorkout,
        completed: true,
        completedAt: log.completedAt,
        duration: log.duration,
        intensity: log.intensity,
        enjoyment: log.enjoyment,
        overview: log.overview,
        externalActivityLog: log,
        // Estimate calories based on intensity and duration
        caloriesBurn: Math.round(log.duration * (log.intensity === 'hard' ? 10 : log.intensity === 'moderate' ? 7 : 4)),
      };
      
      await updateWorkoutInWeek(currentWorkoutIndex, completedWorkout);
      setExternalActivityModalVisible(false);
      
      // Show success message
      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Activity Logged! 💪',
        message: `Great job completing ${log.activityName}! ${log.duration} minutes of ${log.intensity} intensity training logged.`,
        buttons: [{ text: 'Done', onPress: () => {
          setAlertConfig(prev => ({ ...prev, visible: false }));
          onClose();
        }}]
      });
    } catch (error) {
      console.error('Error logging external activity:', error);
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to log activity. Please try again.',
        buttons: [{ text: 'OK', onPress: () => setAlertConfig(prev => ({ ...prev, visible: false })) }]
      });
    }
  };
  
  const warmupExercises = displayExercises.filter((e: any) => e.category === 'warmup') || [];
  const mainExercises = displayExercises.filter((e: any) => e.category === 'main') || [];
  const cooldownExercises = displayExercises.filter((e: any) => e.category === 'cooldown') || [];
  
  if (!visible) return null;
  
  // Determine header gradient colors based on workout status
  const isCompleted = currentWorkout?.completed;
  const headerGradientColors = isCompleted 
    ? [COLORS.completedGradientStart, COLORS.completedGradientEnd] as const
    : [COLORS.gradientStart, COLORS.gradientEnd] as const;
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.modalWrapper}>
          <LinearGradient
            colors={headerGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.headerLabel}>
                {currentWorkout?.completed ? 'Workout Completed' : 'Workout Details'}
              </Text>
              {currentWorkout?.completed && (
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              )}
            </View>
            <View style={styles.placeholder} />
          </View>
          
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
              {isPast && <Text style={styles.pastLabel}>Past</Text>}
              {isFuture && <Text style={styles.futureLabel}>Upcoming</Text>}
            </View>
            
            <TouchableOpacity 
              style={[styles.navButton, currentWorkoutIndex >= weekWorkouts.length - 1 && styles.navButtonDisabled]} 
              onPress={handleNextDay}
              disabled={currentWorkoutIndex >= weekWorkouts.length - 1}
            >
              <Ionicons name="chevron-forward" size={24} color={currentWorkoutIndex >= weekWorkouts.length - 1 ? "rgba(255,255,255,0.3)" : "#FFFFFF"} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.workoutTitle}>{currentWorkout?.title || 'Workout'}</Text>
          
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
              <Text style={styles.statText}>{displayExercises.length || 0} exercises</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="flame-outline" size={20} color="#FFFFFF" />
              <Text style={styles.statText}>{currentWorkout?.caloriesBurn || 300} cal</Text>
            </View>
          </View>
          )}
        </LinearGradient>
        
        <Animated.View
          style={[styles.content, { transform: [{ translateX: swipeX }] }]}
          {...panResponder.panHandlers}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
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
                
                <TouchableOpacity 
                  style={styles.restDayCoachButton}
                  onPress={() => {
                    onClose();
                    openChat("It's my rest day but I'm feeling energetic. Can you suggest something light I could do?");
                  }}
                >
                  <LinearGradient
                    colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                    style={styles.restDayCoachGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
                    <Text style={styles.restDayCoachText}>Feeling energetic?</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : currentWorkout?.type === 'external_activity' ? (
              /* External Activity Content (Boxing, Classes, etc.) */
              <View style={styles.externalActivityContent}>
                <View style={styles.externalActivityIcon}>
                  <Ionicons name="fitness" size={48} color={COLORS.gradientStart} />
                </View>
                <Text style={styles.externalActivityTitle}>{currentWorkout?.activityName || currentWorkout?.title}</Text>
                <Text style={styles.externalActivitySubtitle}>
                  {currentWorkout?.activityIntensity === 'hard' ? '🔥 Hard' : currentWorkout?.activityIntensity === 'moderate' ? '💪 Moderate' : '🌱 Light'} intensity
                </Text>
                
                <View style={styles.externalActivityInfo}>
                  <Text style={styles.externalActivityDescription}>
                    {currentWorkout?.overview || `This is your scheduled ${currentWorkout?.activityName || 'activity'} day. When you're done, tap the button below to log how it went.`}
                  </Text>
                </View>
                
                {currentWorkout?.completed && currentWorkout?.externalActivityLog && (
                  <View style={styles.externalActivitySummary}>
                    <Text style={styles.externalActivitySummaryTitle}>Activity Summary</Text>
                    <View style={styles.externalActivitySummaryRow}>
                      <View style={styles.externalActivityStat}>
                        <Text style={styles.externalActivityStatValue}>{currentWorkout.externalActivityLog.duration}</Text>
                        <Text style={styles.externalActivityStatLabel}>minutes</Text>
                      </View>
                      <View style={styles.externalActivityStat}>
                        <Text style={styles.externalActivityStatValue}>{currentWorkout.caloriesBurn || '-'}</Text>
                        <Text style={styles.externalActivityStatLabel}>cal</Text>
                      </View>
                      <View style={styles.externalActivityStat}>
                        <Text style={styles.externalActivityStatValue}>
                          {['😫', '😐', '🙂', '😊', '🔥'][currentWorkout.externalActivityLog.enjoyment - 1] || '🙂'}
                        </Text>
                        <Text style={styles.externalActivityStatLabel}>enjoyment</Text>
                      </View>
                    </View>
                    {currentWorkout.externalActivityLog.overview && (
                      <Text style={styles.externalActivityNote}>{currentWorkout.externalActivityLog.overview}</Text>
                    )}
                  </View>
                )}
                
                <TouchableOpacity 
                  style={styles.restDayCoachButton}
                  onPress={() => {
                    onClose();
                    openChat(`I'm about to do ${currentWorkout?.activityName || 'my activity'}. Any tips or things I should focus on?`);
                  }}
                >
                  <LinearGradient
                    colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                    style={styles.restDayCoachGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
                    <Text style={styles.restDayCoachText}>Ask Coach for tips</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {currentWorkout?.completed ? (
                  <View style={styles.summaryContainer}>
                    {/* Summary Header Card */}
                    <View style={styles.summaryHeaderCard}>
                      <View style={styles.summaryHeaderTop}>
                        <View style={styles.summaryIconCircle}>
                          <Ionicons name="checkmark" size={28} color={COLORS.success} />
                        </View>
                        <View style={styles.summaryHeaderText}>
                          <Text style={styles.summaryGreatJob}>Great Job! 💪</Text>
                          <Text style={styles.summaryCompletedDate}>
                            Completed {new Date(currentWorkout.completedAt || currentWorkout.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Stats Row */}
                      <View style={styles.summaryStatsRow}>
                        <View style={styles.summaryStatCard}>
                          <Ionicons name="time-outline" size={22} color={COLORS.accent} />
                          <Text style={styles.summaryStatValue}>{actualDuration}</Text>
                          <Text style={styles.summaryStatLabel}>minutes</Text>
                        </View>
                        <View style={styles.summaryStatCard}>
                          <Ionicons name="barbell-outline" size={22} color={COLORS.accent} />
                          <Text style={styles.summaryStatValue}>{workoutSummary?.stats?.exerciseCount || workoutSummary?.exercises?.length || displayExercises.length || 0}</Text>
                          <Text style={styles.summaryStatLabel}>exercises</Text>
                        </View>
                        <View style={styles.summaryStatCard}>
                          <Ionicons name="trending-up-outline" size={22} color={COLORS.accent} />
                          <Text style={styles.summaryStatValue}>{workoutSummary?.stats?.totalVolume ? (workoutSummary.stats.totalVolume >= 1000 ? Math.round(workoutSummary.stats.totalVolume / 1000) + 'k' : workoutSummary.stats.totalVolume) : 0}</Text>
                          <Text style={styles.summaryStatLabel}>volume (kg)</Text>
                        </View>
                      </View>
                    </View>
                    
                    {/* Exercise Summary List */}
                    <Text style={styles.exerciseSummaryTitle}>Exercises Completed</Text>
                    
                    {summaryLoading ? (
                      <ActivityIndicator size="small" color={COLORS.accent} style={{ marginTop: 20 }} />
                    ) : workoutSummary?.exercises?.length > 0 ? (
                      workoutSummary.exercises.map((ex: any, idx: number) => (
                        <TouchableOpacity 
                          key={ex.exerciseId + idx} 
                          style={styles.exerciseSummaryCard}
                          activeOpacity={0.7}
                          onPress={() => openExerciseDetail(ex.exerciseId)}
                        >
                          <View style={styles.exerciseSummaryLeft}>
                            <Text style={styles.exerciseSummaryName}>{ex.exerciseName}</Text>
                            <Text style={styles.exerciseSummaryMeta}>
                              {ex.sets?.length || 0} sets • Best: {ex.todayMax || 0}kg
                            </Text>
                            {/* Show individual set breakdown */}
                            {ex.sets?.length > 0 && (
                              <View style={styles.setBreakdown}>
                                {ex.sets.slice(0, 4).map((set: any, setIdx: number) => (
                                  <Text key={setIdx} style={styles.setBreakdownText}>
                                    Set {set.setNumber}: {set.weight}kg × {set.reps}
                                  </Text>
                                ))}
                                {ex.sets.length > 4 && (
                                  <Text style={styles.setBreakdownText}>+{ex.sets.length - 4} more sets</Text>
                                )}
                              </View>
                            )}
                          </View>
                          <View style={styles.exerciseSummaryRight}>
                            {ex.isPR && (
                              <View style={styles.prBadge}>
                                <Text style={styles.prBadgeText}>PR! 🎉</Text>
                              </View>
                            )}
                            <Text style={styles.exerciseVolume}>{ex.totalVolume}kg</Text>
                            <Text style={styles.exerciseVolumeLabel}>volume</Text>
                            <View style={styles.viewDetailHint}>
                              <Ionicons name="chevron-forward" size={16} color={COLORS.mediumGray} />
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : (
                      // Fall back to showing exercises from workout data
                      displayExercises.map((ex: any, idx: number) => (
                        <View key={idx} style={styles.exerciseSummaryCard}>
                          <View style={styles.exerciseSummaryLeft}>
                            <Text style={styles.exerciseSummaryName}>{ex.name}</Text>
                            <Text style={styles.exerciseSummaryMeta}>
                              {ex.sets} sets × {ex.reps} reps
                            </Text>
                          </View>
                          <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                        </View>
                      ))
                    )}
                  </View>
                ) : (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Overview</Text>
                    <Text style={styles.overviewText}>
                      {currentWorkout?.overview || 'Complete workout designed for your fitness level.'}
                    </Text>
                  </View>
                )}
            
            {/* Only show exercise sections for non-completed workouts */}
            {!currentWorkout?.completed && warmupExercises.length > 0 && (
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
            
            {!currentWorkout?.completed && mainExercises.length > 0 && (
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
            
            {!currentWorkout?.completed && cooldownExercises.length > 0 && (
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
        
        {/* Only show footer buttons for non-rest days that are NOT completed */}
        {!currentWorkout?.isRestDay && !currentWorkout?.completed && (
        <View style={styles.footer}>
          {/* For external activities, show different flow */}
          {currentWorkout?.type === 'external_activity' ? (
            <TouchableOpacity 
              style={[styles.startButton, { flex: 1 }]} 
              onPress={handleStartWorkoutPress}
            >
              <LinearGradient
                colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.startButtonGradient}
              >
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                <Text style={styles.startButtonText}>Did you complete it?</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.editButton} onPress={() => setEditModalVisible(true)}>
                <View style={styles.editButtonContent}>
                  <Ionicons name="create-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.editButtonText}>Edit</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.startButton} 
                onPress={handleStartWorkoutPress}
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
            </>
          )}
        </View>
        )}
        </View>
      </View>
      
      <EditWorkoutModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        workout={currentWorkout}
        onSaveWorkout={async (updated) => {
          await updateWorkoutInWeek(currentWorkoutIndex, updated);
          setEditModalVisible(false);
        }}
      />
      
      {/* External Activity Modal */}
      <ExternalActivityModal
        visible={externalActivityModalVisible}
        onClose={() => setExternalActivityModalVisible(false)}
        onComplete={handleExternalActivityComplete}
        activityName={currentWorkout?.activityName || currentWorkout?.title || 'Activity'}
        activityIntensity={currentWorkout?.activityIntensity || 'moderate'}
      />
      
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
      
      {/* Exercise Stats Detail Modal */}
      <ExerciseStatsModal
        visible={exerciseStatsVisible}
        onClose={() => {
          setExerciseStatsVisible(false);
          setSelectedExerciseId(undefined);
          setCurrentWorkoutId(undefined);
          setThisWorkoutExerciseData(null);
        }}
        initialExerciseId={selectedExerciseId}
        currentWorkoutId={currentWorkoutId}
        thisWorkoutData={thisWorkoutExerciseData}
      />
    </Modal>
  );
}

// Helper function to get equipment alternatives for an exercise
function getEquipmentAlternatives(exerciseName: string): string | null {
  const nameLower = exerciseName.toLowerCase();
  
  // Define equipment alternatives for common exercises
  const alternatives: { [key: string]: string } = {
    'barbell squat': 'Also try with: dumbbells, machine, Smith machine',
    'barbell bench press': 'Also try with: dumbbells, cable, machine',
    'barbell deadlift': 'Also try with: dumbbells, trap bar, kettlebells',
    'barbell row': 'Also try with: dumbbells, cable, machine',
    'barbell curl': 'Also try with: dumbbells, EZ bar, cable',
    'barbell overhead press': 'Also try with: dumbbells, machine, landmine',
    'dumbbell bench press': 'Also try with: barbell, cable, machine',
    'dumbbell squat': 'Also try with: barbell, goblet (kettlebell), leg press',
    'lat pulldown': 'Also try with: pull-ups, resistance bands',
    'leg press': 'Also try with: squats, lunges, hack squat',
    'cable fly': 'Also try with: dumbbells, machine, resistance bands',
    'tricep pushdown': 'Also try with: dumbbells, barbell, bodyweight dips',
    'bicep curl': 'Also try with: barbell, cable, resistance bands',
  };
  
  // Check for matches
  for (const [key, value] of Object.entries(alternatives)) {
    if (nameLower.includes(key) || key.includes(nameLower)) {
      return value;
    }
  }
  
  // Generic alternatives based on equipment in name
  if (nameLower.includes('barbell')) return 'Also try with: dumbbells, machine, cable';
  if (nameLower.includes('dumbbell')) return 'Also try with: barbell, cable, machine';
  if (nameLower.includes('machine')) return 'Also try with: free weights, cable, bodyweight';
  if (nameLower.includes('cable')) return 'Also try with: dumbbells, resistance bands';
  
  return null;
}

function ExerciseCard({ exercise, index, isExpanded, onToggle }: any) {
  const alternatives = getEquipmentAlternatives(exercise.name);
  
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
          {/* Equipment alternatives suggestion */}
          {alternatives && (
            <View style={styles.alternativesContainer}>
              <Ionicons name="swap-horizontal-outline" size={12} color={COLORS.accent} />
              <Text style={styles.alternativesText}>{alternatives}</Text>
            </View>
          )}
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.mediumGray}
        />
      </TouchableOpacity>
      
      {isExpanded && (
        isValidVideoUrl(exercise.videoUrl) ? (
          <View style={styles.videoContainer}>
            <PreviewVideoPlayer
              videoUrl={exercise.videoUrl}
              exerciseName={exercise.name}
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
  container: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalWrapper: { 
    flex: 1, 
    backgroundColor: COLORS.background, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    marginTop: 50, // Leave some space at top
    overflow: 'hidden',
  },
  header: { paddingTop: 24, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  headerLabel: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  placeholder: { width: 40 },
  dayNavigation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  navButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  dayInfo: { marginHorizontal: 30, alignItems: 'center' },
  dayName: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  dateText: { fontSize: 14, fontWeight: '500', color: 'rgba(255, 255, 255, 0.8)' },
  pastLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)', marginTop: 4 },
  futureLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)', marginTop: 4 },
  workoutTitle: { fontSize: 20, fontWeight: '600', color: '#FFFFFF', textAlign: 'center', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  statDivider: { width: 1, height: 16, backgroundColor: 'rgba(255, 255, 255, 0.3)', marginHorizontal: 16 },
  navButtonDisabled: { opacity: 0.3 },
  restDayBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 },
  restDayText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  restDayContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 60 },
  restDayTitle: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginTop: 24, marginBottom: 12 },
  restDayDescription: { fontSize: 16, color: COLORS.mediumGray, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  restDayTips: { width: '100%', gap: 16 },
  tipItem: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: COLORS.lightGray, padding: 16, borderRadius: 12 },
  tipText: { fontSize: 16, fontWeight: '500', color: COLORS.text },
  restDayCoachButton: { 
    marginTop: 32, 
    borderRadius: 16, 
    overflow: 'hidden', 
    elevation: 4, 
    shadowColor: COLORS.gradientStart, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 4 
  },
  restDayCoachGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    paddingHorizontal: 24, 
    gap: 8 
  },
  restDayCoachText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#FFFFFF' 
  },
  // External Activity Styles
  externalActivityContent: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 32, 
    paddingTop: 40 
  },
  externalActivityIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.gradientStart}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  externalActivityTitle: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: COLORS.text, 
    marginTop: 20, 
    marginBottom: 8 
  },
  externalActivitySubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.mediumGray,
    marginBottom: 24,
  },
  externalActivityInfo: {
    width: '100%',
    backgroundColor: COLORS.lightGray,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  externalActivityDescription: { 
    fontSize: 15, 
    color: COLORS.text, 
    textAlign: 'center', 
    lineHeight: 22 
  },
  externalActivitySummary: {
    width: '100%',
    backgroundColor: `${COLORS.gradientStart}10`,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${COLORS.gradientStart}20`,
    marginBottom: 20,
  },
  externalActivitySummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gradientStart,
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  externalActivitySummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  externalActivityStat: {
    alignItems: 'center',
  },
  externalActivityStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  externalActivityStatLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  externalActivityNote: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  
  // New Summary Styles
  summaryContainer: { paddingHorizontal: 20, marginTop: 20 },
  summaryHeaderCard: { backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 20, marginBottom: 20 },
  summaryHeaderTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  summaryIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: `${COLORS.success}15`, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  summaryHeaderText: { flex: 1 },
  summaryGreatJob: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  summaryCompletedDate: { fontSize: 14, color: COLORS.mediumGray, marginTop: 4 },
  summaryStatsRow: { flexDirection: 'row', gap: 10 },
  summaryStatCard: { flex: 1, backgroundColor: COLORS.background, borderRadius: 14, padding: 14, alignItems: 'center' },
  summaryStatValue: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginTop: 6 },
  summaryStatLabel: { fontSize: 12, color: COLORS.mediumGray, marginTop: 2 },
  exerciseSummaryTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  exerciseSummaryCard: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 16, marginBottom: 10 },
  exerciseSummaryLeft: { flex: 1 },
  exerciseSummaryName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  exerciseSummaryMeta: { fontSize: 13, color: COLORS.mediumGray, marginTop: 4 },
  setBreakdown: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.lightGray },
  setBreakdownText: { fontSize: 12, color: COLORS.mediumGray, marginBottom: 2 },
  viewDetailHint: { marginTop: 8 },
  exerciseSummaryRight: { alignItems: 'flex-end' },
  prBadge: { backgroundColor: `${COLORS.warning}20`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 4 },
  prBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.warning },
  exerciseVolume: { fontSize: 18, fontWeight: '700', color: COLORS.accent },
  exerciseVolumeLabel: { fontSize: 11, color: COLORS.mediumGray },
  
  content: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  overviewText: { fontSize: 15, lineHeight: 22, color: COLORS.mediumGray },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.lightGray, borderRadius: 20 },
  categoryText: { fontSize: 14, fontWeight: '600', color: COLORS.gradientStart },
  exerciseCount: { fontSize: 13, fontWeight: '500', color: COLORS.mediumGray },
  exerciseCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  exerciseDetails: { flexDirection: 'row', gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, color: COLORS.mediumGray },
  alternativesContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: `${COLORS.accent}10`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  alternativesText: { fontSize: 12, color: COLORS.accent, fontStyle: 'italic', flex: 1 },
  videoContainer: { marginTop: 12, borderRadius: 12, overflow: 'hidden' },
  noVideoContainer: { height: 120, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.lightGray },
  noVideoText: { fontSize: 14, color: COLORS.mediumGray, marginTop: 8 },
  footer: { padding: 20, paddingBottom: 40, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.lightGray, flexDirection: 'row', gap: 12 },
  editButton: { flex: 1, borderRadius: 16, backgroundColor: COLORS.cardBg, borderWidth: 2, borderColor: COLORS.primary },
  editButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 8 },
  editButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  startButton: { flex: 1, borderRadius: 16, overflow: 'hidden', elevation: 8, shadowColor: COLORS.gradientStart, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  startButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 12 },
  startButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
