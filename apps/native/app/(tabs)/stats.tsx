import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { AppHeader } from '../../src/components/AppHeader';
import { useAuthStore } from '../../src/stores/auth-store';
import { useWorkoutStore } from '../../src/stores/workout-store';
import { FavoriteExercisesCard } from '../../src/components/FavoriteExercisesCard';
import { ExerciseStatsModal } from '../../src/components/ExerciseStatsModal';

const { width } = Dimensions.get('window');

import { COLORS as THEME_COLORS } from '../../src/constants/colors';

const COLORS = {
  accent: THEME_COLORS.gradientStart,
  accentSecondary: THEME_COLORS.gradientEnd,
  white: THEME_COLORS.white,
  text: THEME_COLORS.text,
  lightGray: THEME_COLORS.lightGray,
  mediumGray: THEME_COLORS.mediumGray,
  shadow: THEME_COLORS.cardShadow,
  success: THEME_COLORS.success,
  warning: THEME_COLORS.warning,
  background: THEME_COLORS.background,
};

// Pie chart colors
const PIE_COLORS = [
  '#A22BF6', // Purple
  '#FF4EC7', // Pink
  '#5B8DEF', // Blue
  '#34C759', // Green
  '#FF9500', // Orange
  '#FF3B30', // Red
];

// Simple Bar Chart Component (Pure RN)
const SimpleBarChart = ({ 
  data, 
  maxValue, 
  height = 150,
  showLabels = true 
}: { 
  data: Array<{ label: string; value: number }>;
  maxValue: number;
  height?: number;
  showLabels?: boolean;
}) => {
  const barWidth = Math.floor((width - 80) / data.length) - 8;
  
  return (
    <View style={[simpleChartStyles.barContainer, { height }]}>
      <View style={simpleChartStyles.barsRow}>
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * (height - 40) : 0;
          const isLast = index === data.length - 1;
          
          return (
            <View key={index} style={simpleChartStyles.barWrapper}>
              <Text style={simpleChartStyles.barValue}>{item.value}</Text>
              <View style={[simpleChartStyles.barBackground, { height: height - 40 }]}>
                <LinearGradient
                  colors={isLast ? [COLORS.accent, COLORS.accentSecondary] : [`${COLORS.accent}60`, `${COLORS.accentSecondary}60`]}
                  style={[simpleChartStyles.bar, { height: Math.max(barHeight, 4), width: barWidth }]}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                />
              </View>
              {showLabels && <Text style={simpleChartStyles.barLabel}>{item.label}</Text>}
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Simple Line Chart Component (Pure RN)
const SimpleLineChart = ({ 
  data, 
  maxValue,
  height = 150 
}: { 
  data: Array<{ value: number }>;
  maxValue: number;
  height?: number;
}) => {
  const chartWidth = width - 80;
  const chartHeight = height - 40;
  const pointSpacing = chartWidth / (data.length - 1 || 1);
  
  return (
    <View style={[simpleChartStyles.lineContainer, { height }]}>
      <View style={[simpleChartStyles.lineChartArea, { height: chartHeight }]}>
        {[0, 1, 2, 3].map((i) => (
          <View 
            key={i} 
            style={[
              simpleChartStyles.gridLine, 
              { top: (chartHeight / 4) * i }
            ]} 
          />
        ))}
        
        <View style={simpleChartStyles.areaFill}>
          {data.map((item, index) => {
            const pointHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0;
            const left = pointSpacing * index;
            
            return (
              <View
                key={index}
                style={[
                  simpleChartStyles.areaColumn,
                  {
                    left,
                    width: pointSpacing,
                    height: pointHeight,
                  }
                ]}
              />
            );
          })}
        </View>
        
        {data.map((item, index) => {
          const pointHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0;
          const left = pointSpacing * index;
          
          return (
            <View
              key={index}
              style={[
                simpleChartStyles.dataPoint,
                {
                  left: left - 6,
                  bottom: pointHeight - 6,
                }
              ]}
            />
          );
        })}
      </View>
      
      <View style={simpleChartStyles.lineLabels}>
        {data.map((item, index) => (
          <Text key={index} style={simpleChartStyles.lineLabel}>
            {item.value > 0 ? item.value : ''}
          </Text>
        ))}
      </View>
    </View>
  );
};

// Simple Horizontal Bar Chart for Focus Breakdown
const FocusBarChart = ({ 
  data 
}: { 
  data: Array<{ category: string; percentage: number; color: string }>;
}) => {
  return (
    <View style={simpleChartStyles.focusContainer}>
      {data.map((item, index) => (
        <View key={index} style={simpleChartStyles.focusRow}>
          <View style={simpleChartStyles.focusLabelContainer}>
            <View style={[simpleChartStyles.focusDot, { backgroundColor: item.color }]} />
            <Text style={simpleChartStyles.focusLabel}>{item.category}</Text>
          </View>
          <View style={simpleChartStyles.focusBarContainer}>
            <View 
              style={[
                simpleChartStyles.focusBar, 
                { width: `${item.percentage}%`, backgroundColor: item.color }
              ]} 
            />
          </View>
          <Text style={simpleChartStyles.focusPercent}>{item.percentage}%</Text>
        </View>
      ))}
    </View>
  );
};

// Proper Pie/Donut Chart Component with True Slices
const SimplePieChart = ({ 
  data 
}: { 
  data: Array<{ category: string; percentage: number; color: string }>;
}) => {
  const size = 200;
  const strokeWidth = 35;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const centerX = size / 2;
  const centerY = size / 2;
  
  return (
    <View style={{ alignItems: 'center', marginTop: 32 }}>
      {/* Donut Chart using proper segments */}
      <View style={{ width: size, height: size, position: 'relative' }}>
        <Svg width={size} height={size}>
          {/* Draw each segment as a circle with stroke-dasharray */}
          {data.map((item, index) => {
            // Calculate cumulative offset for this segment
            const cumulativePercentage = data.slice(0, index).reduce((sum, d) => sum + d.percentage, 0);
            const segmentLength = (item.percentage / 100) * circumference;
            const segmentOffset = -(cumulativePercentage / 100) * circumference;
            
            return (
              <Circle
                key={index}
                cx={centerX}
                cy={centerY}
                r={radius}
                stroke={item.color}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={`${segmentLength} ${circumference}`}
                strokeDashoffset={segmentOffset}
                rotation="-90"
                origin={`${centerX}, ${centerY}`}
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
        
        {/* Center label */}
        <View style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}>Muscle</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.mediumGray }}>Balance</Text>
        </View>
      </View>
      
      {/* Legend with percentages */}
      <View style={{ marginTop: 28, width: '100%' }}>
        {data.map((item, index) => (
          <View key={index} style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: 14,
            paddingVertical: 4 
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{ 
                width: 18, 
                height: 18, 
                borderRadius: 9, 
                backgroundColor: item.color, 
                marginRight: 12,
                shadowColor: item.color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 2
              }} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }}>{item.category}</Text>
            </View>
            <View style={{
              backgroundColor: item.color + '15',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 10
            }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: item.color }}>{item.percentage}%</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const simpleChartStyles = StyleSheet.create({
  barContainer: { width: '100%', paddingHorizontal: 8 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', flex: 1 },
  barWrapper: { alignItems: 'center', flex: 1 },
  barBackground: { justifyContent: 'flex-end', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 4, overflow: 'hidden' },
  bar: { borderRadius: 4 },
  barValue: { fontSize: 10, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  barLabel: { fontSize: 9, color: COLORS.mediumGray, marginTop: 6 },
  lineContainer: { width: '100%', paddingHorizontal: 8 },
  lineChartArea: { position: 'relative', backgroundColor: '#FAFAFA', borderRadius: 8, overflow: 'hidden' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#E5E5E5' },
  areaFill: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row' },
  areaColumn: { position: 'absolute', bottom: 0, backgroundColor: `${COLORS.accent}20` },
  dataPoint: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.accent, borderWidth: 3, borderColor: COLORS.white },
  lineLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  lineLabel: { fontSize: 10, color: COLORS.mediumGray, flex: 1, textAlign: 'center' },
  focusContainer: { width: '100%' },
  focusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  focusLabelContainer: { flexDirection: 'row', alignItems: 'center', width: 100 },
  focusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  focusLabel: { fontSize: 12, color: COLORS.text },
  focusBarContainer: { flex: 1, height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, marginHorizontal: 8, overflow: 'hidden' },
  focusBar: { height: '100%', borderRadius: 4 },
  focusPercent: { fontSize: 12, fontWeight: '600', color: COLORS.text, width: 40, textAlign: 'right' },
});

const StatCard = ({ 
  title, 
  value, 
  unit, 
  icon, 
  trend, 
  trendValue,
  gradient = false 
}: {
  title: string;
  value: string | number;
  unit?: string;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  gradient?: boolean;
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return COLORS.success;
      case 'down': return COLORS.warning;
      default: return COLORS.mediumGray;
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  if (gradient) {
    return (
      <View style={styles.statCard}>
        <LinearGradient
          colors={[COLORS.accent, COLORS.accentSecondary]}
          style={styles.gradientStatCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statHeader}>
            <Ionicons name={icon as any} size={24} color={COLORS.white} />
            {trend && trendValue && (
              <View style={styles.trendContainer}>
                <Ionicons name={getTrendIcon() as any} size={16} color={COLORS.white} />
                <Text style={styles.trendTextWhite}>{trendValue}</Text>
              </View>
            )}
          </View>
          <Text style={styles.statValueGradient}>
            {value}{unit && <Text style={styles.statUnitGradient}>{unit}</Text>}
          </Text>
          <Text style={styles.statTitleGradient}>{title}</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.statCard}>
      <View style={styles.regularStatCard}>
        <View style={styles.statHeader}>
          <Ionicons name={icon as any} size={24} color={COLORS.accent} />
          {trend && trendValue && (
            <View style={styles.trendContainer}>
              <Ionicons name={getTrendIcon() as any} size={16} color={getTrendColor()} />
              <Text style={[styles.trendText, { color: getTrendColor() }]}>{trendValue}</Text>
            </View>
          )}
        </View>
        <Text style={styles.statValue}>
          {value}{unit && <Text style={styles.statUnit}>{unit}</Text>}
        </Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );
};

export default function StatsScreen() {
  const { user } = useAuthStore();
  const { completedWorkouts, weekWorkouts, fetchCompletedWorkouts } = useWorkoutStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeChart, setActiveChart] = useState<'minutes' | 'calories'>('minutes');
  
  // Exercise Stats Modal
  const [showExerciseStats, setShowExerciseStats] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | undefined>(undefined);

  const openExerciseStats = (exerciseId?: string) => {
    setSelectedExerciseId(exerciseId);
    setShowExerciseStats(true);
  };

  // Calculate stats from LOCAL data (completedWorkouts from workout-store)
  const calculateLocalStats = useCallback(() => {
    const now = new Date();
    
    // Start of this week (Sunday)
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);
    
    // Start of last week
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    
    // Also count completed from weekWorkouts (current schedule)
    const allCompleted = [
      ...completedWorkouts,
      ...weekWorkouts.filter(w => w.completed && !w.isRestDay)
    ];
    
    // Remove duplicates by ID
    const uniqueCompleted = allCompleted.filter((workout, index, self) =>
      index === self.findIndex(w => w.id === workout.id)
    );
    
    // This week's workouts
    const thisWeekWorkouts = uniqueCompleted.filter(w => {
      const completedDate = new Date(w.completedAt || w.date);
      return completedDate >= startOfThisWeek;
    });
    
    // Last week's workouts
    const lastWeekWorkouts = uniqueCompleted.filter(w => {
      const completedDate = new Date(w.completedAt || w.date);
      return completedDate >= startOfLastWeek && completedDate < startOfThisWeek;
    });
    
    // Calculate minutes (45 min average per workout)
    const thisWeekMinutes = thisWeekWorkouts.reduce((sum, w) => sum + (w.duration || 45), 0);
    const lastWeekMinutes = lastWeekWorkouts.reduce((sum, w) => sum + (w.duration || 45), 0);
    
    // Calories (8 cal/min average)
    const thisWeekCalories = thisWeekMinutes * 8;
    const lastWeekCalories = lastWeekMinutes * 8;
    
    // Weekly goal from user settings
    const weeklyGoal = parseInt(String(user?.trainingDays)) || 5;
    
    // Calculate streak
    let currentStreak = 0;
    const sortedWorkouts = uniqueCompleted
      .filter(w => w.completedAt || w.completed)
      .sort((a, b) => new Date(b.completedAt || b.date).getTime() - new Date(a.completedAt || a.date).getTime());
    
    if (sortedWorkouts.length > 0) {
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < 30; i++) {
        const hasWorkout = sortedWorkouts.some(w => {
          const wDate = new Date(w.completedAt || w.date);
          wDate.setHours(0, 0, 0, 0);
          return wDate.getTime() === checkDate.getTime();
        });
        
        if (hasWorkout) {
          currentStreak++;
        } else if (currentStreak > 0) {
          break;
        }
        
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }
    
    // Daily data for charts (last 7 days)
    const dailyData: Array<{ label: string; workouts: number; minutes: number; calories: number }> = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(now);
      dayDate.setDate(now.getDate() - i);
      dayDate.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayDate);
      dayEnd.setDate(dayDate.getDate() + 1);
      
      const dayWorkouts = uniqueCompleted.filter(w => {
        const wDate = new Date(w.completedAt || w.date);
        return wDate >= dayDate && wDate < dayEnd;
      });
      
      const dayMinutes = dayWorkouts.reduce((sum, w) => sum + (w.duration || 45), 0);
      
      dailyData.push({
        label: dayNames[dayDate.getDay()],
        workouts: dayWorkouts.length,
        minutes: dayMinutes,
        calories: Math.round(dayMinutes * 6), // 6 cals per minute
      });
    }
    
    // Muscle group distribution (workout nerd metrics!)
    const muscleGroupCount: Record<string, number> = {
      'Chest': 0,
      'Back': 0,
      'Legs': 0,
      'Shoulders': 0,
      'Arms': 0,
      'Core': 0,
      'Cardio': 0,
    };
    
    uniqueCompleted.forEach(w => {
      const type = (w.type || '').toLowerCase();
      const title = (w.title || '').toLowerCase();
      const target = (w.targetMuscles || '').toLowerCase();
      const combined = `${type} ${title} ${target}`;
      
      // More precise muscle group detection
      if (combined.includes('chest') || combined.includes('push') || combined.includes('bench')) {
        muscleGroupCount['Chest']++;
      }
      if (combined.includes('back') || combined.includes('pull') || combined.includes('row') || combined.includes('lat')) {
        muscleGroupCount['Back']++;
      }
      if (combined.includes('leg') || combined.includes('squat') || combined.includes('quad') || combined.includes('hamstring') || combined.includes('glute')) {
        muscleGroupCount['Legs']++;
      }
      if (combined.includes('shoulder') || combined.includes('delt') || combined.includes('press')) {
        muscleGroupCount['Shoulders']++;
      }
      if (combined.includes('arm') || combined.includes('bicep') || combined.includes('tricep') || combined.includes('curl')) {
        muscleGroupCount['Arms']++;
      }
      if (combined.includes('core') || combined.includes('ab') || combined.includes('plank')) {
        muscleGroupCount['Core']++;
      }
      if (combined.includes('cardio') || combined.includes('hiit') || combined.includes('run') || combined.includes('bike')) {
        muscleGroupCount['Cardio']++;
      }
    });
    
    const totalMuscleWork = Object.values(muscleGroupCount).reduce((a, b) => a + b, 0) || 1;
    const muscleData = Object.entries(muscleGroupCount)
      .filter(([_, count]) => count > 0)
      .map(([category, count], index) => ({
        category,
        percentage: Math.round((count / totalMuscleWork) * 100),
        color: PIE_COLORS[index % PIE_COLORS.length],
      }))
      .sort((a, b) => b.percentage - a.percentage);
    
    return {
      thisWeek: {
        workoutsCompleted: thisWeekWorkouts.length,
        workoutsChange: thisWeekWorkouts.length - lastWeekWorkouts.length,
        activeMinutes: thisWeekMinutes,
        minutesChange: thisWeekMinutes - lastWeekMinutes,
        caloriesBurned: thisWeekCalories,
        caloriesChange: thisWeekCalories - lastWeekCalories,
        weeklyGoal,
        goalProgress: Math.round((thisWeekWorkouts.length / weeklyGoal) * 100),
      },
      streaks: {
        current: currentStreak,
        best: Math.max(currentStreak, uniqueCompleted.length > 0 ? Math.min(uniqueCompleted.length, 30) : 0),
      },
      allTime: {
        totalWorkouts: uniqueCompleted.length,
        totalMinutes: uniqueCompleted.reduce((sum, w) => sum + (w.duration || 45), 0),
      },
      dailyData,
      muscleData,
    };
  }, [completedWorkouts, weekWorkouts, user]);

  useEffect(() => {
    const loadData = async () => {
      await fetchCompletedWorkouts();
      setIsLoading(false);
    };
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchCompletedWorkouts();
    setIsRefreshing(false);
  }, [fetchCompletedWorkouts]);

  const stats = calculateLocalStats();

  // Prepare chart data - DAILY VIEW
  const barChartData = stats.dailyData.map(d => ({
    label: d.label,
    value: activeChart === 'minutes' ? d.minutes : d.calories,
  }));

  const maxBarValue = Math.max(...barChartData.map(d => d.value), 1);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader mode="fitness" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading your stats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader mode="fitness" />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
      >
        {/* This Week Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Workouts Completed"
              value={stats.thisWeek.workoutsCompleted}
              icon="checkmark-circle"
              trend={stats.thisWeek.workoutsChange > 0 ? 'up' : stats.thisWeek.workoutsChange < 0 ? 'down' : 'neutral'}
              trendValue={stats.thisWeek.workoutsChange >= 0 ? `+${stats.thisWeek.workoutsChange}` : `${stats.thisWeek.workoutsChange}`}
              gradient={true}
            />
            
            <StatCard
              title="Active Minutes"
              value={stats.thisWeek.activeMinutes}
              unit="min"
              icon="time"
              trend={stats.thisWeek.minutesChange > 0 ? 'up' : stats.thisWeek.minutesChange < 0 ? 'down' : 'neutral'}
              trendValue={stats.thisWeek.minutesChange >= 0 ? `+${stats.thisWeek.minutesChange}` : `${stats.thisWeek.minutesChange}`}
            />
            
            <StatCard
              title="Calories Burned"
              value={stats.thisWeek.caloriesBurned}
              unit="kcal"
              icon="flame"
              trend={stats.thisWeek.caloriesChange > 0 ? 'up' : stats.thisWeek.caloriesChange < 0 ? 'down' : 'neutral'}
              trendValue={stats.thisWeek.caloriesChange >= 0 ? `+${stats.thisWeek.caloriesChange}` : `${stats.thisWeek.caloriesChange}`}
            />
            
            <StatCard
              title="Current Streak"
              value={stats.streaks.current}
              unit=" days"
              icon="flash"
            />
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Goal</Text>
          
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>
                {stats.thisWeek.workoutsCompleted} of {stats.thisWeek.weeklyGoal} workouts
              </Text>
              <Text style={styles.progressPercentage}>{stats.thisWeek.goalProgress}%</Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentSecondary]}
                  style={[styles.progressBarFill, { width: `${Math.min(stats.thisWeek.goalProgress, 100)}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </View>
            
            <Text style={styles.progressSubtext}>
              {stats.thisWeek.goalProgress >= 100 
                ? '🎉 Goal achieved! Keep it up!'
                : `${stats.thisWeek.weeklyGoal - stats.thisWeek.workoutsCompleted} more to hit your goal`}
            </Text>
          </View>
        </View>

        {/* Daily Progress Bar Chart */}
        <View style={styles.section}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Daily Progress</Text>
            <View style={styles.chartToggle}>
              <TouchableOpacity 
                style={[styles.toggleButton, activeChart === 'minutes' && styles.toggleButtonActive]}
                onPress={() => setActiveChart('minutes')}
              >
                <Text style={[styles.toggleText, activeChart === 'minutes' && styles.toggleTextActive]}>Minutes</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleButton, activeChart === 'calories' && styles.toggleButtonActive]}
                onPress={() => setActiveChart('calories')}
              >
                <Text style={[styles.toggleText, activeChart === 'calories' && styles.toggleTextActive]}>Calories</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.chartCard}>
            {barChartData.some(d => d.value > 0) ? (
              <SimpleBarChart data={barChartData} maxValue={maxBarValue + Math.ceil(maxBarValue * 0.2)} height={180} />
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="bar-chart-outline" size={48} color={COLORS.mediumGray} />
                <Text style={styles.noDataText}>Complete workouts to see your trends</Text>
              </View>
            )}
          </View>
        </View>

        {/* Muscle Group Distribution (Pie Chart for Workout Nerds!) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Muscle Group Distribution</Text>
          
          <View style={styles.chartCard}>
            {stats.muscleData.length > 0 ? (
              <>
                <FocusBarChart data={stats.muscleData} />
                <SimplePieChart data={stats.muscleData} />
              </>
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="pie-chart-outline" size={48} color={COLORS.mediumGray} />
                <Text style={styles.noDataText}>Your muscle group focus will appear here</Text>
              </View>
            )}
          </View>
        </View>

        {/* Favorite Exercises & Personal Bests - NOW LIVE! */}
        <View style={styles.section}>
          <FavoriteExercisesCard
            onViewAll={() => openExerciseStats()}
            onExercisePress={(exerciseId) => openExerciseStats(exerciseId)}
          />
          
          {/* View All Exercises Button */}
          <TouchableOpacity 
            style={styles.viewAllExercisesButton}
            onPress={() => openExerciseStats()}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[COLORS.lightGray, COLORS.lightGray]}
              style={styles.viewAllExercisesGradient}
            >
              <View style={styles.viewAllExercisesContent}>
                <View style={styles.viewAllExercisesIcon}>
                  <Ionicons name="barbell" size={20} color={COLORS.accent} />
                </View>
                <View style={styles.viewAllExercisesText}>
                  <Text style={styles.viewAllExercisesTitle}>All Exercise Stats</Text>
                  <Text style={styles.viewAllExercisesSubtitle}>View PBs, history & progress for every exercise</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* All-Time Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All-Time Stats</Text>
          
          <View style={styles.allTimeCard}>
            <View style={styles.allTimeStat}>
              <Ionicons name="trophy" size={28} color={COLORS.accent} />
              <Text style={styles.allTimeValue}>{stats.allTime.totalWorkouts}</Text>
              <Text style={styles.allTimeLabel}>Total Workouts</Text>
            </View>
            <View style={styles.allTimeDivider} />
            <View style={styles.allTimeStat}>
              <Ionicons name="time" size={28} color={COLORS.accentSecondary} />
              <Text style={styles.allTimeValue}>{Math.round(stats.allTime.totalMinutes / 60)}h</Text>
              <Text style={styles.allTimeLabel}>Total Hours</Text>
            </View>
            <View style={styles.allTimeDivider} />
            <View style={styles.allTimeStat}>
              <Ionicons name="flash" size={28} color={COLORS.warning} />
              <Text style={styles.allTimeValue}>{stats.streaks.best}</Text>
              <Text style={styles.allTimeLabel}>Best Streak</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.mediumGray },
  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: COLORS.text, marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: (width - 56) / 2, marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
  gradientStatCard: { padding: 16, height: 120, justifyContent: 'space-between' },
  regularStatCard: { padding: 16, height: 120, justifyContent: 'space-between', backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 16, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  statValueGradient: { fontSize: 24, fontWeight: '700', color: COLORS.white },
  statUnit: { fontSize: 16, fontWeight: '400', color: COLORS.mediumGray },
  statUnitGradient: { fontSize: 16, fontWeight: '400', color: 'rgba(255, 255, 255, 0.8)' },
  statTitle: { fontSize: 14, fontWeight: '500', color: COLORS.mediumGray },
  statTitleGradient: { fontSize: 14, fontWeight: '500', color: 'rgba(255, 255, 255, 0.9)' },
  trendContainer: { flexDirection: 'row', alignItems: 'center' },
  trendText: { fontSize: 12, fontWeight: '500', marginLeft: 4 },
  trendTextWhite: { fontSize: 12, fontWeight: '500', marginLeft: 4, color: COLORS.white },
  progressCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.lightGray, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  progressTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  progressPercentage: { fontSize: 20, fontWeight: '700', color: COLORS.accent },
  progressBarContainer: { marginBottom: 12 },
  progressBarBackground: { height: 8, backgroundColor: COLORS.lightGray, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressSubtext: { fontSize: 14, color: COLORS.mediumGray },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  chartToggle: { flexDirection: 'row', backgroundColor: COLORS.lightGray, borderRadius: 20, padding: 4 },
  toggleButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  toggleButtonActive: { backgroundColor: COLORS.accent },
  toggleText: { fontSize: 12, fontWeight: '500', color: COLORS.mediumGray },
  toggleTextActive: { color: COLORS.white },
  chartCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.lightGray, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  noDataContainer: { alignItems: 'center', justifyContent: 'center', height: 150, paddingHorizontal: 20 },
  noDataText: { marginTop: 12, fontSize: 14, color: COLORS.mediumGray, textAlign: 'center' },
  allTimeCard: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.lightGray, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  allTimeStat: { flex: 1, alignItems: 'center' },
  allTimeValue: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginTop: 8 },
  allTimeLabel: { fontSize: 12, color: COLORS.mediumGray, marginTop: 4 },
  allTimeDivider: { width: 1, backgroundColor: COLORS.lightGray, marginHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  viewAllText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  comingSoonBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  comingSoonText: { fontSize: 11, fontWeight: '600', color: COLORS.mediumGray, marginLeft: 4 },
  pbCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.lightGray, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  pbRow: { flexDirection: 'row', alignItems: 'center' },
  pbIconContainer: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', marginRight: 16 },
  pbIconGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  pbContent: { flex: 1 },
  pbExercise: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  pbMeta: { fontSize: 13, color: COLORS.mediumGray },
  pbValue: { alignItems: 'flex-end' },
  pbNumber: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  pbUnit: { fontSize: 12, color: COLORS.mediumGray, marginTop: 2 },
  pbNumberEmpty: { fontSize: 24, fontWeight: '700', color: COLORS.lightGray },
  pbUnitEmpty: { fontSize: 11, color: COLORS.mediumGray, marginTop: 2, fontStyle: 'italic' },
  pbDivider: { height: 1, backgroundColor: COLORS.lightGray, marginVertical: 16 },
});
