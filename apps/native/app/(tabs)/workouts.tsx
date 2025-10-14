import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutsStore } from '../../store/workoutsStore';
import { format } from 'date-fns';

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
};

export default function WorkoutsScreen() {
  const [selectedType, setSelectedType] = useState('all');
  const { 
    workouts, 
    isLoading, 
    generateWorkout, 
    fetchWorkouts,
    todaysWorkout 
  } = useWorkoutsStore();

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const workoutTypes = [
    { key: 'all', label: 'All', icon: 'fitness' },
    { key: 'strength', label: 'Strength', icon: 'barbell' },
    { key: 'cardio', label: 'Cardio', icon: 'heart' },
    { key: 'flexibility', label: 'Flexibility', icon: 'body' },
  ];

  const handleGenerateWorkout = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    try {
      await generateWorkout(today);
    } catch (error) {
      console.error('Failed to generate workout:', error);
    }
  };
  const WorkoutCard = ({ workout }: { workout: any }) => (
    <View style={styles.workoutCard}>
      <View style={styles.workoutHeader}>
        <View style={styles.workoutInfo}>
          <Text style={styles.workoutTitle}>{workout.title || 'Custom Workout'}</Text>
          <Text style={styles.workoutDate}>
            {format(new Date(workout.date), 'EEEE, MMM d')}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          workout.status === 'completed' && styles.completedBadge
        ]}>
          <Text style={[
            styles.statusText,
            workout.status === 'completed' && styles.completedText
          ]}>
            {workout.status}
          </Text>
        </View>
      </View>
      
      {workout.exercises && workout.exercises.length > 0 && (
        <View style={styles.exercisesPreview}>
          <Text style={styles.exercisesLabel}>
            {workout.exercises.length} exercises
          </Text>
          {workout.exercises.slice(0, 2).map((exercise: any, index: number) => (
            <Text key={index} style={styles.exerciseItem}>
              • {exercise.name}
            </Text>
          ))}
          {workout.exercises.length > 2 && (
            <Text style={styles.moreExercises}>
              +{workout.exercises.length - 2} more
            </Text>
          )}
        </View>
      )}
      
      <TouchableOpacity style={styles.startButton} onPress={() => console.log('Start workout')}>
        <LinearGradient
          colors={[COLORS.accent, COLORS.accentSecondary]}
          style={styles.startButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.startButtonText}>
            {workout.status === 'completed' ? 'View Details' : 'Start Workout'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options" size={20} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      {/* Workout Type Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterContainer}
      >
        {workoutTypes.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.typeButton,
              selectedType === type.key && styles.selectedTypeButton
            ]}
            onPress={() => setSelectedType(type.key)}
          >
            {selectedType === type.key ? (
              <LinearGradient
                colors={[COLORS.accent, COLORS.accentSecondary]}
                style={styles.typeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={type.icon as any} size={16} color={COLORS.white} />
                <Text style={styles.selectedTypeButtonText}>{type.label}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.typeButtonContent}>
                <Ionicons name={type.icon as any} size={16} color={COLORS.accent} />
                <Text style={styles.typeButtonText}>{type.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Generate Workout Button */}
      <View style={styles.generateSection}>
        <TouchableOpacity 
          style={styles.generateButton} 
          onPress={handleGenerateWorkout}
          disabled={isLoading}
        >
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.generateGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons 
              name={isLoading ? "hourglass" : "sparkles"} 
              size={20} 
              color={COLORS.white} 
            />
            <Text style={styles.generateText}>
              {isLoading ? 'Generating...' : 'Generate AI Workout'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Workouts List */}
      <ScrollView 
        style={styles.workoutsList} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.workoutsContent}
      >
        {workouts.length > 0 ? (
          workouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="fitness-outline" size={48} color={COLORS.accent} />
            </View>
            <Text style={styles.emptyStateTitle}>Ready to start training?</Text>
            <Text style={styles.emptyStateText}>
              Generate your first AI-powered workout tailored to your goals
            </Text>
          </View>
        )}
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
    paddingBottom: 100,
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: 16,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    marginBottom: 4,
    color: '#1F2937',
  },
  cardDescription: {
    color: '#6B7280',
  },
  startButton: {
    borderRadius: 20,
  },
  customCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#7A3CF3',
  },
  customTitle: {
    color: '#FFFFFF',
    marginBottom: 4,
  },
  customDescription: {
    color: '#E5E7EB',
    marginBottom: spacing.md,
  },
  customButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#7A3CF3',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  loadingText: {
    marginLeft: spacing.sm,
    color: '#6B7280',
  },
  weekStatus: {
    marginTop: spacing.sm,
    color: '#10B981',
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    padding: spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  backButtonText: {
    fontSize: 16,
    color: '#7A3CF3',
    fontWeight: '500',
  },
  generatingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  generatingTitle: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: '#1F2937',
  },
  generatingSubtitle: {
    marginTop: spacing.sm,
    textAlign: 'center',
    color: '#6B7280',
  },
  workoutContent: {
    flex: 1,
  },
  workoutTitle: {
    color: '#1F2937',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  debugStatus: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: spacing.md,
    fontSize: 12,
  },
  duration: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  coachNotesContainer: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
  },
  sectionTitle: {
    color: '#1F2937',
    marginBottom: spacing.sm,
  },
  coachNotes: {
    color: '#374151',
  },
  blockContainer: {
    marginBottom: spacing.lg,
  },
  blockTitle: {
    color: '#1F2937',
    marginBottom: spacing.md,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  exerciseCard: {
    marginBottom: spacing.sm,
    borderRadius: 12,
    elevation: 1,
  },
  exerciseName: {
    color: '#1F2937',
    marginBottom: spacing.xs,
  },
  exerciseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restTime: {
    color: '#6B7280',
  },
  loadText: {
    color: '#7A3CF3',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});