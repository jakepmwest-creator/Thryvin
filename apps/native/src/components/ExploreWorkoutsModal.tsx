import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
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

// ─── Light Thriving Theme ───
const T = {
  bg: '#FFFFFF',
  surface: '#F8F7FC',
  card: '#FFFFFF',
  cardBorder: '#EDE8F5',
  accent: '#7C3AED',
  accentLight: '#EDE9FE',
  accentSoft: 'rgba(124, 58, 237, 0.08)',
  accentSecondary: '#A855F7',
  text: '#1F1F1F',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  liked: '#10B981',
  disliked: '#EF4444',
  starred: '#F59E0B',
  white: '#FFFFFF',
  shadow: 'rgba(124, 58, 237, 0.08)',
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

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  All: ['#7C3AED', '#A855F7'],
  Weights: ['#6366F1', '#818CF8'],
  Calisthenics: ['#F59E0B', '#FBBF24'],
  Cardio: ['#EF4444', '#F87171'],
  Flexibility: ['#10B981', '#34D399'],
};

// ─── Exercise Tile ───
const ExerciseTile = memo(({ exercise, onPress, onStarPress }: {
  exercise: any; onPress: () => void; onStarPress: (ex: any) => void;
}) => {
  const { getPreference, likeExercise, dislikeExercise, removePreference, isStarred } = usePreferencesStore();
  const preference = getPreference(exercise.id);
  const starred = isStarred(exercise.id);
  const hasVideo = isValidVideoUrl(exercise?.videoUrl);
  const thumbUrl = exercise.thumbnailUrl || (hasVideo ? `${exercise.videoUrl?.replace('/upload/', '/upload/w_400,h_300,c_fill,so_1/')?.replace('.mp4', '.jpg')}` : null);

  const handleLike = () => {
    if (preference === 'liked') removePreference(exercise.id);
    else likeExercise(exercise.id, exercise.name);
  };
  const handleDislike = () => {
    if (preference === 'disliked') removePreference(exercise.id);
    else dislikeExercise(exercise.id, exercise.name);
  };

  return (
    <TouchableOpacity
      style={tileStyles.tile}
      onPress={onPress}
      activeOpacity={0.8}
      data-testid={`exercise-tile-${exercise.id}`}
    >
      <View style={tileStyles.thumb}>
        {hasVideo && thumbUrl ? (
          <Image source={{ uri: thumbUrl }} style={tileStyles.image} resizeMode="cover" />
        ) : (
          <View style={tileStyles.placeholder}>
            <Ionicons name="barbell-outline" size={26} color={T.textMuted} />
          </View>
        )}
        {exercise.difficulty && (
          <View style={[
            tileStyles.diffBadge,
            exercise.difficulty === 'Beginner' && { backgroundColor: '#DCFCE7' },
            exercise.difficulty === 'Advanced' && { backgroundColor: '#FEE2E2' },
          ]}>
            <Text style={[
              tileStyles.diffText,
              exercise.difficulty === 'Beginner' && { color: '#16A34A' },
              exercise.difficulty === 'Advanced' && { color: '#DC2626' },
            ]}>{exercise.difficulty}</Text>
          </View>
        )}
        {starred && (
          <View style={tileStyles.starBadge}>
            <Ionicons name="star" size={12} color={T.starred} />
          </View>
        )}
      </View>

      <View style={tileStyles.info}>
        <Text style={tileStyles.name} numberOfLines={2}>{exercise.name}</Text>
        <Text style={tileStyles.meta} numberOfLines={1}>
          {exercise.muscleGroups?.join(', ') || exercise.bodyPart || 'Full Body'}
        </Text>
      </View>

      <View style={tileStyles.actions}>
        <TouchableOpacity onPress={handleLike} style={tileStyles.actionBtn} data-testid={`like-btn-${exercise.id}`}>
          <Ionicons
            name={preference === 'liked' ? 'heart' : 'heart-outline'}
            size={17}
            color={preference === 'liked' ? T.liked : T.textMuted}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDislike} style={tileStyles.actionBtn} data-testid={`dislike-btn-${exercise.id}`}>
          <Ionicons
            name={preference === 'disliked' ? 'thumbs-down' : 'thumbs-down-outline'}
            size={17}
            color={preference === 'disliked' ? T.disliked : T.textMuted}
          />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => onStarPress(exercise)} style={tileStyles.actionBtn} data-testid={`star-btn-${exercise.id}`}>
          <Ionicons
            name={starred ? 'star' : 'star-outline'}
            size={18}
            color={starred ? T.starred : T.textMuted}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

const tileStyles = StyleSheet.create({
  tile: { width: TILE_WIDTH, backgroundColor: T.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: T.cardBorder, shadowColor: T.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 3 },
  thumb: { width: '100%', height: TILE_WIDTH * 0.7, backgroundColor: T.surface },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.surface },
  diffBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: T.accentLight, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  diffText: { fontSize: 10, fontWeight: '700', color: T.accent },
  starBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: '#FEF3C7', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  info: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 4 },
  name: { fontSize: 13, fontWeight: '700', color: T.text, lineHeight: 17 },
  meta: { fontSize: 11, color: T.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', paddingHorizontal: 8, paddingBottom: 8, paddingTop: 4, gap: 4, alignItems: 'center' },
  actionBtn: { padding: 4 },
});

// ─── Filter Sheet ───
const FilterSheet = ({ visible, onClose, difficulty, setDifficulty, equipment, setEquipment, equipmentOptions, viewFilter, setViewFilter }: any) => {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={filterStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={filterStyles.sheet}>
          <View style={filterStyles.handle} />
          <Text style={filterStyles.title}>Filter Exercises</Text>

          <Text style={filterStyles.label}>View</Text>
          <View style={filterStyles.row}>
            {['All', 'Starred', 'Liked', 'Disliked', 'Completed', 'New'].map(v => (
              <TouchableOpacity
                key={v}
                style={[filterStyles.chip, viewFilter === v && filterStyles.chipActive]}
                onPress={() => setViewFilter(v)}
              >
                <Text style={[filterStyles.chipText, viewFilter === v && filterStyles.chipTextActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={filterStyles.label}>Difficulty</Text>
          <View style={filterStyles.row}>
            {DIFFICULTY_OPTIONS.map(d => (
              <TouchableOpacity
                key={d}
                style={[filterStyles.chip, difficulty === d && filterStyles.chipActive]}
                onPress={() => setDifficulty(d)}
              >
                <Text style={[filterStyles.chipText, difficulty === d && filterStyles.chipTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={filterStyles.label}>Equipment</Text>
          <View style={filterStyles.row}>
            {equipmentOptions.map((eq: any) => (
              <TouchableOpacity
                key={eq.id}
                style={[filterStyles.chip, equipment === eq.id && filterStyles.chipActive]}
                onPress={() => setEquipment(eq.id)}
              >
                <Text style={[filterStyles.chipText, equipment === eq.id && filterStyles.chipTextActive]}>{eq.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={filterStyles.applyBtn} onPress={onClose}>
            <LinearGradient colors={[T.accent, T.accentSecondary]} style={filterStyles.applyGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={filterStyles.applyText}>Apply Filters</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const filterStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: T.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: T.cardBorder, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', color: T.text, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: T.textSecondary, marginBottom: 8, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: T.surface, borderWidth: 1, borderColor: T.cardBorder },
  chipActive: { backgroundColor: T.accent, borderColor: T.accent },
  chipText: { fontSize: 13, fontWeight: '500', color: T.textSecondary },
  chipTextActive: { fontSize: 13, fontWeight: '600', color: T.white },
  applyBtn: { marginTop: 24, borderRadius: 14, overflow: 'hidden' },
  applyGradient: { paddingVertical: 14, alignItems: 'center', borderRadius: 14 },
  applyText: { fontSize: 16, fontWeight: '700', color: T.white },
});

// ─── Exercise Detail ───
const ExerciseDetail = ({ exercise, onClose }: { exercise: any; onClose: () => void }) => {
  const hasVideo = isValidVideoUrl(exercise?.videoUrl);
  const { getPreference, likeExercise, removePreference, isStarred, starExercise, unstarExercise } = usePreferencesStore();
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const preference = exercise ? getPreference(exercise.id) : null;
  const starred = exercise ? isStarred(exercise.id) : false;
  const category = exercise?.category || 'All';
  const gradient = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.All;

  useEffect(() => {
    if (!exercise?.id) { setStats(null); return; }
    let cancelled = false;
    (async () => {
      setStatsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/stats/exercise/${exercise.id}`);
        if (res.ok) { const data = await res.json(); if (!cancelled) setStats(data); }
      } catch { /* stats not available */ }
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

  const hasHistory = stats?.history && stats.history.length > 0;
  const latestSession = hasHistory ? stats.history[0] : null;

  return (
    <Modal visible={!!exercise} transparent animationType="slide" onRequestClose={onClose}>
      <View style={detailStyles.overlay}>
        <View style={detailStyles.sheet}>
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <TouchableOpacity onPress={onClose} style={detailStyles.closeBtn}>
              <View style={detailStyles.closeBg}>
                <Ionicons name="close" size={20} color={T.text} />
              </View>
            </TouchableOpacity>

            {hasVideo ? (
              <View style={detailStyles.video}>
                <PreviewVideoPlayer videoUrl={exercise.videoUrl} exerciseName={exercise.name} />
              </View>
            ) : (
              <LinearGradient colors={gradient} style={detailStyles.headerGradient}>
                <Ionicons name="barbell" size={36} color={T.white} />
              </LinearGradient>
            )}

            <View style={detailStyles.body}>
              <Text style={detailStyles.name}>{exercise.name}</Text>

              {/* Action buttons */}
              <View style={detailStyles.actionRow}>
                <TouchableOpacity onPress={handleLikeToggle} style={[detailStyles.actionPill, preference === 'liked' && { backgroundColor: '#DCFCE7', borderColor: T.liked }]}>
                  <Ionicons name={preference === 'liked' ? 'heart' : 'heart-outline'} size={18} color={preference === 'liked' ? T.liked : T.textMuted} />
                  <Text style={[detailStyles.actionPillText, preference === 'liked' && { color: T.liked }]}>{preference === 'liked' ? 'Liked' : 'Like'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleStarToggle} style={[detailStyles.actionPill, starred && { backgroundColor: '#FEF3C7', borderColor: T.starred }]}>
                  <Ionicons name={starred ? 'star' : 'star-outline'} size={18} color={starred ? T.starred : T.textMuted} />
                  <Text style={[detailStyles.actionPillText, starred && { color: '#B45309' }]}>{starred ? 'Starred' : 'Star'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={detailStyles.aiNote}>Liked exercises influence your AI-generated workouts</Text>

              {/* Tags */}
              <View style={detailStyles.tags}>
                {exercise.difficulty && (
                  <View style={detailStyles.tag}>
                    <Ionicons name="speedometer-outline" size={14} color={T.accent} />
                    <Text style={detailStyles.tagText}>{exercise.difficulty}</Text>
                  </View>
                )}
                <View style={detailStyles.tag}>
                  <Ionicons name="body-outline" size={14} color={T.accent} />
                  <Text style={detailStyles.tagText}>{exercise.muscleGroups?.join(', ') || exercise.bodyPart || 'Full Body'}</Text>
                </View>
                {exercise.equipment && (
                  <View style={detailStyles.tag}>
                    <Ionicons name="fitness-outline" size={14} color={T.accent} />
                    <Text style={detailStyles.tagText}>{Array.isArray(exercise.equipment) ? exercise.equipment.join(', ') : exercise.equipment}</Text>
                  </View>
                )}
              </View>

              <Text style={detailStyles.desc}>
                {exercise.description || 'Perform this exercise with proper form and controlled movements.'}
              </Text>

              {exercise.tips && exercise.tips.length > 0 && (
                <View style={detailStyles.tips}>
                  <Text style={detailStyles.tipsHeader}>Form Tips</Text>
                  {exercise.tips.map((tip: string, i: number) => (
                    <View key={i} style={detailStyles.tipRow}>
                      <View style={detailStyles.tipNum}><Text style={detailStyles.tipNumText}>{i + 1}</Text></View>
                      <Text style={detailStyles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Stats */}
              <View style={detailStyles.statsSection}>
                <Text style={detailStyles.statsHeader}>Your Stats</Text>
                {statsLoading ? (
                  <ActivityIndicator size="small" color={T.accent} style={{ marginTop: 12 }} />
                ) : hasHistory ? (
                  <View style={detailStyles.statsGrid}>
                    <View style={detailStyles.statBox}>
                      <Ionicons name="trophy" size={18} color={T.starred} />
                      <Text style={detailStyles.statValue}>{stats.personalBest?.weight || latestSession?.maxWeight || '--'} kg</Text>
                      <Text style={detailStyles.statLabel}>Personal Best</Text>
                    </View>
                    <View style={detailStyles.statBox}>
                      <Ionicons name="analytics" size={18} color={T.accent} />
                      <Text style={detailStyles.statValue}>{Math.round(stats.personalBest?.estimatedOneRM || latestSession?.estimatedOneRM || 0)} kg</Text>
                      <Text style={detailStyles.statLabel}>Est. 1RM</Text>
                    </View>
                    <View style={detailStyles.statBox}>
                      <Ionicons name="calendar" size={18} color={T.accentSecondary} />
                      <Text style={detailStyles.statValue}>{stats.history.length}</Text>
                      <Text style={detailStyles.statLabel}>Sessions</Text>
                    </View>
                    <View style={detailStyles.statBox}>
                      <Ionicons name="barbell" size={18} color={T.liked} />
                      <Text style={detailStyles.statValue}>{latestSession?.totalSets || '--'}</Text>
                      <Text style={detailStyles.statLabel}>Last Sets</Text>
                    </View>
                  </View>
                ) : (
                  <View style={detailStyles.noStats}>
                    <Ionicons name="fitness-outline" size={28} color={T.textMuted} />
                    <Text style={detailStyles.noStatsText}>Not yet completed</Text>
                    <Text style={detailStyles.noStatsSub}>Stats appear here once you log this exercise</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const detailStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: T.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', flex: 1, marginTop: 50 },
  closeBtn: { position: 'absolute', top: 14, right: 14, zIndex: 10 },
  closeBg: { padding: 6, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  video: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', backgroundColor: '#000' },
  headerGradient: { height: 120, justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  body: { padding: 20, paddingBottom: 40 },
  name: { fontSize: 22, fontWeight: '700', color: T.text, textAlign: 'center' },
  actionRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 14 },
  actionPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: T.cardBorder, backgroundColor: T.surface },
  actionPillText: { fontSize: 14, fontWeight: '600', color: T.textSecondary },
  aiNote: { fontSize: 11, color: T.textMuted, textAlign: 'center', marginTop: 6, marginBottom: 14, fontStyle: 'italic' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 16 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: T.accentLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  tagText: { fontSize: 12, color: T.accent, fontWeight: '500' },
  desc: { fontSize: 14, color: T.textSecondary, lineHeight: 21, textAlign: 'center', marginBottom: 20 },
  tips: { marginTop: 4 },
  tipsHeader: { fontSize: 16, fontWeight: '700', color: T.text, marginBottom: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  tipNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: T.accentLight, justifyContent: 'center', alignItems: 'center' },
  tipNumText: { fontSize: 11, fontWeight: '700', color: T.accent },
  tipText: { flex: 1, fontSize: 14, color: T.textSecondary, lineHeight: 20 },
  statsSection: { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: T.cardBorder },
  statsHeader: { fontSize: 16, fontWeight: '700', color: T.text, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox: { width: '47%', backgroundColor: T.surface, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: T.cardBorder },
  statValue: { fontSize: 20, fontWeight: '800', color: T.text },
  statLabel: { fontSize: 11, color: T.textSecondary, fontWeight: '500' },
  noStats: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  noStatsText: { fontSize: 14, fontWeight: '600', color: T.textSecondary },
  noStatsSub: { fontSize: 12, color: T.textMuted },
});

// ─── Equipment filter options ───
const ALL_EQUIPMENT_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'dumbbell', label: 'Dumbbell' },
  { id: 'barbell', label: 'Barbell' },
  { id: 'cable', label: 'Cable' },
  { id: 'machine', label: 'Machine' },
  { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'bodyweight', label: 'Bodyweight' },
  { id: 'band', label: 'Bands' },
  { id: 'bench', label: 'Bench' },
];

// ─── Category classification keywords ───
const equipmentKeywords = ['dumbbell', 'barbell', 'cable', 'machine', 'kettlebell', 'smith', 'ez bar', 'bench press', 'lat pull', 'pulldown', 'leg press', 'chest press', 'shoulder press', 'weight', 'weighted', 'press', 'curl', 'fly', 'row', 'pullover', 'extension', 'raise'];
const cardioKeywords = ['cardio', 'running', 'cycling', 'rowing', 'swimming', 'jump rope', 'treadmill', 'elliptical', 'stair', 'hiit', 'jumping jack', 'burpee', 'mountain climber'];
const flexKeywords = ['stretch', 'yoga', 'mobility', 'warmup', 'warm-up', 'recovery', 'foam roll', 'flexibility'];

// ─── Main Modal ───
interface ExploreWorkoutsModalProps {
  visible: boolean;
  onClose: () => void;
  initialCategory?: string;
  categoryGradient?: string[];
  // Legacy props (kept for compatibility)
  category?: string;
}

export const ExploreWorkoutsModal = ({ visible, onClose, initialCategory, category: legacyCategory }: ExploreWorkoutsModalProps) => {
  const startCat = initialCategory || legacyCategory || 'All';
  const [activeCategory, setActiveCategory] = useState(startCat);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [filterEquipment, setFilterEquipment] = useState('all');
  const [viewFilter, setViewFilter] = useState('All');
  const [showFilter, setShowFilter] = useState(false);
  const [exercises, setExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingStar, setPendingStar] = useState<any | null>(null);
  const { starExercise, unstarExercise, isStarred, getStarredExercises, replaceStarred, getLikedExercises, getDislikedExercises } = usePreferencesStore();

  const handleStarPress = useCallback(async (exercise: any) => {
    if (isStarred(exercise.id)) { unstarExercise(exercise.id); return; }
    const added = await starExercise(exercise.id, exercise.name, exercise.videoUrl);
    if (!added) setPendingStar(exercise);
  }, [isStarred, starExercise, unstarExercise]);

  const handleReplace = useCallback(async (oldId: string) => {
    if (pendingStar) {
      await replaceStarred(oldId, pendingStar.id, pendingStar.name, pendingStar.videoUrl);
      setPendingStar(null);
    }
  }, [pendingStar, replaceStarred]);

  // Reset category when opening
  useEffect(() => {
    if (visible) setActiveCategory(startCat);
  }, [visible, startCat]);

  // Fetch exercises
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/exercises?limit=2000`);
        const data = await res.json();
        if (!cancelled) setExercises(data.exercises || []);
      } catch (e) { console.error('Failed to fetch exercises:', e); }
      finally { if (!cancelled) setIsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [visible]);

  // Reset on close
  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setFilterDifficulty('All');
      setFilterEquipment('all');
      setViewFilter('All');
      setSelectedExercise(null);
    }
  }, [visible]);

  const filteredExercises = useMemo(() => {
    if (isLoading) return [];
    let filtered = exercises;

    // Category
    if (activeCategory !== 'All') {
      filtered = filtered.filter(ex => {
        const exCat = (ex.category || '').toLowerCase();
        const exName = (ex.name || '').toLowerCase();
        const eqArr = Array.isArray(ex.equipment) ? ex.equipment : [];
        const eqStr = eqArr.map((e: any) => String(e).toLowerCase()).join(' ');
        const nameHasEq = equipmentKeywords.some(kw => exName.includes(kw));
        const fieldHasEq = eqArr.length > 0 && !eqStr.includes('bodyweight');
        const isCardio = cardioKeywords.some(kw => exCat.includes(kw) || exName.includes(kw));
        const isFlex = flexKeywords.some(kw => exCat.includes(kw) || exName.includes(kw));
        if (activeCategory === 'Weights') return (nameHasEq || fieldHasEq) && !isCardio && !isFlex;
        if (activeCategory === 'Calisthenics') return !nameHasEq && !fieldHasEq && !isCardio && !isFlex;
        if (activeCategory === 'Cardio') return isCardio;
        if (activeCategory === 'Flexibility') return isFlex;
        return true;
      });
    }

    // View filter (starred, liked, disliked)
    if (viewFilter === 'Starred') {
      const starredIds = getStarredExercises().map(s => s.exerciseId);
      filtered = filtered.filter(ex => starredIds.includes(ex.id?.toString()));
    } else if (viewFilter === 'Liked') {
      const likedIds = getLikedExercises().map(l => l.exerciseId);
      filtered = filtered.filter(ex => likedIds.includes(ex.id?.toString()));
    } else if (viewFilter === 'Disliked') {
      const dislikedIds = getDislikedExercises().map(d => d.exerciseId);
      filtered = filtered.filter(ex => dislikedIds.includes(ex.id?.toString()));
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.name?.toLowerCase().includes(q) ||
        ex.muscleGroups?.some((mg: string) => mg.toLowerCase().includes(q)) ||
        ex.bodyPart?.toLowerCase().includes(q)
      );
    }

    // Difficulty
    if (filterDifficulty !== 'All') {
      filtered = filtered.filter(ex => ex.difficulty?.toLowerCase() === filterDifficulty.toLowerCase());
    }

    // Equipment
    if (filterEquipment !== 'all') {
      filtered = filtered.filter(ex => {
        const eqArr = Array.isArray(ex.equipment) ? ex.equipment : [];
        const exName = (ex.name || '').toLowerCase();
        return eqArr.some((eq: string) => eq?.toLowerCase().includes(filterEquipment.toLowerCase())) || exName.includes(filterEquipment.toLowerCase());
      });
    }

    return filtered;
  }, [exercises, searchQuery, filterDifficulty, filterEquipment, activeCategory, viewFilter, isLoading]);

  const activeFilterCount = (filterDifficulty !== 'All' ? 1 : 0) + (filterEquipment !== 'all' ? 1 : 0) + (viewFilter !== 'All' ? 1 : 0);

  const renderTile = useCallback(({ item }: { item: any }) => (
    <ExerciseTile exercise={item} onPress={() => setSelectedExercise(item)} onStarPress={handleStarPress} />
  ), [handleStarPress]);

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
              <Ionicons name="options-outline" size={22} color={T.accent} />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{activeFilterCount}</Text></View>
              )}
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={T.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search exercises..."
                placeholderTextColor={T.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                data-testid="explore-search-input"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={T.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Category Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs} contentContainerStyle={styles.categoryTabsContent}>
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                  onPress={() => setActiveCategory(cat)}
                  data-testid={`cat-tab-${cat.toLowerCase()}`}
                >
                  <Ionicons name={CATEGORY_ICONS[cat] as any} size={16} color={isActive ? T.white : T.textSecondary} />
                  <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <View style={styles.activeFiltersRow}>
              {viewFilter !== 'All' && (
                <TouchableOpacity style={styles.activeChip} onPress={() => setViewFilter('All')}>
                  <Text style={styles.activeChipText}>{viewFilter}</Text>
                  <Ionicons name="close" size={14} color={T.accent} />
                </TouchableOpacity>
              )}
              {filterDifficulty !== 'All' && (
                <TouchableOpacity style={styles.activeChip} onPress={() => setFilterDifficulty('All')}>
                  <Text style={styles.activeChipText}>{filterDifficulty}</Text>
                  <Ionicons name="close" size={14} color={T.accent} />
                </TouchableOpacity>
              )}
              {filterEquipment !== 'all' && (
                <TouchableOpacity style={styles.activeChip} onPress={() => setFilterEquipment('all')}>
                  <Text style={styles.activeChipText}>{filterEquipment}</Text>
                  <Ionicons name="close" size={14} color={T.accent} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Results count */}
          <View style={styles.resultsRow}>
            <Text style={styles.resultsText}>
              {isLoading ? 'Loading...' : `${filteredExercises.length} exercises`}
            </Text>
          </View>

          {/* Tile Grid */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={T.accent} />
              <Text style={styles.loadingText}>Loading exercises...</Text>
            </View>
          ) : filteredExercises.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={T.textMuted} />
              <Text style={styles.emptyText}>No exercises found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            </View>
          ) : (
            <FlatList
              data={filteredExercises}
              renderItem={renderTile}
              keyExtractor={keyExtractor}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.gridContent}
              showsVerticalScrollIndicator={false}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews
            />
          )}

          {/* Filter Sheet */}
          <FilterSheet
            visible={showFilter}
            onClose={() => setShowFilter(false)}
            difficulty={filterDifficulty}
            setDifficulty={setFilterDifficulty}
            equipment={filterEquipment}
            setEquipment={setFilterEquipment}
            equipmentOptions={ALL_EQUIPMENT_FILTERS}
            viewFilter={viewFilter}
            setViewFilter={setViewFilter}
          />

          {/* Exercise Detail */}
          <ExerciseDetail
            exercise={selectedExercise}
            onClose={() => setSelectedExercise(null)}
          />

          {/* Replace Star Modal */}
          {pendingStar && (
            <Modal visible={!!pendingStar} transparent animationType="fade" onRequestClose={() => setPendingStar(null)}>
              <View style={styles.replaceOverlay}>
                <View style={styles.replaceSheet}>
                  <Text style={styles.replaceTitle}>Replace a Favourite</Text>
                  <Text style={styles.replaceSub}>
                    You already have 3 starred exercises. Replace one with{' '}
                    <Text style={{ fontWeight: '700', color: T.accent }}>{pendingStar.name}</Text>?
                  </Text>
                  {getStarredExercises().map(s => (
                    <TouchableOpacity key={s.exerciseId} style={styles.replaceItem} onPress={() => handleReplace(s.exerciseId)}>
                      <Ionicons name="star" size={18} color={T.starred} />
                      <Text style={styles.replaceItemText}>{s.exerciseName}</Text>
                      <Ionicons name="swap-horizontal" size={18} color={T.textMuted} />
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={styles.replaceCancelBtn} onPress={() => setPendingStar(null)}>
                    <Text style={styles.replaceCancelText}>Cancel</Text>
                  </TouchableOpacity>
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

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 12 : 16, paddingBottom: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: T.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: T.cardBorder },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: T.text, textAlign: 'center', marginHorizontal: 8 },
  filterIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: T.accentLight, justifyContent: 'center', alignItems: 'center' },
  filterBadge: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: T.accent, justifyContent: 'center', alignItems: 'center' },
  filterBadgeText: { fontSize: 10, fontWeight: '700', color: T.white },

  // Search
  searchRow: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.surface, borderRadius: 12, paddingHorizontal: 12, gap: 8, borderWidth: 1, borderColor: T.cardBorder },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: T.text },

  // Category tabs
  categoryTabs: { maxHeight: 44 },
  categoryTabsContent: { paddingHorizontal: 16, gap: 8 },
  categoryTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: T.surface, borderWidth: 1, borderColor: T.cardBorder },
  categoryTabActive: { backgroundColor: T.accent, borderColor: T.accent },
  categoryTabText: { fontSize: 13, fontWeight: '600', color: T.textSecondary },
  categoryTabTextActive: { fontSize: 13, fontWeight: '600', color: T.white },

  // Active filter chips
  activeFiltersRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8, gap: 6, flexWrap: 'wrap' },
  activeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: T.accentLight, borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)' },
  activeChipText: { fontSize: 12, fontWeight: '600', color: T.accent },

  // Results
  resultsRow: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  resultsText: { fontSize: 13, color: T.textMuted, fontWeight: '500' },

  // Grid
  gridContent: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 },
  gridRow: { justifyContent: 'space-between', marginBottom: 12 },

  // Loading / Empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: T.textMuted },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: T.text },
  emptySubtext: { fontSize: 13, color: T.textMuted },

  // Replace Star Modal
  replaceOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  replaceSheet: { backgroundColor: T.bg, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 },
  replaceTitle: { fontSize: 18, fontWeight: '700', color: T.text, marginBottom: 6 },
  replaceSub: { fontSize: 13, color: T.textSecondary, lineHeight: 19, marginBottom: 16 },
  replaceItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: T.surface, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: T.cardBorder },
  replaceItemText: { flex: 1, fontSize: 14, fontWeight: '600', color: T.text },
  replaceCancelBtn: { marginTop: 8, alignItems: 'center', paddingVertical: 12 },
  replaceCancelText: { fontSize: 14, fontWeight: '600', color: T.textMuted },
});

export default ExploreWorkoutsModal;
