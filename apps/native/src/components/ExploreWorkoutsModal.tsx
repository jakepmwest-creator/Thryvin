import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, FlatList,
  Image, Dimensions, ActivityIndicator, ScrollView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PreviewVideoPlayer, isValidVideoUrl } from './ExerciseVideoPlayer';
import { usePreferencesStore } from '../stores/preferences-store';
import { getApiBaseUrl } from '../services/env';

const API_BASE_URL = getApiBaseUrl();
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TILE_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2;

// Thryvin gradient
const G = { start: '#A22BF6', end: '#FF4EC7' };

const T = {
  bg: '#FFFFFF',
  surface: '#F8F7FC',
  card: '#FFFFFF',
  cardBorder: '#EDE8F5',
  text: '#1F1F1F',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  liked: '#10B981',
  disliked: '#EF4444',
  starred: '#F59E0B',
  white: '#FFFFFF',
  accentLight: '#EDE9FE',
};

const CATEGORIES = ['All', 'Weights', 'Calisthenics', 'Cardio', 'Flexibility'];
const DIFFICULTY_OPTIONS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

const CATEGORY_ICONS: Record<string, string> = {
  All: 'grid-outline',
  Weights: 'barbell-outline',
  Calisthenics: 'body-outline',
  Cardio: 'heart-outline',
  Flexibility: 'fitness-outline',
};

const equipmentKeywords = ['dumbbell', 'barbell', 'cable', 'machine', 'kettlebell', 'smith', 'ez bar', 'bench press', 'lat pull', 'pulldown', 'leg press', 'chest press', 'shoulder press', 'weight', 'weighted', 'press', 'curl', 'fly', 'row', 'pullover', 'extension', 'raise'];
const cardioKeywords = ['cardio', 'running', 'cycling', 'rowing', 'swimming', 'jump rope', 'treadmill', 'elliptical', 'stair', 'hiit', 'jumping jack', 'burpee', 'mountain climber'];
const flexKeywords = ['stretch', 'yoga', 'mobility', 'warmup', 'warm-up', 'recovery', 'foam roll', 'flexibility'];

function getThumbUrl(exercise: any): string | null {
  if (!exercise) return null;
  const thumb = exercise.thumbnailUrl;
  if (thumb && typeof thumb === 'string' && thumb.startsWith('http') && (thumb.endsWith('.jpg') || thumb.endsWith('.png') || thumb.endsWith('.webp'))) {
    return thumb;
  }
  const videoUrl = exercise.videoUrl;
  if (isValidVideoUrl(videoUrl) && videoUrl.includes('cloudinary')) {
    return videoUrl.replace('/upload/', '/upload/w_400,h_300,c_fill,so_1/').replace('.mp4', '.jpg');
  }
  return null;
}

// ─── Exercise Tile ───
const ExerciseTile = memo(({ exercise, onPress, onStarPress }: {
  exercise: any; onPress: () => void; onStarPress: (ex: any) => void;
}) => {
  const { getPreference, likeExercise, dislikeExercise, removePreference, isStarred } = usePreferencesStore();
  const preference = getPreference(exercise.id);
  const starred = isStarred(exercise.id);
  const thumbUrl = getThumbUrl(exercise);

  const handleLike = () => { if (preference === 'liked') removePreference(exercise.id); else likeExercise(exercise.id, exercise.name); };
  const handleDislike = () => { if (preference === 'disliked') removePreference(exercise.id); else dislikeExercise(exercise.id, exercise.name); };

  return (
    <TouchableOpacity style={tileStyles.tile} onPress={onPress} activeOpacity={0.8} data-testid={`exercise-tile-${exercise.id}`}>
      <View style={tileStyles.thumb}>
        {thumbUrl ? (
          <Image source={{ uri: thumbUrl }} style={tileStyles.image} resizeMode="cover" />
        ) : (
          <LinearGradient colors={[G.start, G.end]} style={tileStyles.placeholder}>
            <Ionicons name="barbell-outline" size={26} color="rgba(255,255,255,0.5)" />
          </LinearGradient>
        )}
        {exercise.difficulty && (
          <View style={[tileStyles.diffBadge,
            exercise.difficulty === 'Beginner' && { backgroundColor: '#DCFCE7' },
            exercise.difficulty === 'Advanced' && { backgroundColor: '#FEE2E2' },
          ]}>
            <Text style={[tileStyles.diffText,
              exercise.difficulty === 'Beginner' && { color: '#16A34A' },
              exercise.difficulty === 'Advanced' && { color: '#DC2626' },
            ]}>{exercise.difficulty}</Text>
          </View>
        )}
        {starred && <View style={tileStyles.starBadge}><Ionicons name="star" size={12} color={T.starred} /></View>}
      </View>
      <View style={tileStyles.info}>
        <Text style={tileStyles.name} numberOfLines={2}>{exercise.name}</Text>
        <Text style={tileStyles.meta} numberOfLines={1}>{exercise.muscleGroups?.join(', ') || exercise.bodyPart || 'Full Body'}</Text>
      </View>
      <View style={tileStyles.actions}>
        <TouchableOpacity onPress={handleLike} style={tileStyles.actionBtn}>
          <Ionicons name={preference === 'liked' ? 'heart' : 'heart-outline'} size={17} color={preference === 'liked' ? T.liked : T.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDislike} style={tileStyles.actionBtn}>
          <Ionicons name={preference === 'disliked' ? 'thumbs-down' : 'thumbs-down-outline'} size={17} color={preference === 'disliked' ? T.disliked : T.textMuted} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => onStarPress(exercise)} style={tileStyles.actionBtn}>
          <Ionicons name={starred ? 'star' : 'star-outline'} size={18} color={starred ? T.starred : T.textMuted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

const tileStyles = StyleSheet.create({
  tile: { width: TILE_WIDTH, backgroundColor: T.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: T.cardBorder, shadowColor: 'rgba(162,43,246,0.1)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 3 },
  thumb: { width: '100%', height: TILE_WIDTH * 0.75, backgroundColor: T.surface },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  diffBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: T.accentLight, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  diffText: { fontSize: 10, fontWeight: '700', color: G.start },
  starBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: '#FEF3C7', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  info: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 4 },
  name: { fontSize: 13, fontWeight: '700', color: T.text, lineHeight: 17 },
  meta: { fontSize: 11, color: T.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', paddingHorizontal: 8, paddingBottom: 8, paddingTop: 4, gap: 4, alignItems: 'center' },
  actionBtn: { padding: 4 },
});

// ─── Exercise Detail ───
const ExerciseDetail = ({ exercise, onClose }: { exercise: any; onClose: () => void }) => {
  const hasVideo = isValidVideoUrl(exercise?.videoUrl);
  const { getPreference, likeExercise, removePreference, isStarred, starExercise, unstarExercise } = usePreferencesStore();
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const preference = exercise ? getPreference(exercise.id) : null;
  const starred = exercise ? isStarred(exercise.id) : false;

  useEffect(() => {
    if (!exercise?.id) { setStats(null); return; }
    let cancelled = false;
    (async () => {
      setStatsLoading(true);
      try { const res = await fetch(`${API_BASE_URL}/api/stats/exercise/${exercise.id}`); if (res.ok && !cancelled) setStats(await res.json()); }
      catch { /* skip */ }
      finally { if (!cancelled) setStatsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [exercise?.id]);

  if (!exercise) return null;
  const handleLikeToggle = () => { if (preference === 'liked') removePreference(exercise.id); else likeExercise(exercise.id, exercise.name); };
  const handleStarToggle = async () => { if (starred) unstarExercise(exercise.id); else await starExercise(exercise.id, exercise.name, exercise.videoUrl); };
  const hasHistory = stats?.history?.length > 0;
  const latestSession = hasHistory ? stats.history[0] : null;

  return (
    <Modal visible={!!exercise} transparent animationType="slide" onRequestClose={onClose}>
      <View style={dStyles.overlay}>
        <View style={dStyles.sheet}>
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <TouchableOpacity onPress={onClose} style={dStyles.closeBtn}><View style={dStyles.closeBg}><Ionicons name="close" size={20} color={T.text} /></View></TouchableOpacity>
            {hasVideo ? <View style={dStyles.video}><PreviewVideoPlayer videoUrl={exercise.videoUrl} exerciseName={exercise.name} /></View>
              : <LinearGradient colors={[G.start, G.end]} style={dStyles.headerGradient}><Ionicons name="barbell" size={36} color={T.white} /></LinearGradient>}
            <View style={dStyles.body}>
              <Text style={dStyles.name}>{exercise.name}</Text>
              <View style={dStyles.actionRow}>
                <TouchableOpacity onPress={handleLikeToggle} style={[dStyles.pill, preference === 'liked' && { backgroundColor: '#DCFCE7', borderColor: T.liked }]}>
                  <Ionicons name={preference === 'liked' ? 'heart' : 'heart-outline'} size={18} color={preference === 'liked' ? T.liked : T.textMuted} />
                  <Text style={[dStyles.pillText, preference === 'liked' && { color: T.liked }]}>{preference === 'liked' ? 'Liked' : 'Like'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleStarToggle} style={[dStyles.pill, starred && { backgroundColor: '#FEF3C7', borderColor: T.starred }]}>
                  <Ionicons name={starred ? 'star' : 'star-outline'} size={18} color={starred ? T.starred : T.textMuted} />
                  <Text style={[dStyles.pillText, starred && { color: '#B45309' }]}>{starred ? 'Starred' : 'Star'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={dStyles.aiNote}>Liked exercises influence your AI-generated workouts</Text>
              <View style={dStyles.tags}>
                {exercise.difficulty && <View style={dStyles.tag}><Ionicons name="speedometer-outline" size={13} color={G.start} /><Text style={dStyles.tagText}>{exercise.difficulty}</Text></View>}
                <View style={dStyles.tag}><Ionicons name="body-outline" size={13} color={G.start} /><Text style={dStyles.tagText}>{exercise.muscleGroups?.join(', ') || exercise.bodyPart || 'Full Body'}</Text></View>
                {exercise.equipment && <View style={dStyles.tag}><Ionicons name="fitness-outline" size={13} color={G.start} /><Text style={dStyles.tagText}>{Array.isArray(exercise.equipment) ? exercise.equipment.join(', ') : exercise.equipment}</Text></View>}
              </View>
              <Text style={dStyles.desc}>{exercise.description || 'Perform this exercise with proper form and controlled movements.'}</Text>
              {exercise.tips?.length > 0 && (
                <View style={{ marginTop: 4 }}>
                  <Text style={dStyles.sectionTitle}>Form Tips</Text>
                  {exercise.tips.map((tip: string, i: number) => (
                    <View key={i} style={dStyles.tipRow}>
                      <LinearGradient colors={[G.start, G.end]} style={dStyles.tipNum}><Text style={dStyles.tipNumText}>{i + 1}</Text></LinearGradient>
                      <Text style={dStyles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={dStyles.statsSection}>
                <Text style={dStyles.sectionTitle}>Your Stats</Text>
                {statsLoading ? <ActivityIndicator size="small" color={G.start} style={{ marginTop: 12 }} /> : hasHistory ? (
                  <View style={dStyles.statsGrid}>
                    <View style={dStyles.statBox}><Ionicons name="trophy" size={18} color={T.starred} /><Text style={dStyles.statValue}>{stats.personalBest?.weight || latestSession?.maxWeight || '--'} kg</Text><Text style={dStyles.statLabel}>Personal Best</Text></View>
                    <View style={dStyles.statBox}><Ionicons name="analytics" size={18} color={G.start} /><Text style={dStyles.statValue}>{Math.round(stats.personalBest?.estimatedOneRM || 0)} kg</Text><Text style={dStyles.statLabel}>Est. 1RM</Text></View>
                    <View style={dStyles.statBox}><Ionicons name="calendar" size={18} color={G.end} /><Text style={dStyles.statValue}>{stats.history.length}</Text><Text style={dStyles.statLabel}>Sessions</Text></View>
                    <View style={dStyles.statBox}><Ionicons name="barbell" size={18} color={T.liked} /><Text style={dStyles.statValue}>{latestSession?.totalSets || '--'}</Text><Text style={dStyles.statLabel}>Last Sets</Text></View>
                  </View>
                ) : (
                  <View style={dStyles.noStats}><Ionicons name="fitness-outline" size={28} color={T.textMuted} /><Text style={dStyles.noStatsText}>Not yet completed</Text><Text style={dStyles.noStatsSub}>Stats appear here once you log this exercise</Text></View>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const dStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: T.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', flex: 1, marginTop: 50 },
  closeBtn: { position: 'absolute', top: 14, right: 14, zIndex: 10 },
  closeBg: { padding: 6, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16 },
  video: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', backgroundColor: '#000' },
  headerGradient: { height: 120, justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  body: { padding: 20, paddingBottom: 40 },
  name: { fontSize: 22, fontWeight: '700', color: T.text, textAlign: 'center' },
  actionRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 14 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: T.cardBorder, backgroundColor: T.surface },
  pillText: { fontSize: 14, fontWeight: '600', color: T.textSecondary },
  aiNote: { fontSize: 11, color: T.textMuted, textAlign: 'center', marginTop: 6, marginBottom: 14, fontStyle: 'italic' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 16 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: T.accentLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  tagText: { fontSize: 12, color: G.start, fontWeight: '500' },
  desc: { fontSize: 14, color: T.textSecondary, lineHeight: 21, textAlign: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: T.text, marginBottom: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  tipNum: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  tipNumText: { fontSize: 11, fontWeight: '700', color: T.white },
  tipText: { flex: 1, fontSize: 14, color: T.textSecondary, lineHeight: 20 },
  statsSection: { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: T.cardBorder },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox: { width: '47%', backgroundColor: T.surface, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: T.cardBorder },
  statValue: { fontSize: 20, fontWeight: '800', color: T.text },
  statLabel: { fontSize: 11, color: T.textSecondary, fontWeight: '500' },
  noStats: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  noStatsText: { fontSize: 14, fontWeight: '600', color: T.textSecondary },
  noStatsSub: { fontSize: 12, color: T.textMuted },
});

// ─── Equipment filter options ───
const ALL_EQUIPMENT = [
  { id: 'all', label: 'All' }, { id: 'dumbbell', label: 'Dumbbell' }, { id: 'barbell', label: 'Barbell' },
  { id: 'cable', label: 'Cable' }, { id: 'machine', label: 'Machine' }, { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'bodyweight', label: 'Bodyweight' }, { id: 'band', label: 'Bands' }, { id: 'bench', label: 'Bench' },
];

// ─── Filter Sheet ───
const FilterSheet = ({ visible, onClose, difficulty, setDifficulty, equipment, setEquipment }: any) => {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={fStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={fStyles.sheet}>
          <View style={fStyles.handle} />
          <Text style={fStyles.title}>Filter Exercises</Text>
          <Text style={fStyles.label}>Difficulty</Text>
          <View style={fStyles.row}>
            {DIFFICULTY_OPTIONS.map(d => (
              <TouchableOpacity key={d} style={[fStyles.chip, difficulty === d && fStyles.chipActive]} onPress={() => setDifficulty(d)}>
                <Text style={[fStyles.chipText, difficulty === d && fStyles.chipTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={fStyles.label}>Equipment</Text>
          <View style={fStyles.row}>
            {ALL_EQUIPMENT.map(eq => (
              <TouchableOpacity key={eq.id} style={[fStyles.chip, equipment === eq.id && fStyles.chipActive]} onPress={() => setEquipment(eq.id)}>
                <Text style={[fStyles.chipText, equipment === eq.id && fStyles.chipTextActive]}>{eq.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={fStyles.applyBtn} onPress={onClose}>
            <LinearGradient colors={[G.start, G.end]} style={fStyles.applyGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={fStyles.applyText}>Apply Filters</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const fStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: T.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: T.cardBorder, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', color: T.text, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: T.textSecondary, marginBottom: 8, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: T.surface, borderWidth: 1, borderColor: T.cardBorder },
  chipActive: { backgroundColor: G.start, borderColor: G.start },
  chipText: { fontSize: 13, fontWeight: '500', color: T.textSecondary },
  chipTextActive: { fontSize: 13, fontWeight: '600', color: T.white },
  applyBtn: { marginTop: 24, borderRadius: 14, overflow: 'hidden' },
  applyGrad: { paddingVertical: 14, alignItems: 'center', borderRadius: 14 },
  applyText: { fontSize: 16, fontWeight: '700', color: T.white },
});

// ─── Main Modal ───
interface ExploreWorkoutsModalProps {
  visible: boolean;
  onClose: () => void;
  initialCategory?: string;
  category?: string;
}

export const ExploreWorkoutsModal = ({ visible, onClose, initialCategory, category: legacyCategory }: ExploreWorkoutsModalProps) => {
  const startCat = initialCategory || legacyCategory || 'All';
  const [activeCategory, setActiveCategory] = useState(startCat);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [filterEquipment, setFilterEquipment] = useState('all');
  const [viewFilter, setViewFilter] = useState('All');
  const [showFilter, setShowFilter] = useState(false);
  const [exercises, setExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingStar, setPendingStar] = useState<any>(null);
  const { starExercise, unstarExercise, isStarred, getStarredExercises, replaceStarred, getLikedExercises, getDislikedExercises } = usePreferencesStore();

  const handleStarPress = useCallback(async (exercise: any) => {
    if (isStarred(exercise.id)) { unstarExercise(exercise.id); return; }
    const added = await starExercise(exercise.id, exercise.name, exercise.videoUrl);
    if (!added) setPendingStar(exercise);
  }, [isStarred, starExercise, unstarExercise]);

  const handleReplace = useCallback(async (oldId: string) => {
    if (pendingStar) { await replaceStarred(oldId, pendingStar.id, pendingStar.name, pendingStar.videoUrl); setPendingStar(null); }
  }, [pendingStar, replaceStarred]);

  useEffect(() => { if (visible) setActiveCategory(startCat); }, [visible, startCat]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      try { setIsLoading(true); const res = await fetch(`${API_BASE_URL}/api/exercises?limit=2000`); const data = await res.json(); if (!cancelled) setExercises(data.exercises || []); }
      catch (e) { console.error('Failed to fetch exercises:', e); }
      finally { if (!cancelled) setIsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [visible]);

  useEffect(() => { if (!visible) { setSearchQuery(''); setFilterDifficulty('All'); setFilterEquipment('all'); setViewFilter('All'); setSelectedExercise(null); } }, [visible]);

  const filteredExercises = useMemo(() => {
    if (isLoading) return [];
    let filtered = exercises;
    if (activeCategory !== 'All') {
      filtered = filtered.filter(ex => {
        const exName = (ex.name || '').toLowerCase();
        const eqArr = Array.isArray(ex.equipment) ? ex.equipment : [];
        const eqStr = eqArr.map((e: any) => String(e).toLowerCase()).join(' ');
        const nameHasEq = equipmentKeywords.some(kw => exName.includes(kw));
        const fieldHasEq = eqArr.length > 0 && !eqStr.includes('bodyweight');
        const exCat = (ex.category || '').toLowerCase();
        const isCardio = cardioKeywords.some(kw => exCat.includes(kw) || exName.includes(kw));
        const isFlex = flexKeywords.some(kw => exCat.includes(kw) || exName.includes(kw));
        if (activeCategory === 'Weights') return (nameHasEq || fieldHasEq) && !isCardio && !isFlex;
        if (activeCategory === 'Calisthenics') return !nameHasEq && !fieldHasEq && !isCardio && !isFlex;
        if (activeCategory === 'Cardio') return isCardio;
        if (activeCategory === 'Flexibility') return isFlex;
        return true;
      });
    }
    if (viewFilter === 'Starred') { const ids = getStarredExercises().map(s => s.exerciseId); filtered = filtered.filter(ex => ids.includes(ex.id?.toString())); }
    else if (viewFilter === 'Liked') { const ids = getLikedExercises().map(l => l.exerciseId); filtered = filtered.filter(ex => ids.includes(ex.id?.toString())); }
    else if (viewFilter === 'Disliked') { const ids = getDislikedExercises().map(d => d.exerciseId); filtered = filtered.filter(ex => ids.includes(ex.id?.toString())); }
    if (searchQuery) { const q = searchQuery.toLowerCase(); filtered = filtered.filter(ex => ex.name?.toLowerCase().includes(q) || ex.muscleGroups?.some((mg: string) => mg.toLowerCase().includes(q)) || ex.bodyPart?.toLowerCase().includes(q)); }
    if (filterDifficulty !== 'All') filtered = filtered.filter(ex => ex.difficulty?.toLowerCase() === filterDifficulty.toLowerCase());
    if (filterEquipment !== 'all') filtered = filtered.filter(ex => { const eqArr = Array.isArray(ex.equipment) ? ex.equipment : []; const exName = (ex.name || '').toLowerCase(); return eqArr.some((eq: string) => eq?.toLowerCase().includes(filterEquipment)) || exName.includes(filterEquipment); });
    return filtered;
  }, [exercises, searchQuery, filterDifficulty, filterEquipment, activeCategory, viewFilter, isLoading]);

  const activeFilterCount = (filterDifficulty !== 'All' ? 1 : 0) + (filterEquipment !== 'all' ? 1 : 0);
  const renderTile = useCallback(({ item }: { item: any }) => <ExerciseTile exercise={item} onPress={() => setSelectedExercise(item)} onStarPress={handleStarPress} />, [handleStarPress]);
  const keyExtractor = useCallback((item: any) => item.id?.toString(), []);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn} data-testid="explore-close-btn">
              <Ionicons name="chevron-back" size={22} color={T.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Explore Exercises</Text>
            <TouchableOpacity onPress={() => setShowFilter(true)} style={styles.filterIconBtn} data-testid="explore-filter-btn">
              <Ionicons name="options-outline" size={22} color={G.start} />
              {activeFilterCount > 0 && <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{activeFilterCount}</Text></View>}
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={T.textMuted} />
              <TextInput style={styles.searchInput} placeholder="Search exercises..." placeholderTextColor={T.textMuted} value={searchQuery} onChangeText={setSearchQuery} />
              {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={18} color={T.textMuted} /></TouchableOpacity>}
            </View>
          </View>

          {/* Hub: Quick filter buttons (Starred, Liked, Disliked) */}
          <View style={styles.hubRow}>
            {[
              { key: 'All', icon: 'grid-outline' as const, label: 'All', color: G.start },
              { key: 'Starred', icon: 'star' as const, label: 'Starred', color: T.starred },
              { key: 'Liked', icon: 'heart' as const, label: 'Liked', color: T.liked },
              { key: 'Disliked', icon: 'thumbs-down' as const, label: 'Disliked', color: T.disliked },
            ].map(btn => (
              <TouchableOpacity
                key={btn.key}
                style={[styles.hubBtn, viewFilter === btn.key && { borderColor: btn.color, backgroundColor: btn.color + '15' }]}
                onPress={() => setViewFilter(btn.key)}
              >
                <Ionicons name={btn.icon} size={16} color={viewFilter === btn.key ? btn.color : T.textMuted} />
                <Text style={[styles.hubBtnText, viewFilter === btn.key && { color: btn.color, fontWeight: '700' }]}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Category Tabs — purple-to-pink gradient for active */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs} contentContainerStyle={styles.categoryTabsContent}>
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat;
              return isActive ? (
                <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat)} data-testid={`cat-tab-${cat.toLowerCase()}`}>
                  <LinearGradient colors={[G.start, G.end]} style={styles.categoryTabGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name={CATEGORY_ICONS[cat] as any} size={16} color={T.white} />
                    <Text style={styles.categoryTabTextActive}>{cat}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity key={cat} style={styles.categoryTab} onPress={() => setActiveCategory(cat)} data-testid={`cat-tab-${cat.toLowerCase()}`}>
                  <Ionicons name={CATEGORY_ICONS[cat] as any} size={16} color={T.textSecondary} />
                  <Text style={styles.categoryTabText}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Results count */}
          <View style={styles.resultsRow}>
            <Text style={styles.resultsText}>{isLoading ? 'Loading...' : `${filteredExercises.length} exercises`}</Text>
          </View>

          {/* Tile Grid */}
          {isLoading ? (
            <View style={styles.loadingContainer}><ActivityIndicator size="large" color={G.start} /><Text style={styles.loadingText}>Loading exercises...</Text></View>
          ) : filteredExercises.length === 0 ? (
            <View style={styles.emptyContainer}><Ionicons name="search-outline" size={48} color={T.textMuted} /><Text style={styles.emptyText}>No exercises found</Text><Text style={styles.emptySubtext}>Try adjusting your search or filters</Text></View>
          ) : (
            <FlatList data={filteredExercises} renderItem={renderTile} keyExtractor={keyExtractor} numColumns={2} columnWrapperStyle={styles.gridRow} contentContainerStyle={styles.gridContent} showsVerticalScrollIndicator={false} initialNumToRender={10} maxToRenderPerBatch={10} windowSize={5} removeClippedSubviews />
          )}

          <FilterSheet visible={showFilter} onClose={() => setShowFilter(false)} difficulty={filterDifficulty} setDifficulty={setFilterDifficulty} equipment={filterEquipment} setEquipment={setFilterEquipment} />
          <ExerciseDetail exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />

          {/* Replace Star Modal */}
          {pendingStar && (
            <Modal visible={!!pendingStar} transparent animationType="fade" onRequestClose={() => setPendingStar(null)}>
              <View style={styles.replaceOverlay}>
                <View style={styles.replaceSheet}>
                  <Text style={styles.replaceTitle}>Replace a Favourite</Text>
                  <Text style={styles.replaceSub}>You already have 3 starred exercises. Replace one with <Text style={{ fontWeight: '700', color: G.start }}>{pendingStar.name}</Text>?</Text>
                  {getStarredExercises().map(s => (
                    <TouchableOpacity key={s.exerciseId} style={styles.replaceItem} onPress={() => handleReplace(s.exerciseId)}>
                      <Ionicons name="star" size={18} color={T.starred} /><Text style={styles.replaceItemText}>{s.exerciseName}</Text><Ionicons name="swap-horizontal" size={18} color={T.textMuted} />
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={styles.replaceCancelBtn} onPress={() => setPendingStar(null)}><Text style={styles.replaceCancelText}>Cancel</Text></TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  container: { flex: 1, backgroundColor: T.bg, marginTop: 40, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 12 : 16, paddingBottom: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: T.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: T.cardBorder },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: T.text, textAlign: 'center', marginHorizontal: 8 },
  filterIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: T.accentLight, justifyContent: 'center', alignItems: 'center' },
  filterBadge: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: G.start, justifyContent: 'center', alignItems: 'center' },
  filterBadgeText: { fontSize: 10, fontWeight: '700', color: T.white },
  searchRow: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.surface, borderRadius: 12, paddingHorizontal: 12, gap: 8, borderWidth: 1, borderColor: T.cardBorder },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: T.text },

  // Hub quick filter buttons
  hubRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  hubBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 12, backgroundColor: T.surface, borderWidth: 1.5, borderColor: T.cardBorder },
  hubBtnText: { fontSize: 12, fontWeight: '600', color: T.textMuted },

  // Category tabs
  categoryTabs: { maxHeight: 46 },
  categoryTabsContent: { paddingHorizontal: 16, gap: 8 },
  categoryTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, backgroundColor: T.surface, borderWidth: 1, borderColor: T.cardBorder },
  categoryTabGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22 },
  categoryTabText: { fontSize: 14, fontWeight: '600', color: T.textSecondary },
  categoryTabTextActive: { fontSize: 14, fontWeight: '700', color: T.white },

  resultsRow: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  resultsText: { fontSize: 13, color: T.textMuted, fontWeight: '500' },
  gridContent: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 },
  gridRow: { justifyContent: 'space-between', marginBottom: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: T.textMuted },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: T.text },
  emptySubtext: { fontSize: 13, color: T.textMuted },
  replaceOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  replaceSheet: { backgroundColor: T.bg, borderRadius: 20, padding: 20 },
  replaceTitle: { fontSize: 18, fontWeight: '700', color: T.text, marginBottom: 6 },
  replaceSub: { fontSize: 13, color: T.textSecondary, lineHeight: 19, marginBottom: 16 },
  replaceItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: T.surface, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: T.cardBorder },
  replaceItemText: { flex: 1, fontSize: 14, fontWeight: '600', color: T.text },
  replaceCancelBtn: { marginTop: 8, alignItems: 'center', paddingVertical: 12 },
  replaceCancelText: { fontSize: 14, fontWeight: '600', color: T.textMuted },
});

export default ExploreWorkoutsModal;
