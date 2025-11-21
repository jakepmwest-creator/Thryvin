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
import { AppHeader } from '../../src/components/AppHeader';
import { COLORS, CARD_SHADOW } from '../../src/constants/colors';

const { width } = Dimensions.get('window');

const awards = [
  {
    id: 1,
    title: 'First Steps',
    description: 'Complete your first workout',
    earned: true,
    earnedDate: 'Jan 15, 2024',
    icon: 'walk',
    color: '#FFD700',
  },
  {
    id: 2,
    title: 'Week Warrior',
    description: 'Complete 7 workouts in a week',
    earned: true,
    earnedDate: 'Jan 22, 2024',
    icon: 'trophy',
    color: '#FF4EC7',
  },
  {
    id: 3,
    title: 'Consistency King',
    description: 'Train for 30 days straight',
    earned: false,
    progress: 15,
    total: 30,
    icon: 'flame',
    color: '#FF6B35',
  },
  {
    id: 4,
    title: 'Strength Master',
    description: 'Bench press 2x bodyweight',
    earned: false,
    progress: 80,
    total: 100,
    icon: 'barbell',
    color: '#A22BF6',
  },
  {
    id: 5,
    title: 'Early Bird',
    description: 'Complete 10 morning workouts',
    earned: true,
    earnedDate: 'Feb 1, 2024',
    icon: 'sunny',
    color: '#FFD60A',
  },
  {
    id: 6,
    title: 'Social Star',
    description: 'Get 100 likes on posts',
    earned: false,
    progress: 45,
    total: 100,
    icon: 'heart',
    color: '#FF4EC7',
  },
];

const stats = [
  { label: 'Total XP', value: '2,450', icon: 'star', gradient: [COLORS.gradientStart, COLORS.gradientEnd] },
  { label: 'Awards', value: '12', icon: 'trophy', gradient: ['#FFD700', '#FFA500'] },
  { label: 'Streak', value: '15 days', icon: 'flame', gradient: ['#FF6B35', '#FF4500'] },
];

export default function AwardsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Awards & Achievements" showProfile />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <TouchableOpacity key={index} style={styles.statCard} activeOpacity={0.8}>
              <LinearGradient
                colors={stat.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statGradient}
              >
                <Ionicons name={stat.icon as any} size={28} color={COLORS.white} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Awards Section */}
        <Text style={styles.sectionTitle}>Your Achievements</Text>
        
        <View style={styles.awardsGrid}>
          {awards.map((award) => (
            <TouchableOpacity 
              key={award.id} 
              style={styles.awardCard}
              activeOpacity={0.8}
            >
              <View style={[
                styles.awardCardInner,
                !award.earned && styles.awardCardLocked
              ]}>
                {/* Icon Circle */}
                <View style={[
                  styles.iconCircle,
                  { backgroundColor: award.earned ? award.color : COLORS.lightGray }
                ]}>
                  <Ionicons 
                    name={award.icon as any} 
                    size={32} 
                    color={award.earned ? COLORS.white : COLORS.mediumGray} 
                  />
                </View>

                {/* Award Info */}
                <Text style={[
                  styles.awardTitle,
                  !award.earned && styles.awardTitleLocked
                ]}>
                  {award.title}
                </Text>
                <Text style={styles.awardDescription}>
                  {award.description}
                </Text>

                {/* Progress or Date */}
                {award.earned ? (
                  <View style={styles.earnedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    <Text style={styles.earnedText}>{award.earnedDate}</Text>
                  </View>
                ) : (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          { 
                            width: `${(award.progress! / award.total!) * 100}%`,
                            backgroundColor: award.color
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {award.progress}/{award.total}
                    </Text>
                  </View>
                )}

                {/* Locked Overlay */}
                {!award.earned && (
                  <View style={styles.lockedOverlay}>
                    <Ionicons name="lock-closed" size={20} color={COLORS.mediumGray} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
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
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.9,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  awardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  awardCard: {
    width: (width - 48) / 2,
    marginBottom: 0,
  },
  awardCardInner: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    ...CARD_SHADOW,
    minHeight: 200,
  },
  awardCardLocked: {
    opacity: 0.6,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  awardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  awardTitleLocked: {
    color: COLORS.mediumGray,
  },
  awardDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  earnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: `${COLORS.success}20`,
    borderRadius: 12,
  },
  earnedText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.success,
  },
  progressContainer: {
    width: '100%',
    gap: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
