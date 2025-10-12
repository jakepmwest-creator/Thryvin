import { User } from '@shared/schema';
import { WeeklySchedule } from '@/components/workout/SmartWorkoutScheduler';
import { addWeeks, format, startOfWeek, startOfMonth, endOfMonth, eachWeekOfInterval } from 'date-fns';

export interface MonthlyWorkoutCalendar {
  month: string; // "2025-09"
  workouts: CalendarWorkout[];
  generated: string; // ISO date
  userId: number;
}

export interface CalendarWorkout {
  date: string; // "2025-09-16"
  workoutType: string;
  muscleGroups: string[];
  duration: number;
  intensity: 'low' | 'medium' | 'high';
  isRestDay: boolean;
  restDayActivities?: string[];
  aiRecommendation?: string;
  intelligentRest?: boolean;
}

/**
 * 🗓️ Calendar Pre-Generation Service
 * Generates personalized monthly workout calendars immediately after onboarding
 */
export class CalendarPreGenerationService {
  /**
   * Generate a full monthly calendar based on user onboarding data
   */
  static async generateMonthlyCalendar(
    user: User, 
    startDate: Date = new Date()
  ): Promise<MonthlyWorkoutCalendar> {
    try {
      console.log('🗓️ Generating monthly calendar for user:', user.id);
      
      // Generate full month coverage using all weeks that intersect with the month
      const workouts: CalendarWorkout[] = [];
      const monthStart = startOfMonth(startDate);
      const monthEnd = endOfMonth(startDate);
      
      // Get all weeks that intersect with this month
      const weeksInMonth = eachWeekOfInterval(
        { start: monthStart, end: monthEnd },
        { weekStartsOn: 1 } // Monday start
      );
      
      for (const weekStartDate of weeksInMonth) {
        const weeklySchedule = await this.generateWeeklyScheduleForDate(user, weekStartDate);
        
        // Convert weekly schedule to calendar workouts
        const weekWorkouts = this.convertWeeklyScheduleToCalendar(weeklySchedule, weekStartDate);
        
        // Filter workouts to only include days within the target month
        const monthWorkouts = weekWorkouts.filter(workout => {
          const workoutDate = new Date(workout.date);
          return workoutDate >= monthStart && workoutDate <= monthEnd;
        });
        
        workouts.push(...monthWorkouts);
      }
      
      const calendar: MonthlyWorkoutCalendar = {
        month: format(startDate, 'yyyy-MM'),
        workouts,
        generated: new Date().toISOString(),
        userId: user.id
      };
      
      // 💾 Save calendar to localStorage for immediate availability
      this.saveCalendarToStorage(calendar);
      
      console.log(`✅ Generated ${workouts.length} workouts for month ${calendar.month}`);
      return calendar;
      
    } catch (error) {
      console.error('❌ Calendar generation failed:', error);
      throw new Error('Failed to generate monthly calendar');
    }
  }
  
  /**
   * Generate weekly schedule using SmartWorkoutScheduler logic
   */
  private static async generateWeeklyScheduleForDate(
    user: User, 
    weekStart: Date
  ): Promise<WeeklySchedule> {
    // Simulate the SmartWorkoutScheduler logic without React hooks
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const schedule: WeeklySchedule = {};
    
    // Parse user preferences (same logic as SmartWorkoutScheduler)
    let preferredDays: string[] = [];
    let trainingDays = user.trainingDaysPerWeek || 3;
    let sessionDuration = user.sessionDurationPreference || 45;
    let focusAreas: string[] = [];
    let avoidanceAreas: string[] = [];
    
    try {
      if (user.preferredTrainingDays) {
        preferredDays = JSON.parse(user.preferredTrainingDays);
      }
      if (user.focusAreas) {
        focusAreas = JSON.parse(user.focusAreas);
      }
      if (user.avoidanceAreas) {
        avoidanceAreas = JSON.parse(user.avoidanceAreas);
      }
    } catch (error) {
      console.error('Error parsing user preferences:', error);
    }
    
    // Generate workout rotation
    const workoutRotation = this.generateWorkoutRotation(user, focusAreas, avoidanceAreas);
    
    // Distribute workout days
    const scheduledDays = preferredDays.length > 0 ? preferredDays : 
      this.distributeWorkoutDays(days, trainingDays);
    
    let workoutIndex = 0;
    
    days.forEach(day => {
      if (scheduledDays.includes(day) && workoutIndex < trainingDays) {
        const workout = workoutRotation[workoutIndex % workoutRotation.length];
        schedule[day] = {
          workoutType: workout.type,
          muscleGroups: workout.muscleGroups,
          duration: this.adjustDurationForDay(sessionDuration, day, user.preferredTrainingTime || undefined),
          intensity: workout.intensity as 'low' | 'medium' | 'high',
          isRestDay: false
        };
        workoutIndex++;
      } else {
        schedule[day] = {
          workoutType: 'Rest',
          muscleGroups: [],
          duration: 0,
          intensity: 'low',
          isRestDay: true,
          restDayActivities: this.getDefaultRestActivities(user)
        };
      }
    });
    
    return schedule;
  }
  
  /**
   * Convert weekly schedule to calendar format
   */
  private static convertWeeklyScheduleToCalendar(
    weeklySchedule: WeeklySchedule, 
    weekStart: Date
  ): CalendarWorkout[] {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const workouts: CalendarWorkout[] = [];
    
    days.forEach((day, index) => {
      const daySchedule = weeklySchedule[day];
      const workoutDate = new Date(weekStart);
      workoutDate.setDate(workoutDate.getDate() + index);
      
      workouts.push({
        date: format(workoutDate, 'yyyy-MM-dd'),
        workoutType: daySchedule.workoutType,
        muscleGroups: daySchedule.muscleGroups,
        duration: daySchedule.duration,
        intensity: daySchedule.intensity,
        isRestDay: daySchedule.isRestDay,
        restDayActivities: daySchedule.restDayActivities,
        aiRecommendation: daySchedule.aiRecommendation,
        intelligentRest: daySchedule.intelligentRest
      });
    });
    
    return workouts;
  }
  
  /**
   * Save calendar to localStorage for immediate access
   */
  private static saveCalendarToStorage(calendar: MonthlyWorkoutCalendar) {
    try {
      const storageKey = `thryvin-monthly-calendar-${calendar.userId}-${calendar.month}`;
      localStorage.setItem(storageKey, JSON.stringify(calendar));
      
      // Also save current month reference
      localStorage.setItem('thryvin-current-calendar-month', calendar.month);
      localStorage.setItem('thryvin-calendar-pre-generated', 'true');
      
      // 🔧 BRIDGE: Also save in DailyWorkoutView format for compatibility
      this.saveWeeklyScheduleFormat(calendar);
      
      console.log(`💾 Calendar saved to localStorage: ${storageKey}`);
    } catch (error) {
      console.error('Failed to save calendar to localStorage:', error);
    }
  }
  
  /**
   * Save calendar data in the format DailyWorkoutView expects
   * 🎯 FIXED: Now uses ISO date strings as keys instead of day names to prevent overwriting
   */
  private static async saveWeeklyScheduleFormat(calendar: MonthlyWorkoutCalendar) {
    try {
      const weeklySchedule: { [workoutId: string]: any } = {};
      
      // Transform calendar workouts to DailyWorkoutView format
      for (const workout of calendar.workouts) {
        if (!workout.isRestDay) {
          // 🎯 FIXED: Use ISO date string as key instead of day name to avoid collisions
          const workoutKey = workout.date; // Already in ISO format: "2025-09-16"
          
          // 🤖 Generate full workout details using AI for immediate availability
          const fullWorkoutData = await this.generateFullWorkoutForDay(workout, calendar.userId);
          
          weeklySchedule[workoutKey] = fullWorkoutData;
        }
      }
      
      // Save in the format DailyWorkoutView looks for
      localStorage.setItem('thryvin-weekly-schedule', JSON.stringify(weeklySchedule));
      console.log(`🔧 Bridge: Saved ${Object.keys(weeklySchedule).length} workouts with date-based keys:`, Object.keys(weeklySchedule));
      
    } catch (error) {
      console.error('Failed to save weekly schedule format:', error);
    }
  }
  
  /**
   * Generate full workout details for a calendar day
   */
  private static async generateFullWorkoutForDay(calendarWorkout: CalendarWorkout, userId: number): Promise<any> {
    try {
      console.log(`🤖 Pre-generating full workout for ${calendarWorkout.workoutType} on ${calendarWorkout.date}`);
      
      // Call AI workout generation API to get complete workout with exercises
      const response = await fetch('/api/generate-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          workoutType: calendarWorkout.workoutType,
          workoutProfile: {
            sessionDuration: calendarWorkout.duration,
            experienceLevel: 'intermediate', // Default, will be personalized by AI
            muscleGroups: calendarWorkout.muscleGroups
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate workout');
      }
      
      const workoutData = await response.json();
      
      // Transform to DailyWorkoutView format
      return {
        id: `${calendarWorkout.date}-${calendarWorkout.workoutType}`,
        title: workoutData.title,
        description: workoutData.description,
        estimatedTime: calendarWorkout.duration,
        exercises: workoutData.exercises || [],
        muscleGroups: calendarWorkout.muscleGroups,
        difficulty: calendarWorkout.intensity,
        workoutType: calendarWorkout.workoutType
      };
      
    } catch (error) {
      console.error('Failed to generate full workout:', error);
      
      // Fallback to basic workout structure
      return {
        id: `${calendarWorkout.date}-${calendarWorkout.workoutType}`,
        title: `${calendarWorkout.workoutType} Workout`,
        description: `A personalized ${calendarWorkout.workoutType.toLowerCase()} workout`,
        estimatedTime: calendarWorkout.duration,
        exercises: [],
        muscleGroups: calendarWorkout.muscleGroups,
        difficulty: calendarWorkout.intensity,
        workoutType: calendarWorkout.workoutType
      };
    }
  }
  
  /**
   * Load calendar from localStorage
   */
  static loadCalendarFromStorage(userId: number, month: string): MonthlyWorkoutCalendar | null {
    try {
      const storageKey = `thryvin-monthly-calendar-${userId}-${month}`;
      const saved = localStorage.getItem(storageKey);
      
      if (saved) {
        return JSON.parse(saved);
      }
      return null;
    } catch (error) {
      console.error('Failed to load calendar from localStorage:', error);
      return null;
    }
  }

  /**
   * 🎯 NEW: Load workout by date instead of day name
   * Utility method to get a specific workout by ISO date string
   */
  static loadWorkoutByDate(date: string): any | null {
    try {
      const weeklySchedule = localStorage.getItem('thryvin-weekly-schedule');
      if (weeklySchedule) {
        const schedule = JSON.parse(weeklySchedule);
        return schedule[date] || null;
      }
      return null;
    } catch (error) {
      console.error('Failed to load workout by date:', error);
      return null;
    }
  }

  /**
   * 🎯 NEW: Load workout by day name (backward compatibility)
   * For cases where components still use day names as lookup keys
   */
  static loadWorkoutByDayName(dayName: string): any | null {
    try {
      const weeklySchedule = localStorage.getItem('thryvin-weekly-schedule');
      if (weeklySchedule) {
        const schedule = JSON.parse(weeklySchedule);
        
        // Try direct lookup first (backward compatibility)
        if (schedule[dayName]) {
          return schedule[dayName];
        }
        
        // If not found, try to find by matching day of week in current week
        const today = new Date();
        const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
        const dayMapping: { [key: string]: number } = {
          'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
          'friday': 4, 'saturday': 5, 'sunday': 6
        };
        
        const dayOffset = dayMapping[dayName.toLowerCase()];
        if (dayOffset !== undefined) {
          const targetDate = new Date(currentWeekStart);
          targetDate.setDate(targetDate.getDate() + dayOffset);
          const dateKey = format(targetDate, 'yyyy-MM-dd');
          return schedule[dateKey] || null;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to load workout by day name:', error);
      return null;
    }
  }
  
  // Helper methods (extracted from SmartWorkoutScheduler)
  private static generateWorkoutRotation(user: User, focusAreas: string[], avoidanceAreas: string[]) {
    const workouts = [];
    
    // Base workout types based on training preference
    const baseWorkouts = this.getBaseWorkouts(user.trainingType);
    
    // Adjust based on focus areas
    if (focusAreas.includes('Upper body')) {
      workouts.push(
        { type: 'Upper Body - Push', muscleGroups: ['chest', 'shoulders', 'triceps'], intensity: 'medium' },
        { type: 'Upper Body - Pull', muscleGroups: ['back', 'biceps'], intensity: 'medium' }
      );
    }
    
    if (focusAreas.includes('Lower body')) {
      workouts.push(
        { type: 'Lower Body - Strength', muscleGroups: ['quads', 'glutes', 'hamstrings'], intensity: 'high' },
        { type: 'Lower Body - Power', muscleGroups: ['calves', 'glutes', 'quads'], intensity: 'high' }
      );
    }
    
    if (focusAreas.includes('Core/Abs')) {
      workouts.push(
        { type: 'Core Strength', muscleGroups: ['abs', 'obliques', 'lower back'], intensity: 'medium' }
      );
    }
    
    if (focusAreas.includes('Cardio fitness') && user.cardioPreference !== 'hate') {
      const cardioIntensity = user.cardioPreference === 'love' ? 'high' : 'medium';
      workouts.push(
        { type: 'Cardio HIIT', muscleGroups: ['full body'], intensity: cardioIntensity },
        { type: 'Cardio Endurance', muscleGroups: ['full body'], intensity: cardioIntensity }
      );
    }
    
    if (focusAreas.includes('Flexibility')) {
      workouts.push(
        { type: 'Flexibility & Mobility', muscleGroups: ['full body'], intensity: 'low' }
      );
    }
    
    // If no specific focus areas, use balanced approach
    if (workouts.length === 0) {
      workouts.push(...baseWorkouts);
    }
    
    // Filter out avoided areas
    return workouts.filter(workout => 
      !avoidanceAreas.some(avoid => 
        workout.type.toLowerCase().includes(avoid.toLowerCase())
      )
    );
  }
  
  private static getBaseWorkouts(trainingType: string) {
    switch (trainingType) {
      case 'strength':
        return [
          { type: 'Upper Body - Push', muscleGroups: ['chest', 'shoulders', 'triceps'], intensity: 'high' },
          { type: 'Lower Body - Strength', muscleGroups: ['quads', 'glutes', 'hamstrings'], intensity: 'high' },
          { type: 'Upper Body - Pull', muscleGroups: ['back', 'biceps'], intensity: 'high' }
        ];
      case 'cardio':
        return [
          { type: 'Cardio HIIT', muscleGroups: ['full body'], intensity: 'high' },
          { type: 'Cardio Endurance', muscleGroups: ['full body'], intensity: 'medium' },
          { type: 'Active Recovery', muscleGroups: ['full body'], intensity: 'low' }
        ];
      case 'calisthenics':
        return [
          { type: 'Calisthenics Upper', muscleGroups: ['chest', 'shoulders', 'arms'], intensity: 'medium' },
          { type: 'Calisthenics Lower', muscleGroups: ['legs', 'glutes'], intensity: 'medium' },
          { type: 'Calisthenics Core', muscleGroups: ['abs', 'obliques'], intensity: 'medium' }
        ];
      case 'yoga':
        return [
          { type: 'Yoga Flow', muscleGroups: ['full body'], intensity: 'low' },
          { type: 'Power Yoga', muscleGroups: ['full body'], intensity: 'medium' },
          { type: 'Restorative Yoga', muscleGroups: ['full body'], intensity: 'low' }
        ];
      default:
        return [
          { type: 'Full Body Strength', muscleGroups: ['full body'], intensity: 'medium' },
          { type: 'Cardio & Conditioning', muscleGroups: ['full body'], intensity: 'medium' },
          { type: 'Flexibility & Recovery', muscleGroups: ['full body'], intensity: 'low' }
        ];
    }
  }
  
  private static distributeWorkoutDays(days: string[], trainingDays: number): string[] {
    const selectedDays: string[] = [];
    const workingDays = days.slice(0, 6); // Monday to Saturday
    
    if (trainingDays >= workingDays.length) {
      return workingDays;
    }
    
    // Distribute evenly
    const interval = Math.floor(workingDays.length / trainingDays);
    for (let i = 0; i < trainingDays; i++) {
      const index = (i * interval) % workingDays.length;
      selectedDays.push(workingDays[index]);
    }
    
    return selectedDays;
  }
  
  private static adjustDurationForDay(baseDuration: number, day: string, preferredTime?: string | null): number {
    // Adjust based on preferred training time and day
    let duration = baseDuration;
    
    if (day === 'Monday' || day === 'Friday') {
      duration += 5; // Slightly longer for start/end of week
    }
    
    if (preferredTime === 'morning') {
      duration -= 5; // Shorter morning sessions
    }
    
    return Math.max(20, duration); // Minimum 20 minutes
  }
  
  private static getDefaultRestActivities(user: User): string[] {
    const activities = ['Light stretching', 'Gentle walk', 'Meditation'];
    
    // Personalize based on user preferences
    if (user.goal === 'flexibility') {
      activities.unshift('Extended yoga session');
    }
    if (user.trainingType === 'cardio') {
      activities.push('Easy bike ride');
    }
    if (user.cardioPreference === 'love') {
      activities.push('Light swimming');
    }
    
    return activities.slice(0, 3);
  }
}