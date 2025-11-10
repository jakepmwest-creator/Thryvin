import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppHeader } from '../../src/components/AppHeader';
import { WorkoutDetailsModal } from '../../src/components/WorkoutDetailsModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  accent: '#a259ff',
  accentSecondary: '#3a86ff',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  shadow: 'rgba(162, 89, 255, 0.1)',
  success: '#34C759',
  incomplete: '#D1D1D6',
};

// Mock calendar data with workout status
const WEEK_DAYS = [
  { day: 'Mon', date: 21, status: 'completed' },
  { day: 'Tue', date: 22, status: 'completed' },
  { day: 'Wed', date: 23, status: 'today' },
  { day: 'Thu', date: 24, status: 'upcoming' },
  { day: 'Fri', date: 25, status: 'upcoming' },
  { day: 'Sat', date: 26, status: 'upcoming' },
  { day: 'Sun', date: 27, status: 'upcoming' },
];

// Mock month data (October 2024)
const MONTH_DATA = [
  [null, 1, 2, 3, 4, 5, 6],
  [7, 8, 9, 10, 11, 12, 13],
  [14, 15, 16, 17, 18, 19, 20],
  [21, 22, 23, 24, 25, 26, 27],
  [28, 29, 30, 31, null, null, null],
];

const MONTH_STATUS: any = {
  21: 'completed', 22: 'completed', 23: 'today',
  24: 'upcoming', 25: 'upcoming', 26: 'upcoming', 27: 'upcoming',
  14: 'completed', 15: 'incomplete', 16: 'completed',
};

// Workout categories for explore section
const WORKOUT_CATEGORIES = [
  { id: 1, name: 'Aesthetics', icon: 'body', color: '#a259ff', workouts: 24 },
  { id: 2, name: 'Yoga', icon: 'leaf', color: '#4CAF50', workouts: 18 },
  { id: 3, name: 'HIIT', icon: 'flame', color: '#FF5252', workouts: 32 },
  { id: 4, name: 'Strength', icon: 'barbell', color: '#2196F3', workouts: 41 },
  { id: 5, name: 'Cardio', icon: 'heart', color: '#FF9800', workouts: 28 },
  { id: 6, name: 'Flexibility', icon: 'fitness', color: '#9C27B0', workouts: 15 },
];

export default function WorkoutsScreen() {
  const router = useRouter();
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(23);
  const [modalVisible, setModalVisible] = useState(false);

  const handleStartWorkout = () => {
    router.push('/active-workout');
    setModalVisible(false);
  };

  const handleDayPress = (date: number) => {
    setSelectedDate(date);
    setModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return COLORS.success;
      case 'upcoming': return COLORS.accent;
      case 'incomplete': return COLORS.incomplete;
      case 'today': return COLORS.accentSecondary;
      default: return COLORS.mediumGray;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader mode="fitness" />
      
      {/* Workout Details Modal */}
      <WorkoutDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onStartWorkout={handleStartWorkout}
        selectedDate={selectedDate}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Workout Card - Same as Home */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Workout</Text>
          <View style={styles.workoutCard}>
            <LinearGradient
              colors={[`${COLORS.accent}15`, `${COLORS.accentSecondary}15`]}
              style={styles.workoutCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.workoutHeader}>
                <View style={styles.workoutIconCircle}>
                  <Ionicons name="barbell" size={32} color={COLORS.accent} />
                </View>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutName}>Upper Body Push</Text>
                  <Text style={styles.workoutMeta}>45 min • 8 exercises • Intermediate</Text>
                </View>
              </View>
              <Text style={styles.workoutDescription}>
                Focus on chest, shoulders, and triceps with compound movements.
              </Text>
              <TouchableOpacity 
                style={styles.startButton}
                onPress={() => setModalVisible(true)}
              >
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentSecondary]}
                  style={styles.startGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="play" size={20} color={COLORS.white} />
                  <Text style={styles.startText}>Start Workout</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>

        {/* Calendar Section */}
        <View style={styles.section}>
          <View style={styles.calendarHeader}>
            <Text style={styles.sectionTitle}>Workout Schedule</Text>
            <TouchableOpacity
              style={styles.viewToggle}
              onPress={() => setCalendarView(calendarView === 'week' ? 'month' : 'week')}
            >
              <Text style={styles.viewToggleText}>
                {calendarView === 'week' ? 'Month' : 'Week'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.accent} />
            </TouchableOpacity>
          </View>

          {calendarView === 'week' ? (
            /* Weekly Calendar */
            <View style={styles.weekCalendar}>
              {WEEK_DAYS.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCard,
                    day.status === 'today' && styles.dayCardToday,
                  ]}
                  onPress={() => handleDayPress(day.date)}
                >
                  {day.status === 'today' && (
                    <LinearGradient
                      colors={[COLORS.accent, COLORS.accentSecondary]}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  )}
                  <Text style={[
                    styles.dayText,
                    day.status === 'today' && styles.dayTextActive
                  ]}>
                    {day.day}
                  </Text>
                  <Text style={[
                    styles.dateText,
                    day.status === 'today' && styles.dateTextActive
                  ]}>
                    {day.date}
                  </Text>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(day.status) }]} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            /* Monthly Calendar */
            <View style={styles.monthCalendar}>
              <View style={styles.monthHeader}>
                <Text style={styles.monthTitle}>October 2024</Text>
              </View>
              <View style={styles.weekdaysRow}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <Text key={day} style={styles.weekdayLabel}>{day}</Text>
                ))}
              </View>
              {MONTH_DATA.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.monthWeekRow}>
                  {week.map((date, dayIndex) => (
                    <TouchableOpacity
                      key={dayIndex}
                      style={[
                        styles.monthDayCell,
                        !date && styles.monthDayCellEmpty,
                        date === selectedDate && styles.monthDayCellSelected,
                      ]}
                      onPress={() => date && handleDayPress(date)}
                      disabled={!date}
                    >
                      {date === selectedDate && (
                        <LinearGradient
                          colors={[COLORS.accent, COLORS.accentSecondary]}
                          style={StyleSheet.absoluteFill}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        />
                      )}
                      {date && (
                        <>
                          <Text style={[
                            styles.monthDayText,
                            date === selectedDate && styles.monthDayTextActive
                          ]}>
                            {date}
                          </Text>
                          {MONTH_STATUS[date] && (
                            <View style={[
                              styles.monthDayDot,
                              { backgroundColor: getStatusColor(MONTH_STATUS[date]) }
                            ]} />
                          )}
                        </>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Explore Workouts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore Workouts</Text>
          <View style={styles.categoriesGrid}>
            {WORKOUT_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => console.log('Category:', category.name)}
              >
                <LinearGradient
                  colors={[`${category.color}20`, `${category.color}10`]}
                  style={styles.categoryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: `${category.color}30` }]}>
                    <Ionicons name={category.icon as any} size={28} color={category.color} />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryCount}>{category.workouts} workouts</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
    paddingBottom: 120,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  
  // Today's Workout Card
  workoutCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  workoutCardGradient: {
    padding: 20,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  workoutIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  workoutMeta: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  workoutDescription: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  startButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  startGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  startText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  
  // Calendar
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  
  // Week Calendar
  weekCalendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayCard: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  dayCardToday: {
    backgroundColor: COLORS.accent,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mediumGray,
    marginBottom: 8,
  },
  dayTextActive: {
    color: COLORS.white,
    zIndex: 1,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  dateTextActive: {
    color: COLORS.white,
    zIndex: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    zIndex: 1,
  },
  
  // Month Calendar
  monthCalendar: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    padding: 16,
  },
  monthHeader: {
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekdayLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
  monthWeekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  monthDayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.white,
    marginHorizontal: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  monthDayCellEmpty: {
    backgroundColor: 'transparent',
  },
  monthDayCellSelected: {
    backgroundColor: COLORS.accent,
  },
  monthDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    zIndex: 1,
  },
  monthDayTextActive: {
    color: COLORS.white,
  },
  monthDayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 6,
    zIndex: 1,
  },
  
  // Explore Categories
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryGradient: {
    padding: 20,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
});