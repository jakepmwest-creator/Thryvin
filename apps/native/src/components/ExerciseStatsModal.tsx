/**
 * ExerciseStatsModal - Categorized Exercise Browser & Stats
 * - All exercises from database, categorized
 * - Shows done exercises at top, undone below with lock
 * - Pin up to 3 favorites
 * - Detailed stats with graphs and PBs using Epley formula
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
  FlatList,
  SectionList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { COLORS as THEME_COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

const COLORS = {
  accent: THEME_COLORS.gradientStart,
  accentSecondary: THEME_COLORS.gradientEnd,
  white: THEME_COLORS.white,
  text: THEME_COLORS.text,
  lightGray: THEME_COLORS.lightGray,
  mediumGray: THEME_COLORS.mediumGray,
  success: THEME_COLORS.success,
  warning: THEME_COLORS.warning,
  green: '#34C759',
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://fitness-stats-7.preview.emergentagent.com';

// Keywords for smart category detection (same as ExploreWorkoutsModal)
const EQUIPMENT_KEYWORDS = ['dumbbell', 'barbell', 'cable', 'machine', 'kettlebell', 'smith', 'ez bar', 'ez-bar', 'resistance band', 'band', 'bench press', 'lat pull', 'pulldown', 'leg press', 'chest press', 'shoulder press', 'weight', 'weighted', 'rack', 'bar', 'press', 'curl', 'fly', 'row', 'pullover', 'extension', 'raise'];
const CARDIO_KEYWORDS = ['cardio', 'running', 'cycling', 'rowing', 'swimming', 'jump rope', 'treadmill', 'elliptical', 'stair', 'hiit', 'jumping jack', 'burpee', 'mountain climber', 'sprint'];
const FLEX_KEYWORDS = ['stretch', 'yoga', 'mobility', 'warmup', 'warm-up', 'recovery', 'foam roll', 'flexibility'];

// Exercise Categories - Matching Explore Workouts structure
// Weights (with equipment), Calisthenics (bodyweight), Cardio, Flexibility
const EXERCISE_CATEGORIES = {
  'weights': {
    displayName: 'Weights',
    icon: 'barbell',
    gradient: [THEME_COLORS.gradientStart, THEME_COLORS.gradientEnd],
    subcategories: {
      'upper-body': 'Upper Body',
      'lower-body': 'Lower Body',
      'full-body': 'Full Body',
    }
  },
  'calisthenics': {
    displayName: 'Calisthenics',
    icon: 'body',
    gradient: ['#FF4EC7', '#FF6B9D'],
    subcategories: {
      'upper-body': 'Upper Body',
      'lower-body': 'Lower Body',
      'core': 'Core',
      'full-body': 'Full Body',
    }
  },
  'cardio': {
    displayName: 'Cardio',
    icon: 'heart',
    gradient: ['#FF3B30', '#FF6B35'],
    subcategories: {
      'all': 'All Cardio',
    }
  },
  'flexibility': {
    displayName: 'Flexibility',
    icon: 'fitness',
    gradient: ['#34C759', '#5BD678'],
    subcategories: {
      'stretching': 'Stretching',
      'yoga': 'Yoga',
      'mobility': 'Mobility',
    }
  },
};

// Smart category detection function
const detectExerciseCategory = (exercise: any): 'weights' | 'calisthenics' | 'cardio' | 'flexibility' => {
  const exName = (exercise.name || exercise.exerciseName || '').toLowerCase();
  const exCategory = (exercise.category || '').toLowerCase();
  const equipmentArr = Array.isArray(exercise.equipment) ? exercise.equipment : [];
  const equipmentStr = equipmentArr.map((e: any) => String(e).toLowerCase()).join(' ');
  
  const nameHasEquipment = EQUIPMENT_KEYWORDS.some(kw => exName.includes(kw));
  const fieldHasEquipment = equipmentArr.length > 0 && !equipmentStr.includes('bodyweight');
  const isCardio = CARDIO_KEYWORDS.some(kw => exCategory.includes(kw) || exName.includes(kw));
  const isFlex = FLEX_KEYWORDS.some(kw => exCategory.includes(kw) || exName.includes(kw));
  
  if (isCardio) return 'cardio';
  if (isFlex) return 'flexibility';
  if (nameHasEquipment || fieldHasEquipment) return 'weights';
  return 'calisthenics';
};

interface ExerciseStatsModalProps {
  visible: boolean;
  onClose: () => void;
  initialExerciseId?: string;
}

interface Exercise {
  id?: number;
  exerciseId: string;
  name?: string;
  exerciseName: string;
  category?: string;
  equipment?: string[];
  videoUrl?: string;
  subcategory?: string;
  totalSets?: number;
  totalReps?: number;
  maxWeight?: number;
  lastPerformed?: string;
  sessionCount?: number;
  hasPerformed?: boolean;
}

interface ExerciseDetail {
  exerciseId: string;
  exerciseName: string;
  history: Array<{
    date: string;
    maxWeight: number;
    totalReps: number;
    totalSets: number;
    estimatedOneRM: number;
  }>;
  personalBests: {
    actualPB: number;
    estimatedOneRM: number;
    estimated3RM: number;
    estimated5RM: number;
    estimated6RM: number;
    estimated10RM: number;
    maxReps: number;
    maxVolume: number;
    bestSet: { weight: number; reps: number; date: string };
  };
  trend: 'up' | 'down' | 'neutral';
  strongest: { date: string; weight: number };
  weakest: { date: string; weight: number };
  totalSessions: number;
  firstSession: string;
  lastSession: string;
  coachTip?: string;
}

// Simple Line Chart for history
const SimpleLineChart = ({ data, height = 120 }: { data: number[]; height?: number }) => {
  if (data.length < 2) return null;
  
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;
  const chartWidth = width - 80;
  const pointSpacing = chartWidth / (data.length - 1);
  
  return (
    <View style={[styles.chartContainer, { height }]}>
      {/* Y-axis labels */}
      <View style={styles.yAxis}>
        <Text style={styles.yAxisLabel}>{maxValue}kg</Text>
        <Text style={styles.yAxisLabel}>{minValue}kg</Text>
      </View>
      
      {/* Chart area */}
      <View style={styles.chartArea}>
        {/* Grid lines */}
        <View style={[styles.gridLine, { top: 0 }]} />
        <View style={[styles.gridLine, { top: '50%' }]} />
        <View style={[styles.gridLine, { top: '100%' }]} />
        
        {/* Points and lines */}
        {data.map((value, index) => {
          const x = index * pointSpacing;
          const y = ((maxValue - value) / range) * (height - 30);
          const isLast = index === data.length - 1;
          
          return (
            <View key={index}>
              {/* Line to next point */}
              {index < data.length - 1 && (
                <View
                  style={[
                    styles.chartLine,
                    {
                      left: x + 4,
                      top: y + 4,
                      width: pointSpacing,
                      transform: [
                        {
                          rotate: `${Math.atan2(
                            ((maxValue - data[index + 1]) / range) * (height - 30) - y,
                            pointSpacing
                          )}rad`,
                        },
                      ],
                    },
                  ]}
                />
              )}
              
              {/* Point */}
              <LinearGradient
                colors={isLast ? [COLORS.accent, COLORS.accentSecondary] : [COLORS.mediumGray, COLORS.mediumGray]}
                style={[styles.chartPoint, { left: x, top: y }]}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Coach Tips based on exercise performance
const getCoachTip = (detail: ExerciseDetail): string => {
  if (!detail || !detail.personalBests) return "Start logging sets to get personalized tips!";
  
  const { personalBests, trend, history } = detail;
  
  if (trend === 'up') {
    return "🔥 Great progress! You're getting stronger. Consider increasing weight by 2.5kg next session.";
  }
  
  if (trend === 'down') {
    return "📉 Performance dipping slightly. Focus on form and recovery. Consider a deload week.";
  }
  
  if (personalBests.estimatedOneRM > personalBests.actualPB * 1.1) {
    return `💪 Your estimated 1RM is ${personalBests.estimatedOneRM}kg - you could hit ${Math.round(personalBests.actualPB * 1.05)}kg soon!`;
  }
  
  if (history.length < 5) {
    return "📊 Keep logging to build your history and unlock detailed insights!";
  }
  
  return "✅ Consistent performance! Try progressive overload to keep improving.";
};

export const ExerciseStatsModal = ({ visible, onClose, initialExerciseId }: ExerciseStatsModalProps) => {
  const [view, setView] = useState<'categories' | 'subcategories' | 'list' | 'detail'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [userExercises, setUserExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Fetch all exercises from database
  const fetchAllExercises = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      
      // Fetch all exercises from the database with a larger limit
      const response = await fetch(`${API_BASE_URL}/api/exercises?limit=200`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Map the API response to our Exercise interface
        const mappedExercises = (data.exercises || []).map((ex: any) => ({
          id: ex.id,
          exerciseId: ex.slug || ex.id?.toString() || ex.name?.toLowerCase().replace(/\s+/g, '_'),
          name: ex.name,
          exerciseName: ex.name,
          category: ex.category,
          equipment: ex.equipment || [],
          videoUrl: ex.videoUrl,
          subcategory: ex.equipment?.[0] || 'bodyweight', // Use first equipment as subcategory
        }));
        setAllExercises(mappedExercises);
      }
    } catch (err) {
      console.error('Error fetching all exercises:', err);
    }
  }, []);

  // Fetch user's exercise history
  const fetchUserExercises = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      
      const response = await fetch(`${API_BASE_URL}/api/stats/exercises`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserExercises(data.exercises || []);
      }
    } catch (err) {
      console.error('Error fetching user exercises:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch exercise detail
  const fetchExerciseDetail = useCallback(async (exerciseId: string) => {
    try {
      setIsLoading(true);
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      
      const response = await fetch(`${API_BASE_URL}/api/stats/exercise/${exerciseId}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedExercise(data);
        setView('detail');
      }
    } catch (err) {
      console.error('Error fetching exercise detail:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Show detail for unperformed exercise (grayed out UI with "Add to future workout")
  const [unperformedExercise, setUnperformedExercise] = useState<Exercise | null>(null);
  
  const showUnperformedExerciseDetail = (exercise: Exercise) => {
    setUnperformedExercise(exercise);
    setView('detail');
  };

  // Request to add exercise to future workout
  const requestFutureWorkout = async (exerciseName: string) => {
    try {
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      await fetch(`${API_BASE_URL}/api/user/exercise-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ exerciseName, requestType: 'future_workout' }),
      });
      // Show success - the AI will consider this exercise
      alert(`"${exerciseName}" added to your wishlist! The AI may include it in future workouts.`);
    } catch (err) {
      console.error('Error requesting exercise:', err);
    }
  };

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      const response = await fetch(`${API_BASE_URL}/api/stats/favorites`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });
      
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites?.map((f: any) => f.exerciseId) || []);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
  }, []);

  // Toggle favorite
  const toggleFavorite = async (exerciseId: string) => {
    try {
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      let newFavorites: string[];
      
      if (favorites.includes(exerciseId)) {
        // Remove from favorites
        newFavorites = favorites.filter(id => id !== exerciseId);
      } else {
        if (favorites.length >= 3) {
          // Max 3 favorites - show alert and replace oldest
          alert('You can only pin 3 exercises. The oldest one will be replaced.');
          newFavorites = [...favorites.slice(1), exerciseId];
        } else {
          newFavorites = [...favorites, exerciseId];
        }
      }
      
      await fetch(`${API_BASE_URL}/api/stats/favorites`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ exerciseIds: newFavorites }),
      });
      
      setFavorites(newFavorites);
    } catch (err) {
      console.error('Error updating favorites:', err);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchAllExercises();
      fetchUserExercises();
      fetchFavorites();
      
      if (initialExerciseId) {
        fetchExerciseDetail(initialExerciseId);
      }
    }
  }, [visible, initialExerciseId, fetchAllExercises, fetchUserExercises, fetchFavorites, fetchExerciseDetail]);

  const handleClose = () => {
    setView('categories');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedExercise(null);
    setUnperformedExercise(null);
    setSearchQuery('');
    onClose();
  };

  const handleBack = () => {
    if (view === 'detail') {
      setView('list');
      setSelectedExercise(null);
      setUnperformedExercise(null);
    } else if (view === 'list') {
      setView('subcategories');
      setSelectedSubcategory(null);
    } else if (view === 'subcategories') {
      setView('categories');
      setSelectedCategory(null);
    }
  };

  // Get exercises for current view using smart category detection
  const getFilteredExercises = (): { done: Exercise[]; notDone: Exercise[] } => {
    const userExerciseIds = new Set(userExercises.map(e => e.exerciseId));
    
    let filtered = allExercises;
    
    // Filter by main category using smart detection
    if (selectedCategory) {
      filtered = filtered.filter(e => detectExerciseCategory(e) === selectedCategory);
    }
    
    // Filter by subcategory (body part) if selected
    if (selectedSubcategory && selectedSubcategory !== 'all') {
      filtered = filtered.filter(e => 
        (e.category || '').toLowerCase().includes(selectedSubcategory) ||
        e.category === selectedSubcategory
      );
    }
    
    // Filter by search - always apply if query exists
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        (e.exerciseName || e.name || '').toLowerCase().includes(query)
      );
    }
    
    // Separate into done and not done
    const done = filtered.filter(e => userExerciseIds.has(e.exerciseId)).map(e => {
      const userData = userExercises.find(u => u.exerciseId === e.exerciseId);
      return { ...e, ...userData, hasPerformed: true };
    });
    
    const notDone = filtered.filter(e => !userExerciseIds.has(e.exerciseId)).map(e => ({
      ...e,
      hasPerformed: false
    }));
    
    return { done, notDone };
  };

  // Get exercise count for a category using smart detection
  const getCategoryCount = (categoryKey: string): number => {
    return allExercises.filter(e => detectExerciseCategory(e) === categoryKey).length;
  };

  // Render category selection with search at top
  const renderCategories = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Global Search Bar */}
      <View style={styles.globalSearchContainer}>
        <Ionicons name="search" size={20} color={COLORS.mediumGray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search all exercises..."
          placeholderTextColor={COLORS.mediumGray}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (text.length > 0) {
              setView('list');
              setSelectedCategory(null);
              setSelectedSubcategory(null);
            }
          }}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.mediumGray} />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={styles.viewTitle}>Browse Exercises</Text>
      <Text style={styles.viewSubtitle}>Select a category to explore</Text>
      
      <View style={styles.categoriesGrid}>
        {Object.entries(EXERCISE_CATEGORIES).map(([key, config]) => (
          <TouchableOpacity
            key={key}
            style={styles.categoryCard}
            onPress={() => {
              setSelectedCategory(key);
              setView('subcategories');
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={config.gradient as [string, string]}
              style={styles.categoryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.categoryIconCircle}>
                <Ionicons name={config.icon as any} size={28} color={COLORS.white} />
              </View>
              <Text style={styles.categoryName}>{config.displayName}</Text>
              <Text style={styles.categoryCount}>
                {getCategoryCount(key)} exercises
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Quick access to user's exercises */}
      <View style={styles.quickAccessSection}>
        <Text style={styles.sectionTitle}>Your Exercises</Text>
        <TouchableOpacity
          style={styles.quickAccessCard}
          onPress={() => {
            setView('list');
            setSelectedCategory(null);
            setSelectedSubcategory(null);
          }}
        >
          <View style={styles.quickAccessIcon}>
            <Ionicons name="trophy" size={24} color={COLORS.accent} />
          </View>
          <View style={styles.quickAccessText}>
            <Text style={styles.quickAccessTitle}>All Your Logged Exercises</Text>
            <Text style={styles.quickAccessSubtitle}>{userExercises.length} exercises with stats</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Render subcategories with search bar
  const renderSubcategories = () => {
    if (!selectedCategory) return null;
    const categoryConfig = EXERCISE_CATEGORIES[selectedCategory as keyof typeof EXERCISE_CATEGORIES];
    if (!categoryConfig) return null;
    
    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar for this category */}
        <View style={styles.globalSearchContainer}>
          <Ionicons name="search" size={20} color={COLORS.mediumGray} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${categoryConfig.displayName.toLowerCase()}...`}
            placeholderTextColor={COLORS.mediumGray}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.length > 0) {
                setView('list');
              }
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.mediumGray} />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.viewTitle}>{categoryConfig.displayName}</Text>
        <Text style={styles.viewSubtitle}>Select a subcategory or view all</Text>
        
        {/* View All button */}
        <TouchableOpacity
          style={[styles.subcategoryCard, { backgroundColor: `${COLORS.accent}15` }]}
          onPress={() => {
            setSelectedSubcategory(null);
            setView('list');
          }}
        >
          <View style={styles.subcategoryContent}>
            <View style={[styles.subcategoryDot, { backgroundColor: COLORS.accent }]} />
            <Text style={[styles.subcategoryName, { color: COLORS.accent }]}>View All {categoryConfig.displayName}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.accent} />
        </TouchableOpacity>
        
        {Object.entries(categoryConfig.subcategories).map(([key, displayName]) => (
          <TouchableOpacity
            key={key}
            style={styles.subcategoryCard}
            onPress={() => {
              setSelectedSubcategory(key);
              setView('list');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.subcategoryContent}>
              <View style={[styles.subcategoryDot, { backgroundColor: categoryConfig.gradient[0] }]} />
              <Text style={styles.subcategoryName}>{displayName}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // Get header title based on view
  const getHeaderTitle = () => {
    switch (view) {
      case 'categories': return 'Exercise Stats';
      case 'subcategories': 
        const cat = EXERCISE_CATEGORIES[selectedCategory as keyof typeof EXERCISE_CATEGORIES];
        return cat?.displayName || 'Exercises';
      case 'list': 
        if (selectedSubcategory && selectedCategory) {
          const catConfig = EXERCISE_CATEGORIES[selectedCategory as keyof typeof EXERCISE_CATEGORIES];
          const subName = catConfig?.subcategories?.[selectedSubcategory as keyof typeof catConfig.subcategories];
          return subName || selectedCategory;
        }
        if (selectedCategory) {
          const cat = EXERCISE_CATEGORIES[selectedCategory as keyof typeof EXERCISE_CATEGORIES];
          return cat?.displayName || 'All Exercises';
        }
        return 'Your Exercises';
      case 'detail': return 'Exercise Detail';
      default: return 'Exercise Stats';
    }
  };

  // Render exercise list
  const renderExerciseList = () => {
    const { done, notDone } = getFilteredExercises();
    
    return (
      <>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.mediumGray} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${getHeaderTitle().toLowerCase()}...`}
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

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        ) : (
          <ScrollView style={styles.exerciseList} showsVerticalScrollIndicator={false}>
            {/* Done exercises */}
            {done.length > 0 && (
              <View style={styles.exerciseSection}>
                <Text style={styles.exerciseSectionTitle}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.green} /> Performed ({done.length})
                </Text>
                {done.map((exercise) => (
                  <ExerciseListItem
                    key={exercise.exerciseId}
                    exercise={exercise}
                    onPress={() => fetchExerciseDetail(exercise.exerciseId)}
                    onToggleFavorite={() => toggleFavorite(exercise.exerciseId)}
                    isFavorite={favorites.includes(exercise.exerciseId)}
                    hasPerformed={true}
                  />
                ))}
              </View>
            )}
            
            {/* Not done exercises */}
            {notDone.length > 0 && (
              <View style={styles.exerciseSection}>
                <Text style={styles.exerciseSectionTitle}>
                  <Ionicons name="lock-closed" size={16} color={COLORS.mediumGray} /> Not Performed Yet ({notDone.length})
                </Text>
                {notDone.map((exercise) => (
                  <ExerciseListItem
                    key={exercise.exerciseId}
                    exercise={exercise}
                    onPress={() => showUnperformedExerciseDetail(exercise)}
                    onToggleFavorite={() => toggleFavorite(exercise.exerciseId)}
                    isFavorite={favorites.includes(exercise.exerciseId)}
                    hasPerformed={false}
                    disabled={false}
                  />
                ))}
              </View>
            )}
            
            {done.length === 0 && notDone.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={COLORS.mediumGray} />
                <Text style={styles.emptyText}>No exercises found</Text>
                <Text style={styles.emptySubtext}>Try a different search or category</Text>
              </View>
            )}
            
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </>
    );
  };

  // Render exercise detail
  const renderExerciseDetail = () => {
    // Check if viewing unperformed exercise
    if (unperformedExercise && !selectedExercise) {
      return (
        <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
          {/* Header for unperformed */}
          <View style={styles.detailHeader}>
            <Text style={[styles.detailTitle, { color: COLORS.mediumGray }]}>
              {unperformedExercise.exerciseName || unperformedExercise.name}
            </Text>
            <View style={[styles.trendBadge, { backgroundColor: `${COLORS.mediumGray}20` }]}>
              <Ionicons name="lock-closed" size={16} color={COLORS.mediumGray} />
              <Text style={[styles.trendText, { color: COLORS.mediumGray }]}>Not Performed</Text>
            </View>
          </View>

          {/* Locked Stats Message */}
          <View style={[styles.coachTipCard, { backgroundColor: `${COLORS.mediumGray}15` }]}>
            <View style={styles.coachTipHeader}>
              <Ionicons name="lock-closed" size={20} color={COLORS.mediumGray} />
              <Text style={[styles.coachTipTitle, { color: COLORS.mediumGray }]}>Stats Locked</Text>
            </View>
            <Text style={[styles.coachTipText, { color: COLORS.mediumGray }]}>
              Complete this exercise in a workout to unlock your personal bests, progress charts, and detailed stats!
            </Text>
          </View>

          {/* Grayed out PB section */}
          <View style={[styles.pbSection, { opacity: 0.4 }]}>
            <Text style={styles.sectionTitle}>Personal Bests</Text>
            <View style={styles.pbGrid}>
              <View style={[styles.pbMainCard, { backgroundColor: COLORS.mediumGray }]}>
                <Text style={styles.pbMainLabel}>Actual PB</Text>
                <Text style={styles.pbMainValue}>--</Text>
                <Text style={styles.pbMainSub}>Not recorded yet</Text>
              </View>
              <View style={styles.pbEstimatedCard}>
                <Text style={styles.pbEstLabel}>Est. 1RM</Text>
                <Text style={styles.pbEstValue}>--</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.unperformedActions}>
            <TouchableOpacity
              style={styles.addToFutureButton}
              onPress={() => requestFutureWorkout(unperformedExercise.exerciseName || unperformedExercise.name || '')}
            >
              <LinearGradient
                colors={[COLORS.accent, COLORS.accentSecondary]}
                style={styles.addToFutureGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="add-circle" size={20} color={COLORS.white} />
                <Text style={styles.addToFutureText}>Add to Future Workout</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.pinButton}
              onPress={() => toggleFavorite(unperformedExercise.exerciseId)}
            >
              <Ionicons
                name={favorites.includes(unperformedExercise.exerciseId) ? 'star' : 'star-outline'}
                size={20}
                color={favorites.includes(unperformedExercise.exerciseId) ? COLORS.warning : COLORS.mediumGray}
              />
              <Text style={[styles.pinButtonText, favorites.includes(unperformedExercise.exerciseId) && { color: COLORS.warning }]}>
                {favorites.includes(unperformedExercise.exerciseId) ? 'Pinned to Favorites' : 'Pin to Favorites'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      );
    }
    
    if (!selectedExercise) return null;

    const { personalBests, history, trend, strongest, weakest } = selectedExercise;
    const chartData = history?.map((h: any) => h.maxWeight) || [];
    const coachTip = getCoachTip(selectedExercise);
    
    const TrendIcon = trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove';
    const trendColor = trend === 'up' ? COLORS.success : trend === 'down' ? '#FF3B30' : COLORS.mediumGray;

    return (
      <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{selectedExercise.exerciseName}</Text>
          <View style={styles.trendBadge}>
            <Ionicons name={TrendIcon as any} size={16} color={trendColor} />
            <Text style={[styles.trendText, { color: trendColor }]}>
              {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
            </Text>
          </View>
        </View>
        
        {/* Pin Button for performed exercises */}
        <TouchableOpacity
          style={styles.pinButtonInline}
          onPress={() => toggleFavorite(selectedExercise.exerciseId)}
        >
          <Ionicons
            name={favorites.includes(selectedExercise.exerciseId) ? 'star' : 'star-outline'}
            size={18}
            color={favorites.includes(selectedExercise.exerciseId) ? COLORS.warning : COLORS.mediumGray}
          />
          <Text style={[styles.pinButtonTextSmall, favorites.includes(selectedExercise.exerciseId) && { color: COLORS.warning }]}>
            {favorites.includes(selectedExercise.exerciseId) ? 'Pinned' : 'Pin to Favorites'}
          </Text>
        </TouchableOpacity>

        {/* Coach Tip */}
        <View style={styles.coachTipCard}>
          <View style={styles.coachTipHeader}>
            <Ionicons name="bulb" size={20} color={COLORS.warning} />
            <Text style={styles.coachTipTitle}>Coach Tip</Text>
          </View>
          <Text style={styles.coachTipText}>{coachTip}</Text>
        </View>

        {/* Personal Bests */}
        <View style={styles.pbSection}>
          <Text style={styles.sectionTitle}>Personal Bests</Text>
          
          <View style={styles.pbGrid}>
            {/* Actual PB */}
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={styles.pbMainCard}
            >
              <Text style={styles.pbMainLabel}>Actual PB</Text>
              <Text style={styles.pbMainValue}>{personalBests?.actualPB || 0}kg</Text>
              <Text style={styles.pbMainSub}>
                {personalBests?.bestSet?.reps || 0} reps @ {personalBests?.bestSet?.weight || 0}kg
              </Text>
            </LinearGradient>

            {/* Estimated 1RM */}
            <View style={styles.pbEstimatedCard}>
              <Text style={styles.pbEstLabel}>Est. 1RM (Epley)</Text>
              <Text style={styles.pbEstValue}>{personalBests?.estimatedOneRM || 0}kg</Text>
              {personalBests?.estimatedOneRM > personalBests?.actualPB && (
                <Text style={styles.pbMotivation}>You can hit this! 💪</Text>
              )}
            </View>
          </View>

          {/* Rep Maxes */}
          <View style={styles.repMaxRow}>
            <View style={styles.repMaxItem}>
              <Text style={styles.repMaxLabel}>3RM</Text>
              <Text style={styles.repMaxValue}>{personalBests?.estimated3RM || 0}kg</Text>
            </View>
            <View style={styles.repMaxItem}>
              <Text style={styles.repMaxLabel}>5RM</Text>
              <Text style={styles.repMaxValue}>{personalBests?.estimated5RM || 0}kg</Text>
            </View>
            <View style={styles.repMaxItem}>
              <Text style={styles.repMaxLabel}>6RM</Text>
              <Text style={styles.repMaxValue}>{personalBests?.estimated6RM || 0}kg</Text>
            </View>
            <View style={styles.repMaxItem}>
              <Text style={styles.repMaxLabel}>10RM</Text>
              <Text style={styles.repMaxValue}>{personalBests?.estimated10RM || 0}kg</Text>
            </View>
          </View>
        </View>

        {/* Progress Chart */}
        {chartData.length >= 2 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Strength Over Time</Text>
            <SimpleLineChart data={chartData} />
            
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.legendText}>
                  Strongest: {strongest?.weight}kg ({strongest?.date})
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
                <Text style={styles.legendText}>
                  Weakest: {weakest?.weight}kg ({weakest?.date})
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Session History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Session History</Text>
          <Text style={styles.historySubtitle}>
            {selectedExercise.totalSessions} sessions • First: {selectedExercise.firstSession}
          </Text>
          
          {history?.slice().reverse().slice(0, 10).map((session, index) => (
            <View key={session.date + index} style={styles.historyItem}>
              <View style={styles.historyDate}>
                <Text style={styles.historyDateText}>{session.date}</Text>
              </View>
              <View style={styles.historyStats}>
                <Text style={styles.historyStat}>{session.maxWeight}kg max</Text>
                <Text style={styles.historyStat}>{session.totalSets} sets</Text>
                <Text style={styles.historyStat}>{session.totalReps} reps</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            {view !== 'categories' ? (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="chevron-back" size={24} color={COLORS.accent} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
            
            <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
            
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.mediumGray} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {view === 'categories' && renderCategories()}
            {view === 'subcategories' && renderSubcategories()}
            {view === 'list' && renderExerciseList()}
            {view === 'detail' && renderExerciseDetail()}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Exercise List Item Component
const ExerciseListItem = ({ 
  exercise, 
  onPress, 
  onToggleFavorite, 
  isFavorite, 
  hasPerformed,
  disabled = false 
}: {
  exercise: Exercise;
  onPress: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
  hasPerformed: boolean;
  disabled?: boolean;
}) => (
  <TouchableOpacity
    style={[styles.exerciseCard, disabled && styles.exerciseCardDisabled]}
    onPress={onPress}
    activeOpacity={disabled ? 1 : 0.7}
    disabled={disabled}
  >
    <View style={styles.exerciseCardContent}>
      <View style={styles.exerciseInfo}>
        <View style={styles.exerciseNameRow}>
          <Text style={[styles.exerciseName, disabled && styles.exerciseNameDisabled]}>
            {exercise.exerciseName}
          </Text>
          {!hasPerformed && (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={12} color={COLORS.mediumGray} />
            </View>
          )}
        </View>
        {hasPerformed ? (
          <Text style={styles.exerciseMeta}>
            {exercise.sessionCount} sessions • PB: {exercise.maxWeight}kg
          </Text>
        ) : (
          <Text style={styles.exerciseMetaDisabled}>Not performed yet</Text>
        )}
      </View>
      
      {hasPerformed && (
        <View style={styles.exerciseStats}>
          <View style={styles.pbBadge}>
            <Text style={styles.pbLabel}>PB</Text>
            <Text style={styles.pbValue}>{exercise.maxWeight}kg</Text>
          </View>
          
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            <Ionicons
              name={isFavorite ? 'star' : 'star-outline'}
              size={22}
              color={isFavorite ? COLORS.warning : COLORS.mediumGray}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
    
    {hasPerformed && (
      <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', minHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  backButton: { padding: 4 },
  closeButton: { padding: 4 },
  contentContainer: { flex: 1 },
  content: { flex: 1, padding: 20 },
  
  // Global Search Container
  globalSearchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 10, marginBottom: 20 },

  // View Titles
  viewTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  viewSubtitle: { fontSize: 14, color: COLORS.mediumGray, marginBottom: 20 },

  // Categories Grid
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  categoryCard: { width: (width - 52) / 2, borderRadius: 16, overflow: 'hidden' },
  categoryGradient: { padding: 16, alignItems: 'center', minHeight: 120 },
  categoryIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  categoryName: { fontSize: 16, fontWeight: '700', color: COLORS.white, marginBottom: 4 },
  categoryCount: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  // Quick Access
  quickAccessSection: { marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  quickAccessCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 14, padding: 16 },
  quickAccessIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${COLORS.accent}15`, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  quickAccessText: { flex: 1 },
  quickAccessTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  quickAccessSubtitle: { fontSize: 13, color: COLORS.mediumGray, marginTop: 2 },

  // Subcategories
  subcategoryCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 16, marginBottom: 8 },
  subcategoryContent: { flexDirection: 'row', alignItems: 'center' },
  subcategoryDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  subcategoryName: { fontSize: 16, fontWeight: '600', color: COLORS.text },

  // Search
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 12, marginHorizontal: 20, marginTop: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },

  // Exercise List
  exerciseList: { flex: 1, paddingHorizontal: 20 },
  exerciseSection: { marginTop: 16 },
  exerciseSectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.mediumGray, marginBottom: 8 },
  exerciseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 14, padding: 16, marginBottom: 8 },
  exerciseCardDisabled: { backgroundColor: '#F5F5F5', opacity: 0.7 },
  exerciseCardContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exerciseInfo: { flex: 1 },
  exerciseNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  exerciseName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  exerciseNameDisabled: { color: COLORS.mediumGray },
  exerciseMeta: { fontSize: 13, color: COLORS.mediumGray, marginTop: 4 },
  exerciseMetaDisabled: { fontSize: 12, color: COLORS.mediumGray, marginTop: 4, fontStyle: 'italic' },
  lockBadge: { backgroundColor: '#E5E5E5', padding: 4, borderRadius: 8 },
  exerciseStats: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pbBadge: { alignItems: 'center' },
  pbLabel: { fontSize: 10, fontWeight: '700', color: COLORS.accent },
  pbValue: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  favoriteButton: { padding: 4 },

  // Loading/Empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: COLORS.mediumGray, marginTop: 8, textAlign: 'center' },

  // Detail View
  detailContent: { flex: 1, padding: 20 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  detailTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, flex: 1 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 4 },
  trendText: { fontSize: 13, fontWeight: '600' },

  // Coach Tip
  coachTipCard: { backgroundColor: `${COLORS.warning}15`, borderRadius: 14, padding: 16, marginBottom: 20 },
  coachTipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  coachTipTitle: { fontSize: 14, fontWeight: '700', color: COLORS.warning },
  coachTipText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },

  // PB Section
  pbSection: { marginBottom: 24 },
  pbGrid: { flexDirection: 'row', gap: 12 },
  pbMainCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
  pbMainLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  pbMainValue: { fontSize: 32, fontWeight: '800', color: COLORS.white, marginVertical: 4 },
  pbMainSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  pbEstimatedCard: { flex: 1, backgroundColor: COLORS.lightGray, borderRadius: 16, padding: 16, alignItems: 'center' },
  pbEstLabel: { fontSize: 12, fontWeight: '600', color: COLORS.mediumGray },
  pbEstValue: { fontSize: 32, fontWeight: '800', color: COLORS.text, marginVertical: 4 },
  pbMotivation: { fontSize: 11, color: COLORS.success, fontWeight: '600' },
  repMaxRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  repMaxItem: { flex: 1, backgroundColor: COLORS.lightGray, borderRadius: 10, padding: 12, alignItems: 'center' },
  repMaxLabel: { fontSize: 11, fontWeight: '600', color: COLORS.mediumGray },
  repMaxValue: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 2 },

  // Chart
  chartSection: { marginBottom: 24 },
  chartContainer: { marginVertical: 12 },
  yAxis: { position: 'absolute', left: 0, top: 0, bottom: 30, justifyContent: 'space-between', width: 40 },
  yAxisLabel: { fontSize: 10, color: COLORS.mediumGray },
  chartArea: { marginLeft: 45, position: 'relative' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: COLORS.lightGray },
  chartLine: { position: 'absolute', height: 2, backgroundColor: COLORS.accent, transformOrigin: 'left center' },
  chartPoint: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
  chartLegend: { marginTop: 12, gap: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: COLORS.mediumGray },

  // History
  historySection: { marginBottom: 24 },
  historySubtitle: { fontSize: 13, color: COLORS.mediumGray, marginBottom: 12 },
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  historyDate: { width: 90 },
  historyDateText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  historyStats: { flex: 1, flexDirection: 'row', gap: 16 },
  historyStat: { fontSize: 13, color: COLORS.mediumGray },
  
  // Unperformed Exercise Actions
  unperformedActions: { marginTop: 24, gap: 12 },
  addToFutureButton: { borderRadius: 14, overflow: 'hidden' },
  addToFutureGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  addToFutureText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  pinButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.lightGray, borderRadius: 14, paddingVertical: 14, gap: 8 },
  pinButtonText: { fontSize: 15, fontWeight: '600', color: COLORS.mediumGray },
  pinButtonInline: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6, marginBottom: 16 },
  pinButtonTextSmall: { fontSize: 13, fontWeight: '600', color: COLORS.mediumGray },
});
