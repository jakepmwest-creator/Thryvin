import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppHeader } from '../../src/components/AppHeader';
import { WorkoutDetailsModal } from '../../src/components/WorkoutDetailsModal';

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
  { id: 1, icon: 'trophy', title: 'New PR!', subtitle: 'Bench: 225 lbs', gradient: [COLORS.yellow, '#FFA500'] },
  { id: 2, icon: 'people', title: '3 Followers', subtitle: 'Sarah, Mike, Alex', gradient: [COLORS.green, '#66BB6A'] },
  { id: 3, icon: 'flame', title: '7 Day Streak', subtitle: 'Keep it going!', gradient: [COLORS.red, '#FF6B6B'] },
  { id: 4, icon: 'barbell', title: 'Last Workout', subtitle: 'Upper Body', gradient: [COLORS.purple, '#BA68C8'] },
  { id: 5, icon: 'star', title: 'Achievement', subtitle: '100 Workouts', gradient: [COLORS.blue, '#42A5F5'] },
  { id: 6, icon: 'timer', title: 'Best Time', subtitle: '45 min', gradient: [COLORS.orange, '#FFB74D'] },
];

const AI_QUOTES = [
  "You're 15% stronger than last month!\nKeep crushing it! 💪",
  "7 day streak! Consistency is key!\nProud of you!",
  "Your form improved 20%!\nGains are coming!",
  "3 PRs this week!\nYou're unstoppable! 🔥",
];

// Circular progress ring with tap interaction
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
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleStartWorkout = () => {
    router.push('/active-workout');
    setModalVisible(false);
  };

  const showRingDetails = (label: string) => {
    setRingDetailsVisible(label);
    setTimeout(() => setRingDetailsVisible(null), 3000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader mode="fitness" />
      
      <WorkoutDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onStartWorkout={handleStartWorkout}
      />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >
        {/* Bigger, More Inviting Banner */}
        <View style={styles.bannerContainer}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.bannerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.bannerContent}>
              <View style={styles.bannerLeft}>
                <Text style={styles.bannerGreeting}>Hi Jake! 👋</Text>
                <Text style={styles.bannerQuote}>
                  {AI_QUOTES[Math.floor(Math.random() * AI_QUOTES.length)]}
                </Text>
              </View>
              <View style={styles.achievementBadge}>
                <Ionicons name="trophy" size={36} color="#FFD700" />
                <Text style={styles.badgeText}>+3</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Weekly Progress Rings - MOVED UP */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Progress</Text>
          {ringDetailsVisible && (
            <View style={styles.ringDetails}>
              <Text style={styles.ringDetailsText}>
                {ringDetailsVisible === 'Workouts' && '4 of 5 workouts completed this week'}
                {ringDetailsVisible === 'Calories' && '1,950 of 3,000 calories burned'}
                {ringDetailsVisible === 'Active Days' && '5 of 7 active days this week'}
              </Text>
            </View>
          )}
          <View style={styles.ringsContainer}>
            <ProgressRing label="Workouts" progress={0.8} color={COLORS.accent} onPress={() => showRingDetails('Workouts')} />
            <ProgressRing label="Calories" progress={0.65} color={COLORS.red} onPress={() => showRingDetails('Calories')} />
            <ProgressRing label="Active Days" progress={0.75} color={COLORS.green} onPress={() => showRingDetails('Active Days')} />
          </View>
        </View>

        {/* Today's Workout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Workout</Text>
          <View style={styles.todayWorkoutCard}>
            <LinearGradient
              colors={[`${COLORS.accent}15`, `${COLORS.accentSecondary}15`]}
              style={styles.workoutGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.workoutHeader}>
                <View>
                  <Text style={styles.workoutTitle}>Upper Body Push</Text>
                  <Text style={styles.workoutMeta}>45 min • 8 exercises • Intermediate</Text>
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
        </View>

        {/* Recent Activity - MOVED DOWN, SMALLER CARDS */}
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
                style={[styles.activityCard, { borderColor: `${card.color}30` }]}
              >
                <View style={[styles.activityIcon, { backgroundColor: `${card.color}20` }]}>
                  <Ionicons name={card.icon as any} size={20} color={card.color} />
                </View>
                <Text style={styles.activityTitle}>{card.title}</Text>
                <Text style={styles.activitySubtitle}>{card.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </Animated.ScrollView>
        </View>

        {/* Personal Bests - SMALLER */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Bests</Text>
          <View style={styles.pbGrid}>
            {[
              { name: 'Bench Press', weight: '225 lbs', icon: 'fitness', color: COLORS.purple },
              { name: 'Squat', weight: '315 lbs', icon: 'barbell', color: COLORS.blue },
              { name: 'Deadlift', weight: '405 lbs', icon: 'flame', color: COLORS.red },
              { name: 'Pull Ups', weight: '15 reps', icon: 'arrow-up', color: COLORS.green },
            ].map((pb, i) => (
              <View key={i} style={styles.pbCard}>
                <View style={[styles.pbIcon, { backgroundColor: `${pb.color}20` }]}>
                  <Ionicons name={pb.icon as any} size={18} color={pb.color} />
                </View>
                <Text style={styles.pbName}>{pb.name}</Text>
                <Text style={styles.pbWeight}>{pb.weight}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* SURPRISE: Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionBtn}>
              <LinearGradient
                colors={[COLORS.accent, COLORS.accentSecondary]}
                style={styles.quickActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="chatbubble-ellipses" size={24} color={COLORS.white} />
                <Text style={styles.quickActionText}>Ask AI Coach</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn}>
              <View style={styles.quickActionSecondary}>
                <Ionicons name="calendar" size={24} color={COLORS.accent} />
                <Text style={styles.quickActionTextSecondary}>View Schedule</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* SURPRISE 2: Weekly Streak Card */}
        <View style={[styles.section, { marginBottom: 30 }]}>
          <View style={styles.streakCard}>
            <LinearGradient
              colors={[COLORS.orange, COLORS.red]}
              style={styles.streakGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.streakContent}>
                <Ionicons name="flame" size={48} color={COLORS.white} />
                <View>
                  <Text style={styles.streakNumber}>7</Text>
                  <Text style={styles.streakLabel}>Day Streak</Text>
                </View>
              </View>
              <Text style={styles.streakSubtext}>You're on fire! Don't break it now!</Text>
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
  // Banner - BIGGER
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
  // Weekly Progress Rings
  ringsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
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
  // Today's Workout
  todayWorkoutCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  workoutGradient: {
    padding: 18,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  workoutMeta: {
    fontSize: 13,
    color: COLORS.mediumGray,
    fontWeight: '500',
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
  // Activity Cards - SMALLER
  activityScroll: {
    paddingRight: 20,
    gap: 8,
  },
  activityCard: {
    width: SCREEN_WIDTH * 0.38,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 11,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  // Personal Bests - SMALLER GRID
  pbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pbCard: {
    width: (SCREEN_WIDTH - 50) / 2,
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 14,
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
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accent,
  },
  // Quick Actions
  quickActions: {
    gap: 10,
  },
  quickActionBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  quickActionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
  },
  quickActionTextSecondary: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accent,
  },
  // Streak Card
  streakCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  streakGradient: {
    padding: 20,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 40,
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.9,
  },
  streakSubtext: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.85,
  },
});
