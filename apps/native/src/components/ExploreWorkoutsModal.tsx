import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PreviewVideoPlayer, isValidVideoUrl } from './ExerciseVideoPlayer';
import { usePreferencesStore } from '../stores/preferences-store';
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
  filterBg: '#1E1E1E',
};

// Cloudinary thumbnail helper
const getThumbUrl = (videoUrl: string) => {
  if (!videoUrl?.includes('cloudinary')) return null;
  return videoUrl
    .replace('/video/upload/', '/video/upload/so_0,f_jpg,w_400,h_400,c_fill,g_center/')
    .replace('.mp4', '.jpg');
};

interface ExploreWorkoutsModalProps {
  visible: boolean;
  onClose: () => void;
  category: string;
  categoryGradient: string[];
}

// Equipment filter options per category
const EQUIPMENT_FILTERS: Record<string, { id: string; label: string }[]> = {
  Weights: [
    { id: 'all', label: 'All' },
    { id: 'dumbbell', label: 'Dumbbells' },
    { id: 'barbell', label: 'Barbells' },
    { id: 'machine', label: 'Machines' },
    { id: 'cable', label: 'Cables' },
  ],
  Calisthenics: [
    { id: 'all', label: 'All' },
    { id: 'bodyweight', label: 'Bodyweight' },
    { id: 'bar', label: 'Pull-up Bar' },
    { id: 'rings', label: 'Rings' },
  ],
  Cardio: [
    { id: 'all', label: 'All' },
    { id: 'machine', label: 'Machines' },
    { id: 'outdoor', label: 'Outdoor' },
  ],
  Flexibility: [
    { id: 'all', label: 'All' },
    { id: 'static', label: 'Static' },
    { id: 'dynamic', label: 'Dynamic' },
    { id: 'yoga', label: 'Yoga' },
  ],
};

const DIFFICULTY_OPTIONS = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const;

// ---------- Tile Component ----------
const ExerciseTile = React.memo(({ exercise, onPress }: { exercise: any; onPress: () => void }) => {
  const { getPreference, likeExercise, dislikeExercise, removePreference } = usePreferencesStore();
  const preference = getPreference(exercise.id);
  const thumbUrl = getThumbUrl(exercise.videoUrl);
  const hasVideo = isValidVideoUrl(exercise.videoUrl);

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
      style={styles.tile}
      onPress={onPress}
      activeOpacity={0.85}
      data-testid={`exercise-tile-${exercise.id}`}
    >
      {/* Thumbnail / Placeholder */}
      <View style={styles.tileThumb}>
        {hasVideo && thumbUrl ? (
          <Image source={{ uri: thumbUrl }} style={styles.tileImage} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#222', '#333']} style={styles.tilePlaceholder}>
            <Ionicons name="barbell-outline" size={28} color="rgba(255,255,255,0.3)" />
          </LinearGradient>
        )}
        {/* Difficulty badge */}
        {exercise.difficulty && (
          <View style={[
            styles.diffBadge,
            exercise.difficulty === 'Beginner' && { backgroundColor: '#34C75930' },
            exercise.difficulty === 'Advanced' && { backgroundColor: '#FF3B3030' },
          ]}>
            <Text style={[
              styles.diffText,
              exercise.difficulty === 'Beginner' && { color: '#34C759' },
              exercise.difficulty === 'Advanced' && { color: '#FF3B30' },
            ]}>
              {exercise.difficulty}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.tileInfo}>
        <Text style={styles.tileName} numberOfLines={2}>{exercise.name}</Text>
        <Text style={styles.tileMeta} numberOfLines={1}>
          {exercise.muscleGroups?.join(', ') || exercise.bodyPart || 'Full Body'}
        </Text>
      </View>

      {/* Like / Dislike row */}
      <View style={styles.tileActions}>
        <TouchableOpacity onPress={handleLike} style={styles.tileActionBtn} data-testid={`like-btn-${exercise.id}`}>
          <Ionicons
            name={preference === 'liked' ? 'heart' : 'heart-outline'}
            size={18}
            color={preference === 'liked' ? COLORS.liked : COLORS.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDislike} style={styles.tileActionBtn} data-testid={`dislike-btn-${exercise.id}`}>
          <Ionicons
            name={preference === 'disliked' ? 'thumbs-down' : 'thumbs-down-outline'}
            size={18}
            color={preference === 'disliked' ? COLORS.disliked : COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

// ---------- Filter Sheet ----------
const FilterSheet = ({
  visible,
  onClose,
  difficulty,
  setDifficulty,
  equipment,
  setEquipment,
  equipmentOptions,
}: any) => {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.filterOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.filterSheet}>
          <View style={styles.filterHandle} />
          <Text style={styles.filterTitle}>Filter Exercises</Text>

          <Text style={styles.filterLabel}>Difficulty</Text>
          <View style={styles.filterRow}>
            {DIFFICULTY_OPTIONS.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.filterChip, difficulty === d && styles.filterChipActive]}
                onPress={() => setDifficulty(d)}
              >
                <Text style={[styles.filterChipText, difficulty === d && styles.filterChipTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Equipment</Text>
          <View style={styles.filterRow}>
            {equipmentOptions.map((eq: any) => (
              <TouchableOpacity
                key={eq.id}
                style={[styles.filterChip, equipment === eq.id && styles.filterChipActive]}
                onPress={() => setEquipment(eq.id)}
              >
                <Text style={[styles.filterChipText, equipment === eq.id && styles.filterChipTextActive]}>{eq.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.filterApplyBtn} onPress={onClose}>
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={styles.filterApplyGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.filterApplyText}>Apply</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ---------- Detail Dropdown ----------
const ExerciseDetail = ({ exercise, categoryGradient, onClose }: any) => {
  const hasVideo = isValidVideoUrl(exercise?.videoUrl);
  if (!exercise) return null;

  return (
    <Modal visible={!!exercise} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.detailOverlay}>
        <View style={styles.detailSheet}>
          <TouchableOpacity onPress={onClose} style={styles.detailCloseBtn}>
            <Ionicons name="close" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>

          {/* Video or Header */}
          {hasVideo ? (
            <View style={styles.detailVideo}>
              <PreviewVideoPlayer videoUrl={exercise.videoUrl} exerciseName={exercise.name} />
            </View>
          ) : (
            <LinearGradient colors={categoryGradient} style={styles.detailHeaderGradient}>
              <Ionicons name="barbell" size={36} color={COLORS.white} />
            </LinearGradient>
          )}

          <View style={styles.detailBody}>
            <Text style={styles.detailName}>{exercise.name}</Text>

            <View style={styles.detailTags}>
              {exercise.difficulty && (
                <View style={styles.detailTag}>
                  <Ionicons name="speedometer-outline" size={14} color={COLORS.accent} />
                  <Text style={styles.detailTagText}>{exercise.difficulty}</Text>
                </View>
              )}
              <View style={styles.detailTag}>
                <Ionicons name="body-outline" size={14} color={COLORS.accent} />
                <Text style={styles.detailTagText}>
                  {exercise.muscleGroups?.join(', ') || exercise.bodyPart || 'Full Body'}
                </Text>
              </View>
              {exercise.equipment && (
                <View style={styles.detailTag}>
                  <Ionicons name="fitness-outline" size={14} color={COLORS.accent} />
                  <Text style={styles.detailTagText}>
                    {Array.isArray(exercise.equipment) ? exercise.equipment.join(', ') : exercise.equipment}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.detailDesc}>
              {exercise.description || 'Perform this exercise with proper form and controlled movements. Focus on muscle engagement throughout the full range of motion.'}
            </Text>

            {exercise.tips && exercise.tips.length > 0 && (
              <View style={styles.tipsSection}>
                <Text style={styles.tipsHeader}>Form Tips</Text>
                {exercise.tips.map((tip: string, i: number) => (
                  <View key={i} style={styles.tipRow}>
                    <View style={styles.tipNum}>
                      <Text style={styles.tipNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ---------- Main Modal ----------
export const ExploreWorkoutsModal = ({ visible, onClose, category, categoryGradient }: ExploreWorkoutsModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<typeof DIFFICULTY_OPTIONS[number]>('All');
  const [filterEquipment, setFilterEquipment] = useState('all');
  const [showFilter, setShowFilter] = useState(false);
  const [exercises, setExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      } catch (e) {
        console.error('Failed to fetch exercises:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [visible]);

  // Reset filters when closing
  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setFilterDifficulty('All');
      setFilterEquipment('all');
      setSelectedExercise(null);
    }
  }, [visible]);

  // Category-specific keyword lists
  const equipmentKeywords = ['dumbbell', 'barbell', 'cable', 'machine', 'kettlebell', 'smith', 'ez bar', 'bench press', 'lat pull', 'pulldown', 'leg press', 'chest press', 'shoulder press', 'weight', 'weighted', 'press', 'curl', 'fly', 'row', 'pullover', 'extension', 'raise'];
  const cardioKeywords = ['cardio', 'running', 'cycling', 'rowing', 'swimming', 'jump rope', 'treadmill', 'elliptical', 'stair', 'hiit', 'jumping jack', 'burpee', 'mountain climber'];
  const flexKeywords = ['stretch', 'yoga', 'mobility', 'warmup', 'warm-up', 'recovery', 'foam roll', 'flexibility'];

  const filteredExercises = useMemo(() => {
    if (isLoading) return [];
    let filtered = exercises;

    // Category filter
    if (category && category !== 'All') {
      filtered = filtered.filter(ex => {
        const exCat = (ex.category || '').toLowerCase();
        const exName = (ex.name || '').toLowerCase();
        const eqArr = Array.isArray(ex.equipment) ? ex.equipment : [];
        const eqStr = eqArr.map((e: any) => String(e).toLowerCase()).join(' ');
        const nameHasEq = equipmentKeywords.some(kw => exName.includes(kw));
        const fieldHasEq = eqArr.length > 0 && !eqStr.includes('bodyweight');
        const isCardio = cardioKeywords.some(kw => exCat.includes(kw) || exName.includes(kw));
        const isFlex = flexKeywords.some(kw => exCat.includes(kw) || exName.includes(kw));
        if (category === 'Weights') return (nameHasEq || fieldHasEq) && !isCardio && !isFlex;
        if (category === 'Calisthenics') return !nameHasEq && !fieldHasEq && !isCardio && !isFlex;
        if (category === 'Cardio') return isCardio;
        if (category === 'Flexibility') return isFlex;
        return true;
      });
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
  }, [exercises, searchQuery, filterDifficulty, filterEquipment, category, isLoading]);

  const activeFilterCount = (filterDifficulty !== 'All' ? 1 : 0) + (filterEquipment !== 'all' ? 1 : 0);
  const equipmentOptions = EQUIPMENT_FILTERS[category] || EQUIPMENT_FILTERS['Weights'];

  const renderTile = useCallback(({ item }: { item: any }) => (
    <ExerciseTile exercise={item} onPress={() => setSelectedExercise(item)} />
  ), []);

  const keyExtractor = useCallback((item: any) => item.id?.toString(), []);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Gradient Banner */}
          <LinearGradient
            colors={categoryGradient as any}
            style={styles.banner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity onPress={onClose} style={styles.backBtn} data-testid="explore-close-btn">
              <Ionicons name="chevron-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.bannerTitle}>{category}</Text>
            <Text style={styles.bannerSub}>
              {isLoading ? 'Loading...' : `${filteredExercises.length} exercises`}
            </Text>
          </LinearGradient>

          {/* Search + Filter row */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={COLORS.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${category.toLowerCase()}...`}
                placeholderTextColor={COLORS.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                data-testid="explore-search-input"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => setShowFilter(true)}
              data-testid="explore-filter-btn"
            >
              <Ionicons name="options" size={20} color={COLORS.white} />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Tile Grid */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.loadingText}>Loading exercises...</Text>
            </View>
          ) : filteredExercises.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={COLORS.textSecondary} />
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
            equipmentOptions={equipmentOptions}
          />

          {/* Exercise Detail */}
          <ExerciseDetail
            exercise={selectedExercise}
            categoryGradient={categoryGradient}
            onClose={() => setSelectedExercise(null)}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  container: { flex: 1, backgroundColor: COLORS.bg, marginTop: 40, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },

  // Banner
  banner: { paddingTop: 16, paddingBottom: 20, paddingHorizontal: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  bannerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  bannerSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  // Search + Filter
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.filterBg, borderRadius: 12, paddingHorizontal: 12, gap: 8, borderWidth: 1, borderColor: COLORS.cardBorder },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: COLORS.text },
  filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  filterBadge: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.accentSecondary, justifyContent: 'center', alignItems: 'center' },
  filterBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.white },

  // Grid
  gridContent: { paddingHorizontal: 16, paddingBottom: 120 },
  gridRow: { justifyContent: 'space-between', marginBottom: TILE_GAP },

  // Tile
  tile: { width: TILE_WIDTH, backgroundColor: COLORS.card, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.cardBorder },
  tileThumb: { width: '100%', height: TILE_WIDTH * 0.75, backgroundColor: '#222' },
  tileImage: { width: '100%', height: '100%' },
  tilePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  diffBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(162,43,246,0.25)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  diffText: { fontSize: 10, fontWeight: '700', color: COLORS.accent },
  tileInfo: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 4 },
  tileName: { fontSize: 13, fontWeight: '700', color: COLORS.text, lineHeight: 17 },
  tileMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  tileActions: { flexDirection: 'row', paddingHorizontal: 8, paddingBottom: 8, paddingTop: 4, gap: 4 },
  tileActionBtn: { padding: 4 },

  // Loading / Empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.textSecondary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptySubtext: { fontSize: 13, color: COLORS.textSecondary },

  // Filter Sheet
  filterOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  filterSheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  filterHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.cardBorder, alignSelf: 'center', marginBottom: 20 },
  filterTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 20 },
  filterLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 10, marginTop: 8 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.filterBg, borderWidth: 1, borderColor: COLORS.cardBorder },
  filterChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  filterChipText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  filterChipTextActive: { fontSize: 13, fontWeight: '600', color: COLORS.white },
  filterApplyBtn: { marginTop: 20, borderRadius: 14, overflow: 'hidden' },
  filterApplyGradient: { paddingVertical: 14, alignItems: 'center', borderRadius: 14 },
  filterApplyText: { fontSize: 16, fontWeight: '700', color: COLORS.white },

  // Detail
  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  detailSheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  detailCloseBtn: { position: 'absolute', top: 14, right: 14, zIndex: 10, padding: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16 },
  detailVideo: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', backgroundColor: '#000' },
  detailHeaderGradient: { height: 100, justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  detailBody: { padding: 20, paddingBottom: 40 },
  detailName: { fontSize: 22, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  detailTags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 14, marginBottom: 16 },
  detailTag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.filterBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  detailTagText: { fontSize: 12, color: COLORS.textSecondary },
  detailDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 21, textAlign: 'center', marginBottom: 20 },
  tipsSection: { marginTop: 4 },
  tipsHeader: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  tipNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(162,43,246,0.15)', justifyContent: 'center', alignItems: 'center' },
  tipNumText: { fontSize: 11, fontWeight: '700', color: COLORS.accent },
  tipText: { flex: 1, fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
});
