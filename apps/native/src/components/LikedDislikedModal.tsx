import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePreferencesStore } from '../stores/preferences-store';
import { isValidVideoUrl } from './ExerciseVideoPlayer';
import { getApiBaseUrl } from '../services/env';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const API_BASE_URL = getApiBaseUrl();
const TILE_GAP = 10;
const TILE_WIDTH = (SCREEN_WIDTH - 48 - TILE_GAP) / 2;

const COLORS = {
  bg: '#0D0D0D',
  card: '#1A1A1A',
  cardBorder: '#2A2A2A',
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#FFFFFF',
  text: '#F5F5F5',
  textSecondary: '#9E9E9E',
  liked: '#34C759',
  disliked: '#FF3B30',
};

// Cloudinary thumbnail helper
const getThumbUrl = (videoUrl: string | undefined) => {
  if (!videoUrl?.includes('cloudinary')) return null;
  return videoUrl
    .replace('/video/upload/', '/video/upload/so_0,f_jpg,w_400,h_400,c_fill,g_center/')
    .replace('.mp4', '.jpg');
};

interface LikedDislikedModalProps {
  visible: boolean;
  onClose: () => void;
}

// Individual tile for liked/disliked exercises
const PrefTile = React.memo(({ item, onRemove }: { item: any; onRemove: () => void }) => {
  const thumbUrl = item.videoUrl ? getThumbUrl(item.videoUrl) : null;
  const isLiked = item.preference === 'liked';

  return (
    <View style={styles.tile}>
      <View style={styles.tileThumb}>
        {thumbUrl ? (
          <Image source={{ uri: thumbUrl }} style={styles.tileImage} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#222', '#333']} style={styles.tilePlaceholder}>
            <Ionicons name="barbell-outline" size={24} color="rgba(255,255,255,0.3)" />
          </LinearGradient>
        )}
        {/* Status badge */}
        <View style={[styles.statusBadge, isLiked ? styles.likedBadge : styles.dislikedBadge]}>
          <Ionicons
            name={isLiked ? 'heart' : 'thumbs-down'}
            size={10}
            color={COLORS.white}
          />
        </View>
      </View>
      <View style={styles.tileInfo}>
        <Text style={styles.tileName} numberOfLines={2}>{item.exerciseName}</Text>
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
        <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );
});

export const LikedDislikedModal = ({ visible, onClose }: LikedDislikedModalProps) => {
  const { getLikedExercises, getDislikedExercises, removePreference } = usePreferencesStore();
  const [tab, setTab] = useState<'liked' | 'disliked'>('liked');
  const [exercises, setExercises] = useState<any[]>([]);
  const [exerciseMap, setExerciseMap] = useState<Record<string, any>>({});

  // Fetch exercise data (for video URLs)
  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/exercises?limit=2000`);
        const data = await res.json();
        const map: Record<string, any> = {};
        (data.exercises || []).forEach((ex: any) => {
          map[ex.id] = ex;
          map[ex.name?.toLowerCase()] = ex;
        });
        setExerciseMap(map);
      } catch (e) {
        console.error('Failed to load exercises for modal:', e);
      }
    })();
  }, [visible]);

  const currentList = tab === 'liked' ? getLikedExercises() : getDislikedExercises();
  const likedCount = getLikedExercises().length;
  const dislikedCount = getDislikedExercises().length;

  // Enrich preferences with video URLs
  const enrichedList = currentList.map(pref => {
    const match = exerciseMap[pref.exerciseId] || exerciseMap[pref.exerciseName?.toLowerCase()];
    return {
      ...pref,
      videoUrl: match?.videoUrl,
    };
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Your Exercises</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, tab === 'liked' && styles.tabActive]}
              onPress={() => setTab('liked')}
              data-testid="liked-tab"
            >
              <Ionicons name="heart" size={16} color={tab === 'liked' ? COLORS.liked : COLORS.textSecondary} />
              <Text style={[styles.tabText, tab === 'liked' && styles.tabTextActive]}>
                Liked ({likedCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === 'disliked' && styles.tabActive]}
              onPress={() => setTab('disliked')}
              data-testid="disliked-tab"
            >
              <Ionicons name="thumbs-down" size={16} color={tab === 'disliked' ? COLORS.disliked : COLORS.textSecondary} />
              <Text style={[styles.tabText, tab === 'disliked' && { color: COLORS.disliked }]}>
                Disliked ({dislikedCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Grid */}
          {enrichedList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name={tab === 'liked' ? 'heart-outline' : 'thumbs-down-outline'}
                size={48}
                color={COLORS.textSecondary}
              />
              <Text style={styles.emptyText}>
                No {tab} exercises yet
              </Text>
              <Text style={styles.emptySub}>
                {tab === 'liked' ? 'Like exercises in Explore to see them here' : 'Disliked exercises will appear here'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={enrichedList}
              keyExtractor={(item) => item.exerciseId}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.gridContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <PrefTile item={item} onRemove={() => removePreference(item.exerciseId)} />
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  container: { flex: 1, backgroundColor: COLORS.bg, marginTop: 40, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },

  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder },
  tabActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(162,43,246,0.1)' },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.liked },

  gridContent: { paddingHorizontal: 16, paddingBottom: 120 },
  gridRow: { justifyContent: 'space-between', marginBottom: TILE_GAP },

  tile: { width: TILE_WIDTH, backgroundColor: COLORS.card, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.cardBorder },
  tileThumb: { width: '100%', height: TILE_WIDTH * 0.75, backgroundColor: '#222' },
  tileImage: { width: '100%', height: '100%' },
  tilePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusBadge: { position: 'absolute', top: 6, left: 6, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  likedBadge: { backgroundColor: COLORS.liked },
  dislikedBadge: { backgroundColor: COLORS.disliked },
  tileInfo: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 8 },
  tileName: { fontSize: 13, fontWeight: '700', color: COLORS.text, lineHeight: 17 },
  removeBtn: { position: 'absolute', top: 6, right: 6, padding: 2 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
});

export default LikedDislikedModal;
