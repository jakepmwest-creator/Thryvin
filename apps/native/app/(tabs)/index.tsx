import React, { useState, useRef, useEffect } from 'react';
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
import { router } from 'expo-router';
import { AppHeader } from '../../src/components/AppHeader';
import { WorkoutDetailsModal } from '../../src/components/WorkoutDetailsModal';
import { PersonalBestChart } from '../../src/components/PersonalBestChart';
import { useWorkoutStore } from '../../src/stores/workout-store';
import { useAuthStore } from '../../src/stores/auth-store';
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
const ProgressRing = ({ label, progress, colors, size = 70, onPress }: any) => {
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
  const [ringDetailsVisible, setRingDetailsVisible] = useState<string | null>(null);
  const [chartModalVisible, setChartModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  // Tour refs for highlighting
  const todayWorkoutRef = useRef(null);

  const { user } = useAuthStore();
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
  const {
    todayWorkout,
    stats,
    personalBests,
    isLoading,
    fetchTodayWorkout,
    fetchWeekWorkouts,
    forceRegenerateWeek,
    fetchStats,
    fetchPersonalBests,
    completedWorkouts,
    weekWorkouts,
  } = useWorkoutStore();

  const loadAllData = async () => {
    await Promise.all([
      fetchTodayWorkout(),
      fetchWeekWorkouts(), // Generate full week of workouts
      fetchStats(),
      fetchPersonalBests(),
    ]);
  };

  useEffect(() => {
    console.log('📱 [HOME] App starting...');
    console.log('📱 [HOME] EXPO_PUBLIC_API_BASE_URL:', process.env.EXPO_PUBLIC_API_BASE_URL);
    loadAllData();
  }, []);
  
  // Auto-update stats when completed workouts change
  useEffect(() => {
    console.log('📊 [HOME] Completed workouts changed:', completedWorkouts.length);
    // Only refetch stats, not workouts (to avoid regeneration)
    fetchStats();
  }, [completedWorkouts.length]);
  
  // Compute workout count for display to ensure accuracy
  const displayStats = {
    weeklyWorkouts: stats?.weeklyWorkouts || 0,
    weeklyGoal: stats?.weeklyGoal || 5,
    currentStreak: stats?.currentStreak || 0,
    weeklyMinutes: stats?.weeklyMinutes || 0,
    weeklyMinutesGoal: stats?.weeklyMinutesGoal || 225,
    totalWorkouts: stats?.totalWorkouts || 0,
    totalMinutes: stats?.totalMinutes || 0,
  };
  
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

  const showRingDetails = (label: string) => {
    setRingDetailsVisible(label);
    setTimeout(() => setRingDetailsVisible(null), 3000);
  };
  
  const handleTourNavigation = (stepId: string) => {
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

  const handleActivityCardPress = (action: string) => {
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
        router.push('/(tabs)/profile');
        break;
    }
  };

  const currentQuote = AI_QUOTES[Math.floor(Math.random() * AI_QUOTES.length)];

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
                <Text style={styles.streakText}>{stats?.currentStreak || 7} day streak</Text>
              </View>
              <View style={styles.streakChip}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.white} />
                <Text style={styles.streakText}>{stats?.weeklyWorkouts || 8} workouts</Text>
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
              progress={(stats?.weeklyWorkouts || 0) / (stats?.weeklyGoal || 5)}
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              size={85}
              onPress={() => showRingDetails('Weekly Goal')}
            />
            <ProgressRing
              label="Minutes"
              progress={(stats?.weeklyMinutes || 0) / (stats?.weeklyMinutesGoal || 225)}
              colors={['#5B8DEF', '#34C4E5']}
              size={85}
              onPress={() => showRingDetails('Minutes')}
            />
            <ProgressRing
              label="Calories"
              progress={0.78}
              colors={['#FF6B35', '#FFD60A']}
              size={85}
              onPress={() => showRingDetails('Calories')}
            />
          </View>
          {ringDetailsVisible && (
            <View style={styles.ringDetailsPopup}>
              <Text style={styles.ringDetailsText}>
                {ringDetailsVisible === 'Weekly Goal' && `${stats?.weeklyWorkouts || 0} of ${stats?.weeklyGoal || 5} workouts`}
                {ringDetailsVisible === 'Minutes' && `${stats?.weeklyMinutes || 0} of ${stats?.weeklyMinutesGoal || 225} mins`}
                {ringDetailsVisible === 'Calories' && '1,820 of 2,500 kcal'}
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
            <Text style={styles.sectionTitle}>Today's Workout</Text>
          </TouchableOpacity>
          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.gradientStart} style={{ marginTop: 20 }} />
          ) : (
            <View ref={todayWorkoutRef} style={styles.todayWorkoutCard}>
              <View style={styles.workoutContent}>
                <View style={styles.workoutHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionLabel}>TODAY'S WORKOUT</Text>
                    <Text style={styles.workoutTitle}>{todayWorkout?.title || 'Loading...'}</Text>
                    <Text style={styles.workoutMeta}>
                      {todayWorkout?.duration || 45} min • {todayWorkout?.exercises?.length || 0} exercises • {todayWorkout?.difficulty || 'Intermediate'}
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
            {ACTIVITY_CARDS.map((card) => (
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
                  <Ionicons name={card.icon as any} size={40} color={COLORS.white} />
                  <Text style={styles.activityTitle}>{card.title}</Text>
                  <Text style={styles.activitySubtitle}>{card.subtitle}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </Animated.ScrollView>
        </View>

        {/* Today's Nutrition - GREEN GRADIENT */}
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

        {/* Personal Bests */}
        <View style={[styles.section, { paddingBottom: 100 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Bests</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/stats')}>
              <Text style={[styles.seeAllText, { color: COLORS.gradientStart }]}>See All</Text>
            </TouchableOpacity>
          </View>
          {personalBests.length > 0 ? (
            <View style={styles.personalBestsGrid}>
              {personalBests.slice(0, 4).map((best, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.personalBestCard}
                  onPress={() => setSelectedExercise(best)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trophy" size={24} color={COLORS.gradientStart} />
                  <Text style={styles.personalBestExercise} numberOfLines={1}>
                    {best.exercise}
                  </Text>
                  <Text style={styles.personalBestValue}>
                    {best.value} {best.unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={48} color={COLORS.mediumGray} />
              <Text style={styles.emptyStateText}>No personal bests yet</Text>
              <Text style={styles.emptyStateSubtext}>Complete a workout to track your PRs</Text>
            </View>
          )}
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
});