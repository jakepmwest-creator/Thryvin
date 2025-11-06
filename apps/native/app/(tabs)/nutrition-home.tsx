import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../../src/components/AppHeader';

const COLORS = {
  accent: '#4CAF50',
  accentSecondary: '#8BC34A',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  shadow: 'rgba(76, 175, 80, 0.15)',
};

export default function NutritionHomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader mode="nutrition" />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Good Morning, Jake 🍎</Text>
          <Text style={styles.subtitle}>Let's fuel your body right today</Text>
        </View>

        {/* Daily Summary Card */}
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.summaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.summaryTitle}>Today's Nutrition</Text>
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>1,850</Text>
                <Text style={styles.macroLabel}>Calories</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>150g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>180g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>65g</Text>
                <Text style={styles.macroLabel}>Fats</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: `${COLORS.accent}20` }]}>
                <Ionicons name="add-circle" size={28} color={COLORS.accent} />
              </View>
              <Text style={styles.actionText}>Log Meal</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: `${COLORS.accent}20` }]}>
                <Ionicons name="water" size={28} color={COLORS.accent} />
              </View>
              <Text style={styles.actionText}>Add Water</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: `${COLORS.accent}20` }]}>
                <Ionicons name="camera" size={28} color={COLORS.accent} />
              </View>
              <Text style={styles.actionText}>Scan Food</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: `${COLORS.accent}20` }]}>
                <Ionicons name="restaurant" size={28} color={COLORS.accent} />
              </View>
              <Text style={styles.actionText}>View Meals</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Meals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          
          <View style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Ionicons name="sunny" size={24} color={COLORS.accent} />
              <Text style={styles.mealTitle}>Breakfast</Text>
            </View>
            <Text style={styles.mealName}>Oatmeal with Berries & Almonds</Text>
            <Text style={styles.mealCalories}>420 cal • 12g protein</Text>
          </View>

          <View style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Ionicons name="partly-sunny" size={24} color={COLORS.accent} />
              <Text style={styles.mealTitle}>Lunch</Text>
            </View>
            <Text style={styles.mealName}>Grilled Chicken Salad</Text>
            <Text style={styles.mealCalories}>580 cal • 45g protein</Text>
          </View>

          <View style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Ionicons name="moon" size={24} color={COLORS.accent} />
              <Text style={styles.mealTitle}>Dinner</Text>
            </View>
            <Text style={styles.mealName}>Salmon with Quinoa & Veggies</Text>
            <Text style={styles.mealCalories}>650 cal • 48g protein</Text>
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
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.mediumGray,
  },
  summaryCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  summaryGradient: {
    padding: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 16,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
  },
  macroLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  mealCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mediumGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  mealCalories: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
});
