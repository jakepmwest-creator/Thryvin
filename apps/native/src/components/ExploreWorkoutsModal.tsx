import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Image,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useWorkoutStore } from '../stores/workout-store';
import { usePreferencesStore } from '../stores/preferences-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://workout-companion-23.preview.emergentagent.com';

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  success: '#34C759',
};

// Using exercises from database via API
interface ExploreWorkoutsModalProps {
  visible: boolean;
  onClose: () => void;
  category: string;
  categoryGradient: string[];
}

const ExerciseCard = ({ exercise, onPress }: { exercise: any; onPress: () => void }) => {
  const { getPreference, likeExercise, dislikeExercise } = usePreferencesStore();
  const preference = getPreference(exercise.id);
  
  const handleLike = (e: any) => {
    e.stopPropagation();
    if (preference === 'liked') {
      usePreferencesStore.getState().removePreference(exercise.id);
    } else {
      likeExercise(exercise.id, exercise.name);
    }
  };
  
  const handleDislike = (e: any) => {
    e.stopPropagation();
    if (preference === 'disliked') {
      usePreferencesStore.getState().removePreference(exercise.id);
    } else {
      dislikeExercise(exercise.id, exercise.name);
    }
  };
  
  return (
    <TouchableOpacity style={styles.exerciseCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.exerciseIcon}>
        <Ionicons name="barbell" size={24} color={COLORS.accent} />
      </View>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.exerciseMeta}>
          {exercise.muscleGroups?.join(', ') || exercise.bodyPart || 'Full Body'} • {exercise.difficulty}
        </Text>
      </View>
      
      {/* Like/Dislike Buttons */}
      <View style={styles.preferencesContainer}>
        <TouchableOpacity onPress={handleLike} style={styles.preferenceButton}>
          <Ionicons 
            name={preference === 'liked' ? 'heart' : 'heart-outline'} 
            size={22} 
            color={preference === 'liked' ? COLORS.success : COLORS.mediumGray} 
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDislike} style={styles.preferenceButton}>
          <Ionicons 
            name={preference === 'disliked' ? 'thumbs-down' : 'thumbs-down-outline'} 
            size={22} 
            color={preference === 'disliked' ? '#FF3B30' : COLORS.mediumGray} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={[
        styles.difficultyBadge, 
        exercise.difficulty === 'Beginner' && styles.difficultyBeginner,
        exercise.difficulty === 'Advanced' && styles.difficultyAdvanced,
      ]}>
        <Text style={[
          styles.difficultyText,
          exercise.difficulty === 'Beginner' && styles.difficultyTextBeginner,
          exercise.difficulty === 'Advanced' && styles.difficultyTextAdvanced,
        ]}>
          {exercise.difficulty}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Equipment filter options - varies by category
const EQUIPMENT_FILTERS: { [key: string]: { id: string; label: string }[] } = {
  'Strength': [
    { id: 'all', label: 'All' },
    { id: 'dumbbell', label: 'Dumbbells' },
    { id: 'barbell', label: 'Barbells' },
    { id: 'machine', label: 'Machines' },
    { id: 'cable', label: 'Cables' },
    { id: 'kettlebell', label: 'Kettlebells' },
  ],
  'Calisthenics': [
    { id: 'all', label: 'All' },
    { id: 'bodyweight', label: 'Bodyweight' },
    { id: 'bar', label: 'Pull-up Bar' },
    { id: 'rings', label: 'Rings' },
    { id: 'parallettes', label: 'Parallettes' },
  ],
  'Cardio': [
    { id: 'all', label: 'All' },
    { id: 'machine', label: 'Machines' },
    { id: 'outdoor', label: 'Outdoor' },
  ],
  'Flexibility': [
    { id: 'all', label: 'All' },
    { id: 'static', label: 'Static' },
    { id: 'dynamic', label: 'Dynamic' },
    { id: 'yoga', label: 'Yoga' },
  ],
};

// Category mapping for filtering - updated for new categories
const CATEGORY_MAP: { [key: string]: string[] } = {
  'Strength': ['weightlifting', 'strength', 'powerlifting', 'barbell', 'dumbbell', 'chest', 'back', 'shoulders', 'arms', 'legs', 'upper-body', 'lower-body'],
  'Calisthenics': ['bodyweight', 'calisthenics', 'gymnastics', 'pull-up', 'push-up', 'dip', 'plank'],
  'Cardio': ['cardio', 'running', 'cycling', 'rowing', 'swimming', 'hiit', 'jump rope', 'treadmill', 'elliptical', 'stair'],
  'Flexibility': ['flexibility', 'stretching', 'yoga', 'mobility', 'warmup', 'recovery', 'foam roll', 'stretch'],
};

export const ExploreWorkoutsModal = ({ visible, onClose, category, categoryGradient }: ExploreWorkoutsModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
  const [filterEquipment, setFilterEquipment] = useState<string>('all');
  const [exercises, setExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalInDatabase, setTotalInDatabase] = useState(0);
  
  // Fetch exercises from API on mount
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setIsLoading(true);
        // Fetch up to 2000 exercises to get the full library
        const response = await fetch(`${API_BASE_URL}/api/exercises?limit=2000`);
        const data = await response.json();
        setExercises(data.exercises || []);
        setTotalInDatabase(data.totalInDatabase || data.total || 0);
      } catch (error) {
        console.error('Failed to fetch exercises:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (visible) {
      fetchExercises();
    }
  }, [visible]);
  
  // Filter exercises by category, search, difficulty, and equipment
  const filteredExercises = useMemo(() => {
    if (isLoading) return [];
    
    let filtered = exercises;
    
    // Filter by category (from the category card that was tapped)
    if (category && category !== 'All') {
      const categoryMatches = CATEGORY_MAP[category] || [category.toLowerCase()];
      filtered = filtered.filter(ex => {
        const exCategory = ex.category?.toLowerCase() || '';
        const exBodyPart = ex.bodyPart?.toLowerCase() || '';
        return categoryMatches.some(cat => 
          exCategory.includes(cat) || exBodyPart.includes(cat)
        );
      });
    }
    
    // Filter by search
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(ex => 
        ex.name?.toLowerCase().includes(searchLower) ||
        ex.muscleGroups?.some((mg: string) => mg.toLowerCase().includes(searchLower)) ||
        ex.bodyPart?.toLowerCase().includes(searchLower) ||
        ex.category?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by difficulty
    if (filterDifficulty !== 'All') {
      filtered = filtered.filter(ex => 
        ex.difficulty?.toLowerCase() === filterDifficulty.toLowerCase()
      );
    }
    
    // Filter by equipment
    if (filterEquipment !== 'all') {
      filtered = filtered.filter(ex => {
        const exEquipment = Array.isArray(ex.equipment) ? ex.equipment : [];
        return exEquipment.some((eq: string) => 
          eq?.toLowerCase().includes(filterEquipment.toLowerCase())
        );
      });
    }
    
    return filtered;
  }, [exercises, searchQuery, filterDifficulty, filterEquipment, category, isLoading]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <LinearGradient
            colors={categoryGradient as any}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>{category}</Text>
              <Text style={styles.headerSubtitle}>
                {isLoading ? 'Loading...' : `${filteredExercises.length} exercises`}
                {totalInDatabase > 0 && !isLoading && filteredExercises.length !== totalInDatabase && 
                  ` (${totalInDatabase} total)`}
              </Text>
            </View>
          </LinearGradient>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.mediumGray} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${category.toLowerCase()} exercises...`}
              placeholderTextColor={COLORS.mediumGray}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.mediumGray} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Difficulty Filter - with gradient for active state */}
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map(level => (
                <TouchableOpacity
                  key={level}
                  style={[styles.filterChip, filterDifficulty === level && styles.filterChipActiveWrapper]}
                  onPress={() => setFilterDifficulty(level)}
                >
                  {filterDifficulty === level ? (
                    <LinearGradient
                      colors={[COLORS.accent, COLORS.accentSecondary]}
                      style={styles.filterChipGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.filterChipTextActive}>{level}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.filterChipText}>{level}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* Equipment Filter - with gradient for active state */}
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(EQUIPMENT_FILTERS[category] || EQUIPMENT_FILTERS['Strength']).map(equip => (
                <TouchableOpacity
                  key={equip.id}
                  style={[styles.filterChip, filterEquipment === equip.id && styles.filterChipActiveWrapper]}
                  onPress={() => setFilterEquipment(equip.id)}
                >
                  {filterEquipment === equip.id ? (
                    <LinearGradient
                      colors={[COLORS.accent, COLORS.accentSecondary]}
                      style={styles.filterChipGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.filterChipTextActive}>{equip.label}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.filterChipText}>{equip.label}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* Exercise List */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.emptyState}>
                <Ionicons name="fitness" size={48} color={COLORS.accent} />
                <Text style={styles.emptyStateText}>Loading exercises...</Text>
              </View>
            ) : filteredExercises.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={48} color={COLORS.lightGray} />
                <Text style={styles.emptyStateText}>No exercises found</Text>
                <Text style={styles.emptyStateSubtext}>Try adjusting your filters</Text>
              </View>
            ) : (
              filteredExercises.map(exercise => (
                <ExerciseCard 
                  key={exercise.id} 
                  exercise={exercise} 
                  onPress={() => setSelectedExercise(exercise)}
                />
              ))
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
          
          {/* Exercise Detail Modal */}
          {selectedExercise && (
            <Modal visible={!!selectedExercise} animationType="slide" transparent>
              <View style={styles.detailOverlay}>
                <View style={styles.detailContainer}>
                  <TouchableOpacity 
                    style={styles.detailClose} 
                    onPress={() => setSelectedExercise(null)}
                  >
                    <Ionicons name="close" size={24} color={COLORS.mediumGray} />
                  </TouchableOpacity>
                  
                  {/* Exercise header */}
                  <LinearGradient
                    colors={categoryGradient as any}
                    style={styles.detailHeader}
                  >
                    <View style={styles.detailIconLarge}>
                      <Ionicons name="barbell" size={40} color={COLORS.white} />
                    </View>
                  </LinearGradient>
                  
                  <ScrollView style={styles.detailContent}>
                    <Text style={styles.detailTitle}>{selectedExercise.name}</Text>
                    
                    <View style={styles.detailMeta}>
                      <View style={styles.detailMetaItem}>
                        <Ionicons name="body" size={16} color={COLORS.accent} />
                        <Text style={styles.detailMetaText}>{selectedExercise.muscleGroups?.join(', ') || selectedExercise.bodyPart || 'Full Body'}</Text>
                      </View>
                      <View style={styles.detailMetaItem}>
                        <Ionicons name="fitness" size={16} color={COLORS.accent} />
                        <Text style={styles.detailMetaText}>
                          {Array.isArray(selectedExercise.equipment) 
                            ? selectedExercise.equipment.join(', ') 
                            : selectedExercise.equipment || 'Various'}
                        </Text>
                      </View>
                      <View style={styles.detailMetaItem}>
                        <Ionicons name="speedometer" size={16} color={COLORS.accent} />
                        <Text style={styles.detailMetaText}>{selectedExercise.difficulty}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.detailDescription}>{selectedExercise.description || 'Perform this exercise with proper form and controlled movements.'}</Text>
                    
                    {/* Video player with better styling */}
                    {selectedExercise.videoUrl ? (
                      <View style={styles.videoContainer}>
                        <Video
                          source={{ uri: selectedExercise.videoUrl }}
                          style={styles.videoPlayer}
                          useNativeControls
                          resizeMode={ResizeMode.COVER}
                          isLooping
                          shouldPlay={true}
                        />
                        {/* Large play button overlay - shows briefly */}
                        <View style={styles.playButtonOverlay} pointerEvents="none">
                          <View style={styles.playButton}>
                            <Ionicons name="play" size={32} color={COLORS.white} />
                          </View>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.videoPlaceholder}>
                        <LinearGradient
                          colors={['#1a1a1a', '#333']}
                          style={styles.videoGradient}
                        >
                          <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.videoText}>Video coming soon</Text>
                        </LinearGradient>
                      </View>
                    )}
                    
                    {/* Exercise details */}
                    {(selectedExercise.sets || selectedExercise.reps) && (
                      <View style={styles.exerciseDetails}>
                        {selectedExercise.sets && (
                          <View style={styles.detailChip}>
                            <Ionicons name="repeat" size={16} color={COLORS.accent} />
                            <Text style={styles.detailChipText}>{selectedExercise.sets} sets</Text>
                          </View>
                        )}
                        {selectedExercise.reps && (
                          <View style={styles.detailChip}>
                            <Ionicons name="fitness" size={16} color={COLORS.accent} />
                            <Text style={styles.detailChipText}>{selectedExercise.reps} reps</Text>
                          </View>
                        )}
                        {selectedExercise.restTime && (
                          <View style={styles.detailChip}>
                            <Ionicons name="timer" size={16} color={COLORS.accent} />
                            <Text style={styles.detailChipText}>{selectedExercise.restTime}s rest</Text>
                          </View>
                        )}
                      </View>
                    )}
                    
                    <Text style={styles.tipsTitle}>Pro Tips</Text>
                    {selectedExercise.tips.map((tip, index) => (
                      <View key={index} style={styles.tipItem}>
                        <View style={styles.tipBullet}>
                          <Text style={styles.tipBulletText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                    
                    <View style={{ height: 40 }} />
                  </ScrollView>
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  container: { flex: 1, backgroundColor: COLORS.white, marginTop: 50, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  
  header: { padding: 20, paddingTop: 16 },
  closeButton: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 4 },
  headerContent: { marginTop: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, margin: 16, marginBottom: 8, borderRadius: 12, paddingHorizontal: 14, gap: 10 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: COLORS.text },
  
  filterContainer: { paddingHorizontal: 20, marginTop: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: COLORS.lightGray, marginRight: 10, overflow: 'hidden' },
  filterChipActiveWrapper: { padding: 0, backgroundColor: 'transparent' },
  filterChipGradient: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  filterChipText: { fontSize: 14, fontWeight: '500', color: COLORS.mediumGray },
  filterChipTextActive: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  
  content: { flex: 1, paddingHorizontal: 16 },
  
  exerciseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 16, padding: 16, marginBottom: 12 },
  exerciseIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: `${COLORS.accent}15`, justifyContent: 'center', alignItems: 'center' },
  exerciseInfo: { flex: 1, marginLeft: 14 },
  exerciseName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  exerciseMeta: { fontSize: 13, color: COLORS.mediumGray, marginTop: 2 },
  preferencesContainer: { flexDirection: 'row', marginLeft: 8, gap: 4 },
  preferenceButton: { padding: 6 },
  difficultyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: '#FFF3E0', marginLeft: 8 },
  difficultyBeginner: { backgroundColor: '#E8F5E9' },
  difficultyAdvanced: { backgroundColor: '#FFEBEE' },
  difficultyText: { fontSize: 11, fontWeight: '600', color: '#E65100' },
  difficultyTextBeginner: { color: '#2E7D32' },
  difficultyTextAdvanced: { color: '#C62828' },
  
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyStateText: { fontSize: 16, color: COLORS.mediumGray, marginTop: 12 },
  emptyStateSubtext: { fontSize: 14, color: COLORS.mediumGray, marginTop: 4, opacity: 0.7 },
  
  // Detail modal
  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  detailContainer: { backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
  detailClose: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 4 },
  detailHeader: { height: 120, justifyContent: 'center', alignItems: 'center' },
  detailIconLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  detailContent: { padding: 20 },
  detailTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  detailMeta: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 16, marginTop: 16, marginBottom: 20 },
  detailMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailMetaText: { fontSize: 14, color: COLORS.mediumGray },
  detailDescription: { fontSize: 15, color: COLORS.text, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  
  videoPlaceholder: { borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  videoGradient: { height: 200, justifyContent: 'center', alignItems: 'center' },
  videoText: { color: 'rgba(255,255,255,0.6)', marginTop: 12, fontSize: 14 },
  videoContainer: { borderRadius: 16, overflow: 'hidden', marginBottom: 24, backgroundColor: '#000', position: 'relative' },
  videoPlayer: { width: '100%', aspectRatio: 16/9 },
  playButtonOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', opacity: 0 },
  playButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingLeft: 4 },
  
  exerciseDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20, justifyContent: 'center' },
  detailChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${COLORS.accent}10`, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  detailChipText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  
  tipsTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  tipBullet: { width: 24, height: 24, borderRadius: 12, backgroundColor: `${COLORS.accent}15`, justifyContent: 'center', alignItems: 'center' },
  tipBulletText: { fontSize: 12, fontWeight: '700', color: COLORS.accent },
  tipText: { flex: 1, fontSize: 15, color: COLORS.text, lineHeight: 22 },
  
  addToWorkoutButton: { marginTop: 20, borderRadius: 16, overflow: 'hidden' },
  addButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  addButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
});
