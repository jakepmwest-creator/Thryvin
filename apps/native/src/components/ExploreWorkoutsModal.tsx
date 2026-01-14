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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PreviewVideoPlayer } from './ExerciseVideoPlayer';
import { usePreferencesStore } from '../stores/preferences-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://fitness-stats-7.preview.emergentagent.com';

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  success: '#34C759',
};

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
        <Text style={styles.exerciseName} numberOfLines={1}>{exercise.name}</Text>
        <Text style={styles.exerciseMeta} numberOfLines={1}>
          {exercise.muscleGroups?.join(', ') || exercise.bodyPart || 'Full Body'} • {exercise.difficulty}
        </Text>
      </View>
      
      <View style={styles.preferencesContainer}>
        <TouchableOpacity onPress={handleLike} style={styles.preferenceButton}>
          <Ionicons 
            name={preference === 'liked' ? 'heart' : 'heart-outline'} 
            size={20} 
            color={preference === 'liked' ? COLORS.success : COLORS.mediumGray} 
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDislike} style={styles.preferenceButton}>
          <Ionicons 
            name={preference === 'disliked' ? 'thumbs-down' : 'thumbs-down-outline'} 
            size={20} 
            color={preference === 'disliked' ? '#FF3B30' : COLORS.mediumGray} 
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// Equipment filter options
const EQUIPMENT_FILTERS: { [key: string]: { id: string; label: string }[] } = {
  'Strength': [
    { id: 'all', label: 'All' },
    { id: 'dumbbell', label: 'Dumbbells' },
    { id: 'barbell', label: 'Barbells' },
    { id: 'machine', label: 'Machines' },
    { id: 'cable', label: 'Cables' },
  ],
  'Calisthenics': [
    { id: 'all', label: 'All' },
    { id: 'bodyweight', label: 'Bodyweight' },
    { id: 'bar', label: 'Pull-up Bar' },
    { id: 'rings', label: 'Rings' },
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

export const ExploreWorkoutsModal = ({ visible, onClose, category, categoryGradient }: ExploreWorkoutsModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
  const [filterEquipment, setFilterEquipment] = useState<string>('all');
  const [exercises, setExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalInDatabase, setTotalInDatabase] = useState(0);
  
  // Fetch exercises from API
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setIsLoading(true);
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
    
    // Equipment keywords to detect in exercise names
    const equipmentKeywords = ['dumbbell', 'barbell', 'cable', 'machine', 'kettlebell', 'smith', 'ez bar', 'ez-bar', 'resistance band', 'band', 'bench press', 'lat pull', 'pulldown', 'leg press', 'chest press', 'shoulder press'];
    const cardioKeywords = ['cardio', 'running', 'cycling', 'rowing', 'swimming', 'jump rope', 'treadmill', 'elliptical', 'stair', 'hiit', 'jumping jack', 'burpee', 'mountain climber'];
    const flexKeywords = ['stretch', 'yoga', 'mobility', 'warmup', 'warm-up', 'recovery', 'foam roll', 'flexibility'];
    
    // Filter by category
    if (category && category !== 'All') {
      filtered = filtered.filter(ex => {
        const exCategory = (ex.category || '').toLowerCase();
        const exName = (ex.name || '').toLowerCase();
        const equipmentArr = Array.isArray(ex.equipment) ? ex.equipment : [];
        const equipmentStr = equipmentArr.map((e: any) => String(e).toLowerCase()).join(' ');
        
        const nameHasEquipment = equipmentKeywords.some(kw => exName.includes(kw));
        const fieldHasEquipment = equipmentArr.length > 0 && !equipmentStr.includes('bodyweight');
        const isCardio = cardioKeywords.some(kw => exCategory.includes(kw) || exName.includes(kw));
        const isFlex = flexKeywords.some(kw => exCategory.includes(kw) || exName.includes(kw));
        
        if (category === 'Strength') {
          return (nameHasEquipment || fieldHasEquipment) && !isCardio && !isFlex;
        }
        
        if (category === 'Calisthenics') {
          return !nameHasEquipment && !fieldHasEquipment && !isCardio && !isFlex;
        }
        
        if (category === 'Cardio') {
          return isCardio;
        }
        
        if (category === 'Flexibility') {
          return isFlex;
        }
        
        return true;
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

  // Check if video URL is valid (not a placeholder)
  const hasValidVideo = (exercise: any) => {
    if (!exercise.videoUrl) return false;
    // Check if it's a real cloudinary video, not a placeholder
    const url = exercise.videoUrl.toLowerCase();
    if (url.includes('cloudinary')) return true;
    if (url.includes('thryvin.com')) {
      // These are placeholder URLs that don't exist
      return false;
    }
    return false;
  };

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
              </Text>
            </View>
          </LinearGradient>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={COLORS.mediumGray} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${category.toLowerCase()}...`}
              placeholderTextColor={COLORS.mediumGray}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.mediumGray} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Difficulty Filter - COMPACT */}
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
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
          
          {/* Equipment Filter - COMPACT */}
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
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
                        <Text style={styles.detailMetaText}>
                          {selectedExercise.muscleGroups?.join(', ') || selectedExercise.bodyPart || 'Full Body'}
                        </Text>
                      </View>
                      <View style={styles.detailMetaItem}>
                        <Ionicons name="fitness" size={16} color={COLORS.accent} />
                        <Text style={styles.detailMetaText}>
                          {Array.isArray(selectedExercise.equipment) 
                            ? selectedExercise.equipment.join(', ') 
                            : selectedExercise.equipment || 'Bodyweight'}
                        </Text>
                      </View>
                      <View style={styles.detailMetaItem}>
                        <Ionicons name="speedometer" size={16} color={COLORS.accent} />
                        <Text style={styles.detailMetaText}>{selectedExercise.difficulty}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.detailDescription}>
                      {selectedExercise.description || 'Perform this exercise with proper form and controlled movements.'}
                    </Text>
                    
                    {/* Video - Thumbnail first, click to play, loops 3x */}
                    {hasValidVideo(selectedExercise) ? (
                      <View style={styles.videoContainer}>
                        <PreviewVideoPlayer
                          videoUrl={selectedExercise.videoUrl}
                          exerciseName={selectedExercise.name}
                        />
                      </View>
                    ) : (
                      <View style={styles.videoPlaceholder}>
                        <LinearGradient
                          colors={['#1a1a1a', '#333']}
                          style={styles.videoGradient}
                        >
                          <Ionicons name="videocam-outline" size={48} color="rgba(255,255,255,0.5)" />
                          <Text style={styles.videoComingSoon}>Video Coming Soon</Text>
                          <Text style={styles.videoComingSoonSub}>
                            We're working on adding a video for this exercise
                          </Text>
                        </LinearGradient>
                      </View>
                    )}
                    
                    {/* Tips */}
                    {selectedExercise.tips && selectedExercise.tips.length > 0 && (
                      <>
                        <Text style={styles.tipsTitle}>Pro Tips</Text>
                        {selectedExercise.tips.map((tip: string, index: number) => (
                          <View key={index} style={styles.tipItem}>
                            <View style={styles.tipBullet}>
                              <Text style={styles.tipBulletText}>{index + 1}</Text>
                            </View>
                            <Text style={styles.tipText}>{tip}</Text>
                          </View>
                        ))}
                      </>
                    )}
                    
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
  headerTitle: { fontSize: 26, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.lightGray, 
    margin: 16, 
    marginBottom: 8, 
    borderRadius: 10, 
    paddingHorizontal: 12, 
    gap: 8 
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: COLORS.text },
  
  filterContainer: { paddingLeft: 16, marginTop: 8 },
  filterScroll: { paddingRight: 16 },
  // COMPACT filter chips
  filterChip: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16, 
    backgroundColor: COLORS.lightGray, 
    marginRight: 8, 
    overflow: 'hidden' 
  },
  filterChipActiveWrapper: { padding: 0, backgroundColor: 'transparent' },
  filterChipGradient: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  filterChipText: { fontSize: 13, fontWeight: '500', color: COLORS.mediumGray },
  filterChipTextActive: { fontSize: 13, fontWeight: '600', color: COLORS.white },
  
  content: { flex: 1, paddingHorizontal: 16, marginTop: 12 },
  
  exerciseCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.lightGray, 
    borderRadius: 14, 
    padding: 14, 
    marginBottom: 10 
  },
  exerciseIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: `${COLORS.accent}15`, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  exerciseInfo: { flex: 1, marginLeft: 12 },
  exerciseName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  exerciseMeta: { fontSize: 12, color: COLORS.mediumGray, marginTop: 2 },
  preferencesContainer: { flexDirection: 'row', marginLeft: 8, gap: 2 },
  preferenceButton: { padding: 6 },
  
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyStateText: { fontSize: 16, color: COLORS.mediumGray, marginTop: 12 },
  emptyStateSubtext: { fontSize: 14, color: COLORS.mediumGray, marginTop: 4, opacity: 0.7 },
  
  // Detail modal
  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  detailContainer: { backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
  detailClose: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 4 },
  detailHeader: { height: 100, justifyContent: 'center', alignItems: 'center' },
  detailIconLarge: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  detailContent: { padding: 20 },
  detailTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  detailMeta: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 14, marginTop: 14, marginBottom: 16 },
  detailMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailMetaText: { fontSize: 13, color: COLORS.mediumGray },
  detailDescription: { fontSize: 14, color: COLORS.text, lineHeight: 21, textAlign: 'center', marginBottom: 20 },
  
  videoPlaceholder: { borderRadius: 14, overflow: 'hidden', marginBottom: 20 },
  videoGradient: { height: 180, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  videoComingSoon: { color: 'rgba(255,255,255,0.9)', marginTop: 12, fontSize: 16, fontWeight: '600' },
  videoComingSoonSub: { color: 'rgba(255,255,255,0.5)', marginTop: 6, fontSize: 13, textAlign: 'center' },
  videoContainer: { borderRadius: 14, overflow: 'hidden', marginBottom: 20, backgroundColor: '#000' },
  videoPlayer: { width: '100%', aspectRatio: 16/9 },
  
  tipsTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 12, marginTop: 8 },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  tipBullet: { width: 22, height: 22, borderRadius: 11, backgroundColor: `${COLORS.accent}15`, justifyContent: 'center', alignItems: 'center' },
  tipBulletText: { fontSize: 11, fontWeight: '700', color: COLORS.accent },
  tipText: { flex: 1, fontSize: 14, color: COLORS.text, lineHeight: 20 },
});
