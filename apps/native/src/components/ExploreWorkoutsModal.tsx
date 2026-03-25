import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  ScrollView, Image, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PreviewVideoPlayer, isValidVideoUrl } from './ExerciseVideoPlayer';
import { usePreferencesStore } from '../stores/preferences-store';
import { useWorkoutStore } from '../stores/workout-store';
import { getApiBaseUrl } from '../services/env';

const API_BASE_URL = getApiBaseUrl();

const C = {
  bg: '#FFFFFF',
  card: '#F8F9FA',
  cardBorder: '#E8ECF0',
  accent: '#a259ff',
  green: '#22c55e',
  red: '#ef4444',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  gradStart: '#A259FF',
  gradEnd: '#FF4EC7',
};
const GRAD: [string, string] = ['#A259FF', '#FF4EC7'];

// ─── Classifiers ──────────────────────────────────────────────────────────────
function classifyEquipment(ex: any): string {
  if (!ex) return 'other';
  const name = (ex.name || '').toLowerCase();
  const equipment = (ex.equipment || '').toLowerCase();
  const cat = (ex.category || '').toLowerCase();
  if (['stretch', 'yoga', 'mobility', 'flexibility', 'foam roll', 'warmup', 'cooldown'].some(k => name.includes(k) || cat.includes(k))) return 'flexibility';
  if (['run', 'cardio', 'cycling', 'treadmill', 'elliptical', 'rowing', 'stair', 'jump rope', 'hiit', 'burpee'].some(k => name.includes(k) || cat.includes(k))) return 'cardio';
  if (['bodyweight', 'push-up', 'pull-up', 'dip', 'plank', 'sit-up', 'crunch', 'lunge'].some(k => name.includes(k) || equipment.includes(k))) return 'bodyweight';
  if (['cable machine', 'smith machine', 'leg press machine'].some(k => name.includes(k))) return 'machines';
  if (['cable', 'machine'].some(k => equipment.includes(k)) && !['dumbbell', 'barbell', 'kettlebell'].some(k => equipment.includes(k))) return 'machines';
  if (['dumbbell', 'barbell', 'kettlebell', 'free weight'].some(k => name.includes(k) || equipment.includes(k))) return 'free-weights';
  return 'free-weights';
}

function classifySubEquipment(ex: any): string {
  if (!ex) return 'Other';
  const name = (ex.name || '').toLowerCase();
  const eq = (ex.equipment || '').toLowerCase();
  if (name.includes('dumbbell') || eq.includes('dumbbell')) return 'Dumbbells';
  if (name.includes('barbell') || name.includes('bench press') || (name.includes('squat') && !name.includes('goblet')) || eq.includes('barbell')) return 'Barbells';
  if (name.includes('kettlebell') || eq.includes('kettlebell')) return 'Kettlebells';
  if (name.includes('cable') || eq.includes('cable')) return 'Cables';
  return 'Other';
}

function classifySubMachine(ex: any): string {
  if (!ex) return 'Other';
  const name = (ex.name || '').toLowerCase();
  if (name.includes('cable')) return 'Cable Machine';
  if (name.includes('smith')) return 'Smith Machine';
  if (name.includes('leg press')) return 'Leg Press';
  return 'Other';
}

function getMuscleColor(muscle: string): string {
  const m = (muscle || '').toLowerCase();
  if (m.includes('chest') || m.includes('pec')) return '#3B82F6';
  if (m.includes('leg') || m.includes('quad') || m.includes('hamstring') || m.includes('glute') || m.includes('calf')) return '#22C55E';
  if (m.includes('back') || m.includes('lat') || m.includes('trap')) return '#F97316';
  if (m.includes('arm') || m.includes('bicep') || m.includes('tricep') || m.includes('shoulder') || m.includes('delt')) return '#A855F7';
  if (m.includes('core') || m.includes('abs') || m.includes('oblique')) return '#F59E0B';
  if (m.includes('cardio') || m.includes('hiit')) return '#EF4444';
  if (m.includes('full body')) return '#14B8A6';
  return '#9CA3AF';
}

function getThumbUrl(exercise: any): string | null {
  if (!exercise) return null;
  const thumb = exercise.thumbnailUrl;
  if (thumb && typeof thumb === 'string' && thumb.startsWith('http')) return thumb;
  const videoUrl = exercise.videoUrl;
  if (isValidVideoUrl(videoUrl) && videoUrl.includes('cloudinary')) {
    return videoUrl.replace('/upload/', '/upload/w_400,h_300,c_fill,so_1/').replace('.mp4', '.jpg');
  }
  return null;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type ViewMode = 'all' | 'liked' | 'disliked';
type MainCategory = 'All' | 'Free Weights' | 'Machines' | 'Bodyweight' | 'Cardio' | 'Flexibility';
const MAIN_CATEGORIES: MainCategory[] = ['All', 'Free Weights', 'Machines', 'Bodyweight', 'Cardio', 'Flexibility'];
const FREE_WEIGHTS_SUBS = ['All', 'Dumbbells', 'Barbells', 'Kettlebells', 'Cables'];
const MACHINES_SUBS = ['All', 'Cable Machine', 'Smith Machine', 'Leg Press', 'Other'];
const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Full Body'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

// ─── Components ───────────────────────────────────────────────────────────────
const MusclePill = ({ label }: { label: string }) => {
  const color = getMuscleColor(label);
  return (
    <View style={[pillSt.pill, { backgroundColor: color + '22' }]}>
      <Text style={[pillSt.text, { color }]} numberOfLines={1}>{label}</Text>
    </View>
  );
};
const pillSt = StyleSheet.create({
  pill: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  text: { fontSize: 10, fontWeight: '700' },
});

const GradChip = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ marginRight: 7 }}>
    {selected ? (
      <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={chipSt.chip}>
        <Text style={chipSt.textActive}>{label}</Text>
      </LinearGradient>
    ) : (
      <View style={chipSt.chipOff}>
        <Text style={chipSt.textOff}>{label}</Text>
      </View>
    )}
  </TouchableOpacity>
);
const chipSt = StyleSheet.create({
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 99 },
  chipOff: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 99, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: C.cardBorder },
  textActive: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  textOff: { color: C.text, fontSize: 12, fontWeight: '600' },
});

// Card item for FlatList
const ExerciseCard = memo(({ exercise, onPress, personalBests }: { exercise: any; onPress: () => void; personalBests: any[] }) => {
  const { getPreference, likeExercise, removePreference, isStarred } = usePreferencesStore();
  if (!exercise) return <View style={{ flex: 1, margin: 5 }} />;
  const preference = getPreference(exercise.id);
  const starred = isStarred ? isStarred(exercise.id) : false;
  const thumbUrl = getThumbUrl(exercise);
  const hasVideo = isValidVideoUrl(exercise?.videoUrl);
  const muscle = exercise.muscleGroups?.[0] || exercise.bodyPart || 'Full Body';
  const muscleInitial = (muscle || 'F').charAt(0).toUpperCase();
  const pb = personalBests.find(p => p.exercise?.toLowerCase() === exercise.name?.toLowerCase());

  return (
    <TouchableOpacity style={[cardSt.card, { flex: 1, margin: 5 }]} onPress={onPress} activeOpacity={0.8}>
      <View style={cardSt.thumb}>
        {thumbUrl ? (
          <>
            <Image source={{ uri: thumbUrl }} style={cardSt.thumbImg} resizeMode="cover" />
            {hasVideo && (
              <View style={cardSt.playOverlay}>
                <Ionicons name="play-circle" size={28} color="rgba(255,255,255,0.9)" />
              </View>
            )}
          </>
        ) : (
          <LinearGradient colors={GRAD} style={cardSt.thumbPlaceholder}>
            <Text style={cardSt.thumbInitial}>{muscleInitial}</Text>
          </LinearGradient>
        )}
        <TouchableOpacity onPress={() => { if (preference === 'liked') removePreference(exercise.id); else likeExercise(exercise.id, exercise.name); }} style={cardSt.heartBtn}>
          <Ionicons name={preference === 'liked' ? 'heart' : 'heart-outline'} size={14} color={preference === 'liked' ? C.gradStart : '#CCC'} />
        </TouchableOpacity>
      </View>
      <View style={cardSt.info}>
        <Text style={cardSt.name} numberOfLines={2}>{exercise.name}</Text>
        <MusclePill label={muscle} />
        {pb && (
          <View style={cardSt.pbRow}>
            <Text style={cardSt.trophy}>🏆</Text>
            <Text style={cardSt.pbText}>{pb.value}{pb.unit || 'kg'}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});
const cardSt = StyleSheet.create({
  card: { backgroundColor: C.bg, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  thumb: { width: '100%', height: 100, backgroundColor: C.card, position: 'relative' },
  thumbImg: { width: '100%', height: '100%' },
  thumbPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  thumbInitial: { fontSize: 32, fontWeight: '800', color: 'rgba(255,255,255,0.85)' },
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  heartBtn: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12, padding: 4 },
  info: { padding: 9, gap: 4 },
  name: { fontSize: 12, fontWeight: '700', color: C.text, lineHeight: 16 },
  pbRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  trophy: { fontSize: 10 },
  pbText: { fontSize: 10, color: '#D97706', fontWeight: '700' },
});

// ─── Detail Sheet ─────────────────────────────────────────────────────────────
const ExerciseDetail = ({ exercise, onClose, personalBests }: { exercise: any; onClose: () => void; personalBests: any[] }) => {
  const hasVideo = isValidVideoUrl(exercise?.videoUrl);
  const { getPreference, likeExercise, removePreference, isStarred, starExercise, unstarExercise } = usePreferencesStore();
  const [stats, setStats] = useState<any>(null);
  const preference = exercise ? getPreference(exercise.id) : null;
  const starred = exercise && isStarred ? isStarred(exercise.id) : false;
  const pb = exercise ? personalBests.find(p => p.exercise?.toLowerCase() === exercise.name?.toLowerCase()) : null;

  useEffect(() => {
    if (!exercise?.id) { setStats(null); return; }
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/stats/exercise/${exercise.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!cancelled) setStats(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [exercise?.id]);

  if (!exercise) return null;
  const timesCompleted = stats?.history?.length || 0;

  return (
    <Modal visible={!!exercise} transparent animationType="slide" onRequestClose={onClose}>
      <View style={detSt.overlay}>
        <View style={detSt.sheet}>
          <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
            <TouchableOpacity onPress={onClose} style={detSt.closeBtn}>
              <View style={detSt.closeBg}><Ionicons name="close" size={20} color={C.text} /></View>
            </TouchableOpacity>
            {hasVideo
              ? <View style={detSt.video}><PreviewVideoPlayer videoUrl={exercise.videoUrl} exerciseName={exercise.name} /></View>
              : <LinearGradient colors={GRAD} style={detSt.headerGrad}><Ionicons name="barbell" size={36} color="#FFF" /></LinearGradient>}
            <View style={detSt.body}>
              <Text style={detSt.name}>{exercise.name}</Text>
              {(exercise.muscleGroups?.length > 0 || exercise.bodyPart) && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {(exercise.muscleGroups || [exercise.bodyPart]).filter(Boolean).map((m: string, i: number) => (
                    <MusclePill key={i} label={m} />
                  ))}
                </View>
              )}
              <View style={detSt.actionRow}>
                <TouchableOpacity onPress={() => { if (preference === 'liked') removePreference(exercise.id); else likeExercise(exercise.id, exercise.name); }} style={[detSt.pill, preference === 'liked' && detSt.pillLiked]}>
                  <Ionicons name={preference === 'liked' ? 'heart' : 'heart-outline'} size={16} color={preference === 'liked' ? '#FFF' : C.accent} />
                  <Text style={[detSt.pillText, preference === 'liked' && { color: '#FFF' }]}>{preference === 'liked' ? 'Liked' : 'Like'}</Text>
                </TouchableOpacity>
                {starExercise && (
                  <TouchableOpacity onPress={async () => { if (starred) unstarExercise?.(exercise.id); else await starExercise(exercise.id, exercise.name, exercise.videoUrl); }} style={[detSt.pill, starred && detSt.pillStarred]}>
                    <Ionicons name={starred ? 'star' : 'star-outline'} size={16} color={starred ? '#FFF' : '#F59E0B'} />
                    <Text style={[detSt.pillText, starred && { color: '#FFF' }]}>{starred ? 'Starred' : 'Star'}</Text>
                  </TouchableOpacity>
                )}
              </View>
              {/* FORM TIPS FIRST */}
              {exercise.instructions && (
                <View style={{ backgroundColor: '#F0E8FF', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#DDD0FF' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Ionicons name="bulb" size={18} color={C.accent} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: C.accent }}>Form Tips</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: '#4A3680', lineHeight: 20 }}>{exercise.instructions}</Text>
                </View>
              )}
              {/* HISTORY BELOW */}
              {pb ? (
                <View style={detSt.pbCard}>
                  <Text style={detSt.pbTitle}>🏆 Personal Best</Text>
                  <Text style={detSt.pbValue}>{pb.value}{pb.unit || 'kg'}{pb.reps ? ` × ${pb.reps} reps` : ''}</Text>
                  {pb.date && <Text style={detSt.pbDate}>{new Date(pb.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>}
                </View>
              ) : (
                <View style={[detSt.pbCard, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
                  <Text style={{ color: C.textMuted, fontSize: 13, textAlign: 'center' }}>No history yet — complete workouts to see your progress! 💪</Text>
                </View>
              )}
              {timesCompleted > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Ionicons name="checkmark-circle" size={16} color={C.green} />
                  <Text style={{ fontSize: 13, color: C.textSecondary, fontWeight: '500' }}>Completed {timesCompleted} {timesCompleted === 1 ? 'time' : 'times'}</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
const detSt = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  closeBg: { backgroundColor: '#F0F0F0', borderRadius: 20, padding: 8 },
  video: { height: 200, backgroundColor: '#000' },
  headerGrad: { height: 160, justifyContent: 'center', alignItems: 'center' },
  body: { padding: 20 },
  name: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 10 },
  pbCard: { backgroundColor: '#FFFBEB', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: '#FDE68A' },
  pbTitle: { fontSize: 12, fontWeight: '700', color: '#92400E', marginBottom: 4 },
  pbValue: { fontSize: 24, fontWeight: '900', color: '#D97706' },
  pbDate: { fontSize: 11, color: '#A16207', marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99, borderWidth: 1.5, borderColor: C.accent, backgroundColor: '#FFF' },
  pillText: { fontSize: 13, fontWeight: '700', color: C.accent },
  pillLiked: { backgroundColor: C.gradStart, borderColor: C.gradStart },
  pillStarred: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
});

// ─── Main Component ───────────────────────────────────────────────────────────
interface ExploreWorkoutsModalProps {
  visible: boolean;
  onClose: () => void;
  initialCategory?: string;
}

export const ExploreWorkoutsModal: React.FC<ExploreWorkoutsModalProps> = ({ visible, onClose, initialCategory }) => {
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [mainCategory, setMainCategory] = useState<MainCategory>('All');
  const [subFilter, setSubFilter] = useState<string>('All');
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  // Filter-first flow
  const [showFilterPanel, setShowFilterPanel] = useState(true);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);

  const { personalBests } = useWorkoutStore();
  const { getLikedExercises, getDislikedExercises } = usePreferencesStore();

  useEffect(() => {
    if (!visible) return;
    setShowFilterPanel(true);
    setSelectedMuscles([]);
    setSelectedDifficulty([]);
    setSearch('');
    setViewMode('all');
    if (initialCategory && MAIN_CATEGORIES.includes(initialCategory as MainCategory)) {
      setMainCategory(initialCategory as MainCategory);
    } else {
      setMainCategory('All');
    }
    setSubFilter('All');
    setLoading(true);
    fetch(`${API_BASE_URL}/api/exercises`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.exercises || data?.data || []);
        setExercises((list || []).filter(Boolean));
      })
      .catch(() => { setExercises([]); })
      .finally(() => setLoading(false));
  }, [visible, initialCategory]);

  const handleCategoryChange = useCallback((cat: MainCategory) => {
    setMainCategory(cat);
    setSubFilter('All');
  }, []);

  const toggleMuscle = useCallback((m: string) => {
    setSelectedMuscles(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  }, []);

  const toggleDifficulty = useCallback((d: string) => {
    setSelectedDifficulty(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }, []);

  const exerciseMap = useMemo(() => {
    const map: Record<string, any> = {};
    (exercises || []).forEach(ex => { if (ex?.id) map[ex.id] = ex; });
    return map;
  }, [exercises]);

  const likedExercises = useMemo(() => {
    try { return getLikedExercises().map(l => exerciseMap[l.exerciseId]).filter(Boolean); }
    catch { return []; }
  }, [getLikedExercises, exerciseMap]);

  const dislikedExercises = useMemo(() => {
    try { return getDislikedExercises().map(d => exerciseMap[d.exerciseId]).filter(Boolean); }
    catch { return []; }
  }, [getDislikedExercises, exerciseMap]);

  const baseExercises = useMemo(() => {
    try {
      if (viewMode === 'liked') return likedExercises;
      if (viewMode === 'disliked') return dislikedExercises;
      return (exercises || []).filter(Boolean);
    } catch { return (exercises || []).filter(Boolean); }
  }, [viewMode, exercises, likedExercises, dislikedExercises]);

  const searchFiltered = useMemo(() => {
    if (!search.trim()) return baseExercises;
    const q = search.toLowerCase();
    return baseExercises.filter(ex => ex && (
      (ex.name || '').toLowerCase().includes(q) ||
      (ex.bodyPart || '').toLowerCase().includes(q) ||
      (ex.category || '').toLowerCase().includes(q)
    ));
  }, [baseExercises, search]);

  const categoryFiltered = useMemo(() => {
    try {
      const valid = searchFiltered.filter(ex => ex && ex.id);
      if (mainCategory === 'All') return valid;
      const catMap: Record<string, string> = {
        'Free Weights': 'free-weights', 'Machines': 'machines',
        'Bodyweight': 'bodyweight', 'Cardio': 'cardio', 'Flexibility': 'flexibility',
      };
      const target = catMap[mainCategory];
      if (!target) return valid;
      return valid.filter(ex => { try { return classifyEquipment(ex) === target; } catch { return false; } });
    } catch { return searchFiltered.filter(Boolean); }
  }, [searchFiltered, mainCategory]);

  const displayExercises = useMemo(() => {
    try {
      let safe = categoryFiltered.filter(Boolean);
      if (subFilter !== 'All') {
        if (mainCategory === 'Free Weights') {
          safe = safe.filter(ex => { try { return classifySubEquipment(ex) === subFilter; } catch { return false; } });
        } else if (mainCategory === 'Machines') {
          safe = safe.filter(ex => { try { return classifySubMachine(ex) === subFilter; } catch { return false; } });
        }
      }
      if (selectedMuscles.length > 0) {
        safe = safe.filter(ex => {
          try {
            const muscles = ((ex.muscleGroups || []) as string[]).concat(ex.bodyPart ? [ex.bodyPart] : []).map((m: string) => m.toLowerCase());
            return selectedMuscles.some(sm => muscles.some((m: string) => m.includes(sm.toLowerCase())));
          } catch { return true; }
        });
      }
      if (selectedDifficulty.length > 0) {
        safe = safe.filter(ex => {
          try {
            const diff = (ex.difficulty || ex.level || '').toLowerCase();
            return selectedDifficulty.some(d => diff.includes(d.toLowerCase()));
          } catch { return true; }
        });
      }
      return safe.slice(0, 100);
    } catch { return categoryFiltered.slice(0, 100); }
  }, [categoryFiltered, subFilter, mainCategory, selectedMuscles, selectedDifficulty]);

  const subFilters = mainCategory === 'Free Weights' ? FREE_WEIGHTS_SUBS
    : mainCategory === 'Machines' ? MACHINES_SUBS : null;

  const pbs = personalBests || [];

  const renderExerciseItem = useCallback(({ item, index }: { item: any; index: number }) => {
    if (!item) return <View style={{ flex: 1, margin: 5 }} />;
    return (
      <ExerciseCard
        exercise={item}
        onPress={() => setSelectedExercise(item)}
        personalBests={pbs}
      />
    );
  }, [pbs]);

  const keyExtractor = useCallback((item: any, index: number) => item?.id || String(index), []);

  const ListEmpty = useMemo(() => (
    <View style={{ alignItems: 'center', paddingTop: 60, gap: 8 }}>
      {viewMode === 'liked' && (
        <>
          <Text style={{ fontSize: 32 }}>💜</Text>
          <Text style={{ color: C.textMuted, fontSize: 14, textAlign: 'center' }}>No liked exercises yet!{'\n'}Browse and heart the ones you love.</Text>
        </>
      )}
      {viewMode === 'disliked' && (
        <>
          <Text style={{ fontSize: 32 }}>👍</Text>
          <Text style={{ color: C.textMuted, fontSize: 14, textAlign: 'center' }}>Nothing disliked yet!{'\n'}Explore exercises below.</Text>
        </>
      )}
      {viewMode === 'all' && (
        <Text style={{ color: C.textMuted, fontSize: 14 }}>No exercises match your search.</Text>
      )}
    </View>
  ), [viewMode]);

  const ListFooter = useMemo(() => (
    <TouchableOpacity
      onPress={() => { setViewMode('all'); setMainCategory('All'); setSubFilter('All'); setSearch(''); setSelectedMuscles([]); setSelectedDifficulty([]); }}
      style={{ marginTop: 8, borderRadius: 14, overflow: 'hidden' }}
    >
      <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 14, alignItems: 'center', borderRadius: 14 }}>
        <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>Browse All Exercises →</Text>
      </LinearGradient>
    </TouchableOpacity>
  ), []);

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={mSt.overlay}>
          <View style={mSt.container}>

            {/* Header */}
            <View style={mSt.header}>
              <Text style={mSt.title}>Explore Exercises</Text>
              <TouchableOpacity onPress={onClose} style={mSt.closeBtn}>
                <View style={mSt.closeBg}><Ionicons name="close" size={18} color={C.text} /></View>
              </TouchableOpacity>
            </View>

            {/* Gradient accent stripe */}
            <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={mSt.stripe} />

            {showFilterPanel ? (
              /* ── FILTER PANEL ── */
              <ScrollView contentContainerStyle={mSt.filterContent} showsVerticalScrollIndicator={false}>
                <Text style={mSt.filterHeading}>Filter by Muscle Group</Text>
                <View style={mSt.chipGrid}>
                  {MUSCLE_GROUPS.map(m => (
                    <TouchableOpacity key={m} onPress={() => toggleMuscle(m)} activeOpacity={0.8}>
                      {selectedMuscles.includes(m) ? (
                        <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={mSt.filterChipActive}>
                          <Text style={mSt.filterChipTextActive}>{m}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={mSt.filterChipOff}>
                          <Text style={mSt.filterChipTextOff}>{m}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={mSt.filterHeading}>Filter by Difficulty</Text>
                <View style={mSt.chipGrid}>
                  {DIFFICULTIES.map(d => (
                    <TouchableOpacity key={d} onPress={() => toggleDifficulty(d)} activeOpacity={0.8}>
                      {selectedDifficulty.includes(d) ? (
                        <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={mSt.filterChipActive}>
                          <Text style={mSt.filterChipTextActive}>{d}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={mSt.filterChipOff}>
                          <Text style={mSt.filterChipTextOff}>{d}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={mSt.filterHeading}>Equipment Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} contentContainerStyle={{ paddingVertical: 4, gap: 8, flexDirection: 'row' }}>
                  {MAIN_CATEGORIES.map(cat => (
                    <GradChip key={cat} label={cat} selected={mainCategory === cat} onPress={() => handleCategoryChange(cat)} />
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={{ borderRadius: 14, overflow: 'hidden', marginTop: 16 }}
                  onPress={() => setShowFilterPanel(false)}
                >
                  <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 16, alignItems: 'center', borderRadius: 14 }}>
                    <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>
                      Show Exercises {(selectedMuscles.length > 0 || selectedDifficulty.length > 0) ? '(filtered)' : '\u2192'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ marginTop: 12, alignItems: 'center', padding: 8 }}
                  onPress={() => { setSelectedMuscles([]); setSelectedDifficulty([]); setMainCategory('All'); setSubFilter('All'); setShowFilterPanel(false); }}
                >
                  <Text style={{ color: C.textSecondary, fontSize: 14, fontWeight: '500' }}>Browse All (no filter)</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View style={{ flex: 1 }}>
                <View style={mSt.searchRow}>
                  <Ionicons name="search" size={16} color={C.textMuted} style={{ marginRight: 8 }} />
                  <TextInput style={mSt.searchInput} placeholder="Search exercises..." placeholderTextColor={C.textMuted} value={search} onChangeText={setSearch} />
                  {search.length > 0 && (<TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color={C.textMuted} /></TouchableOpacity>)}
                  <TouchableOpacity onPress={() => setShowFilterPanel(true)} style={{ marginLeft: 8 }}><Ionicons name="options-outline" size={20} color={C.accent} /></TouchableOpacity>
                </View>
                {(selectedMuscles.length > 0 || selectedDifficulty.length > 0) && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingBottom: 8 }}>
                    {selectedMuscles.map(m => (<View key={m} style={{ backgroundColor: C.accent + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}><Text style={{ fontSize: 11, color: C.accent, fontWeight: '600' }}>{m}</Text></View>))}
                    {selectedDifficulty.map(d => (<View key={d} style={{ backgroundColor: C.accent + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}><Text style={{ fontSize: 11, color: C.accent, fontWeight: '600' }}>{d}</Text></View>))}
                    <TouchableOpacity onPress={() => { setSelectedMuscles([]); setSelectedDifficulty([]); }} style={{ paddingHorizontal: 10, paddingVertical: 4 }}><Text style={{ fontSize: 11, color: C.red, fontWeight: '600' }}>Clear x</Text></TouchableOpacity>
                  </View>
                )}
                <View style={mSt.toggleRow}>
                  {(['all', 'liked', 'disliked']).map(mode => {
                    const label = mode === 'all' ? 'All' : mode === 'liked' ? 'Liked' : 'Disliked';
                    const active = viewMode === mode;
                    return (
                      <TouchableOpacity key={mode} onPress={() => setViewMode(mode as ViewMode)} style={{ flex: 1, marginHorizontal: 3 }}>
                        {active ? <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={mSt.toggleActive}><Text style={mSt.toggleTextActive}>{label}</Text></LinearGradient>
                          : <View style={mSt.toggleOff}><Text style={mSt.toggleTextOff}>{label}</Text></View>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={mSt.chipsRow} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 6 }}>
                  {/* Category chips removed — rely on filter modal */}
                </ScrollView>
                {false && subFilters && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={mSt.subChipsRow} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4 }}>
                    {subFilters.map(sf => (<GradChip key={sf} label={sf} selected={subFilter === sf} onPress={() => setSubFilter(sf)} />))}
                  </ScrollView>
                )}
                {loading ? (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: C.textMuted, fontSize: 14 }}>Loading exercises...</Text>
                  </View>
                ) : (
                  <FlatList
                    data={displayExercises}
                    keyExtractor={keyExtractor}
                    numColumns={2}
                    renderItem={renderExerciseItem}
                    contentContainerStyle={{ padding: 10, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    style={{ flex: 1 }}
                    ListEmptyComponent={ListEmpty}
                    ListFooterComponent={ListFooter}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={10}
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
      <ExerciseDetail exercise={selectedExercise} onClose={() => setSelectedExercise(null)} personalBests={pbs} />
    </>
  );
};

const mSt = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  container: { backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '94%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: C.text },
  closeBtn: {},
  closeBg: { backgroundColor: '#F0F0F0', borderRadius: 20, padding: 8 },
  stripe: { height: 3, width: '100%' },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 10, backgroundColor: '#F5F5F5', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, color: C.text, padding: 0 },
  toggleRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8 },
  toggleActive: { paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  toggleOff: { paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: '#F0F0F0' },
  toggleTextActive: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  toggleTextOff: { color: C.textSecondary, fontSize: 13, fontWeight: '600' },
  chipsRow: { flexGrow: 0 },
  subChipsRow: { flexGrow: 0 },
  filterContent: { padding: 20, paddingBottom: 40 },
  filterHeading: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12, marginTop: 8 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  filterChipActive: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99 },
  filterChipOff: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: C.cardBorder },
  filterChipTextActive: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  filterChipTextOff: { color: C.text, fontSize: 13, fontWeight: '600' },
});

export default ExploreWorkoutsModal;
