import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, ProgressBar, Button, Ionicons } from '../components/TempComponents';
import { brandColors } from '../theme/theme';
import { useAppStore } from '../stores/AppStore';

export default function NutritionScreen() {
  const { dailyNutrition, actions } = useAppStore();
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Nutrition</Text>
        <Text style={styles.subtitle}>Fuel your fitness journey</Text>
      </View>

      {/* Daily Overview */}
      <Card style={styles.overviewCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Today's Goals</Text>
          
          {/* Calories */}
          <View style={styles.macroItem}>
            <View style={styles.macroHeader}>
              <View style={styles.macroLabelContainer}>
                <Ionicons name="flame" size={20} color="#FF6B35" />
                <Text style={styles.macroLabel}>Calories</Text>
              </View>
              <Text style={styles.macroValues}>{dailyNutrition.calories} / {dailyNutrition.calorieGoal} kcal</Text>
            </View>
            <ProgressBar progress={dailyNutrition.calories / dailyNutrition.calorieGoal} color="#FF6B35" style={styles.progressBar} />
          </View>

          {/* Protein */}
          <View style={styles.macroItem}>
            <View style={styles.macroHeader}>
              <View style={styles.macroLabelContainer}>
                <Ionicons name="fitness" size={20} color={brandColors.primary} />
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <Text style={styles.macroValues}>{dailyNutrition.protein} / {dailyNutrition.proteinGoal}g</Text>
            </View>
            <ProgressBar progress={dailyNutrition.protein / dailyNutrition.proteinGoal} color={brandColors.primary} style={styles.progressBar} />
          </View>

          {/* Carbs */}
          <View style={styles.macroItem}>
            <View style={styles.macroHeader}>
              <View style={styles.macroLabelContainer}>
                <Ionicons name="leaf" size={20} color="#4ADE80" />
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <Text style={styles.macroValues}>0 / 250g</Text>
            </View>
            <ProgressBar progress={0} color="#4ADE80" style={styles.progressBar} />
          </View>

          {/* Fats */}
          <View style={styles.macroItem}>
            <View style={styles.macroHeader}>
              <View style={styles.macroLabelContainer}>
                <Ionicons name="water" size={20} color="#F59E0B" />
                <Text style={styles.macroLabel}>Fats</Text>
              </View>
              <Text style={styles.macroValues}>0 / 67g</Text>
            </View>
            <ProgressBar progress={0} color="#F59E0B" style={styles.progressBar} />
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Card style={styles.actionCard}>
          <Card.Content style={styles.actionContent}>
            <Ionicons name="add-circle" size={32} color={brandColors.primary} />
            <Text style={styles.actionTitle}>Log Food</Text>
            <Text style={styles.actionDescription}>Track your meals</Text>
          </Card.Content>
        </Card>

        <Card style={styles.actionCard}>
          <Card.Content style={styles.actionContent}>
            <Ionicons name="restaurant" size={32} color={brandColors.secondary} />
            <Text style={styles.actionTitle}>AI Meal Plan</Text>
            <Text style={styles.actionDescription}>Get suggestions</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Recent Meals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Meals</Text>
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={48} color={brandColors.gray600} />
          <Text style={styles.emptyTitle}>No meals logged</Text>
          <Text style={styles.emptyDescription}>
            Start tracking your nutrition to see insights and progress!
          </Text>
          <Button
            mode="outlined"
            style={styles.logButton}
            onPress={() => {}}
          >
            Log Your First Meal
          </Button>
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
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: brandColors.gray900,
  },
  subtitle: {
    fontSize: 16,
    color: brandColors.gray600,
    marginTop: 4,
  },
  overviewCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: brandColors.white,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: brandColors.gray900,
    marginBottom: 20,
  },
  macroItem: {
    marginBottom: 16,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: brandColors.gray900,
    marginLeft: 8,
  },
  macroValues: {
    fontSize: 14,
    color: brandColors.gray600,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: brandColors.white,
  },
  actionContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: brandColors.gray900,
    marginTop: 8,
  },
  actionDescription: {
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
    marginBottom: 24,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  logButton: {
    borderColor: brandColors.primary,
  },
});