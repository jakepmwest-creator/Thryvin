import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore } from '../stores/workout-store';

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  success: '#34C759',
};

interface ViewAllWeeksModalProps {
  visible: boolean;
  onClose: () => void;
  onEditPress?: () => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Get today's day index in our week array (0=Mon, 1=Tue, ..., 6=Sun)
const getTodayDayIndex = (): number => {
  const jsDay = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  return jsDay === 0 ? 6 : jsDay - 1; // Convert to 0=Mon, ..., 6=Sun
};

export const ViewAllWeeksModal = ({ visible, onClose, onEditPress }: ViewAllWeeksModalProps) => {
  const { weekWorkouts, completedWorkouts } = useWorkoutStore();
  const [selectedWeek, setSelectedWeek] = useState(1);

  // Organize workouts into weeks
  const weeksData = useMemo(() => {
    const weeks: { weekNum: number; days: any[] }[] = [];
    
    // Create 3 weeks of data
    for (let week = 1; week <= 3; week++) {
      const startDay = (week - 1) * 7;
      const weekDays = [];
      
      for (let day = 0; day < 7; day++) {
        const dayIndex = startDay + day;
        const workout = weekWorkouts[dayIndex];
        const workoutId = workout?.id || `workout-${dayIndex}`;
        const isCompleted = workout && completedWorkouts.some(cw => 
          typeof cw === 'string' ? cw === workoutId : cw?.id === workoutId
        );
        
        weekDays.push({
          dayName: DAYS[day],
          dayNum: dayIndex + 1,
          workout: workout || null,
          isCompleted,
          isToday: day === getTodayDayIndex() && week === 1,
          isRest: workout?.title?.toLowerCase().includes('rest'),
        });
      }
      
      weeks.push({ weekNum: week, days: weekDays });
    }
    
    return weeks;
  }, [weekWorkouts, completedWorkouts]);

  // Calculate week stats
  const getWeekStats = (week: { weekNum: number; days: any[] }) => {
    const completed = week.days.filter(d => d.isCompleted).length;
    const total = week.days.filter(d => d.workout && !d.isRest).length;
    return { completed, total };
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.mediumGray} />
            </TouchableOpacity>
            <Text style={styles.title}>Your 21-Day Program</Text>
            {onEditPress ? (
              <TouchableOpacity onPress={onEditPress} style={styles.editButton}>
                <Ionicons name="create-outline" size={22} color={COLORS.accent} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 32 }} />
            )}
          </View>

          {/* Week Tabs */}
          <View style={styles.weekTabs}>
            {[1, 2, 3].map(week => {
              const stats = weeksData[week - 1] ? getWeekStats(weeksData[week - 1]) : { completed: 0, total: 0 };
              const isSelected = selectedWeek === week;
              
              return (
                <TouchableOpacity
                  key={week}
                  style={[styles.weekTab, isSelected && styles.weekTabSelected]}
                  onPress={() => setSelectedWeek(week)}
                >
                  <Text style={[styles.weekTabText, isSelected && styles.weekTabTextSelected]}>
                    Week {week}
                  </Text>
                  <Text style={[styles.weekTabStats, isSelected && styles.weekTabStatsSelected]}>
                    {stats.completed}/{stats.total}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {weeksData[selectedWeek - 1]?.days.map((day, index) => (
              <View 
                key={index} 
                style={[
                  styles.dayCard,
                  day.isToday && styles.dayCardToday,
                  day.isCompleted && styles.dayCardCompleted,
                ]}
              >
                <View style={styles.dayHeader}>
                  <View style={styles.dayInfo}>
                    <Text style={[styles.dayName, day.isToday && styles.dayNameToday]}>
                      {day.dayName}
                    </Text>
                    <Text style={styles.dayNum}>Day {(selectedWeek - 1) * 7 + index + 1}</Text>
                  </View>
                  
                  {day.isToday && (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayBadgeText}>TODAY</Text>
                    </View>
                  )}
                  
                  {day.isCompleted && (
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                    </View>
                  )}
                </View>
                
                {day.workout ? (
                  <View style={styles.workoutInfo}>
                    {day.isRest ? (
                      <>
                        <Ionicons name="bed" size={20} color={COLORS.mediumGray} />
                        <Text style={styles.restText}>Rest Day</Text>
                      </>
                    ) : (
                      <>
                        <LinearGradient
                          colors={[COLORS.accent, COLORS.accentSecondary]}
                          style={styles.workoutIcon}
                        >
                          <Ionicons name="barbell" size={16} color={COLORS.white} />
                        </LinearGradient>
                        <View style={styles.workoutDetails}>
                          <Text style={styles.workoutTitle} numberOfLines={1}>
                            {day.workout.title || 'Workout'}
                          </Text>
                          <Text style={styles.workoutMeta}>
                            {day.workout.duration || 45} min • {day.workout.exercises?.length || 0} exercises
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                ) : (
                  <View style={styles.workoutInfo}>
                    <Ionicons name="time" size={20} color={COLORS.mediumGray} />
                    <Text style={styles.pendingText}>Generating...</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Week Summary */}
            {weeksData[selectedWeek - 1] && (
              <View style={styles.weekSummary}>
                <Text style={styles.weekSummaryTitle}>Week {selectedWeek} Focus</Text>
                <View style={styles.focusTags}>
                  <View style={styles.focusTag}>
                    <Ionicons name="barbell" size={14} color={COLORS.accent} />
                    <Text style={styles.focusTagText}>Progressive Overload</Text>
                  </View>
                  <View style={styles.focusTag}>
                    <Ionicons name="trending-up" size={14} color={COLORS.accent} />
                    <Text style={styles.focusTagText}>Building Foundation</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  weekTabs: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  weekTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  weekTabSelected: {
    backgroundColor: COLORS.accent,
  },
  weekTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  weekTabTextSelected: {
    color: COLORS.white,
  },
  weekTabStats: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  weekTabStatsSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    paddingHorizontal: 16,
  },
  dayCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  dayCardToday: {
    backgroundColor: `${COLORS.accent}10`,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  dayCardCompleted: {
    backgroundColor: `${COLORS.success}08`,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  dayNameToday: {
    color: COLORS.accent,
  },
  dayNum: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  todayBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  completedBadge: {
    // Already styled by icon
  },
  workoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workoutIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutDetails: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  workoutMeta: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  restText: {
    fontSize: 15,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  pendingText: {
    fontSize: 15,
    color: COLORS.mediumGray,
    fontStyle: 'italic',
  },
  weekSummary: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  weekSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  focusTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  focusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  focusTagText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
});
