import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Target, 
  Brain, 
  Zap, 
  CheckCircle, 
  SkipForward, 
  RotateCcw,
  MessageCircle,
  X,
  Trophy,
  Mic,
  MicOff,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { validateWorkoutDay, transformToWorkoutDay, generateStaticWorkout, type WorkoutDay } from '../../contracts/workoutDay';
import { useWorkoutStore } from '@/stores/workout-store';

// FEATURE FLAG: Disable AI temporarily while stabilizing
const AI_ENABLED = false;

interface Exercise {
  id: string;
  name: string;
  description: string;
  sets: number;
  reps: number;
  weight?: number;
  aiProgression?: {
    type: 'increase' | 'decrease' | 'maintain';
    aiTip: string;
  };
  weightSuggestion?: string;
  isCompleted?: boolean;
}

interface Workout {
  id: string;
  title: string;
  description: string;
  duration: number;
  muscleGroups: string[];
  difficulty: string;
  exercises: Exercise[];
  coachComments?: string;
}

interface DailyWorkoutViewProps {
  workoutId?: string;
  workout?: Workout;
  workoutType?: string; // 🎯 Add workout type prop to fix generation mismatch
  onBack: () => void;
  className?: string;
}

const DailyWorkoutView: React.FC<DailyWorkoutViewProps> = ({ workoutId, workout: propWorkout, workoutType, onBack }) => {
  const [workout, setWorkout] = useState<Workout | null>(propWorkout || null);
  const [isLoadingWorkout, setIsLoadingWorkout] = useState(false);
  
  const { selectedDateISO, daysByDate, setSelectedDate, today } = useWorkoutStore();
  
  const todaysWorkoutData = daysByDate[selectedDateISO];
  const globalWorkoutTitle = todaysWorkoutData?.meta?.title || todaysWorkoutData?.payload?.title;
  
  const [warmupExercises, setWarmupExercises] = useState<any[]>([]);
  const [recoveryExercises, setRecoveryExercises] = useState<any[]>([]);
  const [isLoadingWarmup, setIsLoadingWarmup] = useState(false);
  const [isLoadingRecovery, setIsLoadingRecovery] = useState(false);
  
  // 🎯 Prev/Next navigation handlers that only call setSelectedDate
  const handlePrevDay = () => {
    if (!selectedDateISO) return; // 🛡️ Edge-case guard
    const currentDate = new Date(selectedDateISO);
    currentDate.setDate(currentDate.getDate() - 1);
    const prevISO = currentDate.toISOString().split('T')[0];
    setSelectedDate(prevISO);
  };
  
  const handleNextDay = () => {
    if (!selectedDateISO) return; // 🛡️ Edge-case guard
    const currentDate = new Date(selectedDateISO);
    currentDate.setDate(currentDate.getDate() + 1);
    const nextISO = currentDate.toISOString().split('T')[0];
    setSelectedDate(nextISO);
  };
  
  useEffect(() => {
    if (today && today.status === 'ready' && today.payloadJson?.blocks) {
      console.log('✅ DailyWorkoutView: Using API workout data:', today.title);
      const { blocks, title, duration_min, coach_notes } = today.payloadJson;
      
      const warmupBlock = blocks.find(b => b.type === 'warmup');
      const mainBlock = blocks.find(b => b.type === 'main');
      const recoveryBlock = blocks.find(b => b.type === 'recovery');
      
      if (warmupBlock) {
        const warmupExs = warmupBlock.items.map((item: any, idx: number) => ({
          id: `warmup-${idx}`,
          name: item.name,
          instructions: `${item.sets} sets × ${item.reps} reps`,
          target: 'Warm-up',
          duration: `${item.rest_sec || 30}s rest`
        }));
        setWarmupExercises(warmupExs);
      }
      
      if (recoveryBlock) {
        const recoveryExs = recoveryBlock.items.map((item: any, idx: number) => ({
          id: `recovery-${idx}`,
          name: item.name,
          instructions: `${item.sets} sets × ${item.reps} reps`,
          target: 'Recovery',
          duration: `${item.rest_sec || 30}s rest`
        }));
        setRecoveryExercises(recoveryExs);
      }
      
      if (mainBlock) {
        const transformedWorkout: Workout = {
          id: today.date,
          title: title || 'Workout',
          description: coach_notes || 'AI-generated workout',
          duration: duration_min || 30,
          muscleGroups: ['Full Body'],
          difficulty: 'intermediate',
          exercises: mainBlock.items.map((item: any) => ({
            id: String(item.exercise_id),
            name: item.name,
            description: `${item.sets} sets × ${item.reps} reps`,
            sets: item.sets,
            reps: typeof item.reps === 'string' ? parseInt(item.reps) || 10 : item.reps,
            weight: item.load
          })),
          coachComments: coach_notes
        };
        setWorkout(transformedWorkout);
        console.log('✅ Loaded from API:', transformedWorkout.exercises.length, 'exercises');
      }
      
      setIsLoadingWorkout(false);
      return;
    }
    
    if (propWorkout) {
      console.log('✅ DailyWorkoutView: Using provided workout prop:', propWorkout.title);
      
      const validatedWorkout = transformToWorkoutDay(propWorkout);
      if (validatedWorkout) {
        console.log('✅ Workout contract validation passed:', validatedWorkout.blocks.length, 'blocks');
        const transformedWorkout: Workout = {
          id: propWorkout.id,
          title: validatedWorkout.title,
          description: validatedWorkout.coach_notes || 'AI-generated workout',
          duration: validatedWorkout.duration_min,
          muscleGroups: propWorkout.muscleGroups || ['Full Body'],
          difficulty: propWorkout.difficulty || 'intermediate',
          exercises: (
            validatedWorkout.blocks.find(block => ['main', 'workout', 'primary', 'sets'].includes(block.type)) ||
            validatedWorkout.blocks.find(block => block.items && block.items.length > 0)
          )?.items.map(item => ({
              id: String(item.exercise_id),
              name: item.name,
              description: `${item.sets} sets of ${item.reps}`,
              sets: item.sets,
              reps: typeof item.reps === 'string' ? parseInt(item.reps) || 10 : item.reps,
              weight: item.load ? parseInt(String(item.load)) || undefined : undefined
            })) || [],
          coachComments: validatedWorkout.coach_notes
        };
        setWorkout(transformedWorkout);
        console.log('✅ Transformed workout has', transformedWorkout.exercises.length, 'exercises');
      } else {
        console.warn('❌ Workout failed validation, using static fallback');
        const staticWorkout = generateStaticWorkout();
        const fallbackWorkout: Workout = {
          id: 'static-fallback',
          title: staticWorkout.title,
          description: staticWorkout.coach_notes || 'Static workout',
          duration: staticWorkout.duration_min,
          muscleGroups: ['Full Body'],
          difficulty: 'intermediate',
          exercises: staticWorkout.blocks
            .find(block => block.type === 'main')?.items.map(item => ({
              id: String(item.exercise_id),
              name: item.name,
              description: `${item.sets} sets of ${item.reps}`,
              sets: item.sets,
              reps: typeof item.reps === 'string' ? parseInt(item.reps) || 10 : item.reps,
              weight: undefined
            })) || [],
          coachComments: staticWorkout.coach_notes
        };
        setWorkout(fallbackWorkout);
        console.log('✅ Static fallback has', fallbackWorkout.exercises.length, 'exercises');
      }
      setIsLoadingWorkout(false);
      return;
    }

    // Only fetch from localStorage if no workout prop is provided
    if (!propWorkout && workoutId) {
      console.log('🔍 DailyWorkoutView: No workout prop provided, fetching from localStorage for:', workoutId);
      setIsLoadingWorkout(true);
      
      const fetchWorkoutData = async () => {
        try {
          // 🎯 SIMPLIFIED: Direct day-name lookup for consistency with unified system
          const { CalendarPreGenerationService } = await import('../../services/CalendarPreGeneration');
          
          console.log('🔍 DailyWorkoutView: Loading workout for day:', workoutId);
          // Use direct day name lookup since we've unified on day-name keys
          let workoutDay = CalendarPreGenerationService.loadWorkoutByDayName(workoutId);
          
          if (workoutDay) {
            console.log('✅ DailyWorkoutView: Found workout in localStorage:', workoutDay.title);
            // Transform WorkoutDay to Workout format
            const transformedWorkout: Workout = {
              id: workoutDay.id,
              title: workoutDay.title,
              description: workoutDay.description,
              duration: workoutDay.estimatedTime,
              muscleGroups: Array.from(new Set(workoutDay.exercises.flatMap((ex: any) => ex.muscles))),
              difficulty: workoutDay.exercises[0]?.difficulty || 'intermediate',
              exercises: workoutDay.exercises.map((ex: any) => ({
                id: ex.id,
                name: ex.name,
                description: ex.instructions,
                sets: ex.sets,
                reps: typeof ex.reps === 'string' ? parseInt(ex.reps) || 10 : ex.reps,
                weight: ex.weight
              })),
              coachComments: 'Focus on form over speed. Take adequate rest between sets.'
            };
            setWorkout(transformedWorkout);
            setIsLoadingWorkout(false);
            return;
          } else {
            console.warn('⚠️ DailyWorkoutView: Workout not found for day:', workoutId);
          }
          
          // Only generate new workout as absolute last resort and log it clearly
          if (AI_ENABLED) {
            console.warn('🔥 DailyWorkoutView: LAST RESORT - Generating new AI workout for:', workoutId);
            const response = await fetch('/api/generate-workout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workoutType: workoutType || 'Full Body', // 🎯 Use actual workout type instead of hardcoding
              workoutProfile: {
                sessionDuration: 45,
                experienceLevel: 'intermediate'
              }
            })
          });

          if (response.ok) {
            const aiWorkout = await response.json();
            const transformedWorkout: Workout = {
              id: workoutId || 'generated-workout',
              title: aiWorkout.title || (workoutType ? `${workoutType} Workout` : 'Personalized Workout'),
              description: aiWorkout.description || 'Personalized AI workout',
              duration: aiWorkout.estimatedDuration || 45,
              muscleGroups: Array.from(new Set(aiWorkout.exercises.flatMap((ex: any) => ex.targetMuscles))),
              difficulty: aiWorkout.difficulty || 'intermediate',
              exercises: aiWorkout.exercises.map((ex: any, index: number) => ({
                id: `exercise-${index}`,
                name: ex.name,
                description: ex.instructions,
                sets: ex.sets || 3,
                reps: ex.reps || 10,
                weight: ex.weight
              })),
              coachComments: aiWorkout.coachNotes || 'Focus on form over speed. Take adequate rest between sets.'
            };
            setWorkout(transformedWorkout);
            console.log('🤖 DailyWorkoutView: Generated new AI workout:', transformedWorkout.title);

            // Save generated workout back to weekly schedule for persistence
            if (workoutId) {
              const storedSchedule = localStorage.getItem('thryvin-weekly-schedule');
              if (storedSchedule) {
                const schedule = JSON.parse(storedSchedule);
                
                // Transform workout back to WorkoutDay format for schedule storage
                const workoutDay = {
                  id: transformedWorkout.id,
                  title: transformedWorkout.title,
                  emoji: '🤖', // AI generated workout emoji
                  description: transformedWorkout.description,
                  estimatedTime: transformedWorkout.duration,
                  completed: false,
                  exercises: transformedWorkout.exercises.map(ex => ({
                    id: ex.id,
                    name: ex.name,
                    instructions: ex.description,
                    sets: ex.sets,
                    reps: ex.reps.toString(),
                    rest: '60s',
                    muscles: transformedWorkout.muscleGroups,
                    difficulty: transformedWorkout.difficulty,
                    weight: ex.weight
                  }))
                };
                
                // 🎯 FIXED: Store with proper key format (ISO date or fallback to workoutId)
                const storageKey = workoutId.includes('-') && !isNaN(Date.parse(workoutId)) 
                  ? workoutId // Already ISO date format
                  : workoutId; // Keep original workoutId for backward compatibility
                
                schedule[storageKey] = workoutDay;
                localStorage.setItem('thryvin-weekly-schedule', JSON.stringify(schedule));
                console.log('💾 DailyWorkoutView: Saved generated workout to schedule with key:', storageKey);
              }
            }
            } else {
              throw new Error('Failed to generate workout');
            }
          } else {
            // AI disabled - use static fallback immediately
            throw new Error('AI generation disabled during stabilization');
          }
        } catch (error) {
          console.error('❌ DailyWorkoutView: Error fetching/generating workout:', error);
          // 🎯 STEP 2: Comprehensive safe fallback workout
          const comprehensiveFallbackWorkout = {
            id: workoutId || 'comprehensive-fallback-workout',
            title: 'Complete Body Workout',
            description: 'A well-rounded bodyweight routine targeting all major muscle groups',
            duration: 35,
            muscleGroups: ['Full Body'],
            difficulty: 'intermediate',
            exercises: [
              {
                id: 'push-ups',
                name: 'Push-ups',
                description: 'Standard push-ups targeting chest, shoulders, and triceps. Keep core tight.',
                sets: 3,
                reps: 12
              },
              {
                id: 'squats',
                name: 'Bodyweight Squats',
                description: 'Deep squats for leg and glute strength. Keep chest up and knees behind toes.',
                sets: 3,
                reps: 15
              },
              {
                id: 'mountain-climbers',
                name: 'Mountain Climbers',
                description: 'Dynamic cardio movement. Start in plank, alternate bringing knees to chest.',
                sets: 3,
                reps: 20
              },
              {
                id: 'plank-hold',
                name: 'Plank Hold',
                description: 'Core strengthening hold. Maintain straight line from head to heels. Hold for 30 seconds.',
                sets: 3,
                reps: 1
              },
              {
                id: 'burpees',
                name: 'Burpees',
                description: 'Full-body explosive movement. Squat, jump back, push-up, jump forward, jump up.',
                sets: 2,
                reps: 8
              }
            ],
            coachComments: 'Complete workout targeting strength, cardio, and core. Rest 45-60 seconds between sets. Modify exercises as needed for your fitness level.'
          };
          
          setWorkout(comprehensiveFallbackWorkout);
          console.log('🏠 DailyWorkoutView: Using basic fallback workout');
        } finally {
          setIsLoadingWorkout(false);
        }
      };

      fetchWorkoutData();
    }
  }, [workoutId, propWorkout, today]);

  // State declarations
  const [currentPhase, setCurrentPhase] = useState(0); // 0: warm-up, 1: workouts, 2: recovery
  const [savedExercises, setSavedExercises] = useState<Set<string>>(new Set());
  const [skippedExercises, setSkippedExercises] = useState<Set<string>>(new Set());

  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [showCoachFeedback, setShowCoachFeedback] = useState(false);
  const [showCoachChat, setShowCoachChat] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [showRecoveryPage, setShowRecoveryPage] = useState(false);
  const [performanceData, setPerformanceData] = useState<Record<string, any>>({});
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapExerciseId, setSwapExerciseId] = useState<string>('');
  const [swapReason, setSwapReason] = useState('');
  const [suggestedAlternative, setSuggestedAlternative] = useState<Exercise | null>(null);
  const [isLoadingSwap, setIsLoadingSwap] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [currentExerciseForVoice, setCurrentExerciseForVoice] = useState<string>('');
  
  // Exit confirmation state
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  
  // Swiping workflow state
  const [warmupCompleted, setWarmupCompleted] = useState(false);
  const [mainWorkoutCompleted, setMainWorkoutCompleted] = useState(false);

  // Function to generate workout-specific warmup using AI
  const generateWorkoutSpecificWarmup = async (workoutData: Workout): Promise<any[]> => {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Generate a specific warmup routine for this workout: "${workoutData.title}" which targets ${workoutData.muscleGroups.join(', ')} and has ${workoutData.difficulty} difficulty level. The workout includes exercises like: ${workoutData.exercises.map(e => e.name).slice(0, 3).join(', ')}. Create 2-3 warmup exercises that specifically prepare the body for these movements and muscle groups.`,
          context: {
            currentWorkout: {
              title: workoutData.title,
              muscleGroups: workoutData.muscleGroups,
              difficulty: workoutData.difficulty,
              duration: workoutData.duration,
              exercises: workoutData.exercises.slice(0, 3) // Send first 3 exercises for context
            }
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate warmup');
      }
      
      const data = await response.json();
      const warmupText = data.response || data.content || '';
      
      // Parse AI response to extract warmup exercises or create structured warmup
      return parseWarmupResponse(warmupText, workoutData.muscleGroups);
      
    } catch (error) {
      console.error('Error generating AI warmup:', error);
      console.log('🔄 Trying enhanced AI warmup generation as fallback...');
      try {
        return await generateAIWarmupWithRetry(workoutData);
      } catch (retryError) {
        console.error('🚫 All AI warmup attempts failed, using minimal placeholder');
        return [{
          id: 'warmup-minimal-placeholder',
          name: 'Movement Preparation',
          instructions: 'Gentle movements to prepare your body. AI generation will be restored shortly.',
          target: workoutData.muscleGroups.join(', ') || 'Full Body',
          duration: '3-5 minutes'
        }];
      }
    }
  };

  // Function to generate workout-specific recovery using AI
  const generateWorkoutSpecificRecovery = async (workoutData: Workout, completedExercises: string[]): Promise<any[]> => {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Generate a specific recovery/cooldown routine for this completed workout: "${workoutData.title}" which targeted ${workoutData.muscleGroups.join(', ')}. The user completed ${completedExercises.length} exercises including: ${workoutData.exercises.filter(e => completedExercises.includes(e.id)).map(e => e.name).slice(0, 3).join(', ')}. Create 3-4 recovery exercises that specifically help cool down these worked muscle groups and promote recovery.`,
          context: {
            currentWorkout: {
              title: workoutData.title,
              muscleGroups: workoutData.muscleGroups,
              difficulty: workoutData.difficulty,
              completedExercises: completedExercises.length,
              targetedMuscles: workoutData.muscleGroups
            }
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate recovery');
      }
      
      const data = await response.json();
      const recoveryText = data.response || data.content || '';
      
      // Parse AI response to extract recovery exercises or create structured recovery
      return parseRecoveryResponse(recoveryText, workoutData.muscleGroups);
      
    } catch (error) {
      console.error('Error generating AI recovery:', error);
      console.log('🔄 Trying enhanced AI recovery generation as fallback...');
      try {
        return await generateAIRecoveryWithRetry(workoutData);
      } catch (retryError) {
        console.error('🚫 All AI recovery attempts failed, using minimal placeholder');
        return [{
          id: 'recovery-minimal-placeholder',
          name: 'Recovery Sequence',
          instructions: 'Gentle recovery movements to help your body cool down. AI generation will be restored shortly.',
          target: workoutData.muscleGroups.join(', ') || 'Full Body Recovery',
          duration: '3-5 minutes'
        }];
      }
    }
  };

  // Helper function to parse warmup response and create structured data
  const parseWarmupResponse = (aiResponse: string, muscleGroups: string[]): any[] => {
    const defaultWarmups = [
      {
        id: 'ai-warmup-1',
        name: 'Dynamic Movement Prep',
        instructions: 'Perform dynamic movements targeting the primary muscle groups for today\'s workout',
        target: muscleGroups.join(' & ') || 'Primary Muscles',
        duration: '3-4 minutes'
      },
      {
        id: 'ai-warmup-2',
        name: 'Joint Mobility',
        instructions: 'Gentle joint rotations and mobility exercises to prepare for the workout movements',
        target: 'Joint Health & Mobility',
        duration: '2-3 minutes'
      }
    ];

    // Try to extract structured exercises from AI response
    try {
      const exercises = [];
      let exerciseCounter = 1;
      
      // Simple parsing logic - look for numbered items or common exercise patterns
      const lines = aiResponse.split('\n').filter(line => line.trim());
      let currentExercise: any = null;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Check if this looks like an exercise name/title
        if (/^\d+\./.test(trimmedLine) || trimmedLine.includes('Exercise') || trimmedLine.includes(':')) {
          // Save previous exercise if exists
          if (currentExercise) {
            exercises.push(currentExercise);
            exerciseCounter++;
          }
          
          // Start new exercise
          const name = trimmedLine.replace(/^\d+\.\s*/, '').replace(/:.*$/, '').trim();
          currentExercise = {
            id: `ai-warmup-${exerciseCounter}`,
            name: name || `Warmup Exercise ${exerciseCounter}`,
            instructions: '',
            target: muscleGroups[0] || 'Target Muscles',
            duration: '2-3 minutes'
          };
        } else if (currentExercise && trimmedLine.length > 10) {
          // Add to instructions
          currentExercise.instructions += (currentExercise.instructions ? ' ' : '') + trimmedLine;
          
          // Extract duration if mentioned
          const durationMatch = trimmedLine.match(/\b(\d+[-\s]\d+)\s*(?:min|sec|minute|second)/i);
          if (durationMatch) {
            currentExercise.duration = durationMatch[0];
          }
        }
      }
      
      // Add the last exercise
      if (currentExercise) {
        exercises.push(currentExercise);
      }
      
      return exercises.length >= 2 ? exercises.slice(0, 3) : defaultWarmups;
      
    } catch (error) {
      console.error('Error parsing warmup response:', error);
      return defaultWarmups;
    }
  };

  // Helper function to parse recovery response and create structured data
  const parseRecoveryResponse = (aiResponse: string, muscleGroups: string[]): any[] => {
    const defaultRecovery = [
      {
        id: 'ai-recovery-1',
        name: 'Targeted Muscle Stretches',
        instructions: 'Gentle stretches focusing on the muscles worked during today\'s session',
        target: muscleGroups.join(' & ') || 'Worked Muscles',
        duration: '2-3 minutes'
      },
      {
        id: 'ai-recovery-2',
        name: 'Deep Breathing & Relaxation',
        instructions: 'Slow, deep breathing exercises to help your heart rate return to normal and promote recovery',
        target: 'Cardiovascular Recovery',
        duration: '2-3 minutes'
      },
      {
        id: 'ai-recovery-3',
        name: 'Hydration & Reflection',
        instructions: 'Drink water slowly and take a moment to appreciate the work you just completed',
        target: 'Recovery & Mindfulness',
        duration: '2-3 minutes'
      }
    ];

    // Similar parsing logic as warmup
    try {
      const exercises = [];
      let exerciseCounter = 1;
      
      const lines = aiResponse.split('\n').filter(line => line.trim());
      let currentExercise: any = null;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (/^\d+\./.test(trimmedLine) || trimmedLine.includes('Exercise') || trimmedLine.includes(':')) {
          if (currentExercise) {
            exercises.push(currentExercise);
            exerciseCounter++;
          }
          
          const name = trimmedLine.replace(/^\d+\.\s*/, '').replace(/:.*$/, '').trim();
          currentExercise = {
            id: `ai-recovery-${exerciseCounter}`,
            name: name || `Recovery Exercise ${exerciseCounter}`,
            instructions: '',
            target: muscleGroups[0] || 'Recovery Focus',
            duration: '1-2 minutes'
          };
        } else if (currentExercise && trimmedLine.length > 10) {
          currentExercise.instructions += (currentExercise.instructions ? ' ' : '') + trimmedLine;
          
          const durationMatch = trimmedLine.match(/\b(\d+[-\s]\d+)\s*(?:min|sec|minute|second)/i);
          if (durationMatch) {
            currentExercise.duration = durationMatch[0];
          }
        }
      }
      
      if (currentExercise) {
        exercises.push(currentExercise);
      }
      
      return exercises.length >= 2 ? exercises.slice(0, 4) : defaultRecovery;
      
    } catch (error) {
      console.error('Error parsing recovery response:', error);
      return defaultRecovery;
    }
  };

  // AI-powered warmup generation with intelligent retries
  const generateAIWarmupWithRetry = async (workout: Workout, maxRetries: number = 3): Promise<any[]> => {
    console.log(`🔥 Generating AI warmup for workout: "${workout.title}"`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 AI Warmup Generation - Attempt ${attempt}/${maxRetries}`);
        
        // Create progressively simpler prompts for retries
        let prompt = '';
        if (attempt === 1) {
          prompt = `Generate a personalized 5-7 minute warmup routine specifically for a ${workout.title} workout targeting ${workout.muscleGroups.join(', ')}. Include 3-4 dynamic movement exercises that progressively prepare the body for ${workout.difficulty} level training. Each exercise should include specific instructions, target muscles, and duration.`;
        } else if (attempt === 2) {
          prompt = `Create a 5-minute warmup routine for ${workout.muscleGroups.join(' and ')} exercises. Include 3 dynamic movements with instructions and duration.`;
        } else {
          prompt = `Simple warmup routine for ${workout.muscleGroups[0] || 'full body'} workout. 3 exercises with instructions.`;
        }

        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: prompt,
            systemRole: 'You are a fitness coach creating warmup routines. Respond with a numbered list of exercises, each including the exercise name, clear instructions, target muscles, and duration.'
          })
        });

        if (!response.ok) {
          console.warn(`❌ AI Warmup attempt ${attempt} failed with status:`, response.status);
          continue;
        }

        const data = await response.json();
        const aiResponse = data.response || '';
        
        if (!aiResponse.trim()) {
          console.warn(`❌ AI Warmup attempt ${attempt} returned empty response`);
          continue;
        }

        // Parse AI response into warmup exercises
        const exercises = [];
        let exerciseCounter = 1;
        
        const lines = aiResponse.split('\n').filter((line: string) => line.trim());
        let currentExercise: any = null;
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (/^\d+\./.test(trimmedLine) || trimmedLine.includes('Exercise') || trimmedLine.includes(':')) {
            if (currentExercise) {
              exercises.push(currentExercise);
              exerciseCounter++;
            }
            
            const name = trimmedLine.replace(/^\d+\.\s*/, '').replace(/:.*$/, '').trim();
            currentExercise = {
              id: `ai-warmup-${exerciseCounter}`,
              name: name || `Warmup Exercise ${exerciseCounter}`,
              instructions: '',
              target: workout.muscleGroups[0] || 'Full Body',
              duration: '2-3 minutes'
            };
          } else if (currentExercise && trimmedLine.length > 10) {
            currentExercise.instructions += (currentExercise.instructions ? ' ' : '') + trimmedLine;
            
            // Extract duration if mentioned
            const durationMatch = trimmedLine.match(/\b(\d+[-\s]\d+)\s*(?:min|sec|minute|second)/i);
            if (durationMatch) {
              currentExercise.duration = durationMatch[0];
            }
          }
        }
        
        if (currentExercise) {
          exercises.push(currentExercise);
        }
        
        if (exercises.length >= 2) {
          console.log(`✅ AI Warmup generation succeeded on attempt ${attempt} with ${exercises.length} exercises`);
          return exercises.slice(0, 4); // Limit to 4 exercises max
        } else {
          console.warn(`❌ AI Warmup attempt ${attempt} generated insufficient exercises:`, exercises.length);
          continue;
        }
        
      } catch (error) {
        console.warn(`❌ AI Warmup attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          console.error('🚫 All AI warmup generation attempts failed, using minimal fallback');
          return [
            {
              id: 'minimal-warmup-fallback',
              name: 'Dynamic Movement Prep',
              instructions: 'Gentle full-body movements to prepare for your workout. AI warmup generation will be restored shortly.',
              target: workout.muscleGroups.join(', ') || 'Full Body',
              duration: '3-5 minutes'
            }
          ];
        }
        
        // Brief delay before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return [];
  };

  // AI-powered recovery generation with intelligent retries
  const generateAIRecoveryWithRetry = async (workout: Workout, maxRetries: number = 3): Promise<any[]> => {
    console.log(`🧘‍♀️ Generating AI recovery for workout: "${workout.title}"`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 AI Recovery Generation - Attempt ${attempt}/${maxRetries}`);
        
        // Create progressively simpler prompts for retries
        let prompt = '';
        if (attempt === 1) {
          prompt = `Generate a personalized 5-8 minute post-workout recovery routine specifically for a ${workout.title} session targeting ${workout.muscleGroups.join(', ')}. Include 3-4 stretching and recovery exercises that help these muscles recover from ${workout.difficulty} level training. Each exercise should include specific instructions, target muscles, proper form cues, and duration.`;
        } else if (attempt === 2) {
          prompt = `Create a 5-minute cool-down routine for ${workout.muscleGroups.join(' and ')} muscles. Include 3 stretching exercises with instructions and duration.`;
        } else {
          prompt = `Simple recovery stretches for ${workout.muscleGroups[0] || 'full body'} workout. 3 stretching exercises with instructions.`;
        }

        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: prompt,
            systemRole: 'You are a fitness recovery specialist creating post-workout routines. Respond with a numbered list of stretches and recovery exercises, each including the exercise name, clear instructions for proper form, target muscles, and duration.'
          })
        });

        if (!response.ok) {
          console.warn(`❌ AI Recovery attempt ${attempt} failed with status:`, response.status);
          continue;
        }

        const data = await response.json();
        const aiResponse = data.response || '';
        
        if (!aiResponse.trim()) {
          console.warn(`❌ AI Recovery attempt ${attempt} returned empty response`);
          continue;
        }

        // Parse AI response into recovery exercises
        const exercises = [];
        let exerciseCounter = 1;
        
        const lines = aiResponse.split('\n').filter((line: string) => line.trim());
        let currentExercise: any = null;
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (/^\d+\./.test(trimmedLine) || trimmedLine.includes('Exercise') || trimmedLine.includes(':')) {
            if (currentExercise) {
              exercises.push(currentExercise);
              exerciseCounter++;
            }
            
            const name = trimmedLine.replace(/^\d+\.\s*/, '').replace(/:.*$/, '').trim();
            currentExercise = {
              id: `ai-recovery-${exerciseCounter}`,
              name: name || `Recovery Exercise ${exerciseCounter}`,
              instructions: '',
              target: workout.muscleGroups[0] || 'Recovery Focus',
              duration: '2-3 minutes'
            };
          } else if (currentExercise && trimmedLine.length > 10) {
            currentExercise.instructions += (currentExercise.instructions ? ' ' : '') + trimmedLine;
            
            // Extract duration if mentioned
            const durationMatch = trimmedLine.match(/\b(\d+[-\s]\d+)\s*(?:min|sec|minute|second)/i);
            if (durationMatch) {
              currentExercise.duration = durationMatch[0];
            }
          }
        }
        
        if (currentExercise) {
          exercises.push(currentExercise);
        }
        
        if (exercises.length >= 2) {
          console.log(`✅ AI Recovery generation succeeded on attempt ${attempt} with ${exercises.length} exercises`);
          return exercises.slice(0, 4); // Limit to 4 exercises max
        } else {
          console.warn(`❌ AI Recovery attempt ${attempt} generated insufficient exercises:`, exercises.length);
          continue;
        }
        
      } catch (error) {
        console.warn(`❌ AI Recovery attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          console.error('🚫 All AI recovery generation attempts failed, using minimal fallback');
          return [
            {
              id: 'minimal-recovery-fallback',
              name: 'Gentle Stretching & Breathing',
              instructions: 'Light stretching and deep breathing to help your body recover. AI recovery generation will be restored shortly.',
              target: workout.muscleGroups.join(', ') || 'Full Body Recovery',
              duration: '3-5 minutes'
            }
          ];
        }
        
        // Brief delay before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return [];
  };

  // Exit confirmation handlers
  const handleBackPress = () => {
    setShowExitConfirmation(true);
  };

  const handleExitWithoutSaving = () => {
    setShowExitConfirmation(false);
    onBack();
  };

  const handleMarkComplete = () => {
    if (workout && workoutId) {
      // Mark workout as completed in schedule
      const storedSchedule = localStorage.getItem('thryvin-weekly-schedule');
      if (storedSchedule) {
        const schedule = JSON.parse(storedSchedule);
        if (schedule[workoutId]) {
          schedule[workoutId].completed = true;
          localStorage.setItem('thryvin-weekly-schedule', JSON.stringify(schedule));
        }
      }
    }
    setShowExitConfirmation(false);
    onBack();
  };

  const handleContinueWorkout = () => {
    setShowExitConfirmation(false);
  };

  const canCompleteWorkout = () => {
    return workout?.exercises?.every(exercise => 
      savedExercises.has(exercise.id) || skippedExercises.has(exercise.id)
    ) || false;
  };

  const saveCompleteWorkout = () => {
    setShowRecoveryPage(true);
  };

  const updatePerformanceData = (exerciseId: string, field: string, value: string) => {
    setPerformanceData(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [field]: value
      }
    }));
  };

  const undoSkip = (exerciseId: string) => {
    setSkippedExercises(prev => {
      const newSet = new Set(Array.from(prev));
      newSet.delete(exerciseId);
      return newSet;
    });
  };

  const startListening = (field: string, exerciseId: string) => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        setCurrentExerciseForVoice(exerciseId);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        updatePerformanceData(exerciseId, field, transcript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setCurrentExerciseForVoice('');
      };
      
      recognition.onend = () => {
        setIsListening(false);
        setCurrentExerciseForVoice('');
      };
      
      recognition.start();
    }
  };

  const savePerformance = (exerciseId: string) => {
    setSavedExercises(prev => new Set(Array.from(prev).concat(exerciseId)));
  };

  const skipExercise = (exerciseId: string) => {
    setSkippedExercises(prev => new Set(Array.from(prev).concat(exerciseId)));
  };





  const swapExercise = (exerciseId: string) => {
    setSwapExerciseId(exerciseId);
    setShowSwapModal(true);
    setSwapReason('');
    setSuggestedAlternative(null);
  };

  const handleSwapSubmit = async () => {
    if (!swapReason.trim()) return;
    
    setIsLoadingSwap(true);
    try {
      // Find the exercise in the appropriate array based on its ID
      let currentExercise = workout?.exercises.find(ex => ex.id === swapExerciseId);
      if (!currentExercise) {
        currentExercise = warmupExercises.find(ex => ex.id === swapExerciseId);
      }
      if (!currentExercise) {
        currentExercise = recoveryExercises.find(ex => ex.id === swapExerciseId);
      }
      
      // Call AI to get alternative exercise
      const response = await fetch('/api/ai/swap-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentExercise,
          reason: swapReason,
          userProfile: {} // Add user profile data if available
        })
      });
      
      if (response.ok) {
        const alternative = await response.json();
        setSuggestedAlternative(alternative);
      }
    } catch (error) {
      console.error('Error getting exercise alternative:', error);
    } finally {
      setIsLoadingSwap(false);
    }
  };

  // Remove duplicate state - using workout state instead

  const confirmSwap = () => {
    if (suggestedAlternative) {
      // Determine which array the exercise belongs to and update accordingly
      if (workout?.exercises.find(ex => ex.id === swapExerciseId)) {
        // Main workout exercise
        const updatedExercises = workout.exercises.map(ex => 
          ex.id === swapExerciseId ? { ...suggestedAlternative, id: swapExerciseId } : ex
        );
        setWorkout(prev => prev ? ({ ...prev, exercises: updatedExercises }) : null);
      } else if (warmupExercises.find(ex => ex.id === swapExerciseId)) {
        // Warm-up exercise
        const updatedWarmups = warmupExercises.map(ex => 
          ex.id === swapExerciseId ? { ...suggestedAlternative, id: swapExerciseId } : ex
        );
        setWarmupExercises(updatedWarmups);
      } else if (recoveryExercises.find(ex => ex.id === swapExerciseId)) {
        // Recovery exercise
        const updatedRecovery = recoveryExercises.map(ex => 
          ex.id === swapExerciseId ? { ...suggestedAlternative, id: swapExerciseId } : ex
        );
        setRecoveryExercises(updatedRecovery);
      }
      
      setShowSwapModal(false);
      setSwapReason('');
      setSuggestedAlternative(null);
      setExpandedExercise(null);
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      setRecognition(recognitionInstance);
    }
  }, []);

  const startVoiceInput = (exerciseId: string, field: string) => {
    if (recognition && !isListening) {
      setIsListening(true);
      setCurrentExerciseForVoice(exerciseId);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const numericValue = parseInt(transcript.replace(/\D/g, '')) || 0;
        
        if (numericValue > 0) {
          setPerformanceData(prev => ({
            ...prev,
            [exerciseId]: {
              ...prev[exerciseId],
              [field]: numericValue
            }
          }));
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    }
  };

  const generateCoachFeedback = () => {
    if (!workout?.exercises?.length) {
      return {
        title: "Keep Going! 💪", 
        message: "Every step counts on your fitness journey!"
      };
    }
    
    const completionRate = savedExercises.size / workout.exercises.length;
    if (completionRate >= 0.8) {
      return {
        title: "Outstanding Work! 🔥",
        message: "You absolutely crushed this workout! Your dedication and effort really show."
      };
    } else if (completionRate >= 0.6) {
      return {
        title: "Great Effort! 💪",
        message: "Solid workout today! You're building great habits and making progress."
      };
    } else {
      return {
        title: "Good Start! ⭐",
        message: "Every workout counts! Remember, consistency beats perfection."
      };
    }
  };

  // Show loading state while fetching workout data
  if (isLoadingWorkout || !workout) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 w-full max-w-full overflow-x-hidden">
          {/* 🎯 REPOSITIONED: Back button outside banner for cleaner design */}
          <div className="flex items-center gap-3 px-6 py-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowExitConfirmation(true)} 
              className="text-gray-700 hover:bg-gray-100 rounded-full w-10 h-10 p-0 shadow-sm border border-gray-200"
              data-testid="button-back-workout"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 font-medium">Back to Workouts</span>
          </div>
          
          <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 text-white relative overflow-hidden mx-4 rounded-3xl">
            <div className="relative z-10 p-6">
              <div className="flex items-center gap-3 mb-4">
                {/* Back button moved outside banner below */}
                <div className="flex-1 min-w-0">
                </div>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-6 h-6 text-white animate-spin" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="font-bold text-xl text-white">Loading Workout...</h1>
                  <p className="text-purple-100 text-sm">Preparing your personalized AI workout</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 🎯 REMOVED: Duplicate AlertDialog causing interaction blocking */}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full max-w-full overflow-x-hidden">
      {/* 🎯 REPOSITIONED: Back button outside banner for cleaner design */}
      <div className="flex items-center gap-3 px-6 py-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowExitConfirmation(true)} 
          className="text-gray-700 hover:bg-gray-100 rounded-full w-10 h-10 p-0 shadow-sm border border-gray-200"
          data-testid="button-back-workout"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm text-gray-600 font-medium">Back to Workouts</span>
      </div>
      
      {/* Enhanced Header - With Proper Padding */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 text-white relative overflow-hidden mx-4 rounded-3xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full"></div>
          <div className="absolute top-32 right-16 w-16 h-16 bg-pink-300 rounded-full"></div>
          <div className="absolute bottom-10 left-1/3 w-12 h-12 bg-purple-300 rounded-full"></div>
        </div>
        
        <div className="relative z-10 p-6">
          <div className="flex items-center gap-3 mb-4">
            {/* Back button now positioned outside banner above */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="font-bold text-xl text-white truncate">{globalWorkoutTitle || workout?.title || 'Workout'}</h1>
                  <p className="text-purple-100 text-sm truncate">{workout?.description || 'Loading workout details...'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-purple-100 flex-wrap">
                <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
                  <Clock className="w-4 h-4" />
                  <span>{workout?.duration || 0} min</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
                  <Target className="w-4 h-4" />
                  <span className="truncate">{workout?.muscleGroups?.join(', ') || 'Full Body'}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
                  <Brain className="w-4 h-4" />
                  <span className="capitalize">{workout?.difficulty || 'intermediate'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {workout?.coachComments && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-white mb-1">Your Coach Says:</h3>
                  <p className="text-purple-100 text-sm leading-relaxed">{workout.coachComments}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Phase Navigation Tabs */}
      <div className="px-4 pt-4">
        <div className="flex bg-white rounded-3xl p-1 shadow-sm border border-gray-200 scrollbar-hide overflow-hidden">
          {['Warm-up', 'Workout', 'Recovery'].map((phase, index) => (
            <button
              key={phase}
              onClick={() => setCurrentPhase(index)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                currentPhase === index
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {phase}
              {index === 0 && warmupCompleted && ' ✓'}
              {index === 1 && mainWorkoutCompleted && ' ✓'}
            </button>
          ))}
        </div>
      </div>

      {/* Phase Content */}
      <div className="p-4">
        {currentPhase === 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {/* AI Generation Status */}
            {isLoadingWarmup && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-orange-600 animate-spin" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Generating AI Warmup</h3>
                    <p className="text-sm text-gray-600">Creating personalized warmup for {workout?.title}...</p>
                  </div>
                </div>
              </motion.div>
            )}

            {!isLoadingWarmup && warmupExercises.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-2xl border border-orange-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Brain className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI-Generated Warmup</h3>
                    <p className="text-sm text-gray-600">Personalized for your {workout?.muscleGroups?.join(' & ') || 'workout'} session</p>
                  </div>
                </div>
              </motion.div>
            )}

            {!isLoadingWarmup && warmupExercises.map((exercise, index) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`transition-all duration-300 hover:shadow-xl w-full rounded-2xl overflow-hidden ${
                  savedExercises.has(exercise.id) ? 'ring-2 ring-green-300 bg-green-50/50' : 
                  skippedExercises.has(exercise.id) ? 'ring-2 ring-blue-300 bg-blue-50/50' : ''
                }`}>
                  <CardContent className="p-0">
                    {/* Exercise Header - Always Visible */}
                    <div 
                      className="p-4 cursor-pointer bg-gradient-to-r from-orange-100 to-red-100 hover:from-orange-200 hover:to-red-200 transition-all duration-300"
                      onClick={() => {
                        if (expandedExercise === exercise.id) {
                          setExpandedExercise(null);
                        } else {
                          setExpandedExercise(exercise.id);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{exercise.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>{exercise.duration || '30 sec'}</span>
                              <span>•</span>
                              <span>{exercise.target}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {savedExercises.has(exercise.id) && (
                            <div className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />
                              Done
                            </div>
                          )}
                          {skippedExercises.has(exercise.id) && (
                            <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                              <SkipForward className="w-3 h-3" />
                              Skipped
                            </div>
                          )}
                          <div className={`transform transition-transform duration-300 ${expandedExercise === exercise.id ? 'rotate-180' : ''}`}>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Content */}
                    <AnimatePresence>
                      {expandedExercise === exercise.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-orange-200"
                        >
                          {/* Video Thumbnail */}
                          <div className="relative w-full h-48 bg-gradient-to-br from-orange-600 to-red-600 overflow-hidden">
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="text-center text-white">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                                <p className="text-sm font-medium">Warm-up Demo</p>
                                <p className="text-xs opacity-80">{exercise.name}</p>
                              </div>
                            </div>
                          </div>

                          <div className="p-4">
                            <p className="text-gray-600 mb-4">{exercise.instructions}</p>
                            
                            <div className="flex items-center gap-2 mb-4 flex-wrap">
                              <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm">
                                <Clock className="w-4 h-4" />
                                <span>{exercise.duration || '30 sec'}</span>
                              </div>
                              <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm">
                                <Target className="w-4 h-4" />
                                <span>{exercise.target}</span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mb-4 flex-wrap">
                              <Button
                                onClick={() => {
                                  if (expandedExercise === exercise.id) {
                                    setExpandedExercise(null);
                                  } else {
                                    setExpandedExercise(exercise.id);
                                  }
                                }}
                                disabled={savedExercises.has(exercise.id) || skippedExercises.has(exercise.id)}
                                className={`flex-1 rounded-xl ${
                                  savedExercises.has(exercise.id) || skippedExercises.has(exercise.id)
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white'
                                }`}
                              >
                                {savedExercises.has(exercise.id) ? 'Performance Logged ✓' : 
                                 skippedExercises.has(exercise.id) ? 'Exercise Skipped' : 
                                 'Log Performance'}
                              </Button>
                              
                              <Button
                                onClick={() => swapExercise(exercise.id)}
                                variant="outline"
                                className="border-orange-300 hover:bg-orange-50 rounded-xl"
                              >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Swap
                              </Button>
                              
                              <Button
                                onClick={() => {
                                  setSkippedExercises(prev => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(exercise.id)) {
                                      newSet.delete(exercise.id);
                                    } else {
                                      newSet.add(exercise.id);
                                    }
                                    return newSet;
                                  });
                                  if (expandedExercise === exercise.id) {
                                    setExpandedExercise(null);
                                  }
                                }}
                                variant={skippedExercises.has(exercise.id) ? "default" : "outline"}
                                className={`rounded-xl ${skippedExercises.has(exercise.id) ? 
                                  "bg-blue-600 hover:bg-blue-700 text-white" : 
                                  "border-orange-300 text-orange-600 hover:bg-orange-50"
                                }`}
                              >
                                {skippedExercises.has(exercise.id) ? (
                                  <>
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Undo Skip
                                  </>
                                ) : (
                                  <>
                                    <SkipForward className="w-4 h-4 mr-2" />
                                    Skip
                                  </>
                                )}
                              </Button>
                            </div>

                            {/* Performance Logging Section */}
                            <div className="border-t border-orange-200 pt-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-3">Log Your Performance</h4>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 w-full">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="text"
                                      placeholder="3-5 min"
                                      value={performanceData[exercise.id]?.duration || ''}
                                      onChange={(e) => setPerformanceData(prev => ({
                                        ...prev,
                                        [exercise.id]: {
                                          ...prev[exercise.id],
                                          duration: e.target.value
                                        }
                                      }))}
                                      className="flex-1"
                                    />
                                    <Button
                                      onClick={() => startVoiceInput(exercise.id, 'duration')}
                                      variant="outline"
                                      size="sm"
                                      className="px-2"
                                    >
                                      {isListening && currentExerciseForVoice === exercise.id ? 
                                        <MicOff className="w-4 h-4" /> : 
                                        <Mic className="w-4 h-4" />
                                      }
                                    </Button>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Intensity</label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="text"
                                      placeholder="Light"
                                      value={performanceData[exercise.id]?.intensity || ''}
                                      onChange={(e) => setPerformanceData(prev => ({
                                        ...prev,
                                        [exercise.id]: {
                                          ...prev[exercise.id],
                                          intensity: e.target.value
                                        }
                                      }))}
                                      className="flex-1"
                                    />
                                    <Button
                                      onClick={() => startVoiceInput(exercise.id, 'intensity')}
                                      variant="outline"
                                      size="sm"
                                      className="px-2"
                                    >
                                      {isListening && currentExerciseForVoice === exercise.id ? 
                                        <MicOff className="w-4 h-4" /> : 
                                        <Mic className="w-4 h-4" />
                                      }
                                    </Button>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Feel</label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="text"
                                      placeholder="Good"
                                      value={performanceData[exercise.id]?.feel || ''}
                                      onChange={(e) => setPerformanceData(prev => ({
                                        ...prev,
                                        [exercise.id]: {
                                          ...prev[exercise.id],
                                          feel: e.target.value
                                        }
                                      }))}
                                      className="flex-1"
                                    />
                                    <Button
                                      onClick={() => startVoiceInput(exercise.id, 'feel')}
                                      variant="outline"
                                      size="sm"
                                      className="px-2"
                                    >
                                      {isListening && currentExerciseForVoice === exercise.id ? 
                                        <MicOff className="w-4 h-4" /> : 
                                        <Mic className="w-4 h-4" />
                                      }
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">How it went</label>
                                <textarea
                                  placeholder="Notes about this warm-up exercise..."
                                  value={performanceData[exercise.id]?.feedback || ''}
                                  onChange={(e) => setPerformanceData(prev => ({
                                    ...prev,
                                    [exercise.id]: {
                                      ...prev[exercise.id],
                                      feedback: e.target.value
                                    }
                                  }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-xl resize-none text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                  rows={3}
                                  disabled={savedExercises.has(exercise.id)}
                                />
                              </div>

                              <Button
                                onClick={() => {
                                  setSavedExercises(prev => new Set([...Array.from(prev), exercise.id]));
                                  setExpandedExercise(null);
                                }}
                                className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl"
                              >
                                Save Performance Data
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Warm-up Completion Section */}
            {warmupExercises.every(ex => savedExercises.has(ex.id) || skippedExercises.has(ex.id)) && (
              <div className="mt-8 p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Warm-up Complete! 🔥</h3>
                  <p className="text-gray-600 mb-4">
                    Great job getting your body ready. Time for the main workout!
                  </p>
                  <Button
                    onClick={() => {
                      setWarmupCompleted(true);
                      setCurrentPhase(1);
                    }}
                    className="w-full max-w-md bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold py-3"
                  >
                    Start Main Workout
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {currentPhase === 1 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {/* Main Workout Content */}
            {workout.exercises.map((exercise, index) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
            <Card className={`transition-all duration-300 hover:shadow-xl w-full rounded-2xl overflow-hidden ${
              savedExercises.has(exercise.id) ? 'ring-2 ring-green-300 bg-green-50/50' : 
              skippedExercises.has(exercise.id) ? 'ring-2 ring-blue-300 bg-blue-50/50' : ''
            }`}>
              <CardContent className="p-0">
                {/* Exercise Header - Always Visible */}
                <div 
                  className="p-4 cursor-pointer bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 transition-all duration-300"
                  onClick={() => {
                    if (expandedExercise === exercise.id) {
                      setExpandedExercise(null);
                    } else {
                      setExpandedExercise(exercise.id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{exercise.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{exercise.sets} sets × {exercise.reps} reps</span>
                          {exercise.weight && <span>• {exercise.weight}lbs</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {savedExercises.has(exercise.id) && (
                        <div className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Done
                        </div>
                      )}
                      {skippedExercises.has(exercise.id) && (
                        <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                          <SkipForward className="w-3 h-3" />
                          Skipped
                        </div>
                      )}
                      <div className={`transform transition-transform duration-300 ${expandedExercise === exercise.id ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expandable Content */}
                <AnimatePresence>
                  {expandedExercise === exercise.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-200"
                    >
                      {/* Video Thumbnail */}
                      <div className="relative w-full h-48 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="text-center text-white">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                            <p className="text-sm font-medium">Exercise Demo</p>
                            <p className="text-xs opacity-80">{exercise.name}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <p className="text-gray-600 mb-4">{exercise.description}</p>
                        
                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {exercise.sets} sets
                          </Badge>
                          <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                            {exercise.reps} reps
                          </Badge>
                          {exercise.weight && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {exercise.weight}lbs
                            </Badge>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mb-4 flex-wrap">
                          <Button
                            onClick={() => {
                              if (expandedExercise === exercise.id) {
                                setExpandedExercise(null);
                              } else {
                                setExpandedExercise(exercise.id);
                              }
                            }}
                            disabled={savedExercises.has(exercise.id) || skippedExercises.has(exercise.id)}
                            className={`flex-1 ${
                              savedExercises.has(exercise.id) || skippedExercises.has(exercise.id)
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                            }`}
                          >
                            {savedExercises.has(exercise.id) ? 'Performance Logged ✓' : 
                             skippedExercises.has(exercise.id) ? 'Exercise Skipped' : 
                             'Log Performance'}
                          </Button>
                          
                          <Button
                            onClick={() => swapExercise(exercise.id)}
                            variant="outline"
                            className="border-gray-300 hover:bg-gray-50"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Swap
                          </Button>
                          
                          <Button
                            onClick={() => {
                              setSkippedExercises(prev => {
                                const newSet = new Set(prev);
                                if (newSet.has(exercise.id)) {
                                  newSet.delete(exercise.id);
                                } else {
                                  newSet.add(exercise.id);
                                }
                                return newSet;
                              });
                              if (expandedExercise === exercise.id) {
                                setExpandedExercise(null);
                              }
                            }}
                            variant={skippedExercises.has(exercise.id) ? "default" : "outline"}
                            className={skippedExercises.has(exercise.id) ? 
                              "bg-blue-600 hover:bg-blue-700 text-white" : 
                              "border-orange-300 text-orange-600 hover:bg-orange-50"
                            }
                          >
                            {skippedExercises.has(exercise.id) ? (
                              <>
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Undo Skip
                              </>
                            ) : (
                              <>
                                <SkipForward className="w-4 h-4 mr-2" />
                                Skip
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Performance Logging Section */}
                        <div className="border-t border-gray-200 pt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Log Your Performance</h4>
                          
                          {/* 🎯 SCROLLBAR REMOVED: Clean workout logging interface */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 w-full scrollbar-hide">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Sets Completed</label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder={exercise.sets.toString()}
                              value={performanceData[exercise.id]?.actualSets || ''}
                              onChange={(e) => setPerformanceData(prev => ({
                                ...prev,
                                [exercise.id]: {
                                  ...prev[exercise.id],
                                  actualSets: parseInt(e.target.value) || exercise.sets
                                }
                              }))}
                              className="flex-1"
                            />
                            <Button
                              onClick={() => startVoiceInput(exercise.id, 'actualSets')}
                              variant="outline"
                              size="sm"
                              className={`px-3 ${isListening && currentExerciseForVoice === exercise.id ? 'bg-red-100 border-red-300' : 'border-gray-300'}`}
                              disabled={isListening}
                            >
                              {isListening && currentExerciseForVoice === exercise.id ? (
                                <MicOff className="w-4 h-4 text-red-600" />
                              ) : (
                                <Mic className="w-4 h-4 text-gray-600" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Reps per Set</label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder={exercise.reps.toString()}
                              value={performanceData[exercise.id]?.actualReps || ''}
                              onChange={(e) => setPerformanceData(prev => ({
                                ...prev,
                                [exercise.id]: {
                                  ...prev[exercise.id],
                                  actualReps: parseInt(e.target.value) || exercise.reps
                                }
                              }))}
                              className="flex-1"
                            />
                            <Button
                              onClick={() => startVoiceInput(exercise.id, 'actualReps')}
                              variant="outline"
                              size="sm"
                              className={`px-3 ${isListening && currentExerciseForVoice === exercise.id ? 'bg-red-100 border-red-300' : 'border-gray-300'}`}
                              disabled={isListening}
                            >
                              {isListening && currentExerciseForVoice === exercise.id ? (
                                <MicOff className="w-4 h-4 text-red-600" />
                              ) : (
                                <Mic className="w-4 h-4 text-gray-600" />
                              )}
                            </Button>
                          </div>
                        </div>
                        {exercise.weight && (
                          <div className="sm:col-span-2 w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Weight Used (lbs)</label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder={exercise.weight.toString()}
                                value={performanceData[exercise.id]?.actualWeight || ''}
                                onChange={(e) => setPerformanceData(prev => ({
                                  ...prev,
                                  [exercise.id]: {
                                    ...prev[exercise.id],
                                    actualWeight: parseInt(e.target.value) || exercise.weight
                                  }
                                }))}
                                className="flex-1"
                              />
                              <Button
                                onClick={() => startVoiceInput(exercise.id, 'actualWeight')}
                                variant="outline"
                                size="sm"
                                className={`px-3 ${isListening && currentExerciseForVoice === exercise.id ? 'bg-red-100 border-red-300' : 'border-gray-300'}`}
                                disabled={isListening}
                              >
                                {isListening && currentExerciseForVoice === exercise.id ? (
                                  <MicOff className="w-4 h-4 text-red-600" />
                                ) : (
                                  <Mic className="w-4 h-4 text-gray-600" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* How It Went Feedback Box */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">How did this exercise feel?</label>
                        <textarea
                          placeholder="Tell us how this exercise went for you..."
                          value={performanceData[exercise.id]?.feedback || ''}
                          onChange={(e) => setPerformanceData(prev => ({
                            ...prev,
                            [exercise.id]: {
                              ...prev[exercise.id],
                              feedback: e.target.value
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows={3}
                          disabled={savedExercises.has(exercise.id)}
                        />
                      </div>

                          <Button
                            onClick={() => {
                              setSavedExercises(prev => new Set([...Array.from(prev), exercise.id]));
                              setExpandedExercise(null);
                            }}
                            className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                          >
                            Save Performance Data
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        ))}





            {/* Completion Section */}
            {currentPhase === 1 && canCompleteWorkout() && !workoutCompleted && (
              <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Workout Complete! 🎉</h3>
                  <p className="text-gray-600 mb-4">
                    You've handled all {workout.exercises.length} exercises. Ready to finish up?
                  </p>
                  <div className="flex items-center justify-center gap-6 mb-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>{savedExercises.size} completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>{skippedExercises.size} skipped</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setMainWorkoutCompleted(true);
                      setCurrentPhase(2);
                    }}
                    className="w-full max-w-md bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 text-lg"
                  >
                    Start Recovery
                  </Button>
                </div>
              </div>
            )}


          </motion.div>
        )}

        {currentPhase === 2 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {/* AI Generation Status */}
            {isLoadingRecovery && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-2xl border border-green-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-green-600 animate-spin" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Generating AI Recovery</h3>
                    <p className="text-sm text-gray-600">Creating personalized recovery for your completed workout...</p>
                  </div>
                </div>
              </motion.div>
            )}

            {!isLoadingRecovery && recoveryExercises.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-2xl border border-green-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Brain className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI-Generated Recovery</h3>
                    <p className="text-sm text-gray-600">Personalized cooldown for your {workout?.muscleGroups?.join(' & ') || 'workout'} session</p>
                  </div>
                </div>
              </motion.div>
            )}

            {!isLoadingRecovery && recoveryExercises.map((exercise, index) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`transition-all duration-300 hover:shadow-xl w-full rounded-2xl overflow-hidden ${
                  savedExercises.has(exercise.id) ? 'ring-2 ring-green-300 bg-green-50/50' : 
                  skippedExercises.has(exercise.id) ? 'ring-2 ring-blue-300 bg-blue-50/50' : ''
                }`}>
                  <CardContent className="p-0">
                    {/* Exercise Header - Always Visible */}
                    <div 
                      className="p-4 cursor-pointer bg-gradient-to-r from-green-100 to-blue-100 hover:from-green-200 hover:to-blue-200 transition-all duration-300"
                      onClick={() => {
                        if (expandedExercise === exercise.id) {
                          setExpandedExercise(null);
                        } else {
                          setExpandedExercise(exercise.id);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{exercise.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>{exercise.duration}</span>
                              <span>•</span>
                              <span>{exercise.target}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {savedExercises.has(exercise.id) && (
                            <div className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />
                              Done
                            </div>
                          )}
                          {skippedExercises.has(exercise.id) && (
                            <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                              <SkipForward className="w-3 h-3" />
                              Skipped
                            </div>
                          )}
                          <div className={`transform transition-transform duration-300 ${expandedExercise === exercise.id ? 'rotate-180' : ''}`}>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Content */}
                    <AnimatePresence>
                      {expandedExercise === exercise.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-green-200"
                        >
                          {/* Video Thumbnail */}
                          <div className="relative w-full h-48 bg-gradient-to-br from-green-600 to-blue-600 overflow-hidden">
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="text-center text-white">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                                <p className="text-sm font-medium">Recovery Demo</p>
                                <p className="text-xs opacity-80">{exercise.name}</p>
                              </div>
                            </div>
                          </div>

                          <div className="p-4">
                            <p className="text-gray-600 mb-4">{exercise.instructions}</p>
                            
                            <div className="flex items-center gap-2 mb-4 flex-wrap">
                              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                                <Clock className="w-4 h-4" />
                                <span>{exercise.duration}</span>
                              </div>
                              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                                <Target className="w-4 h-4" />
                                <span>{exercise.target}</span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mb-4 flex-wrap">
                              <Button
                                onClick={() => {
                                  if (expandedExercise === exercise.id) {
                                    setExpandedExercise(null);
                                  } else {
                                    setExpandedExercise(exercise.id);
                                  }
                                }}
                                disabled={savedExercises.has(exercise.id) || skippedExercises.has(exercise.id)}
                                className={`flex-1 rounded-xl ${
                                  savedExercises.has(exercise.id) || skippedExercises.has(exercise.id)
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white'
                                }`}
                              >
                                {savedExercises.has(exercise.id) ? 'Recovery Logged ✓' : 
                                 skippedExercises.has(exercise.id) ? 'Exercise Skipped' : 
                                 'Log Recovery'}
                              </Button>
                              
                              <Button
                                onClick={() => swapExercise(exercise.id)}
                                variant="outline"
                                className="border-green-300 hover:bg-green-50 rounded-xl"
                              >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Swap
                              </Button>
                              
                              <Button
                                onClick={() => {
                                  setSkippedExercises(prev => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(exercise.id)) {
                                      newSet.delete(exercise.id);
                                    } else {
                                      newSet.add(exercise.id);
                                    }
                                    return newSet;
                                  });
                                  if (expandedExercise === exercise.id) {
                                    setExpandedExercise(null);
                                  }
                                }}
                                variant={skippedExercises.has(exercise.id) ? "default" : "outline"}
                                className={`rounded-xl ${skippedExercises.has(exercise.id) ? 
                                  "bg-blue-600 hover:bg-blue-700 text-white" : 
                                  "border-green-300 text-green-600 hover:bg-green-50"
                                }`}
                              >
                                {skippedExercises.has(exercise.id) ? (
                                  <>
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Undo Skip
                                  </>
                                ) : (
                                  <>
                                    <SkipForward className="w-4 h-4 mr-2" />
                                    Skip
                                  </>
                                )}
                              </Button>
                            </div>

                            {/* Performance Logging Section */}
                            <div className="border-t border-green-200 pt-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-3">Log Your Recovery</h4>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 w-full">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="text"
                                      placeholder="30 sec"
                                      value={performanceData[exercise.id]?.duration || ''}
                                      onChange={(e) => setPerformanceData(prev => ({
                                        ...prev,
                                        [exercise.id]: {
                                          ...prev[exercise.id],
                                          duration: e.target.value
                                        }
                                      }))}
                                      className="flex-1"
                                    />
                                    <Button
                                      onClick={() => startVoiceInput(exercise.id, 'duration')}
                                      variant="outline"
                                      size="sm"
                                      className="px-2"
                                    >
                                      {isListening && currentExerciseForVoice === exercise.id ? 
                                        <MicOff className="w-4 h-4" /> : 
                                        <Mic className="w-4 h-4" />
                                      }
                                    </Button>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Intensity</label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="text"
                                      placeholder="Light"
                                      value={performanceData[exercise.id]?.intensity || ''}
                                      onChange={(e) => setPerformanceData(prev => ({
                                        ...prev,
                                        [exercise.id]: {
                                          ...prev[exercise.id],
                                          intensity: e.target.value
                                        }
                                      }))}
                                      className="flex-1"
                                    />
                                    <Button
                                      onClick={() => startVoiceInput(exercise.id, 'intensity')}
                                      variant="outline"
                                      size="sm"
                                      className="px-2"
                                    >
                                      {isListening && currentExerciseForVoice === exercise.id ? 
                                        <MicOff className="w-4 h-4" /> : 
                                        <Mic className="w-4 h-4" />
                                      }
                                    </Button>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Feel</label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="text"
                                      placeholder="Relaxed"
                                      value={performanceData[exercise.id]?.feel || ''}
                                      onChange={(e) => setPerformanceData(prev => ({
                                        ...prev,
                                        [exercise.id]: {
                                          ...prev[exercise.id],
                                          feel: e.target.value
                                        }
                                      }))}
                                      className="flex-1"
                                    />
                                    <Button
                                      onClick={() => startVoiceInput(exercise.id, 'feel')}
                                      variant="outline"
                                      size="sm"
                                      className="px-2"
                                    >
                                      {isListening && currentExerciseForVoice === exercise.id ? 
                                        <MicOff className="w-4 h-4" /> : 
                                        <Mic className="w-4 h-4" />
                                      }
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">How it went</label>
                                <textarea
                                  placeholder="Notes about this recovery exercise..."
                                  value={performanceData[exercise.id]?.feedback || ''}
                                  onChange={(e) => setPerformanceData(prev => ({
                                    ...prev,
                                    [exercise.id]: {
                                      ...prev[exercise.id],
                                      feedback: e.target.value
                                    }
                                  }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-xl resize-none text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  rows={3}
                                  disabled={savedExercises.has(exercise.id)}
                                />
                              </div>

                              <Button
                                onClick={() => {
                                  setSavedExercises(prev => new Set([...Array.from(prev), exercise.id]));
                                  setExpandedExercise(null);
                                }}
                                className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl"
                              >
                                Save Recovery Data
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Recovery Completion Section */}
            {recoveryExercises.every(ex => savedExercises.has(ex.id) || skippedExercises.has(ex.id)) && (
              <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Recovery Complete! 🎉</h3>
                  <p className="text-gray-600 mb-4">
                    Excellent work! Your body is now properly recovered. Great job today!
                  </p>
                  <Button
                    onClick={() => setShowCoachFeedback(true)}
                    className="w-full max-w-md bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3"
                  >
                    Complete Workout
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>



      {/* Coach Feedback Modal - Shows Second */}
      <AnimatePresence>
        {showCoachFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-hidden"
            style={{ overflowY: 'hidden' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden pointer-events-auto shadow-2xl border border-gray-300"
            >
              <div className="p-6">
                {(() => {
                  const feedback = generateCoachFeedback();
                  return (
                    <>
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Trophy className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{feedback.title}</h2>
                        <p className="text-gray-600">{feedback.message}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{savedExercises.size}</div>
                          <div className="text-xs text-gray-600">Completed</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{skippedExercises.size}</div>
                          <div className="text-xs text-gray-600">Skipped</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{workout?.duration || 0}min</div>
                          <div className="text-xs text-gray-600">Duration</div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => {
                            setShowCoachFeedback(false);
                            setShowCoachChat(true);
                          }}
                          variant="outline"
                          className="flex-1 border-purple-200 text-purple-600 hover:bg-purple-50"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chat with Coach
                        </Button>
                        <Button
                          onClick={() => {
                            setShowCoachFeedback(false);
                            setWorkoutCompleted(true);
                            onBack();
                          }}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                          Back to Dashboard
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coach Chat Modal */}
      <AnimatePresence>
        {showCoachChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl border border-gray-300"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Chat with Coach</h2>
                  <Button
                    onClick={() => setShowCoachChat(false)}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-4 mb-4">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-800">
                      Great work on today's session! How are you feeling about the workout intensity?
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message to the coach..."
                    className="flex-1"
                    rows={3}
                  />
                  <Button
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Send
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Button
                    onClick={() => {
                      setShowCoachChat(false);
                      onBack();
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Exercise Swap Modal - Fixed at Top */}
      <AnimatePresence>
        {showSwapModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-hidden"
            style={{ overflowY: 'hidden' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -50 }}
className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-300 pointer-events-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Exercise Swap</h2>
                  <Button
                    onClick={() => setShowSwapModal(false)}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {!suggestedAlternative ? (
                  <>
                    <div className="mb-4">
                      <p className="text-gray-600 mb-3">
                        Tell me why you'd like to swap this exercise and I'll suggest a better alternative!
                      </p>
                      <div className="p-3 bg-purple-50 rounded-lg mb-4">
                        <p className="font-medium text-purple-800">
                          Current: {workout?.exercises.find(ex => ex.id === swapExerciseId)?.name}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Why do you want to swap this exercise?
                      </label>
                      <Textarea
                        value={swapReason}
                        onChange={(e) => setSwapReason(e.target.value)}
                        placeholder="e.g., I don't have the equipment, it's too difficult, I have an injury..."
                        rows={3}
                        className="w-full"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowSwapModal(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSwapSubmit}
                        disabled={!swapReason.trim() || isLoadingSwap}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        {isLoadingSwap ? (
                          <>
                            <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                            Finding Alternative...
                          </>
                        ) : (
                          'Get Alternative'
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <div className="text-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Perfect Alternative Found!</h3>
                      </div>

                      <div className="space-y-3">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-1">Original Exercise</h4>
                          <p className="text-sm text-gray-600">
                            {workout?.exercises.find(ex => ex.id === swapExerciseId)?.name}
                          </p>
                        </div>
                        
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                          <h4 className="font-medium text-purple-800 mb-2">Suggested Alternative</h4>
                          <p className="font-semibold text-gray-900 mb-1">{suggestedAlternative.name}</p>
                          <p className="text-sm text-gray-600 mb-3">{suggestedAlternative.description}</p>
                          <div className="flex gap-2 text-xs">
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              {suggestedAlternative.sets} sets
                            </span>
                            <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded">
                              {suggestedAlternative.reps} reps
                            </span>
                            {suggestedAlternative.weight && (
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {suggestedAlternative.weight}lbs
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          setSuggestedAlternative(null);
                          setSwapReason('');
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Try Again
                      </Button>
                      <Button
                        onClick={confirmSwap}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        Use This Exercise
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎯 BEAUTIFUL BUBBLE POPUP: Near back button, no dimming, easy interaction */}
      <AnimatePresence>
        {showExitConfirmation && (
          <>
            {/* Subtle backdrop - no dimming, allows interaction */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 pointer-events-none"
            />
            
            {/* Bubble popup positioned near back button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
              className="fixed top-20 left-6 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4"
              style={{ 
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)'
              }}
            >
              {/* Header with prettier styling */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Leaving Workout?</h3>
                  <p className="text-xs text-gray-500">Choose how to proceed</p>
                </div>
              </div>
              
              {/* Pretty options with better spacing */}
              <div className="space-y-2">
                <Button
                  onClick={handleMarkComplete}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl py-3"
                  data-testid="button-mark-complete"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete ✨
                </Button>
                
                <Button
                  onClick={handleContinueWorkout}
                  variant="outline"
                  className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl py-3 transition-all duration-200"
                  data-testid="button-continue-workout"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Continue Workout
                </Button>
                
                <Button
                  onClick={handleExitWithoutSaving}
                  variant="outline"
                  className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl py-3 transition-all duration-200"
                  data-testid="button-exit-without-saving"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Exit Without Saving
                </Button>
              </div>
              
              {/* Success indicator if workout is completable */}
              {canCompleteWorkout() && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl"
                >
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Amazing! All exercises completed 🎉
                    </span>
                  </div>
                </motion.div>
              )}
              
              {/* Little arrow pointing to back button */}
              <div className="absolute -top-2 left-8 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default DailyWorkoutView;
export { DailyWorkoutView };