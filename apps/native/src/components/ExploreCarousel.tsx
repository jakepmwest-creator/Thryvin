import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { isValidVideoUrl } from './ExerciseVideoPlayer';
import { usePreferencesStore } from '../stores/preferences-store';
import { getApiBaseUrl } from '../services/env';

const API_BASE_URL = getApiBaseUrl();
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 64;
const CARD_MARGIN = 8;

// ─── Light Thriving Theme ───
const T = {
  bg: '#FFFFFF',
  surface: '#F8F7FC',
  card: '#FFFFFF',
  cardBorder: '#EDE8F5',
  accent: '#7C3AED',
  accentLight: '#EDE9FE',
  accentSecondary: '#A855F7',
  text: '#1F1F1F',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  liked: '#10B981',
  disliked: '#EF4444',
  starred: '#F59E0B',
  white: '#FFFFFF',
};

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  Weights: ['#6366F1', '#818CF8'],
  Calisthenics: ['#F59E0B', '#FBBF24'],
  Cardio: ['#EF4444', '#F87171'],
  Flexibility: ['#10B981', '#34D399'],
};

// ─── Carousel Card ───
const CarouselCard = memo(({ exercise, onPress, onLike, onDislike }: {
  exercise: any; onPress: () => void; onLike: () => void; onDislike: () => void;
}) => {
  const { getPreference, isStarred } = usePreferencesStore();
  const preference = getPreference(exercise.id);
  const starred = isStarred(exercise.id);
  const hasVideo = isValidVideoUrl(exercise?.videoUrl);
  const thumbUrl = exercise.thumbnailUrl || (hasVideo
    ? `${exercise.videoUrl?.replace('/upload/', '/upload/w_600,h_400,c_fill,so_1/')?.replace('.mp4', '.jpg')}`
    : null);

  const categoryKey = exercise.bodyPart || 'Weights';
  const gradient = CATEGORY_GRADIENTS[categoryKey] || CATEGORY_GRADIENTS.Weights;

  return (
    <TouchableOpacity
      style={cardStyles.card}
      onPress={onPress}
      activeOpacity={0.9}
      data-testid={`carousel-card-${exercise.id}`}
    >
      {/* Image */}
      <View style={cardStyles.imageWrapper}>
        {thumbUrl ? (
          <Image source={{ uri: thumbUrl }} style={cardStyles.image} resizeMode="cover" />
        ) : (
          <LinearGradient colors={gradient} style={cardStyles.placeholderGradient}>
            <Ionicons name="barbell-outline" size={36} color="rgba(255,255,255,0.5)" />
          </LinearGradient>
        )}
        {/* Overlay gradient for text readability */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)']}
          style={cardStyles.imageOverlay}
        />

        {/* Category pill */}
        <View style={cardStyles.categoryPill}>
          <Text style={cardStyles.categoryPillText}>{exercise.category || exercise.bodyPart || 'Exercise'}</Text>
        </View>

        {/* Star badge */}
        {starred && (
          <View style={cardStyles.starBadge}>
            <Ionicons name="star" size={14} color={T.starred} />
          </View>
        )}

        {/* Bottom content over image */}
        <View style={cardStyles.imageContent}>
          <Text style={cardStyles.exerciseName} numberOfLines={2}>{exercise.name}</Text>
          <Text style={cardStyles.exerciseMeta}>
            {exercise.muscleGroups?.join(', ') || exercise.bodyPart || 'Full Body'}
            {exercise.difficulty ? ` \u2022 ${exercise.difficulty}` : ''}
          </Text>
        </View>
      </View>

      {/* Quick actions */}
      <View style={cardStyles.actionsRow}>
        <TouchableOpacity
          onPress={onLike}
          style={[cardStyles.actionBtn, preference === 'liked' && { backgroundColor: '#DCFCE7' }]}
          data-testid={`carousel-like-${exercise.id}`}
        >
          <Ionicons name={preference === 'liked' ? 'heart' : 'heart-outline'} size={20} color={preference === 'liked' ? T.liked : T.textMuted} />
          <Text style={[cardStyles.actionText, preference === 'liked' && { color: T.liked }]}>Like</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onDislike}
          style={[cardStyles.actionBtn, preference === 'disliked' && { backgroundColor: '#FEE2E2' }]}
          data-testid={`carousel-dislike-${exercise.id}`}
        >
          <Ionicons name={preference === 'disliked' ? 'thumbs-down' : 'thumbs-down-outline'} size={20} color={preference === 'disliked' ? T.disliked : T.textMuted} />
          <Text style={[cardStyles.actionText, preference === 'disliked' && { color: T.disliked }]}>Pass</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onPress} style={[cardStyles.actionBtn, { backgroundColor: T.accentLight }]} data-testid={`carousel-details-${exercise.id}`}>
          <Ionicons name="information-circle-outline" size={20} color={T.accent} />
          <Text style={[cardStyles.actionText, { color: T.accent }]}>Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

const cardStyles = StyleSheet.create({
  card: { width: CARD_WIDTH, marginHorizontal: CARD_MARGIN, borderRadius: 20, backgroundColor: T.card, overflow: 'hidden', borderWidth: 1, borderColor: T.cardBorder, shadowColor: 'rgba(124,58,237,0.12)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16, elevation: 5 },
  imageWrapper: { width: '100%', height: 180, position: 'relative' },
  image: { width: '100%', height: '100%' },
  placeholderGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  categoryPill: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  categoryPillText: { fontSize: 11, fontWeight: '600', color: T.accent },
  starBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#FEF3C7', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  imageContent: { position: 'absolute', bottom: 12, left: 14, right: 14 },
  exerciseName: { fontSize: 18, fontWeight: '700', color: T.white, letterSpacing: -0.3 },
  exerciseMeta: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  actionsRow: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 10, gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 12, backgroundColor: T.surface },
  actionText: { fontSize: 12, fontWeight: '600', color: T.textSecondary },
});

// ─── Explore Carousel (for workouts tab) ───
interface ExploreCarouselProps {
  onOpenExplore: () => void;
}

export const ExploreCarousel = ({ onOpenExplore }: ExploreCarouselProps) => {
  const [exercises, setExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
        // Random shuffle and pick 15
        const shuffled = allExercises.sort(() => Math.random() - 0.5).slice(0, 15);
        setExercises(shuffled);
      } catch (e) { console.error('Carousel fetch failed:', e); }
      finally { setIsLoading(false); }
    })();
  }, []);

  // Auto-scroll every 5 seconds
  useEffect(() => {
    if (exercises.length === 0) return;
    autoScrollTimer.current = setInterval(() => {
      currentIndex.current = (currentIndex.current + 1) % exercises.length;
      flatListRef.current?.scrollToIndex({
        index: currentIndex.current,
        animated: true,
      });
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
        <View style={styles.headerRow}>
          <Text style={styles.title}>Explore Exercises</Text>
        </View>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Loading exercises...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} data-testid="explore-carousel">
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Explore Exercises</Text>
          <Text style={styles.subtitle}>Swipe to discover, tap to explore</Text>
        </View>
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={onOpenExplore}
          data-testid="explore-view-all-btn"
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="arrow-forward" size={16} color={T.accent} />
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
        onScrollBeginDrag={() => {
          // Pause auto-scroll on manual drag
          if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
        }}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_MARGIN * 2));
          currentIndex.current = newIndex;
        }}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={({ item }) => (
          <CarouselCard
            exercise={item}
            onPress={onOpenExplore}
            onLike={() => handleLike(item)}
            onDislike={() => handleDislike(item)}
          />
        )}
      />

      {/* "See All Exercises" button */}
      <TouchableOpacity
        style={styles.exploreBtn}
        onPress={onOpenExplore}
        activeOpacity={0.85}
        data-testid="explore-all-exercises-btn"
      >
        <LinearGradient
          colors={[T.accent, T.accentSecondary]}
          style={styles.exploreBtnGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="compass-outline" size={20} color={T.white} />
          <Text style={styles.exploreBtnText}>Browse Full Exercise Library</Text>
          <Ionicons name="arrow-forward" size={18} color={T.white} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: T.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: T.textMuted, marginTop: 1 },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: T.accentLight },
  viewAllText: { fontSize: 13, fontWeight: '600', color: T.accent },
  loadingCard: { height: 220, marginHorizontal: 32, borderRadius: 20, backgroundColor: T.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: T.cardBorder },
  loadingText: { fontSize: 14, color: T.textMuted },
  exploreBtn: { marginHorizontal: 16, marginTop: 14, borderRadius: 16, overflow: 'hidden' },
  exploreBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  exploreBtnText: { fontSize: 15, fontWeight: '700', color: T.white },
});

export default ExploreCarousel;
