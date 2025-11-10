import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  accent: '#a259ff',
  accentSecondary: '#3a86ff',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
};

type ChartType = 'line' | 'bar' | 'pie';

interface PersonalBestChartProps {
  visible: boolean;
  onClose: () => void;
  exercise: {
    name: string;
    weight: string;
    icon: string;
    color: string;
  };
  data?: Array<{ date: string; value: number }>;
}

export function PersonalBestChart({ 
  visible, 
  onClose, 
  exercise,
  data = []
}: PersonalBestChartProps) {
  const [chartType, setChartType] = useState<ChartType>('line');

  // Mock data if none provided
  const chartData = data.length > 0 ? data : [
    { date: 'Week 1', value: 185 },
    { date: 'Week 2', value: 195 },
    { date: 'Week 3', value: 205 },
    { date: 'Week 4', value: 215 },
    { date: 'Week 5', value: 225 },
  ];

  const maxValue = Math.max(...chartData.map(d => d.value));
  const minValue = Math.min(...chartData.map(d => d.value));

  const renderLineChart = () => (
    <View style={styles.chartContainer}>
      {chartData.map((item, index) => {
        const height = ((item.value - minValue) / (maxValue - minValue)) * 180 + 20;
        return (
          <View key={index} style={styles.barContainer}>
            <Text style={styles.valueLabel}>{item.value}</Text>
            <View style={styles.lineChartBar}>
              <LinearGradient
                colors={[exercise.color, `${exercise.color}80`]}
                style={[styles.lineBar, { height }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
            </View>
            <Text style={styles.dateLabel}>{item.date}</Text>
          </View>
        );
      })}
    </View>
  );

  const renderBarChart = () => (
    <View style={styles.chartContainer}>
      {chartData.map((item, index) => {
        const height = ((item.value - minValue) / (maxValue - minValue)) * 180 + 20;
        return (
          <View key={index} style={styles.barContainer}>
            <Text style={styles.valueLabel}>{item.value}</Text>
            <LinearGradient
              colors={[exercise.color, `${exercise.color}80`]}
              style={[styles.bar, { height }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <Text style={styles.dateLabel}>{item.date}</Text>
          </View>
        );
      })}
    </View>
  );

  const renderPieChart = () => {
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    return (
      <View style={styles.pieContainer}>
        <View style={styles.pieLegend}>
          {chartData.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: exercise.color }]} />
                <Text style={styles.legendText}>
                  {item.date}: {item.value}lbs ({percentage}%)
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const isEmpty = data.length === 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.exerciseIcon, { backgroundColor: `${exercise.color}20` }]}>
                <Ionicons name={exercise.icon as any} size={32} color={exercise.color} />
              </View>
              <Text style={styles.title}>{exercise.name}</Text>
              <Text style={styles.subtitle}>Personal Best: {exercise.weight}</Text>
            </View>

            {/* Chart Type Selector */}
            <View style={styles.chartTypeSelector}>
              <TouchableOpacity
                style={[styles.chartTypeButton, chartType === 'line' && styles.chartTypeButtonActive]}
                onPress={() => setChartType('line')}
              >
                <Ionicons 
                  name="stats-chart" 
                  size={20} 
                  color={chartType === 'line' ? COLORS.white : COLORS.accent} 
                />
                <Text style={[
                  styles.chartTypeText,
                  chartType === 'line' && styles.chartTypeTextActive
                ]}>
                  Line
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.chartTypeButton, chartType === 'bar' && styles.chartTypeButtonActive]}
                onPress={() => setChartType('bar')}
              >
                <Ionicons 
                  name="bar-chart" 
                  size={20} 
                  color={chartType === 'bar' ? COLORS.white : COLORS.accent} 
                />
                <Text style={[
                  styles.chartTypeText,
                  chartType === 'bar' && styles.chartTypeTextActive
                ]}>
                  Bar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.chartTypeButton, chartType === 'pie' && styles.chartTypeButtonActive]}
                onPress={() => setChartType('pie')}
              >
                <Ionicons 
                  name="pie-chart" 
                  size={20} 
                  color={chartType === 'pie' ? COLORS.white : COLORS.accent} 
                />
                <Text style={[
                  styles.chartTypeText,
                  chartType === 'pie' && styles.chartTypeTextActive
                ]}>
                  Pie
                </Text>
              </TouchableOpacity>
            </View>

            {/* Chart Display */}
            {isEmpty ? (
              <View style={styles.emptyState}>
                <Ionicons name="bar-chart-outline" size={64} color={COLORS.mediumGray} />
                <Text style={styles.emptyTitle}>No Data Yet</Text>
                <Text style={styles.emptyText}>
                  Start tracking your {exercise.name} to see your progress!
                </Text>
              </View>
            ) : (
              <>
                {chartType === 'line' && renderLineChart()}
                {chartType === 'bar' && renderBarChart()}
                {chartType === 'pie' && renderPieChart()}
              </>
            )}

            {/* Stats Summary */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: exercise.color }]}>
                  {chartData[chartData.length - 1].value}
                </Text>
                <Text style={styles.statLabel}>Current</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: COLORS.green }]}>
                  +{chartData[chartData.length - 1].value - chartData[0].value}
                </Text>
                <Text style={styles.statLabel}>Progress</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: COLORS.accent }]}>
                  {maxValue}
                </Text>
                <Text style={styles.statLabel}>Best</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingTop: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  exerciseIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  chartTypeSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  chartTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  chartTypeButtonActive: {
    backgroundColor: COLORS.accent,
  },
  chartTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  chartTypeTextActive: {
    color: COLORS.white,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 240,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '80%',
    borderRadius: 8,
    marginVertical: 8,
  },
  lineChartBar: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
  },
  lineBar: {
    width: 4,
    borderRadius: 2,
  },
  valueLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 10,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  pieContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pieLegend: {
    width: '100%',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 20,
  },
});
