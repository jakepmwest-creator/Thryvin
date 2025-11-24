import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Dimensions,
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppHeader } from '../../src/components/AppHeader';
import { WorkoutDetailsModal } from '../../src/components/WorkoutDetailsModal';
import { useWorkoutStore } from '../../src/stores/workout-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { COLORS, CARD_SHADOW } from '../../src/constants/colors';

// Additional colors for compatibility
const EXTRA_COLORS = {
  shadow: COLORS.cardShadow,
  success: COLORS.success,
  incomplete: '#D1D1D6',
};

// Generate current week dates dynamically
const getCurrentWeekDays = () => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Get to Monday
  
  const weekDays = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + mondayOffset + i);
    
    const dayIndex = date.getDay();
    const isToday = date.toDateString() === today.toDateString();
    const isPast = date < today && !isToday;
    
    weekDays.push({
      day: dayNames[dayIndex],
      date: date.getDate(),
      fullDate: date,
      status: isPast ? 'completed' : isToday ? 'today' : 'upcoming'
    });
  }
  
  return weekDays;
};

const WEEK_DAYS = getCurrentWeekDays();

// Generate current month data dynamically
const getCurrentMonthData = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = lastDay.getDate();
  
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];
  
  // Fill first week with nulls before first day
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null);
  }
  
  // Fill in the days
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  // Fill last week with nulls if needed
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }
  
  return weeks;
};

const MONTH_DATA = getCurrentMonthData();

const MONTH_STATUS: any = {
  21: 'completed', 22: 'completed', 23: 'today',
  24: 'upcoming', 25: 'upcoming', 26: 'upcoming', 27: 'upcoming',
  14: 'completed', 15: 'incomplete', 16: 'completed',
};

// Workout categories for explore section with vibrant gradients
const WORKOUT_CATEGORIES = [
  { id: 1, name: 'Strength', icon: 'barbell', gradient: COLORS.strength, workouts: 41 },
  { id: 2, name: 'HIIT', icon: 'flame', gradient: COLORS.hiit, workouts: 32 },
  { id: 3, name: 'Cardio', icon: 'heart', gradient: COLORS.cardio, workouts: 28 },
  { id: 4, name: 'Flexibility', icon: 'fitness', gradient: COLORS.flexibility, workouts: 15 },
  { id: 5, name: 'Mobility', icon: 'body', gradient: COLORS.mobility, workouts: 24 },
  { id: 6, name: 'Conditioning', icon: 'speedometer', gradient: COLORS.conditioning, workouts: 18 },
];

export default function WorkoutsScreen() {
  const router = useRouter();
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [modalVisible, setModalVisible] = useState(false);
  
  // Connect to workout store
  const { currentWorkout, todayWorkout, weekWorkouts, isLoading, fetchTodayWorkout, fetchWeekWorkouts } = useWorkoutStore();

  // Load workouts on mount
  useEffect(() => {
    fetchTodayWorkout();
    fetchWeekWorkouts();
  }, []);

  const handleStartWorkout = () => {
    setModalVisible(false);
    // Navigate to workout hub screen
    router.push('/workout-hub');
  };

  const handleDayPress = (date: number) => {
    setSelectedDate(date);
    setModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return COLORS.success;
      case 'upcoming': return COLORS.gradientStart;
      case 'incomplete': return EXTRA_COLORS.incomplete;
      case 'today': return COLORS.gradientEnd;
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
        workout={currentWorkout || todayWorkout}
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
            <View style={styles.workoutCardContent}>
              <Text style={styles.sectionLabel}>TODAY'S WORKOUT</Text>
              <Text style={styles.workoutName}>{currentWorkout?.title || 'Upper Body Push'}</Text>
              <Text style={styles.workoutMeta}>
                {currentWorkout?.duration || 45} min • {currentWorkout?.exercises?.length || 8} exercises • {currentWorkout?.difficulty || 'Intermediate'}
              </Text>
              <TouchableOpacity 
                style={styles.startButton}
                onPress={() => setModalVisible(true)}
              >
                <LinearGradient
                  colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                  style={styles.startGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="play" size={20} color={COLORS.white} />
                  <Text style={styles.startText}>Start Workout</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
                <Text style={styles.monthTitle}>
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
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

        {/* Explore Workouts Section - VIBRANT GRADIENTS */}
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
                  colors={category.gradient}
                  style={styles.categoryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1.2, y: 1.2 }}
                >
                  <View style={styles.categoryIconWhite}>
                    <Ionicons name={category.icon as any} size={32} color={COLORS.white} />
                  </View>
                  <Text style={styles.categoryNameWhite}>{category.name}</Text>
                  <Text style={styles.categoryCountWhite}>{category.workouts} workouts</Text>
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
  
  // Today's Workout Card - 3D White Card
  workoutCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    ...CARD_SHADOW,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
  },
  workoutCardGradient: {
    padding: 24,
  },
  workoutCardContent: {
    padding: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gradientStart,
    letterSpacing: 1,
    marginBottom: 8,
  },
  workoutCardContent: {
    padding: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mediumGray,
    letterSpacing: 1,
    marginBottom: 8,
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
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  workoutMeta: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 16,
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
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  categoryGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 90,
    justifyContent: 'center',
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIconWhite: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
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
  categoryNameWhite: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  categoryCountWhite: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.white,
    opacity: 0.9,
  },
});