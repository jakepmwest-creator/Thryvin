import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Image, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform } from 'react-native';
import { PreviewVideoPlayer, isValidVideoUrl } from './ExerciseVideoPlayer';
import { usePreferencesStore } from '../stores/preferences-store';
import { useWorkoutStore } from '../stores/workout-store';
import { getApiBaseUrl } from '../services/env';

const API_BASE_URL = getApiBaseUrl();

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#FFFFFF',
  card: '#F8F9FA',
  cardBorder: '#E8ECF0',
  accent: '#a259ff',
  accentSoft: 'rgba(162,89,255,0.08)',
  accentSelected: 'rgba(162,89,255,0.15)',
  green: '#22c55e',
  red: '#ef4444',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  gradStart: '#A22BF6',
  gradEnd: '#FF4EC7',
};

// ─── Keyword classifiers ───────────────────────────────────────────────────────
const cardioKeywords = ['cardio', 'running', 'cycling', 'rowing', 'swimming', 'jump rope', 'treadmill', 'elliptical', 'stair', 'hiit', 'jumping jack', 'burpee', 'mountain climber'];
const flexKeywords = ['stretch', 'yoga', 'mobility', 'warmup', 'warm-up', 'recovery', 'foam roll', 'flexibility'];

function classifyExercise(ex: any): 'strength' | 'cardio' | 'flexibility' {
  const name = (ex.name || '').toLowerCase();
  const cat = (ex.category || '').toLowerCase();
  if (flexKeywords.some(k => name.includes(k) || cat.includes(k))) return 'flexibility';
  if (cardioKeywords.some(k => name.includes(k) || cat.includes(k))) return 'cardio';
  return 'strength';
}

function classifyEquipment(ex: any): 'free-weights' | 'machines' | 'bodyweight' | 'cardio' | 'flexibility' | 'other' {
  const name = (ex.name || '').toLowerCase();
  const equipment = (ex.equipment || '').toLowerCase();
  const cat = (ex.category || '').toLowerCase();

  if (['stretch', 'yoga', 'mobility', 'flexibility', 'foam roll', 'warmup', 'cooldown'].some(k => name.includes(k) || cat.includes(k))) return 'flexibility';
  if (['run', 'cardio', 'cycling', 'treadmill', 'elliptical', 'rowing', 'stair', 'jump rope', 'hiit', 'burpee'].some(k => name.includes(k) || cat.includes(k))) return 'cardio';
  if (['bodyweight', 'push-up', 'pull-up', 'dip', 'plank', 'sit-up', 'crunch', 'lunge'].some(k => name.includes(k) || equipment.includes(k))) return 'bodyweight';
  if (['cable', 'machine', 'smith', 'leg press', 'chest press machine', 'lat pulldown'].some(k => name.includes(k) || equipment.includes(k))) return 'machines';
  if (['dumbbell', 'barbell', 'kettlebell', 'free weight'].some(k => name.includes(k) || equipment.includes(k))) return 'free-weights';
  return 'free-weights';
}

function classifySubEquipment(ex: any): string {
  const name = (ex.name || '').toLowerCase();
  const eq = (ex.equipment || '').toLowerCase();
  if (name.includes('dumbbell') || eq.includes('dumbbell')) return 'Dumbbells';
  if (name.includes('barbell') || name.includes('bench press') || name.includes('squat') || eq.includes('barbell')) return 'Barbells';
  if (name.includes('kettlebell') || eq.includes('kettlebell')) return 'Kettlebells';
  if (name.includes('cable') || eq.includes('cable')) return 'Cables';
  return 'Other';
}

function classifySubMachine(ex: any): string {
  const name = (ex.name || '').toLowerCase();
  const eq = (ex.equipment || '').toLowerCase();
  if (name.includes('cable') || eq.includes('cable')) return 'Cable Machine';
  if (name.includes('smith')) return 'Smith Machine';
  if (name.includes('leg press')) return 'Leg Press';
  return 'Other';
}

// ─── Thumb URL helper ─────────────────────────────────────────────────────────
function getThumbUrl(exercise: any): string | null {
  if (!exercise) return null;
  const thumb = exercise.thumbnailUrl;
  if (thumb && typeof thumb === 'string' && thumb.startsWith('http')) return thumb;
  const videoUrl = exercise.videoUrl;
  if (isValidVideoUrl(videoUrl) && videoUrl.includes('cloudinary')) {
    return videoUrl
      .replace('/upload/', '/upload/w_400,h_300,c_fill,so_1/')
      .replace('.mp4', '.jpg');
  }
  return null;
}

// ─── View toggle types ────────────────────────────────────────────────────────
type ViewMode = 'all' | 'liked' | 'disliked';
type MainCategory = 'All' | 'Free Weights' | 'Machines' | 'Bodyweight' | 'Cardio' | 'Flexibility';
const MAIN_CATEGORIES: MainCategory[] = ['All', 'Free Weights', 'Machines', 'Bodyweight', 'Cardio', 'Flexibility'];
const FREE_WEIGHTS_SUBS = ['All', 'Dumbbells', 'Barbells', 'Kettlebells', 'Cables'];
const MACHINES_SUBS = ['All', 'Cable Machine', 'Smith Machine', 'Leg Press', 'Other'];

// ─── Muscle Pill ──────────────────────────────────────────────────────────────
const MusclePill = ({ label }: { label: string }) => (
  <View style={pillStyles.pill}>
    <Text style={pillStyles.text} numberOfLines={1}>{label}</Text>
  </View>
);
const pillStyles = StyleSheet.create({
  pill: { backgroundColor: C.accentSoft, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  text: { fontSize: 10, color: C.accent, fontWeight: '600' },
});

// ─── Exercise Card (2-col grid) ────────────────────────────────────────────────
const ExerciseCard = memo(({ exercise, onPress, personalBests }: {
  exercise: any;
  onPress: () => void;
  personalBests: any[];
}) => {
  const { getPreference, likeExercise, removePreference, isStarred } = usePreferencesStore();
  const preference = getPreference(exercise.id);
  const starred = isStarred(exercise.id);
  const thumbUrl = getThumbUrl(exercise);
  const muscle = exercise.muscleGroups?.[0] || exercise.bodyPart || 'Full Body';

  // Find PB for this exercise
  const pb = personalBests.find(p =>
    p.exercise?.toLowerCase() === exercise.name?.toLowerCase()
  );

  const handleLike = () => {
    if (preference === 'liked') removePreference(exercise.id);
    else likeExercise(exercise.id, exercise.name);
  };

  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Thumbnail */}
      <View style={cardStyles.thumb}>
        {thumbUrl ? (
          <Image source={{ uri: thumbUrl }} style={cardStyles.thumbImg} resizeMode="cover" />
        ) : (
          <LinearGradient colors={[C.gradStart, C.gradEnd]} style={cardStyles.thumbPlaceholder}>
            <Ionicons name="barbell-outline" size={22} color="rgba(255,255,255,0.55)" />
          </LinearGradient>
        )}
        {/* Heart button top-right */}
        <TouchableOpacity onPress={handleLike} style={cardStyles.heartBtn}>
          <Ionicons
            name={preference === 'liked' ? 'heart' : 'heart-outline'}
            size={15}
            color={preference === 'liked' ? C.accent : '#CCC'}
          />
        </TouchableOpacity>
      </View>
      <View style={cardStyles.info}>
        <Text style={cardStyles.name} numberOfLines={2}>{exercise.name}</Text>
        <MusclePill label={muscle} />
        {/* PB row */}
        {pb && (
          <View style={cardStyles.pbRow}>
            <Text style={cardStyles.trophyIcon}>🏆</Text>
            <Text style={cardStyles.pbText}>
              PB: {pb.value}{pb.unit || 'kg'}{pb.reps ? ` × ${pb.reps}` : ''}
            </Text>
          </View>
        )}
        {/* Star indicator */}
        {starred && (
          <View style={cardStyles.starRow}>
            <Ionicons name="star" size={11} color="#F59E0B" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const cardStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  thumb: { width: '100%', height: 82, backgroundColor: C.card, position: 'relative' },
  thumbImg: { width: '100%', height: '100%' },
  thumbPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heartBtn: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12, padding: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
  },
  info: { padding: 8, gap: 4 },
  name: { fontSize: 12, fontWeight: '700', color: C.text, lineHeight: 16 },
  pbRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  trophyIcon: { fontSize: 10 },
  pbText: { fontSize: 10, color: C.textMuted },
  starRow: { marginTop: 2 },
});

// ─── 2-col grid renderer ──────────────────────────────────────────────────────
const ExerciseGrid = ({ items, onPress, personalBests }: {
  items: any[];
  onPress: (ex: any) => void;
  personalBests: any[];
}) => {
  const rows: any[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push([items[i], items[i + 1] || null]);
  }
  return (
    <>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <ExerciseCard exercise={row[0]} onPress={() => onPress(row[0])} personalBests={personalBests} />
          </View>
          {row[1]
            ? <View style={{ flex: 1 }}><ExerciseCard exercise={row[1]} onPress={() => onPress(row[1])} personalBests={personalBests} /></View>
            : <View style={{ flex: 1 }} />
          }
        </View>
      ))}
    </>
  );
};

// ─── Exercise Detail sheet ────────────────────────────────────────────────────
const ExerciseDetail = ({ exercise, onClose, personalBests }: {
  exercise: any;
  onClose: () => void;
  personalBests: any[];
}) => {
  const hasVideo = isValidVideoUrl(exercise?.videoUrl);
  const { getPreference, likeExercise, removePreference, isStarred, starExercise, unstarExercise } = usePreferencesStore();
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const preference = exercise ? getPreference(exercise.id) : null;
  const starred = exercise ? isStarred(exercise.id) : false;

  const pb = exercise
    ? personalBests.find(p => p.exercise?.toLowerCase() === exercise.name?.toLowerCase())
    : null;

  useEffect(() => {
    if (!exercise?.id) { setStats(null); return; }
    let cancelled = false;
    (async () => {
      setStatsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/stats/exercise/${exercise.id}`);
        if (res.ok && !cancelled) setStats(await res.json());
      } catch { /* skip */ }
      finally { if (!cancelled) setStatsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [exercise?.id]);

  if (!exercise) return null;

  const handleLikeToggle = () => {
    if (preference === 'liked') removePreference(exercise.id);
    else likeExercise(exercise.id, exercise.name);
  };
  const handleStarToggle = async () => {
    if (starred) unstarExercise(exercise.id);
    else await starExercise(exercise.id, exercise.name, exercise.videoUrl);
  };
  const hasHistory = stats?.history?.length > 0;
  const latestSession = hasHistory ? stats.history[0] : null;

  return (
    <Modal visible={!!exercise} transparent animationType="slide" onRequestClose={onClose}>
      <View style={dStyles.overlay}>
        <View style={dStyles.sheet}>
          <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
            {/* Close btn */}
            <TouchableOpacity onPress={onClose} style={dStyles.closeBtn}>
              <View style={dStyles.closeBg}><Ionicons name="close" size={20} color={C.text} /></View>
            </TouchableOpacity>
            {hasVideo
              ? <View style={dStyles.video}><PreviewVideoPlayer videoUrl={exercise.videoUrl} exerciseName={exercise.name} /></View>
              : <LinearGradient colors={[C.gradStart, C.gradEnd]} style={dStyles.headerGrad}><Ionicons name="barbell" size={36} color="#FFF" /></LinearGradient>
            }
            <View style={dStyles.body}>
              <Text style={dStyles.name}>{exercise.name}</Text>

              {/* Action pills */}
              <View style={dStyles.actionRow}>
                <TouchableOpacity onPress={handleLikeToggle} style={[dStyles.pill, preference === 'liked' && dStyles.pillLiked]}>
                  <Ionicons name={preference === 'liked' ? 'heart' : 'heart-outline'} size={18} color={preference === 'liked' ? C.accent : C.textMuted} />
                  <Text style={[dStyles.pillText, preference === 'liked' && { color: C.accent }]}>{preference === 'liked' ? 'Liked' : 'Like'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleStarToggle} style={[dStyles.pill, starred && dStyles.pillStarred]}>
                  <Ionicons name={starred ? 'star' : 'star-outline'} size={18} color={starred ? '#F59E0B' : C.textMuted} />
                  <Text style={[dStyles.pillText, starred && { color: '#F59E0B' }]}>{starred ? 'Starred' : 'Star'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={dStyles.aiNote}>Liked exercises influence your AI-generated workouts</Text>

              {/* Tags */}
              <View style={dStyles.tags}>
                {exercise.difficulty && <View style={dStyles.tag}><Text style={dStyles.tagText}>{exercise.difficulty}</Text></View>}
                <View style={dStyles.tag}><Text style={dStyles.tagText}>{exercise.muscleGroups?.join(', ') || exercise.bodyPart || 'Full Body'}</Text></View>
                {exercise.equipment && (
                  <View style={dStyles.tag}><Text style={dStyles.tagText}>{Array.isArray(exercise.equipment) ? exercise.equipment.join(', ') : exercise.equipment}</Text></View>
                )}
              </View>

              {/* PB from store */}
              {pb && (
                <View style={dStyles.pbCard}>
                  <Text style={dStyles.trophyBig}>🏆</Text>
                  <View>
                    <Text style={dStyles.pbLabel}>Personal Best</Text>
                    <Text style={dStyles.pbValue}>
                      {pb.value}{pb.unit || 'kg'}{pb.reps ? ` × ${pb.reps}` : ''}
                    </Text>
                    {pb.date && <Text style={dStyles.pbDate}>{new Date(pb.date).toLocaleDateString()}</Text>}
                  </View>
                </View>
              )}

              {/* Instructions */}
              <Text style={dStyles.desc}>{exercise.description || 'Perform this exercise with proper form and controlled movements.'}</Text>

              {/* Tips */}
              {exercise.tips?.length > 0 && (
                <View style={{ marginTop: 4 }}>
                  <Text style={dStyles.sectionTitle}>Form Tips</Text>
                  {exercise.tips.map((tip: string, i: number) => (
                    <View key={i} style={dStyles.tipRow}>
                      <LinearGradient colors={[C.gradStart, C.gradEnd]} style={dStyles.tipNum}>
                        <Text style={dStyles.tipNumText}>{i + 1}</Text>
                      </LinearGradient>
                      <Text style={dStyles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* API stats */}
              {statsLoading
                ? <ActivityIndicator size="small" color={C.accent} style={{ marginTop: 20 }} />
                : hasHistory
                  ? (
                    <View style={{ marginTop: 16 }}>
                      <Text style={dStyles.sectionTitle}>Your History</Text>
                      <View style={dStyles.statsGrid}>
                        <View style={dStyles.statBox}>
                          <Text style={dStyles.statValue}>
                            {stats.personalBest?.weight || latestSession?.maxWeight
                              ? `${stats.personalBest?.weight || latestSession?.maxWeight} kg`
                              : '--'}
                          </Text>
                          <Text style={dStyles.statLabel}>Best Weight</Text>
                        </View>
                        <View style={dStyles.statBox}>
                          <Text style={dStyles.statValue}>{stats.history.length}</Text>
                          <Text style={dStyles.statLabel}>Times Completed</Text>
                        </View>
                      </View>
                    </View>
                  )
                  : !statsLoading && (
                    <View style={dStyles.noHistoryBox}>
                      <Text style={dStyles.noHistoryIcon}>📋</Text>
                      <Text style={dStyles.noHistoryText}>No history yet — this will populate as you train!</Text>
                    </View>
                  )
              }
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const dStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', flex: 1, marginTop: 50 },
  closeBtn: { position: 'absolute', top: 14, right: 14, zIndex: 10 },
  closeBg: { padding: 6, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder },
  video: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', backgroundColor: '#000' },
  headerGrad: { height: 130, justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  body: { padding: 20, paddingBottom: 40 },
  name: { fontSize: 22, fontWeight: '700', color: C.text, textAlign: 'center', marginBottom: 16 },
  actionRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.card },
  pillLiked: { borderColor: C.accent, backgroundColor: C.accentSelected },
  pillStarred: { borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.1)' },
  pillText: { fontSize: 14, fontWeight: '600', color: C.textSecondary },
  aiNote: { fontSize: 11, color: C.textMuted, textAlign: 'center', marginBottom: 14, fontStyle: 'italic' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 16 },
  tag: { backgroundColor: C.accentSoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  tagText: { fontSize: 12, color: C.accent, fontWeight: '500' },
  pbCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  trophyBig: { fontSize: 24 },
  pbLabel: { fontSize: 11, color: C.textMuted, fontWeight: '500' },
  pbValue: { fontSize: 16, fontWeight: '700', color: C.text },
  pbDate: { fontSize: 11, color: C.textMuted },
  desc: { fontSize: 14, color: C.textSecondary, lineHeight: 21, textAlign: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  tipNum: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  tipNumText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  tipText: { flex: 1, fontSize: 14, color: C.textSecondary, lineHeight: 20 },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: C.cardBorder },
  statValue: { fontSize: 20, fontWeight: '800', color: C.text },
  statLabel: { fontSize: 11, color: C.textSecondary },
  noHistoryBox: { marginTop: 16, padding: 14, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.cardBorder, alignItems: 'center', gap: 6 },
  noHistoryIcon: { fontSize: 20 },
  noHistoryText: { fontSize: 13, color: C.textSecondary, textAlign: 'center', fontStyle: 'italic' },
});

// ─── Main Modal ───────────────────────────────────────────────────────────────
interface ExploreWorkoutsModalProps {
  visible: boolean;
  onClose: () => void;
  initialCategory?: string;
  category?: string;
}

export const ExploreWorkoutsModal = ({ visible, onClose }: ExploreWorkoutsModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [mainCategory, setMainCategory] = useState<MainCategory>('All');
  const [subFilter, setSubFilter] = useState<string>('All');
  const scrollRef = useRef<ScrollView>(null);

  const { getLikedExercises, getDislikedExercises, removePreference } = usePreferencesStore();
  const { personalBests } = useWorkoutStore();

  // Fetch exercises once when modal opens
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/exercises?limit=2000`);
        const data = await res.json();
        if (!cancelled) setExercises(data.exercises || []);
      } catch (e) {
        console.error('Failed to fetch exercises:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [visible]);

  // Reset on close
  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setSelectedExercise(null);
      setViewMode('all');
      setMainCategory('All');
      setSubFilter('All');
    }
  }, [visible]);

  // Build id→exercise lookup
  const exerciseMap = useMemo(() => {
    const map: Record<string, any> = {};
    exercises.forEach(ex => { map[String(ex.id)] = ex; });
    return map;
  }, [exercises]);

  const likedExercises = useMemo(() =>
    getLikedExercises().map(l => exerciseMap[l.exerciseId]).filter(Boolean),
    [getLikedExercises, exerciseMap]
  );

  const dislikedExercises = useMemo(() =>
    getDislikedExercises().map(d => exerciseMap[d.exerciseId]).filter(Boolean),
    [getDislikedExercises, exerciseMap]
  );

  // Base pool by view mode
  const basePool = useMemo(() => {
    if (viewMode === 'liked') return likedExercises;
    if (viewMode === 'disliked') return dislikedExercises;
    return exercises;
  }, [viewMode, exercises, likedExercises, dislikedExercises]);

  // Search filter
  const searchFiltered = useMemo(() => {
    if (!searchQuery) return basePool;
    const q = searchQuery.toLowerCase();
    return basePool.filter(ex =>
      ex.name?.toLowerCase().includes(q) ||
      ex.muscleGroups?.some((mg: string) => mg.toLowerCase().includes(q)) ||
      ex.bodyPart?.toLowerCase().includes(q)
    );
  }, [basePool, searchQuery]);

  // Category filter
  const categoryFiltered = useMemo(() => {
    if (mainCategory === 'All') return searchFiltered;
    const catMap: Record<MainCategory, string> = {
      'All': 'all',
      'Free Weights': 'free-weights',
      'Machines': 'machines',
      'Bodyweight': 'bodyweight',
      'Cardio': 'cardio',
      'Flexibility': 'flexibility',
    };
    return searchFiltered.filter(ex => classifyEquipment(ex) === catMap[mainCategory]);
  }, [searchFiltered, mainCategory]);

  // Sub filter
  const displayExercises = useMemo(() => {
    if (subFilter === 'All') return categoryFiltered.slice(0, 60);
    if (mainCategory === 'Free Weights') {
      return categoryFiltered.filter(ex => classifySubEquipment(ex) === subFilter).slice(0, 60);
    }
    if (mainCategory === 'Machines') {
      return categoryFiltered.filter(ex => classifySubMachine(ex) === subFilter).slice(0, 60);
    }
    return categoryFiltered.slice(0, 60);
  }, [categoryFiltered, subFilter, mainCategory]);

  const openDetail = useCallback((ex: any) => setSelectedExercise(ex), []);

  const handleBrowseAll = useCallback(() => {
    setMainCategory('All');
    setViewMode('all');
    setSubFilter('All');
    setSearchQuery('');
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const handleMainCategoryChange = useCallback((cat: MainCategory) => {
    setMainCategory(cat);
    setSubFilter('All');
  }, []);

  // Sub-filter chips available
  const subFilters = mainCategory === 'Free Weights' ? FREE_WEIGHTS_SUBS
    : mainCategory === 'Machines' ? MACHINES_SUBS
    : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={mStyles.overlay}>
        <View style={mStyles.container}>

          {/* ── Header ─────────────────────────────────────────────────── */}
          <View style={mStyles.header}>
            <Text style={mStyles.headerTitle}>Explore Exercises</Text>
            <TouchableOpacity onPress={onClose} style={mStyles.closeBtn}>
              <Ionicons name="close" size={20} color={C.text} />
            </TouchableOpacity>
          </View>

          {/* ── Search ─────────────────────────────────────────────────── */}
          <View style={mStyles.searchRow}>
            <View style={mStyles.searchBox}>
              <Ionicons name="search-outline" size={16} color={C.textMuted} />
              <TextInput
                style={mStyles.searchInput}
                placeholder="Search exercises..."
                placeholderTextColor={C.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={C.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── View Toggle ─────────────────────────────────────────────── */}
          <View style={mStyles.viewToggleRow}>
            {(['all', 'liked', 'disliked'] as ViewMode[]).map(mode => (
              <TouchableOpacity
                key={mode}
                style={[mStyles.toggleBtn, viewMode === mode && mStyles.toggleBtnActive]}
                onPress={() => setViewMode(mode)}
              >
                <Text style={[mStyles.toggleText, viewMode === mode && mStyles.toggleTextActive]}>
                  {mode === 'all' ? 'All' : mode === 'liked' ? '👍 Liked' : '👎 Disliked'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Category Filter Row ─────────────────────────────────────── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={mStyles.chipScroll} contentContainerStyle={mStyles.chipScrollContent}>
            {MAIN_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[mStyles.chip, mainCategory === cat && mStyles.chipActive]}
                onPress={() => handleMainCategoryChange(cat)}
              >
                <Text style={[mStyles.chipText, mainCategory === cat && mStyles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Sub-filter row ─────────────────────────────────────────── */}
          {subFilters && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={mStyles.subChipScroll} contentContainerStyle={mStyles.chipScrollContent}>
              {subFilters.map(sf => (
                <TouchableOpacity
                  key={sf}
                  style={[mStyles.subChip, subFilter === sf && mStyles.chipActive]}
                  onPress={() => setSubFilter(sf)}
                >
                  <Text style={[mStyles.subChipText, subFilter === sf && mStyles.chipTextActive]}>{sf}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* ── Content ────────────────────────────────────────────────── */}
          {isLoading ? (
            <View style={mStyles.loadingContainer}>
              <ActivityIndicator size="large" color={C.accent} />
              <Text style={mStyles.loadingText}>Loading exercises...</Text>
            </View>
          ) : (
            <ScrollView
              ref={scrollRef}
              style={{ flex: 1 }}
              contentContainerStyle={mStyles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Exercise grid */}
              {displayExercises.length > 0
                ? <ExerciseGrid items={displayExercises} onPress={openDetail} personalBests={personalBests} />
                : (
                  <View style={mStyles.emptyContainer}>
                    <Ionicons name="search-outline" size={48} color={C.textMuted} />
                    <Text style={mStyles.emptyText}>No exercises found</Text>
                    <Text style={mStyles.emptySubtext}>Try adjusting your filters</Text>
                  </View>
                )
              }

              {/* Browse All button */}
              <TouchableOpacity style={mStyles.browseAllBtn} onPress={handleBrowseAll} activeOpacity={0.8}>
                <Text style={mStyles.browseAllText}>Browse All Exercises →</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* Detail sheet */}
          <ExerciseDetail exercise={selectedExercise} onClose={() => setSelectedExercise(null)} personalBests={personalBests} />
        </View>
      </View>
    </Modal>
  );
};

const mStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  container: {
    flex: 1,
    backgroundColor: C.bg,
    marginTop: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 14 : 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
    backgroundColor: C.bg,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.card,
    borderWidth: 1, borderColor: C.cardBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  searchRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.bg,
    borderRadius: 99,
    paddingHorizontal: 14,
    borderWidth: 1, borderColor: C.cardBorder,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text },
  viewToggleRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 99,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: C.accent },
  toggleText: { fontSize: 13, fontWeight: '600', color: C.text },
  toggleTextActive: { color: '#FFF' },
  chipScroll: { maxHeight: 44 },
  subChipScroll: { maxHeight: 38, marginTop: 2 },
  chipScrollContent: { paddingHorizontal: 16, paddingVertical: 4, gap: 8, flexDirection: 'row', alignItems: 'center' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 99, borderWidth: 1,
    borderColor: C.cardBorder, backgroundColor: C.bg,
  },
  chipActive: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { fontSize: 13, fontWeight: '600', color: C.text },
  chipTextActive: { color: '#FFF' },
  subChip: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 99, borderWidth: 1,
    borderColor: C.cardBorder, backgroundColor: C.bg,
  },
  subChipText: { fontSize: 12, fontWeight: '500', color: C.textSecondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: C.textMuted },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: C.text },
  emptySubtext: { fontSize: 13, color: C.textMuted },
  browseAllBtn: {
    marginTop: 16, marginBottom: 8,
    borderWidth: 1.5, borderColor: C.accent,
    borderRadius: 99, paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: C.bg,
  },
  browseAllText: { fontSize: 14, fontWeight: '700', color: C.accent },
});

export default ExploreWorkoutsModal;
