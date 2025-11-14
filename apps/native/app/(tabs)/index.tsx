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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  accent: '#a259ff',
  accentSecondary: '#3a86ff',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  yellow: '#FFD700',
  green: '#4CAF50',
  orange: '#FF9800',
  red: '#FF5252',
  purple: '#9C27B0',
  blue: '#2196F3',
};

const ACTIVITY_CARDS = [
  { id: 1, icon: 'trophy', title: 'New PR!', subtitle: 'Bench: 225 lbs', gradient: ['#FFD700', '#FFA000'], action: 'stats' },
  { id: 2, icon: 'people', title: '3 Followers', subtitle: 'Sarah, Mike, Alex', gradient: ['#4CAF50', '#00C853'], action: 'profile' },
  { id: 3, icon: 'flame', title: '7 Day Streak', subtitle: 'Keep it going!', gradient: ['#FF5252', '#FF1744'], action: 'stats' },
  { id: 4, icon: 'barbell', title: 'Last Workout', subtitle: 'Upper Body', gradient: ['#9C27B0', '#AA00FF'], action: 'workouts' },
  { id: 5, icon: 'star', title: 'Achievement', subtitle: '100 Workouts', gradient: ['#2196F3', '#00B0FF'], action: 'awards' },
  { id: 6, icon: 'timer', title: 'Best Time', subtitle: '45 min', gradient: ['#FF9800', '#FF6D00'], action: 'stats' },
];

const AI_QUOTES = [
  "You're 15% stronger than last month!\nKeep crushing it! 💪",
  "7 day streak! Consistency is key!\nProud of you!",
  "Your form improved 20%!\nGains are coming!",
  "3 PRs this week!\nYou're unstoppable! 🔥",
];

const ProgressRing = ({ label, progress, color, size = 90, onPress }: any) => {
  return (
    <TouchableOpacity style={styles.ringContainer} onPress={onPress}>
      <View style={[styles.ring, { borderColor: `${color}20`, width: size, height: size }]}>
        <View style={[styles.ringProgress, { 
          borderColor: color,
          width: size,
          height: size,
          borderWidth: 8,
          transform: [{ rotate: `${progress * 360}deg` }]
        }]} />
        <View style={styles.ringInner}>
          <Text style={styles.ringPercentage}>{Math.round(progress * 100)}%</Text>
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

  // Get data from stores
  const { user } = useAuthStore();
  const {
    todayWorkout,
    stats,
    personalBests,
    isLoading,
    fetchTodayWorkout,
    fetchStats,
    fetchPersonalBests,
    fetchCompletedWorkouts,
  } = useWorkoutStore();

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await Promise.all([
      fetchTodayWorkout(),
      fetchCompletedWorkouts(),
      fetchStats(),
      fetchPersonalBests(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleStartWorkout = () => {
    if (todayWorkout) {
      router.push('/active-workout');
    }
    setModalVisible(false);
  };

  const showRingDetails = (label: string) => {
    setRingDetailsVisible(label);
    setTimeout(() => setRingDetailsVisible(null), 3000);
  };

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

  const handlePersonalBestPress = (pb: any) => {
    setSelectedExercise(pb);
    setChartModalVisible(true);
  };

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
          visible={chartModalVisible}
          onClose={() => setChartModalVisible(false)}
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
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
      >
        {/* Banner */}
        <View style={styles.bannerContainer}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.bannerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.bannerContent}>
              <View style={styles.bannerLeft}>
                <Text style={styles.bannerGreeting}>Hi {user?.name || 'there'}! 👋</Text>
                <Text style={styles.bannerQuote}>
                  {stats ? `${stats.totalWorkouts} workouts completed! 💪` : 'Ready to crush your workout today?'}
                </Text>
                <View style={styles.bannerStats}>
                  <View style={styles.statChip}>
                    <Ionicons name="flame" size={14} color={COLORS.white} />
                    <Text style={styles.statText}>{stats?.currentStreak || 0}-day streak</Text>
                  </View>
                  <View style={styles.statChip}>
                    <Ionicons name="barbell" size={14} color={COLORS.white} />
                    <Text style={styles.statText}>{stats?.weeklyWorkouts || 0} workouts</Text>
                  </View>
                </View>
              </View>
              <View style={styles.achievementBadge}>
                <Ionicons name="trophy" size={36} color="#FFD700" />
                <Text style={styles.badgeText}>{stats?.level || 'Bronze'}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Weekly Progress Rings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Progress</Text>
          <View style={styles.ringsContainer}>
            <ProgressRing 
              label="Workouts" 
              progress={stats ? stats.weeklyWorkouts / stats.weeklyGoal : 0} 
              color={COLORS.accent} 
              onPress={() => showRingDetails('Workouts')} 
            />
            <ProgressRing 
              label="Minutes" 
              progress={stats ? stats.weeklyMinutes / stats.weeklyMinutesGoal : 0} 
              color={COLORS.red} 
              onPress={() => showRingDetails('Minutes')} 
            />
            <ProgressRing 
              label="Streak" 
              progress={stats ? Math.min(stats.currentStreak / 7, 1) : 0} 
              color={COLORS.green} 
              onPress={() => showRingDetails('Streak')} 
            />
          </View>
          {ringDetailsVisible && stats && (
            <View style={styles.ringDetails}>
              <Text style={styles.ringDetailsText}>
                {ringDetailsVisible === 'Workouts' && `${stats.weeklyWorkouts} of ${stats.weeklyGoal} workouts completed this week`}
                {ringDetailsVisible === 'Minutes' && `${stats.weeklyMinutes} of ${stats.weeklyMinutesGoal} minutes completed`}
                {ringDetailsVisible === 'Streak' && `${stats.currentStreak} day streak 🔥`}
              </Text>
            </View>
          )}
        </View>

        {/* Today's Workout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Workout</Text>
          
          {isLoading && !todayWorkout ? (
            <View style={[styles.todayWorkoutCard, { padding: 40, alignItems: 'center' }]}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={{ marginTop: 12, color: COLORS.mediumGray }}>Loading workout...</Text>
            </View>
          ) : todayWorkout ? (
            <View style={styles.todayWorkoutCard}>
              <LinearGradient
                colors={[`${COLORS.accent}15`, `${COLORS.accentSecondary}15`]}
                style={styles.workoutGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.workoutHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.workoutTitle}>{todayWorkout.title}</Text>
                    <Text style={styles.workoutMeta}>
                      {todayWorkout.duration} min • {todayWorkout.exercises.length} exercises • {todayWorkout.difficulty}
                    </Text>
                    <Text style={styles.workoutDescription}>
                      AI-personalized workout based on your goals and experience level. Let's crush it!
                    </Text>
                  </View>
                  <View style={styles.workoutBadge}>
                    <Ionicons name="barbell" size={24} color={COLORS.accent} />
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.startButton}
                  onPress={() => setModalVisible(true)}
                >
                  <LinearGradient
                    colors={[COLORS.accent, COLORS.accentSecondary]}
                    style={styles.startGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="play" size={20} color={COLORS.white} />
                    <Text style={styles.startText}>Start Workout</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ) : (
            <View style={[styles.todayWorkoutCard, { padding: 30, alignItems: 'center' }]}>
              <Ionicons name="alert-circle-outline" size={48} color={COLORS.mediumGray} />
              <Text style={{ marginTop: 12, color: COLORS.mediumGray, textAlign: 'center' }}>
                No workout available. Pull to refresh!
              </Text>
            </View>
          )}
        </View>

        {/* Recent Activity - VIBRANT GRADIENTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activityScroll}
            snapToInterval={SCREEN_WIDTH * 0.38 + 8}
            decelerationRate="fast"
          >
            {ACTIVITY_CARDS.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={styles.activityCardWrapper}
                onPress={() => handleActivityCardPress(card.action)}
              >
                <LinearGradient
                  colors={card.gradient}
                  style={styles.activityCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1.2, y: 1.2 }}
                >
                  <Ionicons name={card.icon as any} size={28} color={COLORS.white} />
                  <Text style={styles.activityTitle}>{card.title}</Text>
                  <Text style={styles.activitySubtitle}>{card.subtitle}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </Animated.ScrollView>
        </View>

        {/* Personal Bests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Bests</Text>
          <View style={styles.pbGrid}>
            {[
              { name: 'Bench Press', weight: '225 lbs', icon: 'fitness', color: COLORS.purple },
              { name: 'Squat', weight: '315 lbs', icon: 'barbell', color: COLORS.blue },
              { name: 'Deadlift', weight: '405 lbs', icon: 'flame', color: COLORS.red },
              { name: 'Pull Ups', weight: '15 reps', icon: 'arrow-up', color: COLORS.green },
            ].map((pb, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handlePersonalBestPress(pb)}
              >
                <LinearGradient
                  colors={[`${pb.color}08`, `${pb.color}05`]}
                  style={styles.pbCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={[styles.pbIcon, { backgroundColor: `${pb.color}20` }]}>
                    <Ionicons name={pb.icon as any} size={18} color={pb.color} />
                  </View>
                  <Text style={styles.pbName}>{pb.name}</Text>
                  <Text style={[styles.pbWeight, { color: pb.color }]}>{pb.weight}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Nutrition - VIBRANT GRADIENT */}
        <View style={[styles.section, { marginBottom: 100 }]}>
          <Text style={styles.sectionTitle}>Today's Nutrition</Text>
          <View style={styles.nutritionCard}>
            <LinearGradient
              colors={['#00C853', '#69F0AE']}
              style={styles.nutritionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1.2, y: 1.2 }}
            >
              <View style={styles.nutritionRow}>
                <View style={styles.nutritionStat}>
                  <Text style={styles.nutritionValue}>1,850</Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                </View>
                <View style={styles.nutritionDivider} />
                <View style={styles.nutritionStat}>
                  <Text style={styles.nutritionValue}>120g</Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                </View>
                <View style={styles.nutritionDivider} />
                <View style={styles.nutritionStat}>
                  <Text style={styles.nutritionValue}>85g</Text>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>
              </View>
              <Text style={styles.nutritionSubtext}>62% of daily goal</Text>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
  },
  bannerContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
  },
  bannerGradient: {
    padding: 24,
    minHeight: 160,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bannerLeft: {
    flex: 1,
  },
  bannerGreeting: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
  },
  bannerQuote: {
    fontSize: 14,
    color: COLORS.white,
    lineHeight: 20,
    marginBottom: 16,
    opacity: 0.95,
  },
  bannerStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  achievementBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 4,
  },
  ringsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  ringDetails: {
    backgroundColor: `${COLORS.accent}10`,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  ringDetailsText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
    textAlign: 'center',
  },
  ringContainer: {
    alignItems: 'center',
  },
  ring: {
    borderWidth: 8,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ringProgress: {
    position: 'absolute',
    borderRadius: 100,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  ringInner: {
    position: 'absolute',
  },
  ringPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  ringLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mediumGray,
    marginTop: 8,
  },
  todayWorkoutCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  workoutGradient: {
    padding: 20,
    minHeight: 180,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  workoutMeta: {
    fontSize: 14,
    color: COLORS.mediumGray,
    fontWeight: '500',
    marginBottom: 8,
  },
  workoutDescription: {
    fontSize: 13,
    color: COLORS.mediumGray,
    lineHeight: 18,
    marginTop: 4,
  },
  workoutBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  startGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  startText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  activityScroll: {
    paddingRight: 20,
    gap: 8,
    paddingBottom: 4,
  },
  activityCardWrapper: {
    width: SCREEN_WIDTH * 0.38,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  activityCard: {
    borderRadius: 18,
    padding: 16,
    height: 110,
    justifyContent: 'space-between',
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
    marginTop: 4,
  },
  activitySubtitle: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: '500',
    opacity: 0.95,
  },
  pbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pbCard: {
    width: (SCREEN_WIDTH - 50) / 2,
    borderRadius: 18,
    padding: 16,
  },
  pbIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  pbName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  pbWeight: {
    fontSize: 18,
    fontWeight: '700',
  },
  nutritionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  nutritionGradient: {
    padding: 20,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  nutritionStat: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.95,
  },
  nutritionDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  nutritionSubtext: {
    fontSize: 13,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.9,
  },
});