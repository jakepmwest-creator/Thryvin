/**
 * EditPlanScreen - Slide-up modal for editing workout plan
 * Same style as ViewAllWeeksModal but with action selection
 */

import React, { useState, useMemo, useCallback } from 'react';
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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://trainee-assist.preview.emergentagent.com';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface EditAction {
  id: string;
  icon: string;
  label: string;
  color: string;
  requiresTwoDays?: boolean;
}

const EDIT_ACTIONS: EditAction[] = [
  { id: 'swap', icon: 'swap-horizontal', label: 'Swap Days', color: '#5B8DEF', requiresTwoDays: true },
  { id: 'skip', icon: 'close-circle', label: 'Skip Day', color: '#FF9500' },
  { id: 'add', icon: 'add-circle', label: 'Add Workout', color: '#34C759' },
  { id: 'harder', icon: 'flame', label: 'Harder', color: '#FF3B30' },
  { id: 'easier', icon: 'leaf', label: 'Easier', color: '#00C7BE' },
  { id: 'shorter', icon: 'time-outline', label: 'Shorter', color: '#FF6B35' },
  { id: 'longer', icon: 'timer-outline', label: 'Longer', color: '#A22BF6' },
];

interface EditPlanScreenProps {
  visible: boolean;
  onClose: () => void;
}

// Get today's date key for comparison
const getTodayKey = (): string => toLocalDateKey(new Date());

export const EditPlanScreen = ({ visible, onClose }: EditPlanScreenProps) => {
  const { weekWorkouts, completedWorkouts, updateWorkoutInWeek, swapWorkoutDays, fetchWeekWorkouts, syncFromBackend } = useWorkoutStore();
  
  const [selectedAction, setSelectedAction] = useState<EditAction | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]); // Store date keys, not indices
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [addWorkoutInput, setAddWorkoutInput] = useState('');

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
        
        // Find workout by DATE
        const workout = findWorkoutByDate(weekWorkouts, dayDate);
        const isCompleted = workout?.completed || completedWorkouts.some(cw => cw?.id === workout?.id);
        
        weekDays.push({
          dayName: DAYS[dayOffset],
          dayIndex: dayIndex,
          date: dayDate,
          dateKey: dateKey,
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

  const getWeekStats = (week: { days: any[] }) => {
    const completed = week.days.filter(d => d.isCompleted).length;
    const total = week.days.filter(d => d.workout && !d.isRest).length;
    return { completed, total };
  };

  const handleSelectAction = (action: EditAction) => {
    setSelectedAction(action);
    setSelectedDays([]);
    setAddWorkoutInput('');
  };

  const handleDaySelect = (dateKey: string) => {
    if (!selectedAction) return;
    
    const day = weeksData.flatMap(w => w.days).find(d => d.dateKey === dateKey);
    
    if (day?.isCompleted) {
      Alert.alert('Completed', 'Cannot edit completed workouts.');
      return;
    }
    
    // Swap needs exactly 2 days
    if (selectedAction.requiresTwoDays) {
      if (selectedDays.includes(dateKey)) {
        setSelectedDays(selectedDays.filter(d => d !== dateKey));
      } else if (selectedDays.length < 2) {
        setSelectedDays([...selectedDays, dateKey]);
      }
      return;
    }
    
    // Add only works on rest days
    if (selectedAction.id === 'add' && !day?.isRest) {
      Alert.alert('Not a Rest Day', 'Can only add workouts to rest days.');
      return;
    }
    
    // Skip doesn't work on rest days - but CONVERTS to rest, so allow it
    if (selectedAction.id === 'skip' && day?.isRest) {
      Alert.alert('Already Rest', 'This is already a rest day.');
      return;
    }
    
    // Toggle selection for single or multi-select
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter(d => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex]);
    }
  };

  const handleApply = async () => {
    if (!selectedAction || selectedDays.length === 0) return;
    if (selectedAction.requiresTwoDays && selectedDays.length !== 2) {
      Alert.alert('Select Two Days', 'Please select exactly two days to swap.');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      
      switch (selectedAction.id) {
        case 'swap':
          await swapWorkoutDays(selectedDays[0], selectedDays[1]);
          Alert.alert('Done!', 'Days swapped successfully.');
          break;
          
        case 'skip':
          for (const idx of selectedDays) {
            const workout = weekWorkouts[idx];
            if (workout) {
              await updateWorkoutInWeek(idx, {
                ...workout,
                isRestDay: true,
                title: 'Rest Day (Skipped)',
                exercises: [],
              });
            }
          }
          Alert.alert('Done!', 'Day(s) skipped.');
          break;
          
        case 'add':
          const idx = selectedDays[0];
          const request = addWorkoutInput.trim() || 'moderate full body workout';
          
          try {
            const res = await fetch(`${API_BASE_URL}/api/workouts/generate-for-day`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
              },
              body: JSON.stringify({ dayIndex: idx, request }),
            });
            
            if (res.ok) {
              const data = await res.json();
              await updateWorkoutInWeek(idx, data);
            } else {
              // Fallback
              const workout = weekWorkouts[idx];
              await updateWorkoutInWeek(idx, {
                ...workout,
                isRestDay: false,
                title: 'Custom Workout',
                exercises: [
                  { id: 'e1', name: 'Push-ups', sets: 3, reps: '12', restTime: 60 },
                  { id: 'e2', name: 'Squats', sets: 3, reps: '15', restTime: 60 },
                ],
              });
            }
          } catch {
            const workout = weekWorkouts[idx];
            await updateWorkoutInWeek(idx, {
              ...workout,
              isRestDay: false,
              title: 'Custom Workout',
              exercises: [
                { id: 'e1', name: 'Push-ups', sets: 3, reps: '12', restTime: 60 },
              ],
            });
          }
          Alert.alert('Done!', 'Workout added.');
          break;
          
        case 'harder':
        case 'easier':
        case 'shorter':
        case 'longer':
          for (const idx of selectedDays) {
            await fetch(`${API_BASE_URL}/api/workouts/update-in-place`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
              },
              body: JSON.stringify({ dayIndex: idx, modification: selectedAction.id }),
            });
          }
          // Sync from backend to get latest changes
          await syncFromBackend();
          Alert.alert('Done!', `Workout(s) updated to be ${selectedAction.id}.`);
          break;
      }
      
      setSelectedAction(null);
      setSelectedDays([]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedAction(null);
    setSelectedDays([]);
    onClose();
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
            <Text style={styles.title}>Edit Plan</Text>
            {selectedAction && (
              <TouchableOpacity onPress={() => { setSelectedAction(null); setSelectedDays([]); }} style={styles.clearButton}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
            {!selectedAction && <View style={{ width: 50 }} />}
          </View>

          {/* Action Buttons - Always visible at top */}
          <View style={styles.actionsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsScroll}>
              {EDIT_ACTIONS.map((action) => {
                const isSelected = selectedAction?.id === action.id;
                return (
                  <TouchableOpacity
                    key={action.id}
                    style={[styles.actionChip, isSelected && { backgroundColor: action.color }]}
                    onPress={() => handleSelectAction(action)}
                  >
                    <Ionicons 
                      name={action.icon as any} 
                      size={18} 
                      color={isSelected ? COLORS.white : action.color} 
                    />
                    <Text style={[styles.actionChipText, isSelected && { color: COLORS.white }]}>
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {/* Swipe indicator */}
            <View style={styles.swipeIndicator}>
              <Ionicons name="chevron-forward" size={16} color={COLORS.mediumGray} />
            </View>
          </View>

          {/* Instruction */}
          {selectedAction && (
            <View style={styles.instructionBox}>
              <Ionicons name="information-circle" size={18} color={COLORS.accent} />
              <Text style={styles.instructionText}>
                {selectedAction.requiresTwoDays 
                  ? `Select 2 days to ${selectedAction.label.toLowerCase()}`
                  : selectedAction.id === 'add'
                    ? 'Select a rest day to add a workout'
                    : `Select day(s) to make ${selectedAction.label.toLowerCase()}`
                }
              </Text>
            </View>
          )}

          {/* Add Workout Input */}
          {selectedAction?.id === 'add' && selectedDays.length > 0 && (
            <View style={styles.addInputContainer}>
              <TextInput
                style={styles.addInput}
                placeholder="What workout? (e.g., 30 min cardio)"
                placeholderTextColor={COLORS.mediumGray}
                value={addWorkoutInput}
                onChangeText={setAddWorkoutInput}
              />
            </View>
          )}

          {/* Week Tabs */}
          <View style={styles.weekTabs}>
            {[1, 2, 3].map(week => {
              const stats = weeksData[week - 1] ? getWeekStats(weeksData[week - 1]) : { completed: 0, total: 0 };
              const isSelected = selectedWeek === week;
              
              return (
                <TouchableOpacity
                  key={week}
                  style={[styles.weekTab, isSelected && styles.weekTabSelected]}
                  onPress={() => setSelectedWeek(week)}
                >
                  <Text style={[styles.weekTabText, isSelected && styles.weekTabTextSelected]}>
                    Week {week}
                  </Text>
                  <Text style={[styles.weekTabStats, isSelected && styles.weekTabStatsSelected]}>
                    {stats.completed}/{stats.total}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Days List */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {weeksData[selectedWeek - 1]?.days.map((day, index) => {
              const isSelected = selectedDays.includes(day.globalIndex);
              const canSelect = selectedAction && !day.isCompleted && 
                (selectedAction.id !== 'add' || day.isRest) &&
                (selectedAction.id !== 'skip' || !day.isRest);
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCard,
                    day.isToday && styles.dayCardToday,
                    day.isCompleted && styles.dayCardCompleted,
                    isSelected && styles.dayCardSelected,
                  ]}
                  onPress={() => handleDaySelect(day.globalIndex)}
                  disabled={!selectedAction || day.isCompleted}
                  activeOpacity={canSelect ? 0.7 : 1}
                >
                  <View style={styles.dayHeader}>
                    <View style={styles.dayInfo}>
                      <Text style={[styles.dayName, day.isToday && styles.dayNameToday]}>
                        {day.dayName}
                      </Text>
                      <Text style={styles.dayNum}>Day {(selectedWeek - 1) * 7 + index + 1}</Text>
                    </View>
                    
                    {day.isToday && (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayBadgeText}>TODAY</Text>
                      </View>
                    )}
                    
                    {day.isCompleted && (
                      <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
                    )}
                    
                    {isSelected && (
                      <View style={styles.selectedCheck}>
                        <Ionicons name="checkmark" size={16} color={COLORS.white} />
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.workoutInfo}>
                    {day.isRest ? (
                      <>
                        <Ionicons name="bed" size={18} color={COLORS.mediumGray} />
                        <Text style={styles.restText}>Rest Day</Text>
                      </>
                    ) : day.workout ? (
                      <>
                        <LinearGradient
                          colors={[COLORS.accent, COLORS.accentSecondary]}
                          style={styles.workoutIcon}
                        >
                          <Ionicons name="barbell" size={14} color={COLORS.white} />
                        </LinearGradient>
                        <View style={styles.workoutDetails}>
                          <Text style={styles.workoutTitle} numberOfLines={1}>
                            {day.workout.title || 'Workout'}
                          </Text>
                          <Text style={styles.workoutMeta}>
                            {day.workout.duration || 45} min • {day.workout.exercises?.length || 0} exercises
                          </Text>
                        </View>
                      </>
                    ) : (
                      <Text style={styles.pendingText}>Generating...</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Apply Button */}
          {selectedAction && selectedDays.length > 0 && (
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApply}
                disabled={isProcessing || (selectedAction.requiresTwoDays && selectedDays.length !== 2)}
              >
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentSecondary]}
                  style={styles.applyGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isProcessing ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                      <Text style={styles.applyText}>
                        Apply {selectedAction.label} ({selectedDays.length} selected)
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
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
    maxHeight: '92%',
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
  clearButton: { padding: 4 },
  clearText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  
  // Actions
  actionsContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsScroll: { paddingHorizontal: 16, paddingRight: 40, gap: 10 },
  swipeIndicator: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingLeft: 8,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    gap: 6,
  },
  actionChipText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  
  // Instruction
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: `${COLORS.accent}10`,
    gap: 8,
  },
  instructionText: { fontSize: 13, color: COLORS.text, flex: 1 },
  
  // Add Input
  addInputContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  addInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  
  // Week Tabs
  weekTabs: { flexDirection: 'row', padding: 16, gap: 12 },
  weekTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  weekTabSelected: { backgroundColor: COLORS.accent },
  weekTabText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  weekTabTextSelected: { color: COLORS.white },
  weekTabStats: { fontSize: 12, color: COLORS.mediumGray, marginTop: 2 },
  weekTabStatsSelected: { color: 'rgba(255,255,255,0.8)' },
  
  // Content
  content: { paddingHorizontal: 16 },
  
  // Day Card
  dayCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  dayCardToday: {
    backgroundColor: `${COLORS.accent}10`,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  dayCardCompleted: { opacity: 0.5 },
  dayCardSelected: {
    backgroundColor: `${COLORS.accent}20`,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  dayNameToday: { color: COLORS.accent },
  dayNum: { fontSize: 12, color: COLORS.mediumGray },
  todayBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  todayBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.white },
  selectedCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Workout Info
  workoutInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  workoutIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutDetails: { flex: 1 },
  workoutTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  workoutMeta: { fontSize: 12, color: COLORS.mediumGray, marginTop: 2 },
  restText: { fontSize: 14, color: COLORS.mediumGray },
  pendingText: { fontSize: 14, color: COLORS.mediumGray, fontStyle: 'italic' },
  
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 30,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  applyButton: { borderRadius: 14, overflow: 'hidden' },
  applyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  applyText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
});
