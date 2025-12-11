import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppHeader } from '../../src/components/AppHeader';
import { WorkoutDetailsModal } from '../../src/components/WorkoutDetailsModal';
import { PersonalBestChart } from '../../src/components/PersonalBestChart';
import { AdvancedQuestionnaireModal, AdvancedQuestionnaireData } from '../../src/components/AdvancedQuestionnaireModal';
import { WeeklyScheduleCheckModal } from '../../src/components/WeeklyScheduleCheckModal';
import { useWorkoutStore } from '../../src/stores/workout-store';
import { useAuthStore } from '../../src/stores/auth-store';
import { useCoachStore } from '../../src/stores/coach-store';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { COLORS, CARD_SHADOW } from '../../src/constants/colors';
import { OnboardingTour } from '../../src/components/OnboardingTour';
import { useTour } from '../../src/hooks/useTour';

// Activity cards with vibrant gradients
const ACTIVITY_CARDS = [
  { id: 1, icon: 'trophy', title: 'New PR!', subtitle: 'Bench: 225 lbs', gradient: ['#5B8DEF', '#34C4E5'], action: 'stats' },
  { id: 2, icon: 'people', title: '3 Followers', subtitle: 'Sarah, Mike, Alex', gradient: ['#34C759', '#00C7BE'], action: 'profile' },
  { id: 3, icon: 'flame', title: '7 Day Streak', subtitle: 'Keep it going!', gradient: ['#FF3B30', '#FF9500'], action: 'stats' },
  { id: 4, icon: 'barbell', title: 'Last Workout', subtitle: 'Upper Body', gradient: ['#A22BF6', '#FF4EC7'], action: 'workouts' },
  { id: 5, icon: 'star', title: 'Achievement', subtitle: '100 Workouts', gradient: ['#FFD60A', '#FFED4E'], action: 'awards' },
  { id: 6, icon: 'timer', title: 'Best Time', subtitle: '45 min', gradient: ['#FF6B35', '#FFD60A'], action: 'stats' },
];

const AI_QUOTES = [
  "You're 15% stronger than last month!\nKeep crushing it! 💪",
  "7 day streak! Consistency is key!\nProud of you!",
  "Your form improved 20%!\nGains are coming!",
  "3 PRs this week!\nYou're unstoppable! 🔥",
];

// Progress Ring with SVG for proper arc rendering
const ProgressRing = ({ label, progress, colors, size = 70, onPress, details }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <TouchableOpacity style={styles.ringContainer} onPress={onPress}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={styles.svg}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={COLORS.lightGray}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#grad)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
          <Defs>
            <SvgLinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={colors[0]} />
              <Stop offset="100%" stopColor={colors[1]} />
            </SvgLinearGradient>
          </Defs>
        </Svg>
        <View style={[styles.ringCenter, { width: size, height: size }]}>
          <Text style={[styles.ringPercentage, { fontSize: size > 80 ? 20 : 16 }]}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
      </View>
      <Text style={styles.ringLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [ringDetailsVisible, setRingDetailsVisible] = useState(null);
  const [chartModalVisible, setChartModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const scrollX = useMemo(() => new Animated.Value(0), []);
  
  // Advanced Questionnaire state
  const [showAdvancedQuestionnaire, setShowAdvancedQuestionnaire] = useState(false);
  const [showWeeklyScheduleCheck, setShowWeeklyScheduleCheck] = useState(false);
  const [hasCheckedQuestionnaire, setHasCheckedQuestionnaire] = useState(false);
  
  // Tour refs for highlighting
  const todayWorkoutRef = useRef(null);

  const { user } = useAuthStore();
  const { openChat } = useCoachStore();
  const {
    showTour,
    currentStep,
    tourSteps,
    registerElement,
    updateStepPosition,
    nextStep,
    skipTour,
    completeTour,
  } = useTour();
  // Subscribe to specific store slices for better reactivity
  const todayWorkout = useWorkoutStore(state => state.todayWorkout);
  const weekWorkouts = useWorkoutStore(state => state.weekWorkouts);
  const completedWorkouts = useWorkoutStore(state => state.completedWorkouts);
  const stats = useWorkoutStore(state => state.stats);
  const personalBests = useWorkoutStore(state => state.personalBests);
  const isLoading = useWorkoutStore(state => state.isLoading);
  const fetchTodayWorkout = useWorkoutStore(state => state.fetchTodayWorkout);
  const fetchWeekWorkouts = useWorkoutStore(state => state.fetchWeekWorkouts);
  const fetchStats = useWorkoutStore(state => state.fetchStats);
  const fetchPersonalBests = useWorkoutStore(state => state.fetchPersonalBests);
  const fetchCompletedWorkouts = useWorkoutStore(state => state.fetchCompletedWorkouts);
  const forceRegenerateWeek = useWorkoutStore(state => state.forceRegenerateWeek);

  // Check if user should see Advanced Questionnaire - ONLY for truly new users
  const checkAdvancedQuestionnaire = useCallback(async () => {
    if (hasCheckedQuestionnaire) return;
    
    try {
      // Check if questionnaire was already completed or skipped
      const completed = await AsyncStorage.getItem('advancedQuestionnaire');
      const skipped = await AsyncStorage.getItem('advancedQuestionnaireSkipped');
      
      // Determine if user is truly new (no workouts generated, no completed workouts)
      const isNewUser = weekWorkouts.length === 0 && completedWorkouts.length === 0;
      
      // Only show for NEW users who haven't completed or skipped
      if (!completed && !skipped && isNewUser) {
        // Show questionnaire popup after a short delay
        setTimeout(() => {
          setShowAdvancedQuestionnaire(true);
        }, 1500);
      }
      
      setHasCheckedQuestionnaire(true);
    } catch (error) {
      console.error('Error checking questionnaire status:', error);
    }
  }, [weekWorkouts.length, completedWorkouts.length, hasCheckedQuestionnaire]);

  // Check for weekly schedule check (for "It depends" users)
  const checkWeeklySchedule = useCallback(async () => {
    try {
      const scheduleType = user?.trainingSchedule;
      if (scheduleType !== 'depends') return;
      
      // Check if snoozed
      const snoozed = await AsyncStorage.getItem('weeklyScheduleCheckSnoozed');
      if (snoozed) {
        const snoozeDate = new Date(snoozed);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (snoozeDate > weekAgo) return; // Still snoozed
      }
      
      // Check if it's the start of a new week (Monday)
      const today = new Date();
      if (today.getDay() === 1) { // Monday
        const lastCheck = await AsyncStorage.getItem('lastWeeklyScheduleCheck');
        const thisMonday = today.toISOString().split('T')[0];
        
        if (lastCheck !== thisMonday) {
          setShowWeeklyScheduleCheck(true);
          await AsyncStorage.setItem('lastWeeklyScheduleCheck', thisMonday);
        }
      }
    } catch (error) {
      console.error('Error checking weekly schedule:', error);
    }
  }, [user?.trainingSchedule]);

  // Run checks when screen loads
  useEffect(() => {
    checkAdvancedQuestionnaire();
    checkWeeklySchedule();
  }, [checkAdvancedQuestionnaire, checkWeeklySchedule]);

  // Handle questionnaire completion
  const handleQuestionnaireComplete = async (data: AdvancedQuestionnaireData) => {
    console.log('Advanced Questionnaire completed:', data);
    setShowAdvancedQuestionnaire(false);
    
    // TODO: Use this data to generate personalized workouts
    // The data should be sent to the AI workout generator
  };

  // Handle weekly schedule confirmation
  const handleWeeklyScheduleConfirm = async (selectedDays: string[]) => {
    console.log('Weekly schedule confirmed:', selectedDays);
    setShowWeeklyScheduleCheck(false);
    
    // Save the selected days
    await AsyncStorage.setItem('currentWeekDays', JSON.stringify(selectedDays));
    
    // TODO: Use these days to adjust the workout schedule
  };

  // Generate dynamic activity cards
  const dynamicActivityCards = React.useMemo(() => {
    const cards = [];
    
    // Current streak
    if (stats?.streaks?.current > 0) {
      cards.push({
        id: 'streak',
        icon: 'flame',
        title: `${stats.streaks.current} Day Streak`,
        subtitle: 'Keep it going!',
        gradient: ['#FF3B30', '#FF9500'],
        action: 'stats'
      });
    }
    
    // Last completed workout
    if (completedWorkouts.length > 0) {
      const lastWorkout = completedWorkouts[0];
      cards.push({
        id: 'last-workout',
        icon: 'barbell',
        title: 'Last Workout',
        subtitle: lastWorkout.title || 'View Details',
        gradient: ['#A22BF6', '#FF4EC7'],
        action: 'workouts'
      });
    }
    
    // Workouts this week
    const thisWeekCompleted = completedWorkouts.filter(w => {
      const wDate = new Date(w.completedAt || w.date);
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      return wDate >= weekStart;
    }).length;
    
    if (thisWeekCompleted > 0) {
      cards.push({
        id: 'week-count',
        icon: 'checkmark-circle',
        title: `${thisWeekCompleted} Workouts`,
        subtitle: 'This week',
        gradient: ['#34C759', '#00C7BE'],
        action: 'stats'
      });
    }
    
    // If no activity, show motivational card
    if (cards.length === 0) {
      cards.push({
        id: 'start',
        icon: 'rocket',
        title: 'Start Your Journey',
        subtitle: 'Complete your first workout!',
        gradient: ['#5B8DEF', '#34C4E5'],
        action: 'workouts'
      });
    }
    
    return cards;
  }, [stats, completedWorkouts]);
  // Force re-render key when stats change
  const [statsVersion, setStatsVersion] = useState(0);

  const loadAllData = async () => {
    await Promise.all([
      fetchTodayWorkout(),
      fetchWeekWorkouts(), // Generate full week of workouts
      fetchStats(),
      fetchPersonalBests(),
      fetchCompletedWorkouts(),
    ]);
    setStatsVersion(v => v + 1); // Force re-render after data loads
  };

  useEffect(() => {
    console.log('📱 [HOME] App starting...');
    console.log('📱 [HOME] EXPO_PUBLIC_API_BASE_URL:', process.env.EXPO_PUBLIC_API_BASE_URL);
    loadAllData();
  }, []);
  
  // Compute completed count for dependency tracking
  const weeklyCompletedCount = useMemo(() => 
    weekWorkouts.filter(w => w.completed).length, 
  [weekWorkouts]);
  
  // Auto-update stats when completed workouts or weekWorkouts change
  useEffect(() => {
    console.log('📊 [HOME] Workouts changed - completedWorkouts:', completedWorkouts.length, 'weekWorkouts completed:', weeklyCompletedCount);
    // Only refetch stats, not workouts (to avoid regeneration)
    fetchStats().then(() => {
      setStatsVersion(v => v + 1); // Force re-render after stats update
    });
  }, [completedWorkouts.length, weeklyCompletedCount]);
  
  // Refresh stats when screen comes into focus (after completing workout)
  useFocusEffect(
    React.useCallback(() => {
      console.log('📊 [HOME] Screen focused - refreshing stats');
      fetchStats().then(() => {
        setStatsVersion(v => v + 1);
      });
    }, [])
  );
  
  // Get today's actual workout from weekWorkouts (most accurate source)
  const actualTodayWorkout = useMemo(() => {
    const today = new Date().toDateString();
    const fromWeek = weekWorkouts.find(w => new Date(w.date).toDateString() === today);
    return fromWeek || todayWorkout;
  }, [weekWorkouts, todayWorkout]);
  
  // Compute workout count for display to ensure accuracy
  const displayStats = useMemo(() => ({
    weeklyWorkouts: stats?.weeklyWorkouts || 0,
    weeklyGoal: stats?.weeklyGoal || 5,
    currentStreak: stats?.currentStreak || 0,
    weeklyMinutes: stats?.weeklyMinutes || 0,
    weeklyMinutesGoal: stats?.weeklyMinutesGoal || 225,
    totalWorkouts: stats?.totalWorkouts || 0,
    totalMinutes: stats?.totalMinutes || 0,
  }), [stats, statsVersion]);
  
  // Register tour elements and update positions
  useEffect(() => {
    if (showTour && todayWorkoutRef.current) {
      registerElement('home-workout', todayWorkoutRef);
      // Update position for the workout card step
      setTimeout(() => {
        updateStepPosition('home-workout', 'home-workout');
      }, 500);
    }
  }, [showTour, isLoading]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleStartWorkout = () => {
    setModalVisible(false);
    router.push('/workout-hub');
  };

  const showRingDetails = (label) => {
    setRingDetailsVisible(label);
    setTimeout(() => setRingDetailsVisible(null), 3000);
  };
  
  const handleTourNavigation = (stepId) => {
    console.log('🎯 Tour navigation:', stepId);
    
    if (stepId === 'tap-workouts-tab') {
      // Navigate to workouts tab
      router.push('/(tabs)/workouts');
      setTimeout(() => nextStep(), 300);
    }
  };
  
  // Watch for tour step changes and trigger actions
  useEffect(() => {
    if (!showTour) return;
    
    console.log('🎯 Tour step:', currentStep);
    
    switch (currentStep) {
      case 7:
        // Close any modals, navigate to stats
        console.log('Going to stats');
        setModalVisible(false);
        setTimeout(() => router.push('/(tabs)/stats'), 500);
        break;
        
      case 8:
        // Navigate to awards
        console.log('Going to awards');
        setTimeout(() => router.push('/(tabs)/awards'), 500);
        break;
        
      case 9:
        // Back to home for completion
        console.log('Back to home');
        setTimeout(() => router.push('/(tabs)/'), 500);
        break;
    }
  }, [currentStep, showTour]);

  const handleActivityCardPress = (action) => {
    switch (action) {
      case 'stats':
        router.push('/(tabs)/stats');
        break;
      case 'awards':
        router.push('/(tabs)/awards');
        break;
      case 'workouts':
        router.push('/(tabs)/workouts');
        break;
      case 'profile':
        // Show "Coming Soon" for Social feature
        showAlert({
          type: 'info',
          title: '👥 Social Coming Soon!',
          message: 'We\'re building something awesome! Social features like followers, sharing achievements, and connecting with workout buddies will be available in a future update.\n\nStay tuned!',
          buttons: [{ text: 'Got it!', onPress: hideAlert }]
        });
        break;
    }
  };

  const currentQuote = AI_QUOTES[0]; // Use first quote to avoid impure function

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader mode="fitness" />

      <WorkoutDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onStartWorkout={handleStartWorkout}
        selectedDate={23}
      />

      {selectedExercise && (
        <PersonalBestChart
          visible={!!selectedExercise}
          onClose={() => setSelectedExercise(null)}
          exercise={selectedExercise}
        />
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.gradientStart}
          />
        }
      >
        {/* Welcome Banner */}
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.welcomeBanner}
        >
          <View style={styles.bannerContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.name || 'Champion'}! 💪</Text>
            </View>
            <View style={styles.streakChips}>
              <View style={styles.streakChip}>
                <Ionicons name="flame" size={14} color={COLORS.white} />
                <Text style={styles.streakText}>{displayStats.currentStreak} day streak</Text>
              </View>
              <View style={styles.streakChip}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.white} />
                <Text style={styles.streakText}>{displayStats.totalWorkouts} workouts</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Progress Rings */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>Your Progress</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/stats')}>
              <Text style={[styles.seeAllText, { color: COLORS.gradientStart }]}>Details</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ringsContainer}>
            <ProgressRing
              label="Weekly Goal"
              progress={displayStats.weeklyGoal > 0 ? Math.min(displayStats.weeklyWorkouts / displayStats.weeklyGoal, 1) : 0}
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              size={85}
              onPress={() => showRingDetails('Weekly Goal')}
              details={{
                current: displayStats.weeklyWorkouts,
                goal: displayStats.weeklyGoal,
                unit: 'workouts'
              }}
            />
            <ProgressRing
              label="Active Minutes"
              progress={displayStats.weeklyMinutesGoal > 0 ? Math.min(displayStats.weeklyMinutes / displayStats.weeklyMinutesGoal, 1) : 0}
              colors={['#FF6B6B', '#FF8E53']}
              size={85}
              onPress={() => showRingDetails('Active Minutes')}
              details={{
                current: displayStats.weeklyMinutes,
                goal: displayStats.weeklyMinutesGoal,
                unit: 'min'
              }}
            />
            <ProgressRing
              label="Calories"
              progress={Math.min((displayStats.weeklyMinutes * 8) / 2000, 1)}
              colors={['#4ECDC4', '#44A08D']}
              size={85}
              onPress={() => showRingDetails('Calories')}
              details={{
                current: Math.round(displayStats.weeklyMinutes * 8),
                goal: 2000,
                unit: 'kcal'
              }}
            />
          </View>
          {ringDetailsVisible && (
            <View style={styles.ringDetailsPopup}>
              <Text style={styles.ringDetailsText}>
                {ringDetailsVisible === 'Weekly Goal' && `${displayStats.weeklyWorkouts} of ${displayStats.weeklyGoal} workouts`}
                {ringDetailsVisible === 'Active Minutes' && `${displayStats.weeklyMinutes} of ${displayStats.weeklyMinutesGoal} mins`}
                {ringDetailsVisible === 'Calories' && `${Math.round(displayStats.weeklyMinutes * 8)} of 2,000 kcal`}
              </Text>
            </View>
          )}
        </View>

        {/* Today's Workout - WHITE CARD */}
        <View style={styles.section}>
          <TouchableOpacity
            onLongPress={() => {
              console.log('🔄 Regenerating workouts with new AI...');
              forceRegenerateWeek();
            }}
            delayLongPress={2000}
          >
            <Text style={styles.sectionTitle}>Today&apos;s Workout</Text>
          </TouchableOpacity>
          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.gradientStart} style={{ marginTop: 20 }} />
          ) : actualTodayWorkout?.isRestDay ? (
            <View ref={todayWorkoutRef} style={styles.todayWorkoutCard}>
              <View style={styles.workoutContent}>
                <View style={styles.workoutHeader}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Ionicons name="bed" size={48} color={COLORS.mediumGray} />
                    <Text style={[styles.workoutTitle, { marginTop: 12 }]}>Rest Day</Text>
                    <Text style={styles.workoutMeta}>
                      Take time to recover. Stay hydrated! 💧
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.restDayButton}
                  onPress={() => openChat("It&apos;s my rest day but I&apos;m feeling energetic. Can you suggest something light I could do?")}
                >
                  <LinearGradient
                    colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                    style={styles.restDayGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="chatbubble-ellipses" size={18} color={COLORS.white} />
                    <Text style={styles.restDayButtonText}>Feeling energetic?</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View ref={todayWorkoutRef} style={styles.todayWorkoutCard}>
              <View style={styles.workoutContent}>
                <View style={styles.workoutHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionLabel}>TODAY&apos;S WORKOUT</Text>
                    <Text style={styles.workoutTitle}>{actualTodayWorkout?.title || 'Loading...'}</Text>
                    <Text style={styles.workoutMeta}>
                      {actualTodayWorkout?.duration || 45} min • {actualTodayWorkout?.exercises?.length || 0} exercises • {actualTodayWorkout?.difficulty || 'Intermediate'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.startButton}
                  onPress={() => setModalVisible(true)}
                >
                  <LinearGradient
                    colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                    style={styles.startGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="play" size={20} color={COLORS.white} />
                    <Text style={styles.startText}>Start Workout</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Recent Activity - LARGER CARDS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={SCREEN_WIDTH * 0.7}
            decelerationRate="fast"
            contentContainerStyle={styles.activityScrollContainer}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
          >
            {dynamicActivityCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={styles.activityCard}
                onPress={() => handleActivityCardPress(card.action)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={card.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.activityGradient}
                >
                  <Ionicons name={card.icon} size={40} color={COLORS.white} />
                  <Text style={styles.activityTitle}>{card.title}</Text>
                  <Text style={styles.activitySubtitle}>{card.subtitle}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </Animated.ScrollView>
        </View>

        {/* Log Unexpected Workout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Log Unexpected Workout</Text>
          <TouchableOpacity 
            style={styles.logWorkoutCard}
            onPress={() => openChat("I did an unexpected workout today. Can I log it?")}
          >
            <View style={styles.logWorkoutContent}>
              <View style={styles.logWorkoutIcon}>
                <Ionicons name="add-circle" size={32} color={COLORS.gradientStart} />
              </View>
              <View style={styles.logWorkoutText}>
                <Text style={styles.logWorkoutTitle}>Track Extra Activity</Text>
                <Text style={styles.logWorkoutSubtitle}>Gym session, run, or other workout you did</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Original Nutrition Card (keeping for reference, can be removed later) 
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Nutrition</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/nutrition')}>
              <Text style={[styles.seeAllText, { color: COLORS.gradientStart }]}>View All</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.nutritionCard}
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/nutrition')}
          >
            <LinearGradient
              colors={['#4CAF50', '#8BC34A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nutritionGradient}
            >
              <View style={styles.nutritionContent}>
                <View style={styles.nutritionIconContainer}>
                  <Ionicons name="nutrition" size={28} color={COLORS.white} />
                </View>
                <View style={styles.nutritionInfo}>
                  <Text style={styles.nutritionTitle}>1,820 / 2,500 kcal</Text>
                  <Text style={styles.nutritionSubtitle}>2 of 3 meals logged</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        */}

        {/* Personal Bests */}
        <View style={[styles.section, { paddingBottom: 100 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Bests</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/stats')}>
              <Text style={[styles.seeAllText, { color: COLORS.gradientStart }]}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.pbCard}>
            {/* Bench Press - Empty State */}
            <View style={styles.pbRow}>
              <View style={styles.pbIconContainer}>
                <LinearGradient
                  colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                  style={styles.pbIconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="barbell" size={24} color={COLORS.white} />
                </LinearGradient>
              </View>
              <View style={styles.pbContent}>
                <Text style={styles.pbExercise}>Bench Press</Text>
                <Text style={styles.pbMeta}>Chest & Triceps</Text>
              </View>
              <View style={styles.pbValue}>
                <Text style={styles.pbNumberEmpty}>—</Text>
                <Text style={styles.pbUnitEmpty}>Not yet</Text>
              </View>
            </View>

            <View style={styles.pbDivider} />

            {/* 5K Run - Empty State */}
            <View style={styles.pbRow}>
              <View style={styles.pbIconContainer}>
                <LinearGradient
                  colors={['#34C759', '#30B650']}
                  style={styles.pbIconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="fitness" size={24} color={COLORS.white} />
                </LinearGradient>
              </View>
              <View style={styles.pbContent}>
                <Text style={styles.pbExercise}>5K Run</Text>
                <Text style={styles.pbMeta}>Cardio</Text>
              </View>
              <View style={styles.pbValue}>
                <Text style={styles.pbNumberEmpty}>—</Text>
                <Text style={styles.pbUnitEmpty}>Not yet</Text>
              </View>
            </View>

            <View style={styles.pbDivider} />

            {/* Squat - Empty State */}
            <View style={styles.pbRow}>
              <View style={styles.pbIconContainer}>
                <LinearGradient
                  colors={['#FF9500', '#FF8C00']}
                  style={styles.pbIconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="body" size={24} color={COLORS.white} />
                </LinearGradient>
              </View>
              <View style={styles.pbContent}>
                <Text style={styles.pbExercise}>Squat</Text>
                <Text style={styles.pbMeta}>Legs</Text>
              </View>
              <View style={styles.pbValue}>
                <Text style={styles.pbNumberEmpty}>—</Text>
                <Text style={styles.pbUnitEmpty}>Not yet</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Onboarding Tour */}
      <OnboardingTour
        visible={showTour}
        steps={tourSteps}
        currentStep={currentStep}
        onNext={nextStep}
        onSkip={skipTour}
        onComplete={completeTour}
        onNavigate={handleTourNavigation}
      />
      
      {/* Advanced Questionnaire Modal */}
      <AdvancedQuestionnaireModal
        visible={showAdvancedQuestionnaire}
        onClose={() => setShowAdvancedQuestionnaire(false)}
        onComplete={handleQuestionnaireComplete}
      />
      
      {/* Weekly Schedule Check Modal */}
      <WeeklyScheduleCheckModal
        visible={showWeeklyScheduleCheck}
        onClose={() => setShowWeeklyScheduleCheck(false)}
        onConfirm={handleWeeklyScheduleConfirm}
        weekStartDate={new Date()}
        suggestedDays={user?.selectedDays || []}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  welcomeBanner: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    ...CARD_SHADOW,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  streakChips: {
    gap: 8,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  progressSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ringsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  ringContainer: {
    alignItems: 'center',
    gap: 12,
  },
  svg: {
    transform: [{ rotate: '-90deg' }],
  },
  ringCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringPercentage: {
    fontWeight: '700',
    color: COLORS.text,
  },
  ringLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
  ringDetailsPopup: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'center',
    ...CARD_SHADOW,
  },
  ringDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  // WHITE CARD for today's workout
  todayWorkoutCard: {
    marginTop: 12,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    ...CARD_SHADOW,
  },
  workoutContent: {
    gap: 16,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.mediumGray,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  workoutTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  workoutMeta: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  startButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  startGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  startText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  restDayButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 16,
  },
  restDayGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  restDayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  activityScrollContainer: {
    paddingRight: 16,
  },
  // Activity cards - much smaller size (half height)
  activityCard: {
    width: SCREEN_WIDTH * 0.42,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  activityGradient: {
    padding: 14,
    minHeight: 70,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 6,
  },
  activitySubtitle: {
    fontSize: 11,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 2,
  },
  nutritionCard: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  nutritionGradient: {
    padding: 16,
  },
  nutritionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  nutritionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nutritionInfo: {
    flex: 1,
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  nutritionSubtitle: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.9,
  },
  personalBestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  personalBestCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    ...CARD_SHADOW,
  },
  personalBestExercise: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  personalBestValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gradientStart,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  logWorkoutCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: 20, 
    padding: 20, 
    borderWidth: 2, 
    borderColor: COLORS.gradientStart + '40', 
    borderStyle: 'dashed',
    ...CARD_SHADOW,
  },
  logWorkoutContent: { flexDirection: 'row', alignItems: 'center' },
  logWorkoutIcon: { marginRight: 16 },
  logWorkoutText: { flex: 1 },
  logWorkoutTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  logWorkoutSubtitle: { fontSize: 13, color: COLORS.mediumGray },
  pbCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: 16, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: COLORS.lightGray, 
    ...CARD_SHADOW,
  },
  pbRow: { flexDirection: 'row', alignItems: 'center' },
  pbIconContainer: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', marginRight: 16 },
  pbIconGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  pbContent: { flex: 1 },
  pbExercise: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  pbMeta: { fontSize: 13, color: COLORS.mediumGray },
  pbValue: { alignItems: 'flex-end' },
  pbNumber: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  pbUnit: { fontSize: 12, color: COLORS.mediumGray, marginTop: 2 },
  pbNumberEmpty: { fontSize: 24, fontWeight: '700', color: COLORS.lightGray },
  pbUnitEmpty: { fontSize: 11, color: COLORS.mediumGray, marginTop: 2, fontStyle: 'italic' },
  pbDivider: { height: 1, backgroundColor: COLORS.lightGray, marginVertical: 16 },
});