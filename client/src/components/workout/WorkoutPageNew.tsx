import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FitnessCategoryModal } from './FitnessCategoryModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth-v2';
import { useWorkoutStore } from '@/stores/workout-store';
import {
  Play,
  Clock,
  Timer,
  Target,
  Dumbbell,
  Heart,
  Flame,
  Star,
  Trophy,
  TrendingUp,
  Calendar,
  Activity,
  Brain,
  Zap,
  Check,
  PlayCircle,
  BookOpen,
  Sparkles,
  Settings,
  Edit,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { SamsungGalaxyCalendar } from './SamsungGalaxyCalendar';
import { PreWorkoutQuestionnaire, UserWorkoutProfile } from './PreWorkoutQuestionnaire';
import { NewWorkoutDayModal } from './NewWorkoutDayModal';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface WorkoutStats {
  weeklyGoal: number;
  completed: number;
  streak: number;
  totalMinutes: number;
  caloriesBurned: number;
}

interface TodaysWorkout {
  id: string;
  name: string;
  type: string;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  muscleGroups: string[];
  equipment: string[];
  description: string;
  isCompleted: boolean;
  emoji: string;
  exercises: {
    name: string;
    sets: number;
    reps: string;
    restTime: number;
  }[];
}

interface WorkoutAPIResponse {
  status: 'ready' | 'generating' | 'error';
  id?: string;
  name?: string;
  type?: string;
  duration?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  muscleGroups?: string[];
  description?: string;
  message?: string;
  error?: string;
}

interface FitnessCategory {
  id: string;
  name: string;
  icon: any;
  emoji: string;
  color: string;
  description: string;
  benefits: string[];
  workoutTypes: string[];
  videoThumbnails: string[];
}

interface WorkoutPageNewProps {
  onWorkoutSelect: (workoutId: string, date: Date) => void;
  onOpenChatWithMessage?: (message: string) => void;
  weeklySchedule?: any;
  userProfile?: any;
}

export const WorkoutPageNew: React.FC<WorkoutPageNewProps> = ({
  onWorkoutSelect,
  onOpenChatWithMessage,
  weeklySchedule,
  userProfile
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [workoutProfile, setWorkoutProfile] = useState<UserWorkoutProfile | null>(null);
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState<any>(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [selectedWorkoutIndex, setSelectedWorkoutIndex] = useState(0);
  const { toast } = useToast();
  
  const { 
    todayISO,
    today,
    week,
    loading: isLoadingWorkout,
    error: workoutError,
    loadWeek,
    loadToday
  } = useWorkoutStore();

  useEffect(() => {
    const loadWorkoutProfile = async () => {
      try {
        const response = await fetch('/api/user/workout-profile');
        if (response.ok) {
          const dbProfile = await response.json();
          if (dbProfile) {
            setWorkoutProfile(dbProfile);
            localStorage.setItem('thryvin-workout-profile', JSON.stringify(dbProfile));
            return;
          }
        }
      } catch (error) {
        console.error('Error loading profile from database:', error);
      }

      const savedProfile = localStorage.getItem('thryvin-workout-profile');
      if (savedProfile) {
        try {
          setWorkoutProfile(JSON.parse(savedProfile));
        } catch (error) {
          console.error('Error loading workout profile from localStorage:', error);
        }
      }
    };

    loadWorkoutProfile();
    loadWeek();
    loadToday();
  }, []);

  const todaysWorkout = today && today.status === 'ready' && today.payloadJson ? {
    id: today.date,
    name: today.title || 'Workout',
    type: 'workout',
    duration: today.payloadJson?.duration_min || 30,
    difficulty: 'medium' as const,
    muscleGroups: [],
    equipment: [],
    description: today.payloadJson?.coach_notes || '',
    isCompleted: false,
    emoji: '💪',
    exercises: []
  } as TodaysWorkout : null;

  const isGenerating = today?.status === 'generating' || today?.status === 'pending' || isLoadingWorkout;
  const fallbackWorkout: TodaysWorkout = {
    id: 'loading-workout',
    name: isGenerating ? '🤖 Creating your AI workout plan...' : (workoutError ? 'Sample Workout' : 'Loading Your AI Workout...'),
    type: userProfile?.trainingType || 'Full Body',
    duration: 30,
    difficulty: 'medium',
    muscleGroups: isGenerating ? ['✨ Personalizing...'] : (workoutError ? ['Full Body'] : ['Personalizing...']),
    equipment: isGenerating ? ['🤖 AI Generating...'] : (workoutError ? ['Bodyweight'] : ['AI Generating...']),
    description: isGenerating 
      ? '✨ Hang tight! Your personalized AI workout is being created based on your goals and preferences. This takes about 30 seconds.'
      : (workoutError 
        ? 'We had trouble generating your workout. This sample will help you get started while we work on your personalized plan.'
        : 'Your personalized AI workout is being generated based on your goals and preferences.'),
    isCompleted: false,
    emoji: isGenerating ? '🤖' : (workoutError ? '💪' : '🤖'),
    exercises: []
  };

  const workout = todaysWorkout ?? fallbackWorkout;
  
  const weeklyApiResponse = week ? { status: 'success', workouts: week } : null;
  const isLoadingWeekly = isLoadingWorkout;

  const fitnessCategories: FitnessCategory[] = [
    {
      id: 'strength',
      name: 'Strength',
      icon: Dumbbell,
      emoji: '💪',
      color: 'from-red-500 to-red-600',
      description: 'Build muscle, increase power, and develop functional strength through progressive resistance training.',
      benefits: ['Muscle Building', 'Bone Density', 'Metabolism Boost', 'Functional Power'],
      workoutTypes: ['Powerlifting', 'Bodybuilding', 'Olympic Lifting', 'Functional Training'],
      videoThumbnails: ['/api/placeholder/300/200', '/api/placeholder/300/200', '/api/placeholder/300/200']
    },
    {
      id: 'calisthenics',
      name: 'Calisthenics',
      icon: Activity,
      emoji: '🧗',
      color: 'from-blue-500 to-blue-600',
      description: 'Master your bodyweight with functional movement patterns and athletic skills.',
      benefits: ['Body Control', 'Flexibility', 'Core Strength', 'Mobility'],
      workoutTypes: ['Bodyweight Basics', 'Advanced Skills', 'Flow Training', 'Static Holds'],
      videoThumbnails: ['/api/placeholder/300/200', '/api/placeholder/300/200', '/api/placeholder/300/200']
    },
    {
      id: 'bodybuilding',
      name: 'Bodybuilding',
      icon: Trophy,
      emoji: '🏋️',
      color: 'from-orange-500 to-orange-600',
      description: 'Sculpt your physique with targeted muscle building and aesthetic focused training.',
      benefits: ['Muscle Definition', 'Symmetry', 'Aesthetic Goals', 'Body Composition'],
      workoutTypes: ['Split Training', 'Hypertrophy', 'Contest Prep', 'Isolation Work'],
      videoThumbnails: ['/api/placeholder/300/200', '/api/placeholder/300/200', '/api/placeholder/300/200']
    },
    {
      id: 'yoga',
      name: 'Yoga',
      icon: Brain,
      emoji: '🧘',
      color: 'from-teal-500 to-teal-600',
      description: 'Improve flexibility, balance, and mind-body connection through ancient practices.',
      benefits: ['Flexibility', 'Mental Clarity', 'Stress Relief', 'Balance'],
      workoutTypes: ['Vinyasa Flow', 'Restorative', 'Power Yoga', 'Yin Yoga'],
      videoThumbnails: ['/api/placeholder/300/200', '/api/placeholder/300/200', '/api/placeholder/300/200']
    },
    {
      id: 'endurance',
      name: 'Endurance',
      icon: Heart,
      emoji: '🏃',
      color: 'from-purple-500 to-purple-600',
      description: 'Build cardiovascular endurance and stamina for long-lasting performance.',
      benefits: ['Heart Health', 'Endurance', 'Mental Toughness', 'Recovery'],
      workoutTypes: ['Running', 'Cycling', 'Swimming', 'Dancing'],
      videoThumbnails: ['/api/placeholder/300/200', '/api/placeholder/300/200', '/api/placeholder/300/200']
    },
    {
      id: 'flexibility',
      name: 'Flexibility',
      icon: Zap,
      emoji: '🧎',
      color: 'from-green-500 to-green-600',
      description: 'Enhance mobility, prevent injury, and improve movement quality.',
      benefits: ['Injury Prevention', 'Mobility', 'Recovery', 'Movement Quality'],
      workoutTypes: ['Stretching', 'Mobility Work', 'Dynamic Warm-up', 'Recovery Sessions'],
      videoThumbnails: ['/api/placeholder/300/200', '/api/placeholder/300/200', '/api/placeholder/300/200']
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const startWorkout = () => {
    // Use the same data as weekly calendar navigation for consistency
    const today = new Date();
    
    // Find today's workout in the weekly schedule data (same as navigation arrows use)
    const todayData = weeklyScheduleData?.find(day => day.isToday);
    
    if (todayData) {
      // Use the proper weekly schedule data - same as handleWorkoutDaySelect
      const todayIndex = weeklyScheduleData.findIndex(day => day.isToday);
      setSelectedWorkoutIndex(todayIndex);
      handleWorkoutDaySelect(`workout-${todayIndex}`, todayData.date);
    } else {
      // Fallback to original behavior if weekly data not available
      const workoutData = {
        id: workout.id,
        name: workout.name,
        type: workout.type,
        date: today,
        duration: workout.duration,
        difficulty: workout.difficulty,
        muscleGroups: workout.muscleGroups,
        exercises: workout.exercises.map((exercise, index) => ({
          id: `exercise-${index}`,
          name: exercise.name,
          sets: exercise.sets,
          reps: typeof exercise.reps === 'string' ? parseInt(exercise.reps.split('-')[0]) || 12 : exercise.reps,
          restTime: exercise.restTime,
          instructions: `Perform ${exercise.name} with proper form.`,
          targetMuscles: workout.muscleGroups,
          isCompleted: false
        })),
        description: workout.description,
        coachNotes: "Focus on form over speed. Take your time with each movement.",
        isCompleted: workout.isCompleted
      };
      
      setSelectedWorkoutDay(workoutData);
      setShowWorkoutModal(true);
    }
  };

  const handleQuestionnaireComplete = (profile: UserWorkoutProfile) => {
    setWorkoutProfile(profile);
    // Regenerate today's workout based on new profile
    regenerateTodaysWorkout(profile);
  };

  const regenerateTodaysWorkout = async (profile: UserWorkoutProfile) => {
    try {
      // Call the AI workout generator with the new profile
      const response = await fetch('/api/generate-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workoutType: 'Full Body',
          workoutProfile: profile
        }),
      });

      if (response.ok) {
        const newWorkout = await response.json();
        // Update today's workout data with the AI-generated workout
        toast({
          title: "Workout Updated!",
          description: "Your workout has been personalized based on your preferences.",
        });
      }
    } catch (error) {
      console.error('Error regenerating workout:', error);
      toast({
        title: "Workout Updated!",
        description: "Your preferences have been saved. Next workout will be personalized.",
      });
    }
  };

  const handleWorkoutDaySelect = (workoutId: string, date: Date) => {
    // Find the index of the selected day
    const dayIndex = weeklyScheduleData.findIndex(day => 
      day.date.toDateString() === date.toDateString()
    );
    setSelectedWorkoutIndex(dayIndex >= 0 ? dayIndex : 0);
    
    // Show workout modal instantly with basic data, then load AI content in background
    const workoutName = getWorkoutNameForDate(date);
    
    const basicWorkoutData = {
      id: workoutId,
      name: workoutName,
      type: workoutName,
      date: date,
      duration: workoutProfile?.sessionDuration || 45,
      difficulty: 'medium' as const,
      muscleGroups: getBasicMuscleGroups(workoutName),
      exercises: generateExercisesForWorkout(workoutId, workoutName),
      description: 'AI-generated workout based on your preferences and goals.',
      coachNotes: getCoachNotesForWorkout(workoutId, workoutProfile),
      isCompleted: isPastDate(date),
      userNotes: '',
      rating: 0
    };

    setSelectedWorkoutDay(basicWorkoutData);
    setShowWorkoutModal(true);
    
    // Load AI content in background and update the modal
    loadAIWorkoutInBackground(workoutId, workoutName, date);
  };

  const handleSwipeLeft = () => {
    if (!weeklyScheduleData || weeklyScheduleData.length === 0) return;
    
    const prevIndex = selectedWorkoutIndex > 0 ? selectedWorkoutIndex - 1 : weeklyScheduleData.length - 1;
    const prevDay = weeklyScheduleData[prevIndex];
    
    if (!prevDay) return; // Safety check
    
    // Allow navigation to any day, including rest days
    setSelectedWorkoutIndex(prevIndex);
    handleWorkoutDaySelect('workout-' + prevIndex, prevDay.date);
  };

  const handleSwipeRight = () => {
    if (!weeklyScheduleData || weeklyScheduleData.length === 0) return;
    
    const nextIndex = selectedWorkoutIndex < weeklyScheduleData.length - 1 ? selectedWorkoutIndex + 1 : 0;
    const nextDay = weeklyScheduleData[nextIndex];
    
    if (!nextDay) return; // Safety check
    
    // Allow navigation to any day, including rest days
    setSelectedWorkoutIndex(nextIndex);
    handleWorkoutDaySelect('workout-' + nextIndex, nextDay.date);
  };

  const loadAIWorkoutInBackground = async (workoutId: string, workoutName: string, date: Date) => {
    try {
      const response = await fetch('/api/generate-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workoutType: workoutName,
          workoutProfile: workoutProfile,
          date: date.toISOString()
        }),
      });

      if (response.ok) {
        const aiWorkout = await response.json();
        
        const enhancedWorkoutData = {
          id: workoutId,
          name: workoutName,
          type: workoutName,
          date: date,
          duration: workoutProfile?.sessionDuration || 45,
          difficulty: 'medium' as const,
          muscleGroups: extractMuscleGroups(aiWorkout),
          exercises: convertAIExercisesToFormat(aiWorkout.exercises || []),
          description: aiWorkout.description || 'AI-generated workout based on your preferences and goals.',
          coachNotes: aiWorkout.coachNotes || getCoachNotesForWorkout(workoutId, workoutProfile),
          isCompleted: isPastDate(date),
          userNotes: '',
          rating: 0
        };

        // Update the modal with AI-generated content
        setSelectedWorkoutDay(enhancedWorkoutData);
      }
    } catch (error) {
      console.error('Error loading AI workout in background:', error);
      // Keep the basic workout data if AI fails
    }
  };

  const getBasicMuscleGroups = (workoutName: string): string[] => {
    if (workoutName.toLowerCase().includes('upper')) return ['Chest', 'Back', 'Arms'];
    if (workoutName.toLowerCase().includes('lower')) return ['Legs', 'Glutes'];
    if (workoutName.toLowerCase().includes('yoga')) return ['Flexibility', 'Core'];
    if (workoutName.toLowerCase().includes('hiit')) return ['Cardio', 'Full Body'];
    return ['Full Body'];
  };

  const getWorkoutNameForDate = (date: Date) => {
    const dayIndex = date.getDay();
    const workoutNames = ['Upper Body – Push', 'Lower Body Power', 'HIIT Cardio', 'Yoga Flow', 'Full Body', 'Upper Body – Pull', 'Active Recovery'];
    return workoutNames[dayIndex];
  };

  const generateExercisesForWorkout = (workoutId: string, workoutName?: string) => {
    const workoutType = workoutName || getWorkoutNameForDate(new Date());
    
    // Different exercise sets based on workout type
    const exerciseLibrary = {
      'Upper Body – Push': [
        {
          id: 'push-1',
          name: 'Push-ups',
          sets: 3,
          reps: 12,
          restTime: 60,
          instructions: 'Keep your body straight and lower until chest nearly touches ground',
          targetMuscles: ['Chest', 'Triceps', 'Shoulders'],
          modifications: 'Knee push-ups for beginners',
          isCompleted: false
        },
        {
          id: 'push-2',
          name: 'Overhead Press',
          sets: 3,
          reps: 10,
          restTime: 90,
          instructions: 'Press dumbbells or weights overhead while maintaining core stability',
          targetMuscles: ['Shoulders', 'Triceps'],
          modifications: 'Use lighter weights or resistance bands',
          isCompleted: false
        },
        {
          id: 'push-3',
          name: 'Chest Dips',
          sets: 3,
          reps: 8,
          restTime: 75,
          instructions: 'Lower your body between parallel bars or on a chair',
          targetMuscles: ['Chest', 'Triceps'],
          modifications: 'Assisted dips or tricep dips on a chair',
          isCompleted: false
        }
      ],
      'Lower Body Power': [
        {
          id: 'lower-1',
          name: 'Jump Squats',
          sets: 4,
          reps: 12,
          restTime: 60,
          instructions: 'Explode up from squat position and land softly',
          targetMuscles: ['Quadriceps', 'Glutes', 'Calves'],
          modifications: 'Regular squats without jumping',
          isCompleted: false
        },
        {
          id: 'lower-2',
          name: 'Bulgarian Split Squats',
          sets: 3,
          reps: 10,
          restTime: 75,
          instructions: 'Rear foot elevated, lower front leg until thigh is parallel',
          targetMuscles: ['Quadriceps', 'Glutes'],
          modifications: 'Use a chair for balance',
          isCompleted: false
        },
        {
          id: 'lower-3',
          name: 'Single-leg Deadlifts',
          sets: 3,
          reps: 8,
          restTime: 90,
          instructions: 'Hinge at hip, extend free leg back for balance',
          targetMuscles: ['Hamstrings', 'Glutes', 'Core'],
          modifications: 'Hold onto wall for balance',
          isCompleted: false
        }
      ],
      'HIIT Cardio': [
        {
          id: 'hiit-1',
          name: 'Burpees',
          sets: 4,
          reps: 10,
          restTime: 45,
          instructions: 'Drop to plank, jump feet to chest, jump up with arms overhead',
          targetMuscles: ['Full Body', 'Cardio'],
          modifications: 'Step back instead of jumping',
          isCompleted: false
        },
        {
          id: 'hiit-2',
          name: 'Mountain Climbers',
          sets: 4,
          reps: 20,
          restTime: 30,
          instructions: 'In plank position, rapidly alternate bringing knees to chest',
          targetMuscles: ['Core', 'Cardio'],
          modifications: 'Slower pace or step instead of run',
          isCompleted: false
        },
        {
          id: 'hiit-3',
          name: 'High Knees',
          sets: 4,
          reps: 30,
          restTime: 30,
          instructions: 'Run in place bringing knees up to hip level',
          targetMuscles: ['Cardio', 'Legs'],
          modifications: 'March in place with high knees',
          isCompleted: false
        }
      ],
      'Yoga Flow': [
        {
          id: 'yoga-1',
          name: 'Sun Salutation A',
          sets: 3,
          reps: 5,
          restTime: 30,
          instructions: 'Flow through mountain pose, forward fold, halfway lift, plank, chaturanga, upward dog, downward dog',
          targetMuscles: ['Flexibility', 'Core'],
          modifications: 'Hold each pose for 3 breaths if flow is too fast',
          isCompleted: false
        },
        {
          id: 'yoga-2',
          name: 'Warrior Sequence',
          sets: 2,
          reps: 8,
          restTime: 45,
          instructions: 'Flow between Warrior I, Warrior II, and Side Angle pose',
          targetMuscles: ['Legs', 'Flexibility'],
          modifications: 'Use a block under hand in side angle',
          isCompleted: false
        },
        {
          id: 'yoga-3',
          name: 'Twisted Triangle',
          sets: 2,
          reps: 6,
          restTime: 60,
          instructions: 'From triangle pose, reach top arm down and bottom arm up',
          targetMuscles: ['Core', 'Flexibility'],
          modifications: 'Use a block under bottom hand',
          isCompleted: false
        }
      ],
      'Full Body': [
        {
          id: 'full-1',
          name: 'Turkish Get-ups',
          sets: 3,
          reps: 5,
          restTime: 90,
          instructions: 'From lying down, get to standing while holding weight overhead',
          targetMuscles: ['Full Body', 'Core'],
          modifications: 'Practice without weight first',
          isCompleted: false
        },
        {
          id: 'full-2',
          name: 'Bear Crawls',
          sets: 3,
          reps: 10,
          restTime: 60,
          instructions: 'Crawl forward on hands and feet, keeping knees off ground',
          targetMuscles: ['Core', 'Shoulders', 'Legs'],
          modifications: 'Crawl with knees down',
          isCompleted: false
        },
        {
          id: 'full-3',
          name: 'Thrusters',
          sets: 3,
          reps: 12,
          restTime: 75,
          instructions: 'Squat with weights, then press overhead as you stand',
          targetMuscles: ['Legs', 'Shoulders', 'Core'],
          modifications: 'Use lighter weights or bodyweight only',
          isCompleted: false
        }
      ],
      'Upper Body – Pull': [
        {
          id: 'pull-1',
          name: 'Pull-ups',
          sets: 3,
          reps: 8,
          restTime: 90,
          instructions: 'Hang from bar and pull chest to bar',
          targetMuscles: ['Back', 'Biceps'],
          modifications: 'Assisted pull-ups or bodyweight rows',
          isCompleted: false
        },
        {
          id: 'pull-2',
          name: 'Bent-over Rows',
          sets: 3,
          reps: 12,
          restTime: 75,
          instructions: 'Hinge at hips, pull weights to chest',
          targetMuscles: ['Back', 'Biceps'],
          modifications: 'Use resistance bands',
          isCompleted: false
        },
        {
          id: 'pull-3',
          name: 'Face Pulls',
          sets: 3,
          reps: 15,
          restTime: 60,
          instructions: 'Pull band or cable to face level, squeezing shoulder blades',
          targetMuscles: ['Rear Delts', 'Upper Back'],
          modifications: 'Use lighter resistance',
          isCompleted: false
        }
      ]
    };

    // Get exercises for the specific workout type
    const workoutExercises = exerciseLibrary[workoutType as keyof typeof exerciseLibrary] || exerciseLibrary['Full Body'];

    // Filter exercises based on equipment and injuries
    return workoutExercises.filter(exercise => {
      if (workoutProfile?.injuries?.toLowerCase().includes('shoulder') && 
          exercise.targetMuscles.includes('Shoulders')) {
        return false;
      }
      return true;
    });
  };

  const getCoachNotesForWorkout = (workoutId: string, profile: UserWorkoutProfile | null) => {
    if (!profile) return 'Complete your workout preferences for personalized coaching notes.';
    
    let notes = `This workout is designed for your ${profile.fitnessGoal.replace('_', ' ')} goal. `;
    
    if (profile.injuries) {
      notes += `I've modified exercises to accommodate your ${profile.injuries}. `;
    }
    
    if (profile.sessionDuration < 30) {
      notes += 'This is a focused, time-efficient session perfect for your busy schedule. ';
    }
    
    return notes + 'Focus on proper form and listen to your body!';
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  // Helper functions for AI workout conversion
  const extractMuscleGroups = (aiWorkout: any): string[] => {
    if (!aiWorkout || !aiWorkout.exercises) return ['Full Body'];
    
    const muscles = new Set<string>();
    aiWorkout.exercises.forEach((exercise: any) => {
      if (exercise.targetMuscles && Array.isArray(exercise.targetMuscles)) {
        exercise.targetMuscles.forEach((muscle: string) => muscles.add(muscle));
      }
    });
    
    return Array.from(muscles).slice(0, 3); // Limit to 3 muscle groups for display
  };

  const convertAIExercisesToFormat = (exercises: any[]): any[] => {
    return exercises.map((exercise, index) => ({
      id: `ai-${Date.now()}-${index}`,
      name: exercise.name || `Exercise ${index + 1}`,
      sets: exercise.sets || 3,
      reps: exercise.reps || 12,
      restTime: parseInt(exercise.restTime) || 60,
      instructions: exercise.instructions || `Perform ${exercise.name} with proper form.`,
      targetMuscles: exercise.targetMuscles || ['General'],
      modifications: exercise.modifications || '',
      isCompleted: false
    }));
  };

  const handleWorkoutUpdate = (workout: any) => {
    // Save workout updates to localStorage or send to backend
    toast({
      title: "Workout Updated",
      description: "Your changes have been saved.",
    });
  };

  const handleMarkComplete = (workoutId: string) => {
    // Mark workout as complete
    toast({
      title: "Workout Complete!",
      description: "Great job! Your progress has been tracked.",
    });
  };

  // Generate mock workout data for calendar
  const getWorkoutData = () => {
    const workoutData: { [key: string]: any } = {};
    const today = new Date();
    
    for (let i = -7; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      
      if (i % 7 !== 0) { // Not every 7th day (rest days)
        const workoutTypes = ['Active Recovery', 'Lower Body Power', 'HIIT Cardio', 'Yoga Flow', 'Full Body'];
        workoutData[dateKey] = {
          completed: i < 0,
          workoutType: workoutTypes[Math.abs(i) % workoutTypes.length],
          muscleGroups: ['Full Body'],
          estimatedDuration: 30 + (Math.abs(i) % 3) * 15,
          difficulty: ['easy', 'medium', 'hard'][Math.abs(i) % 3],
          intensity: ['low', 'medium', 'high'][Math.abs(i) % 3],
          isRestDay: false
        };
      } else {
        workoutData[dateKey] = {
          completed: false,
          workoutType: 'Rest Day',
          muscleGroups: [],
          estimatedDuration: 0,
          difficulty: 'easy',
          intensity: 'low',
          isRestDay: true
        };
      }
    }
    
    return workoutData;
  };

  // Generate weekly schedule data
  // Transform API weekly workouts to calendar format
  const transformApiWeeklyToCalendar = (weeklyWorkouts: any) => {
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const today = new Date();
    const startOfWeek = new Date(today);
    // Fix: When today is Sunday (getDay() = 0), we want the Monday from 6 days ago
    const dayOffset = today.getDay() === 0 ? -6 : 1 - today.getDay();
    startOfWeek.setDate(today.getDate() + dayOffset);

    return daysOfWeek.map((dayName, index) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + index);
      
      const dayWorkout = weeklyWorkouts[dayName];
      const isToday = dayDate.toDateString() === today.toDateString();
      
      return {
        dayName: dayName.substring(0, 3).toUpperCase(),
        dayNumber: dayDate.getDate(),
        date: new Date(dayDate),
        isToday,
        workoutName: dayWorkout?.name || `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} Workout`,
        duration: dayWorkout?.duration || 30,
        isCompleted: dayWorkout?.isCompleted === true, // Only true if explicitly completed
        isRestDay: dayWorkout?.type?.toLowerCase() === 'rest' || dayWorkout?.name?.toLowerCase().includes('rest'),
        emoji: dayWorkout?.isCompleted ? '✅' : (isToday ? '🔥' : '💪'),
        difficulty: dayWorkout?.difficulty || 'medium',
        muscleGroups: dayWorkout?.muscleGroups || ['Full Body'],
        workoutData: dayWorkout // Store full workout data for easy access
      };
    });
  };

  const getWeeklySchedule = () => {
    const today = new Date();
    const weekData = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + i);
      
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today && !isToday;
      
      const workoutTypes = ['Upper Body', 'Lower Body', 'HIIT Cardio', 'Yoga', 'Full Body', 'Active Recovery', 'Rest'];
      const emoji = ['💪', '🦵', '🔥', '🧘', '⚡', '🚶', '😴'];
      
      weekData.push({
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        workoutName: workoutTypes[i],
        emoji: emoji[i],
        duration: i === 6 ? 0 : 30 + (i % 3) * 15,
        isToday,
        isPast,
        isCompleted: false, // Only show completed if explicitly marked as such
        isRestDay: i === 6
      });
    }
    
    return weekData;
  };

  // Transform API weekly data to calendar format - always use API data when available
  const weeklyScheduleData = weeklyApiResponse?.workouts 
    ? transformApiWeeklyToCalendar(weeklyApiResponse.workouts)
    : (isLoadingWeekly ? [] : getWeeklySchedule()); // Show empty while loading, fallback only if no data

  return (
    <div className="min-h-screen bg-white">

      {/* Session Banner */}
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-sm font-medium text-gray-600 mb-1">Today's Workout</h1>
              {/* Show actual workout title from weekly schedule */}
              <h3 className="text-lg font-semibold text-purple-600 mb-1">
                {getWorkoutNameForDate(new Date())}
              </h3>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{workout.name}</h2>
              <div className="flex items-center gap-3">
                <span className="text-gray-600">
                  {weeklyScheduleData?.find(day => day.isToday)?.duration || workout.duration} min
                </span>
                <span className="text-gray-600">
                  {weeklyScheduleData?.find(day => day.isToday)?.difficulty || workout.difficulty}
                </span>
                {(() => {
                  const todayWorkout = weeklyScheduleData?.find(day => day.isToday);
                  const muscleGroups = todayWorkout?.muscleGroups || workout.muscleGroups;
                  return muscleGroups.length > 0 && (
                    <div className="flex gap-1">
                      {muscleGroups.slice(0, 2).map((muscle: string, index: number) => (
                        <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                          {muscle}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
            <Button
              onClick={startWorkout}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-6 py-3 rounded-full shadow-lg"
            >
              Start Workout
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Calendar Section with View Toggle */}
      <div className="px-6 pb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Your Schedule</h2>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'weekly' | 'monthly')}>
            <TabsList className="grid w-[160px] grid-cols-2 bg-gray-100">
              <TabsTrigger value="weekly" className="data-[state=active]:bg-white data-[state=active]:text-purple-600">Week</TabsTrigger>
              <TabsTrigger value="monthly" className="data-[state=active]:bg-white data-[state=active]:text-purple-600">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Tabs value={viewMode} className="w-full">
          <TabsContent value="weekly" className="space-y-0">
            <div className="grid grid-cols-7 gap-2">
              {weeklyScheduleData.map((day, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative p-3 text-center cursor-pointer transition-all rounded-xl bg-white border border-gray-200 hover:border-gray-300"
                  onClick={() => handleWorkoutDaySelect('workout-' + index, day.date)}
                >
                  <div className="text-xs font-medium text-gray-600 mb-1">{day.dayName}</div>
                  <div className="text-lg font-semibold text-gray-900 mb-2">{day.dayNumber}</div>
                  
                  {/* Single status indicator dot */}
                  <div className="flex justify-center">
                    {day.isToday ? (
                      <div className="w-3 h-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full"></div>
                    ) : day.isCompleted ? (
                      <div className="w-3 h-3 bg-gradient-to-br from-green-500 to-green-600 rounded-full"></div>
                    ) : day.isRestDay ? (
                      <div className="w-3 h-3 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full"></div>
                    ) : day.date < new Date() ? (
                      <div className="w-3 h-3 bg-gradient-to-br from-red-500 to-red-600 rounded-full"></div>
                    ) : (
                      <div className="w-3 h-3 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full"></div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-0">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <SamsungGalaxyCalendar
                onDateSelect={(date) => handleWorkoutDaySelect(`workout-${date.getTime()}`, date)}
                onWorkoutComplete={(date) => console.log('Workout completed:', date)}
                workoutData={getWorkoutData()}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Explore Fitness - Simple Design */}
      <div className="px-6 pb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Explore fitness</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { 
              id: 'strength', 
              name: 'Strength', 
              icon: '🏋️', 
              color: 'from-purple-500 to-blue-500',
              keyFeatures: ['Progressive overload', 'Compound movements', 'Muscle building focus'],
              videoCount: 45,
              avgDuration: '35 min'
            },
            { 
              id: 'calisthenics', 
              name: 'Calisthenics', 
              icon: '🤸', 
              color: 'from-pink-500 to-red-500',
              keyFeatures: ['No equipment needed', 'Functional strength', 'Progressive skills'],
              videoCount: 55,
              avgDuration: '30 min'
            },
            { 
              id: 'hiit', 
              name: 'HIIT', 
              icon: '⚡', 
              color: 'from-purple-600 to-purple-400',
              keyFeatures: ['Fat burning focus', 'Quick sessions', 'High intensity'],
              videoCount: 47,
              avgDuration: '20 min'
            },
            { 
              id: 'core', 
              name: 'Core', 
              icon: '🧘', 
              color: 'from-orange-500 to-pink-500',
              keyFeatures: ['Core strengthening', 'Posture improvement', 'Low-impact exercise'],
              videoCount: 31,
              avgDuration: '25 min'
            },
            { 
              id: 'mobility', 
              name: 'Mobility', 
              icon: '🤸‍♀️', 
              color: 'from-cyan-500 to-blue-500',
              keyFeatures: ['Flexibility improvement', 'Injury prevention', 'Movement quality'],
              videoCount: 28,
              avgDuration: '20 min'
            },
            { 
              id: 'conditioning', 
              name: 'Conditioning', 
              icon: '💪', 
              color: 'from-blue-600 to-purple-600',
              keyFeatures: ['Cardiovascular health', 'Endurance building', 'Athletic performance'],
              videoCount: 39,
              avgDuration: '30 min'
            },
          ].map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`bg-gradient-to-br ${category.color} rounded-3xl p-6 text-white cursor-pointer shadow-lg`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category.icon}</span>
                <span className="font-semibold text-lg">{category.name}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Fitness Category Detail Modal */}
      <FitnessCategoryModal
        isOpen={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        category={fitnessCategories.find(c => c.id === selectedCategory) || null}
        onStartWorkout={(categoryId) => {
          console.log('🔥 STARTING AI WORKOUT FOR CATEGORY:', categoryId);
          setSelectedCategory(null);
          // Here you would integrate with your AI workout generation
        }}
      />


      {/* Pre-Workout Questionnaire */}
      <PreWorkoutQuestionnaire
        isOpen={showQuestionnaire}
        onClose={() => setShowQuestionnaire(false)}
        onComplete={handleQuestionnaireComplete}
        existingProfile={workoutProfile}
      />

      {/* Workout Day Modal */}
      <NewWorkoutDayModal
        isOpen={showWorkoutModal}
        onClose={() => setShowWorkoutModal(false)}
        workoutData={selectedWorkoutDay ? {
          id: selectedWorkoutDay.id || `workout-${Date.now()}`,
          name: selectedWorkoutDay.name || "Today's Workout",
          type: selectedWorkoutDay.type || "General",
          date: selectedWorkoutDay.date || new Date(),
          duration: selectedWorkoutDay.duration || 30,
          difficulty: selectedWorkoutDay.difficulty || 'medium' as const,
          muscleGroups: selectedWorkoutDay.muscleGroups || ['Full Body'],
          exercises: selectedWorkoutDay.exercises || [],
          description: selectedWorkoutDay.description || "A great workout session",
          coachNotes: selectedWorkoutDay.coachNotes || "Focus on form!",
          isCompleted: selectedWorkoutDay.isCompleted || false
        } : null}
        onWorkoutUpdate={handleWorkoutUpdate}
        onMarkComplete={handleMarkComplete}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
      />
    </div>
  );
};