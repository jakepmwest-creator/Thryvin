/**
 * FavoriteExercisesCard - Shows 3 pinned favorite exercises on stats page
 * Mini cards with PB and recent trend
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS as THEME_COLORS } from '../constants/colors';

const COLORS = {
  accent: THEME_COLORS.gradientStart,
  accentSecondary: THEME_COLORS.gradientEnd,
  white: THEME_COLORS.white,
  text: THEME_COLORS.text,
  lightGray: THEME_COLORS.lightGray,
  mediumGray: THEME_COLORS.mediumGray,
  success: THEME_COLORS.success,
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://fitness-tracker-792.preview.emergentagent.com';

interface FavoriteExercise {
  exerciseId: string;
  exerciseName: string;
  actualPB: number;
  estimatedOneRM: number;
  trend: 'up' | 'down' | 'neutral';
  lastWeight: number;
}

interface Props {
  onViewAll: () => void;
  onExercisePress: (exerciseId: string) => void;
  refreshTrigger?: number; // Increment this to force refresh
}

export const FavoriteExercisesCard = ({ onViewAll, onExercisePress, refreshTrigger }: Props) => {
  const [favorites, setFavorites] = useState<FavoriteExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      if (!token) {
        console.warn('No auth token, skipping favorites fetch');
        setIsLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/stats/favorites`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
        if (__DEV__) {
          console.log('📊 [FavoriteExercisesCard] Fetched favorites:', data.favorites?.length || 0);
        }
      } else if (response.status === 401) {
        console.warn('Auth token expired or invalid');
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount and when refresh trigger changes
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites, refreshTrigger]);
  
  // Also fetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites])
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Favorite Exercises</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.accent} />
        </View>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Favorite Exercises</Text>
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAll}>Add Favorites</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.emptyCard} onPress={onViewAll}>
          <Ionicons name="star-outline" size={32} color={COLORS.mediumGray} />
          <Text style={styles.emptyText}>Pin up to 3 exercises</Text>
          <Text style={styles.emptySubtext}>Tap to choose your favorites</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorite Exercises</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardsRow}>
        {favorites.map((exercise, index) => {
          const TrendIcon = exercise.trend === 'up' ? 'trending-up' : 
                           exercise.trend === 'down' ? 'trending-down' : 'remove';
          const trendColor = exercise.trend === 'up' ? COLORS.success : 
                            exercise.trend === 'down' ? '#FF3B30' : COLORS.mediumGray;

          return (
            <TouchableOpacity
              key={exercise.exerciseId}
              style={styles.card}
              onPress={() => onExercisePress(exercise.exerciseId)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={index === 0 ? [COLORS.accent, COLORS.accentSecondary] : ['transparent', 'transparent']}
                style={[styles.cardGradient, index > 0 && styles.cardPlain]}
              >
                <View style={styles.cardHeader}>
                  <Ionicons 
                    name="star" 
                    size={14} 
                    color={index === 0 ? 'rgba(255,255,255,0.8)' : COLORS.warning} 
                  />
                  <Ionicons name={TrendIcon as any} size={14} color={index === 0 ? COLORS.white : trendColor} />
                </View>
                
                <Text 
                  style={[styles.exerciseName, index > 0 && styles.exerciseNameDark]} 
                  numberOfLines={2}
                >
                  {exercise.exerciseName}
                </Text>
                
                <View style={styles.pbRow}>
                  <Text style={[styles.pbLabel, index > 0 && styles.pbLabelDark]}>PB</Text>
                  <Text style={[styles.pbValue, index > 0 && styles.pbValueDark]}>
                    {exercise.actualPB}kg
                  </Text>
                </View>
                
                <Text style={[styles.lastWeight, index > 0 && styles.lastWeightDark]}>
                  Last: {exercise.lastWeight}kg
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
        
        {/* Empty slots */}
        {[...Array(3 - favorites.length)].map((_, index) => (
          <TouchableOpacity
            key={`empty-${index}`}
            style={styles.card}
            onPress={onViewAll}
            activeOpacity={0.7}
          >
            <View style={styles.emptySlot}>
              <Ionicons name="add" size={24} color={COLORS.mediumGray} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  viewAll: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  
  loadingContainer: { height: 130, justifyContent: 'center', alignItems: 'center' },
  
  emptyCard: { backgroundColor: COLORS.lightGray, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.mediumGray },
  emptyText: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginTop: 12 },
  emptySubtext: { fontSize: 13, color: COLORS.mediumGray, marginTop: 4 },
  
  cardsRow: { flexDirection: 'row', gap: 10 },
  card: { flex: 1 },
  cardGradient: { borderRadius: 14, padding: 14, minHeight: 130 },
  cardPlain: { backgroundColor: COLORS.lightGray },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  
  exerciseName: { fontSize: 13, fontWeight: '600', color: COLORS.white, marginBottom: 8, lineHeight: 18 },
  exerciseNameDark: { color: COLORS.text },
  
  pbRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  pbLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  pbLabelDark: { color: COLORS.mediumGray },
  pbValue: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  pbValueDark: { color: COLORS.text },
  
  lastWeight: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  lastWeightDark: { color: COLORS.mediumGray },
  
  emptySlot: { backgroundColor: COLORS.lightGray, borderRadius: 14, minHeight: 130, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.mediumGray },
});
