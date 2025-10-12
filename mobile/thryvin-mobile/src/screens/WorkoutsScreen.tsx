import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Button, Chip, Ionicons } from '../components/RealComponents';
import { brandColors } from '../theme/theme';

const workoutTypes = [
  { id: 'hiit', label: 'HIIT', icon: 'flash' },
  { id: 'strength', label: 'Strength', icon: 'barbell' },
  { id: 'yoga', label: 'Yoga', icon: 'leaf' },
  { id: 'cardio', label: 'Cardio', icon: 'heart' },
  { id: 'mobility', label: 'Mobility', icon: 'refresh' },
];

export default function WorkoutsScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <Text style={styles.subtitle}>AI-powered fitness just for you</Text>
      </View>

      {/* Quick Generate */}
      <Card style={styles.generateCard}>
        <Card.Content>
          <View style={styles.generateHeader}>
            <Ionicons name="sparkles" size={24} color={brandColors.secondary} />
            <Text style={styles.generateTitle}>AI Workout Generator</Text>
          </View>
          <Text style={styles.generateDescription}>
            Get a personalized workout in seconds based on your goals, time, and equipment.
          </Text>
          <Button
            mode="contained"
            style={styles.generateButton}
            contentStyle={styles.buttonContent}
            onPress={() => {}}
          >
            Generate Now
          </Button>
        </Card.Content>
      </Card>

      {/* Workout Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose Your Focus</Text>
        <View style={styles.chipContainer}>
          {workoutTypes.map((type) => (
            <Chip
              key={type.id}
              style={styles.chip}
              textStyle={styles.chipText}
              icon={() => <Ionicons name={type.icon as any} size={16} color={brandColors.primary} />}
              onPress={() => {}}
            >
              {type.label}
            </Chip>
          ))}
        </View>
      </View>

      {/* Recent Workouts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Workouts</Text>
        <View style={styles.emptyState}>
          <Ionicons name="barbell-outline" size={48} color={brandColors.gray600} />
          <Text style={styles.emptyTitle}>No workouts yet</Text>
          <Text style={styles.emptyDescription}>
            Start your fitness journey by generating your first AI workout!
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
  generateCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: brandColors.white,
  },
  generateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  generateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: brandColors.gray900,
    marginLeft: 8,
  },
  generateDescription: {
    fontSize: 14,
    color: brandColors.gray600,
    marginBottom: 16,
    lineHeight: 20,
  },
  generateButton: {
    backgroundColor: brandColors.primary,
  },
  buttonContent: {
    paddingVertical: 4,
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
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: brandColors.white,
    borderWidth: 1,
    borderColor: brandColors.gray100,
  },
  chipText: {
    color: brandColors.gray900,
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