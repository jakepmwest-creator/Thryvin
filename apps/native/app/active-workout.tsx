/**
 * Active Workout Screen — AI PT Experience (Redesigned)
 *
 * Features:
 * - Stopwatch header with workout name + progress bar + FloatingCoachButton
 * - AI PT Card (2-column: PT Suggests | Last Time) with week badge
 * - Category pills (warmup/main/recovery)
 * - BW pill badge for bodyweight exercises
 * - Set logging with weight & reps inputs + Edit/Add/Remove action bar
 * - Feedback buttons (😰 Too Hard / 💪 Perfect / 😴 Too Easy)
 * - PT Chat Strip with context-aware coaching
 * - Rest timer after each set
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSubscriptionStore } from '../src/stores/subscription-store';
import { CustomAlert } from '../src/components/CustomAlert';

const { width: SW } = Dimensions.get('window');

// ─── Colours ──────────────────────────────────────────────────────────────────
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
  danger: '#FF3B30',
  white: '#FFFFFF',
  warmup: '#F97316',
  main: '#3B82F6',
  recovery: '#22C55E',
};

const GRAD: [string, string] = ['#A259FF', '#FF4EC7'];

// ─── Types ────────────────────────────────────────────────────────────────────
type FeedbackType = 'too_hard' | 'perfect' | 'too_easy' | null;
type WeekType = 'heavy' | 'deload' | 'normal';
type ExerciseCategory = 'warmup' | 'main' | 'recovery';

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

// ─── Helpers ───────────────────────────────────────────────────────────────────
const HISTORY_KEY = 'exercise_history';

async function loadHistory(): Promise<ExerciseHistoryMap> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

async function saveHistory(history: ExerciseHistoryMap): Promise<void> {
  try { await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch {}
}

async function addExerciseEntry(exerciseName: string, entry: ExerciseSet): Promise<void> {
  const history = await loadHistory();
  const existing = history[exerciseName] || [];
  const updated = [entry, ...existing].slice(0, 10);
  history[exerciseName] = updated;
  await saveHistory(history);
}

function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── BW Detection ─────────────────────────────────────────────────────────────
const BW_KEYWORDS = ['push-up', 'pull-up', 'chin-up', 'chin up', 'pullup',
  'lunge', 'lunges', 'plank', 'crunch', 'crunches', 'sit-up', 'situp',
  'burpee', 'burpees', 'squat', 'squats', 'jump squat', 'mountain climber',
  'leg raise', 'leg-raise', 'dip', 'dips', 'wall sit', 'pike push-up',
  'diamond push-up', 'tricep dip', 'calf raise'];

function isBodyweight(name: string): boolean {
  const n = name.toLowerCase();
  return BW_KEYWORDS.some(k => n.includes(k));
}

// ─── Week / PT Logic ──────────────────────────────────────────────────────────
function getWeekType(history: ExerciseHistoryMap, exName: string): WeekType {
  // Simple: alternate heavy/normal; if 0 history → 'normal'
  const entries = history[exName] || [];
  if (entries.length === 0) return 'normal';
  // Use session count to determine: every 3rd session is deload
  const sessionCount = entries.length;
  if (sessionCount % 4 === 0) return 'deload';
  if (sessionCount % 3 === 0) return 'heavy';
  return 'normal';
}

function getPTSuggestion(lastWeight: number | null, lastReps: number | null,
  isBW: boolean, weekType: WeekType, category: ExerciseCategory): { weight: string; reps: string; msg: string } {
  if (category === 'warmup') {
    return { weight: '—', reps: '—', msg: 'Warm-up — just get moving! 🔥' };
  }
  if (category === 'recovery') {
    return { weight: '—', reps: '—', msg: 'Recovery day — keep it light 💚' };
  }
  if (!lastWeight && !lastReps) {
    return { weight: isBW ? 'BW' : '—', reps: '—', msg: '🌟 New Move — start light and focus on form!' };
  }
  if (isBW) {
    const repSuggestion = lastReps ? String(Math.max(5, lastReps + 2)) : '10';
    return { weight: 'BW', reps: repSuggestion, msg: '🤖 BW session — add reps to progress!' };
  }
  if (weekType === 'deload') {
    return {
      weight: lastWeight ? String(roundToHalf(lastWeight * 0.85)) : '—',
      reps: '8–10',
      msg: '🟢 Deload week — fewer reps, lighter load. Recover well!',
    };
  }
  if (weekType === 'heavy') {
    return {
      weight: lastWeight ? String(roundToHalf(lastWeight * 1.05)) : '—',
      reps: '6–8',
      msg: '🟢 Heavy Week — push it! You\'ve got this 💪',
    };
  }
  // normal
  const suggested = lastWeight ? String(roundToHalf(lastWeight * 1.025)) : '—';
  return {
    weight: suggested,
    reps: lastReps ? String(lastReps) : '8–12',
    msg: '💪 Perfect load — steady progress today!',
  };
}

function getCategory(exercise: any): ExerciseCategory {
  const name = (exercise?.name || '').toLowerCase();
  if (name.includes('warm-up') || name.includes('warmup') || name.includes('warm up')) return 'warmup';
  if (name.includes('stretch') || name.includes('mobility') || name.includes('cool-down')) return 'recovery';
  return 'main';
}

const CATEGORY_LABELS: Record<ExerciseCategory, { label: string; emoji: string; color: string }> = {
  warmup: { label: 'Warmup', emoji: '🔥', color: C.warmup },
  main: { label: 'Main', emoji: '💪', color: C.main },
  recovery: { label: 'Recovery', emoji: '💚', color: C.recovery },
};

// ─── Feedback messages ─────────────────────────────────────────────────────────
const FEEDBACK_MSGS: Record<FeedbackType, string> = {
  too_hard: "😰 Too Hard — noted! I'll adjust next week",
  perfect: "💪 Perfect — keep it up! You're on track",
  too_easy: "😴 Too Easy — I'll add reps next session",
};

// ─── Floating Coach Button ─────────────────────────────────────────────────────
const FloatingCoachButton = ({ inWorkout, exerciseName }: { inWorkout: boolean; exerciseName: string }) => {
  if (!inWorkout) return null;
  return (
    <TouchableOpacity style={coachBtnStyles.container} activeOpacity={0.85}>
      <LinearGradient colors={GRAD} style={coachBtnStyles.grad}>
        <Ionicons name="sparkles" size={14} color="white" />
        <Text style={coachBtnStyles.text}>PT</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const coachBtnStyles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginLeft: 8,
  },
  grad: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  text: { fontSize: 12, fontWeight: '800', color: 'white' },
});

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isPro } = useSubscriptionStore();
  const restDuration = isPro ? 90 : 60;

  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [loggedSets, setLoggedSets] = useState<Record<string, LoggedSet[]>>({});
  const [currentSetIndex, setCurrentSetIndex] = useState<Record<string, number>>({});
  const [weightInput, setWeightInput] = useState('');
  const [repsInput, setRepsInput] = useState('');
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseHistoryMap>({});
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [restVisible, setRestVisible] = useState(false);
  const [restCountdown, setRestCountdown] = useState(restDuration);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [feedback, setFeedback] = useState<Record<string, FeedbackType>>({});
  const [editingSetKey, setEditingSetKey] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');

  // Alert
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean; type: 'success' | 'error' | 'warning' | 'info';
    title: string; message: string;
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const showAlert = (type: any, title: string, message: string, buttons?: any[]) => {
    setAlertConfig({ visible: true, type, title, message, buttons });
  };
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  // ── Load workout ────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadWorkout = async () => {
      try {
        if (params.workoutData) {
          setWorkout(JSON.parse(params.workoutData as string));
        } else {
          setWorkout(null);
        }
      } catch { setWorkout(null); }
      setLoading(false);
    };
    loadWorkout();
  }, []);

  useEffect(() => { loadHistory().then(setExerciseHistory); }, []);

  // Stopwatch
  useEffect(() => {
    elapsedRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current); };
  }, []);

  // Pre-fill inputs
  useEffect(() => {
    if (!currentExercise) return;
    const exName = currentExercise.name;
    const history = exerciseHistory[exName];
    const lastEntry = history?.[0];
    const isBW = isBodyweight(exName);
    const weekType = getWeekType(exerciseHistory, exName);
    const category = getCategory(currentExercise);
    const { weight, reps } = getPTSuggestion(
      lastEntry?.weight || null,
      lastEntry?.reps || null,
      isBW,
      weekType,
      category,
    );
    if (weight && weight !== '—') setWeightInput(weight);
    else setWeightInput(isBW ? '0' : '');
    setRepsInput(reps && reps !== '—' ? reps.split('–')[0] : String(currentExercise.reps || '8'));
  }, [exerciseIndex, exerciseHistory]);

  // ── Computed ────────────────────────────────────────────────────────────────
  const exercises = workout?.exercises || [];
  const currentExercise = exercises[exerciseIndex];
  const exName = currentExercise?.name || '';
  const exSets = currentExercise?.sets || 3;
  const loggedForExercise = loggedSets[exName] || [];
  const currentSetNum = currentSetIndex[exName] || 0;
  const totalSetsCompleted = Object.values(loggedSets).reduce((sum, sets) => sum + sets.length, 0);
  const totalSetsAll = exercises.reduce((sum: number, ex: any) => sum + (ex?.sets || 0), 0);
  const lastHistory = exerciseHistory[exName]?.[0];
  const isBW = isBodyweight(exName);
  const category = getCategory(currentExercise);
  const weekType = getWeekType(exerciseHistory, exName);
  const ptSuggestion = getPTSuggestion(
    lastHistory?.weight || null,
    lastHistory?.reps || null,
    isBW,
    weekType,
    category,
  );
  const currentFeedback = feedback[exName];
  const catInfo = CATEGORY_LABELS[category];

  // Week badge
  const WEEK_BADGE = weekType === 'heavy' ? '🟢 Heavy Week'
    : weekType === 'deload' ? '🔵 Deload'
    : '💪 Perfect load';

  // PT chat strip message
  const PT_CHAT_MSG = currentFeedback
    ? FEEDBACK_MSGS[currentFeedback]
    : ptSuggestion.msg;

  // ── Rest Timer ──────────────────────────────────────────────────────────────
  const startRestTimer = useCallback(() => {
    setRestCountdown(restDuration);
    setRestVisible(true);
    if (restRef.current) clearInterval(restRef.current);
    restRef.current = setInterval(() => {
      setRestCountdown(prev => {
        if (prev <= 1) {
          if (restRef.current) clearInterval(restRef.current);
          setRestVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [restDuration]);

  const skipRest = useCallback(() => {
    if (restRef.current) clearInterval(restRef.current);
    setRestVisible(false);
  }, []);

  useEffect(() => () => { if (restRef.current) clearInterval(restRef.current); }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleLogSet = useCallback(async () => {
    const w = parseFloat(weightInput);
    const r = parseInt(repsInput, 10);
    if (isNaN(r)) {
      showAlert('warning', 'Missing info', 'Please enter reps to log this set.');
      return;
    }
    const setIdx = currentSetNum;
    const newSet: LoggedSet = { setIndex: setIdx, weight: isNaN(w) ? '0' : String(w), reps: String(r) };
    setLoggedSets(prev => ({ ...prev, [exName]: [...(prev[exName] || []), newSet] }));
    const entry: ExerciseSet = { setIndex: setIdx, weight: isNaN(w) ? 0 : w, reps: r, date: new Date().toISOString() };
    await addExerciseEntry(exName, entry);
    const nextSetIdx = setIdx + 1;
    setCurrentSetIndex(prev => ({ ...prev, [exName]: nextSetIdx }));
    if (nextSetIdx < exSets) startRestTimer();
    else if (exerciseIndex < exercises.length - 1) setExerciseIndex(prev => prev + 1);
  }, [weightInput, repsInput, exName, currentSetNum, exSets, exerciseIndex, exercises.length, startRestTimer]);

  const handleEditSet = useCallback((setKey: string, currentSet: LoggedSet) => {
    setEditingSetKey(setKey);
    setEditWeight(currentSet.weight);
    setEditReps(currentSet.reps);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingSetKey) return;
    const [ex, idx] = editingSetKey.split('::');
    const newSets = (loggedSets[ex] || []).map((s, i) =>
      i === parseInt(idx) ? { ...s, weight: editWeight, reps: editReps } : s,
    );
    setLoggedSets(prev => ({ ...prev, [ex]: newSets }));
    setEditingSetKey(null);
    setEditWeight('');
    setEditReps('');
  }, [editingSetKey, editWeight, editReps, loggedSets]);

  const handleRemoveSet = useCallback((setKey: string) => {
    const [ex, idx] = setKey.split('::');
    const newSets = (loggedSets[ex] || []).filter((_, i) => i !== parseInt(idx));
    setLoggedSets(prev => ({ ...prev, [ex]: newSets }));
  }, [loggedSets]);

  const handleFeedback = useCallback((type: FeedbackType) => {
    setFeedback(prev => ({ ...prev, [exName]: prev[exName] === type ? null : type }));
  }, [exName]);

  const handleFinish = useCallback(() => {
    showAlert('success', 'Finish Workout? 🎉', 'Great work! Ready to wrap up?', [
      { text: 'Keep Going', style: 'cancel' },
      {
        text: 'Finish', onPress: async () => {
          try {
            const sessionData = {
              workoutId: workout?.id, workoutTitle: workout?.title,
              date: new Date().toISOString(), durationSeconds: elapsed,
              setsCompleted: totalSetsCompleted, loggedSets,
            };
            const sessions = JSON.parse(await AsyncStorage.getItem('workout_sessions') || '[]');
            sessions.unshift(sessionData);
            await AsyncStorage.setItem('workout_sessions', JSON.stringify(sessions.slice(0, 50)));
          } catch {}
          try { router.replace('/workout-summary'); } catch { router.back(); }
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

  // ── Render helpers ─────────────────────────────────────────────────────────
  const progressPct = totalSetsAll > 0 ? (totalSetsCompleted / totalSetsAll) * 100 : 0;

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centered}>
          <Text style={{ color: C.primary, fontSize: 18, fontWeight: '700' }}>Loading...</Text>
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
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          <Ionicons name="close" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.workoutTitle} numberOfLines={1}>{workout.title}</Text>
          <Text style={s.headerSub}>{formatTime(elapsed)}</Text>
        </View>
        <View style={s.headerRightRow}>
          <FloatingCoachButton inWorkout={true} exerciseName={exName} />
          <TouchableOpacity style={s.iconBtn} onPress={handleFinish}>
            <Ionicons name="checkmark-done" size={22} color={C.success} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Progress Bar ── */}
      <View style={s.progressOuter}>
        <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[s.progressFill, { width: `${Math.min(progressPct, 100)}%` }]} />
      </View>
      <Text style={s.progressLabel}>{totalSetsCompleted} / {totalSetsAll} sets done</Text>

      <KeyboardAvoidingView style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <ScrollView style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* ── Category pill ── */}
          <View style={s.categoryRow}>
            <View style={[s.categoryPill, { backgroundColor: `${catInfo.color}18`, borderColor: catInfo.color }]}>
              <Text style={[s.categoryPillText, { color: catInfo.color }]}>
                {catInfo.emoji} {catInfo.label}
              </Text>
            </View>
            {isBW && (
              <View style={s.bwPill}>
                <Text style={s.bwPillText}>BW</Text>
              </View>
            )}
          </View>

          {/* ── Exercise Name ── */}
          <Text style={s.exerciseName}>{exName}</Text>
          <Text style={s.setIndicator}>
            Set {Math.min(currentSetNum + 1, exSets)} of {exSets}
          </Text>

          {/* ══════════════════════════════════════════════════════════════════
              AI PT CARD — 2 column
          ══════════════════════════════════════════════════════════════════ */}
          <View style={s.ptCard}>
            {/* Week badge */}
            <View style={s.ptBadgeRow}>
              <Text style={s.ptBadge}>{WEEK_BADGE}</Text>
            </View>

            <View style={s.ptColumns}>
              {/* Left: PT Suggests */}
              <View style={s.ptCol}>
                <Text style={s.ptColLabel}>🤖 PT Suggests</Text>
                <Text style={s.ptWeight}>{ptSuggestion.weight}</Text>
                <Text style={s.ptUnit}>{isBW ? '' : 'kg'}</Text>
                <Text style={s.ptReps}>{ptSuggestion.reps} reps</Text>
              </View>

              {/* Divider */}
              <View style={s.ptDivider} />

              {/* Right: Last Time */}
              <View style={s.ptCol}>
                <Text style={s.ptColLabel}>Last Time</Text>
                {lastHistory ? (
                  <>
                    <Text style={s.ptWeight}>{lastHistory.weight}{isBW || lastHistory.weight === 0 ? '' : 'kg'}</Text>
                    <Text style={s.ptReps}>{lastHistory.reps} reps</Text>
                  </>
                ) : (
                  <Text style={s.ptNoData}>No data yet</Text>
                )}
              </View>
            </View>
          </View>

          {/* PT Chat Strip */}
          <View style={s.ptChatStrip}>
            <Ionicons name="chatbubble-ellipses" size={14} color={C.primary} />
            <Text style={s.ptChatText}>{PT_CHAT_MSG}</Text>
          </View>

          {/* ══════════════════════════════════════════════════════════════════
              INPUTS + ACTION BAR
          ══════════════════════════════════════════════════════════════════ */}
          {currentSetNum < exSets ? (
            <>
              {/* Inputs */}
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

              {/* Action Bar: Edit | Add | Remove */}
              <View style={s.actionBar}>
                {/* Edit */}
                <TouchableOpacity style={s.actionBtn} activeOpacity={0.8}>
                  <LinearGradient colors={GRAD} style={s.actionBtnGrad}>
                    <Ionicons name="pencil" size={18} color={C.white} />
                  </LinearGradient>
                </TouchableOpacity>

                {/* Add (Log Set) */}
                <TouchableOpacity style={s.actionBtnPrimary} activeOpacity={0.85}
                  onPress={handleLogSet}>
                  <LinearGradient colors={GRAD} style={s.actionBtnGrad}>
                    <Ionicons name="add" size={22} color={C.white} />
                    <Text style={s.actionBtnPrimaryText}>Log Set</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Remove */}
                <TouchableOpacity style={[s.actionBtn, s.actionBtnDanger]} activeOpacity={0.8}>
                  <View style={s.actionBtnDangerOutline}>
                    <Ionicons name="trash" size={18} color={C.danger} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Feedback buttons */}
              <View style={s.feedbackRow}>
                <TouchableOpacity
                  style={[s.feedbackBtn, currentFeedback === 'too_hard' && s.feedbackBtnActive]}
                  onPress={() => handleFeedback('too_hard')}
                  activeOpacity={0.8}
                >
                  <Text style={s.feedbackEmoji}>😰</Text>
                  <Text style={[s.feedbackText, currentFeedback === 'too_hard' && { color: C.primary }]}>
                    Too Hard
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.feedbackBtn, currentFeedback === 'perfect' && s.feedbackBtnActive]}
                  onPress={() => handleFeedback('perfect')}
                  activeOpacity={0.8}
                >
                  <Text style={s.feedbackEmoji}>💪</Text>
                  <Text style={[s.feedbackText, currentFeedback === 'perfect' && { color: C.primary }]}>
                    Perfect
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.feedbackBtn, currentFeedback === 'too_easy' && s.feedbackBtnActive]}
                  onPress={() => handleFeedback('too_easy')}
                  activeOpacity={0.8}
                >
                  <Text style={s.feedbackEmoji}>😴</Text>
                  <Text style={[s.feedbackText, currentFeedback === 'too_easy' && { color: C.primary }]}>
                    Too Easy
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={s.allSetsComplete}>
              <Ionicons name="checkmark-circle" size={24} color={C.success} />
              <Text style={s.allSetsText}>All sets complete! 💪</Text>
            </View>
          )}

          {/* ── Completed sets chips with Edit/Remove ── */}
          {loggedForExercise.length > 0 && (
            <View style={s.completedSets}>
              <Text style={s.completedSetsTitle}>Completed sets</Text>
              <View style={s.chipsRow}>
                {loggedForExercise.map((ls, i) => {
                  const setKey = `${exName}::${i}`;
                  const isEditing = editingSetKey === setKey;
                  return (
                    <View key={i} style={[s.setChip, isEditing && s.setChipEditing]}>
                      {isEditing ? (
                        <View style={s.editRow}>
                          <TextInput
                            style={s.editInput}
                            value={editWeight}
                            onChangeText={setEditWeight}
                            placeholder="kg"
                            keyboardType="decimal-pad"
                          />
                          <Text style={s.editSep}>×</Text>
                          <TextInput
                            style={s.editInput}
                            value={editReps}
                            onChangeText={setEditReps}
                            placeholder="reps"
                            keyboardType="number-pad"
                          />
                          <TouchableOpacity onPress={handleSaveEdit}>
                            <Ionicons name="checkmark" size={16} color={C.success} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setEditingSetKey(null)} style={{ marginLeft: 4 }}>
                            <Ionicons name="close" size={16} color={C.danger} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={s.chipContent}>
                          <Text style={s.setChipText}>
                            Set {ls.setIndex + 1}: {ls.weight ? `${ls.weight}kg × ` : ''}{ls.reps} reps ✓
                          </Text>
                          <View style={s.chipActions}>
                            <TouchableOpacity onPress={() => handleEditSet(setKey, ls)} style={s.chipActionBtn}>
                              <Ionicons name="pencil" size={12} color={C.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleRemoveSet(setKey)} style={s.chipActionBtn}>
                              <Ionicons name="trash" size={12} color={C.danger} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Rest timer ── */}
          {restVisible && (
            <View style={s.restCard}>
              <Text style={s.restEmoji}>⏱️</Text>
              <Text style={s.restTitle}>Rest</Text>
              <Text style={s.restCountdown}>{restCountdown}s</Text>
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
          <Text style={[s.navBtnText, { color: exerciseIndex === 0 ? C.secondary : C.primary }]}>Prev</Text>
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
          <TouchableOpacity style={s.navBtn} onPress={() => setExerciseIndex(prev => prev + 1)}>
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

// ─── Styles ────────────────────────────────────────────────────────────────────
const BTN_SIZE = 52;
const BTN_RADIUS = 16;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerRightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  workoutTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  headerSub: { fontSize: 13, color: C.secondary, marginTop: 1 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.card,
    justifyContent: 'center', alignItems: 'center',
  },

  // Progress
  progressOuter: {
    height: 6, backgroundColor: C.border,
    marginHorizontal: 16, marginTop: 12, borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: {
    fontSize: 12, color: C.secondary, textAlign: 'center', marginTop: 4, marginBottom: 4,
  },

  // Category
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  categoryPillText: { fontSize: 12, fontWeight: '700' },
  bwPill: {
    backgroundColor: '#EDE9FE', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#C4B5FD',
  },
  bwPillText: { fontSize: 12, fontWeight: '800', color: C.primary },

  // Exercise
  exerciseName: {
    fontSize: 28, fontWeight: '900', color: C.text, marginBottom: 4,
  },
  setIndicator: { fontSize: 15, fontWeight: '600', color: C.secondary, marginBottom: 16 },

  // AI PT Card
  ptCard: {
    backgroundColor: C.card, borderRadius: 18, borderWidth: 1.5,
    borderColor: `${C.primary}30`,
    padding: 16, marginBottom: 12,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
  },
  ptBadgeRow: { marginBottom: 12 },
  ptBadge: { fontSize: 13, fontWeight: '700', color: C.text },
  ptColumns: { flexDirection: 'row' },
  ptCol: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  ptDivider: { width: 1, backgroundColor: C.border, marginHorizontal: 8 },
  ptColLabel: {
    fontSize: 11, fontWeight: '700', color: C.secondary, marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  ptWeight: { fontSize: 32, fontWeight: '900', color: C.text, lineHeight: 36 },
  ptUnit: { fontSize: 14, color: C.secondary, marginTop: 2 },
  ptReps: { fontSize: 14, fontWeight: '600', color: C.primary, marginTop: 4 },
  ptNoData: { fontSize: 13, color: C.secondary, fontStyle: 'italic', marginTop: 10 },

  // PT Chat Strip
  ptChatStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EDE9FE', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16,
    borderWidth: 1, borderColor: '#C4B5FD',
  },
  ptChatText: { fontSize: 13, color: C.text, flex: 1, fontWeight: '500' },

  // Inputs
  inputsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  inputBlock: { flex: 1 },
  inputLabel: {
    fontSize: 13, fontWeight: '700', color: C.secondary,
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    fontSize: 28, fontWeight: '800', color: C.text, textAlign: 'center', paddingVertical: 14,
  },

  // Action Bar
  actionBar: { flexDirection: 'row', gap: 10, marginBottom: 16, alignItems: 'center' },
  actionBtn: {
    width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_RADIUS, overflow: 'hidden',
  },
  actionBtnPrimary: { flex: 1, height: BTN_SIZE, borderRadius: BTN_RADIUS, overflow: 'hidden' },
  actionBtnGrad: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingHorizontal: 8,
  },
  actionBtnPrimaryText: { fontSize: 16, fontWeight: '800', color: C.white },
  actionBtnDanger: {},
  actionBtnDangerOutline: {
    width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_RADIUS,
    backgroundColor: '#FEF2F2', borderWidth: 2, borderColor: C.danger,
    alignItems: 'center', justifyContent: 'center',
  },

  // Feedback buttons
  feedbackRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  feedbackBtn: {
    flex: 1, flexDirection: 'column', alignItems: 'center',
    paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.card, gap: 4,
  },
  feedbackBtnActive: { borderColor: C.primary, backgroundColor: '#EDE9FE' },
  feedbackEmoji: { fontSize: 22 },
  feedbackText: { fontSize: 11, fontWeight: '600', color: C.secondary },

  // All sets done
  allSetsComplete: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 20, backgroundColor: '#E8F9EE', borderRadius: 16, marginBottom: 20,
  },
  allSetsText: { fontSize: 16, fontWeight: '700', color: C.success },

  // Completed sets
  completedSets: { marginBottom: 20 },
  completedSetsTitle: { fontSize: 14, fontWeight: '700', color: C.secondary, marginBottom: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  setChip: {
    backgroundColor: '#EDE8FF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#C4B5FD',
  },
  setChipEditing: { backgroundColor: '#EDE9FE', borderColor: C.primary, padding: 6 },
  chipContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  setChipText: { fontSize: 12, fontWeight: '600', color: '#6B21A8' },
  chipActions: { flexDirection: 'row', gap: 4 },
  chipActionBtn: { padding: 2 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editInput: {
    backgroundColor: C.white, borderRadius: 8, borderWidth: 1, borderColor: C.border,
    fontSize: 12, fontWeight: '600', color: C.text,
    width: 44, textAlign: 'center', paddingVertical: 2,
  },
  editSep: { fontSize: 12, fontWeight: '600', color: C.secondary },

  // Rest timer
  restCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: C.border, marginBottom: 20,
  },
  restEmoji: { fontSize: 32, marginBottom: 4 },
  restTitle: { fontSize: 14, fontWeight: '700', color: C.secondary, marginBottom: 4 },
  restCountdown: { fontSize: 56, fontWeight: '900', color: C.primary, marginBottom: 8 },
  skipBtn: {
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.primary,
  },
  skipBtnText: { fontSize: 14, fontWeight: '700', color: C.primary },

  // Footer nav
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border,
  },
  navBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: C.card, minWidth: 80, justifyContent: 'center',
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontSize: 14, fontWeight: '700' },
  exerciseCounter: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
  dotActive: { backgroundColor: C.primary, width: 20, borderRadius: 4 },

  // Empty state
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginTop: 12, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: C.secondary, textAlign: 'center', lineHeight: 20 },
  backBtn: {
    marginTop: 24, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 14, backgroundColor: C.primary,
  },
  backBtnText: { fontSize: 15, fontWeight: '700', color: C.white },
});