import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, ProgressBar, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../../src/theme/theme';

export default function NutritionScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Nutrition
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Track your daily intake
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.caloriesCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.caloriesTitle}>
              Daily Calories
            </Text>
            <Text variant="headlineLarge" style={styles.caloriesNumber}>
              1,245 <Text variant="bodyLarge" style={styles.caloriesTarget}>/ 2,000</Text>
            </Text>
            <ProgressBar 
              progress={0.62} 
              color="#10B981" 
              style={styles.progressBar}
            />
            <Text variant="bodyMedium" style={styles.caloriesRemaining}>
              755 calories remaining
            </Text>
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Macronutrients
        </Text>

        <View style={styles.macroRow}>
          <Card style={styles.macroCard}>
            <Card.Content style={styles.macroContent}>
              <Text variant="bodyMedium" style={styles.macroLabel}>Protein</Text>
              <Text variant="headlineSmall" style={[styles.macroValue, { color: '#EF4444' }]}>
                45g
              </Text>
              <ProgressBar progress={0.3} color="#EF4444" style={styles.macroBar} />
            </Card.Content>
          </Card>

          <Card style={styles.macroCard}>
            <Card.Content style={styles.macroContent}>
              <Text variant="bodyMedium" style={styles.macroLabel}>Carbs</Text>
              <Text variant="headlineSmall" style={[styles.macroValue, { color: '#F59E0B' }]}>
                180g
              </Text>
              <ProgressBar progress={0.72} color="#F59E0B" style={styles.macroBar} />
            </Card.Content>
          </Card>

          <Card style={styles.macroCard}>
            <Card.Content style={styles.macroContent}>
              <Text variant="bodyMedium" style={styles.macroLabel}>Fats</Text>
              <Text variant="headlineSmall" style={[styles.macroValue, { color: '#8B5CF6' }]}>
                35g
              </Text>
              <ProgressBar progress={0.5} color="#8B5CF6" style={styles.macroBar} />
            </Card.Content>
          </Card>
        </View>

        <Card style={styles.mealCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.mealTitle}>
              AI Meal Recommendations
            </Text>
            <Text variant="bodyMedium" style={styles.mealDescription}>
              Get personalized meal suggestions based on your goals and preferences
            </Text>
            <Button 
              mode="contained" 
              style={styles.mealButton}
              icon="chef-hat"
            >
              Get Meal Plan
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.actionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.actionTitle}>
              Quick Actions
            </Text>
            <View style={styles.actionButtons}>
              <Button 
                mode="outlined" 
                style={styles.actionButton}
                icon="plus"
              >
                Log Food
              </Button>
              <Button 
                mode="outlined" 
                style={styles.actionButton}
                icon="water"
              >
                Log Water
              </Button>
            </View>
          </Card.Content>
        </Card>
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
  caloriesCard: {
    marginBottom: spacing.lg,
    borderRadius: 16,
    elevation: 2,
  },
  caloriesTitle: {
    marginBottom: spacing.sm,
    color: '#1F2937',
  },
  caloriesNumber: {
    color: '#10B981',
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  caloriesTarget: {
    color: '#6B7280',
    fontWeight: 'normal',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  caloriesRemaining: {
    color: '#6B7280',
  },
  sectionTitle: {
    marginBottom: spacing.md,
    color: '#1F2937',
  },
  macroRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  macroCard: {
    flex: 1,
    marginHorizontal: spacing.xs,
    borderRadius: 12,
    elevation: 1,
  },
  macroContent: {
    alignItems: 'center',
  },
  macroLabel: {
    color: '#6B7280',
    marginBottom: 4,
  },
  macroValue: {
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  macroBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
  },
  mealCard: {
    marginBottom: spacing.lg,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#10B981',
  },
  mealTitle: {
    color: '#FFFFFF',
    marginBottom: 4,
  },
  mealDescription: {
    color: '#E5E7EB',
    marginBottom: spacing.md,
  },
  mealButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  actionCard: {
    borderRadius: 16,
    elevation: 2,
  },
  actionTitle: {
    marginBottom: spacing.md,
    color: '#1F2937',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
    borderRadius: 12,
  },
});