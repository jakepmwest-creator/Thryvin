/**
 * Active Workout Screen — PT Experience
 * 
 * Features:
 * - Stopwatch header with workout name + progress bar
 * - One exercise at a time (previous/next navigation)
 * - AI progressive overload suggestion (last weight × 1.025)
 * - Set logging with weight & reps inputs
 * - Rest timer (60s standard, 90s pro) after each set
 * - Exercise history stored in AsyncStorage
 * - Finish workout → workout-summary
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSubscriptionStore } from '../src/stores/subscription-store';
import { CustomAlert } from '../src/components/CustomAlert';

const { width: SW } = Dimensions.get('window');

const C = {
  bg: '#FFFFFF',
  primary: '#A259FF',
  gradStart: '#A259FF',
  gradEnd: '#FF4EC7',
  text: '#222222',
  secondary: '#8E8E93',
  card: '#F8F9FA',
  border: '#E5E5EA',
  success: '#34C759',
  warning: '#FF9500',
  white: '#FFFFFF',
};

const GRAD: [string, string] = ['#A259FF', '#FF4EC7'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExerciseSet {
  setIndex: number;
  weight: number;
  reps: number;
  date: string;
}

interface ExerciseHistoryMap {
  [exerciseName: string]: ExerciseSet[];
}

interface LoggedSet {
  setIndex: number;
  weight: string;
  reps: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const HISTORY_KEY = 'exercise_history';

async function loadHistory(): Promise<ExerciseHistoryMap> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveHistory(history: ExerciseHistoryMap): Promise<void> {
  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

async function addExerciseEntry(exerciseName: string, entry: ExerciseSet): Promise<void> {
  const history = await loadHistory();
  const existing = history[exerciseName] || [];
  const updated = [entry, ...existing].slice(0, 10); // cap at 10
  history[exerciseName] = updated;
  await saveHistory(history);
}

function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

function getAISuggestion(lastWeight: number | null): string {
  if (!lastWeight) return 'First time — give it your best!';
  const suggested = roundToHalf(lastWeight * 1.025);
  return `AI suggests: ${suggested} kg today`;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isPro } = useSubscriptionStore();
  const restDuration = isPro ? 90 : 60;

  // Parse workout from params
  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Navigation state
  const [exerciseIndex, setExerciseIndex] = useState(0);

  // Per-exercise set tracking: { [exerciseName]: LoggedSet[] }
  const [loggedSets, setLoggedSets] = useState<Record<string, LoggedSet[]>>({});

  // Current set input
  const [currentSetIndex, setCurrentSetIndex] = useState<Record<string, number>>({});
  const [weightInput, setWeightInput] = useState('');
  const [repsInput, setRepsInput] = useState('');

  // Exercise history from AsyncStorage
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseHistoryMap>({});

  // Stopwatch
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef<any>(null);

  // Rest timer
  const [restVisible, setRestVisible] = useState(false);
  const [restCountdown, setRestCountdown] = useState(restDuration);
  const restRef = useRef<any>(null);

  // Alert
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const showAlert = (type: any, title: string, message: string, buttons?: any[]) => {
    setAlertConfig({ visible: true, type, title, message, buttons });
  };
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  // ── Load workout ──────────────────────────────────────────────────────────

  useEffect(() => {
    const loadWorkout = async () => {
      try {
        // Try to parse workout from params
        if (params.workoutData) {
          const parsed = JSON.parse(params.workoutData as string);
          setWorkout(parsed);
        } else if (params.workoutId) {
          // Try to get from workout store (via AsyncStorage fallback)
          // For now just set a placeholder
          setWorkout(null);
        }
      } catch {
        setWorkout(null);
      }
      setLoading(false);
    };
    loadWorkout();
  }, []);

  // Load exercise history
  useEffect(() => {
    loadHistory().then(setExerciseHistory);
  }, []);

  // Stopwatch
  useEffect(() => {
    elapsedRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(elapsedRef.current);
  }, []);

  // Pre-fill inputs when exercise or set changes
  useEffect(() => {
    if (!currentExercise) return;
    const exName = currentExercise.name;
    const setIdx = currentSetIndex[exName] || 0;
    const history = exerciseHistory[exName];
    const lastEntry = history?.[0];
    const lastWeight = lastEntry?.weight || null;
    const aiWeight = lastWeight ? roundToHalf(lastWeight * 1.025) : '';
    setWeightInput(aiWeight ? String(aiWeight) : '');
    // Pre-fill reps with target from plan
    const targetReps = String(currentExercise.reps || '').split('-')[0] || '8';
    setRepsInput(targetReps);
  }, [exerciseIndex, exerciseHistory]);

  // ── Computed ──────────────────────────────────────────────────────────────

  const exercises = workout?.exercises || [];
  const currentExercise = exercises[exerciseIndex];
  const exName = currentExercise?.name || '';
  const exSets = currentExercise?.sets || 3;
  const loggedForExercise = loggedSets[exName] || [];
  const currentSetNum = (currentSetIndex[exName] || 0);
  const totalSetsCompleted = Object.values(loggedSets).reduce((sum, sets) => sum + sets.length, 0);
  const totalSetsAll = exercises.reduce((sum: number, ex: any) => sum + (ex?.sets || 0), 0);

  const lastHistory = exerciseHistory[exName]?.[0];
  const lastWeight = lastHistory?.weight || null;
  const lastReps = lastHistory?.reps || null;

  // ── Rest Timer ────────────────────────────────────────────────────────────

  const startRestTimer = useCallback(() => {
    setRestCountdown(restDuration);
    setRestVisible(true);
    clearInterval(restRef.current);
    restRef.current = setInterval(() => {
      setRestCountdown(prev => {
        if (prev <= 1) {
          clearInterval(restRef.current);
          setRestVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [restDuration]);

  const skipRest = useCallback(() => {
    clearInterval(restRef.current);
    setRestVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      clearInterval(restRef.current);
    };
  }, []);

  // ── Log Set ───────────────────────────────────────────────────────────────

  const handleLogSet = useCallback(async () => {
    const w = parseFloat(weightInput);
    const r = parseInt(repsInput, 10);
    if (isNaN(r)) {
      showAlert('warning', 'Missing info', 'Please enter reps to log this set.');
      return;
    }
    const setIdx = currentSetNum;
    const newSet: LoggedSet = { setIndex: setIdx, weight: isNaN(w) ? '0' : String(w), reps: String(r) };

    setLoggedSets(prev => ({
      ...prev,
      [exName]: [...(prev[exName] || []), newSet],
    }));

    // Save to AsyncStorage history
    const entry: ExerciseSet = {
      setIndex: setIdx,
      weight: isNaN(w) ? 0 : w,
      reps: r,
      date: new Date().toISOString(),
    };
    await addExerciseEntry(exName, entry);

    // Advance set counter
    const nextSetIdx = setIdx + 1;
    setCurrentSetIndex(prev => ({ ...prev, [exName]: nextSetIdx }));

    const isLastSet = nextSetIdx >= exSets;
    if (!isLastSet) {
      // Show rest timer
      startRestTimer();
    } else {
      // Last set of this exercise
      if (exerciseIndex < exercises.length - 1) {
        // Auto-advance to next exercise
        setExerciseIndex(prev => prev + 1);
      }
    }
  }, [weightInput, repsInput, exName, currentSetNum, exSets, exerciseIndex, exercises.length, startRestTimer]);

  // ── Finish Workout ────────────────────────────────────────────────────────

  const handleFinish = useCallback(() => {
    showAlert('success', 'Finish Workout? 🎉', 'Great work! Ready to wrap up?', [
      { text: 'Keep Going', style: 'cancel' },
      {
        text: 'Finish', onPress: async () => {
          // Save session to AsyncStorage for summary
          try {
            const sessionData = {
              workoutId: workout?.id,
              workoutTitle: workout?.title,
              date: new Date().toISOString(),
              durationSeconds: elapsed,
              setsCompleted: totalSetsCompleted,
              loggedSets,
            };
            const sessions = JSON.parse(await AsyncStorage.getItem('workout_sessions') || '[]');
            sessions.unshift(sessionData);
            await AsyncStorage.setItem('workout_sessions', JSON.stringify(sessions.slice(0, 50)));
          } catch {}
          // Navigate to summary or back
          try {
            router.replace('/workout-summary');
          } catch {
            router.back();
          }
        }
      },
    ]);
  }, [workout, elapsed, totalSetsCompleted, loggedSets, router]);

  const handleBack = useCallback(() => {
    showAlert('warning', 'Exit Workout?', 'Your progress will be lost.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Exit', style: 'destructive', onPress: () => router.back() },
    ]);
  }, [router]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!workout || exercises.length === 0) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={s.workoutTitle}>Workout</Text>
          <View style={s.iconBtn} />
        </View>
        <View style={s.centered}>
          <Ionicons name="barbell-outline" size={48} color={C.secondary} />
          <Text style={s.emptyTitle}>No workout loaded</Text>
          <Text style={s.emptySubtitle}>Go back and select a workout to start.</Text>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progressPct = totalSetsAll > 0 ? (totalSetsCompleted / totalSetsAll) * 100 : 0;
  const aiText = lastWeight
    ? `AI suggests: ${roundToHalf(lastWeight * 1.025)} kg`
    : 'First time — give it your best!';

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn} onPress={handleBack}>
          <Ionicons name="close" size={24} color={C.text} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.workoutTitle} numberOfLines={1}>{workout.title}</Text>
          <Text style={s.headerSub}>{formatTime(elapsed)}</Text>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={handleFinish}>
          <Ionicons name="checkmark-done" size={24} color={C.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Progress Bar ── */}
      <View style={s.progressOuter}>
        <LinearGradient
          colors={GRAD}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[s.progressFill, { width: `${Math.min(progressPct, 100)}%` }]}
        />
      </View>
      <Text style={s.progressLabel}>{totalSetsCompleted} / {totalSetsAll} sets done</Text>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Exercise Name ── */}
          <Text style={s.exerciseName}>{exName}</Text>
          <Text style={s.setIndicator}>
            Set {Math.min(currentSetNum + 1, exSets)} of {exSets}
          </Text>

          {/* ── Last session row ── */}
          {lastWeight && (
            <View style={s.historyRow}>
              <Ionicons name="time-outline" size={16} color={C.secondary} />
              <Text style={s.historyText}>Last session: {lastWeight}kg × {lastReps} reps</Text>
            </View>
          )}

          {/* ── AI suggestion pill ── */}
          <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.aiPill}>
            <Ionicons name="sparkles" size={14} color={C.white} />
            <Text style={s.aiPillText}>{aiText}</Text>
          </LinearGradient>

          {/* ── Inputs ── */}
          <View style={s.inputsRow}>
            <View style={s.inputBlock}>
              <Text style={s.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={s.input}
                value={weightInput}
                onChangeText={setWeightInput}
                placeholder="0"
                placeholderTextColor={C.secondary}
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
            </View>
            <View style={s.inputBlock}>
              <Text style={s.inputLabel}>Reps</Text>
              <TextInput
                style={s.input}
                value={repsInput}
                onChangeText={setRepsInput}
                placeholder="0"
                placeholderTextColor={C.secondary}
                keyboardType="number-pad"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* ── Log Set button ── */}
          {currentSetNum < exSets ? (
            <TouchableOpacity style={s.logBtn} onPress={handleLogSet} activeOpacity={0.85}>
              <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.logBtnGrad}>
                <Ionicons name="checkmark-circle" size={22} color={C.white} />
                <Text style={s.logBtnText}>Log Set</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={s.allSetsComplete}>
              <Ionicons name="checkmark-circle" size={24} color={C.success} />
              <Text style={s.allSetsText}>All sets complete! 💪</Text>
            </View>
          )}

          {/* ── Completed sets chips ── */}
          {loggedForExercise.length > 0 && (
            <View style={s.completedSets}>
              <Text style={s.completedSetsTitle}>Completed sets</Text>
              <View style={s.chipsRow}>
                {loggedForExercise.map((ls, i) => (
                  <View key={i} style={s.setChip}>
                    <Text style={s.setChipText}>
                      Set {ls.setIndex + 1}: {ls.weight ? `${ls.weight}kg × ` : ''}{ls.reps} reps ✓
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Rest timer overlay (inline when visible) ── */}
          {restVisible && (
            <View style={s.restCard}>
              <Text style={s.restEmoji}>⏱️</Text>
              <Text style={s.restTitle}>Rest</Text>
              <Text style={s.restCountdown}>{restCountdown}s</Text>
              <Text style={s.restMsg}>Rest up — next set incoming 💪</Text>
              <TouchableOpacity style={s.skipBtn} onPress={skipRest}>
                <Text style={s.skipBtnText}>Skip Rest</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Navigation footer ── */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.navBtn, exerciseIndex === 0 && s.navBtnDisabled]}
          onPress={() => exerciseIndex > 0 && setExerciseIndex(prev => prev - 1)}
          disabled={exerciseIndex === 0}
        >
          <Ionicons name="chevron-back" size={20} color={exerciseIndex === 0 ? C.secondary : C.primary} />
          <Text style={[s.navBtnText, exerciseIndex === 0 && { color: C.secondary }]}>Prev</Text>
        </TouchableOpacity>

        <View style={s.exerciseCounter}>
          {exercises.map((_: any, i: number) => (
            <TouchableOpacity
              key={i}
              style={[s.dot, i === exerciseIndex && s.dotActive]}
              onPress={() => setExerciseIndex(i)}
            />
          ))}
        </View>

        {exerciseIndex < exercises.length - 1 ? (
          <TouchableOpacity
            style={s.navBtn}
            onPress={() => setExerciseIndex(prev => prev + 1)}
          >
            <Text style={[s.navBtnText, { color: C.primary }]}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color={C.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.navBtn} onPress={handleFinish}>
            <Text style={[s.navBtnText, { color: C.success, fontWeight: '800' }]}>Finish</Text>
            <Ionicons name="flag" size={20} color={C.success} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  workoutTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  headerSub: { fontSize: 13, color: C.secondary, marginTop: 1 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.card,
    justifyContent: 'center', alignItems: 'center',
  },

  // Progress
  progressOuter: {
    height: 6,
    backgroundColor: C.border,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: {
    fontSize: 12,
    color: C.secondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },

  // Exercise
  exerciseName: {
    fontSize: 28,
    fontWeight: '900',
    color: C.text,
    marginTop: 12,
    marginBottom: 4,
  },
  setIndicator: {
    fontSize: 15,
    fontWeight: '600',
    color: C.secondary,
    marginBottom: 12,
  },

  // History row
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    backgroundColor: C.card,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  historyText: { fontSize: 14, color: C.secondary, fontWeight: '500' },

  // AI pill
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  aiPillText: { fontSize: 14, fontWeight: '700', color: C.white },

  // Inputs
  inputsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  inputBlock: { flex: 1 },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.secondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    fontSize: 28,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
    paddingVertical: 14,
  },

  // Log button
  logBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  logBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  logBtnText: { fontSize: 18, fontWeight: '800', color: C.white },

  // All sets done
  allSetsComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
    backgroundColor: '#E8F9EE',
    borderRadius: 16,
    marginBottom: 20,
  },
  allSetsText: { fontSize: 16, fontWeight: '700', color: C.success },

  // Completed sets
  completedSets: { marginBottom: 20 },
  completedSetsTitle: { fontSize: 14, fontWeight: '700', color: C.secondary, marginBottom: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  setChip: {
    backgroundColor: '#EDE8FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  setChipText: { fontSize: 12, fontWeight: '600', color: '#6B21A8' },

  // Rest timer
  restCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
  },
  restEmoji: { fontSize: 32, marginBottom: 4 },
  restTitle: { fontSize: 14, fontWeight: '700', color: C.secondary, marginBottom: 4 },
  restCountdown: { fontSize: 56, fontWeight: '900', color: C.primary, marginBottom: 8 },
  restMsg: { fontSize: 14, color: C.secondary, marginBottom: 16 },
  skipBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.primary,
  },
  skipBtnText: { fontSize: 14, fontWeight: '700', color: C.primary },

  // Footer nav
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: C.card,
    minWidth: 80,
    justifyContent: 'center',
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontSize: 14, fontWeight: '700', color: C.primary },
  exerciseCounter: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
  dotActive: { backgroundColor: C.primary, width: 20, borderRadius: 4 },

  // Empty state
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginTop: 12, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: C.secondary, textAlign: 'center', lineHeight: 20 },
  backBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: C.primary,
  },
  backBtnText: { fontSize: 15, fontWeight: '700', color: C.white },
});
