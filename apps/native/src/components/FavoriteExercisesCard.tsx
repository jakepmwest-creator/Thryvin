import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { isValidVideoUrl } from './ExerciseVideoPlayer';
import { usePreferencesStore } from '../stores/preferences-store';
import { getApiBaseUrl } from '../services/env';

const API_BASE_URL = getApiBaseUrl();

const T = {
  gradientStart: '#A22BF6',
  gradientEnd: '#FF4EC7',
  text: '#1F1F1F',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  starred: '#F59E0B',
  white: '#FFFFFF',
  surface: '#F8F7FC',
  cardBorder: '#EDE8F5',
  accentLight: '#EDE9FE',
};

interface FavoriteExercisesCardProps {
  onViewAll?: () => void;
}

export const FavoriteExercisesCard = ({ onViewAll }: FavoriteExercisesCardProps) => {
  const { getStarredExercises } = usePreferencesStore();
  const starred = getStarredExercises();
  const [stats, setStats] = useState<Record<string, any>>({});
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (starred.length === 0) return;
    let cancelled = false;
    (async () => {
      setLoadingStats(true);
      const results: Record<string, any> = {};
      await Promise.all(
        starred.map(async (s) => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/stats/exercise/${s.exerciseId}`);
            if (res.ok) results[s.exerciseId] = await res.json();
          } catch { /* skip */ }
        })
      );
      if (!cancelled) { setStats(results); setLoadingStats(false); }
    })();
    return () => { cancelled = true; };
  }, [starred.length]);

  if (starred.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Ionicons name="star" size={18} color={T.starred} />
            <Text style={styles.headerTitle}>Favourite Exercises</Text>
          </View>
          {onViewAll && (
            <TouchableOpacity onPress={onViewAll} style={styles.viewAllBtn} data-testid="fav-view-all-btn">
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="arrow-forward" size={14} color={T.gradientStart} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.emptyCard}>
          <Ionicons name="star-outline" size={32} color={T.textMuted} />
          <Text style={styles.emptyText}>No favourites yet</Text>
          <Text style={styles.emptySub}>Star up to 3 exercises to track them here</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} data-testid="favorite-exercises-card">
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="star" size={18} color={T.starred} />
          <Text style={styles.headerTitle}>Favourite Exercises</Text>
        </View>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll} style={styles.viewAllBtn} data-testid="fav-view-all-btn">
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="arrow-forward" size={14} color={T.gradientStart} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.exercisesRow}>
        {starred.map((exercise) => {
          const hasVideo = isValidVideoUrl(exercise.videoUrl);
          const thumbUrl = hasVideo
            ? `${exercise.videoUrl?.replace('/upload/', '/upload/w_300,h_400,c_fill,so_1/')?.replace('.mp4', '.jpg')}`
            : null;
          const stat = stats[exercise.exerciseId];
          const hasHistory = stat?.history && stat.history.length > 0;
          const pb = hasHistory ? (stat.personalBest?.weight || stat.history[0]?.maxWeight) : null;

          return (
            <View key={exercise.exerciseId} style={styles.exerciseItem}>
              <LinearGradient
                colors={[T.gradientStart, T.gradientEnd]}
                style={styles.thumbRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.thumbInner}>
                  {thumbUrl ? (
                    <Image source={{ uri: thumbUrl }} style={styles.thumbImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.thumbPlaceholder}>
                      <Ionicons name="barbell-outline" size={20} color={T.textMuted} />
                    </View>
                  )}
                </View>
              </LinearGradient>
              <View style={styles.starBadge}>
                <Ionicons name="star" size={9} color={T.starred} />
              </View>
              <Text style={styles.exerciseName} numberOfLines={2}>{exercise.exerciseName}</Text>
              {loadingStats ? (
                <ActivityIndicator size="small" color={T.gradientStart} style={{ marginTop: 2 }} />
              ) : pb ? (
                <View style={styles.weightBadge}>
                  <Ionicons name="trophy" size={10} color={T.starred} />
                  <Text style={styles.weightText}>{pb} kg</Text>
                </View>
              ) : (
                <Text style={styles.notYetText}>Not yet completed</Text>
              )}
            </View>
          );
        })}

        {Array.from({ length: 3 - starred.length }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.exerciseItem}>
            <View style={styles.thumbRingEmpty}>
              <View style={styles.thumbInnerEmpty}>
                <Ionicons name="add" size={20} color={T.textMuted} />
              </View>
            </View>
            <Text style={styles.emptySlotText}>Empty slot</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const THUMB_W = 72;
const THUMB_H = 88;
const RING_W = THUMB_W + 6;
const RING_H = THUMB_H + 6;
const BORDER_RADIUS = 16;

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: T.text },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 14, backgroundColor: T.accentLight },
  viewAllText: { fontSize: 13, fontWeight: '600', color: T.gradientStart },

  exercisesRow: { flexDirection: 'row', justifyContent: 'space-around', gap: 8 },
  exerciseItem: { alignItems: 'center', width: 90, position: 'relative' },

  // Rounded rectangle ring (purple-to-pink gradient border)
  thumbRing: { width: RING_W, height: RING_H, borderRadius: BORDER_RADIUS + 2, justifyContent: 'center', alignItems: 'center' },
  thumbInner: { width: THUMB_W, height: THUMB_H, borderRadius: BORDER_RADIUS, overflow: 'hidden', backgroundColor: T.surface, borderWidth: 2, borderColor: T.white },
  thumbImage: { width: '100%', height: '100%' },
  thumbPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.surface },
  starBadge: { position: 'absolute', top: -3, right: 6, backgroundColor: '#FEF3C7', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: T.white },

  thumbRingEmpty: { width: RING_W, height: RING_H, borderRadius: BORDER_RADIUS + 2, borderWidth: 2, borderColor: T.cardBorder, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  thumbInnerEmpty: { width: THUMB_W, height: THUMB_H, borderRadius: BORDER_RADIUS, justifyContent: 'center', alignItems: 'center', backgroundColor: T.surface },

  exerciseName: { fontSize: 11, fontWeight: '600', color: T.text, textAlign: 'center', marginTop: 6, lineHeight: 14 },
  weightBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: '#FEF3C7' },
  weightText: { fontSize: 10, fontWeight: '700', color: '#B45309' },
  notYetText: { fontSize: 10, color: T.textMuted, marginTop: 3, fontStyle: 'italic' },
  emptySlotText: { fontSize: 10, color: T.textMuted, marginTop: 6 },

  emptyCard: { backgroundColor: T.surface, borderRadius: 16, padding: 24, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: T.cardBorder },
  emptyText: { fontSize: 14, fontWeight: '600', color: T.textSecondary },
  emptySub: { fontSize: 12, color: T.textMuted, textAlign: 'center' },
});

export default FavoriteExercisesCard;
