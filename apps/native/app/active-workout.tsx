import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomAlert } from '../src/components/CustomAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// Mock workout sections
const WORKOUT_SECTIONS = {
  warmup: [
    { 
      name: 'Dynamic Leg Stretches', 
      duration: '3 min',
      description: 'Leg swings, walking lunges, high knees',
      videoUrl: 'placeholder',
    },
    { 
      name: 'Arm Circles & Shoulder Mobility', 
      duration: '2 min',
      description: 'Large arm circles, shoulder rolls, band pull-aparts',
      videoUrl: 'placeholder',
    },
  ],
  workout: [
    { 
      name: 'Bench Press',
      sets: 4,
      reps: '8-10',
      rest: '2 min',
      lastPerformance: '185 lbs × 9 reps',
      description: 'Flat barbell bench press. Keep elbows at 45-degree angle',
      videoUrl: 'placeholder',
    },
    { 
      name: 'Incline Dumbbell Press',
      sets: 3,
      reps: '10-12',
      rest: '90 sec',
      lastPerformance: '65 lbs × 11 reps',
      description: '30-45 degree incline. Control the negative',
      videoUrl: 'placeholder',
    },
    { 
      name: 'Overhead Press',
      sets: 4,
      reps: '6-8',
      rest: '2 min',
      lastPerformance: '115 lbs × 7 reps',
      description: 'Standing barbell press. Engage core throughout',
      videoUrl: 'placeholder',
    },
    { 
      name: 'Lateral Raises',
      sets: 3,
      reps: '12-15',
      rest: '60 sec',
      lastPerformance: '20 lbs × 14 reps',
      description: 'Slight bend in elbows. Lead with elbows, not hands',
      videoUrl: 'placeholder',
    },
  ],
  recovery: [
    { 
      name: 'Chest Stretch', 
      duration: '2 min',
      description: 'Doorway stretch, PNF stretching',
      videoUrl: 'placeholder',
    },
    { 
      name: 'Shoulder & Tricep Stretch', 
      duration: '2 min',
      description: 'Overhead tricep stretch, cross-body shoulder stretch',
      videoUrl: 'placeholder',
    },
  ],
};

type TabType = 'warmup' | 'workout' | 'recovery';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('warmup');
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [exerciseData, setExerciseData] = useState<any>({});
  
  // CustomAlert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
  }>({ visible: false, type: 'info', title: '', message: '' });
  
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, buttons?: any[]) => {
    setAlertConfig({ visible: true, type, title, message, buttons });
  };
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const handleBack = () => {
    showAlert('info', 'Exit Workout', 'How would you like to exit?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Save Progress', 
        onPress: () => {
          console.log('Saving workout progress...');
          router.back();
        }
      },
      { 
        text: 'Mark as Complete', 
        onPress: () => {
          console.log('Marking workout as complete...');
          router.back();
        },
      },
      { 
        text: 'Leave Without Saving', 
        onPress: () => router.back(),
        style: 'destructive'
      },
    ]);
  };

  const updateExerciseSet = (exerciseIndex: number, setIndex: number, field: string, value: string) => {
    setExerciseData({
      ...exerciseData,
      [`${exerciseIndex}-${setIndex}-${field}`]: value,
    });
  };

  const renderWarmup = () => (
    <View style={styles.section}>
      {WORKOUT_SECTIONS.warmup.map((exercise, index) => (
        <View key={index} style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <Ionicons name="flame-outline" size={24} color={COLORS.accent} />
            <View style={styles.exerciseHeaderText}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseMeta}>{exercise.duration}</Text>
            </View>
            <TouchableOpacity style={styles.doneButton}>
              <Ionicons name="checkmark-circle-outline" size={28} color={COLORS.success} />
            </TouchableOpacity>
          </View>
          <Text style={styles.exerciseDescription}>{exercise.description}</Text>
        </View>
      ))}
    </View>
  );

  const renderWorkout = () => (
    <View style={styles.section}>
      {WORKOUT_SECTIONS.workout.map((exercise, index) => (
        <View key={index} style={styles.exerciseCard}>
          <TouchableOpacity
            style={styles.exerciseHeader}
            onPress={() => setExpandedExercise(expandedExercise === index ? null : index)}
          >
            <Ionicons name="barbell-outline" size={24} color={COLORS.accent} />
            <View style={styles.exerciseHeaderText}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseMeta}>
                {exercise.sets} sets × {exercise.reps} reps • {exercise.rest} rest
              </Text>
            </View>
            <Ionicons 
              name={expandedExercise === index ? "chevron-up" : "chevron-down"} 
              size={24} 
              color={COLORS.mediumGray} 
            />
          </TouchableOpacity>

          {expandedExercise === index && (
            <View style={styles.expandedContent}>
              {/* Video Placeholder */}
              <View style={styles.videoPlaceholder}>
                <Ionicons name="play-circle-outline" size={64} color={COLORS.white} />
                <Text style={styles.videoText}>Video Tutorial</Text>
              </View>

              {/* Description */}
              <Text style={styles.exerciseDescription}>{exercise.description}</Text>

              {/* Last Performance */}
              <View style={styles.lastPerformance}>
                <Ionicons name="time-outline" size={18} color={COLORS.accent} />
                <Text style={styles.lastPerformanceText}>
                  Last time: {exercise.lastPerformance}
                </Text>
              </View>

              {/* Sets Tracking */}
              <Text style={styles.setsTitle}>Track Your Sets</Text>
              {Array.from({ length: exercise.sets }).map((_, setIndex) => (
                <View key={setIndex} style={styles.setRow}>
                  <Text style={styles.setNumber}>Set {setIndex + 1}</Text>
                  
                  <TextInput
                    style={styles.setInput}
                    placeholder="Reps"
                    placeholderTextColor={COLORS.mediumGray}
                    keyboardType="numeric"
                    value={exerciseData[`${index}-${setIndex}-reps`] || ''}
                    onChangeText={(value) => updateExerciseSet(index, setIndex, 'reps', value)}
                  />
                  
                  <TextInput
                    style={styles.setInput}
                    placeholder="Weight"
                    placeholderTextColor={COLORS.mediumGray}
                    keyboardType="numeric"
                    value={exerciseData[`${index}-${setIndex}-weight`] || ''}
                    onChangeText={(value) => updateExerciseSet(index, setIndex, 'weight', value)}
                  />

                  <TouchableOpacity style={styles.setDoneButton}>
                    <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
                  </TouchableOpacity>
                </View>
              ))}

              {/* How Did It Feel? */}
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackTitle}>How did this exercise feel?</Text>
                <View style={styles.feedbackButtons}>
                  <TouchableOpacity style={styles.feedbackButton}>
                    <Text style={styles.feedbackEmoji}>😰</Text>
                    <Text style={styles.feedbackLabel}>Too Hard</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.feedbackButton}>
                    <Text style={styles.feedbackEmoji}>💪</Text>
                    <Text style={styles.feedbackLabel}>Just Right</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.feedbackButton}>
                    <Text style={styles.feedbackEmoji}>😴</Text>
                    <Text style={styles.feedbackLabel}>Too Easy</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* AI Note */}
              <View style={styles.aiNote}>
                <Ionicons name="sparkles" size={16} color={COLORS.accent} />
                <Text style={styles.aiNoteText}>
                  AI will use your feedback to adjust future workouts
                </Text>
              </View>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderRecovery = () => (
    <View style={styles.section}>
      {WORKOUT_SECTIONS.recovery.map((exercise, index) => (
        <View key={index} style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <Ionicons name="heart-outline" size={24} color={COLORS.accent} />
            <View style={styles.exerciseHeaderText}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseMeta}>{exercise.duration}</Text>
            </View>
            <TouchableOpacity style={styles.doneButton}>
              <Ionicons name="checkmark-circle-outline" size={28} color={COLORS.success} />
            </TouchableOpacity>
          </View>
          <Text style={styles.exerciseDescription}>{exercise.description}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
      
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Workout</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Workout Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={20} color={COLORS.accent} />
          <Text style={styles.statText}>32:15</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="flame-outline" size={20} color={COLORS.accent} />
          <Text style={styles.statText}>180 cal</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="barbell-outline" size={20} color={COLORS.accent} />
          <Text style={styles.statText}>5/8 done</Text>
        </View>
      </View>

      {/* Tab Menu */}
      <View style={styles.tabMenu}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'warmup' && styles.tabActive]}
          onPress={() => setActiveTab('warmup')}
        >
          <LinearGradient
            colors={activeTab === 'warmup' ? [COLORS.accent, COLORS.accentSecondary] : ['transparent', 'transparent']}
            style={styles.tabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.tabText, activeTab === 'warmup' && styles.tabTextActive]}>
              Warm-up
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'workout' && styles.tabActive]}
          onPress={() => setActiveTab('workout')}
        >
          <LinearGradient
            colors={activeTab === 'workout' ? [COLORS.accent, COLORS.accentSecondary] : ['transparent', 'transparent']}
            style={styles.tabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.tabText, activeTab === 'workout' && styles.tabTextActive]}>
              Workout
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'recovery' && styles.tabActive]}
          onPress={() => setActiveTab('recovery')}
        >
          <LinearGradient
            colors={activeTab === 'recovery' ? [COLORS.accent, COLORS.accentSecondary] : ['transparent', 'transparent']}
            style={styles.tabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.tabText, activeTab === 'recovery' && styles.tabTextActive]}>
              Recovery
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Exercise List */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'warmup' && renderWarmup()}
        {activeTab === 'workout' && renderWorkout()}
        {activeTab === 'recovery' && renderRecovery()}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.lightGray,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  tabMenu: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabActive: {},
  tabGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    gap: 16,
  },
  exerciseCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  exerciseMeta: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  doneButton: {
    padding: 4,
  },
  exerciseDescription: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginTop: 12,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.white,
  },
  videoPlaceholder: {
    height: 200,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  videoText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: 8,
  },
  lastPerformance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent}10`,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  lastPerformanceText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.accent,
  },
  setsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 12,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    width: 50,
  },
  setInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.text,
  },
  setDoneButton: {
    padding: 4,
  },
  feedbackSection: {
    marginTop: 20,
  },
  feedbackTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  feedbackButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  feedbackButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  feedbackEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
  },
  aiNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent}10`,
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  aiNoteText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '500',
  },
});
