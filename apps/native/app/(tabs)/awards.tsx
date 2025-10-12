import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../../src/theme/theme';

const achievements = [
  { id: 1, title: 'First Workout', description: 'Complete your first workout', earned: true, icon: '🏋️‍♀️' },
  { id: 2, title: 'Week Warrior', description: 'Work out 7 days in a row', earned: true, icon: '🔥' },
  { id: 3, title: 'Early Bird', description: 'Complete 5 morning workouts', earned: true, icon: '🌅' },
  { id: 4, title: 'Consistency King', description: 'Work out 30 days in a row', earned: false, icon: '👑' },
  { id: 5, title: 'Strength Master', description: 'Complete 50 strength workouts', earned: false, icon: '💪' },
  { id: 6, title: 'Cardio Champion', description: 'Complete 25 cardio sessions', earned: false, icon: '❤️' },
];

export default function AwardsScreen() {
  const earnedAchievements = achievements.filter(a => a.earned);
  const lockedAchievements = achievements.filter(a => !a.earned);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Awards
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {earnedAchievements.length} of {achievements.length} achievements unlocked
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Surface style={styles.statsCard}>
          <View style={styles.statsContent}>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                {earnedAchievements.length}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Earned
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                250
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Total Points
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                #12
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Ranking
              </Text>
            </View>
          </View>
        </Surface>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Earned Achievements
        </Text>

        {earnedAchievements.map((achievement) => (
          <Card key={achievement.id} style={styles.achievementCard}>
            <Card.Content style={styles.achievementContent}>
              <View style={styles.achievementIcon}>
                <Text style={styles.iconText}>{achievement.icon}</Text>
              </View>
              <View style={styles.achievementInfo}>
                <Text variant="titleMedium" style={styles.achievementTitle}>
                  {achievement.title}
                </Text>
                <Text variant="bodyMedium" style={styles.achievementDescription}>
                  {achievement.description}
                </Text>
              </View>
              <View style={styles.earnedBadge}>
                <Text style={styles.earnedText}>✓</Text>
              </View>
            </Card.Content>
          </Card>
        ))}

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Locked Achievements
        </Text>

        {lockedAchievements.map((achievement) => (
          <Card key={achievement.id} style={[styles.achievementCard, styles.lockedCard]}>
            <Card.Content style={styles.achievementContent}>
              <View style={[styles.achievementIcon, styles.lockedIcon]}>
                <Text style={[styles.iconText, styles.lockedIconText]}>🔒</Text>
              </View>
              <View style={styles.achievementInfo}>
                <Text variant="titleMedium" style={[styles.achievementTitle, styles.lockedText]}>
                  {achievement.title}
                </Text>
                <Text variant="bodyMedium" style={[styles.achievementDescription, styles.lockedText]}>
                  {achievement.description}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    color: '#6B7280',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  statsCard: {
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#7A3CF3',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  sectionTitle: {
    marginBottom: spacing.md,
    marginTop: spacing.lg,
    color: '#1F2937',
  },
  achievementCard: {
    marginBottom: spacing.md,
    borderRadius: 16,
    elevation: 2,
  },
  lockedCard: {
    opacity: 0.6,
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7A3CF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  lockedIcon: {
    backgroundColor: '#9CA3AF',
  },
  iconText: {
    fontSize: 24,
  },
  lockedIconText: {
    fontSize: 20,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    marginBottom: 4,
    color: '#1F2937',
  },
  achievementDescription: {
    color: '#6B7280',
  },
  lockedText: {
    color: '#9CA3AF',
  },
  earnedBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});