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
import { AppHeader } from '../../src/components/AppHeader';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { useAuthStore } from '../../src/stores/auth-store';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 64;

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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://soft-apes-tickle.loca.lt';

// Pie chart colors
const PIE_COLORS = [
  '#A22BF6', // Purple
  '#FF4EC7', // Pink
  '#5B8DEF', // Blue
  '#34C759', // Green
  '#FF9500', // Orange
  '#FF3B30', // Red
];

interface StatsSummary {
  thisWeek: {
    workoutsCompleted: number;
    workoutsChange: number;
    activeMinutes: number;
    minutesChange: number;
    caloriesBurned: number;
    caloriesChange: number;
    weeklyGoal: number;
    goalProgress: number;
  };
  streaks: {
    current: number;
    best: number;
  };
  allTime: {
    totalWorkouts: number;
    totalMinutes: number;
    totalCalories: number;
  };
}

interface WeeklyTrend {
  weeks: Array<{
    weekStart: string;
    weekLabel: string;
    workouts: number;
    minutes: number;
    volume: number;
  }>;
}

interface FocusBreakdown {
  breakdown: Array<{
    category: string;
    sessions: number;
    percentage: number;
  }>;
  insights: string[];
}

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
                <Ionicons 
                  name={getTrendIcon() as any} 
                  size={16} 
                  color={COLORS.white} 
                />
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
              <Ionicons 
                name={getTrendIcon() as any} 
                size={16} 
                color={getTrendColor()} 
              />
              <Text style={[styles.trendText, { color: getTrendColor() }]}>
                {trendValue}
              </Text>
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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend | null>(null);
  const [focusBreakdown, setFocusBreakdown] = useState<FocusBreakdown | null>(null);
  const [activeChart, setActiveChart] = useState<'workouts' | 'minutes'>('workouts');

  const fetchStats = useCallback(async () => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
      };

      // Fetch all stats in parallel
      const [summaryRes, trendRes, breakdownRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/stats/summary`, { headers, credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/stats/weekly-trend`, { headers, credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/stats/focus-breakdown`, { headers, credentials: 'include' }),
      ]);

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }

      if (trendRes.ok) {
        const trendData = await trendRes.json();
        setWeeklyTrend(trendData);
      }

      if (breakdownRes.ok) {
        const breakdownData = await breakdownRes.json();
        setFocusBreakdown(breakdownData);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchStats();
  }, [fetchStats]);

  // Prepare bar chart data for gifted-charts
  const barChartData = weeklyTrend?.weeks.slice(-8).map((w, index) => ({
    value: activeChart === 'workouts' ? w.workouts : w.minutes,
    label: w.weekLabel,
    frontColor: index === 7 ? COLORS.accent : `${COLORS.accent}80`,
    topLabelComponent: () => (
      <Text style={{ fontSize: 10, color: COLORS.text, marginBottom: 4 }}>
        {activeChart === 'workouts' ? w.workouts : w.minutes}
      </Text>
    ),
  })) || [];

  // Prepare line chart data
  const lineChartData = weeklyTrend?.weeks.slice(-8).map((w) => ({
    value: w.minutes || 0,
    dataPointText: String(w.minutes),
  })) || [];

  // Prepare pie chart data
  const pieChartData = focusBreakdown?.breakdown.map((item, index) => ({
    value: item.percentage || 1,
    color: PIE_COLORS[index % PIE_COLORS.length],
    text: `${item.percentage}%`,
    focused: index === 0,
  })) || [];

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
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
      >
        {/* This Week Stats - Keep the original design */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Workouts Completed"
              value={summary?.thisWeek.workoutsCompleted || 0}
              icon="checkmark-circle"
              trend={summary?.thisWeek.workoutsChange !== undefined ? 
                (summary.thisWeek.workoutsChange > 0 ? 'up' : summary.thisWeek.workoutsChange < 0 ? 'down' : 'neutral') : undefined}
              trendValue={summary?.thisWeek.workoutsChange !== undefined ? 
                (summary.thisWeek.workoutsChange >= 0 ? `+${summary.thisWeek.workoutsChange}` : `${summary.thisWeek.workoutsChange}`) : undefined}
              gradient={true}
            />
            
            <StatCard
              title="Active Minutes"
              value={summary?.thisWeek.activeMinutes || 0}
              unit="min"
              icon="time"
              trend={summary?.thisWeek.minutesChange !== undefined ?
                (summary.thisWeek.minutesChange > 0 ? 'up' : summary.thisWeek.minutesChange < 0 ? 'down' : 'neutral') : undefined}
              trendValue={summary?.thisWeek.minutesChange !== undefined ?
                (summary.thisWeek.minutesChange >= 0 ? `+${summary.thisWeek.minutesChange}` : `${summary.thisWeek.minutesChange}`) : undefined}
            />
            
            <StatCard
              title="Calories Burned"
              value={summary?.thisWeek.caloriesBurned || 0}
              unit="kcal"
              icon="flame"
              trend={summary?.thisWeek.caloriesChange !== undefined ?
                (summary.thisWeek.caloriesChange > 0 ? 'up' : summary.thisWeek.caloriesChange < 0 ? 'down' : 'neutral') : undefined}
              trendValue={summary?.thisWeek.caloriesChange !== undefined ?
                (summary.thisWeek.caloriesChange >= 0 ? `+${summary.thisWeek.caloriesChange}` : `${summary.thisWeek.caloriesChange}`) : undefined}
            />
            
            <StatCard
              title="Current Streak"
              value={summary?.streaks.current || 0}
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
                {summary?.thisWeek.workoutsCompleted || 0} of {summary?.thisWeek.weeklyGoal || 5} workouts
              </Text>
              <Text style={styles.progressPercentage}>
                {summary?.thisWeek.goalProgress || 0}%
              </Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentSecondary]}
                  style={[styles.progressBarFill, { width: `${Math.min(summary?.thisWeek.goalProgress || 0, 100)}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </View>
            
            <Text style={styles.progressSubtext}>
              {summary?.thisWeek.goalProgress === 100 
                ? '🎉 Goal achieved! Keep it up!'
                : `${(summary?.thisWeek.weeklyGoal || 5) - (summary?.thisWeek.workoutsCompleted || 0)} more to hit your goal`}
            </Text>
          </View>
        </View>

        {/* Workouts Per Week Chart */}
        <View style={styles.section}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Weekly Progress</Text>
            <View style={styles.chartToggle}>
              <TouchableOpacity 
                style={[styles.toggleButton, activeChart === 'workouts' && styles.toggleButtonActive]}
                onPress={() => setActiveChart('workouts')}
              >
                <Text style={[styles.toggleText, activeChart === 'workouts' && styles.toggleTextActive]}>
                  Workouts
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleButton, activeChart === 'minutes' && styles.toggleButtonActive]}
                onPress={() => setActiveChart('minutes')}
              >
                <Text style={[styles.toggleText, activeChart === 'minutes' && styles.toggleTextActive]}>
                  Minutes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.chartCard}>
            {barChartData.length > 0 && barChartData.some(d => d.value > 0) ? (
              <BarChart
                data={barChartData}
                width={CHART_WIDTH}
                height={180}
                barWidth={24}
                spacing={16}
                roundedTop
                roundedBottom
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: COLORS.mediumGray, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: COLORS.mediumGray, fontSize: 10 }}
                noOfSections={4}
                maxValue={Math.max(...barChartData.map(d => d.value), 1) + 2}
                isAnimated
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="bar-chart-outline" size={48} color={COLORS.mediumGray} />
                <Text style={styles.noDataText}>Complete workouts to see your trends</Text>
              </View>
            )}
          </View>
        </View>

        {/* Training Minutes Line Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Training Minutes</Text>
          
          <View style={styles.chartCard}>
            {lineChartData.length > 0 && lineChartData.some(d => d.value > 0) ? (
              <LineChart
                data={lineChartData}
                width={CHART_WIDTH}
                height={180}
                color={COLORS.accent}
                thickness={3}
                hideDataPoints={false}
                dataPointsColor={COLORS.accent}
                dataPointsRadius={5}
                startFillColor={`${COLORS.accent}40`}
                endFillColor={`${COLORS.accent}10`}
                areaChart
                curved
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: COLORS.mediumGray, fontSize: 10 }}
                noOfSections={4}
                maxValue={Math.max(...lineChartData.map(d => d.value), 1) + 20}
                isAnimated
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="trending-up-outline" size={48} color={COLORS.mediumGray} />
                <Text style={styles.noDataText}>Track your consistency over time</Text>
              </View>
            )}
          </View>
        </View>

        {/* Focus Breakdown Pie Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Training Focus</Text>
          
          <View style={styles.chartCard}>
            {pieChartData.length > 0 && pieChartData.some(d => d.value > 0) ? (
              <View style={styles.pieContainer}>
                <PieChart
                  data={pieChartData}
                  donut
                  radius={80}
                  innerRadius={50}
                  innerCircleColor={COLORS.white}
                  centerLabelComponent={() => (
                    <View style={styles.pieCenter}>
                      <Text style={styles.pieCenterText}>{summary?.allTime.totalWorkouts || 0}</Text>
                      <Text style={styles.pieCenterLabel}>Total</Text>
                    </View>
                  )}
                />
                <View style={styles.pieLegend}>
                  {focusBreakdown?.breakdown.map((item, index) => (
                    <View key={index} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }]} />
                      <Text style={styles.legendText}>{item.category}</Text>
                      <Text style={styles.legendPercent}>{item.percentage}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="pie-chart-outline" size={48} color={COLORS.mediumGray} />
                <Text style={styles.noDataText}>Your workout focus will appear here</Text>
              </View>
            )}
          </View>
        </View>

        {/* Insights Section */}
        {focusBreakdown?.insights && focusBreakdown.insights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insights</Text>
            
            <View style={styles.insightsCard}>
              {focusBreakdown.insights.map((insight, index) => (
                <View key={index} style={styles.insightRow}>
                  <Ionicons name="bulb" size={20} color={COLORS.accent} />
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* All-Time Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All-Time Stats</Text>
          
          <View style={styles.allTimeCard}>
            <View style={styles.allTimeStat}>
              <Ionicons name="trophy" size={28} color={COLORS.accent} />
              <Text style={styles.allTimeValue}>{summary?.allTime.totalWorkouts || 0}</Text>
              <Text style={styles.allTimeLabel}>Total Workouts</Text>
            </View>
            <View style={styles.allTimeDivider} />
            <View style={styles.allTimeStat}>
              <Ionicons name="time" size={28} color={COLORS.accentSecondary} />
              <Text style={styles.allTimeValue}>
                {Math.round((summary?.allTime.totalMinutes || 0) / 60)}h
              </Text>
              <Text style={styles.allTimeLabel}>Total Hours</Text>
            </View>
            <View style={styles.allTimeDivider} />
            <View style={styles.allTimeStat}>
              <Ionicons name="flash" size={28} color={COLORS.warning} />
              <Text style={styles.allTimeValue}>{summary?.streaks.best || 0}</Text>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.mediumGray,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 56) / 2,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientStatCard: {
    padding: 16,
    height: 120,
    justifyContent: 'space-between',
  },
  regularStatCard: {
    padding: 16,
    height: 120,
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  statValueGradient: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  statUnit: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.mediumGray,
  },
  statUnitGradient: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.mediumGray,
  },
  statTitleGradient: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  trendTextWhite: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    color: COLORS.white,
  },
  progressCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.accent,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    padding: 4,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.accent,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.mediumGray,
  },
  toggleTextActive: {
    color: COLORS.white,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
    overflow: 'hidden',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
    paddingHorizontal: 20,
  },
  noDataText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
  pieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  pieCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieCenterText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  pieCenterLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  pieLegend: {
    flex: 1,
    marginLeft: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
  },
  legendPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  insightsCard: {
    backgroundColor: `${COLORS.accent}08`,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: `${COLORS.accent}20`,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  allTimeCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  allTimeStat: {
    flex: 1,
    alignItems: 'center',
  },
  allTimeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  allTimeLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  allTimeDivider: {
    width: 1,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 16,
  },
});
