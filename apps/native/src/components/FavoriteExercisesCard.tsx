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

// ─── Theme ───
const T = {
  accent: '#7C3AED',
  accentLight: '#EDE9FE',
  accentSecondary: '#A855F7',
  text: '#1F1F1F',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  starred: '#F59E0B',
  white: '#FFFFFF',
  surface: '#F8F7FC',
  cardBorder: '#EDE8F5',
};

interface FavoriteExercisesCardProps {
  onViewAll?: () => void;
}

export const FavoriteExercisesCard = ({ onViewAll }: FavoriteExercisesCardProps) => {
  const { getStarredExercises } = usePreferencesStore();
  const starred = getStarredExercises();
  const [stats, setStats] = useState<Record<string, any>>({});
  const [loadingStats, setLoadingStats] = useState(false);

  // Fetch stats for all starred exercises
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
            if (res.ok) {
              const data = await res.json();
              results[s.exerciseId] = data;
            }
          } catch { /* skip */ }
        })
      );
      if (!cancelled) {
        setStats(results);
        setLoadingStats(false);
      }
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
              <Ionicons name="arrow-forward" size={14} color={T.accent} />
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
            <Ionicons name="arrow-forward" size={14} color={T.accent} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.exercisesRow}>
        {starred.map((exercise) => {
          const hasVideo = isValidVideoUrl(exercise.videoUrl);
          const thumbUrl = hasVideo
            ? `${exercise.videoUrl?.replace('/upload/', '/upload/w_300,h_300,c_fill,so_1/')?.replace('.mp4', '.jpg')}`
            : null;
          const stat = stats[exercise.exerciseId];
          const hasHistory = stat?.history && stat.history.length > 0;
          const pb = hasHistory ? (stat.personalBest?.weight || stat.history[0]?.maxWeight) : null;

          return (
            <View key={exercise.exerciseId} style={styles.exerciseItem}>
              {/* Purple ring around thumbnail */}
              <View style={styles.thumbRing}>
                <LinearGradient
                  colors={[T.accent, T.accentSecondary]}
                  style={styles.thumbRingGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.thumbInner}>
                    {thumbUrl ? (
                      <Image source={{ uri: thumbUrl }} style={styles.thumbImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.thumbPlaceholder}>
                        <Ionicons name="barbell-outline" size={22} color={T.textMuted} />
                      </View>
                    )}
                  </View>
                </LinearGradient>
                {/* Star icon */}
                <View style={styles.starIcon}>
                  <Ionicons name="star" size={10} color={T.starred} />
                </View>
              </View>

              {/* Name */}
              <Text style={styles.exerciseName} numberOfLines={2}>
                {exercise.exerciseName}
              </Text>

              {/* Weight or "Not yet" */}
              {loadingStats ? (
                <ActivityIndicator size="small" color={T.accent} style={{ marginTop: 2 }} />
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

        {/* Empty slots */}
        {Array.from({ length: 3 - starred.length }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.exerciseItem}>
            <View style={styles.thumbRingEmpty}>
              <View style={styles.thumbInnerEmpty}>
                <Ionicons name="add" size={22} color={T.textMuted} />
              </View>
            </View>
            <Text style={styles.emptySlotText}>Empty slot</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const THUMB_SIZE = 72;
const RING_SIZE = THUMB_SIZE + 6;

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: T.text },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 14, backgroundColor: T.accentLight },
  viewAllText: { fontSize: 13, fontWeight: '600', color: T.accent },

  exercisesRow: { flexDirection: 'row', justifyContent: 'space-around', gap: 8 },

  exerciseItem: { alignItems: 'center', width: (1 / 3) * 100 + '%' as any, maxWidth: 110 },

  // Purple ring
  thumbRing: { width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2, position: 'relative' },
  thumbRingGradient: { width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2, justifyContent: 'center', alignItems: 'center' },
  thumbInner: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: THUMB_SIZE / 2, overflow: 'hidden', backgroundColor: T.surface, borderWidth: 2, borderColor: T.white },
  thumbImage: { width: '100%', height: '100%' },
  thumbPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.surface },
  starIcon: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#FEF3C7', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: T.white },

  // Empty ring
  thumbRingEmpty: { width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2, borderWidth: 2, borderColor: T.cardBorder, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  thumbInnerEmpty: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: THUMB_SIZE / 2, justifyContent: 'center', alignItems: 'center', backgroundColor: T.surface },

  exerciseName: { fontSize: 11, fontWeight: '600', color: T.text, textAlign: 'center', marginTop: 6, lineHeight: 14 },

  weightBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: '#FEF3C7' },
  weightText: { fontSize: 10, fontWeight: '700', color: '#B45309' },

  notYetText: { fontSize: 10, color: T.textMuted, marginTop: 3, fontStyle: 'italic' },
  emptySlotText: { fontSize: 10, color: T.textMuted, marginTop: 6 },

  // Empty card
  emptyCard: { backgroundColor: T.surface, borderRadius: 16, padding: 24, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: T.cardBorder },
  emptyText: { fontSize: 14, fontWeight: '600', color: T.textSecondary },
  emptySub: { fontSize: 12, color: T.textMuted, textAlign: 'center' },
});

export default FavoriteExercisesCard;
