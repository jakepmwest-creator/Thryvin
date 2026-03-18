import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Dimensions,
  FlatList, Modal, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PreviewVideoPlayer, isValidVideoUrl } from './ExerciseVideoPlayer';
import { usePreferencesStore } from '../stores/preferences-store';
import { getApiBaseUrl } from '../services/env';

const API_BASE_URL = getApiBaseUrl();
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 64;
const CARD_MARGIN = 8;

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

function getThumbUrl(exercise: any): string | null {
  if (!exercise) return null;
  if (exercise.thumbnailUrl) return exercise.thumbnailUrl;
  const videoUrl = exercise.videoUrl;
  if (isValidVideoUrl(videoUrl)) {
    return videoUrl.replace('/upload/', '/upload/w_600,h_400,c_fill,so_1/').replace('.mp4', '.jpg');
  }
  return null;
}

// ─── Exercise Detail Sheet (inline, opens from carousel) ───
const ExerciseDetailSheet = memo(({ exercise, visible, onClose }: {
  exercise: any; visible: boolean; onClose: () => void;
}) => {
  const hasVideo = isValidVideoUrl(exercise?.videoUrl);
  const { getPreference, likeExercise, dislikeExercise, removePreference, isStarred, starExercise, unstarExercise } = usePreferencesStore();
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const preference = exercise ? getPreference(exercise.id) : null;
  const starred = exercise ? isStarred(exercise.id) : false;

  useEffect(() => {
    if (!exercise?.id || !visible) { setStats(null); return; }
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
  }, [exercise?.id, visible]);

  if (!exercise || !visible) return null;

  const handleLike = () => {
    if (preference === 'liked') removePreference(exercise.id);
    else likeExercise(exercise.id, exercise.name);
  };
  const handleStar = async () => {
    if (starred) unstarExercise(exercise.id);
    else await starExercise(exercise.id, exercise.name, exercise.videoUrl);
  };
  const hasHistory = stats?.history?.length > 0;
  const latestSession = hasHistory ? stats.history[0] : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
              <LinearGradient colors={[G.start, G.end]} style={detailStyles.headerGradient}>
                <Ionicons name="barbell" size={36} color={T.white} />
              </LinearGradient>
            )}
            <View style={detailStyles.body}>
              <Text style={detailStyles.name}>{exercise.name}</Text>
              <View style={detailStyles.actionRow}>
                <TouchableOpacity onPress={handleLike} style={[detailStyles.actionPill, preference === 'liked' && { backgroundColor: '#DCFCE7', borderColor: T.liked }]}>
                  <Ionicons name={preference === 'liked' ? 'heart' : 'heart-outline'} size={18} color={preference === 'liked' ? T.liked : T.textMuted} />
                  <Text style={[detailStyles.actionPillText, preference === 'liked' && { color: T.liked }]}>{preference === 'liked' ? 'Liked' : 'Like'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleStar} style={[detailStyles.actionPill, starred && { backgroundColor: '#FEF3C7', borderColor: T.starred }]}>
                  <Ionicons name={starred ? 'star' : 'star-outline'} size={18} color={starred ? T.starred : T.textMuted} />
                  <Text style={[detailStyles.actionPillText, starred && { color: '#B45309' }]}>{starred ? 'Starred' : 'Star'}</Text>
                </TouchableOpacity>
              </View>
              <View style={detailStyles.tags}>
                {exercise.difficulty && (
                  <View style={detailStyles.tag}>
                    <Ionicons name="speedometer-outline" size={13} color={G.start} />
                    <Text style={detailStyles.tagText}>{exercise.difficulty}</Text>
                  </View>
                )}
                <View style={detailStyles.tag}>
                  <Ionicons name="body-outline" size={13} color={G.start} />
                  <Text style={detailStyles.tagText}>{exercise.muscleGroups?.join(', ') || exercise.bodyPart || 'Full Body'}</Text>
                </View>
              </View>
              <Text style={detailStyles.desc}>{exercise.description || 'Perform this exercise with proper form and controlled movements.'}</Text>
              {exercise.tips?.length > 0 && (
                <View style={{ marginTop: 4 }}>
                  <Text style={detailStyles.sectionTitle}>Form Tips</Text>
                  {exercise.tips.map((tip: string, i: number) => (
                    <View key={i} style={detailStyles.tipRow}>
                      <LinearGradient colors={[G.start, G.end]} style={detailStyles.tipNum}><Text style={detailStyles.tipNumText}>{i + 1}</Text></LinearGradient>
                      <Text style={detailStyles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={detailStyles.statsSection}>
                <Text style={detailStyles.sectionTitle}>Your Stats</Text>
                {statsLoading ? <ActivityIndicator size="small" color={G.start} style={{ marginTop: 12 }} /> : hasHistory ? (
                  <View style={detailStyles.statsGrid}>
                    <View style={detailStyles.statBox}><Ionicons name="trophy" size={18} color={T.starred} /><Text style={detailStyles.statValue}>{stats.personalBest?.weight || latestSession?.maxWeight || '--'} kg</Text><Text style={detailStyles.statLabel}>Personal Best</Text></View>
                    <View style={detailStyles.statBox}><Ionicons name="analytics" size={18} color={G.start} /><Text style={detailStyles.statValue}>{Math.round(stats.personalBest?.estimatedOneRM || 0)} kg</Text><Text style={detailStyles.statLabel}>Est. 1RM</Text></View>
                    <View style={detailStyles.statBox}><Ionicons name="calendar" size={18} color={G.end} /><Text style={detailStyles.statValue}>{stats.history.length}</Text><Text style={detailStyles.statLabel}>Sessions</Text></View>
                    <View style={detailStyles.statBox}><Ionicons name="barbell" size={18} color={T.liked} /><Text style={detailStyles.statValue}>{latestSession?.totalSets || '--'}</Text><Text style={detailStyles.statLabel}>Last Sets</Text></View>
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
});

const detailStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: T.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', flex: 1, marginTop: 50 },
  closeBtn: { position: 'absolute', top: 14, right: 14, zIndex: 10 },
  closeBg: { padding: 6, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16 },
  video: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', backgroundColor: '#000' },
  headerGradient: { height: 120, justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  body: { padding: 20, paddingBottom: 40 },
  name: { fontSize: 22, fontWeight: '700', color: T.text, textAlign: 'center' },
  actionRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 14 },
  actionPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: T.cardBorder, backgroundColor: T.surface },
  actionPillText: { fontSize: 14, fontWeight: '600', color: T.textSecondary },
  tags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 14, marginBottom: 14 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: T.accentLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  tagText: { fontSize: 12, color: G.start, fontWeight: '500' },
  desc: { fontSize: 14, color: T.textSecondary, lineHeight: 21, textAlign: 'center', marginBottom: 16 },
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

// ─── Carousel Card ───
const CarouselCard = memo(({ exercise, onPress, onLike, onDislike }: {
  exercise: any; onPress: () => void; onLike: () => void; onDislike: () => void;
}) => {
  const { getPreference, isStarred } = usePreferencesStore();
  const preference = getPreference(exercise.id);
  const starred = isStarred(exercise.id);
  const thumbUrl = getThumbUrl(exercise);

  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.9} data-testid={`carousel-card-${exercise.id}`}>
      <View style={cardStyles.imageWrapper}>
        {thumbUrl ? (
          <Image source={{ uri: thumbUrl }} style={cardStyles.image} resizeMode="cover" />
        ) : (
          <LinearGradient colors={[G.start, G.end]} style={cardStyles.placeholderGradient}>
            <Ionicons name="barbell-outline" size={36} color="rgba(255,255,255,0.5)" />
          </LinearGradient>
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={cardStyles.imageOverlay} />
        {exercise.difficulty && (
          <View style={cardStyles.diffPill}><Text style={cardStyles.diffPillText}>{exercise.difficulty}</Text></View>
        )}
        {starred && (
          <View style={cardStyles.starBadge}><Ionicons name="star" size={14} color={T.starred} /></View>
        )}
        <View style={cardStyles.imageContent}>
          <Text style={cardStyles.exerciseName} numberOfLines={2}>{exercise.name}</Text>
          <Text style={cardStyles.exerciseMeta}>
            {exercise.muscleGroups?.join(', ') || exercise.bodyPart || 'Full Body'}
          </Text>
        </View>
      </View>
      <View style={cardStyles.actionsRow}>
        <TouchableOpacity onPress={onLike} style={[cardStyles.actionBtn, preference === 'liked' && { backgroundColor: '#DCFCE7' }]}>
          <Ionicons name={preference === 'liked' ? 'heart' : 'heart-outline'} size={20} color={preference === 'liked' ? T.liked : T.textMuted} />
          <Text style={[cardStyles.actionText, preference === 'liked' && { color: T.liked }]}>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDislike} style={[cardStyles.actionBtn, preference === 'disliked' && { backgroundColor: '#FEE2E2' }]}>
          <Ionicons name={preference === 'disliked' ? 'thumbs-down' : 'thumbs-down-outline'} size={20} color={preference === 'disliked' ? T.disliked : T.textMuted} />
          <Text style={[cardStyles.actionText, preference === 'disliked' && { color: T.disliked }]}>Pass</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onPress} style={[cardStyles.actionBtn, { backgroundColor: T.accentLight }]}>
          <Ionicons name="information-circle-outline" size={20} color={G.start} />
          <Text style={[cardStyles.actionText, { color: G.start }]}>Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

const cardStyles = StyleSheet.create({
  card: { width: CARD_WIDTH, marginHorizontal: CARD_MARGIN, borderRadius: 20, backgroundColor: T.card, overflow: 'hidden', borderWidth: 1, borderColor: T.cardBorder, shadowColor: 'rgba(162,43,246,0.15)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16, elevation: 5 },
  imageWrapper: { width: '100%', height: 200, position: 'relative' },
  image: { width: '100%', height: '100%' },
  placeholderGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  diffPill: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  diffPillText: { fontSize: 11, fontWeight: '600', color: G.start },
  starBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#FEF3C7', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  imageContent: { position: 'absolute', bottom: 12, left: 14, right: 14 },
  exerciseName: { fontSize: 18, fontWeight: '700', color: T.white, letterSpacing: -0.3 },
  exerciseMeta: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  actionsRow: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 10, gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 12, backgroundColor: T.surface },
  actionText: { fontSize: 12, fontWeight: '600', color: T.textSecondary },
});

// ─── Main Carousel ───
interface ExploreCarouselProps {
  onOpenExplore: () => void;
}

export const ExploreCarousel = ({ onOpenExplore }: ExploreCarouselProps) => {
  const [exercises, setExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailExercise, setDetailExercise] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const { likeExercise, dislikeExercise, removePreference, getPreference } = usePreferencesStore();
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIndex = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/exercises?limit=2000`);
        const data = await res.json();
        const allExercises = data.exercises || [];
        const shuffled = allExercises.sort(() => Math.random() - 0.5).slice(0, 15);
        setExercises(shuffled);
      } catch (e) { console.error('Carousel fetch failed:', e); }
      finally { setIsLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (exercises.length === 0) return;
    autoScrollTimer.current = setInterval(() => {
      currentIndex.current = (currentIndex.current + 1) % exercises.length;
      flatListRef.current?.scrollToIndex({ index: currentIndex.current, animated: true });
    }, 5000);
    return () => { if (autoScrollTimer.current) clearInterval(autoScrollTimer.current); };
  }, [exercises.length]);

  const handleLike = useCallback((exercise: any) => {
    const pref = getPreference(exercise.id);
    if (pref === 'liked') removePreference(exercise.id);
    else likeExercise(exercise.id, exercise.name);
  }, [getPreference, likeExercise, removePreference]);

  const handleDislike = useCallback((exercise: any) => {
    const pref = getPreference(exercise.id);
    if (pref === 'disliked') removePreference(exercise.id);
    else dislikeExercise(exercise.id, exercise.name);
  }, [getPreference, dislikeExercise, removePreference]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: CARD_WIDTH + CARD_MARGIN * 2,
    offset: (CARD_WIDTH + CARD_MARGIN * 2) * index,
    index,
  }), []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}><Text style={styles.title}>Explore Exercises</Text></View>
        <View style={styles.loadingCard}><ActivityIndicator size="large" color={G.start} /><Text style={styles.loadingText}>Loading exercises...</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.container} data-testid="explore-carousel">
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Explore Exercises</Text>
          <Text style={styles.subtitle}>Swipe to discover, tap for details</Text>
        </View>
        <TouchableOpacity style={styles.viewAllBtn} onPress={onOpenExplore} data-testid="explore-view-all-btn">
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="arrow-forward" size={16} color={G.start} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={exercises}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 24 }}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={() => {}}
        onScrollBeginDrag={() => { if (autoScrollTimer.current) clearInterval(autoScrollTimer.current); }}
        onMomentumScrollEnd={(e) => { currentIndex.current = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_MARGIN * 2)); }}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={({ item }) => (
          <CarouselCard
            exercise={item}
            onPress={() => setDetailExercise(item)}
            onLike={() => handleLike(item)}
            onDislike={() => handleDislike(item)}
          />
        )}
      />

      {/* Browse Full Library button */}
      <TouchableOpacity style={styles.exploreBtn} onPress={onOpenExplore} activeOpacity={0.85} data-testid="explore-all-exercises-btn">
        <LinearGradient colors={[G.start, G.end]} style={styles.exploreBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="compass-outline" size={20} color={T.white} />
          <Text style={styles.exploreBtnText}>Browse Full Exercise Library</Text>
          <Ionicons name="arrow-forward" size={18} color={T.white} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Exercise Detail Sheet */}
      <ExerciseDetailSheet
        exercise={detailExercise}
        visible={!!detailExercise}
        onClose={() => setDetailExercise(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: T.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: T.textMuted, marginTop: 1 },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: T.accentLight },
  viewAllText: { fontSize: 13, fontWeight: '600', color: G.start },
  loadingCard: { height: 240, marginHorizontal: 32, borderRadius: 20, backgroundColor: T.surface, justifyContent: 'center', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: T.cardBorder },
  loadingText: { fontSize: 14, color: T.textMuted },
  exploreBtn: { marginHorizontal: 16, marginTop: 14, borderRadius: 16, overflow: 'hidden' },
  exploreBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  exploreBtnText: { fontSize: 15, fontWeight: '700', color: T.white },
});

export default ExploreCarousel;
