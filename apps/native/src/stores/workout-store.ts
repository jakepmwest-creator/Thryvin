import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAwardsStore } from './awards-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://coach-evolution-1.preview.emergentagent.com';

// Storage helpers - Use AsyncStorage for large data (workout plans are >2KB)
const getStorageItem = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error('Storage error:', error);
  }
};

const deleteStorageItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Delete storage error:', error);
  }
};

// Defensive array helper - ensures we always get an array, never undefined/null
const ensureArray = <T>(arr: T[] | undefined | null, context?: string): T[] => {
  if (!Array.isArray(arr)) {
    if (__DEV__) {
      console.warn(`⚠️ [WORKOUT-STORE] Expected array but got ${typeof arr}${context ? ` in ${context}` : ''}`);
    }
    return [];
  }
  return arr;
};

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
  status?: string; // ready, in-progress, completed, rest
  isRestDay?: boolean; // True for rest days
}

// Helper function to determine rest days based on training days per week
function getRestDayPattern(trainingDays: number): number[] {
  // Returns array of day indices (0=Monday, 6=Sunday) that are rest days
  // Logic: Spread workout days evenly, fill the rest with rest days
  switch (trainingDays) {
    case 1:
      return [1, 2, 3, 4, 5, 6]; // Only Mon workout, rest Tue-Sun
    case 2:
      return [1, 2, 4, 5, 6]; // Mon & Thu workout, rest others
    case 3:
      return [1, 3, 5, 6]; // Mon, Wed, Fri workout; Rest: Tue, Thu, Sat, Sun
    case 4:
      return [2, 4, 6]; // Rest: Wed, Fri, Sun
    case 5:
      return [3, 6]; // Rest: Thu, Sun
    case 6:
      return [6]; // Rest: Sun only
    case 7:
      return []; // No rest days
    default:
      return [3, 6]; // Default 5 days: rest on Thu, Sun
  }
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

interface WorkoutBlock {
  id: string;
  name: string;
  type: 'warmup' | 'main' | 'cooldown';
  exercises: Exercise[];
}

interface WorkoutSession {
  workoutId: string;
  startTime: string;
  endTime?: string;
  currentBlockIndex: number;
  currentExerciseIndex: number;
  completedExercises: Set<number>;
  exerciseData: Map<number, {
    completedSets: Array<{
      setIndex: number;
      reps: number;
      weight?: number;
      effort: string; // "Easy" | "Medium" | "Hard"
      note?: string; // User's notes for AI learning
    }>;
    notes?: string;
  }>;
}

interface WorkoutStore {
  currentWorkout: Workout | null; // Single source of truth
  todayWorkout: Workout | null; // Deprecated, use currentWorkout
  weekWorkouts: Workout[];
  completedWorkouts: Workout[];
  stats: WorkoutStats | null;
  personalBests: PersonalBest[];
  activeSession: WorkoutSession | null;
  isLoading: boolean;
  error: string | null;
  generateTodayWorkout: () => Promise<void>;
  fetchTodayWorkout: () => Promise<void>;
  fetchWeekWorkouts: () => Promise<void>;
  fetchCompletedWorkouts: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchPersonalBests: () => Promise<void>;
  updatePersonalBest: (exerciseName: string, weight: number, reps: number, date?: string) => Promise<void>;
  startWorkoutSession: (workoutId: string) => void;
  completeSet: (exerciseIndex: number, setIndex: number, reps: number, weight: number | undefined, effort: string, note?: string) => void;
  addExerciseNote: (exerciseIndex: number, note: string) => void;
  navigateToExercise: (exerciseIndex: number) => void;
  finishWorkoutSession: (actualDurationMinutes?: number) => Promise<void>;
  completeWorkout: (workoutId: string, exercises: any[], actualDurationMinutes?: number) => Promise<void>;
  logManualWorkout: (workoutData: Partial<Workout>) => Promise<void>;
  clearError: () => void;
  forceRegenerateWeek: () => Promise<void>;
  checkAndGenerateMoreWeeks: () => Promise<void>;
  resetProgram: () => Promise<void>;
  getAllWeekWorkouts: () => Workout[];
  swapWorkoutDays: (fromIndex: number, toIndex: number) => Promise<void>;
  resetAllData: () => Promise<void>; // Clear all data for new user
  setCurrentWorkout: (workout: Workout) => void;
  setWeekWorkouts: (workouts: Workout[]) => void;
  updateWorkoutInWeek: (dayIndex: number, updatedWorkout: Workout) => Promise<void>;
  addWorkoutToDate: (targetDate: Date, workoutType: string, duration?: number) => Promise<Workout | null>;
  removeWorkoutFromDate: (targetDate: Date) => Promise<boolean>;
  replaceRestDayWithWorkout: (restDayDate: Date, workoutType: string, duration?: number) => Promise<Workout | null>;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  // Initial State
  currentWorkout: null,
  todayWorkout: null,
  weekWorkouts: [],
  completedWorkouts: [],
  stats: null,
  personalBests: [],
  activeSession: null,
  isLoading: false,
  error: null,

  // Fetch today's AI-generated workout (with caching)
  fetchTodayWorkout: async () => {
    set({ isLoading: true, error: null });
    try {
      const storedUser = await getStorageItem('auth_user');
      if (!storedUser) {
        throw new Error('User not authenticated');
      }
      
      const user = JSON.parse(storedUser);
      const today = new Date().toDateString();
      
      // Check if we have today's workout cached
      const cachedWorkout = await getStorageItem('today_workout');
      const cachedDate = await getStorageItem('today_workout_date');
      
      if (cachedWorkout && cachedDate === today) {
        console.log('✅ [WORKOUT] Using cached today\'s workout');
        const workout = JSON.parse(cachedWorkout);
        set({ todayWorkout: workout, currentWorkout: workout, isLoading: false });
        return;
      }
      
      const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
      const convertedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      // Call AI workout generation API
      console.log('🤖 [WORKOUT] Calling AI API...');
      console.log(`🤖 [WORKOUT] API BASE URL: ${API_BASE_URL}`);
      console.log(`🤖 [WORKOUT] Full URL: ${API_BASE_URL}/api/workouts/generate`);
      console.log(`🤖 [WORKOUT] Day: ${dayOfWeek} (JS) -> ${convertedDay} (Backend)`);
      console.log(`🤖 [WORKOUT] User profile:`, {
        goals: user.fitnessGoals || [user.goal],
        experience: user.experience,
        duration: user.sessionDuration,
      });
      
      // Get advanced questionnaire data if available (stored as 'advancedQuestionnaire')
      const advancedQuestionnaireRaw = await getStorageItem('advancedQuestionnaire');
      const advancedQuestionnaire = advancedQuestionnaireRaw ? JSON.parse(advancedQuestionnaireRaw) : null;
      
      if (advancedQuestionnaire) {
        console.log('📚 [WORKOUT] Advanced questionnaire found:', Object.keys(advancedQuestionnaire));
      }
      
      const response = await fetch(`${API_BASE_URL}/api/workouts/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session auth
        body: JSON.stringify({
          userProfile: {
            userId: user.id, // Include user ID for comprehensive context
            fitnessGoals: user.fitnessGoals || [user.goal],
            goal: user.goal,
            experience: user.experience,
            trainingType: user.trainingType,
            sessionDuration: user.sessionDuration,
            trainingDays: user.trainingDays,
            equipment: user.equipment || [],
            injuries: user.injuries || [],
            advancedQuestionnaire: advancedQuestionnaire, // Include advanced questionnaire
          },
          dayOfWeek: convertedDay, // Convert to 0=Monday
        }),
      });
      
      console.log('🔍 [WORKOUT] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [WORKOUT] API Error Response:');
        console.error('   Status:', response.status);
        console.error('   Body:', errorText);
        console.error('   URL:', `${API_BASE_URL}/api/workouts/generate`);
        throw new Error(`API Error ${response.status}: ${errorText.substring(0, 100)}`);
      }
      
      const aiWorkout = await response.json();
      console.log('✅ [WORKOUT] AI workout generated:', aiWorkout.title);
      console.log('✅ [WORKOUT] Exercises:', aiWorkout.exercises.length);
      console.log('✅ [WORKOUT] With videos:', aiWorkout.exercises.filter((e: any) => e.videoUrl).length);
      
      // Format for app
      const workout: Workout = {
        id: `workout_${Date.now()}`,
        title: aiWorkout.title,
        type: aiWorkout.type,
        difficulty: aiWorkout.difficulty,
        duration: aiWorkout.duration,
        date: new Date().toISOString(),
        exercises: aiWorkout.exercises,
        overview: aiWorkout.overview,
        targetMuscles: aiWorkout.targetMuscles,
        caloriesBurn: aiWorkout.caloriesBurn,
        exerciseList: aiWorkout.exercises, // For compatibility
      };
      
      // Cache the workout
      await setStorageItem('today_workout', JSON.stringify(workout));
      await setStorageItem('today_workout_date', today);
      
      set({ todayWorkout: workout, currentWorkout: workout, isLoading: false });
      console.log('✅ [WORKOUT] Store updated with:', workout.title, workout.exercises.length, 'exercises');
    } catch (error) {
      console.error('❌❌❌ [WORKOUT] FULL ERROR DETAILS:');
      console.error('   Type:', error instanceof Error ? 'Error' : typeof error);
      console.error('   Message:', error instanceof Error ? error.message : String(error));
      console.error('   Stack:', error instanceof Error ? error.stack : 'No stack');
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('   🌐 NETWORK ERROR: Cannot reach backend');
        console.error('   Backend URL:', API_BASE_URL);
        console.error('   Are you on the same network? Is backend running?');
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to load workout';
      set({ 
        error: `ERROR: ${errorMessage}. Check console for details.`,
        isLoading: false 
      });
    }
  },

  // Fetch 3 weeks of workouts (21 days, AI-generated with caching)
  fetchWeekWorkouts: async () => {
    // Prevent double generation with timeout-based lock (5 minute timeout)
    const lockData = await getStorageItem('workout_generation_lock');
    if (lockData) {
      try {
        const lock = JSON.parse(lockData);
        const lockAge = Date.now() - lock.timestamp;
        const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes
        
        if (lockAge < LOCK_TIMEOUT) {
          console.log('⏳ [3-WEEK] Generation already in progress (started', Math.round(lockAge/1000), 'seconds ago), skipping...');
          return;
        } else {
          console.log('🔓 [3-WEEK] Clearing stale lock (', Math.round(lockAge/60000), 'minutes old)');
          await deleteStorageItem('workout_generation_lock');
        }
      } catch {
        // Invalid lock data, clear it
        await deleteStorageItem('workout_generation_lock');
      }
    }
    
    // Also clear legacy lock key
    await deleteStorageItem('workout_generation_in_progress');
    
    set({ isLoading: true, error: null });
    
    try {
      // Set lock with timestamp
      await setStorageItem('workout_generation_lock', JSON.stringify({ timestamp: Date.now() }));
      
      const storedUser = await getStorageItem('auth_user');
      if (!storedUser) {
        await deleteStorageItem('workout_generation_lock');
        throw new Error('User not authenticated');
      }
      
      const user = JSON.parse(storedUser);
      
      // Check if we have cached week workouts
      // Version key to invalidate cache - bump this to force regeneration
      const CACHE_VERSION = 'v5_fixed_generatedWorkouts_ref';
      const cachedWeek = await getStorageItem('week_workouts');
      const cachedWeekDate = await getStorageItem('week_workouts_date');
      const cachedVersion = await getStorageItem('week_workouts_version');
      const today = new Date();
      const mondayOfThisWeek = new Date(today);
      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      mondayOfThisWeek.setDate(today.getDate() + mondayOffset);
      const weekKey = mondayOfThisWeek.toDateString();
      
      // Force regeneration if cache version is outdated
      if (cachedVersion !== CACHE_VERSION) {
        console.log('🔄 [3-WEEK] Cache version outdated, regenerating 3 weeks of workouts...');
      } else if (cachedWeek && cachedWeekDate === weekKey) {
        console.log('✅ [3-WEEK] Using cached 3-week workouts');
        try {
          const parsedWorkouts = JSON.parse(cachedWeek);
          const workouts = ensureArray<Workout>(parsedWorkouts, 'cached workouts parse');
          if (workouts.length >= 21) {
            set({ weekWorkouts: workouts, isLoading: false });
            await deleteStorageItem('workout_generation_lock');
            return;
          } else {
            console.log('⚠️ [3-WEEK] Cached workouts incomplete:', workouts.length, 'of 21');
          }
        } catch (parseError) {
          console.warn('⚠️ [3-WEEK] Failed to parse cached workouts, regenerating...');
        }
      } else {
        console.log('⚠️ [3-WEEK] Cache miss - cachedWeek:', !!cachedWeek, 'dateMatch:', cachedWeekDate === weekKey);
        console.log('   Expected week key:', weekKey, 'Got:', cachedWeekDate);
      }
      
      console.log('🤖 [3-WEEK] Generating 3 weeks of workouts with AI...');
      
      // Generate workouts for 3 weeks (21 days) with rest days
      try {
        // Get advanced questionnaire data if available (optional - new users may skip this)
        let advancedQuestionnaire = null;
        try {
          const advancedQuestionnaireRaw = await getStorageItem('advancedQuestionnaire');
          advancedQuestionnaire = advancedQuestionnaireRaw ? JSON.parse(advancedQuestionnaireRaw) : null;
        } catch (parseErr) {
          console.log('📝 [3-WEEK] No advanced questionnaire data (new user flow)');
        }
        
        // Build user profile with sensible defaults for new users
        const userProfile = {
          fitnessGoals: ensureArray(user.fitnessGoals, 'fitnessGoals').length > 0 
            ? user.fitnessGoals 
            : (user.goal ? [user.goal] : ['general fitness']),
          goal: user.goal || 'general fitness',
          experience: user.experience || 'intermediate',
          trainingType: user.trainingType || 'strength',
          sessionDuration: user.sessionDuration || 45,
          trainingDays: user.trainingDays || 5, // Default 5 days/week
          equipment: ensureArray(user.equipment, 'equipment'),
          injuries: user.injuries || null,
          userId: user.id,
          advancedQuestionnaire: advancedQuestionnaire, // null if skipped - AI will use defaults
          preferredTrainingDays: ensureArray(user.preferredTrainingDays, 'preferredTrainingDays'),
        };
        
        // Calculate all 21 dates (3 weeks starting from this Monday)
        const allDates: Date[] = [];
        for (let i = 0; i < 21; i++) {
          const date = new Date(mondayOfThisWeek);
          date.setDate(mondayOfThisWeek.getDate() + i);
          allDates.push(date);
        }
        
        console.log('📅 [3-WEEK] Generating for 21 days starting:', mondayOfThisWeek.toDateString());
        
        // Get training schedule type and specific dates from onboarding
        const onboardingData = user.onboardingResponses ? 
          (typeof user.onboardingResponses === 'string' ? JSON.parse(user.onboardingResponses) : user.onboardingResponses) : {};
        const trainingScheduleType = onboardingData.trainingSchedule || 'flexible';
        const specificDatesFromOnboarding = onboardingData.specificDates || [];
        
        // Convert specific dates to a Set for quick lookup
        const specificDatesSet = new Set(specificDatesFromOnboarding.map((d: string) => d.split('T')[0])); // Remove time component
        
        console.log(`📅 [3-WEEK] Training schedule type: ${trainingScheduleType}`);
        if (trainingScheduleType === 'depends' && specificDatesSet.size > 0) {
          console.log(`📅 [3-WEEK] Using SPECIFIC DATES from "It Depends" mode:`, Array.from(specificDatesSet));
        }
        
        // Determine rest days based on schedule type
        const trainingDaysPerWeek = parseInt(String(userProfile.trainingDays)) || 5;
        let restDayPattern: number[] = [];
        
        // For 'specific' mode - use selected day names
        const preferredDays = user.preferredTrainingDays || user.selectedDays || onboardingData.selectedDays;
        if (trainingScheduleType === 'specific' && preferredDays && Array.isArray(preferredDays) && preferredDays.length > 0) {
          const dayNameToIndex: Record<string, number> = { 'mon': 0, 'tue': 1, 'wed': 2, 'thu': 3, 'fri': 4, 'sat': 5, 'sun': 6 };
          const trainingDayIndices = preferredDays.map((d: string) => dayNameToIndex[d.toLowerCase()]).filter((i: number) => i !== undefined);
          restDayPattern = [0, 1, 2, 3, 4, 5, 6].filter(i => !trainingDayIndices.includes(i));
          console.log(`📅 [3-WEEK] Using SPECIFIC day pattern: ${preferredDays.join(', ')}. Rest days:`, restDayPattern);
        } else if (trainingScheduleType !== 'depends') {
          // For 'flexible' mode - use generic pattern
          restDayPattern = getRestDayPattern(trainingDaysPerWeek);
          console.log(`📅 [3-WEEK] Using FLEXIBLE pattern - ${trainingDaysPerWeek} days/week. Rest days:`, restDayPattern);
        }
        // Note: For 'depends' mode, we check specific dates directly in the loop below
        
        // Generate workout for each day
        const weekWorkouts: Workout[] = [];
        let workoutDayCounter = 0;
        
        for (let i = 0; i < 21; i++) {
          const date = allDates[i];
          const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          const actualDayOfWeek = date.getDay(); // JavaScript: 0=Sunday, 1=Monday, ..., 6=Saturday
          
          // Determine if this is a rest day
          let isRestDay = false;
          if (trainingScheduleType === 'depends') {
            // For "It Depends" mode - check if this specific date was selected
            isRestDay = !specificDatesSet.has(dateStr);
            if (isRestDay) {
              console.log(`😴 [3-WEEK] Day ${i + 1}/21 (${dateStr}): REST - not in selected dates`);
            }
          } else {
            // For other modes - use the pattern (convert actualDayOfWeek to 0=Mon index for pattern)
            const patternIndex = actualDayOfWeek === 0 ? 6 : actualDayOfWeek - 1;
            isRestDay = restDayPattern.includes(patternIndex);
          }
          
          if (isRestDay) {
            // Create rest day entry
            weekWorkouts.push({
              id: `rest_${date.getTime()}`,
              title: 'Rest Day',
              type: 'Rest',
              difficulty: 'rest',
              duration: 0,
              date: date.toISOString(),
              exercises: [],
              overview: 'Take time to recover. Stay hydrated and get good sleep!',
              targetMuscles: '',
              caloriesBurn: 0,
              exerciseList: [],
              status: 'rest',
              isRestDay: true,
            });
            console.log(`😴 [3-WEEK] Day ${i + 1}/21: Rest day`);
          } else {
            // Generate workout with retry logic
            console.log(`🤖 [3-WEEK] Generating day ${i + 1}/21 (workout #${workoutDayCounter + 1})...`);
            
            const weekNumber = Math.floor(i / 7) + 1; // 1, 2, or 3
            
            // Collect recent exercises from generated workouts to avoid repetition
            const recentExercises = (weekWorkouts || [])
              .filter(w => !w.isRestDay) // Only look at actual workouts, not rest days
              .slice(-3) // Last 3 workouts
              .flatMap(w => w.exercises?.map((e: any) => e.name) || [])
              .filter(Boolean);
            
            let workout = null;
            let retries = 3;
            let lastError = null;
            
            while (retries > 0 && !workout) {
              try {
                const response = await fetch(`${API_BASE_URL}/api/workouts/generate`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true',
                  },
                  body: JSON.stringify({
                    userProfile,
                    dayOfWeek: actualDayOfWeek, // Use actual day of week (0=Sun, 1=Mon, etc.)
                    weekNumber,
                    recentExercises, // Pass recent exercises to avoid repetition
                  }),
                });
                
                if (!response.ok) {
                  const text = await response.text();
                  lastError = `API Error ${response.status}: ${text.substring(0, 100)}`;
                  retries--;
                  if (retries > 0) {
                    console.log(`⚠️ [3-WEEK] Retry ${3 - retries}/3 for day ${i + 1}...`);
                    await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds before retry
                  }
                  continue;
                }
                
                workout = await response.json();
              } catch (fetchError: any) {
                lastError = fetchError.message;
                retries--;
                if (retries > 0) {
                  console.log(`⚠️ [3-WEEK] Network retry ${3 - retries}/3 for day ${i + 1}...`);
                  await new Promise(r => setTimeout(r, 2000));
                }
              }
            }
            
            if (!workout) {
              // If we have at least 7 days, save partial progress and continue
              if (weekWorkouts.length >= 7) {
                console.log(`⚠️ [3-WEEK] Failed day ${i + 1} after 3 retries, saving ${weekWorkouts.length} days and stopping`);
                // Save partial progress
                await setStorageItem('week_workouts', JSON.stringify(weekWorkouts));
                await setStorageItem('week_workouts_date', weekKey);
                await setStorageItem('week_workouts_version', CACHE_VERSION);
                // Release lock on partial save
                await deleteStorageItem('workout_generation_lock');
                set({ weekWorkouts, isLoading: false, error: `Generated ${weekWorkouts.length}/21 days. ${lastError || 'Some days failed to generate.'}` });
                return;
              }
              throw new Error(`Failed to generate day ${i + 1}: ${lastError}`);
            }
            
            weekWorkouts.push({
              id: `workout_${date.getTime()}`,
              title: workout.title,
              type: workout.type,
              difficulty: workout.difficulty,
              duration: workout.duration,
              date: date.toISOString(),
              exercises: workout.exercises,
              overview: workout.overview,
              targetMuscles: workout.targetMuscles,
              caloriesBurn: workout.caloriesBurn,
              exerciseList: workout.exercises,
              status: 'ready',
            });
            
            workoutDayCounter++;
            console.log(`✅ [3-WEEK] Day ${i + 1}/21 complete: ${workout.title}`);
            
            // Save progress every 7 days to prevent total loss
            if (weekWorkouts.length % 7 === 0) {
              console.log(`💾 [3-WEEK] Saving checkpoint at ${weekWorkouts.length} days...`);
              await setStorageItem('week_workouts', JSON.stringify(weekWorkouts));
            }
          }
        }
        
        console.log(`✅ [3-WEEK] Generated ${weekWorkouts.length} days (${weekWorkouts.filter(w => !w.isRestDay).length} workouts, ${weekWorkouts.filter(w => w.isRestDay).length} rest days)`);
        
        // Cache the workouts with version
        await setStorageItem('week_workouts', JSON.stringify(weekWorkouts));
        await setStorageItem('week_workouts_date', weekKey);
        await setStorageItem('week_workouts_version', CACHE_VERSION);
        
        // Release lock
        await deleteStorageItem('workout_generation_lock');
        set({ weekWorkouts, isLoading: false, error: null });
        
      } catch (error: any) {
        console.error('❌ [WEEK] Generation failed:', error);
        await deleteStorageItem('workout_generation_lock');
        // In the catch block, we don't have access to local weekWorkouts - set empty state
        set({ 
          error: error.message || 'Failed to generate workouts',
          isLoading: false,
          weekWorkouts: [],
        });
      }
    } catch (error) {
      console.error('Error fetching week workouts:', error);
      await deleteStorageItem('workout_generation_lock');
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load workouts',
        isLoading: false,
        weekWorkouts: [],
      });
    }
  },

  // Fetch completed workouts
  fetchCompletedWorkouts: async () => {
    try {
      const stored = await getStorageItem('completed_workouts');
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
      const storedUser = await getStorageItem('auth_user');
      
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const completedWorkouts = get().completedWorkouts;
        const weekWorkouts = get().weekWorkouts;
        
        // Combine completed workouts from both sources
        const allCompleted = [
          ...completedWorkouts,
          ...weekWorkouts.filter(w => w.completed && !w.isRestDay)
        ];
        
        // Remove duplicates by ID
        const uniqueCompleted = allCompleted.filter((workout, index, self) =>
          index === self.findIndex(w => w.id === workout.id)
        );
        
        // Calculate this week's workouts
        const now = new Date();
        const startOfThisWeek = new Date(now);
        startOfThisWeek.setDate(now.getDate() - now.getDay());
        startOfThisWeek.setHours(0, 0, 0, 0);
        
        const thisWeek = uniqueCompleted.filter(w => {
          const workoutDate = new Date(w.completedAt || w.date);
          return workoutDate >= startOfThisWeek;
        });
        
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
        
        // Use the user's PLAN training days (from profile) - this is their weekly goal
        const weeklyGoal = parseInt(user.trainingDays) || 3;
        const sessionDuration = parseInt(user.sessionDuration) || 45;
        
        // Calculate weekly minutes from completed workouts THIS WEEK only
        const weeklyMinutes = thisWeek.reduce((sum, w) => sum + (w.duration || sessionDuration), 0);
        const weeklyMinutesGoal = sessionDuration * weeklyGoal;
        const totalMinutes = uniqueCompleted.reduce((sum, w) => sum + (w.duration || sessionDuration), 0);
        
        const stats: WorkoutStats = {
          totalWorkouts: uniqueCompleted.length,
          weeklyWorkouts: thisWeek.length,
          weeklyGoal,
          weeklyMinutes,
          weeklyMinutesGoal,
          currentStreak,
          longestStreak: Math.max(currentStreak, uniqueCompleted.length > 0 ? Math.min(uniqueCompleted.length, 30) : 0),
          totalMinutes,
          level: uniqueCompleted.length >= 50 ? 'Gold' : uniqueCompleted.length >= 20 ? 'Silver' : 'Bronze',
          xpPoints: uniqueCompleted.length * 100,
        };
        
        // Persist stats
        await setStorageItem('workout_stats', JSON.stringify(stats));
        set({ stats });
        console.log('📊 Stats calculated:', stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  },

  // Fetch personal bests
  fetchPersonalBests: async () => {
    try {
      const stored = await getStorageItem('personal_bests');
      const personalBests = stored ? JSON.parse(stored) : [];
      set({ personalBests });
      console.log('Personal bests loaded:', personalBests.length);
    } catch (error) {
      console.error('Error fetching personal bests:', error);
    }
  },

  // Complete a workout
  completeWorkout: async (workoutId: string, exercises: any[], actualDurationMinutes?: number) => {
    try {
      const { weekWorkouts, currentWorkout, todayWorkout } = get();
      const workout = currentWorkout || todayWorkout;
      if (!workout) return;
      
      const completedWorkout: Workout = {
        ...workout,
        completed: true,
        completedAt: new Date().toISOString(),
        exercises: exercises,
        duration: actualDurationMinutes || workout.duration, // Use actual duration if provided
      };
      
      // Save to completed workouts
      const completedWorkouts = [...get().completedWorkouts, completedWorkout];
      await setStorageItem('completed_workouts', JSON.stringify(completedWorkouts));
      set({ completedWorkouts });
      
      // Update the workout in weekWorkouts to show completion in calendar
      const updatedWeekWorkouts = weekWorkouts.map(w => 
        w.id === workoutId ? { ...w, completed: true, completedAt: completedWorkout.completedAt } : w
      );
      await setStorageItem('week_workouts', JSON.stringify(updatedWeekWorkouts));
      set({ weekWorkouts: updatedWeekWorkouts });
      
      // Update personal bests
      await updatePersonalBests(exercises);
      
      // SYNC completed workout to backend for stats tracking
      try {
        await fetch(`${API_BASE_URL}/api/workouts/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Bypass-Tunnel-Reminder': 'true',
          },
          credentials: 'include',
          body: JSON.stringify({
            workoutId: completedWorkout.id,
            title: completedWorkout.title,
            type: completedWorkout.type,
            duration: completedWorkout.duration,
            completedAt: completedWorkout.completedAt,
            exercises: exercises.map(ex => ({
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
            })),
          }),
        });
        console.log('📊 [WORKOUT] Synced to backend for stats tracking');
      } catch (syncError) {
        console.log('⚠️ [WORKOUT] Could not sync to backend:', syncError);
        // Non-critical - stats will be stale but workout is still saved locally
      }
      
      // Log performance to backend for AI learning
      try {
        const storedUser = await getStorageItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          
          // Format exercises for AI learning (notes-based feedback)
          const performanceData = exercises.map(ex => ({
            exerciseName: ex.name,
            weight: ex.weight,
            reps: ex.reps,
            sets: ex.sets,
            notes: ex.notes, // AI will learn from user notes
          }));
          
          await fetch(`${API_BASE_URL}/api/workouts/log-performance`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Bypass-Tunnel-Reminder': 'true',
            },
            body: JSON.stringify({
              userId: user.id,
              workoutId,
              exercises: performanceData,
              duration: workout.duration,
            }),
          });
          
          console.log('📊 [WORKOUT] Performance logged for AI learning');
        }
      } catch (logError) {
        console.log('⚠️ [WORKOUT] Could not log performance:', logError);
        // Don't throw - this is non-critical
      }
      
      // Refresh stats
      await get().fetchStats();
      await get().fetchPersonalBests();
      
      // Check if we need to generate more weeks (rolling generation)
      await get().checkAndGenerateMoreWeeks();
      
      console.log('✅ [WORKOUT] Completed:', workoutId, 'at', completedWorkout.completedAt);
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
      await setStorageItem('completed_workouts', JSON.stringify(completedWorkouts));
      set({ completedWorkouts });
      
      // Update stats
      await get().fetchStats();
      
      console.log('Manual workout logged:', manualWorkout.title);
    } catch (error) {
      console.error('Error logging manual workout:', error);
      throw error;
    }
  },

  // Generate today's workout
  generateTodayWorkout: async () => {
    await get().fetchTodayWorkout();
    const todayWorkout = get().todayWorkout;
    if (todayWorkout) {
      set({ currentWorkout: todayWorkout });
    }
  },

  // Update personal best
  updatePersonalBest: async (exerciseName: string, weight: number, reps: number, date?: string) => {
    try {
      const stored = await getStorageItem('personal_bests');
      const personalBests: PersonalBest[] = stored ? JSON.parse(stored) : [];
      
      const existingBest = personalBests.find(pb => pb.exercise === exerciseName);
      
      if (!existingBest || weight > existingBest.value) {
        const newBest: PersonalBest = {
          exercise: exerciseName,
          value: weight,
          unit: 'lbs',
          date: date || new Date().toISOString(),
        };
        
        if (existingBest) {
          const index = personalBests.indexOf(existingBest);
          personalBests[index] = newBest;
        } else {
          personalBests.push(newBest);
        }
        
        await setStorageItem('personal_bests', JSON.stringify(personalBests));
        set({ personalBests });
      }
    } catch (error) {
      console.error('Error updating personal best:', error);
    }
  },

  // Start workout session
  startWorkoutSession: (workoutId: string) => {
    const workout = get().currentWorkout || get().todayWorkout;
    if (!workout || workout.id !== workoutId) return;

    const session: WorkoutSession = {
      workoutId,
      startTime: new Date().toISOString(),
      currentBlockIndex: 0,
      currentExerciseIndex: 0,
      completedExercises: new Set(),
      exerciseData: new Map(),
    };

    set({ activeSession: session });
  },

  // Complete a set
  completeSet: (exerciseIndex: number, setIndex: number, reps: number, weight: number | undefined, effort: string, note?: string) => {
    const session = get().activeSession;
    if (!session) return;

    const exerciseData = session.exerciseData.get(exerciseIndex) || { completedSets: [] };
    
    exerciseData.completedSets.push({
      setIndex,
      reps,
      weight,
      effort,
      note, // Add note to the set
    });

    session.exerciseData.set(exerciseIndex, exerciseData);
    
    // Check if exercise is complete (all sets done)
    const workout = get().currentWorkout;
    if (workout && workout.exercises[exerciseIndex]) {
      const exercise = workout.exercises[exerciseIndex];
      const targetSets = exercise.sets || 3;
      if (exerciseData.completedSets.length >= targetSets) {
        session.completedExercises.add(exerciseIndex);
      }
    }
    
    set({ activeSession: { ...session } });
  },

  // Add exercise note
  addExerciseNote: (exerciseIndex: number, note: string) => {
    const session = get().activeSession;
    if (!session) return;

    const exerciseData = session.exerciseData.get(exerciseIndex) || { completedSets: [] };
    exerciseData.notes = note;

    session.exerciseData.set(exerciseIndex, exerciseData);
    set({ activeSession: { ...session } });
  },

  // Navigate to exercise
  navigateToExercise: (exerciseIndex: number) => {
    const session = get().activeSession;
    if (!session) return;

    set({ 
      activeSession: { 
        ...session, 
        currentExerciseIndex: exerciseIndex 
      } 
    });
  },

  // Finish workout session
  finishWorkoutSession: async (actualDurationMinutes?: number) => {
    const session = get().activeSession;
    const workout = get().currentWorkout || get().todayWorkout;
    
    if (!session || !workout) return;

    try {
      // Convert session data to exercise format for completion
      const exercises = workout.exercises.map((exercise, index) => {
        const exerciseData = session.exerciseData.get(index);
        // Combine all notes from completed sets
        const setNotes = exerciseData?.completedSets
          ?.filter(s => s.note)
          ?.map(s => `Set ${s.setIndex + 1}: ${s.note}`)
          ?.join('; ');
        
        return {
          ...exercise,
          completedSets: exerciseData?.completedSets || [],
          notes: setNotes || exerciseData?.notes, // Include notes from sets for AI learning
        };
      });

      // Complete the workout with actual duration
      await get().completeWorkout(workout.id, exercises, actualDurationMinutes);

      // Immediately fetch updated stats to refresh rings
      await get().fetchStats();
      
      // Update badge progress after workout completion
      await updateBadgesAfterWorkout();
      
      // Clear active session
      set({ activeSession: null });
    } catch (error) {
      console.error('Error finishing workout session:', error);
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  
  // Reset all workout data for a fresh start (new user)
  resetAllData: async () => {
    console.log('🔄 [WORKOUT] Resetting all data for new user...');
    set({ isLoading: true });
    
    try {
      // Clear all workout storage using AsyncStorage
      await deleteStorageItem('workout_generation_lock'); // Clear locks first
      await deleteStorageItem('workout_generation_in_progress'); // Clear legacy lock
      await deleteStorageItem('week_workouts');
      await deleteStorageItem('week_workouts_date');
      await deleteStorageItem('week_workouts_version');
      await deleteStorageItem('today_workout');
      await deleteStorageItem('today_workout_date');
      await deleteStorageItem('completed_workouts');
      await deleteStorageItem('future_weeks');
      await deleteStorageItem('workout_stats');
      await deleteStorageItem('personal_bests');
      
      // Reset the store state
      set({
        currentWorkout: null,
        todayWorkout: null,
        weekWorkouts: [],
        completedWorkouts: [],
        stats: null,
        personalBests: [],
        activeSession: null,
        isLoading: false,
        error: null,
      });
      
      // Reset awards
      useAwardsStore.getState().resetAllAwards();
      
      console.log('✅ [WORKOUT] All data reset successfully');
    } catch (error) {
      console.error('❌ [WORKOUT] Error resetting data:', error);
      set({ isLoading: false });
    }
  },
  
  // Set the current workout (for viewing/starting)
  setCurrentWorkout: (workout: Workout) => {
    set({ currentWorkout: workout });
    console.log('✅ [WORKOUT] Set currentWorkout:', workout.title);
  },
  
  // Set week workouts (for AI Coach modifications)
  setWeekWorkouts: (workouts: Workout[]) => {
    set({ weekWorkouts: workouts });
    console.log('✅ [WORKOUT] Updated weekWorkouts');
  },
  
  // Update a specific workout in the week
  updateWorkoutInWeek: async (dayIndex: number, updatedWorkout: Workout) => {
    const { weekWorkouts, currentWorkout } = get();
    const newWeekWorkouts = [...weekWorkouts];
    newWeekWorkouts[dayIndex] = updatedWorkout;
    
    // Save to storage
    await setStorageItem('week_workouts', JSON.stringify(newWeekWorkouts));
    
    // Update state
    set({ weekWorkouts: newWeekWorkouts });
    
    // If it's the current workout (being viewed/edited), update that too
    if (currentWorkout && currentWorkout.id === updatedWorkout.id) {
      set({ currentWorkout: updatedWorkout });
      console.log('✅ [WORKOUT] Updated currentWorkout');
    }
    
    // If it's today's workout, update that too
    const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    if (dayIndex === todayIndex) {
      set({ todayWorkout: updatedWorkout, currentWorkout: updatedWorkout });
      await setStorageItem('today_workout', JSON.stringify(updatedWorkout));
      console.log('✅ [WORKOUT] Updated todayWorkout and currentWorkout');
    }
    
    console.log('✅ [WORKOUT] Updated workout for day', dayIndex);
  },
  
  // Force regenerate week workouts (for debugging/testing)
  forceRegenerateWeek: async () => {
    console.log('🔄 [3-WEEK] Force clearing cache and locks...');
    await deleteStorageItem('workout_generation_lock'); // Clear any stuck locks
    await deleteStorageItem('workout_generation_in_progress'); // Clear legacy lock
    await setStorageItem('week_workouts', '[]'); // Clear workouts
    await setStorageItem('week_workouts_date', ''); // Clear date
    await setStorageItem('week_workouts_version', ''); // Clear version
    await setStorageItem('today_workout', ''); // Clear today
    await setStorageItem('today_workout_date', ''); // Clear today date
    set({ weekWorkouts: [], todayWorkout: null, isLoading: false, error: null });
    console.log('🔄 [3-WEEK] Starting generation...');
    await get().fetchWeekWorkouts();
    await get().fetchTodayWorkout();
  },
  
  // Rolling generation: When a workout is completed, add a new day 3 weeks ahead
  checkAndGenerateMoreWeeks: async () => {
    try {
      const { weekWorkouts } = get();
      if (weekWorkouts.length === 0) return;
      
      // Count completed non-rest workouts
      const completedCount = weekWorkouts.filter(w => w.completed && !w.isRestDay).length;
      
      console.log(`📊 [ROLLING] ${completedCount} workouts completed`);
      
      // Generate a new day to maintain 3 weeks ahead
      // Find the last date in our schedule
      const lastWorkout = weekWorkouts[weekWorkouts.length - 1];
      const lastDate = new Date(lastWorkout.date);
      
      // Calculate the next day
      const nextDate = new Date(lastDate);
      nextDate.setDate(lastDate.getDate() + 1);
      
      // Check if we already have this day
      const existingDay = weekWorkouts.find(w => {
        const wDate = new Date(w.date);
        return wDate.toDateString() === nextDate.toDateString();
      });
      
      if (!existingDay) {
        console.log(`🔄 [ROLLING] Generating new day: ${nextDate.toDateString()}`);
        await generateSingleDay(nextDate, weekWorkouts.length);
      }
    } catch (error) {
      console.error('Error in rolling generation:', error);
    }
  },
  
  // Reset the entire workout program
  resetProgram: async () => {
    console.log('🔄 [RESET] Clearing all workout data...');
    
    // Clear all workout-related storage
    await setStorageItem('week_workouts', '[]');
    await setStorageItem('week_workouts_date', '');
    await setStorageItem('week_workouts_version', '');
    await setStorageItem('today_workout', '');
    await setStorageItem('today_workout_date', '');
    await setStorageItem('future_weeks', '[]');
    await setStorageItem('completed_workouts', '[]');
    
    // Reset state
    set({ 
      weekWorkouts: [], 
      todayWorkout: null, 
      currentWorkout: null,
      completedWorkouts: [],
      activeSession: null,
    });
    
    console.log('🔄 [RESET] Generating fresh program...');
    
    // Generate fresh week
    await get().fetchWeekWorkouts();
    await get().fetchTodayWorkout();
    
    console.log('✅ [RESET] Program reset complete!');
  },
  
  // Get all available week workouts (current + future)
  getAllWeekWorkouts: () => {
    return get().weekWorkouts;
  },
  
  swapWorkoutDays: async (fromIndex: number, toIndex: number) => {
    const { weekWorkouts } = get();
    
    if (fromIndex < 0 || fromIndex >= weekWorkouts.length || 
        toIndex < 0 || toIndex >= weekWorkouts.length) {
      console.log('❌ [SWAP] Invalid indices:', fromIndex, toIndex);
      return;
    }
    
    // Create a copy of weekWorkouts
    const updatedWorkouts = [...weekWorkouts];
    
    // Get the workouts to swap
    const fromWorkout = { ...updatedWorkouts[fromIndex] };
    const toWorkout = { ...updatedWorkouts[toIndex] };
    
    // Swap the dates but keep the workout content
    const fromDate = fromWorkout.date;
    const toDate = toWorkout.date;
    
    fromWorkout.date = toDate;
    toWorkout.date = fromDate;
    
    // Swap in the array
    updatedWorkouts[fromIndex] = toWorkout;
    updatedWorkouts[toIndex] = fromWorkout;
    
    // Update state
    set({ weekWorkouts: updatedWorkouts });
    
    // Persist to storage
    try {
      await setStorageItem('week_workouts', JSON.stringify(updatedWorkouts));
      console.log('✅ [SWAP] Swapped workouts between indices', fromIndex, 'and', toIndex);
    } catch (error) {
      console.error('❌ [SWAP] Failed to persist swapped workouts:', error);
    }
  },
  
  // Add a new workout to a specific date (AI Coach can add workouts)
  addWorkoutToDate: async (targetDate: Date, workoutType: string, duration: number = 30) => {
    const { weekWorkouts } = get();
    console.log('➕ [ADD] Adding workout for', targetDate.toDateString(), 'Type:', workoutType);
    
    try {
      // Create a basic workout structure
      const workoutTemplates: Record<string, any> = {
        'yoga': {
          title: `${duration}-Min Yoga Flow`,
          type: 'Flexibility',
          difficulty: 'Beginner',
          exercises: [
            { id: 'y1', name: 'Cat-Cow Stretch', sets: 3, reps: '10 breaths', restTime: 30, category: 'warmup' },
            { id: 'y2', name: 'Downward Dog', sets: 3, reps: '5 breaths', restTime: 30, category: 'main' },
            { id: 'y3', name: 'Warrior II', sets: 2, reps: '5 breaths each side', restTime: 30, category: 'main' },
            { id: 'y4', name: 'Child\'s Pose', sets: 1, reps: '10 breaths', restTime: 0, category: 'cooldown' },
          ],
          overview: `A gentle ${duration}-minute yoga session focusing on flexibility and mindfulness.`,
          targetMuscles: 'Full Body',
        },
        'cardio': {
          title: duration >= 20 ? `${duration}-Min Cardio Run` : `${duration}-Min Cardio Session`,
          type: 'Cardio',
          difficulty: 'Moderate',
          exercises: duration >= 20 ? [
            { id: 'c1', name: 'Dynamic Stretching', sets: 1, reps: '3 minutes', restTime: 0, category: 'warmup' },
            { id: 'c2', name: 'Running/Jogging', sets: 1, reps: `${duration - 8} minutes`, restTime: 0, category: 'main' },
            { id: 'c3', name: 'Cool Down Walk', sets: 1, reps: '5 minutes', restTime: 0, category: 'cooldown' },
          ] : [
            { id: 'c1', name: 'Jumping Jacks', sets: 2, reps: '30 seconds', restTime: 20, category: 'warmup' },
            { id: 'c2', name: 'High Knees', sets: 3, reps: '30 seconds', restTime: 30, category: 'main' },
            { id: 'c3', name: 'Walking', sets: 1, reps: '2 min', restTime: 0, category: 'cooldown' },
          ],
          overview: duration >= 20 ? `${duration}-minute outdoor or treadmill run to build endurance.` : `Quick ${duration}-minute cardio burst to elevate your heart rate.`,
          targetMuscles: 'Cardiovascular System',
        },
        'strength': {
          title: `${duration}-Min Strength Training`,
          type: 'Strength',
          difficulty: 'Moderate',
          exercises: [
            { id: 's1', name: 'Push-ups', sets: 3, reps: '12', restTime: 60, category: 'main' },
            { id: 's2', name: 'Squats', sets: 3, reps: '15', restTime: 60, category: 'main' },
            { id: 's3', name: 'Plank', sets: 3, reps: '30 seconds', restTime: 45, category: 'main' },
            { id: 's4', name: 'Stretching', sets: 1, reps: '5 min', restTime: 0, category: 'cooldown' },
          ],
          overview: `Build strength with this ${duration}-minute bodyweight workout.`,
          targetMuscles: 'Full Body',
        },
      };
      
      const template = workoutTemplates[workoutType.toLowerCase()] || workoutTemplates['cardio'];
      
      const newWorkout = {
        id: `added_${Date.now()}`,
        date: targetDate.toISOString(),
        duration: duration,
        caloriesBurn: Math.round(duration * 6), // Rough estimate
        completed: false,
        isRestDay: false,
        ...template,
      };
      
      // Find where to insert (keep chronological order)
      const updatedWorkouts = [...weekWorkouts];
      const insertIndex = updatedWorkouts.findIndex(w => new Date(w.date) > targetDate);
      
      if (insertIndex === -1) {
        updatedWorkouts.push(newWorkout);
      } else {
        updatedWorkouts.splice(insertIndex, 0, newWorkout);
      }
      
      set({ weekWorkouts: updatedWorkouts });
      await setStorageItem('week_workouts', JSON.stringify(updatedWorkouts));
      
      console.log('✅ [ADD] Workout added successfully');
      return newWorkout;
    } catch (error) {
      console.error('❌ [ADD] Failed to add workout:', error);
      return null;
    }
  },
  
  // Remove a workout from a specific date (AI Coach can remove workouts)
  removeWorkoutFromDate: async (targetDate: Date) => {
    const { weekWorkouts } = get();
    console.log('➖ [REMOVE] Removing workout for', targetDate.toDateString());
    
    const dateStr = targetDate.toDateString();
    const updatedWorkouts = weekWorkouts.filter(w => {
      const workoutDate = new Date(w.date);
      return workoutDate.toDateString() !== dateStr;
    });
    
    if (updatedWorkouts.length === weekWorkouts.length) {
      console.log('⚠️ [REMOVE] No workout found for this date');
      return false;
    }
    
    set({ weekWorkouts: updatedWorkouts });
    await setStorageItem('week_workouts', JSON.stringify(updatedWorkouts));
    
    console.log('✅ [REMOVE] Workout removed successfully');
    return true;
  },
  
  // Replace a rest day with a workout (AI Coach power)
  replaceRestDayWithWorkout: async (restDayDate: Date, workoutType: string, duration: number = 30) => {
    const { weekWorkouts } = get();
    console.log('🔄 [REPLACE] Replacing rest day with workout:', restDayDate.toDateString());
    
    const dateStr = restDayDate.toDateString();
    const restDayIndex = weekWorkouts.findIndex(w => {
      const workoutDate = new Date(w.date);
      return workoutDate.toDateString() === dateStr && w.isRestDay;
    });
    
    if (restDayIndex === -1) {
      console.log('⚠️ [REPLACE] No rest day found for this date');
      return await get().addWorkoutToDate(restDayDate, workoutType, duration);
    }
    
    // Use the same template logic as addWorkoutToDate
    const workoutTemplates: Record<string, any> = {
      'yoga': {
        title: `${duration}-Min Yoga Flow`,
        type: 'Flexibility',
        difficulty: 'Beginner',
        exercises: [
          { id: 'y1', name: 'Cat-Cow Stretch', sets: 3, reps: '10 breaths', restTime: 30, category: 'warmup' },
          { id: 'y2', name: 'Downward Dog', sets: 3, reps: '5 breaths', restTime: 30, category: 'main' },
          { id: 'y3', name: 'Warrior II', sets: 2, reps: '5 breaths each side', restTime: 30, category: 'main' },
          { id: 'y4', name: 'Child\'s Pose', sets: 1, reps: '10 breaths', restTime: 0, category: 'cooldown' },
        ],
        overview: `A gentle ${duration}-minute yoga session focusing on flexibility and mindfulness.`,
        targetMuscles: 'Full Body',
      },
      'cardio': {
        title: duration >= 20 ? `${duration}-Min Cardio Run` : `${duration}-Min Cardio Session`,
        type: 'Cardio',
        difficulty: 'Moderate',
        exercises: duration >= 20 ? [
          { id: 'c1', name: 'Dynamic Stretching', sets: 1, reps: '3 minutes', restTime: 0, category: 'warmup' },
          { id: 'c2', name: 'Running/Jogging', sets: 1, reps: `${duration - 8} minutes`, restTime: 0, category: 'main' },
          { id: 'c3', name: 'Cool Down Walk', sets: 1, reps: '5 minutes', restTime: 0, category: 'cooldown' },
        ] : [
          { id: 'c1', name: 'Jumping Jacks', sets: 2, reps: '30 seconds', restTime: 20, category: 'warmup' },
          { id: 'c2', name: 'High Knees', sets: 3, reps: '30 seconds', restTime: 30, category: 'main' },
          { id: 'c3', name: 'Walking', sets: 1, reps: '2 min', restTime: 0, category: 'cooldown' },
        ],
        overview: duration >= 20 ? `${duration}-minute outdoor or treadmill run to build endurance.` : `Quick ${duration}-minute cardio burst to elevate your heart rate.`,
        targetMuscles: 'Cardiovascular System',
      },
      'strength': {
        title: `${duration}-Min Strength Training`,
        type: 'Strength',
        difficulty: 'Moderate',
        exercises: [
          { id: 's1', name: 'Push-ups', sets: 3, reps: '12', restTime: 60, category: 'main' },
          { id: 's2', name: 'Squats', sets: 3, reps: '15', restTime: 60, category: 'main' },
          { id: 's3', name: 'Plank', sets: 3, reps: '30 seconds', restTime: 45, category: 'main' },
          { id: 's4', name: 'Stretching', sets: 1, reps: '5 min', restTime: 0, category: 'cooldown' },
        ],
        overview: `Build strength with this ${duration}-minute bodyweight workout.`,
        targetMuscles: 'Full Body',
      },
    };
    
    const template = workoutTemplates[workoutType.toLowerCase()] || workoutTemplates['cardio'];
    
    const newWorkout = {
      id: `replaced_${Date.now()}`,
      date: restDayDate.toISOString(),
      duration: duration,
      caloriesBurn: Math.round(duration * 6),
      completed: false,
      isRestDay: false,
      ...template,
    };
    
    const updatedWorkouts = [...weekWorkouts];
    updatedWorkouts[restDayIndex] = newWorkout;
    
    set({ weekWorkouts: updatedWorkouts });
    await setStorageItem('week_workouts', JSON.stringify(updatedWorkouts));
    
    console.log('✅ [REPLACE] Rest day replaced with workout');
    return newWorkout;
  },
}));

// Helper function to generate a single day's workout (for rolling generation)
async function generateSingleDay(date: Date, dayIndex: number) {
  try {
    const storedUser = await getStorageItem('auth_user');
    if (!storedUser) {
      console.log('❌ [ROLLING] No user found for generation');
      return;
    }
    
    const user = JSON.parse(storedUser);
    const trainingDays = parseInt(String(user.trainingDays)) || 5;
    const restDayPattern = getRestDayPattern(trainingDays);
    
    // Check if this is a rest day (0=Monday, 6=Sunday)
    const dayOfWeek = date.getDay();
    const mondayBasedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const isRestDay = restDayPattern.includes(mondayBasedDay);
    
    const { weekWorkouts } = useWorkoutStore.getState();
    
    let newWorkout: Workout;
    
    if (isRestDay) {
      newWorkout = {
        id: `rest_${date.getTime()}`,
        title: 'Rest Day',
        type: 'Rest',
        difficulty: 'rest',
        duration: 0,
        date: date.toISOString(),
        exercises: [],
        overview: 'Take time to recover. Stay hydrated and get good sleep!',
        targetMuscles: '',
        caloriesBurn: 0,
        exerciseList: [],
        status: 'rest',
        isRestDay: true,
      };
      console.log(`😴 [ROLLING] Generated rest day: ${date.toDateString()}`);
    } else {
      const userProfile = {
        fitnessGoals: user.fitnessGoals || [user.goal],
        goal: user.goal,
        experience: user.experience,
        trainingType: user.trainingType,
        sessionDuration: user.sessionDuration,
        trainingDays: user.trainingDays,
        equipment: user.equipment,
        injuries: user.injuries,
        userId: user.id,
      };
      
      // Calculate week number (how many weeks from now)
      const today = new Date();
      const weekDiff = Math.floor((date.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      // Retry logic for API call
      let attempts = 0;
      let success = false;
      let workout: any = null;
      
      while (attempts < 2 && !success) {
        attempts++;
        try {
          const response = await fetch(`${API_BASE_URL}/api/workouts/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Bypass-Tunnel-Reminder': 'true',
            },
            body: JSON.stringify({
              userProfile,
              dayOfWeek: mondayBasedDay,
              weekNumber: weekDiff + 1,
            }),
          });
          
          if (response.ok) {
            workout = await response.json();
            success = true;
          } else {
            const errorText = await response.text();
            console.log(`⚠️ [ROLLING] Attempt ${attempts} failed for ${date.toDateString()}: ${response.status}`);
            if (attempts < 2) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
            }
          }
        } catch (fetchError) {
          console.log(`⚠️ [ROLLING] Network error attempt ${attempts}: ${fetchError}`);
          if (attempts < 2) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      if (!success || !workout) {
        console.log(`❌ [ROLLING] Could not generate workout for ${date.toDateString()} - will retry next time`);
        return; // Don't add incomplete data
      }
      
      newWorkout = {
        id: `workout_${date.getTime()}`,
        title: workout.title,
        type: workout.type,
        difficulty: workout.difficulty,
        duration: workout.duration,
        date: date.toISOString(),
        exercises: workout.exercises,
        overview: workout.overview,
        targetMuscles: workout.targetMuscles,
        caloriesBurn: workout.caloriesBurn,
        exerciseList: workout.exercises,
        status: 'ready',
      };
      console.log(`✅ [ROLLING] Generated: ${workout.title} for ${date.toDateString()}`);
    }
    
    // Add to weekWorkouts and save
    const updatedWorkouts = [...weekWorkouts, newWorkout];
    await setStorageItem('week_workouts', JSON.stringify(updatedWorkouts));
    useWorkoutStore.setState({ weekWorkouts: updatedWorkouts });
    
  } catch (error) {
    console.error('Error generating single day:', error);
  }
}

// Function to update badges after workout completion
async function updateBadgesAfterWorkout() {
  try {
    const workoutStore = useWorkoutStore.getState();
    const { stats, completedWorkouts } = workoutStore;
    
    if (!stats) {
      console.log('⚠️ [BADGES] No stats available for badge update');
      return;
    }
    
    // Calculate additional stats needed for badges
    const strengthSessions = completedWorkouts.filter(w => 
      w.type?.toLowerCase().includes('strength') || 
      w.type?.toLowerCase().includes('upper') || 
      w.type?.toLowerCase().includes('lower')
    ).length;
    
    const cardioSessions = completedWorkouts.filter(w => 
      w.type?.toLowerCase().includes('cardio')
    ).length;
    
    const upperBodySessions = completedWorkouts.filter(w => 
      w.type?.toLowerCase().includes('upper') ||
      w.targetMuscles?.toLowerCase().includes('upper')
    ).length;
    
    const lowerBodySessions = completedWorkouts.filter(w => 
      w.type?.toLowerCase().includes('lower') ||
      w.targetMuscles?.toLowerCase().includes('lower') ||
      w.targetMuscles?.toLowerCase().includes('legs')
    ).length;
    
    const fullBodySessions = completedWorkouts.filter(w => 
      w.type?.toLowerCase().includes('full') ||
      w.targetMuscles?.toLowerCase().includes('full')
    ).length;
    
    const cardioMinutes = completedWorkouts
      .filter(w => w.type?.toLowerCase().includes('cardio'))
      .reduce((sum, w) => sum + (w.duration || 0), 0);
    
    // Calculate total sets and reps from completed workouts
    let totalSets = 0;
    let totalReps = 0;
    
    completedWorkouts.forEach(workout => {
      if (workout.exercises && Array.isArray(workout.exercises)) {
        workout.exercises.forEach(exercise => {
          // Add sets
          totalSets += exercise.sets || 3;
          
          // Parse reps - handle different formats like "10", "8-12", "30 sec", etc.
          const repsStr = String(exercise.reps || '10');
          const repsMatch = repsStr.match(/^(\d+)/);
          const repsNum = repsMatch ? parseInt(repsMatch[1], 10) : 10;
          
          // Multiply reps by sets
          totalReps += repsNum * (exercise.sets || 3);
        });
      }
    });
    
    // IMPORTANT: For cardio, every minute counts as a "rep" for badge tracking
    // This allows cardio users to progress on rep-based badges
    totalReps += cardioMinutes;
    
    // Get coach conversation count for badge progress
    let coachConversations = 0;
    try {
      const stored = await getStorageItem('coach_conversation_count');
      coachConversations = stored ? parseInt(stored, 10) : 0;
    } catch (e) {
      // ignore
    }
    
    // Prepare workout stats for badge system
    const workoutStats = {
      totalWorkouts: stats.totalWorkouts,
      currentStreak: stats.currentStreak,
      totalSets,
      totalReps,
      totalMinutes: stats.totalMinutes,
      cardioMinutes,
      strengthSessions,
      cardioSessions,
      upperBodySessions,
      lowerBodySessions,
      fullBodySessions,
      coachConversations,
    };
    
    console.log('🏆 [BADGES] Updating badges with workout stats:', workoutStats);
    
    // Update badges using the awards store
    const awardsStore = useAwardsStore.getState();
    const newlyUnlocked = await awardsStore.updateBadgeProgress(workoutStats);
    
    if (newlyUnlocked.length > 0) {
      console.log('🎉 [BADGES] New badges unlocked:', newlyUnlocked.map(b => b.name));
    }
    
  } catch (error) {
    console.error('❌ [BADGES] Error updating badges after workout:', error);
  }
}

// Helper Functions

function generateExercises(user: any, dayIndex: number = 0): Exercise[] {
  const goal = user.fitnessGoals?.[0] || user.goal || 'general-fitness';
  const experience = user.experience || 'beginner';
  
  // Different workout splits based on day
  const workoutTypes = ['upper', 'lower', 'full', 'cardio', 'core'];
  const workoutType = workoutTypes[dayIndex % workoutTypes.length];
  
  const exercises: Exercise[] = [];
  
  // Always add warm-up exercises first (dynamic movements)
  exercises.push(
    { id: 'warmup-1', name: 'Arm Circles', sets: 2, reps: '30 sec', restTime: 15 },
    { id: 'warmup-2', name: 'Leg Swings', sets: 2, reps: '20 each', restTime: 15 },
  );
  
  // Main workout exercises
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
      { id: '3', name: 'Bodyweight Squats', sets: 4, reps: '15-20', restTime: 60 },
      { id: '4', name: 'Plank', sets: 3, reps: '60 sec', duration: 60, restTime: 45 },
    );
  }
  
  // Always add recovery exercises last (static stretches)
  exercises.push(
    { id: 'recovery-1', name: 'Hamstring Stretch', sets: 1, reps: '60 sec', restTime: 0 },
    { id: 'recovery-2', name: 'Quad Stretch', sets: 1, reps: '60 sec', restTime: 0 },
  );
  
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
    const stored = await getStorageItem('personal_bests');
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
    
    await setStorageItem('personal_bests', JSON.stringify(personalBests));
    console.log('Personal bests updated');
  } catch (error) {
    console.error('Error updating personal bests:', error);
  }
}


// Reset all workout data (for new user or logout)
export async function resetAllWorkoutData(): Promise<void> {
  console.log('🔄 Resetting all workout data...');
  
  // Clear all workout-related storage using AsyncStorage
  await deleteStorageItem('week_workouts');
  await deleteStorageItem('week_workouts_date');
  await deleteStorageItem('week_workouts_version');
  await deleteStorageItem('today_workout');
  await deleteStorageItem('today_workout_date');
  await deleteStorageItem('completed_workouts');
  await deleteStorageItem('future_weeks');
  await deleteStorageItem('workout_stats');
  await deleteStorageItem('personal_bests');
  
  // Reset the awards store
  useAwardsStore.getState().resetAllAwards();
  
  console.log('✅ All workout data reset');
}
