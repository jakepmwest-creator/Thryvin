import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://workout-buddy-622.preview.emergentagent.com';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: number;
  duration?: number;
  restTime: number;
  instructions?: string;
  videoUrl?: string;
}

interface Workout {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  duration: number;
  exercises: Exercise[];
  completed?: boolean;
  completedAt?: string;
  date: string;
  overview?: string;
  targetMuscles?: string;
  caloriesBurn?: number;
  exerciseList?: Exercise[]; // Alias for modal compatibility
}

interface WorkoutStats {
  totalWorkouts: number;
  weeklyWorkouts: number;
  weeklyGoal: number;
  weeklyMinutes: number;
  weeklyMinutesGoal: number;
  currentStreak: number;
  longestStreak: number;
  totalMinutes: number;
  level: string;
  xpPoints: number;
}

interface PersonalBest {
  exercise: string;
  value: number;
  unit: string;
  date: string;
  workoutId?: string;
}

interface WorkoutStore {
  // State
  todayWorkout: Workout | null;
  weekWorkouts: Workout[] | null;
  completedWorkouts: Workout[];
  stats: WorkoutStats | null;
  personalBests: PersonalBest[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTodayWorkout: () => Promise<void>;
  fetchWeekWorkouts: () => Promise<void>;
  fetchCompletedWorkouts: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchPersonalBests: () => Promise<void>;
  completeWorkout: (workoutId: string, exercises: any[]) => Promise<void>;
  logManualWorkout: (workout: Partial<Workout>) => Promise<void>;
  clearError: () => void;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  // Initial State
  todayWorkout: null,
  weekWorkouts: null,
  completedWorkouts: [],
  stats: null,
  personalBests: [],
  isLoading: false,
  error: null,

  // Fetch today's AI-generated workout
  fetchTodayWorkout: async () => {
    set({ isLoading: true, error: null });
    try {
      // For now, use local storage until backend is accessible
      // In production, this would be: const response = await fetch(`${API_URL}/api/workouts/today`);
      
      const storedUser = await SecureStore.getItemAsync('auth_user');
      if (!storedUser) {
        throw new Error('User not authenticated');
      }
      
      const user = JSON.parse(storedUser);
      
      // Generate AI workout based on user's onboarding data
      const dayOfWeek = new Date().getDay(); // 0-6
      const workoutTitle = getWorkoutTitle(dayOfWeek, user);
      const exerciseList = generateExercises(user, dayOfWeek);
      
      const workout: Workout = {
        id: `workout_${Date.now()}`,
        title: workoutTitle,
        type: user.trainingType || 'General Fitness',
        difficulty: user.experience || 'Intermediate',
        duration: parseInt(user.sessionDuration) || 45,
        date: new Date().toISOString(),
        exercises: exerciseList,
        overview: `${exerciseList.length} exercises focusing on ${user.trainingType || 'general fitness'}. This ${(parseInt(user.sessionDuration) || 45)}-minute session is tailored to your ${user.experience || 'intermediate'} level. Perfect for building strength and muscle.`,
        targetMuscles: user.trainingType || 'Full Body',
        caloriesBurn: Math.round((parseInt(user.sessionDuration) || 45) * 8),
        exerciseList: exerciseList, // For compatibility with modal
      };
      
      set({ todayWorkout: workout, isLoading: false });
      console.log('Today\'s workout loaded:', workout.title);
    } catch (error) {
      console.error('Error fetching today\'s workout:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load workout',
        isLoading: false 
      });
    }
  },

  // Fetch week's workouts
  fetchWeekWorkouts: async () => {
    set({ isLoading: true, error: null });
    try {
      const storedUser = await SecureStore.getItemAsync('auth_user');
      if (!storedUser) {
        throw new Error('User not authenticated');
      }
      
      const user = JSON.parse(storedUser);
      const weekWorkouts: Workout[] = [];
      
      // Generate 7 days of workouts
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const workoutTitle = getWorkoutTitle(i, user);
        const exerciseList = generateExercises(user, i);
        
        weekWorkouts.push({
          id: `workout_${date.getTime()}`,
          title: `Day ${i + 1}: ${workoutTitle}`,
          type: user.trainingType || 'General Fitness',
          difficulty: user.experience || 'Intermediate',
          duration: parseInt(user.sessionDuration) || 45,
          date: date.toISOString(),
          exercises: exerciseList,
          overview: `${exerciseList.length} exercises focusing on ${user.trainingType || 'general fitness'}. This ${(parseInt(user.sessionDuration) || 45)}-minute session is tailored to your ${user.experience || 'intermediate'} level.`,
          targetMuscles: user.trainingType || 'Full Body',
          caloriesBurn: Math.round((parseInt(user.sessionDuration) || 45) * 8),
          exerciseList: exerciseList,
        });
      }
      
      set({ weekWorkouts, isLoading: false });
      console.log('Week workouts loaded:', weekWorkouts.length);
    } catch (error) {
      console.error('Error fetching week workouts:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load workouts',
        isLoading: false 
      });
    }
  },

  // Fetch completed workouts
  fetchCompletedWorkouts: async () => {
    try {
      const stored = await SecureStore.getItemAsync('completed_workouts');
      const completedWorkouts = stored ? JSON.parse(stored) : [];
      set({ completedWorkouts });
      console.log('Completed workouts loaded:', completedWorkouts.length);
    } catch (error) {
      console.error('Error fetching completed workouts:', error);
    }
  },

  // Fetch user stats
  fetchStats: async () => {
    try {
      const stored = await SecureStore.getItemAsync('workout_stats');
      const storedUser = await SecureStore.getItemAsync('auth_user');
      
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const completedWorkouts = get().completedWorkouts;
        
        // Calculate stats from completed workouts
        const thisWeek = completedWorkouts.filter(w => {
          const workoutDate = new Date(w.completedAt || w.date);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return workoutDate >= weekAgo;
        });
        
        const stats: WorkoutStats = stored ? JSON.parse(stored) : {
          totalWorkouts: completedWorkouts.length,
          weeklyWorkouts: thisWeek.length,
          weeklyGoal: parseInt(user.trainingDays) || 5,
          weeklyMinutes: thisWeek.reduce((sum, w) => sum + (w.duration || 0), 0),
          weeklyMinutesGoal: (parseInt(user.sessionDuration) || 45) * (parseInt(user.trainingDays) || 5),
          currentStreak: calculateStreak(completedWorkouts),
          longestStreak: 0,
          totalMinutes: completedWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
          level: 'Bronze',
          xpPoints: completedWorkouts.length * 100,
        };
        
        set({ stats });
        console.log('Stats loaded:', stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  },

  // Fetch personal bests
  fetchPersonalBests: async () => {
    try {
      const stored = await SecureStore.getItemAsync('personal_bests');
      const personalBests = stored ? JSON.parse(stored) : [];
      set({ personalBests });
      console.log('Personal bests loaded:', personalBests.length);
    } catch (error) {
      console.error('Error fetching personal bests:', error);
    }
  },

  // Complete a workout
  completeWorkout: async (workoutId: string, exercises: any[]) => {
    try {
      const workout = get().todayWorkout;
      if (!workout) return;
      
      const completedWorkout: Workout = {
        ...workout,
        completed: true,
        completedAt: new Date().toISOString(),
        exercises: exercises,
      };
      
      // Save to completed workouts
      const completedWorkouts = [...get().completedWorkouts, completedWorkout];
      await SecureStore.setItemAsync('completed_workouts', JSON.stringify(completedWorkouts));
      set({ completedWorkouts });
      
      // Update personal bests
      await updatePersonalBests(exercises);
      
      // Refresh stats
      await get().fetchStats();
      await get().fetchPersonalBests();
      
      console.log('Workout completed:', workoutId);
    } catch (error) {
      console.error('Error completing workout:', error);
      throw error;
    }
  },

  // Log manual workout
  logManualWorkout: async (workoutData: Partial<Workout>) => {
    try {
      const manualWorkout: Workout = {
        id: `manual_${Date.now()}`,
        title: workoutData.title || 'Manual Workout',
        type: workoutData.type || 'General',
        difficulty: workoutData.difficulty || 'Moderate',
        duration: workoutData.duration || 30,
        exercises: workoutData.exercises || [],
        completed: true,
        completedAt: new Date().toISOString(),
        date: new Date().toISOString(),
      };
      
      const completedWorkouts = [...get().completedWorkouts, manualWorkout];
      await SecureStore.setItemAsync('completed_workouts', JSON.stringify(completedWorkouts));
      set({ completedWorkouts });
      
      // Update stats
      await get().fetchStats();
      
      console.log('Manual workout logged:', manualWorkout.title);
    } catch (error) {
      console.error('Error logging manual workout:', error);
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

// Helper Functions

function generateExercises(user: any, dayIndex: number = 0): Exercise[] {
  const goal = user.fitnessGoals?.[0] || user.goal || 'general-fitness';
  const experience = user.experience || 'beginner';
  
  // Different workout splits based on day
  const workoutTypes = ['upper', 'lower', 'full', 'cardio', 'core'];
  const workoutType = workoutTypes[dayIndex % workoutTypes.length];
  
  const exercises: Exercise[] = [];
  
  if (workoutType === 'upper') {
    exercises.push(
      { id: '1', name: 'Bench Press', sets: 4, reps: '8-10', restTime: 90 },
      { id: '2', name: 'Bent Over Rows', sets: 4, reps: '8-10', restTime: 90 },
      { id: '3', name: 'Shoulder Press', sets: 3, reps: '10-12', restTime: 60 },
      { id: '4', name: 'Bicep Curls', sets: 3, reps: '12-15', restTime: 45 },
      { id: '5', name: 'Tricep Dips', sets: 3, reps: '12-15', restTime: 45 },
    );
  } else if (workoutType === 'lower') {
    exercises.push(
      { id: '1', name: 'Squats', sets: 4, reps: '8-10', restTime: 120 },
      { id: '2', name: 'Romanian Deadlifts', sets: 4, reps: '8-10', restTime: 90 },
      { id: '3', name: 'Leg Press', sets: 3, reps: '12-15', restTime: 60 },
      { id: '4', name: 'Leg Curls', sets: 3, reps: '12-15', restTime: 45 },
      { id: '5', name: 'Calf Raises', sets: 4, reps: '15-20', restTime: 30 },
    );
  } else if (workoutType === 'cardio') {
    exercises.push(
      { id: '1', name: 'Running', sets: 1, reps: '30 min', duration: 30, restTime: 0 },
      { id: '2', name: 'Jump Rope', sets: 3, reps: '2 min', duration: 2, restTime: 60 },
      { id: '3', name: 'Burpees', sets: 3, reps: '15', restTime: 60 },
    );
  } else {
    exercises.push(
      { id: '1', name: 'Push-ups', sets: 4, reps: '12-15', restTime: 60 },
      { id: '2', name: 'Pull-ups', sets: 4, reps: '6-8', restTime: 90 },
      { id: '3', name: 'Squats', sets: 4, reps: '15-20', restTime: 60 },
      { id: '4', name: 'Plank', sets: 3, reps: '60 sec', duration: 60, restTime: 45 },
    );
  }
  
  return exercises;
}

function getWorkoutTitle(dayIndex: number, user: any): string {
  const goal = user.fitnessGoals?.[0] || user.goal || 'fitness';
  const experience = user.experience || 'beginner';
  
  const titles = [
    `Upper Body Power ${experience === 'advanced' ? '- Heavy' : ''}`,
    `Lower Body Strength ${goal.includes('muscle') ? '& Hypertrophy' : ''}`,
    `Full Body Circuit ${goal.includes('weight-loss') ? 'HIIT' : ''}`,
    `Cardio & Conditioning ${experience === 'beginner' ? 'Basics' : 'Challenge'}`,
    `Active Recovery & Mobility`,
    `Strength Focus ${goal.includes('strength') ? '- PR Day' : ''}`,
    `HIIT & Core Blast`,
  ];
  
  return titles[dayIndex % titles.length].trim();
}

function calculateStreak(workouts: Workout[]): number {
  if (workouts.length === 0) return 0;
  
  const sortedWorkouts = workouts
    .sort((a, b) => new Date(b.completedAt || b.date).getTime() - new Date(a.completedAt || a.date).getTime());
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const workout of sortedWorkouts) {
    const workoutDate = new Date(workout.completedAt || workout.date);
    workoutDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === streak) {
      streak++;
    } else if (daysDiff > streak) {
      break;
    }
  }
  
  return streak;
}

async function updatePersonalBests(exercises: any[]) {
  try {
    const stored = await SecureStore.getItemAsync('personal_bests');
    const personalBests: PersonalBest[] = stored ? JSON.parse(stored) : [];
    
    for (const exercise of exercises) {
      if (exercise.weight) {
        const existingBest = personalBests.find(pb => pb.exercise === exercise.name);
        
        if (!existingBest || exercise.weight > existingBest.value) {
          const newBest: PersonalBest = {
            exercise: exercise.name,
            value: exercise.weight,
            unit: 'lbs',
            date: new Date().toISOString(),
          };
          
          if (existingBest) {
            const index = personalBests.indexOf(existingBest);
            personalBests[index] = newBest;
          } else {
            personalBests.push(newBest);
          }
        }
      }
    }
    
    await SecureStore.setItemAsync('personal_bests', JSON.stringify(personalBests));
    console.log('Personal bests updated');
  } catch (error) {
    console.error('Error updating personal bests:', error);
  }
}
