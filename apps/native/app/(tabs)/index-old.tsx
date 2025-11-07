import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
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
  shadow: 'rgba(162, 89, 255, 0.1)',
};

const ACTIVITY_CARDS = [
  { id: 1, icon: 'trophy', title: 'New PR!', subtitle: 'Bench Press: 225 lbs', color: '#FFD700' },
  { id: 2, icon: 'person-add', title: '3 New Followers', subtitle: 'Sarah, Mike, Alex', color: '#4CAF50' },
  { id: 3, icon: 'restaurant', title: "Today's Meal", subtitle: 'Chicken & Rice Bowl', color: '#FF9800' },
  { id: 4, icon: 'flame', title: 'Streak: 7 Days', subtitle: 'Keep it going!', color: '#FF5252' },
  { id: 5, icon: 'barbell', title: 'Last Workout', subtitle: 'Upper Body Push', color: '#9C27B0' },
  { id: 6, icon: 'star', title: 'Achievement', subtitle: '100 Workouts Completed', color: '#2196F3' },
  { id: 7, icon: 'timer', title: 'Best Time', subtitle: '45 min workout', color: '#00BCD4' },
  { id: 8, icon: 'analytics', title: 'Weekly Progress', subtitle: '+5% strength gain', color: '#8BC34A' },
];

const AI_QUOTES = [
  "You're 15% stronger than last month. Keep crushing it!",
  "Consistency is key - 7 days streak is impressive!",
  "Your form has improved 20%. Gains incoming!",
  "You've hit 3 PRs this week. Unstoppable!",
];

// Simple circular progress component
const ProgressRing = ({ progress = 0.7, size = 120 }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={[styles.progressContainer, { width: size, height: size }]}>
      <LinearGradient
        colors={[COLORS.accent, COLORS.accentSecondary]}
        style={styles.progressGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.progressInner}>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          <Text style={styles.progressSubtext}>Weekly Goal</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

export default function HomeScreen() {
  const [expandedRing, setExpandedRing] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleStartWorkout = () => {
    router.push('/active-workout');
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader mode="fitness" />
      
      {/* Workout Details Modal */}
      <WorkoutDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onStartWorkout={handleStartWorkout}
      />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Motivational Banner */}
        <View style={styles.bannerContainer}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.bannerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.bannerContent}>
              <View style={styles.bannerLeft}>
                <Text style={styles.bannerGreeting}>Hi Jake 👋</Text>
                <Text style={styles.bannerQuote}>
                  {AI_QUOTES[Math.floor(Math.random() * AI_QUOTES.length)]}
                </Text>
              </View>
              <View style={styles.achievementBadge}>
                <Ionicons name="trophy" size={28} color="#FFD700" />
                <Text style={styles.badgeText}>+3</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Activity Cards - Horizontal Scroll */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activityScroll}
            snapToInterval={SCREEN_WIDTH * 0.7 + 12}
            decelerationRate="fast"
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          >
            {ACTIVITY_CARDS.map((card, index) => (
              <TouchableOpacity
                key={card.id}
                style={styles.activityCard}
                onPress={() => console.log('Card pressed:', card.title)}
              >
                <View style={[styles.activityIcon, { backgroundColor: `${card.color}20` }]}>
                  <Ionicons name={card.icon as any} size={28} color={card.color} />
                </View>
                <Text style={styles.activityTitle}>{card.title}</Text>
                <Text style={styles.activitySubtitle}>{card.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </Animated.ScrollView>
        </View>

        {/* Today's Workout Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Workout</Text>
          <View style={styles.workoutCard}>
            <LinearGradient
              colors={[`${COLORS.accent}15`, `${COLORS.accentSecondary}15`]}
              style={styles.workoutCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.workoutHeader}>
                <View style={styles.workoutIconCircle}>
                  <Ionicons name="barbell" size={32} color={COLORS.accent} />
                </View>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutName}>Upper Body Push</Text>
                  <Text style={styles.workoutMeta}>45 min • 8 exercises • Intermediate</Text>
                </View>
              </View>
              <Text style={styles.workoutDescription}>
                Focus on chest, shoulders, and triceps with compound movements. Progressive overload focused session.
              </Text>
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

        {/* Progress Rings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Progress</Text>
          <View style={styles.ringsContainer}>
            <TouchableOpacity
              style={styles.ringCard}
              onPress={() => setExpandedRing(expandedRing === 'calories' ? null : 'calories')}
            >
              <View style={styles.ringCircle}>
                <View style={[styles.ringProgress, { borderColor: COLORS.accent, borderTopColor: 'transparent' }]} />
                <View style={styles.ringCenter}>
                  <Text style={styles.ringValue}>78%</Text>
                </View>
              </View>
              <Text style={styles.ringLabel}>Calories</Text>
              {expandedRing === 'calories' && (
                <View style={styles.ringDetail}>
                  <Text style={styles.ringDetailText}>1,890 / 2,400 cal</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ringCard}
              onPress={() => setExpandedRing(expandedRing === 'workouts' ? null : 'workouts')}
            >
              <View style={styles.ringCircle}>
                <View style={[styles.ringProgress, { borderColor: COLORS.accentSecondary, borderTopColor: 'transparent', transform: [{ rotate: '90deg' }] }]} />
                <View style={styles.ringCenter}>
                  <Text style={styles.ringValue}>5/7</Text>
                </View>
              </View>
              <Text style={styles.ringLabel}>Workouts</Text>
              {expandedRing === 'workouts' && (
                <View style={styles.ringDetail}>
                  <Text style={styles.ringDetailText}>71% complete</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ringCard}
              onPress={() => setExpandedRing(expandedRing === 'protein' ? null : 'protein')}
            >
              <View style={styles.ringCircle}>
                <View style={[styles.ringProgress, { borderColor: '#4CAF50', borderTopColor: 'transparent', transform: [{ rotate: '180deg' }] }]} />
                <View style={styles.ringCenter}>
                  <Text style={styles.ringValue}>92%</Text>
                </View>
              </View>
              <Text style={styles.ringLabel}>Protein</Text>
              {expandedRing === 'protein' && (
                <View style={styles.ringDetail}>
                  <Text style={styles.ringDetailText}>138 / 150g</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* PBs Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Bests</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/stats')}>
              <Text style={styles.seeMoreText}>See More →</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.pbsContainer}>
            <View style={styles.pbCard}>
              <View style={styles.pbHeader}>
                <Ionicons name="barbell" size={24} color={COLORS.accent} />
                <Text style={styles.pbName}>Bench Press</Text>
              </View>
              <Text style={styles.pbValue}>225 lbs</Text>
              <View style={styles.pbProgress}>
                <View style={[styles.pbBar, { width: '85%', backgroundColor: COLORS.accent }]} />
              </View>
              <Text style={styles.pbDate}>2 days ago • +5 lbs</Text>
            </View>

            <View style={styles.pbCard}>
              <View style={styles.pbHeader}>
                <Ionicons name="barbell" size={24} color={COLORS.accentSecondary} />
                <Text style={styles.pbName}>Squat</Text>
              </View>
              <Text style={styles.pbValue}>315 lbs</Text>
              <View style={styles.pbProgress}>
                <View style={[styles.pbBar, { width: '92%', backgroundColor: COLORS.accentSecondary }]} />
              </View>
              <Text style={styles.pbDate}>5 days ago • +10 lbs</Text>
            </View>

            <View style={styles.pbCard}>
              <View style={styles.pbHeader}>
                <Ionicons name="barbell" size={24} color="#4CAF50" />
                <Text style={styles.pbName}>Deadlift</Text>
              </View>
              <Text style={styles.pbValue}>405 lbs</Text>
              <View style={styles.pbProgress}>
                <View style={[styles.pbBar, { width: '98%', backgroundColor: '#4CAF50' }]} />
              </View>
              <Text style={styles.pbDate}>1 week ago • +15 lbs</Text>
            </View>
          </View>
        </View>

        {/* Removed old action buttons section */}
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
  scrollContent: {
    paddingBottom: 120,
  },
  
  // Banner
  bannerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  bannerGradient: {
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bannerLeft: {
    flex: 1,
    marginRight: 12,
  },
  bannerGreeting: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
  },
  bannerQuote: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 20,
  },
  achievementBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 2,
  },
  
  // Activity Cards
  activitySection: {
    marginBottom: 24,
  },
  activityScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  activityCard: {
    width: SCREEN_WIDTH * 0.7,
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 16,
  },
  activityIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  // Section Headers
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeMoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.accent,
  },
  
  // Today's Workout
  workoutCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  workoutCardGradient: {
    padding: 20,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  workoutIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  workoutMeta: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  workoutDescription: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  startButton: {
    borderRadius: 12,
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
    fontWeight: '600',
    color: COLORS.white,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  progressContainer: {
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  progressGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  progressInner: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  progressSubtext: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  // Removed all duplicate styles - keeping comprehensive versions at top of StyleSheet
  ringsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  ringCard: {
    alignItems: 'center',
  },
  ringCircle: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ringProgress: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 8,
  },
  ringCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  ringLabel: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginTop: 8,
    fontWeight: '500',
  },
  ringDetail: {
    marginTop: 8,
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ringDetailText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  
  // PBs
  pbsContainer: {
    gap: 12,
  },
  pbCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 16,
  },
  pbHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  pbName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  pbValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  pbProgress: {
    height: 8,
    backgroundColor: COLORS.white,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  pbBar: {
    height: '100%',
    borderRadius: 4,
  },
  pbDate: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
});