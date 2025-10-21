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
import { useWorkouts } from '../../store/workoutsStore';
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
    week, 
    today,
    loading, 
    generating,
    error,
    loadWeek, 
    loadToday,
    generateAndPoll
  } = useWorkouts();

  useEffect(() => {
    loadWeek();
  }, []);

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
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterScrollView: {
    paddingLeft: 24,
    marginBottom: 20,
  },
  filterContainer: {
    paddingRight: 24,
  },
  typeButton: {
    marginRight: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  selectedTypeButton: {},
  typeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  typeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
  },
  typeButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.accent,
  },
  selectedTypeButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.white,
  },
  generateSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  generateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  generateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  generateText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  workoutsList: {
    flex: 1,
  },
  workoutsContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  workoutCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
  },
  completedBadge: {
    backgroundColor: `${COLORS.success}20`,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.mediumGray,
    textTransform: 'capitalize',
  },
  completedText: {
    color: COLORS.success,
  },
  exercisesPreview: {
    marginBottom: 16,
  },
  exercisesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  exerciseItem: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 4,
  },
  moreExercises: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '500',
  },
  startButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  startButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.accent}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 22,
  },
});