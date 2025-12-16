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
import { ExploreWorkoutsModal } from '../../src/components/ExploreWorkoutsModal';
import { useWorkoutStore } from '../../src/stores/workout-store';
import { useCoachStore } from '../../src/stores/coach-store';
import { LikedDislikedModal } from '../../src/components/LikedDislikedModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { COLORS, CARD_SHADOW } from '../../src/constants/colors';

const EXTRA_COLORS = {
  shadow: COLORS.cardShadow,
  success: COLORS.success,
  incomplete: '#D1D1D6',
};

const getCurrentMonthData = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  let firstDayOfWeek = firstDay.getDay();
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  
  const daysInMonth = lastDay.getDate();
  
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];
  
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }
  
  return weeks;
};

const MONTH_DATA = getCurrentMonthData();

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://thryvin-ai-fix.preview.emergentagent.com';

// Updated categories: Cardio, Flexibility, Strength, Calisthenics
const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Strength', icon: 'barbell', gradient: COLORS.strength, workouts: 0 },
  { id: 2, name: 'Calisthenics', icon: 'body', gradient: COLORS.hiit, workouts: 0 },
  { id: 3, name: 'Cardio', icon: 'heart', gradient: COLORS.cardio, workouts: 0 },
  { id: 4, name: 'Flexibility', icon: 'fitness', gradient: COLORS.flexibility, workouts: 0 },
];

export default function WorkoutsScreen() {
  const router = useRouter();
  const { openChat } = useCoachStore();
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const [selectedFullDate, setSelectedFullDate] = useState<Date>(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  
  const [exploreModalVisible, setExploreModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Strength');
  const [selectedCategoryGradient, setSelectedCategoryGradient] = useState<string[]>(COLORS.strength);
  const [likedDislikedModalVisible, setLikedDislikedModalVisible] = useState(false);
  const [workoutCategories, setWorkoutCategories] = useState(DEFAULT_CATEGORIES);
  
  const { currentWorkout, todayWorkout, weekWorkouts, completedWorkouts, isLoading, fetchTodayWorkout, fetchWeekWorkouts } = useWorkoutStore();
  
  // Fetch exercise counts on mount
  useEffect(() => {
    const fetchExerciseCounts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/exercises/counts`);
        if (response.ok) {
          const data = await response.json();
          const counts = data.counts || {};
          
          // Update categories with dynamic counts
          setWorkoutCategories(prev => prev.map(cat => ({
            ...cat,
            workouts: counts[cat.name] || 0
          })));
          
          console.log('📊 Updated exercise counts:', counts);
        }
      } catch (error) {
        console.error('Failed to fetch exercise counts:', error);
      }
    };
    
    fetchExerciseCounts();
  }, []);
  
  const handleCategoryPress = (category: { name: string; gradient: string[] }) => {
    setSelectedCategory(category.name);
    setSelectedCategoryGradient(category.gradient);
    setExploreModalVisible(true);
  };
  
  const hasWorkout = (date: Date) => {
    const dateStr = date.toDateString();
    const workout = weekWorkouts.find(w => {
      const workoutDate = new Date(w.date);
      return workoutDate.toDateString() === dateStr;
    });
    if (!workout) return false;
    if (workout.title?.toLowerCase().includes('rest')) return false;
    return true;
  };
  
  const isDateCompleted = (date: Date) => {
    const dateStr = date.toDateString();
    const weekCompleted = weekWorkouts.some(w => {
      if (!w.completed) return false;
      if (w.title?.toLowerCase().includes('rest')) return false;
      const workoutDate = new Date(w.date);
      return workoutDate.toDateString() === dateStr;
    });
    if (weekCompleted) return true;
    return completedWorkouts.some(w => {
      const workoutDate = new Date(w.completedAt || w.date);
      return workoutDate.toDateString() === dateStr;
    });
  };
  
  const isRestDay = (date: Date) => {
    const dateStr = date.toDateString();
    const workout = weekWorkouts.find(w => {
      const workoutDate = new Date(w.date);
      return workoutDate.toDateString() === dateStr;
    });
    return workout?.title?.toLowerCase().includes('rest') || false;
  };
  
  const getDateStatus = (day: number) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const date = new Date(year, month, day);
    
    const isToday = date.toDateString() === today.toDateString();
    const isPast = date < today && !isToday;
    const isCompleted = isDateCompleted(date);
    const isRest = isRestDay(date);
    const hasWorkoutForDay = hasWorkout(date);
    
    if (isCompleted) return 'completed';
    if (isRest) return 'rest';
    if (isToday) return 'today';
    if (isPast && !hasWorkoutForDay) return 'none';
    if (isPast) return 'incomplete';
    if (!hasWorkoutForDay) return 'none';
    return 'upcoming';
  };
  
  const getCurrentWeekDays = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    
    const weekDays = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + mondayOffset + i);
      
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today && !isToday;
      const isCompleted = isDateCompleted(date);
      const isRest = isRestDay(date);
      const hasWorkoutForDay = hasWorkout(date);
      
      weekDays.push({
        day: dayNames[i],
        date: date.getDate(),
        fullDate: date,
        status: isCompleted ? 'completed' : (isToday ? 'today' : (isPast ? 'incomplete' : 'upcoming')),
        isRestDay: isRest,
        hasWorkout: hasWorkoutForDay,
      });
    }
    
    return weekDays;
  };
  
  const WEEK_DAYS = getCurrentWeekDays();

  useEffect(() => {
    fetchTodayWorkout();
    fetchWeekWorkouts();
  }, []);

  const handleStartWorkout = () => {
    setModalVisible(false);
    router.push('/workout-hub');
  };

  const handleDayPress = (date: number) => {
    setSelectedDate(date);
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const clickedDate = new Date(year, month, date);
    setSelectedFullDate(clickedDate);
    const dayOfWeek = clickedDate.getDay();
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const currentMonday = new Date(today);
    const currentDayOfWeek = today.getDay();
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    currentMonday.setDate(today.getDate() + mondayOffset);
    currentMonday.setHours(0, 0, 0, 0);
    const clickedMonday = new Date(clickedDate);
    const clickedDayOfWeek = clickedDate.getDay();
    const clickedMondayOffset = clickedDayOfWeek === 0 ? -6 : 1 - clickedDayOfWeek;
    clickedMonday.setDate(clickedDate.getDate() + clickedMondayOffset);
    clickedMonday.setHours(0, 0, 0, 0);
    const weekDiff = Math.round((clickedMonday.getTime() - currentMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
    setSelectedWeekOffset(weekDiff);
    setSelectedDayIndex(dayIndex);
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
  
  // Get today's workout from weekWorkouts
  const todayDate = new Date().toDateString();
  const actualTodayWorkout = weekWorkouts.find(w => new Date(w.date).toDateString() === todayDate) || currentWorkout;

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader mode="fitness" />
      
      <WorkoutDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onStartWorkout={handleStartWorkout}
        selectedDate={selectedDate}
        selectedFullDate={selectedFullDate}
        initialDayIndex={selectedDayIndex}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Workout</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.gradientStart} style={{ marginTop: 20 }} />
          ) : actualTodayWorkout?.isRestDay ? (
            <View style={styles.workoutCard}>
              <View style={styles.workoutCardContent}>
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="bed" size={48} color={COLORS.mediumGray} />
                  <Text style={[styles.workoutName, { marginTop: 12 }]}>Rest Day</Text>
                  <Text style={styles.workoutMeta}>
                    Take time to recover. Stay hydrated! 💧
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.restDayAskButton}
                  onPress={() => openChat("It's my rest day but I'm feeling energetic. Can you suggest something light I could do?")}
                >
                  <LinearGradient
                    colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                    style={styles.restDayAskGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="chatbubble-ellipses" size={18} color={COLORS.white} />
                    <Text style={styles.restDayAskText}>Feeling energetic?</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.workoutCard}>
              <View style={styles.workoutCardContent}>
                <Text style={styles.sectionLabel}>TODAY'S WORKOUT</Text>
                <Text style={styles.workoutName}>{actualTodayWorkout?.title || 'Loading...'}</Text>
                <Text style={styles.workoutMeta}>
                  {actualTodayWorkout?.duration || 45} min • {actualTodayWorkout?.exercises?.length || 0} exercises • {actualTodayWorkout?.difficulty || 'Intermediate'}
                </Text>
                <TouchableOpacity 
                  style={styles.startButton}
                  onPress={() => {
                    const today = new Date();
                    const dayOfWeek = today.getDay();
                    const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    setSelectedDayIndex(todayIndex);
                    setModalVisible(true);
                  }}
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
          )}
        </View>

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
            <View style={styles.weekCalendar}>
              {WEEK_DAYS.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCard,
                    day.status === 'today' && styles.dayCardToday,
                  ]}
                  onPress={() => {
                    setSelectedDayIndex(index);
                    setSelectedFullDate(day.fullDate);
                    setModalVisible(true);
                  }}
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
                  {day.isRestDay ? (
                    <View style={styles.restDayIcon}>
                      <Ionicons name="bed-outline" size={12} color={COLORS.mediumGray} />
                    </View>
                  ) : day.status === 'completed' ? (
                    <View style={styles.completedIcon}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    </View>
                  ) : day.hasWorkout ? (
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(day.status) }]} />
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
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
                  {week.map((date, dayIndex) => {
                    const dateStatus = date ? getDateStatus(date) : 'none';
                    return (
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
                          {dateStatus === 'completed' ? (
                            <View style={styles.completedIconSmall}>
                              <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
                            </View>
                          ) : dateStatus !== 'rest' && dateStatus !== 'none' ? (
                            <View style={[
                              styles.monthDayDot,
                              { backgroundColor: getStatusColor(dateStatus) }
                            ]} />
                          ) : null}
                        </>
                      )}
                    </TouchableOpacity>
                  );
                  })}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.exploreTitleRow}>
            <Text style={styles.sectionTitle}>Explore Workouts</Text>
            <TouchableOpacity 
              onPress={() => setLikedDislikedModalVisible(true)}
              style={styles.heartButton}
            >
              <Ionicons name="heart" size={24} color={COLORS.accent} />
            </TouchableOpacity>
          </View>
          <View style={styles.categoriesGrid}>
            {workoutCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category)}
              >
                <LinearGradient
                  colors={category.gradient as [string, string]}
                  style={styles.categoryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1.2, y: 1.2 }}
                >
                  <View style={styles.categoryIconWhite}>
                    <Ionicons name={category.icon as any} size={32} color={COLORS.white} />
                  </View>
                  <Text style={styles.categoryNameWhite}>{category.name}</Text>
                  <Text style={styles.categoryCountWhite}>{category.workouts} exercises</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Log Unexpected Workout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Log Unexpected Workout</Text>
          <TouchableOpacity 
            style={styles.logWorkoutCard}
            onPress={() => openChat("I did an unexpected workout today. Can I log it?")}
          >
            <View style={styles.logWorkoutContent}>
              <View style={styles.logWorkoutIcon}>
                <Ionicons name="add-circle" size={32} color={COLORS.accent} />
              </View>
              <View style={styles.logWorkoutText}>
                <Text style={styles.logWorkoutTitle}>Track Extra Activity</Text>
                <Text style={styles.logWorkoutSubtitle}>Gym session, run, or other workout you did</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <ExploreWorkoutsModal
        visible={exploreModalVisible}
        onClose={() => setExploreModalVisible(false)}
        category={selectedCategory}
        categoryGradient={selectedCategoryGradient}
      />
      
      <LikedDislikedModal
        visible={likedDislikedModalVisible}
        onClose={() => setLikedDislikedModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: COLORS.text, marginBottom: 16 },
  workoutCard: { backgroundColor: COLORS.white, borderRadius: 24, overflow: 'hidden', ...CARD_SHADOW, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.9)', marginBottom: 20 },
  workoutCardContent: { padding: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: COLORS.mediumGray, letterSpacing: 1, marginBottom: 8 },
  workoutName: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  workoutMeta: { fontSize: 14, color: COLORS.mediumGray, marginBottom: 16 },
  startButton: { borderRadius: 12, overflow: 'hidden' },
  startGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  startText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  viewToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 },
  viewToggleText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  weekCalendar: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  dayCard: { flex: 1, backgroundColor: COLORS.lightGray, borderRadius: 16, paddingVertical: 16, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  dayCardToday: { backgroundColor: COLORS.accent },
  dayText: { fontSize: 12, fontWeight: '600', color: COLORS.mediumGray, marginBottom: 8 },
  dayTextActive: { color: COLORS.white, zIndex: 1 },
  dateText: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  dateTextActive: { color: COLORS.white, zIndex: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3, zIndex: 1 },
  completedIcon: { marginTop: 2 },
  restDayIcon: { marginTop: 2, opacity: 0.6 },
  completedIconSmall: { marginTop: 2 },
  monthCalendar: { backgroundColor: COLORS.lightGray, borderRadius: 20, padding: 16 },
  monthHeader: { marginBottom: 16 },
  monthTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  weekdaysRow: { flexDirection: 'row', marginBottom: 12 },
  weekdayLabel: { flex: 1, fontSize: 12, fontWeight: '600', color: COLORS.mediumGray, textAlign: 'center' },
  monthWeekRow: { flexDirection: 'row', marginBottom: 8 },
  monthDayCell: { flex: 1, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: COLORS.white, marginHorizontal: 2, position: 'relative', overflow: 'hidden' },
  monthDayCellEmpty: { backgroundColor: 'transparent' },
  monthDayCellSelected: { backgroundColor: COLORS.accent },
  monthDayText: { fontSize: 14, fontWeight: '600', color: COLORS.text, zIndex: 1 },
  monthDayTextActive: { color: COLORS.white },
  monthDayDot: { width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: 6, zIndex: 1 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: { width: (SCREEN_WIDTH - 52) / 2, borderRadius: 24, overflow: 'hidden', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, marginBottom: 16 },
  categoryGradient: { padding: 16, alignItems: 'center', minHeight: 90, justifyContent: 'center' },
  categoryIconWhite: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255, 255, 255, 0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  categoryNameWhite: { fontSize: 16, fontWeight: '700', color: COLORS.white, marginBottom: 4 },
  categoryCountWhite: { fontSize: 13, fontWeight: '500', color: COLORS.white, opacity: 0.9 },
  exploreTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  heartButton: { padding: 8, backgroundColor: COLORS.lightGray, borderRadius: 12 },
  restDayAskButton: { borderRadius: 12, overflow: 'hidden', marginTop: 16 },
  restDayAskGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
  restDayAskText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  logWorkoutCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, borderWidth: 2, borderColor: COLORS.lightGray, borderStyle: 'dashed' },
  logWorkoutContent: { flexDirection: 'row', alignItems: 'center' },
  logWorkoutIcon: { marginRight: 16 },
  logWorkoutText: { flex: 1 },
  logWorkoutTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  logWorkoutSubtitle: { fontSize: 13, color: COLORS.mediumGray },
});
