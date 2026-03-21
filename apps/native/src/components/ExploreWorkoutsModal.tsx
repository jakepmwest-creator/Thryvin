import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform } from 'react-native';
import { PreviewVideoPlayer, isValidVideoUrl } from './ExerciseVideoPlayer';
import { usePreferencesStore } from '../stores/preferences-store';
import { getApiBaseUrl } from '../services/env';

const API_BASE_URL = getApiBaseUrl();

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#111111',
  card: '#1A1A1A',
  cardBorder: '#2A2A2A',
  accent: '#a259ff',
  accentSoft: 'rgba(162,89,255,0.15)',
  green: '#22c55e',
  red: '#ef4444',
  white: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
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

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ title, accent = C.accent }: { title: string; accent?: string }) => (
  <View style={[sStyles.header, { borderLeftColor: accent }]}>
    <Text style={sStyles.title}>{title}</Text>
  </View>
);

const sStyles = StyleSheet.create({
  header: { borderLeftWidth: 3, paddingLeft: 10, marginBottom: 12, marginTop: 8 },
  title: { fontSize: 16, fontWeight: '700', color: C.white },
});

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

// ─── Exercise Card ────────────────────────────────────────────────────────────
const ExerciseCard = memo(({ exercise, onPress }: { exercise: any; onPress: () => void }) => {
  const { getPreference, likeExercise, removePreference } = usePreferencesStore();
  const preference = getPreference(exercise.id);
  const thumbUrl = getThumbUrl(exercise);
  const muscle = exercise.muscleGroups?.[0] || exercise.bodyPart || 'Full Body';
  const setsReps = exercise.sets && exercise.reps ? `${exercise.sets}×${exercise.reps}` : null;

  const handleLike = () => {
    if (preference === 'liked') removePreference(exercise.id);
    else likeExercise(exercise.id, exercise.name);
  };

  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={cardStyles.thumb}>
        {thumbUrl ? (
          <Image source={{ uri: thumbUrl }} style={cardStyles.thumbImg} resizeMode="cover" />
        ) : (
          <LinearGradient colors={[C.gradStart, C.gradEnd]} style={cardStyles.thumbPlaceholder}>
            <Ionicons name="barbell-outline" size={22} color="rgba(255,255,255,0.4)" />
          </LinearGradient>
        )}
      </View>
      <View style={cardStyles.info}>
        <Text style={cardStyles.name} numberOfLines={2}>{exercise.name}</Text>
        <MusclePill label={muscle} />
        {setsReps && <Text style={cardStyles.setsReps}>{setsReps}</Text>}
      </View>
      <TouchableOpacity onPress={handleLike} style={cardStyles.likeBtn}>
        <Ionicons
          name={preference === 'liked' ? 'heart' : 'heart-outline'}
          size={15}
          color={preference === 'liked' ? C.green : C.textMuted}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

const cardStyles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: C.card, borderRadius: 16, borderWidth: 1,
    borderColor: C.cardBorder, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  thumb: { width: '100%', height: 80, backgroundColor: '#222' },
  thumbImg: { width: '100%', height: '100%' },
  thumbPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  info: { padding: 10, gap: 5 },
  name: { fontSize: 12, fontWeight: '700', color: C.white, lineHeight: 16 },
  setsReps: { fontSize: 11, color: C.textMuted },
  likeBtn: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 4 },
});

// ─── Favourites horizontal card ───────────────────────────────────────────────
const FavCard = memo(({ exercise, onPress }: { exercise: any; onPress: () => void }) => {
  const muscle = exercise.muscleGroups?.[0] || exercise.bodyPart || 'Full Body';
  return (
    <TouchableOpacity style={favStyles.card} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name="heart" size={16} color="#ef4444" style={{ marginBottom: 6 }} />
      <Text style={favStyles.name} numberOfLines={2}>{exercise.name}</Text>
      <MusclePill label={muscle} />
    </TouchableOpacity>
  );
});
const favStyles = StyleSheet.create({
  card: { width: 120, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, padding: 12, marginRight: 10 },
  name: { fontSize: 12, fontWeight: '700', color: C.white, marginBottom: 6, lineHeight: 16 },
});

// ─── Disliked chip ────────────────────────────────────────────────────────────
const DislikedChip = memo(({ exercise, onUndislike }: { exercise: any; onUndislike: () => void }) => (
  <TouchableOpacity style={chipStyles.chip} onPress={onUndislike} activeOpacity={0.8}>
    <View style={chipStyles.redDot} />
    <Text style={chipStyles.text} numberOfLines={1}>{exercise.name}</Text>
    <Ionicons name="close" size={11} color={C.textMuted} />
  </TouchableOpacity>
));
const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 99,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    marginRight: 8, marginBottom: 8,
  },
  redDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.red },
  text: { fontSize: 12, color: C.white, fontWeight: '500', maxWidth: 100 },
});

// ─── 2-col grid renderer ──────────────────────────────────────────────────────
const ExerciseGrid = ({ items, onPress }: { items: any[]; onPress: (ex: any) => void }) => {
  const rows: any[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push([items[i], items[i + 1] || null]);
  }
  return (
    <>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <View style={{ flex: 1 }}><ExerciseCard exercise={row[0]} onPress={() => onPress(row[0])} /></View>
          {row[1]
            ? <View style={{ flex: 1 }}><ExerciseCard exercise={row[1]} onPress={() => onPress(row[1])} /></View>
            : <View style={{ flex: 1 }} />
          }
        </View>
      ))}
    </>
  );
};

// ─── Exercise Detail sheet ────────────────────────────────────────────────────
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
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <TouchableOpacity onPress={onClose} style={dStyles.closeBtn}>
              <View style={dStyles.closeBg}><Ionicons name="close" size={20} color={C.white} /></View>
            </TouchableOpacity>
            {hasVideo
              ? <View style={dStyles.video}><PreviewVideoPlayer videoUrl={exercise.videoUrl} exerciseName={exercise.name} /></View>
              : <LinearGradient colors={[C.gradStart, C.gradEnd]} style={dStyles.headerGrad}><Ionicons name="barbell" size={36} color={C.white} /></LinearGradient>
            }
            <View style={dStyles.body}>
              <Text style={dStyles.name}>{exercise.name}</Text>
              <View style={dStyles.actionRow}>
                <TouchableOpacity onPress={handleLikeToggle} style={[dStyles.pill, preference === 'liked' && dStyles.pillLiked]}>
                  <Ionicons name={preference === 'liked' ? 'heart' : 'heart-outline'} size={18} color={preference === 'liked' ? C.green : C.textMuted} />
                  <Text style={[dStyles.pillText, preference === 'liked' && { color: C.green }]}>{preference === 'liked' ? 'Liked' : 'Like'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleStarToggle} style={[dStyles.pill, starred && dStyles.pillStarred]}>
                  <Ionicons name={starred ? 'star' : 'star-outline'} size={18} color={starred ? '#F59E0B' : C.textMuted} />
                  <Text style={[dStyles.pillText, starred && { color: '#F59E0B' }]}>{starred ? 'Starred' : 'Star'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={dStyles.aiNote}>Liked exercises influence your AI-generated workouts</Text>
              <View style={dStyles.tags}>
                {exercise.difficulty && <View style={dStyles.tag}><Text style={dStyles.tagText}>{exercise.difficulty}</Text></View>}
                <View style={dStyles.tag}><Text style={dStyles.tagText}>{exercise.muscleGroups?.join(', ') || exercise.bodyPart || 'Full Body'}</Text></View>
                {exercise.equipment && (
                  <View style={dStyles.tag}><Text style={dStyles.tagText}>{Array.isArray(exercise.equipment) ? exercise.equipment.join(', ') : exercise.equipment}</Text></View>
                )}
              </View>
              <Text style={dStyles.desc}>{exercise.description || 'Perform this exercise with proper form and controlled movements.'}</Text>
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
              {statsLoading
                ? <ActivityIndicator size="small" color={C.accent} style={{ marginTop: 20 }} />
                : hasHistory
                  ? (
                    <View style={{ marginTop: 16 }}>
                      <Text style={dStyles.sectionTitle}>Your Stats</Text>
                      <View style={dStyles.statsGrid}>
                        <View style={dStyles.statBox}>
                          <Text style={dStyles.statValue}>{stats.personalBest?.weight || latestSession?.maxWeight || '--'} kg</Text>
                          <Text style={dStyles.statLabel}>Personal Best</Text>
                        </View>
                        <View style={dStyles.statBox}>
                          <Text style={dStyles.statValue}>{stats.history.length}</Text>
                          <Text style={dStyles.statLabel}>Sessions</Text>
                        </View>
                      </View>
                    </View>
                  )
                  : null
              }
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const dStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', flex: 1, marginTop: 50 },
  closeBtn: { position: 'absolute', top: 14, right: 14, zIndex: 10 },
  closeBg: { padding: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16 },
  video: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', backgroundColor: '#000' },
  headerGrad: { height: 120, justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  body: { padding: 20, paddingBottom: 40 },
  name: { fontSize: 22, fontWeight: '700', color: C.white, textAlign: 'center', marginBottom: 16 },
  actionRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: '#2A2A2A' },
  pillLiked: { borderColor: C.green, backgroundColor: 'rgba(34,197,94,0.1)' },
  pillStarred: { borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.1)' },
  pillText: { fontSize: 14, fontWeight: '600', color: C.textSecondary },
  aiNote: { fontSize: 11, color: C.textMuted, textAlign: 'center', marginBottom: 14, fontStyle: 'italic' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 16 },
  tag: { backgroundColor: C.accentSoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  tagText: { fontSize: 12, color: C.accent, fontWeight: '500' },
  desc: { fontSize: 14, color: C.textSecondary, lineHeight: 21, textAlign: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.white, marginBottom: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  tipNum: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  tipNumText: { fontSize: 11, fontWeight: '700', color: C.white },
  tipText: { flex: 1, fontSize: 14, color: C.textSecondary, lineHeight: 20 },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: '#222', borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '800', color: C.white },
  statLabel: { fontSize: 11, color: C.textSecondary },
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

  const { getLikedExercises, getDislikedExercises, removePreference } = usePreferencesStore();

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
    }
  }, [visible]);

  // Build id→exercise lookup
  const exerciseMap = useMemo(() => {
    const map: Record<string, any> = {};
    exercises.forEach(ex => { map[String(ex.id)] = ex; });
    return map;
  }, [exercises]);

  // Liked / disliked exercise objects
  const likedExercises = useMemo(() => {
    return getLikedExercises().map(l => exerciseMap[l.exerciseId]).filter(Boolean);
  }, [getLikedExercises, exerciseMap]);

  const dislikedExercises = useMemo(() => {
    return getDislikedExercises().map(d => exerciseMap[d.exerciseId]).filter(Boolean);
  }, [getDislikedExercises, exerciseMap]);

  // Filtered + categorised pools
  const filteredBase = useMemo(() => {
    if (!searchQuery) return exercises;
    const q = searchQuery.toLowerCase();
    return exercises.filter(ex =>
      ex.name?.toLowerCase().includes(q) ||
      ex.muscleGroups?.some((mg: string) => mg.toLowerCase().includes(q)) ||
      ex.bodyPart?.toLowerCase().includes(q)
    );
  }, [exercises, searchQuery]);

  const strengthExercises = useMemo(() =>
    filteredBase.filter(ex => classifyExercise(ex) === 'strength').slice(0, 20),
    [filteredBase]
  );
  const cardioExercises = useMemo(() =>
    filteredBase.filter(ex => classifyExercise(ex) === 'cardio').slice(0, 20),
    [filteredBase]
  );
  const flexExercises = useMemo(() =>
    filteredBase.filter(ex => classifyExercise(ex) === 'flexibility').slice(0, 20),
    [filteredBase]
  );

  const openDetail = useCallback((ex: any) => setSelectedExercise(ex), []);
  const handleUndislike = useCallback((id: string) => removePreference(id), [removePreference]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={mStyles.overlay}>
        <View style={mStyles.container}>

          {/* ── Header ─────────────────────────────────────────────────── */}
          <View style={mStyles.header}>
            <TouchableOpacity onPress={onClose} style={mStyles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={C.white} />
            </TouchableOpacity>
            <Text style={mStyles.headerTitle}>Explore Exercises</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* ── Search ─────────────────────────────────────────────────── */}
          <View style={mStyles.searchRow}>
            <View style={mStyles.searchBox}>
              <Ionicons name="search" size={16} color={C.textMuted} />
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

          {/* ── Content ────────────────────────────────────────────────── */}
          {isLoading ? (
            <View style={mStyles.loadingContainer}>
              <ActivityIndicator size="large" color={C.accent} />
              <Text style={mStyles.loadingText}>Loading exercises...</Text>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={mStyles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Section 1: Your Favourites */}
              {likedExercises.length > 0 && (
                <View style={mStyles.section}>
                  <SectionHeader title="❤️  Your Favourites" accent="#ef4444" />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                    {likedExercises.map((ex: any) => (
                      <FavCard key={ex.id} exercise={ex} onPress={() => openDetail(ex)} />
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Section 2: Liked Exercises grid */}
              {likedExercises.length > 0 && (
                <View style={mStyles.section}>
                  <SectionHeader title="👍  Liked Exercises" accent={C.green} />
                  <ExerciseGrid items={likedExercises.slice(0, 8)} onPress={openDetail} />
                </View>
              )}

              {/* Section 3: Disliked chips */}
              {dislikedExercises.length > 0 && (
                <View style={mStyles.section}>
                  <SectionHeader title="👎  Disliked" accent={C.red} />
                  <View style={mStyles.chipRow}>
                    {dislikedExercises.map((ex: any) => (
                      <DislikedChip
                        key={ex.id}
                        exercise={ex}
                        onUndislike={() => handleUndislike(String(ex.id))}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Section 4: Strength & Weights */}
              {strengthExercises.length > 0 && (
                <View style={mStyles.section}>
                  <SectionHeader title="🏋️  Strength & Weights" accent={C.accent} />
                  <ExerciseGrid items={strengthExercises} onPress={openDetail} />
                </View>
              )}

              {/* Section 5: Cardio */}
              {cardioExercises.length > 0 && (
                <View style={mStyles.section}>
                  <SectionHeader title="🏃  Cardio" accent="#f97316" />
                  <ExerciseGrid items={cardioExercises} onPress={openDetail} />
                </View>
              )}

              {/* Section 6: Flexibility & Recovery */}
              {flexExercises.length > 0 && (
                <View style={mStyles.section}>
                  <SectionHeader title="🧘  Flexibility & Recovery" accent="#22d3ee" />
                  <ExerciseGrid items={flexExercises} onPress={openDetail} />
                </View>
              )}

              {/* Empty state */}
              {filteredBase.length === 0 && (
                <View style={mStyles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color={C.textMuted} />
                  <Text style={mStyles.emptyText}>No exercises found</Text>
                  <Text style={mStyles.emptySubtext}>Try a different search term</Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* Detail sheet */}
          <ExerciseDetail exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />
        </View>
      </View>
    </Modal>
  );
};

const mStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { flex: 1,
    fontSize: 18, fontWeight: '700', color: C.white, textAlign: 'center', marginHorizontal: 8,
  },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.card, borderRadius: 12,
    paddingHorizontal: 12, borderWidth: 1, borderColor: C.cardBorder,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: C.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: C.textMuted },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 8 },
  section: { marginBottom: 24 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: C.white },
  emptySubtext: { fontSize: 13, color: C.textMuted },
});

export default ExploreWorkoutsModal;