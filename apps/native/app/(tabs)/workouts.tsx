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
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Workouts
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Choose your workout type
        </Text>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#7A3CF3" />
            <Text variant="bodySmall" style={styles.loadingText}>
              Loading workouts...
            </Text>
          </View>
        )}
        {week && week.length > 0 && (
          <Text variant="bodySmall" style={styles.weekStatus}>
            Weekly schedule ready ({week.length}/7 days)
          </Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {workoutTypes.map((workout) => (
          <Card key={workout.id} style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.cardInfo}>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  {workout.title}
                </Text>
                <Text variant="bodyMedium" style={styles.cardDescription}>
                  Personalized {workout.title.toLowerCase()} session
                </Text>
              </View>
              <Button 
                mode="contained" 
                compact
                style={[styles.startButton, { backgroundColor: workout.color }]}
                onPress={() => handleStartWorkout()}
                disabled={isGenerating}
                loading={isGenerating}
              >
                {isGenerating ? 'Gen...' : 'Start'}
              </Button>
            </Card.Content>
          </Card>
        ))}

        <Card style={styles.customCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.customTitle}>
              Custom Workout
            </Text>
            <Text variant="bodyMedium" style={styles.customDescription}>
              Let AI create a personalized workout just for you
            </Text>
            <Button 
              mode="contained" 
              style={styles.customButton}
              icon="auto-fix"
              onPress={() => handleStartWorkout()}
              disabled={isGenerating}
              loading={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Custom Workout'}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => console.log('Add workout')}
      />
      
      {/* Workout Detail Modal */}
      <Modal
        visible={showWorkoutDetail}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable 
              style={styles.backButton}
              onPress={() => setShowWorkoutDetail(false)}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </Pressable>
            
            {!today || today.status === 'pending' || today.status === 'generating' ? (
              <View style={styles.generatingContainer}>
                <ActivityIndicator size="large" color="#7A3CF3" />
                <Text variant="headlineSmall" style={styles.generatingTitle}>
                  Generating your workout...
                </Text>
                <Text variant="bodyMedium" style={styles.generatingSubtitle}>
                  Our AI is creating the perfect workout for you
                </Text>
              </View>
            ) : today.status === 'ready' && today.payloadJson ? (
              <ScrollView style={styles.workoutContent}>
                {/* Workout Header */}
                <Text variant="headlineMedium" style={styles.workoutTitle}>
                  {today?.title ?? 'Workout'}
                </Text>
                {today?.status && (
                  <Text testID="today-status" variant="bodySmall" style={styles.debugStatus}>
                    Status: {today.status}
                  </Text>
                )}
                
                {today.payloadJson.duration_min && (
                  <Text variant="bodyLarge" style={styles.duration}>
                    Duration: {today.payloadJson.duration_min} minutes
                  </Text>
                )}
                
                {today.payloadJson.coach_notes && (
                  <View style={styles.coachNotesContainer}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Coach Notes
                    </Text>
                    <Text variant="bodyMedium" style={styles.coachNotes}>
                      {today.payloadJson.coach_notes}
                    </Text>
                  </View>
                )}
                
                {/* Workout Blocks */}
                {!today.payloadJson.blocks || today.payloadJson.blocks.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text variant="bodyMedium" style={styles.emptyText}>
                      No exercises yet
                    </Text>
                  </View>
                ) : (
                  (() => {
                    const blockOrder = { warmup: 0, main: 1, recovery: 2 };
                    const sortedBlocks = [...today.payloadJson.blocks].sort((a, b) => 
                      (blockOrder[a.type as keyof typeof blockOrder] ?? 999) - (blockOrder[b.type as keyof typeof blockOrder] ?? 999)
                    );
                    
                    return sortedBlocks.map((block: any, blockIndex: number) => (
                      <View key={blockIndex} style={styles.blockContainer}>
                        <Text variant="titleLarge" style={styles.blockTitle}>
                          {block.type === 'warmup' ? 'Warm-up' : 
                           block.type === 'main' ? 'Workout' : 
                           block.type === 'recovery' ? 'Recovery' : block.type}
                        </Text>
                        
                        {block.items?.map((item: any, itemIndex: number) => (
                          <Card key={itemIndex} style={styles.exerciseCard}>
                            <Card.Content>
                              <Text variant="titleMedium" style={styles.exerciseName}>
                                {item.name}
                              </Text>
                              <View style={styles.exerciseDetails}>
                                <Text variant="bodyMedium">
                                  {item.sets} sets × {item.reps} reps
                                </Text>
                                {item.rest_sec && (
                                  <Text variant="bodySmall" style={styles.restTime}>
                                    Rest: {item.rest_sec}s
                                  </Text>
                                )}
                                {item.load && (
                                  <Text variant="bodySmall" style={styles.loadText}>
                                    Load: {item.load}
                                  </Text>
                                )}
                              </View>
                            </Card.Content>
                          </Card>
                        ))}
                      </View>
                    ));
                  })()
                )}
              </ScrollView>
            ) : (
              <View style={styles.errorContainer}>
                <Text variant="headlineSmall" style={styles.errorTitle}>
                  Unable to load workout
                </Text>
                <Text variant="bodyMedium">
                  Status: {today?.status || 'Unknown'}
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
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