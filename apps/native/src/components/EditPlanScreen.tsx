/**
 * EditPlanScreen - Slide-up modal for editing workout plan
 * Features conversational flows for Add Workout and Harder/Easier
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useWorkoutStore, toLocalDateKey, getMondayOfWeek, findWorkoutByDate, findWorkoutIndexByDate } from '../stores/workout-store';
import { COLORS as THEME_COLORS } from '../constants/colors';

const COLORS = {
  accent: THEME_COLORS.gradientStart,
  accentSecondary: THEME_COLORS.gradientEnd,
  white: THEME_COLORS.white,
  text: THEME_COLORS.text,
  lightGray: THEME_COLORS.lightGray,
  mediumGray: THEME_COLORS.mediumGray,
  success: THEME_COLORS.success,
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://ai-trainer-upgrade.preview.emergentagent.com';
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface EditAction {
  id: string;
  icon: string;
  label: string;
  description: string;
  color: string;
  requiresTwoDays?: boolean;
}

// Removed Shorter and Longer as requested
const EDIT_ACTIONS: EditAction[] = [
  { id: 'swap', icon: 'swap-horizontal', label: 'Swap Days', description: 'Exchange two workout days', color: '#5B8DEF', requiresTwoDays: true },
  { id: 'skip', icon: 'close-circle', label: 'Skip Day', description: 'Convert to rest day', color: '#FF9500' },
  { id: 'add', icon: 'add-circle', label: 'Add Workout', description: 'Log a workout you did', color: '#34C759' },
  { id: 'harder', icon: 'flame', label: 'Make Harder', description: 'Increase intensity', color: '#FF3B30' },
  { id: 'easier', icon: 'leaf', label: 'Make Easier', description: 'Reduce intensity', color: '#00C7BE' },
];

interface EditPlanScreenProps {
  visible: boolean;
  onClose: () => void;
}

type FlowStep = 'select_action' | 'select_day' | 'add_details' | 'confirm' | 'adjust_feedback';

const getTodayKey = (): string => toLocalDateKey(new Date());

export const EditPlanScreen = ({ visible, onClose }: EditPlanScreenProps) => {
  const { weekWorkouts, completedWorkouts, updateWorkoutInWeek, swapWorkoutDays, syncFromBackend } = useWorkoutStore();
  
  // Flow state
  const [currentStep, setCurrentStep] = useState<FlowStep>('select_action');
  const [selectedAction, setSelectedAction] = useState<EditAction | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Add Workout form state
  const [workoutType, setWorkoutType] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  
  // Harder/Easier feedback state
  const [adjustmentFeedback, setAdjustmentFeedback] = useState('');

  // Organize workouts into weeks using DATE MATCHING
  const weeksData = useMemo(() => {
    const weeks: { weekNum: number; days: any[] }[] = [];
    const today = new Date();
    const monday = getMondayOfWeek(today);
    const todayKey = getTodayKey();
    
    for (let week = 1; week <= 3; week++) {
      const weekDays = [];
      
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const dayIndex = (week - 1) * 7 + dayOffset;
        const dayDate = new Date(monday);
        dayDate.setDate(monday.getDate() + dayIndex);
        const dateKey = toLocalDateKey(dayDate);
        
        const workout = findWorkoutByDate(weekWorkouts, dayDate);
        const isCompleted = workout?.completed || completedWorkouts.some(cw => cw?.id === workout?.id);
        
        weekDays.push({
          dayName: DAYS[dayOffset],
          dayNameFull: DAYS_FULL[dayOffset],
          dayIndex,
          date: dayDate,
          dateKey,
          workout: workout || null,
          isCompleted,
          isToday: dateKey === todayKey,
          isRest: workout?.isRestDay || workout?.title?.toLowerCase().includes('rest'),
        });
      }
      
      weeks.push({ weekNum: week, days: weekDays });
    }
    
    return weeks;
  }, [weekWorkouts, completedWorkouts]);

  const getSelectedDayInfo = () => {
    if (selectedDays.length === 0) return null;
    const allDays = weeksData.flatMap(w => w.days);
    return allDays.find(d => d.dateKey === selectedDays[0]);
  };

  const resetFlow = () => {
    setCurrentStep('select_action');
    setSelectedAction(null);
    setSelectedDays([]);
    setWorkoutType('');
    setWorkoutDuration('');
    setWorkoutDescription('');
    setAdjustmentFeedback('');
  };

  const handleClose = () => {
    resetFlow();
    onClose();
  };

  const handleSelectAction = (action: EditAction) => {
    setSelectedAction(action);
    setSelectedDays([]);
    setCurrentStep('select_day');
  };

  const handleDaySelect = (dateKey: string) => {
    if (!selectedAction) return;
    
    const day = weeksData.flatMap(w => w.days).find(d => d.dateKey === dateKey);
    
    if (day?.isCompleted && selectedAction.id !== 'add') {
      Alert.alert('Completed', 'Cannot edit completed workouts.');
      return;
    }
    
    // Swap needs exactly 2 days
    if (selectedAction.requiresTwoDays) {
      if (selectedDays.includes(dateKey)) {
        setSelectedDays(selectedDays.filter(d => d !== dateKey));
      } else if (selectedDays.length < 2) {
        const newSelection = [...selectedDays, dateKey];
        setSelectedDays(newSelection);
        if (newSelection.length === 2) {
          // Auto-proceed to confirm for swap
          handleSwapConfirm(newSelection);
        }
      }
      return;
    }
    
    // Add only works on rest days
    if (selectedAction.id === 'add' && !day?.isRest) {
      Alert.alert('Not a Rest Day', 'You can only add a workout to a rest day.');
      return;
    }
    
    // Skip doesn't work on rest days
    if (selectedAction.id === 'skip' && day?.isRest) {
      Alert.alert('Already Rest', 'This is already a rest day.');
      return;
    }
    
    setSelectedDays([dateKey]);
    
    // Move to next step based on action
    if (selectedAction.id === 'add') {
      setCurrentStep('add_details');
    } else if (selectedAction.id === 'harder' || selectedAction.id === 'easier') {
      setCurrentStep('adjust_feedback');
    } else if (selectedAction.id === 'skip') {
      handleSkipConfirm(dateKey);
    }
  };

  const handleSwapConfirm = async (days: string[]) => {
    setIsProcessing(true);
    try {
      const fromIdx = findWorkoutIndexByDate(weekWorkouts, days[0]);
      const toIdx = findWorkoutIndexByDate(weekWorkouts, days[1]);
      if (fromIdx >= 0 && toIdx >= 0) {
        await swapWorkoutDays(fromIdx, toIdx);
        Alert.alert('Done! ✅', 'Workout days have been swapped.');
      }
      resetFlow();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to swap days.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipConfirm = async (dateKey: string) => {
    setIsProcessing(true);
    try {
      const idx = findWorkoutIndexByDate(weekWorkouts, dateKey);
      const workout = weekWorkouts[idx];
      if (workout && idx >= 0) {
        await updateWorkoutInWeek(idx, {
          ...workout,
          isRestDay: true,
          title: 'Rest Day',
          type: 'Rest',
          exercises: [],
          duration: 0,
        });
        Alert.alert('Done! ✅', 'Day converted to rest day.');
      }
      resetFlow();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to skip day.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddWorkoutSubmit = () => {
    if (!workoutType.trim()) {
      Alert.alert('Missing Info', 'Please enter the type of workout you did.');
      return;
    }
    setCurrentStep('confirm');
  };

  const handleAddWorkoutConfirm = async () => {
    setIsProcessing(true);
    try {
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      const dateKey = selectedDays[0];
      const idx = findWorkoutIndexByDate(weekWorkouts, dateKey);
      const dayInfo = getSelectedDayInfo();
      
      const duration = parseInt(workoutDuration) || 30;
      
      // Create logged workout
      const loggedWorkout = {
        id: `logged_${Date.now()}`,
        title: workoutType.trim(),
        type: workoutType.trim(),
        duration,
        date: dayInfo?.date?.toISOString() || new Date().toISOString(),
        completedAt: new Date().toISOString(),
        completed: true,
        isRestDay: false,
        isLogged: true,
        caloriesBurn: Math.round(duration * 6),
        exercises: workoutDescription ? [
          { id: 'logged1', name: workoutDescription, sets: 0, reps: '0', category: 'main' }
        ] : [],
        overview: workoutDescription || `${workoutType} workout logged manually`,
      };
      
      // Update local store
      if (idx >= 0) {
        await updateWorkoutInWeek(idx, loggedWorkout);
      }
      
      // Send to backend for AI context
      try {
        await fetch(`${API_BASE_URL}/api/workouts/log-extra`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({ workout: loggedWorkout }),
        });
      } catch (e) {
        console.log('Could not sync to backend');
      }
      
      Alert.alert('Workout Logged! 💪', `Your ${workoutType} workout has been recorded.`);
      resetFlow();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add workout.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdjustmentSubmit = async () => {
    if (!adjustmentFeedback.trim()) {
      Alert.alert('Missing Info', `Please tell us what you'd like to change.`);
      return;
    }
    
    setIsProcessing(true);
    try {
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      const dateKey = selectedDays[0];
      const idx = findWorkoutIndexByDate(weekWorkouts, dateKey);
      
      // Call AI to adjust workout
      const response = await fetch(`${API_BASE_URL}/api/workouts/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          dayIndex: idx,
          dateKey,
          adjustment: selectedAction?.id, // 'harder' or 'easier'
          feedback: adjustmentFeedback,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.workout) {
          await updateWorkoutInWeek(idx, data.workout);
        }
        await syncFromBackend();
        Alert.alert('Updated! ✅', `Workout has been made ${selectedAction?.id}.`);
      } else {
        // Fallback: simple local adjustment
        const workout = weekWorkouts[idx];
        if (workout && workout.exercises) {
          const adjustedExercises = workout.exercises.map((ex: any) => ({
            ...ex,
            sets: selectedAction?.id === 'harder' 
              ? Math.min((ex.sets || 3) + 1, 6)
              : Math.max((ex.sets || 3) - 1, 1),
            note: adjustmentFeedback,
          }));
          await updateWorkoutInWeek(idx, {
            ...workout,
            exercises: adjustedExercises,
            adjustedAt: new Date().toISOString(),
            adjustmentNote: adjustmentFeedback,
          });
          Alert.alert('Updated! ✅', `Workout has been adjusted based on your feedback.`);
        }
      }
      
      resetFlow();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to adjust workout.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Render different steps
  const renderActionSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What would you like to do?</Text>
      <View style={styles.actionsGrid}>
        {EDIT_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionCard}
            onPress={() => handleSelectAction(action)}
          >
            <View style={[styles.actionIconBg, { backgroundColor: `${action.color}15` }]}>
              <Ionicons name={action.icon as any} size={26} color={action.color} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
            <Text style={styles.actionDesc}>{action.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDaySelection = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity onPress={() => setCurrentStep('select_action')} style={styles.backButton}>
        <Ionicons name="arrow-back" size={20} color={COLORS.accent} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      
      <Text style={styles.stepTitle}>
        {selectedAction?.requiresTwoDays 
          ? `Select 2 days to ${selectedAction.label.toLowerCase()}`
          : selectedAction?.id === 'add'
            ? 'Which day did you work out?'
            : `Select a day to make ${selectedAction?.label.toLowerCase()}`
        }
      </Text>
      
      {/* Week Tabs */}
      <View style={styles.weekTabs}>
        {[1, 2, 3].map(week => (
          <TouchableOpacity
            key={week}
            style={[styles.weekTab, selectedWeek === week && styles.weekTabSelected]}
            onPress={() => setSelectedWeek(week)}
          >
            <Text style={[styles.weekTabText, selectedWeek === week && styles.weekTabTextSelected]}>
              Week {week}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Days */}
      <ScrollView style={styles.daysScroll} showsVerticalScrollIndicator={false}>
        {weeksData[selectedWeek - 1]?.days.map((day) => {
          const isSelected = selectedDays.includes(day.dateKey);
          const canSelect = (selectedAction?.id !== 'add' || day.isRest) &&
                           (selectedAction?.id !== 'skip' || !day.isRest);
          
          return (
            <TouchableOpacity
              key={day.dateKey}
              style={[
                styles.dayRow,
                day.isToday && styles.dayRowToday,
                isSelected && styles.dayRowSelected,
                !canSelect && styles.dayRowDisabled,
              ]}
              onPress={() => handleDaySelect(day.dateKey)}
              disabled={!canSelect}
            >
              <View style={styles.dayInfo}>
                <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                  {day.dayNameFull}
                </Text>
                <Text style={styles.dayDate}>{day.dateKey.slice(5)}</Text>
              </View>
              
              <View style={styles.dayWorkout}>
                {day.isRest ? (
                  <Text style={styles.restLabel}>Rest Day</Text>
                ) : (
                  <Text style={styles.workoutLabel} numberOfLines={1}>
                    {day.workout?.title || 'Workout'}
                  </Text>
                )}
              </View>
              
              {isSelected && (
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={16} color={COLORS.white} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderAddDetails = () => {
    const dayInfo = getSelectedDayInfo();
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.stepContainer}>
        <TouchableOpacity onPress={() => setCurrentStep('select_day')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={COLORS.accent} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.stepTitle}>What workout did you do?</Text>
        <Text style={styles.stepSubtitle}>on {dayInfo?.dayNameFull}</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Type of workout</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Chest & Triceps, Cardio, Yoga"
            placeholderTextColor={COLORS.mediumGray}
            value={workoutType}
            onChangeText={setWorkoutType}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>How long? (minutes)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 30"
            placeholderTextColor={COLORS.mediumGray}
            value={workoutDuration}
            onChangeText={setWorkoutDuration}
            keyboardType="number-pad"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Brief description (optional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="e.g., Bench press, incline dumbbell, cable flys..."
            placeholderTextColor={COLORS.mediumGray}
            value={workoutDescription}
            onChangeText={setWorkoutDescription}
            multiline
            numberOfLines={3}
          />
        </View>
        
        <TouchableOpacity style={styles.primaryButton} onPress={handleAddWorkoutSubmit}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.primaryButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  };

  const renderConfirm = () => {
    const dayInfo = getSelectedDayInfo();
    return (
      <View style={styles.stepContainer}>
        <TouchableOpacity onPress={() => setCurrentStep('add_details')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={COLORS.accent} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.stepTitle}>Confirm your workout</Text>
        
        <View style={styles.confirmCard}>
          <View style={styles.confirmRow}>
            <Ionicons name="calendar" size={20} color={COLORS.accent} />
            <Text style={styles.confirmLabel}>Day</Text>
            <Text style={styles.confirmValue}>{dayInfo?.dayNameFull}</Text>
          </View>
          
          <View style={styles.confirmRow}>
            <Ionicons name="barbell" size={20} color={COLORS.accent} />
            <Text style={styles.confirmLabel}>Workout</Text>
            <Text style={styles.confirmValue}>{workoutType}</Text>
          </View>
          
          <View style={styles.confirmRow}>
            <Ionicons name="time" size={20} color={COLORS.accent} />
            <Text style={styles.confirmLabel}>Duration</Text>
            <Text style={styles.confirmValue}>{workoutDuration || '30'} minutes</Text>
          </View>
          
          {workoutDescription ? (
            <View style={styles.confirmDescRow}>
              <Text style={styles.confirmDescLabel}>Description</Text>
              <Text style={styles.confirmDescValue}>{workoutDescription}</Text>
            </View>
          ) : null}
        </View>
        
        <Text style={styles.confirmQuestion}>Is this correct?</Text>
        
        <View style={styles.confirmButtons}>
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => setCurrentStep('add_details')}
          >
            <Text style={styles.secondaryButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleAddWorkoutConfirm}
            disabled={isProcessing}
          >
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={styles.primaryButtonGradient}
            >
              {isProcessing ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                  <Text style={styles.primaryButtonText}>Yes, Log It!</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAdjustFeedback = () => {
    const dayInfo = getSelectedDayInfo();
    const isHarder = selectedAction?.id === 'harder';
    
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.stepContainer}>
        <TouchableOpacity onPress={() => setCurrentStep('select_day')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={COLORS.accent} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.adjustHeader}>
          <View style={[styles.adjustIconBg, { backgroundColor: isHarder ? '#FF3B3015' : '#00C7BE15' }]}>
            <Ionicons 
              name={isHarder ? 'flame' : 'leaf'} 
              size={32} 
              color={isHarder ? '#FF3B30' : '#00C7BE'} 
            />
          </View>
          <Text style={styles.stepTitle}>
            Make {dayInfo?.dayNameFull} {isHarder ? 'Harder' : 'Easier'}
          </Text>
        </View>
        
        <Text style={styles.adjustPrompt}>
          {isHarder 
            ? "What would you like to make harder? More reps, heavier weights, extra sets?"
            : "What's making it too difficult? Too many reps, too intense, need more rest?"
          }
        </Text>
        
        <TextInput
          style={[styles.input, styles.inputMultiline, styles.feedbackInput]}
          placeholder={isHarder 
            ? "e.g., Add more sets, increase weights, less rest time..."
            : "e.g., Less reps, lighter weights, more rest between sets..."
          }
          placeholderTextColor={COLORS.mediumGray}
          value={adjustmentFeedback}
          onChangeText={setAdjustmentFeedback}
          multiline
          numberOfLines={4}
        />
        
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleAdjustmentSubmit}
          disabled={isProcessing}
        >
          <LinearGradient
            colors={isHarder ? ['#FF3B30', '#FF6B35'] : ['#00C7BE', '#34C759']}
            style={styles.primaryButtonGradient}
          >
            {isProcessing ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name={isHarder ? 'flame' : 'leaf'} size={20} color={COLORS.white} />
                <Text style={styles.primaryButtonText}>
                  Update Workout
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.mediumGray} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Plan</Text>
            <View style={{ width: 32 }} />
          </View>

          {/* Content based on step */}
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {currentStep === 'select_action' && renderActionSelection()}
            {currentStep === 'select_day' && renderDaySelection()}
            {currentStep === 'add_details' && renderAddDetails()}
            {currentStep === 'confirm' && renderConfirm()}
            {currentStep === 'adjust_feedback' && renderAdjustFeedback()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  closeButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  content: { flex: 1, padding: 20 },
  
  // Step Container
  stepContainer: { flex: 1 },
  stepTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  stepSubtitle: { fontSize: 16, color: COLORS.mediumGray, marginBottom: 20 },
  
  // Back Button
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 6 },
  backText: { fontSize: 16, color: COLORS.accent, fontWeight: '600' },
  
  // Actions Grid
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: {
    width: '47%',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  actionIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  actionDesc: { fontSize: 12, color: COLORS.mediumGray, textAlign: 'center' },
  
  // Week Tabs
  weekTabs: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  weekTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  weekTabSelected: { backgroundColor: COLORS.accent },
  weekTabText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  weekTabTextSelected: { color: COLORS.white },
  
  // Days
  daysScroll: { flex: 1 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    marginBottom: 10,
  },
  dayRowToday: { borderWidth: 2, borderColor: COLORS.accent },
  dayRowSelected: { backgroundColor: `${COLORS.accent}20`, borderWidth: 2, borderColor: COLORS.accent },
  dayRowDisabled: { opacity: 0.4 },
  dayInfo: { flex: 1 },
  dayName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  dayNameSelected: { color: COLORS.accent },
  dayDate: { fontSize: 12, color: COLORS.mediumGray, marginTop: 2 },
  dayWorkout: { flex: 1, alignItems: 'flex-end' },
  restLabel: { fontSize: 14, color: COLORS.mediumGray },
  workoutLabel: { fontSize: 14, color: COLORS.text },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  
  // Form
  formGroup: { marginBottom: 20 },
  formLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  feedbackInput: { minHeight: 120 },
  
  // Buttons
  primaryButton: { borderRadius: 14, overflow: 'hidden', marginTop: 20 },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  confirmButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  
  // Confirm Card
  confirmCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
  },
  confirmRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  confirmLabel: { fontSize: 14, color: COLORS.mediumGray, width: 80 },
  confirmValue: { fontSize: 16, fontWeight: '600', color: COLORS.text, flex: 1 },
  confirmDescRow: { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.white },
  confirmDescLabel: { fontSize: 14, color: COLORS.mediumGray, marginBottom: 8 },
  confirmDescValue: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
  confirmQuestion: { fontSize: 18, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  
  // Adjust Header
  adjustHeader: { alignItems: 'center', marginBottom: 20 },
  adjustIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  adjustPrompt: {
    fontSize: 16,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
});
