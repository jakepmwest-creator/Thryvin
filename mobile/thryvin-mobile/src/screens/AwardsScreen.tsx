import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Ionicons, LinearGradient } from '../components/RealComponents';
import { brandColors } from '../theme/theme';

const achievements = [
  {
    id: 'first-workout',
    title: 'First Steps',
    description: 'Complete your first workout',
    icon: 'footsteps',
    color: '#FFD700',
    unlocked: false,
  },
  {
    id: 'week-streak',
    title: 'Week Warrior',
    description: 'Workout for 7 days straight',
    icon: 'flame',
    color: '#FF6B35',
    unlocked: false,
  },
  {
    id: 'strength-master',
    title: 'Strength Master',
    description: 'Complete 10 strength workouts',
    icon: 'barbell',
    color: brandColors.primary,
    unlocked: false,
  },
  {
    id: 'yoga-zen',
    title: 'Yoga Zen',
    description: 'Complete 5 yoga sessions',
    icon: 'leaf',
    color: '#4ADE80',
    unlocked: false,
  },
];

export default function AwardsScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={brandColors.gradient}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Ionicons name="trophy" size={48} color="white" />
          <Text style={styles.title}>Awards</Text>
          <Text style={styles.subtitle}>Your fitness achievements</Text>
        </View>
      </LinearGradient>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Unlocked</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={styles.statNumber}>{achievements.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={styles.statNumber}>0%</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Achievements Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsGrid}>
          {achievements.map((achievement) => (
            <Card 
              key={achievement.id} 
              style={[
                styles.achievementCard,
                { opacity: achievement.unlocked ? 1 : 0.6 }
              ]}
            >
              <Card.Content style={styles.achievementContent}>
                <View style={[styles.iconContainer, { backgroundColor: achievement.color }]}>
                  <Ionicons 
                    name={achievement.icon as any} 
                    size={24} 
                    color="white" 
                  />
                </View>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>
                  {achievement.description}
                </Text>
                {achievement.unlocked && (
                  <View style={styles.unlockedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#4ADE80" />
                    <Text style={styles.unlockedText}>Unlocked!</Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))}
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={48} color={brandColors.gray600} />
          <Text style={styles.emptyTitle}>Start earning awards!</Text>
          <Text style={styles.emptyDescription}>
            Complete workouts and reach milestones to unlock achievements and show off your progress.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.gray50,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: -20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: brandColors.white,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: brandColors.gray900,
  },
  statLabel: {
    fontSize: 12,
    color: brandColors.gray600,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: brandColors.gray900,
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: '48%',
    marginBottom: 16,
    backgroundColor: brandColors.white,
  },
  achievementContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: brandColors.gray900,
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    color: brandColors.gray600,
    textAlign: 'center',
    lineHeight: 16,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
  },
  unlockedText: {
    fontSize: 10,
    color: '#4ADE80',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: brandColors.gray900,
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: brandColors.gray600,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});