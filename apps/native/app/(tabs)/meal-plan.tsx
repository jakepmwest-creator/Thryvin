import React, { useState } from 'react';
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

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MOCK_MEALS = {
  breakfast: 'Oatmeal & Berries',
  lunch: 'Chicken Salad Bowl',
  dinner: 'Salmon & Quinoa',
};

export default function MealPlanScreen() {
  const [selectedDay, setSelectedDay] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader mode="nutrition" />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Meal Plan</Text>
          <TouchableOpacity style={styles.generateButton}>
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={styles.generateGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="sparkles" size={18} color={COLORS.white} />
              <Text style={styles.generateText}>Generate AI Plan</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Week Calendar */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.calendar}
          contentContainerStyle={styles.calendarContent}
        >
          {DAYS.map((day, index) => (
            <TouchableOpacity
              key={day}
              style={[styles.dayCard, selectedDay === index && styles.dayCardActive]}
              onPress={() => setSelectedDay(index)}
            >
              {selectedDay === index && (
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentSecondary]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              <Text style={[styles.dayText, selectedDay === index && styles.dayTextActive]}>
                {day}
              </Text>
              <Text style={[styles.dateText, selectedDay === index && styles.dateTextActive]}>
                {index + 21}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Meals for Selected Day */}
        <View style={styles.mealsSection}>
          {/* Breakfast */}
          <View style={styles.mealCard}>
            <View style={styles.mealCardHeader}>
              <View style={styles.mealIcon}>
                <Ionicons name="sunny" size={24} color={COLORS.accent} />
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealTime}>08:00 AM</Text>
                <Text style={styles.mealType}>Breakfast</Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="create-outline" size={22} color={COLORS.accent} />
              </TouchableOpacity>
            </View>
            <Text style={styles.mealName}>{MOCK_MEALS.breakfast}</Text>
            <Text style={styles.mealMacros}>420 cal • 12g protein • 60g carbs</Text>
          </View>

          {/* Lunch */}
          <View style={styles.mealCard}>
            <View style={styles.mealCardHeader}>
              <View style={styles.mealIcon}>
                <Ionicons name="partly-sunny" size={24} color={COLORS.accent} />
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealTime}>01:00 PM</Text>
                <Text style={styles.mealType}>Lunch</Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="create-outline" size={22} color={COLORS.accent} />
              </TouchableOpacity>
            </View>
            <Text style={styles.mealName}>{MOCK_MEALS.lunch}</Text>
            <Text style={styles.mealMacros}>580 cal • 45g protein • 42g carbs</Text>
          </View>

          {/* Dinner */}
          <View style={styles.mealCard}>
            <View style={styles.mealCardHeader}>
              <View style={styles.mealIcon}>
                <Ionicons name="moon" size={24} color={COLORS.accent} />
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealTime}>07:00 PM</Text>
                <Text style={styles.mealType}>Dinner</Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="create-outline" size={22} color={COLORS.accent} />
              </TouchableOpacity>
            </View>
            <Text style={styles.mealName}>{MOCK_MEALS.dinner}</Text>
            <Text style={styles.mealMacros}>650 cal • 48g protein • 55g carbs</Text>
          </View>

          {/* Snacks */}
          <TouchableOpacity style={styles.addMealCard}>
            <Ionicons name="add-circle-outline" size={28} color={COLORS.accent} />
            <Text style={styles.addMealText}>Add Snack or Meal</Text>
          </TouchableOpacity>
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
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  generateButton: {
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  generateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  generateText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  calendar: {
    marginBottom: 20,
  },
  calendarContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  dayCard: {
    width: 60,
    height: 70,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  dayCardActive: {
    backgroundColor: COLORS.accent,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.mediumGray,
    marginBottom: 4,
  },
  dayTextActive: {
    color: COLORS.white,
    position: 'relative',
    zIndex: 1,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  dateTextActive: {
    color: COLORS.white,
    position: 'relative',
    zIndex: 1,
  },
  mealsSection: {
    paddingHorizontal: 20,
  },
  mealCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  mealCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealTime: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginBottom: 2,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  mealMacros: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  addMealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderStyle: 'dashed',
    gap: 8,
  },
  addMealText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.accent,
  },
});
