/**
 * WorkoutSummaryScreen - Beautiful post-workout summary
 * Shows all exercises completed, performance comparison, PRs hit
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { COLORS as THEME_COLORS } from '../src/constants/colors';

const { width } = Dimensions.get('window');

const COLORS = {
  accent: THEME_COLORS.gradientStart,
  accentSecondary: THEME_COLORS.gradientEnd,
  white: THEME_COLORS.white,
  text: THEME_COLORS.text,
  lightGray: THEME_COLORS.lightGray,
  mediumGray: THEME_COLORS.mediumGray,
  success: THEME_COLORS.success,
  // Green theme for completion celebration
  successGradientStart: '#34C759',
  successGradientEnd: '#2DB54D',
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

interface ExerciseSummary {
  exerciseId: string;
  exerciseName: string;
  sets: Array<{ setNumber: number; weight: number; reps: number; rpe?: number }>;
  totalVolume: number;
  todayMax: number;
  repsAtMax: number; // Reps at max weight
  previousMax: number;
  isPR: boolean;
  improvement: string | null;
}

interface WorkoutStats {
  totalVolume: number;
  totalSets: number;
  exerciseCount: number;
  prsHit: number;
}

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const workoutId = params.workoutId as string;
  const workoutTitle = params.workoutTitle as string;
  const duration = params.duration as string;
  const caloriesBurned = params.caloriesBurned as string;
  
  const [exercises, setExercises] = useState<ExerciseSummary[]>([]);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!workoutId) {
      setIsLoading(false);
      return;
    }
    
    try {
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      const response = await fetch(`${API_BASE_URL}/api/stats/workout-summary/${workoutId}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });
      
      if (response.ok) {
        const data = await response.json();
        setExercises(data.exercises || []);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    } finally {
      setIsLoading(false);
    }
  }, [workoutId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const toggleExercise = (exerciseId: string) => {
    setExpandedExercise(expandedExercise === exerciseId ? null : exerciseId);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading summary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Green Success Theme */}
      <LinearGradient
        colors={[COLORS.successGradientStart, COLORS.successGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.closeButton} onPress={() => router.replace('/(tabs)')}>
          <Ionicons name="close" size={24} color={COLORS.white} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="trophy" size={32} color={COLORS.white} />
          </View>
          <Text style={styles.headerTitle}>Workout Complete!</Text>
          <Text style={styles.headerSubtitle}>{workoutTitle || 'Great workout'}</Text>
        </View>
        
        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <Ionicons name="time-outline" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.quickStatValue}>{duration || '45'} min</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <Ionicons name="flame-outline" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.quickStatValue}>{caloriesBurned || '0'} cal</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <Ionicons name="barbell-outline" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.quickStatValue}>{stats?.totalSets || 0} sets</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* PRs Hit Banner */}
        {stats && stats.prsHit > 0 && (
          <View style={styles.prBanner}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.prBannerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="medal" size={24} color={COLORS.white} />
              <Text style={styles.prBannerText}>
                🎉 {stats.prsHit} Personal Record{stats.prsHit > 1 ? 's' : ''} Hit!
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* Performance Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Summary</Text>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{stats?.totalVolume?.toLocaleString() || 0}</Text>
              <Text style={styles.summaryLabel}>Total Volume (kg)</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{stats?.exerciseCount || exercises.length}</Text>
              <Text style={styles.summaryLabel}>Exercises</Text>
            </View>
          </View>
        </View>

        {/* Exercise Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercise Breakdown</Text>
          
          {exercises.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="barbell-outline" size={32} color={COLORS.mediumGray} />
              <Text style={styles.emptyText}>No exercise data recorded</Text>
              <Text style={styles.emptySubtext}>Complete sets during your workout to see stats here</Text>
            </View>
          ) : (
            exercises.map((exercise) => (
              <TouchableOpacity
                key={exercise.exerciseId}
                style={styles.exerciseCard}
                onPress={() => toggleExercise(exercise.exerciseId)}
                activeOpacity={0.7}
              >
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseInfo}>
                    <View style={styles.exerciseNameRow}>
                      <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                      {exercise.isPR && (
                        <View style={styles.prBadge}>
                          <Text style={styles.prBadgeText}>PR!</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.exerciseMeta}>
                      {exercise.sets.length} sets • {exercise.totalVolume.toLocaleString()} kg volume
                    </Text>
                  </View>
                  
                  <View style={styles.exerciseMax}>
                    <Text style={styles.maxLabel}>Max</Text>
                    <Text style={styles.maxValue}>{exercise.todayMax}kg × {exercise.repsAtMax || 0}</Text>
                    {exercise.previousMax > 0 && (
                      <Text style={[
                        styles.comparison,
                        exercise.todayMax > exercise.previousMax ? styles.comparisonUp : 
                        exercise.todayMax < exercise.previousMax ? styles.comparisonDown : styles.comparisonNeutral
                      ]}>
                        {exercise.todayMax > exercise.previousMax ? '↑' : 
                         exercise.todayMax < exercise.previousMax ? '↓' : '='} vs {exercise.previousMax}kg
                      </Text>
                    )}
                  </View>
                  
                  <Ionicons 
                    name={expandedExercise === exercise.exerciseId ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={COLORS.mediumGray} 
                  />
                </View>
                
                {/* Expanded Sets */}
                {expandedExercise === exercise.exerciseId && (
                  <View style={styles.setsContainer}>
                    {exercise.sets.map((set, index) => (
                      <View key={index} style={styles.setRow}>
                        <Text style={styles.setNumber}>Set {set.setNumber}</Text>
                        <Text style={styles.setWeight}>{set.weight || 0}kg</Text>
                        <Text style={styles.setReps}>{set.reps || 0} reps</Text>
                        {set.rpe && <Text style={styles.setRpe}>RPE {set.rpe}</Text>}
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Done Button - Green Theme */}
        <TouchableOpacity 
          style={styles.doneButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <LinearGradient
            colors={[COLORS.successGradientStart, COLORS.successGradientEnd]}
            style={styles.doneButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.mediumGray },
  
  // Header
  header: { paddingTop: 16, paddingBottom: 24, paddingHorizontal: 20 },
  closeButton: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 8 },
  headerContent: { alignItems: 'center', marginTop: 8 },
  headerIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  
  quickStats: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12 },
  quickStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  quickStatValue: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  quickStatDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 16 },
  
  content: { flex: 1, paddingHorizontal: 20 },
  
  // PR Banner
  prBanner: { marginTop: 20, marginBottom: 8, borderRadius: 12, overflow: 'hidden' },
  prBannerGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, gap: 8 },
  prBannerText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  
  // Sections
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  
  // Summary Grid
  summaryGrid: { flexDirection: 'row', gap: 12 },
  summaryCard: { flex: 1, backgroundColor: COLORS.lightGray, borderRadius: 14, padding: 16, alignItems: 'center' },
  summaryValue: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  summaryLabel: { fontSize: 12, color: COLORS.mediumGray, marginTop: 4 },
  
  // Exercise Cards
  exerciseCard: { backgroundColor: COLORS.lightGray, borderRadius: 14, padding: 16, marginBottom: 12 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center' },
  exerciseInfo: { flex: 1 },
  exerciseNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exerciseName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  prBadge: { backgroundColor: '#FFD700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  prBadgeText: { fontSize: 10, fontWeight: '800', color: '#8B4513' },
  exerciseMeta: { fontSize: 13, color: COLORS.mediumGray, marginTop: 4 },
  exerciseMax: { alignItems: 'flex-end', marginRight: 12 },
  maxLabel: { fontSize: 10, fontWeight: '600', color: COLORS.mediumGray },
  maxValue: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  comparison: { fontSize: 11, marginTop: 2 },
  comparisonUp: { color: COLORS.success },
  comparisonDown: { color: '#FF3B30' },
  comparisonNeutral: { color: COLORS.mediumGray },
  
  // Expanded Sets
  setsContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.white },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  setNumber: { width: 60, fontSize: 13, fontWeight: '600', color: COLORS.mediumGray },
  setWeight: { width: 70, fontSize: 14, fontWeight: '600', color: COLORS.text },
  setReps: { flex: 1, fontSize: 14, color: COLORS.text },
  setRpe: { fontSize: 12, color: COLORS.accent, fontWeight: '600' },
  
  // Empty State
  emptyCard: { backgroundColor: COLORS.lightGray, borderRadius: 14, padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginTop: 12 },
  emptySubtext: { fontSize: 13, color: COLORS.mediumGray, marginTop: 4, textAlign: 'center' },
  
  // Done Button
  doneButton: { marginTop: 24, borderRadius: 14, overflow: 'hidden' },
  doneButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  doneButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});
