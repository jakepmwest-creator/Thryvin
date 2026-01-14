/**
 * ExerciseStatsModal - Detailed exercise performance tracking
 * Shows PBs, history, graphs, and allows setting favorites
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
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://fitness-stats-7.preview.emergentagent.com';

interface ExerciseStatsModalProps {
  visible: boolean;
  onClose: () => void;
  initialExerciseId?: string;
}

interface Exercise {
  exerciseId: string;
  exerciseName: string;
  totalSets: number;
  totalReps: number;
  maxWeight: number;
  lastPerformed: string;
  sessionCount: number;
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

export const ExerciseStatsModal = ({ visible, onClose, initialExerciseId }: ExerciseStatsModalProps) => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Fetch all exercises
  const fetchExercises = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      
      const response = await fetch(`${API_BASE_URL}/api/stats/exercises`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });
      
      if (response.ok) {
        const data = await response.json();
        setExercises(data.exercises || []);
      }
    } catch (err) {
      console.error('Error fetching exercises:', err);
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
        newFavorites = favorites.filter(id => id !== exerciseId);
      } else {
        if (favorites.length >= 3) {
          // Remove oldest, add new
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
      fetchExercises();
      fetchFavorites();
      
      if (initialExerciseId) {
        fetchExerciseDetail(initialExerciseId);
      }
    }
  }, [visible, initialExerciseId, fetchExercises, fetchFavorites, fetchExerciseDetail]);

  // Filter exercises by search
  const filteredExercises = exercises.filter(ex =>
    ex.exerciseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClose = () => {
    setView('list');
    setSelectedExercise(null);
    setSearchQuery('');
    onClose();
  };

  const renderExerciseList = () => (
    <>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.mediumGray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
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
      ) : filteredExercises.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="barbell-outline" size={48} color={COLORS.mediumGray} />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No exercises found' : 'No exercises logged yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'Try a different search' : 'Complete workouts to see your stats here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.exerciseId}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.exerciseCard}
              onPress={() => fetchExerciseDetail(item.exerciseId)}
              activeOpacity={0.7}
            >
              <View style={styles.exerciseCardContent}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{item.exerciseName}</Text>
                  <Text style={styles.exerciseMeta}>
                    {item.sessionCount} sessions • {item.totalSets} total sets
                  </Text>
                </View>
                
                <View style={styles.exerciseStats}>
                  <View style={styles.pbBadge}>
                    <Text style={styles.pbLabel}>PB</Text>
                    <Text style={styles.pbValue}>{item.maxWeight}kg</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => toggleFavorite(item.exerciseId)}
                  >
                    <Ionicons
                      name={favorites.includes(item.exerciseId) ? 'star' : 'star-outline'}
                      size={22}
                      color={favorites.includes(item.exerciseId) ? COLORS.warning : COLORS.mediumGray}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              
              <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </>
  );

  const renderExerciseDetail = () => {
    if (!selectedExercise) return null;

    const { personalBests, history, trend, strongest, weakest } = selectedExercise;
    const chartData = history.map(h => h.maxWeight);
    
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
                {personalBests?.bestSet?.reps} reps @ {personalBests?.bestSet?.weight}kg
              </Text>
            </LinearGradient>

            {/* Estimated 1RM */}
            <View style={styles.pbEstimatedCard}>
              <Text style={styles.pbEstLabel}>Est. 1RM</Text>
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
            <Text style={styles.sectionTitle}>Progress Over Time</Text>
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
          
          {history.slice().reverse().slice(0, 10).map((session, index) => (
            <View key={session.date} style={styles.historyItem}>
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
            {view === 'detail' ? (
              <TouchableOpacity style={styles.backButton} onPress={() => { setView('list'); setSelectedExercise(null); }}>
                <Ionicons name="chevron-back" size={24} color={COLORS.accent} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
            
            <Text style={styles.headerTitle}>
              {view === 'list' ? 'Exercise Stats' : 'Exercise Detail'}
            </Text>
            
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.mediumGray} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {view === 'list' ? renderExerciseList() : renderExerciseDetail()}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', minHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  backButton: { padding: 4 },
  closeButton: { padding: 4 },
  content: { flex: 1 },

  // Search
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 12, marginHorizontal: 20, marginTop: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },

  // Loading/Empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: COLORS.mediumGray, marginTop: 8, textAlign: 'center' },

  // List
  listContent: { padding: 20, paddingTop: 16 },
  exerciseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 14, padding: 16, marginBottom: 12 },
  exerciseCardContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  exerciseMeta: { fontSize: 13, color: COLORS.mediumGray, marginTop: 4 },
  exerciseStats: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pbBadge: { alignItems: 'center' },
  pbLabel: { fontSize: 10, fontWeight: '700', color: COLORS.accent },
  pbValue: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  favoriteButton: { padding: 4 },

  // Detail
  detailContent: { flex: 1, padding: 20 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  detailTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, flex: 1 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 4 },
  trendText: { fontSize: 13, fontWeight: '600' },

  // PB Section
  pbSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
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
});
