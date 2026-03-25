import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator,
  Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PreviewVideoPlayer, isValidVideoUrl } from './ExerciseVideoPlayer';
import { usePreferencesStore } from '../stores/preferences-store';
import { getApiBaseUrl } from '../services/env';

const API_BASE_URL = getApiBaseUrl();
const G = { start: '#A22BF6', end: '#FF4EC7' };
const T = { text: '#1F1F1F', textSecondary: '#6B7280', textMuted: '#9CA3AF', starred: '#F59E0B', white: '#FFFFFF', surface: '#F8F7FC', cardBorder: '#EDE8F5', accentLight: '#EDE9FE', liked: '#10B981' };

function getThumbUrl(videoUrl: string | undefined, width = 300, height = 400): string | null {
  if (!videoUrl || typeof videoUrl !== 'string') return null;
  if (!videoUrl.startsWith('http') || !videoUrl.includes('cloudinary')) return null;
  return videoUrl.replace('/upload/', `/upload/w_${width},h_${height},c_fill,so_1/`).replace('.mp4', '.jpg');
}

// ── Inline Exercise Detail ──
const ExerciseDetailModal = ({ exercise, visible, onClose }: { exercise: any; visible: boolean; onClose: () => void }) => {
  const hasVideo = isValidVideoUrl(exercise?.videoUrl);
  const { getPreference, likeExercise, removePreference, isStarred, starExercise, unstarExercise } = usePreferencesStore();
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const preference = exercise ? getPreference(exercise.exerciseId || exercise.id) : null;
  const starred = exercise ? isStarred(exercise.exerciseId || exercise.id) : false;
  const exId = exercise?.exerciseId || exercise?.id;
  const exName = exercise?.exerciseName || exercise?.name;

  useEffect(() => {
    if (!exId || !visible) { setStats(null); return; }
    let c = false;
    (async () => {
      setStatsLoading(true);
      try { const r = await fetch(`${API_BASE_URL}/api/stats/exercise/${exId}`); if (r.ok && !c) setStats(await r.json()); } catch {}
      finally { if (!c) setStatsLoading(false); }
    })();
    return () => { c = true; };
  }, [exId, visible]);

  if (!exercise || !visible) return null;
  const handleLike = () => { if (preference === 'liked') removePreference(exId); else likeExercise(exId, exName); };
  const handleStar = async () => { if (starred) unstarExercise(exId); else await starExercise(exId, exName, exercise.videoUrl); };
  const hasHistory = stats?.history?.length > 0;
  const latest = hasHistory ? stats.history[0] : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={dS.overlay}>
        <View style={dS.sheet}>
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <TouchableOpacity onPress={onClose} style={dS.closeBtn}><View style={dS.closeBg}><Ionicons name="close" size={20} color={T.text} /></View></TouchableOpacity>
            {hasVideo ? <View style={dS.video}><PreviewVideoPlayer videoUrl={exercise.videoUrl} exerciseName={exName} /></View>
              : <LinearGradient colors={[G.start, G.end]} style={dS.hGrad}><Ionicons name="barbell" size={36} color={T.white} /></LinearGradient>}
            <View style={dS.body}>
              <Text style={dS.name}>{exName}</Text>
              <View style={dS.actionRow}>
                <TouchableOpacity onPress={handleLike} style={[dS.pill, preference === 'liked' && { backgroundColor: '#DCFCE7', borderColor: T.liked }]}>
                  <Ionicons name={preference === 'liked' ? 'heart' : 'heart-outline'} size={18} color={preference === 'liked' ? T.liked : T.textMuted} />
                  <Text style={[dS.pillT, preference === 'liked' && { color: T.liked }]}>{preference === 'liked' ? 'Liked' : 'Like'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleStar} style={[dS.pill, starred && { backgroundColor: '#FEF3C7', borderColor: T.starred }]}>
                  <Ionicons name={starred ? 'star' : 'star-outline'} size={18} color={starred ? T.starred : T.textMuted} />
                  <Text style={[dS.pillT, starred && { color: '#B45309' }]}>{starred ? 'Starred' : 'Star'}</Text>
                </TouchableOpacity>
              </View>
              <View style={dS.statsSection}>
                <Text style={dS.sTitle}>Your Stats</Text>
                {statsLoading ? <ActivityIndicator size="small" color={G.start} style={{ marginTop: 12 }} /> : hasHistory ? (
                  <View style={dS.statsGrid}>
                    <View style={dS.sBox}><Ionicons name="trophy" size={18} color={T.starred} /><Text style={dS.sVal}>{stats.personalBest?.weight || latest?.maxWeight || '--'} kg</Text><Text style={dS.sLbl}>Personal Best</Text></View>
                    <View style={dS.sBox}><Ionicons name="analytics" size={18} color={G.start} /><Text style={dS.sVal}>{Math.round(stats.personalBest?.estimatedOneRM || 0)} kg</Text><Text style={dS.sLbl}>Est. 1RM</Text></View>
                    <View style={dS.sBox}><Ionicons name="calendar" size={18} color={G.end} /><Text style={dS.sVal}>{stats.history.length}</Text><Text style={dS.sLbl}>Sessions</Text></View>
                    <View style={dS.sBox}><Ionicons name="barbell" size={18} color={T.liked} /><Text style={dS.sVal}>{latest?.totalSets || '--'}</Text><Text style={dS.sLbl}>Last Sets</Text></View>
                  </View>
                ) : (
                  <View style={dS.noStats}><Ionicons name="fitness-outline" size={28} color={T.textMuted} /><Text style={dS.noStatsT}>Not yet completed</Text><Text style={dS.noStatsS}>Stats appear once you log this exercise</Text></View>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const dS = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: T.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', flex: 1, marginTop: 50 },
  closeBtn: { position: 'absolute', top: 14, right: 14, zIndex: 10 },
  closeBg: { padding: 6, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16 },
  video: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', backgroundColor: '#000' },
  hGrad: { height: 120, justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  body: { padding: 20 },
  name: { fontSize: 22, fontWeight: '700', color: T.text, textAlign: 'center' },
  actionRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 14, marginBottom: 16 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: T.cardBorder, backgroundColor: T.surface },
  pillT: { fontSize: 14, fontWeight: '600', color: T.textSecondary },
  statsSection: { paddingTop: 16, borderTopWidth: 1, borderTopColor: T.cardBorder },
  sTitle: { fontSize: 16, fontWeight: '700', color: T.text, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sBox: { width: '47%', backgroundColor: T.surface, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: T.cardBorder },
  sVal: { fontSize: 20, fontWeight: '800', color: T.text },
  sLbl: { fontSize: 11, color: T.textSecondary, fontWeight: '500' },
  noStats: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  noStatsT: { fontSize: 14, fontWeight: '600', color: T.textSecondary },
  noStatsS: { fontSize: 12, color: T.textMuted },
});

// ── Main Card ──
interface FavoriteExercisesCardProps {
  onViewAll?: () => void;
}

export const FavoriteExercisesCard = ({ onViewAll }: FavoriteExercisesCardProps) => {
  const { getStarredExercises } = usePreferencesStore();
  const starred = getStarredExercises();
  const [stats, setStats] = useState<Record<string, any>>({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);

  useEffect(() => {
    if (starred.length === 0) return;
    let c = false;
    (async () => {
      setLoadingStats(true);
      const r: Record<string, any> = {};
      await Promise.all(starred.map(async (s) => {
        try { const res = await fetch(`${API_BASE_URL}/api/stats/exercise/${s.exerciseId}`); if (res.ok) r[s.exerciseId] = await res.json(); } catch {}
      }));
      if (!c) { setStats(r); setLoadingStats(false); }
    })();
    return () => { c = true; };
  }, [starred.length]);

  if (starred.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}><Ionicons name="star" size={18} color={T.starred} /><Text style={styles.headerTitle}>Favourite Exercises</Text></View>
          {onViewAll && <TouchableOpacity onPress={onViewAll} style={styles.viewAllBtn} data-testid="fav-view-all-btn"><Text style={styles.viewAllText}>View All</Text><Ionicons name="arrow-forward" size={14} color={G.start} /></TouchableOpacity>}
        </View>
        <View style={styles.emptyCard}><Ionicons name="star-outline" size={32} color={T.textMuted} /><Text style={styles.emptyText}>No favourites yet</Text><Text style={styles.emptySub}>Star up to 3 exercises to track them here</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.container} data-testid="favorite-exercises-card">
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}><Ionicons name="star" size={18} color={T.starred} /><Text style={styles.headerTitle}>Favourite Exercises</Text></View>
        {onViewAll && <TouchableOpacity onPress={onViewAll} style={styles.viewAllBtn} data-testid="fav-view-all-btn"><Text style={styles.viewAllText}>View All</Text><Ionicons name="arrow-forward" size={14} color={G.start} /></TouchableOpacity>}
      </View>
      <View style={styles.exercisesRow}>
        {starred.map((exercise) => {
          const thumbUrl = getThumbUrl(exercise.videoUrl);
          const stat = stats[exercise.exerciseId];
          const hasHistory = stat?.history?.length > 0;
          const pb = hasHistory ? (stat.personalBest?.weight || stat.history[0]?.maxWeight) : null;
          return (
            <TouchableOpacity key={exercise.exerciseId} style={styles.exerciseItem} onPress={() => setSelectedExercise(exercise)} activeOpacity={0.8}>
              {/* Gradient left border strip */}
              <LinearGradient colors={[G.start, G.end]} style={styles.gradBorderStrip} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
              <View style={styles.exerciseItemInner}>
                <LinearGradient colors={[G.start, G.end]} style={styles.thumbRing} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <View style={styles.thumbInner}>
                    {thumbUrl ? <Image source={{ uri: thumbUrl }} style={styles.thumbImage} resizeMode="cover" />
                      : <View style={styles.thumbPlaceholder}><Ionicons name="barbell-outline" size={20} color={T.textMuted} /></View>}
                  </View>
                </LinearGradient>
                <View style={styles.starBadgeWrapper}><Ionicons name="star" size={9} color={T.starred} /></View>
                <View style={styles.exerciseTextBlock}>
                  <Text style={styles.exerciseName} numberOfLines={2}>{exercise.exerciseName}</Text>
                  {loadingStats ? <ActivityIndicator size="small" color={G.start} style={{ marginTop: 2 }} />
                    : pb ? <View style={styles.weightBadge}><Ionicons name="trophy" size={10} color={T.starred} /><Text style={styles.weightText}>{pb} kg</Text></View>
                    : <Text style={styles.notYetText}>Not yet logged</Text>}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
        {Array.from({ length: 3 - starred.length }).map((_, i) => (
          <View key={`e-${i}`} style={[styles.exerciseItem, { justifyContent: 'center', alignItems: 'center' }]}>
            <View style={styles.thumbRingEmpty}><View style={styles.thumbInnerEmpty}><Ionicons name="add" size={20} color={T.textMuted} /></View></View>
            <Text style={styles.emptySlotText}>Empty slot</Text>
          </View>
        ))}
      </View>

      <ExerciseDetailModal exercise={selectedExercise} visible={!!selectedExercise} onClose={() => setSelectedExercise(null)} />
    </View>
  );
};

const TW = 56; const TH = 56; const RW = TW + 6; const RH = TH + 6; const BR = 14;
const styles = StyleSheet.create({
  container: { marginHorizontal: 0, marginBottom: 16, width: '100%' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 2 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: T.text },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 14, backgroundColor: T.accentLight },
  viewAllText: { fontSize: 13, fontWeight: '600', color: G.start },
  exercisesRow: { gap: 10 },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 120,
    backgroundColor: T.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.cardBorder,
    overflow: 'hidden',
    position: 'relative',
  },
  gradBorderStrip: { width: 4, alignSelf: 'stretch' },
  exerciseItemInner: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, gap: 14 },
  thumbRing: { width: RW, height: RH, borderRadius: BR + 2, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  thumbInner: { width: TW, height: TH, borderRadius: BR, overflow: 'hidden', backgroundColor: T.surface, borderWidth: 2, borderColor: T.white },
  thumbImage: { width: '100%', height: '100%' },
  thumbPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.surface },
  starBadgeWrapper: { position: 'absolute', top: 10, left: 50, backgroundColor: '#FEF3C7', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: T.white, zIndex: 2 },
  starBadge: { position: 'absolute', top: -3, right: 6, backgroundColor: '#FEF3C7', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: T.white },
  thumbRingEmpty: { width: RW, height: RH, borderRadius: BR + 2, borderWidth: 2, borderColor: T.cardBorder, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  thumbInnerEmpty: { width: TW, height: TH, borderRadius: BR, justifyContent: 'center', alignItems: 'center', backgroundColor: T.surface },
  exerciseTextBlock: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: '800', color: T.text, lineHeight: 20, marginBottom: 4 },
  weightBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: '#FEF3C7', alignSelf: 'flex-start' },
  weightText: { fontSize: 12, fontWeight: '700', color: '#B45309' },
  notYetText: { fontSize: 11, color: T.textMuted, fontStyle: 'italic' },
  emptySlotText: { fontSize: 10, color: T.textMuted, marginTop: 6 },
  emptyCard: { backgroundColor: T.surface, borderRadius: 16, padding: 24, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: T.cardBorder },
  emptyText: { fontSize: 14, fontWeight: '600', color: T.textSecondary },
  emptySub: { fontSize: 12, color: T.textMuted, textAlign: 'center' },
});

export default FavoriteExercisesCard;
