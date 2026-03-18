/**
 * FavoriteExercisesCard - Shows 3 starred favorite exercises
 * Reads from preferences-store (starred exercises), fetches stats from API
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS as THEME_COLORS } from '../constants/colors';
import { getApiBaseUrl } from '../services/env';
import { usePreferencesStore } from '../stores/preferences-store';

const COLORS = {
  accent: THEME_COLORS.gradientStart,
  accentSecondary: THEME_COLORS.gradientEnd,
  white: THEME_COLORS.white,
  text: THEME_COLORS.text,
  lightGray: THEME_COLORS.lightGray,
  mediumGray: THEME_COLORS.mediumGray,
  success: THEME_COLORS.success,
};

const API_BASE_URL = getApiBaseUrl();

// Cloudinary thumbnail helper
const getThumbUrl = (videoUrl: string | undefined) => {
  if (!videoUrl?.includes('cloudinary')) return null;
  return videoUrl
    .replace('/video/upload/', '/video/upload/so_0,f_jpg,w_200,h_200,c_fill,g_center/')
    .replace('.mp4', '.jpg');
};

interface ExerciseStats {
  exerciseId: string;
  exerciseName: string;
  videoUrl?: string;
  actualPB?: number;
  estimatedOneRM?: number;
  trend?: 'up' | 'down' | 'neutral';
  sessions?: number;
}

interface Props {
  onViewAll: () => void;
  onExercisePress: (exerciseId: string) => void;
  refreshTrigger?: number;
}

export const FavoriteExercisesCard = ({ onViewAll, onExercisePress, refreshTrigger }: Props) => {
  const { getStarredExercises } = usePreferencesStore();
  const starred = getStarredExercises();
  const [stats, setStats] = useState<Record<string, ExerciseStats>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (starred.length === 0) { setIsLoading(false); return; }
    try {
      let token: string | null = null;
      try { token = await SecureStore.getItemAsync('thryvin_access_token'); } catch {}
      if (!token) { setIsLoading(false); return; }

      const results: Record<string, ExerciseStats> = {};
      await Promise.all(
        starred.map(async (s) => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/stats/exercise/${s.exerciseId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              results[s.exerciseId] = {
                exerciseId: s.exerciseId,
                exerciseName: s.exerciseName,
                videoUrl: s.videoUrl,
                actualPB: data.personalBest?.weight,
                estimatedOneRM: data.personalBest?.estimatedOneRM,
                sessions: data.history?.length || 0,
                trend: data.trend || 'neutral',
              };
            }
          } catch {}
        })
      );
      setStats(results);
    } catch (err) {
      console.error('Error fetching starred stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [starred.length]);

  useEffect(() => { fetchStats(); }, [fetchStats, refreshTrigger]);
  useFocusEffect(useCallback(() => { fetchStats(); }, [fetchStats]));

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Favourite Exercises</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.accent} />
        </View>
      </View>
    );
  }

  if (starred.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Favourite Exercises</Text>
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAll}>Explore</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.emptyCard} onPress={onViewAll}>
          <Ionicons name="star-outline" size={28} color={COLORS.mediumGray} />
          <Text style={styles.emptyText}>Star up to 3 exercises in Explore</Text>
          <Text style={styles.emptySubtext}>They'll appear here with your stats</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Favourite Exercises</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cardRow}>
        {starred.map((s) => {
          const st = stats[s.exerciseId];
          const thumbUrl = getThumbUrl(s.videoUrl);
          return (
            <TouchableOpacity
              key={s.exerciseId}
              style={styles.card}
              onPress={() => onExercisePress(s.exerciseId)}
              activeOpacity={0.8}
              data-testid={`fav-card-${s.exerciseId}`}
            >
              {thumbUrl ? (
                <Image source={{ uri: thumbUrl }} style={styles.cardThumb} resizeMode="cover" />
              ) : (
                <LinearGradient colors={[COLORS.accent, COLORS.accentSecondary]} style={styles.cardThumb}>
                  <Ionicons name="barbell" size={18} color={COLORS.white} />
                </LinearGradient>
              )}
              <Ionicons name="star" size={12} color="#FFB800" style={styles.starIcon} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={2}>{s.exerciseName}</Text>
                {st && st.sessions && st.sessions > 0 ? (
                  <View style={styles.statRow}>
                    <Text style={styles.statPB}>{st.actualPB || '—'} kg</Text>
                    <Ionicons
                      name={st.trend === 'up' ? 'trending-up' : st.trend === 'down' ? 'trending-down' : 'remove'}
                      size={14}
                      color={st.trend === 'up' ? COLORS.success : st.trend === 'down' ? '#FF3B30' : COLORS.mediumGray}
                    />
                  </View>
                ) : (
                  <Text style={styles.noStat}>No sessions yet</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
        {/* Empty slots */}
        {starred.length < 3 && Array.from({ length: 3 - starred.length }).map((_, i) => (
          <TouchableOpacity key={`empty-${i}`} style={styles.emptySlot} onPress={onViewAll}>
            <Ionicons name="add" size={20} color={COLORS.mediumGray} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  viewAll: { fontSize: 13, fontWeight: '600', color: COLORS.accent },

  loadingContainer: { height: 80, justifyContent: 'center', alignItems: 'center' },

  emptyCard: { alignItems: 'center', padding: 20, backgroundColor: COLORS.lightGray, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.mediumGray, gap: 4 },
  emptyText: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 4 },
  emptySubtext: { fontSize: 12, color: COLORS.mediumGray },

  cardRow: { flexDirection: 'row', gap: 10 },
  card: { flex: 1, backgroundColor: COLORS.lightGray, borderRadius: 14, overflow: 'hidden' },
  cardThumb: { width: '100%', height: 56, justifyContent: 'center', alignItems: 'center' },
  starIcon: { position: 'absolute', top: 4, right: 4 },
  cardInfo: { padding: 8 },
  cardName: { fontSize: 12, fontWeight: '700', color: COLORS.text, lineHeight: 15 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  statPB: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
  noStat: { fontSize: 10, color: COLORS.mediumGray, marginTop: 2 },

  emptySlot: { flex: 1, height: 100, backgroundColor: COLORS.lightGray, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.mediumGray },
});
