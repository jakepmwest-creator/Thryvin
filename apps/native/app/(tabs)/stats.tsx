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

const { width } = Dimensions.get('window');

const COLORS = {
  accent: '#a259ff',
  accentSecondary: '#3a86ff',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  shadow: 'rgba(162, 89, 255, 0.1)',
  success: '#34C759',
  warning: '#FF9500',
};

const StatCard = ({ 
  title, 
  value, 
  unit, 
  icon, 
  trend, 
  trendValue,
  gradient = false 
}: {
  title: string;
  value: string | number;
  unit?: string;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  gradient?: boolean;
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return COLORS.success;
      case 'down': return COLORS.warning;
      default: return COLORS.mediumGray;
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  if (gradient) {
    return (
      <View style={styles.statCard}>
        <LinearGradient
          colors={[COLORS.accent, COLORS.accentSecondary]}
          style={styles.gradientStatCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statHeader}>
            <Ionicons name={icon as any} size={24} color={COLORS.white} />
            {trend && (
              <View style={styles.trendContainer}>
                <Ionicons 
                  name={getTrendIcon() as any} 
                  size={16} 
                  color={COLORS.white} 
                />
                <Text style={styles.trendTextWhite}>{trendValue}</Text>
              </View>
            )}
          </View>
          <Text style={styles.statValueGradient}>
            {value}{unit && <Text style={styles.statUnitGradient}>{unit}</Text>}
          </Text>
          <Text style={styles.statTitleGradient}>{title}</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.statCard}>
      <View style={styles.regularStatCard}>
        <View style={styles.statHeader}>
          <Ionicons name={icon as any} size={24} color={COLORS.accent} />
          {trend && (
            <View style={styles.trendContainer}>
              <Ionicons 
                name={getTrendIcon() as any} 
                size={16} 
                color={getTrendColor()} 
              />
              <Text style={[styles.trendText, { color: getTrendColor() }]}>
                {trendValue}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.statValue}>
          {value}{unit && <Text style={styles.statUnit}>{unit}</Text>}
        </Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );
};

export default function StatsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader mode="fitness" />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Workouts Completed"
              value={5}
              icon="checkmark-circle"
              trend="up"
              trendValue="+2"
              gradient={true}
            />
            
            <StatCard
              title="Active Minutes"
              value={180}
              unit="min"
              icon="time"
              trend="up"
              trendValue="+25"
            />
            
            <StatCard
              title="Calories Burned"
              value={1420}
              unit="kcal"
              icon="flame"
              trend="up"
              trendValue="+180"
            />
            
            <StatCard
              title="Weekly Streak"
              value={12}
              unit=" days"
              icon="flash"
              trend="up"
              trendValue="+3"
            />
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress</Text>
          
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Weekly Goal</Text>
              <Text style={styles.progressPercentage}>85%</Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentSecondary]}
                  style={[styles.progressBarFill, { width: '85%' }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </View>
            
            <Text style={styles.progressSubtext}>
              5 of 6 workouts completed
            </Text>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Achievements</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.achievementsList}>
            <View style={styles.achievementItem}>
              <View style={styles.achievementIcon}>
                <Ionicons name="trophy" size={24} color={COLORS.warning} />
              </View>
              <View style={styles.achievementText}>
                <Text style={styles.achievementTitle}>Week Warrior</Text>
                <Text style={styles.achievementSubtitle}>
                  Complete 5 workouts in a week
                </Text>
              </View>
              <Text style={styles.achievementDate}>2 days ago</Text>
            </View>
            
            <View style={styles.achievementItem}>
              <View style={styles.achievementIcon}>
                <Ionicons name="flash" size={24} color={COLORS.accent} />
              </View>
              <View style={styles.achievementText}>
                <Text style={styles.achievementTitle}>Streak Master</Text>
                <Text style={styles.achievementSubtitle}>
                  10-day workout streak
                </Text>
              </View>
              <Text style={styles.achievementDate}>5 days ago</Text>
            </View>
          </View>
        </View>

        {/* Coming Soon */}
        <View style={styles.section}>
          <View style={styles.comingSoonCard}>
            <Ionicons name="analytics" size={48} color={COLORS.accent} />
            <Text style={styles.comingSoonTitle}>Advanced Analytics</Text>
            <Text style={styles.comingSoonText}>
              Detailed insights, body composition tracking, and performance metrics coming soon!
            </Text>
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
  scrollContent: {
    paddingBottom: 32,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.accent,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 56) / 2,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientStatCard: {
    padding: 16,
    height: 120,
    justifyContent: 'space-between',
  },
  regularStatCard: {
    padding: 16,
    height: 120,
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  statValueGradient: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  statUnit: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.mediumGray,
  },
  statUnitGradient: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.mediumGray,
  },
  statTitleGradient: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  trendTextWhite: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    color: COLORS.white,
  },
  progressCard: {
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.accent,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  achievementsList: {
    gap: 16,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.accent}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  achievementSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  achievementDate: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  comingSoonCard: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: `${COLORS.accent}05`,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${COLORS.accent}20`,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 20,
  },
});