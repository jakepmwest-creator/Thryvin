import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const COLORS = {
  accent: '#a259ff',
  accentSecondary: '#3a86ff',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  shadow: 'rgba(162, 89, 255, 0.1)',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
  success: '#34C759',
};

const awards = [
  {
    id: 1,
    title: 'First Steps',
    description: 'Complete your first workout',
    earned: true,
    earnedDate: 'Jan 15, 2024',
    icon: 'walk',
    tier: 'bronze',
  },
  {
    id: 2,
    title: 'Week Warrior',
    description: 'Complete 7 workouts in a week',
    earned: true,
    earnedDate: 'Jan 22, 2024',
    icon: 'trophy',
    tier: 'gold',
  },
  {
    id: 3,
    title: 'Strength Builder',
    description: 'Complete 10 strength workouts',
    earned: false,
    progress: 7,
    total: 10,
    icon: 'barbell',
    tier: 'silver',
  },
  {
    id: 4,
    title: 'Consistency King',
    description: 'Maintain a 30-day streak',
    earned: false,
    progress: 12,
    total: 30,
    icon: 'flash',
    tier: 'gold',
  },
];

const milestones = [
  { label: 'Workouts Completed', value: 25, target: 50, icon: 'fitness' },
  { label: 'Days Active', value: 18, target: 30, icon: 'calendar' },
  { label: 'Minutes Exercised', value: 720, target: 1000, icon: 'time' },
];

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'gold': return COLORS.gold;
    case 'silver': return COLORS.silver;
    case 'bronze': return COLORS.bronze;
    default: return COLORS.mediumGray;
  }
};

const AwardCard = ({ award }: { award: any }) => {
  const tierColor = getTierColor(award.tier);
  
  if (award.earned) {
    return (
      <View style={styles.awardCard}>
        <LinearGradient
          colors={[COLORS.accent, COLORS.accentSecondary]}
          style={styles.earnedAwardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.awardIconContainer}>
            <View style={[styles.awardIcon, { backgroundColor: tierColor }]}>
              <Ionicons name={award.icon as any} size={24} color={COLORS.white} />
            </View>
          </View>
          
          <View style={styles.awardContent}>
            <Text style={styles.earnedAwardTitle}>{award.title}</Text>
            <Text style={styles.earnedAwardDescription}>{award.description}</Text>
            <Text style={styles.earnedDate}>Earned {award.earnedDate}</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.awardCard}>
      <View style={styles.progressAwardCard}>
        <View style={styles.awardIconContainer}>
          <View style={[styles.awardIconProgress, { borderColor: tierColor }]}>
            <Ionicons name={award.icon as any} size={24} color={tierColor} />
          </View>
        </View>
        
        <View style={styles.awardContent}>
          <Text style={styles.progressAwardTitle}>{award.title}</Text>
          <Text style={styles.progressAwardDescription}>{award.description}</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[COLORS.accent, COLORS.accentSecondary]}
                style={[
                  styles.progressFill, 
                  { width: `${(award.progress / award.total) * 100}%` }
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.progressText}>
              {award.progress}/{award.total}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const MilestoneCard = ({ milestone }: { milestone: any }) => (
  <View style={styles.milestoneCard}>
    <View style={styles.milestoneHeader}>
      <View style={styles.milestoneIconContainer}>
        <Ionicons name={milestone.icon as any} size={20} color={COLORS.accent} />
      </View>
      <Text style={styles.milestoneLabel}>{milestone.label}</Text>
    </View>
    
    <View style={styles.milestoneStats}>
      <Text style={styles.milestoneValue}>{milestone.value}</Text>
      <Text style={styles.milestoneTarget}>/ {milestone.target}</Text>
    </View>
    
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarBackground}>
        <LinearGradient
          colors={[COLORS.accent, COLORS.accentSecondary]}
          style={[
            styles.progressBarFill, 
            { width: `${Math.min((milestone.value / milestone.target) * 100, 100)}%` }
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>
    </View>
  </View>
);

export default function AwardsScreen() {
  const earnedAwards = awards.filter(award => award.earned);
  const pendingAwards = awards.filter(award => !award.earned);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Awards</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="gift" size={20} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stats Overview */}
        <View style={styles.statsOverview}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{earnedAwards.length}</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{pendingAwards.length}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{awards.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Earned Awards */}
        {earnedAwards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              🏆 Earned Awards ({earnedAwards.length})
            </Text>
            {earnedAwards.map((award) => (
              <AwardCard key={award.id} award={award} />
            ))}
          </View>
        )}

        {/* In Progress */}
        {pendingAwards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              🎯 In Progress ({pendingAwards.length})
            </Text>
            {pendingAwards.map((award) => (
              <AwardCard key={award.id} award={award} />
            ))}
          </View>
        )}

        {/* Milestones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Milestones</Text>
          <View style={styles.milestonesGrid}>
            {milestones.map((milestone, index) => (
              <MilestoneCard key={index} milestone={milestone} />
            ))}
          </View>
        </View>

        {/* Motivation */}
        <View style={styles.motivationCard}>
          <LinearGradient
            colors={[`${COLORS.accent}10`, `${COLORS.accentSecondary}10`]}
            style={styles.motivationGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="star" size={32} color={COLORS.accent} />
            <Text style={styles.motivationTitle}>Keep Going!</Text>
            <Text style={styles.motivationText}>
              You're doing great! Complete your next workout to unlock new achievements.
            </Text>
          </LinearGradient>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  statsOverview: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 32,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 16,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  awardCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  earnedAwardGradient: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  progressAwardCard: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  awardIconContainer: {
    marginRight: 16,
  },
  awardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  awardIconProgress: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: COLORS.white,
  },
  awardContent: {
    flex: 1,
  },
  earnedAwardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  earnedAwardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  earnedDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  progressAwardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  progressAwardDescription: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.accent,
    minWidth: 30,
  },
  milestonesGrid: {
    gap: 16,
  },
  milestoneCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.accent}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  milestoneLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  milestoneStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  milestoneValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.accent,
  },
  milestoneTarget: {
    fontSize: 16,
    color: COLORS.mediumGray,
    marginLeft: 4,
  },
  progressBarContainer: {
    height: 6,
  },
  progressBarBackground: {
    height: '100%',
    backgroundColor: COLORS.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  motivationCard: {
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  motivationGradient: {
    padding: 24,
    alignItems: 'center',
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 20,
  },
});