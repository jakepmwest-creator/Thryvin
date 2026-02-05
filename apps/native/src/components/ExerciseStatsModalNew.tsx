/**
 * ExerciseStatsModal - Professional Thryvin-Styled Exercise Stats
 * 
 * Features:
 * - Beautiful purple-to-pink gradients
 * - Progress chart with best ever vs last session comparison
 * - Clean stats cards with RM estimates
 * - Session history dropdown
 * - Pin to favorites
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { COLORS as THEME_COLORS } from '../constants/colors';

const { width, height } = Dimensions.get('window');

const COLORS = {
  // Thryvin purple-pink gradient colors
  gradientStart: '#8B5CF6',
  gradientMid: '#A855F7', 
  gradientEnd: '#EC4899',
  
  // UI colors
  background: '#0F0F1A',
  cardBg: '#1A1A2E',
  cardBgLight: '#252542',
  white: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#A0A0B0',
  textMuted: '#6B6B80',
  
  // Status colors
  success: '#10B981',
  successBg: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.15)',
  error: '#EF4444',
  
  // Chart colors
  chartLine: '#8B5CF6',
  chartFill: 'rgba(139, 92, 246, 0.2)',
  chartBest: '#10B981',
  chartLast: '#EC4899',
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://bugzapper-55.preview.emergentagent.com';

interface ExerciseStatsModalProps {
  visible: boolean;
  onClose: () => void;
  initialExerciseId?: string;
  currentWorkoutId?: string;
  thisWorkoutData?: {
    exerciseId: string;
    exerciseName: string;
    sets: Array<{ setNumber: number; weight: number; reps: number; volume?: number }>;
    totalVolume: number;
    todayMax?: number;
    repsAtMax?: number;
    isPR?: boolean;
  };
}

interface SessionHistory {
  date: string;
  maxWeight: number;
  totalReps: number;
  totalSets: number;
  totalVolume: number;
  estimatedOneRM: number;
}

interface ExerciseDetail {
  exerciseId: string;
  exerciseName?: string;
  name?: string;
  history: SessionHistory[];
  pbs?: {
    maxWeight: number;
    maxReps: number;
    maxVolume: number;
    estimatedOneRM: number;
    estimated3RM: number;
    estimated5RM: number;
    estimated10RM: number;
    bestWeightSet?: { weight: number; reps: number; date: string };
  };
  personalBests?: {
    actualPB: number;
    estimatedOneRM: number;
    estimated3RM: number;
    estimated5RM: number;
    estimated10RM: number;
    maxReps: number;
    maxVolume: number;
    bestSet: { weight: number; reps: number; date: string };
  };
  lastSession?: {
    date: string;
    sets: Array<{ setNumber: number; weight: number; reps: number; volume: number }>;
  };
  trend: 'up' | 'down' | 'neutral';
  totalSessions: number;
}

// Beautiful gradient progress chart
const ProgressChart = ({ 
  data, 
  bestEver, 
  lastSession 
}: { 
  data: number[]; 
  bestEver: number; 
  lastSession: number;
}) => {
  if (data.length < 2) {
    return (
      <View style={chartStyles.emptyChart}>
        <Ionicons name="analytics-outline" size={40} color={COLORS.textMuted} />
        <Text style={chartStyles.emptyText}>Complete more sessions to see your progress</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data, bestEver) * 1.1;
  const minValue = Math.min(...data) * 0.9;
  const range = maxValue - minValue || 1;
  const chartWidth = width - 80;
  const chartHeight = 140;
  const pointSpacing = chartWidth / (data.length - 1);

  // Create SVG-like path for the line
  const points = data.map((value, index) => ({
    x: index * pointSpacing,
    y: ((maxValue - value) / range) * chartHeight,
  }));

  return (
    <View style={chartStyles.container}>
      {/* Chart header */}
      <View style={chartStyles.header}>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDot, { backgroundColor: COLORS.chartBest }]} />
          <Text style={chartStyles.legendText}>Best Ever: {bestEver}kg</Text>
        </View>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDot, { backgroundColor: COLORS.chartLast }]} />
          <Text style={chartStyles.legendText}>Last: {lastSession}kg</Text>
        </View>
      </View>

      {/* Chart area */}
      <View style={[chartStyles.chartArea, { height: chartHeight + 40 }]}>
        {/* Y-axis labels */}
        <View style={chartStyles.yAxis}>
          <Text style={chartStyles.axisLabel}>{Math.round(maxValue)}kg</Text>
          <Text style={chartStyles.axisLabel}>{Math.round((maxValue + minValue) / 2)}kg</Text>
          <Text style={chartStyles.axisLabel}>{Math.round(minValue)}kg</Text>
        </View>

        {/* Grid and chart */}
        <View style={chartStyles.gridContainer}>
          {/* Horizontal grid lines */}
          <View style={[chartStyles.gridLine, { top: 0 }]} />
          <View style={[chartStyles.gridLine, { top: '50%' }]} />
          <View style={[chartStyles.gridLine, { top: '100%' }]} />

          {/* Best ever line */}
          <View 
            style={[
              chartStyles.bestLine, 
              { top: ((maxValue - bestEver) / range) * chartHeight }
            ]} 
          />

          {/* Data points and lines */}
          {points.map((point, index) => (
            <React.Fragment key={index}>
              {/* Line to next point */}
              {index < points.length - 1 && (
                <LinearGradient
                  colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    chartStyles.line,
                    {
                      left: point.x,
                      top: point.y + 6,
                      width: Math.sqrt(
                        Math.pow(pointSpacing, 2) + 
                        Math.pow(points[index + 1].y - point.y, 2)
                      ),
                      transform: [{
                        rotate: `${Math.atan2(
                          points[index + 1].y - point.y,
                          pointSpacing
                        )}rad`
                      }],
                    }
                  ]}
                />
              )}

              {/* Point */}
              <LinearGradient
                colors={index === points.length - 1 
                  ? [COLORS.chartLast, COLORS.gradientEnd]
                  : [COLORS.gradientStart, COLORS.gradientMid]
                }
                style={[
                  chartStyles.point,
                  { left: point.x - 6, top: point.y },
                  index === points.length - 1 && chartStyles.pointLast,
                ]}
              />
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* X-axis labels */}
      <View style={chartStyles.xAxis}>
        <Text style={chartStyles.axisLabel}>Oldest</Text>
        <Text style={chartStyles.axisLabel}>Recent</Text>
      </View>
    </View>
  );
};

// Stats card component
const StatsCard = ({ 
  label, 
  value, 
  unit = 'kg',
  subtitle,
  icon,
  gradient = false,
  small = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: string;
  gradient?: boolean;
  small?: boolean;
}) => {
  const CardWrapper = gradient ? LinearGradient : View;
  const cardProps = gradient 
    ? { colors: [COLORS.gradientStart, COLORS.gradientEnd], start: { x: 0, y: 0 }, end: { x: 1, y: 1 } }
    : {};

  return (
    <CardWrapper {...cardProps} style={[statsStyles.card, small && statsStyles.cardSmall]}>
      {icon && (
        <Ionicons 
          name={icon as any} 
          size={small ? 16 : 20} 
          color={gradient ? COLORS.white : COLORS.gradientStart} 
          style={statsStyles.cardIcon}
        />
      )}
      <Text style={[
        statsStyles.cardLabel, 
        gradient && statsStyles.cardLabelLight,
        small && statsStyles.cardLabelSmall,
      ]}>
        {label}
      </Text>
      <Text style={[
        statsStyles.cardValue, 
        gradient && statsStyles.cardValueLight,
        small && statsStyles.cardValueSmall,
      ]}>
        {value}<Text style={statsStyles.cardUnit}>{unit}</Text>
      </Text>
      {subtitle && (
        <Text style={[statsStyles.cardSubtitle, gradient && statsStyles.cardSubtitleLight]}>
          {subtitle}
        </Text>
      )}
    </CardWrapper>
  );
};

export const ExerciseStatsModal = ({ 
  visible, 
  onClose, 
  initialExerciseId, 
  currentWorkoutId, 
  thisWorkoutData 
}: ExerciseStatsModalProps) => {
  const [exerciseDetail, setExerciseDetail] = useState<ExerciseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionHistory | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Fetch exercise details
  const fetchExerciseDetail = useCallback(async (exerciseId: string) => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      const response = await fetch(
        `${API_BASE_URL}/api/stats/exercise/${exerciseId}`,
        { headers: { 'Authorization': token ? `Bearer ${token}` : '' } }
      );

      if (response.ok) {
        const data = await response.json();
        setExerciseDetail(data);
        
        // Animate in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.error('Error fetching exercise detail:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fadeAnim]);

  // Check if exercise is favorited
  const checkFavorite = useCallback(async (exerciseId: string) => {
    try {
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      const response = await fetch(`${API_BASE_URL}/api/stats/favorites`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });
      
      if (response.ok) {
        const data = await response.json();
        const ids = data.favoriteIds || data.favorites?.map((f: any) => f.exerciseId) || [];
        setIsFavorite(ids.includes(exerciseId));
      }
    } catch (err) {
      console.error('Error checking favorite:', err);
    }
  }, []);

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!exerciseDetail) return;
    
    try {
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      const response = await fetch(`${API_BASE_URL}/api/stats/favorites`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });
      
      if (response.ok) {
        const data = await response.json();
        let currentFavorites = data.favoriteIds || data.favorites?.map((f: any) => f.exerciseId) || [];
        
        let newFavorites: string[];
        if (isFavorite) {
          newFavorites = currentFavorites.filter((id: string) => id !== exerciseDetail.exerciseId);
        } else {
          if (currentFavorites.length >= 3) {
            newFavorites = [...currentFavorites.slice(1), exerciseDetail.exerciseId];
          } else {
            newFavorites = [...currentFavorites, exerciseDetail.exerciseId];
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
        
        setIsFavorite(!isFavorite);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  useEffect(() => {
    if (visible && initialExerciseId) {
      fetchExerciseDetail(initialExerciseId);
      checkFavorite(initialExerciseId);
    }
  }, [visible, initialExerciseId, fetchExerciseDetail, checkFavorite]);

  const handleClose = () => {
    fadeAnim.setValue(0);
    setExerciseDetail(null);
    setShowHistory(false);
    setSelectedSession(null);
    onClose();
  };

  // Get PBs from either format
  const pbs = exerciseDetail?.pbs || exerciseDetail?.personalBests;
  const exerciseName = exerciseDetail?.exerciseName || exerciseDetail?.name || thisWorkoutData?.exerciseName || 'Exercise';
  const chartData = exerciseDetail?.history?.map(h => h.maxWeight) || [];
  const bestEver = pbs?.maxWeight || pbs?.actualPB || 0;
  const lastSessionWeight = exerciseDetail?.lastSession?.sets?.[0]?.weight || 
    (chartData.length > 0 ? chartData[chartData.length - 1] : 0);

  // Calculate comparison to best
  const currentMax = thisWorkoutData?.todayMax || lastSessionWeight;
  const comparisonToBest = bestEver > 0 ? Math.round(((currentMax - bestEver) / bestEver) * 100) : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Gradient Header */}
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={COLORS.white} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} numberOfLines={2}>{exerciseName}</Text>
            
            {/* Trend badge */}
            {exerciseDetail && (
              <View style={[
                styles.trendBadge,
                exerciseDetail.trend === 'up' && styles.trendBadgeUp,
                exerciseDetail.trend === 'down' && styles.trendBadgeDown,
              ]}>
                <Ionicons 
                  name={exerciseDetail.trend === 'up' ? 'trending-up' : 
                        exerciseDetail.trend === 'down' ? 'trending-down' : 'remove'} 
                  size={16} 
                  color={COLORS.white} 
                />
                <Text style={styles.trendText}>
                  {exerciseDetail.trend === 'up' ? 'Improving' : 
                   exerciseDetail.trend === 'down' ? 'Declining' : 'Stable'}
                </Text>
              </View>
            )}
          </View>

          {/* Pin to favorites - next to title */}
          <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
            <Ionicons 
              name={isFavorite ? 'star' : 'star-outline'} 
              size={24} 
              color={isFavorite ? COLORS.warning : COLORS.white} 
            />
          </TouchableOpacity>
        </LinearGradient>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.gradientStart} />
            <Text style={styles.loadingText}>Loading stats...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            <Animated.View style={{ opacity: fadeAnim }}>
              
              {/* THIS WORKOUT - Green themed card */}
              {thisWorkoutData && (
                <View style={styles.thisWorkoutCard}>
                  <LinearGradient
                    colors={['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)']}
                    style={styles.thisWorkoutGradient}
                  >
                    <View style={styles.thisWorkoutHeader}>
                      <View style={styles.thisWorkoutTitleRow}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                        <Text style={styles.thisWorkoutTitle}>This Session</Text>
                        {thisWorkoutData.isPR && (
                          <View style={styles.prBadge}>
                            <Text style={styles.prBadgeText}>NEW PR!</Text>
                          </View>
                        )}
                      </View>
                      {comparisonToBest !== 0 && (
                        <Text style={[
                          styles.comparisonText,
                          comparisonToBest > 0 ? styles.comparisonUp : styles.comparisonDown
                        ]}>
                          {comparisonToBest > 0 ? '+' : ''}{comparisonToBest}% vs best
                        </Text>
                      )}
                    </View>

                    {/* Sets table */}
                    <View style={styles.setsTable}>
                      <View style={styles.setsHeader}>
                        <Text style={styles.setsHeaderText}>Set</Text>
                        <Text style={styles.setsHeaderText}>Weight</Text>
                        <Text style={styles.setsHeaderText}>Reps</Text>
                        <Text style={styles.setsHeaderText}>Volume</Text>
                      </View>
                      {thisWorkoutData.sets.map((set, idx) => (
                        <View key={idx} style={styles.setRow}>
                          <Text style={styles.setCell}>{set.setNumber || idx + 1}</Text>
                          <Text style={styles.setCellBold}>{set.weight}kg</Text>
                          <Text style={styles.setCell}>{set.reps}</Text>
                          <Text style={styles.setCell}>{set.volume || set.weight * set.reps}kg</Text>
                        </View>
                      ))}
                    </View>

                    {/* Summary row */}
                    <View style={styles.thisWorkoutSummary}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Max Weight</Text>
                        <Text style={styles.summaryValue}>
                          {thisWorkoutData.todayMax}kg
                          {thisWorkoutData.repsAtMax ? ` × ${thisWorkoutData.repsAtMax}` : ''}
                        </Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Total Volume</Text>
                        <Text style={styles.summaryValue}>{thisWorkoutData.totalVolume}kg</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              )}

              {/* Progress Chart */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Progress Over Time</Text>
                <View style={styles.chartCard}>
                  <ProgressChart 
                    data={chartData} 
                    bestEver={bestEver}
                    lastSession={lastSessionWeight}
                  />
                </View>
              </View>

              {/* Personal Bests Grid */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personal Bests</Text>
                <View style={styles.pbGrid}>
                  {/* Main PB card */}
                  <StatsCard
                    label="Best Ever"
                    value={bestEver || '--'}
                    icon="trophy"
                    gradient
                    subtitle={pbs?.bestWeightSet?.date || pbs?.bestSet?.date || ''}
                  />
                  
                  {/* RM Estimates */}
                  <View style={styles.rmGrid}>
                    <StatsCard
                      label="Est. 1RM"
                      value={pbs?.estimatedOneRM || '--'}
                      small
                    />
                    <StatsCard
                      label="Est. 3RM"
                      value={pbs?.estimated3RM || '--'}
                      small
                    />
                    <StatsCard
                      label="Est. 5RM"
                      value={pbs?.estimated5RM || '--'}
                      small
                    />
                    <StatsCard
                      label="Est. 10RM"
                      value={pbs?.estimated10RM || '--'}
                      small
                    />
                  </View>
                </View>
              </View>

              {/* Volume & Reps Records */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Records</Text>
                <View style={styles.recordsRow}>
                  <View style={styles.recordCard}>
                    <Ionicons name="fitness" size={24} color={COLORS.gradientStart} />
                    <Text style={styles.recordLabel}>Max Volume</Text>
                    <Text style={styles.recordValue}>{pbs?.maxVolume || '--'}kg</Text>
                    <Text style={styles.recordSub}>single session</Text>
                  </View>
                  <View style={styles.recordCard}>
                    <Ionicons name="repeat" size={24} color={COLORS.gradientEnd} />
                    <Text style={styles.recordLabel}>Max Reps</Text>
                    <Text style={styles.recordValue}>{pbs?.maxReps || '--'}</Text>
                    <Text style={styles.recordSub}>single set</Text>
                  </View>
                  <View style={styles.recordCard}>
                    <Ionicons name="calendar" size={24} color={COLORS.success} />
                    <Text style={styles.recordLabel}>Sessions</Text>
                    <Text style={styles.recordValue}>{exerciseDetail?.totalSessions || 0}</Text>
                    <Text style={styles.recordSub}>total</Text>
                  </View>
                </View>
              </View>

              {/* Session History Dropdown */}
              <View style={styles.section}>
                <TouchableOpacity 
                  style={styles.historyDropdown}
                  onPress={() => setShowHistory(!showHistory)}
                >
                  <View style={styles.historyDropdownLeft}>
                    <Ionicons name="time-outline" size={20} color={COLORS.gradientStart} />
                    <Text style={styles.historyDropdownTitle}>Session History</Text>
                  </View>
                  <View style={styles.historyDropdownRight}>
                    <Text style={styles.historyCount}>
                      {exerciseDetail?.history?.length || 0} sessions
                    </Text>
                    <Ionicons 
                      name={showHistory ? 'chevron-up' : 'chevron-down'} 
                      size={20} 
                      color={COLORS.textSecondary} 
                    />
                  </View>
                </TouchableOpacity>

                {showHistory && exerciseDetail?.history && (
                  <View style={styles.historyList}>
                    {exerciseDetail.history.slice(0, 10).map((session, idx) => (
                      <TouchableOpacity 
                        key={idx} 
                        style={[
                          styles.historyItem,
                          selectedSession === session && styles.historyItemSelected
                        ]}
                        onPress={() => setSelectedSession(
                          selectedSession === session ? null : session
                        )}
                      >
                        <View style={styles.historyItemLeft}>
                          <Text style={styles.historyDate}>{session.date}</Text>
                          <Text style={styles.historyStats}>
                            {session.totalSets} sets · {session.totalReps} reps
                          </Text>
                        </View>
                        <View style={styles.historyItemRight}>
                          <Text style={styles.historyWeight}>{session.maxWeight}kg</Text>
                          <Text style={styles.historyVolume}>{session.totalVolume}kg vol</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Last Session Card */}
              {exerciseDetail?.lastSession && !thisWorkoutData && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Last Session</Text>
                  <View style={styles.lastSessionCard}>
                    <Text style={styles.lastSessionDate}>{exerciseDetail.lastSession.date}</Text>
                    <View style={styles.lastSessionSets}>
                      {exerciseDetail.lastSession.sets.map((set, idx) => (
                        <View key={idx} style={styles.lastSessionSet}>
                          <Text style={styles.lastSessionSetNum}>Set {set.setNumber}</Text>
                          <Text style={styles.lastSessionSetWeight}>{set.weight}kg</Text>
                          <Text style={styles.lastSessionSetReps}>× {set.reps}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              <View style={{ height: 40 }} />
            </Animated.View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  trendBadgeUp: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  trendBadgeDown: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  trendText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  
  // This Workout Card
  thisWorkoutCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  thisWorkoutGradient: {
    padding: 16,
  },
  thisWorkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  thisWorkoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thisWorkoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success,
  },
  prBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  prBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  comparisonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  comparisonUp: {
    color: COLORS.success,
  },
  comparisonDown: {
    color: COLORS.error,
  },
  setsTable: {
    marginBottom: 16,
  },
  setsHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8,
  },
  setsHeaderText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  setCell: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  setCellBold: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  thisWorkoutSummary: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 12,
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 12,
  },
  
  // Chart Card
  chartCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
  },
  
  // PB Grid
  pbGrid: {
    gap: 12,
  },
  rmGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  
  // Records
  recordsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  recordCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  recordLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 8,
    marginBottom: 4,
  },
  recordValue: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
  },
  recordSub: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  
  // History Dropdown
  historyDropdown: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyDropdownTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '500',
  },
  historyDropdownRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyCount: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  historyList: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  historyItemSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  historyItemLeft: {},
  historyDate: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  historyStats: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  historyItemRight: {
    alignItems: 'flex-end',
  },
  historyWeight: {
    color: COLORS.gradientStart,
    fontSize: 16,
    fontWeight: '700',
  },
  historyVolume: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  
  // Last Session
  lastSessionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
  },
  lastSessionDate: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 12,
  },
  lastSessionSets: {
    gap: 8,
  },
  lastSessionSet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lastSessionSetNum: {
    color: COLORS.textMuted,
    fontSize: 12,
    width: 50,
  },
  lastSessionSetWeight: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    width: 60,
  },
  lastSessionSetReps: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});

const chartStyles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  chartArea: {
    flexDirection: 'row',
  },
  yAxis: {
    width: 45,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  axisLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  gridContainer: {
    flex: 1,
    position: 'relative',
    marginLeft: 8,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bestLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.chartBest,
    opacity: 0.4,
  },
  line: {
    position: 'absolute',
    height: 3,
    borderRadius: 1.5,
    transformOrigin: 'left center',
  },
  point: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  pointLast: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -2,
    marginTop: -2,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 53,
    marginTop: 8,
  },
  emptyChart: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 12,
  },
});

const statsStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cardSmall: {
    flex: 1,
    minWidth: (width - 56) / 4 - 6,
    padding: 10,
  },
  cardIcon: {
    marginBottom: 8,
  },
  cardLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  cardLabelLight: {
    color: 'rgba(255,255,255,0.8)',
  },
  cardLabelSmall: {
    fontSize: 10,
  },
  cardValue: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '700',
  },
  cardValueLight: {
    color: COLORS.white,
  },
  cardValueSmall: {
    fontSize: 18,
  },
  cardUnit: {
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.7,
  },
  cardSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  cardSubtitleLight: {
    color: 'rgba(255,255,255,0.6)',
  },
});

export default ExerciseStatsModal;
