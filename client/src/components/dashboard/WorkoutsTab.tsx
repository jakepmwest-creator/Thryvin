import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Play, CheckCircle, Target, Clock, 
  Dumbbell, Users, Zap, MessageCircle, RotateCcw,
  ChevronRight, ChevronLeft, Plus, Edit, Star,
  Activity, Trophy, Video, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedMonthlyCalendar } from '@/components/workout/EnhancedMonthlyCalendar';
import { DailyWorkoutView } from '@/components/workout/DailyWorkoutView';
import { addDays, startOfWeek } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

type WorkoutGoal = 'muscle' | 'fat-loss' | 'general' | 'strength' | 'endurance';
type Equipment = 'gym' | 'home' | 'bodyweight' | 'minimal';

interface UserWorkoutPreferences {
  goal: WorkoutGoal;
  daysPerWeek: number;
  equipment: Equipment;
  restrictions: string;
  experience: 'beginner' | 'intermediate' | 'advanced';
}

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  muscles: string[];
  videoId?: string;
  instructions: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface WorkoutDay {
  id: string;
  title: string;
  emoji: string;
  exercises: Exercise[];
  completed: boolean;
  estimatedTime: number;
  description: string;
}

interface WeeklySchedule {
  [key: string]: WorkoutDay | null;
}

export default function WorkoutsTab() {
  const { toast } = useToast();
  const [isNewUser, setIsNewUser] = useState(true);
  const [currentView, setCurrentView] = useState<'onboarding' | 'schedule-kickstart' | 'weekly' | 'monthly' | 'workout-detail'>('onboarding');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [preferences, setPreferences] = useState<UserWorkoutPreferences>({
    goal: 'muscle',
    daysPerWeek: 3,
    equipment: 'gym',
    restrictions: '',
    experience: 'beginner'
  });
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [customWorkoutRequest, setCustomWorkoutRequest] = useState('');
  const [schedulePreferences, setSchedulePreferences] = useState({
    availableDays: [] as string[],
    preferredTime: 'morning' as 'morning' | 'afternoon' | 'evening',
    sessionLength: 'medium' as 'short' | 'medium' | 'long',
    weekFocus: 'mix' as 'strength' | 'cardio' | 'recovery' | 'mix'
  });
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [currentMonthView, setCurrentMonthView] = useState(new Date());
  const [previousView, setPreviousView] = useState<'weekly' | 'monthly'>('weekly');

  // NEW: React Query hooks for calendar sync 🎯
  // Step 3: Replace localStorage with API endpoints
  const { 
    data: weeklyWorkoutData, 
    isLoading: isLoadingWeekly,
    isError: isWeeklyError 
  } = useQuery({
    queryKey: ['/api/workouts/week'],
    queryFn: async () => {
      const res = await fetch('/api/workouts/week', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch weekly workouts');
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: currentView === 'weekly' || currentView === 'monthly' // Only fetch when needed
  });

  // Transform API data to WeeklySchedule format for seamless UI integration
  const weeklyScheduleFromAPI = React.useMemo(() => {
    if (!weeklyWorkoutData?.workouts) return {};
    
    const schedule: WeeklySchedule = {};
    
    // Handle both API formats: array (new format) and object (old format)
    if (Array.isArray(weeklyWorkoutData.workouts)) {
      // Handle new API format: array of workouts with payload_json
      const dayMap: { [key: string]: string } = {
        '0': 'sunday', '1': 'monday', '2': 'tuesday', '3': 'wednesday',
        '4': 'thursday', '5': 'friday', '6': 'saturday'
      };
      
      weeklyWorkoutData.workouts.forEach((workout: any) => {
        const date = new Date(workout.date);
        const dayName = dayMap[date.getDay().toString()];
        
        if (dayName && workout.payload_json) {
          try {
            const payload = JSON.parse(workout.payload_json);
            schedule[dayName] = {
              id: workout.id.toString(),
              title: payload.title || 'Workout',
              emoji: payload.emoji || '💪',
              exercises: payload.exercises || [],
              completed: workout.completed_at ? true : false,
              estimatedTime: payload.estimatedTime || 30,
              description: payload.description || 'AI-generated workout'
            };
          } catch (e) {
            console.warn('Failed to parse workout payload:', e);
          }
        }
      });
    } else if (typeof weeklyWorkoutData.workouts === 'object') {
      // Handle old API format: object with day names as keys
      Object.keys(weeklyWorkoutData.workouts).forEach(dayName => {
        const workout = weeklyWorkoutData.workouts[dayName];
        if (workout && workout.blocks && Array.isArray(workout.blocks)) {
          // Transform old format to new format
          const exercises = workout.blocks
            .flatMap((block: any) => block.items || [])
            .map((item: any) => ({
              id: item.exercise_id,
              name: item.name,
              sets: item.sets,
              reps: item.reps,
              rest: `${item.rest_sec}s`,
              muscles: workout.muscleGroups || ['Full Body'],
              instructions: `${item.sets} sets of ${item.reps}`,
              difficulty: workout.difficulty || 'intermediate'
            }));
          
          schedule[dayName] = {
            id: workout.id,
            title: workout.title,
            emoji: getEmojiForWorkoutType(workout.type),
            exercises,
            completed: workout.status === 'completed',
            estimatedTime: workout.duration_min || 30,
            description: workout.coach_notes || 'AI-generated workout'
          };
        }
      });
    }
    
    return schedule;
  }, [weeklyWorkoutData]);
  
  // Helper function to get emoji for workout type
  const getEmojiForWorkoutType = (type: string) => {
    const emojiMap: { [key: string]: string } = {
      'strength': '💪',
      'cardio': '🏃‍♂️',
      'mobility': '🧘‍♀️',
      'circuit': '🔥',
      'recovery': '🌸'
    };
    return emojiMap[type] || '💪';
  };

  useEffect(() => {
    const savedPreferences = localStorage.getItem('thryvin-workout-preferences');
    const hasCompletedKickstart = localStorage.getItem('thryvin-schedule-kickstart');
    
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
      setIsNewUser(false);
      
      if (hasCompletedKickstart) {
        setCurrentView('weekly');
      } else {
        setCurrentView('schedule-kickstart');
      }
    }
  }, []);

  // Update weeklySchedule when API data changes (replacing localStorage approach)
  useEffect(() => {
    if (weeklyScheduleFromAPI && Object.keys(weeklyScheduleFromAPI).length > 0) {
      setWeeklySchedule(weeklyScheduleFromAPI);
    }
  }, [weeklyScheduleFromAPI]);

  const generateWorkoutWithAI = async (request: string): Promise<Exercise[]> => {
    try {
      const response = await fetch('/api/generate-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request,
          preferences,
          equipment: preferences.equipment
        })
      });

      if (!response.ok) {
        console.warn('AI generation failed, using fallback');
        return generateFallbackExercises(request);
      }
      
      const data = await response.json();
      if (!data.exercises || !Array.isArray(data.exercises) || data.exercises.length === 0) {
        console.warn('Invalid AI response, using fallback');
        return generateFallbackExercises(request);
      }
      
      return data.exercises;
    } catch (error) {
      console.warn('AI workout generation failed, using fallback:', error);
      return generateFallbackExercises(request);
    }
  };

  // AI-powered schedule management functions
  const handleScheduleChange = async (request: string) => {
    setIsGenerating(true);
    try {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      let fromDay = '', toDay = '';
      
      // Parse the request to extract days
      for (const day of days) {
        if (request.includes(day)) {
          if (!fromDay) fromDay = day;
          else if (!toDay) toDay = day;
        }
      }
      
      if (fromDay && toDay && weeklySchedule[fromDay]) {
        const workoutToMove = weeklySchedule[fromDay];
        const newSchedule = { ...weeklySchedule };
        
        // Move workout
        newSchedule[toDay] = workoutToMove;
        newSchedule[fromDay] = null;
        
        setWeeklySchedule(newSchedule);
        localStorage.setItem('thryvin-weekly-schedule', JSON.stringify(newSchedule));
        
        toast({
          title: "Workout Moved!",
          description: `Moved ${workoutToMove?.title} from ${fromDay} to ${toDay}.`,
        });
      } else {
        toast({
          title: "Schedule Updated",
          description: "I've processed your schedule change request.",
        });
      }
      
      setCustomWorkoutRequest('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update schedule. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWorkoutTimeChange = async (request: string) => {
    setIsGenerating(true);
    try {
      let newDuration = 30;
      
      if (request.includes('shorter') || request.includes('quick') || request.includes('15') || request.includes('20')) {
        newDuration = 20;
      } else if (request.includes('longer') || request.includes('45') || request.includes('60')) {
        newDuration = 50;
      }
      
      const newSchedule = { ...weeklySchedule };
      Object.keys(newSchedule).forEach(day => {
        if (newSchedule[day]) {
          newSchedule[day]!.estimatedTime = newDuration;
          newSchedule[day]!.description = newSchedule[day]!.description.replace(/\d+-minute/, `${newDuration}-minute`);
        }
      });
      
      setWeeklySchedule(newSchedule);
      localStorage.setItem('thryvin-weekly-schedule', JSON.stringify(newSchedule));
      
      toast({
        title: "Workout Duration Updated!",
        description: `All workouts adjusted to ${newDuration} minutes.`,
      });
      
      setCustomWorkoutRequest('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update workout duration.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFocusChange = async (request: string) => {
    setIsGenerating(true);
    try {
      let newFocus = 'strength';
      let emoji = '💪';
      
      if (request.includes('cardio')) {
        newFocus = 'cardio';
        emoji = '🏃‍♂️';
      } else if (request.includes('recovery') || request.includes('flexibility') || request.includes('yoga')) {
        newFocus = 'recovery';
        emoji = '🧘‍♀️';
      }
      
      // Regenerate workouts with new focus
      const newSchedule: WeeklySchedule = {};
      const workoutDays = Object.keys(weeklySchedule).filter(day => weeklySchedule[day]);
      
      for (const day of workoutDays) {
        const currentWorkout = weeklySchedule[day];
        if (currentWorkout) {
          const newRequest = `${currentWorkout.estimatedTime}-minute ${newFocus} workout for ${preferences.experience} level using ${preferences.equipment} equipment`;
          
          try {
            const exercises = await generateWorkoutWithAI(newRequest);
            newSchedule[day] = {
              ...currentWorkout,
              title: `${newFocus.charAt(0).toUpperCase() + newFocus.slice(1)} Day`,
              emoji,
              exercises,
              description: `${newFocus} focused workout`
            };
          } catch (error) {
            newSchedule[day] = currentWorkout; // Keep original if generation fails
          }
        }
      }
      
      setWeeklySchedule(newSchedule);
      localStorage.setItem('thryvin-weekly-schedule', JSON.stringify(newSchedule));
      
      toast({
        title: "Focus Changed!",
        description: `Updated all workouts to focus on ${newFocus}.`,
      });
      
      setCustomWorkoutRequest('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update workout focus.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddWorkoutDay = async (request: string) => {
    setIsGenerating(true);
    try {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      let targetDay = '';
      
      for (const day of days) {
        if (request.includes(day) && !weeklySchedule[day]) {
          targetDay = day;
          break;
        }
      }
      
      if (targetDay) {
        const workoutRequest = `30-minute ${preferences.goal} workout for ${preferences.experience} level using ${preferences.equipment} equipment`;
        const exercises = await generateWorkoutWithAI(workoutRequest);
        
        const newWorkout: WorkoutDay = {
          id: `added-${targetDay}-${Date.now()}`,
          title: 'Strength Day',
          emoji: '💪',
          exercises,
          completed: false,
          estimatedTime: 30,
          description: 'Added workout day'
        };
        
        const newSchedule = { ...weeklySchedule, [targetDay]: newWorkout };
        setWeeklySchedule(newSchedule);
        localStorage.setItem('thryvin-weekly-schedule', JSON.stringify(newSchedule));
        
        toast({
          title: "Workout Day Added!",
          description: `Added new workout on ${targetDay}.`,
        });
      } else {
        toast({
          title: "Day Added",
          description: "I've processed your request to add a workout day.",
        });
      }
      
      setCustomWorkoutRequest('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add workout day.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveWorkoutDay = async (request: string) => {
    setIsGenerating(true);
    try {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      let targetDay = '';
      
      for (const day of days) {
        if (request.includes(day) && weeklySchedule[day]) {
          targetDay = day;
          break;
        }
      }
      
      if (targetDay) {
        const newSchedule = { ...weeklySchedule };
        delete newSchedule[targetDay];
        
        setWeeklySchedule(newSchedule);
        localStorage.setItem('thryvin-weekly-schedule', JSON.stringify(newSchedule));
        
        toast({
          title: "Workout Day Removed!",
          description: `Removed workout from ${targetDay}.`,
        });
      } else {
        toast({
          title: "Day Removed",
          description: "I've processed your request to remove a workout day.",
        });
      }
      
      setCustomWorkoutRequest('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove workout day.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Transform weekly schedule to calendar format for any month
  const transformToCalendarWorkouts = (targetMonth?: Date): any[] => {
    const baseDate = targetMonth || new Date();
    const calendarWorkouts: any[] = [];
    
    const dayMapping = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    
    // Generate workouts for 6 weeks around the target month to cover all calendar dates
    const startDate = startOfWeek(startOfMonth(baseDate));
    const endDate = addDays(startDate, 41); // 6 weeks = 42 days
    
    // For each day in the calendar range, check if it matches a workout day pattern
    for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate = addDays(currentDate, 1)) {
      const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, etc.
      const dayName = Object.keys(dayMapping).find(key => dayMapping[key as keyof typeof dayMapping] === dayOfWeek);
      
      if (dayName && weeklySchedule[dayName]) {
        const workout = weeklySchedule[dayName];
        
        // Determine intensity based on workout type and duration
        let intensity: 'low' | 'medium' | 'high' = 'medium';
        if (workout.estimatedTime <= 15) intensity = 'low';
        else if (workout.estimatedTime >= 45) intensity = 'high';
        
        // 🚨 Fix completion tracking: Only show green if explicitly completed
        const today = new Date();
        const isToday = currentDate.toDateString() === today.toDateString();
        const isPastDay = currentDate < today && !isToday;
        
        // Only mark as completed if explicitly true, past incomplete days should show as missed
        const completionStatus = workout.completed === true;
        
        calendarWorkouts.push({
          date: new Date(currentDate),
          workoutType: workout.title,
          duration: workout.estimatedTime,
          intensity,
          isCompleted: completionStatus,
          isPastIncomplete: isPastDay && !completionStatus, // Track past incomplete days
          isRestDay: workout.title.toLowerCase().includes('recovery') || workout.title.toLowerCase().includes('mobility'),
          muscleGroups: workout.exercises?.map(ex => ex.muscles).flat() || [],
          workoutId: workout.id,
          dayName: dayName // Store the day name for easy lookup
        });
      }
    }
    
    return calendarWorkouts;
  };

  const generatePersonalizedWeek1 = async (userPrefs: UserWorkoutPreferences, schedulePrefs: any): Promise<WeeklySchedule> => {
    const schedule: WeeklySchedule = {};
    const availableDays = schedulePrefs.availableDays;
    
    // Generate workouts for selected days with personalized focus
    for (const day of availableDays) {
      const workoutType = schedulePrefs.weekFocus === 'mix' 
        ? ['strength', 'cardio', 'recovery'][Math.floor(Math.random() * 3)]
        : schedulePrefs.weekFocus;
      
      const duration = schedulePrefs.sessionLength === 'short' ? 20 : 
                      schedulePrefs.sessionLength === 'medium' ? 35 : 50;
      
      const request = `${duration}-minute ${workoutType} workout for ${userPrefs.experience} level using ${userPrefs.equipment} equipment, focusing on ${userPrefs.goal}`;
      
      try {
        const exercises = await generateWorkoutWithAI(request);
        
        schedule[day] = {
          id: `week1-${day}`,
          title: `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Day`,
          emoji: workoutType === 'strength' ? '💪' : workoutType === 'cardio' ? '🏃‍♂️' : '🧘‍♀️',
          exercises,
          completed: false,
          estimatedTime: duration,
          description: `${schedulePrefs.preferredTime} ${workoutType} workout`
        };
      } catch (error) {
        // Enhanced AI fallback with retries
        console.warn(`❌ Primary AI generation failed for ${day}, trying enhanced AI retry...`);
        try {
          const aiExercises = await generateAIExercisesWithRetry(request);
          schedule[day] = {
            id: `week1-${day}-ai-retry`,
            title: `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Day`,
            emoji: workoutType === 'strength' ? '💪' : workoutType === 'cardio' ? '🏃‍♂️' : '🧘‍♀️',
            exercises: aiExercises,
            completed: false,
            estimatedTime: duration,
            description: `${schedulePrefs.preferredTime} ${workoutType} workout (AI Generated)`
          };
        } catch (retryError) {
          console.error(`🚫 All AI generation attempts failed for ${day}:`, retryError);
          // Minimal placeholder that encourages regeneration
          schedule[day] = {
            id: `week1-${day}-placeholder`,
            title: `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Day`,
            emoji: '⏳',
            exercises: [{
              id: `placeholder-${day}`,
              name: 'Generating Your Personalized Workout...',
              sets: 1,
              reps: 'Please refresh to retry AI generation',
              rest: '0s',
              muscles: ['full body'],
              instructions: 'Your personalized workout is being prepared. Please try refreshing the page.',
              difficulty: preferences.experience
            }],
            completed: false,
            estimatedTime: duration,
            description: `${schedulePrefs.preferredTime} ${workoutType} workout - Generation in progress`
          };
        }
      }
    }
    
    return schedule;
  };

  // AI-powered exercise generation with intelligent retries
  const generateAIExercisesWithRetry = async (request: string, maxRetries: number = 3): Promise<Exercise[]> => {
    console.log(`🤖 Generating AI exercises for: "${request}"`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 AI Exercise Generation - Attempt ${attempt}/${maxRetries}`);
        
        // Create progressively simpler prompts for retries
        let aiRequest = request;
        if (attempt === 2) {
          // Simplified request for second attempt
          aiRequest = `Simple ${preferences.goal} workout for ${preferences.experience} level using ${preferences.equipment}`;
        } else if (attempt === 3) {
          // Most basic request for final attempt
          aiRequest = `Basic bodyweight workout for ${preferences.experience} level`;
        }
        
        const response = await fetch('/api/generate-workout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request: aiRequest,
            preferences,
            equipment: preferences.equipment
          })
        });

        if (!response.ok) {
          console.warn(`❌ AI Generation attempt ${attempt} failed with status:`, response.status);
          continue;
        }
        
        const data = await response.json();
        
        if (!data.exercises || !Array.isArray(data.exercises) || data.exercises.length === 0) {
          console.warn(`❌ AI Generation attempt ${attempt} returned invalid data:`, data);
          continue;
        }
        
        console.log(`✅ AI Exercise Generation succeeded on attempt ${attempt}`);
        return data.exercises;
        
      } catch (error) {
        console.warn(`❌ AI Generation attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          console.error('🚫 All AI generation attempts failed, using minimal fallback');
          // Only as absolute last resort - minimal exercises
          return [
            {
              id: `minimal-fallback-${Date.now()}`,
              name: 'Bodyweight Movement',
              sets: 3,
              reps: '8-12',
              rest: '60s',
              muscles: ['full body'],
              instructions: 'A basic movement to get you started. AI generation will be restored shortly.',
              difficulty: preferences.experience
            }
          ];
        }
        
        // Brief delay before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // This should never be reached, but TypeScript requires it
    return [];
  };

  const handleOnboardingSubmit = async () => {
    setIsGenerating(true);
    
    try {
      localStorage.setItem('thryvin-workout-preferences', JSON.stringify(preferences));
      
      const schedule = await generateWeeklySchedule(preferences);
      setWeeklySchedule(schedule);
      localStorage.setItem('thryvin-weekly-schedule', JSON.stringify(schedule));
      
      setIsNewUser(false);
      setCurrentView('schedule-kickstart');
      
      toast({
        title: "Workout Plan Created!",
        description: "Your personalized weekly workout schedule is ready.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate workout plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWeeklySchedule = async (prefs: UserWorkoutPreferences): Promise<WeeklySchedule> => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const schedule: WeeklySchedule = {};
    
    // Define AI workout types with emojis based on user goal and preferences
    const workoutTypes = [
      { type: 'Upper Body', emoji: '💪', description: 'Build chest, shoulders, back and arms' },
      { type: 'Lower Body', emoji: '🦵', description: 'Strengthen legs and glutes' },
      { type: 'Full Body', emoji: '🔥', description: 'Complete full body workout' },
      { type: 'HIIT', emoji: '⚡', description: 'High-intensity interval training' },
      { type: 'Strength', emoji: '🏋️', description: 'Focus on strength building' },
      { type: 'Cardio', emoji: '🏃', description: 'Cardiovascular fitness' },
      { type: 'Recovery', emoji: '🧘‍♀️', description: 'Active recovery and flexibility' },
      { type: 'Mobility', emoji: '🤸‍♂️', description: 'Mobility and movement preparation' }
    ];

    // Generate AI workouts for ALL 7 days - FULL WEEK AUTOMATION
    for (let i = 0; i < days.length; i++) {
      try {
        // Determine if this should be an intensive workout day or recovery day
        const isIntensiveDay = i < prefs.daysPerWeek;
        const intensiveWorkoutTypes = workoutTypes.slice(0, 6); // First 6 are intensive
        const recoveryWorkoutTypes = workoutTypes.slice(6); // Last 2 are recovery/mobility
        
        let workoutType;
        if (isIntensiveDay) {
          const intensiveIndex = i % intensiveWorkoutTypes.length;
          workoutType = intensiveWorkoutTypes[intensiveIndex];
        } else {
          const recoveryIndex = (i - prefs.daysPerWeek) % recoveryWorkoutTypes.length;
          workoutType = recoveryWorkoutTypes[recoveryIndex];
        }
        
        // Adjust session duration based on workout type
        const sessionDuration = isIntensiveDay ? 30 : 15;
        
        // Call AI API to generate personalized workout
        const response = await fetch('/api/generate-workout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workoutType: workoutType.type,
            workoutProfile: {
              fitnessGoal: prefs.goal,
              experienceLevel: prefs.experience,
              sessionDuration: sessionDuration,
              equipmentAccess: [prefs.equipment]
            }
          })
        });

        if (response.ok) {
          const aiWorkout = await response.json();
          
          // Transform AI workout to WorkoutDay format
          const exercises = aiWorkout.exercises?.map((ex: any, index: number) => ({
            id: `${days[i]}-${index}-${Date.now()}`,
            name: ex.name,
            sets: ex.sets || 3,
            reps: typeof ex.reps === 'string' ? ex.reps : `${ex.reps}`,
            rest: ex.restTime ? `${ex.restTime}s` : '60s',
            muscles: ex.targetMuscles || ['general'],
            instructions: ex.instructions || `Perform ${ex.name} with proper form.`,
            difficulty: ex.difficulty || prefs.experience
          })) || [];

          schedule[days[i]] = {
            id: days[i],
            title: aiWorkout.title || `${workoutType.type} Day`,
            emoji: workoutType.emoji,
            description: aiWorkout.description || workoutType.description,
            exercises,
            completed: false,
            estimatedTime: aiWorkout.estimatedDuration || sessionDuration
          };
        } else {
          throw new Error('AI workout generation failed');
        }
      } catch (error) {
        console.warn(`Failed to generate AI workout for ${days[i]}, using fallback:`, error);
        
        // Fallback using the same intensive/recovery logic
        const isIntensiveDay = i < prefs.daysPerWeek;
        const intensiveWorkoutTypes = workoutTypes.slice(0, 6);
        const recoveryWorkoutTypes = workoutTypes.slice(6);
        
        let workoutType;
        if (isIntensiveDay) {
          const intensiveIndex = i % intensiveWorkoutTypes.length;
          workoutType = intensiveWorkoutTypes[intensiveIndex];
        } else {
          const recoveryIndex = (i - prefs.daysPerWeek) % recoveryWorkoutTypes.length;
          workoutType = recoveryWorkoutTypes[recoveryIndex];
        }
        
        const sessionDuration = isIntensiveDay ? 30 : 15;
        const exercises = generateFallbackExercises(workoutType.type.toLowerCase());

        schedule[days[i]] = {
          id: days[i],
          title: `${workoutType.type} Day`,
          emoji: workoutType.emoji,
          description: workoutType.description,
          exercises,
          completed: false,
          estimatedTime: sessionDuration
        };
      }
    }

    return schedule;
  };

  const markWorkoutComplete = (dayId: string) => {
    const updatedSchedule = {
      ...weeklySchedule,
      [dayId]: weeklySchedule[dayId] ? 
        { ...weeklySchedule[dayId]!, completed: true } : null
    };
    setWeeklySchedule(updatedSchedule);
    localStorage.setItem('thryvin-weekly-schedule', JSON.stringify(updatedSchedule));
    
    toast({
      title: "Workout Completed! 🎉",
      description: "Great job on finishing your workout!",
    });
  };

  const handleCustomWorkout = async () => {
    if (!customWorkoutRequest.trim()) {
      toast({
        title: "Please describe your workout",
        description: "Enter what type of workout you'd like to create.",
        variant: "destructive"
      });
      return;
    }
    
    const request = customWorkoutRequest.toLowerCase();
    
    // Check for plan management commands
    if (request.includes('reset') && (request.includes('plan') || request.includes('everything') || request.includes('start fresh'))) {
      localStorage.removeItem('thryvin-workout-preferences');
      localStorage.removeItem('thryvin-weekly-schedule');
      setIsNewUser(true);
      setCurrentView('onboarding');
      setCustomWorkoutRequest('');
      toast({
        title: "Plan Reset Complete!",
        description: "Starting fresh with new onboarding.",
      });
      return;
    }
    
    if (request.includes('update') && (request.includes('preferences') || request.includes('plan'))) {
      localStorage.removeItem('thryvin-workout-preferences');
      localStorage.removeItem('thryvin-weekly-schedule');
      setIsNewUser(true);
      setCurrentView('onboarding');
      setCustomWorkoutRequest('');
      toast({
        title: "Updating Your Preferences",
        description: "Let's update your workout preferences.",
      });
      return;
    }

    // Handle day switching and schedule changes
    if (request.includes('move') || request.includes('switch') || request.includes('change day')) {
      await handleScheduleChange(request);
      return;
    }

    // Handle workout modifications
    if (request.includes('shorter') || request.includes('longer') || request.includes('time')) {
      await handleWorkoutTimeChange(request);
      return;
    }

    // Handle focus changes
    if (request.includes('focus') || request.includes('cardio') || request.includes('strength') || request.includes('recovery')) {
      await handleFocusChange(request);
      return;
    }

    // Handle adding/removing days
    if (request.includes('add') && request.includes('day')) {
      await handleAddWorkoutDay(request);
      return;
    }

    if (request.includes('remove') && request.includes('day')) {
      await handleRemoveWorkoutDay(request);
      return;
    }
    
    setIsGenerating(true);
    try {
      const exercises = await generateWorkoutWithAI(customWorkoutRequest);
      
      if (!exercises || exercises.length === 0) {
        throw new Error('No exercises generated');
      }
      
      const customWorkout: WorkoutDay = {
        id: 'custom-' + Date.now(),
        title: 'Custom Workout',
        emoji: '⚡',
        description: customWorkoutRequest,
        exercises,
        completed: false,
        estimatedTime: Math.max(exercises.length * 8 + 10, 15)
      };
      
      // 🎯 Preserve user's selected day instead of overriding with 'custom'
      const targetDay = selectedDay || 'custom';
      setSelectedDay(targetDay);
      setWeeklySchedule(prev => ({ ...prev, [targetDay]: customWorkout }));
      setCurrentView('workout-detail');
      setCustomWorkoutRequest('');
      
      toast({
        title: "Custom Workout Generated!",
        description: `Created ${exercises.length} exercises for you.`,
      });
    } catch (error) {
      console.error('Custom workout generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate custom workout. Using backup exercises instead.",
        variant: "destructive"
      });
      
      // Fallback: create a basic workout using the request
      const fallbackExercises = generateFallbackExercises(customWorkoutRequest);
      const customWorkout: WorkoutDay = {
        id: 'custom-fallback-' + Date.now(),
        title: 'Custom Workout',
        emoji: '⚡',
        description: customWorkoutRequest,
        exercises: fallbackExercises,
        completed: false,
        estimatedTime: fallbackExercises.length * 8 + 10
      };
      
      // 🎯 Preserve user's selected day instead of overriding with 'custom'
      const targetDay = selectedDay || 'custom';
      setSelectedDay(targetDay);
      setWeeklySchedule(prev => ({ ...prev, [targetDay]: customWorkout }));
      setCurrentView('workout-detail');
      setCustomWorkoutRequest('');
    } finally {
      setIsGenerating(false);
    }
  };

  if (currentView === 'onboarding') {
    return (
      <div className="flex-1 overflow-auto p-4 bg-white">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Header with gradient banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white"
          >
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 pb-4 pt-4 px-6">
              <div className="text-center">
                <h1 className="text-xl font-semibold text-white flex items-center justify-center">
                  <Zap className="mr-2 h-5 w-5" />
                  Welcome to Thryvin' Workouts!
                </h1>
                <p className="text-purple-100 text-sm font-medium mt-1">Let's create your personalized AI workout plan</p>
              </div>
            </div>
          </motion.div>

          <div className="space-y-6">
            {/* Goal Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                What's your main goal?
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'muscle' as WorkoutGoal, label: 'Build Muscle', emoji: '💪' },
                  { value: 'fat-loss' as WorkoutGoal, label: 'Lose Fat', emoji: '🔥' },
                  { value: 'strength' as WorkoutGoal, label: 'Get Stronger', emoji: '⚡' },
                  { value: 'general' as WorkoutGoal, label: 'Stay Fit', emoji: '🏃‍♂️' }
                ].map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() => setPreferences(prev => ({ ...prev, goal: goal.value }))}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      preferences.goal === goal.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-purple-200'
                    }`}
                  >
                    <div className="text-2xl mb-2">{goal.emoji}</div>
                    <div className="font-medium">{goal.label}</div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Days per Week */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                How many days per week?
              </h3>
              <div className="flex gap-2">
                {[3, 4, 5, 6].map((days) => (
                  <button
                    key={days}
                    onClick={() => setPreferences(prev => ({ ...prev, daysPerWeek: days }))}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      preferences.daysPerWeek === days
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-purple-200'
                    }`}
                  >
                    <div className="font-bold">{days}</div>
                    <div className="text-sm">days</div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Equipment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-purple-600" />
                What equipment do you have?
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'gym' as Equipment, label: 'Full Gym', emoji: '🏋️‍♂️' },
                  { value: 'home' as Equipment, label: 'Home Gym', emoji: '🏠' },
                  { value: 'minimal' as Equipment, label: 'Basic Equipment', emoji: '⚖️' },
                  { value: 'bodyweight' as Equipment, label: 'No Equipment', emoji: '🤸‍♂️' }
                ].map((equipment) => (
                  <button
                    key={equipment.value}
                    onClick={() => setPreferences(prev => ({ ...prev, equipment: equipment.value }))}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      preferences.equipment === equipment.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-purple-200'
                    }`}
                  >
                    <div className="text-2xl mb-2">{equipment.emoji}</div>
                    <div className="font-medium">{equipment.label}</div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Experience Level */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-600" />
                Experience level?
              </h3>
              <div className="flex gap-2">
                {[
                  { value: 'beginner' as const, label: 'Beginner', emoji: '🌱' },
                  { value: 'intermediate' as const, label: 'Intermediate', emoji: '💪' },
                  { value: 'advanced' as const, label: 'Advanced', emoji: '🚀' }
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setPreferences(prev => ({ ...prev, experience: level.value }))}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      preferences.experience === level.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-purple-200'
                    }`}
                  >
                    <div className="text-xl mb-1">{level.emoji}</div>
                    <div className="font-medium text-sm">{level.label}</div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Restrictions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Any injuries or restrictions?</h3>
              <textarea
                value={preferences.restrictions}
                onChange={(e) => setPreferences(prev => ({ ...prev, restrictions: e.target.value }))}
                placeholder="Optional: Let us know about any injuries or exercises to avoid..."
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-purple-500"
                rows={3}
              />
            </motion.div>

            {/* Submit Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onClick={handleOnboardingSubmit}
              disabled={isGenerating}
              className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Your Plan...
                </div>
              ) : (
                'Create My Workout Plan'
              )}
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'weekly') {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    // Fix: Sunday should be index 6, Monday should be index 0
    const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;

    return (
      <div className="flex-1 overflow-auto p-4 bg-white">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Header with gradient banner */}
          <div className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 pb-4 pt-4 px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-white flex items-center">
                    <Dumbbell className="mr-2 h-5 w-5" />
                    Your Weekly Plan
                  </h1>
                  <p className="text-purple-100 text-sm font-medium mt-1">AI-powered personalized workouts</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode(viewMode === 'weekly' ? 'monthly' : 'weekly')}
                    className="px-3 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors text-sm font-medium border border-white/30"
                  >
                    {viewMode === 'weekly' ? '📅 Month' : '📊 Week'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {days.map((day, index) => {
              const workout = weeklySchedule[day];
              const isToday = index === todayIndex;

              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white rounded-xl p-4 shadow-sm border ${
                    isToday ? 'border-purple-300 bg-purple-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-gray-500 w-10">
                        {dayLabels[index]}
                        {isToday && <div className="text-xs text-purple-600 font-bold">TODAY</div>}
                      </div>
                      {workout ? (
                        <>
                          <div className="text-2xl">{workout.emoji}</div>
                          <div>
                            <div className="font-semibold text-gray-800">{workout.title}</div>
                            <div className="text-sm text-gray-500">
                              {workout.exercises.length} exercises • {workout.estimatedTime} min
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-400 font-medium flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Rest Day
                        </div>
                      )}
                    </div>
                    
                    {workout && (
                      <div className="flex items-center gap-2">
                        {workout.completed ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <Trophy className="w-4 h-4 text-yellow-500" />
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedDay(day);
                              setPreviousView('weekly');
                              setCurrentView('workout-detail');
                            }}
                            className="p-2 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="space-y-3">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">AI Coach</h3>
                  <p className="text-sm text-gray-600">Change your schedule anytime</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => setCustomWorkoutRequest("I want to change my workout days this week")}
                  className="p-3 bg-white rounded-lg text-sm font-medium hover:bg-white transition-colors border"
                >
                  📅 Change Days
                </button>
                <button
                  onClick={() => setCustomWorkoutRequest("Switch my Tuesday workout to Thursday")}
                  className="p-3 bg-white rounded-lg text-sm font-medium hover:bg-white transition-colors border"
                >
                  🔄 Move Workout
                </button>
                <button
                  onClick={() => setCustomWorkoutRequest("Make my workouts shorter this week")}
                  className="p-3 bg-white rounded-lg text-sm font-medium hover:bg-white transition-colors border"
                >
                  ⚡ Adjust Time
                </button>
                <button
                  onClick={() => setCustomWorkoutRequest("I want to focus more on cardio this week")}
                  className="p-3 bg-white rounded-lg text-sm font-medium hover:bg-white transition-colors border"
                >
                  🎯 Change Focus
                </button>
              </div>
              
              <div className="relative">
                <textarea
                  value={customWorkoutRequest}
                  onChange={(e) => setCustomWorkoutRequest(e.target.value)}
                  placeholder="Ask me anything: 'Move Monday to Wednesday', 'Make all workouts 20 minutes', 'Add a rest day', etc."
                  className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-purple-500 text-sm"
                  rows={3}
                />
                <button
                  onClick={handleCustomWorkout}
                  disabled={isGenerating || !customWorkoutRequest.trim()}
                  className="absolute bottom-2 right-2 p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <MessageCircle className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'workout-detail' && selectedDay) {
    const workout = weeklySchedule[selectedDay];
    if (!workout) return null;

    // Transform WorkoutDay to DailyWorkoutView's expected Workout format
    const transformedWorkout = {
      id: workout.id,
      title: workout.title,
      description: workout.description,
      duration: workout.estimatedTime,
      muscleGroups: [...new Set(workout.exercises.flatMap(ex => ex.muscles))],
      difficulty: workout.exercises[0]?.difficulty || 'intermediate',
      exercises: workout.exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        description: ex.instructions,
        sets: ex.sets,
        reps: typeof ex.reps === 'string' ? parseInt(ex.reps) || 10 : ex.reps,
        weight: ex.weight
      })),
      coachComments: 'Focus on form over speed. Take adequate rest between sets.'
    };

    return (
      <DailyWorkoutView
        workoutId={selectedDay}
        workout={transformedWorkout}
        workoutType={selectedWorkoutType} // 🎯 Pass actual workout type to fix generation mismatch
        onBack={() => setCurrentView(previousView)}
      />
    );
  }

  // Schedule Kickstart - Personal Week 1 Builder
  if (currentView === 'schedule-kickstart') {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeOptions = [
      { value: 'morning', label: 'Morning (6-10 AM)', emoji: '🌅' },
      { value: 'afternoon', label: 'Afternoon (12-5 PM)', emoji: '☀️' },
      { value: 'evening', label: 'Evening (6-9 PM)', emoji: '🌙' }
    ];
    const sessionOptions = [
      { value: 'short', label: '15-30 minutes', emoji: '⚡' },
      { value: 'medium', label: '30-45 minutes', emoji: '💪' },
      { value: 'long', label: '45-60 minutes', emoji: '🔥' }
    ];
    const focusOptions = [
      { value: 'strength', label: 'Strength Training', emoji: '💪' },
      { value: 'cardio', label: 'Cardio & Endurance', emoji: '🏃‍♂️' },
      { value: 'recovery', label: 'Recovery & Flexibility', emoji: '🧘‍♀️' },
      { value: 'mix', label: 'Mix It Up', emoji: '🎯' }
    ];

    const handleScheduleSubmit = async () => {
      if (schedulePreferences.availableDays.length === 0) {
        toast({
          title: "Select Training Days",
          description: "Please choose at least one day for your workouts.",
          variant: "destructive"
        });
        return;
      }

      setIsGenerating(true);
      try {
        // Generate personalized week 1 schedule based on detailed preferences
        const schedule = await generatePersonalizedWeek1(preferences, schedulePreferences);
        setWeeklySchedule(schedule);
        localStorage.setItem('thryvin-weekly-schedule', JSON.stringify(schedule));
        localStorage.setItem('thryvin-schedule-kickstart', 'completed');
        
        setCurrentView('weekly');
        
        toast({
          title: "Perfect Week 1 Created! 💡",
          description: "Your personalized schedule is ready. You can always adjust it!",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create schedule. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsGenerating(false);
      }
    };

    return (
      <div className="flex-1 overflow-auto p-4 bg-white">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Header with gradient banner */}
          <div className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 pb-4 pt-4 px-6">
              <div className="text-center">
                <h1 className="text-xl font-semibold text-white flex items-center justify-center">
                  <Target className="mr-2 h-5 w-5" />
                  Let's build your perfect week
                </h1>
                <p className="text-purple-100 text-sm font-medium mt-1">A few quick questions to create your ideal Week 1 plan</p>
              </div>
            </div>
          </div>

          {/* Available Days */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">What actual days are you free to train this week?</h3>
            <div className="grid grid-cols-2 gap-3">
              {daysOfWeek.map((day) => (
                <button
                  key={day}
                  onClick={() => {
                    const dayLower = day.toLowerCase();
                    setSchedulePreferences(prev => ({
                      ...prev,
                      availableDays: prev.availableDays.includes(dayLower)
                        ? prev.availableDays.filter(d => d !== dayLower)
                        : [...prev.availableDays, dayLower]
                    }))
                  }}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    schedulePreferences.availableDays.includes(day.toLowerCase())
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{day}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Time */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">What time of day works best for you?</h3>
            <div className="space-y-3">
              {timeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSchedulePreferences(prev => ({ ...prev, preferredTime: option.value as any }))}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    schedulePreferences.preferredTime === option.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{option.emoji}</span>
                    <div>
                      <div className="font-medium">{option.label}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Session Length */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">Do you want short or long sessions this week?</h3>
            <div className="space-y-3">
              {sessionOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSchedulePreferences(prev => ({ ...prev, sessionLength: option.value as any }))}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    schedulePreferences.sessionLength === option.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{option.emoji}</span>
                    <div>
                      <div className="font-medium">{option.label}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Weekly Focus */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">Do you want to focus more on strength, cardio, recovery, or mix it up?</h3>
            <div className="grid grid-cols-2 gap-3">
              {focusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSchedulePreferences(prev => ({ ...prev, weekFocus: option.value as any }))}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    schedulePreferences.weekFocus === option.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.emoji}</div>
                  <div className="font-medium text-sm">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleScheduleSubmit}
            disabled={isGenerating}
            className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isGenerating ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Building your perfect week...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Zap className="w-5 h-5" />
                <span>Create My Week 1 Plan</span>
              </div>
            )}
          </button>

          <div className="text-center text-sm text-gray-500">
            This is just for Week 1 and can be adjusted anytime
          </div>
        </div>
      </div>
    );
  }

  // Monthly view
  if (currentView === 'monthly') {
    const calendarWorkouts = transformToCalendarWorkouts(currentMonthView);
    
    // Function to handle workout completion toggle from monthly view
    const handleWorkoutCompletion = (date: Date, workout: any) => {
      if (!workout.dayName) return;
      
      const updatedSchedule = { ...weeklySchedule };
      if (updatedSchedule[workout.dayName]) {
        updatedSchedule[workout.dayName]!.completed = !updatedSchedule[workout.dayName]!.completed;
        setWeeklySchedule(updatedSchedule);
        localStorage.setItem('thryvin-weekly-schedule', JSON.stringify(updatedSchedule));
        
        toast({
          title: updatedSchedule[workout.dayName]!.completed ? "Workout Completed! 🎉" : "Workout Unmarked",
          description: updatedSchedule[workout.dayName]!.completed ? "Great job finishing your workout!" : "Workout marked as incomplete.",
        });
      }
    };
    
    return (
      <div className="flex-1 overflow-auto p-4 bg-white">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Monthly View</h1>
              <p className="text-sm text-gray-500">Plan your fitness journey</p>
            </div>
            <button
              onClick={() => setCurrentView('weekly')}
              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              📊 Week View
            </button>
          </div>
          
          <EnhancedMonthlyCalendar
            workouts={calendarWorkouts}
            onDateSelect={(date, workout) => {
              if (workout && workout.dayName) {
                // 🎯 FIXED: Use day name for consistency with storage system
                const dayMapping = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const dayName = dayMapping[date.getDay()];
                setSelectedDay(dayName);
                // 🎯 Store the actual workout type for proper generation
                setSelectedWorkoutType(workout.workoutType || workout.title || 'Full Body');
                setPreviousView('monthly');
                setCurrentView('workout-detail');
              } else {
                // No workout on this date
                toast({
                  title: "No Workout Scheduled",
                  description: "Use the weekly view to add workouts to your schedule.",
                });
              }
            }}
            onAddWorkout={(date) => {
              toast({
                title: "Add Workout",
                description: "Use the weekly view to customize your workout schedule.",
              });
            }}
            onEditWorkout={(date, workout) => {
              if (workout && workout.dayName) {
                // 🎯 FIXED: Use day name for consistency with storage system
                const dayMapping = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const dayName = dayMapping[date.getDay()];
                setSelectedDay(dayName);
                setPreviousView('monthly');
                setCurrentView('workout-detail');
              }
            }}
            onMoveWorkout={(fromDate, toDate) => {
              toast({
                title: "Move Workout",
                description: "Use the AI Coach in weekly view to move workouts between days.",
              });
            }}
            onToggleCompletion={handleWorkoutCompletion}
          />
        </div>
      </div>
    );
  }

  return null;
}