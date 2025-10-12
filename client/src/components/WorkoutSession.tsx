import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, SkipForward, Check, ArrowLeft, Timer } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth-v2";
import { useToast } from "@/hooks/use-toast";
import { AIWorkoutCoach } from "./AIWorkoutCoach";

interface Exercise {
  name: string;
  reps: number;
  sets: number;
  restTime: number;
  instructions: string;
}

interface Workout {
  id: number;
  name: string;
  type: string;
  duration: number;
  difficulty: string;
  description: string;
  exercises: Exercise[];
}

interface WorkoutSessionProps {
  onBack: () => void;
  workoutType: string;
  generatedWorkout?: any;
}

export function WorkoutSession({ onBack, workoutType, generatedWorkout }: WorkoutSessionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [completedSets, setCompletedSets] = useState<Set<string>>(new Set());

  // Fetch available workouts
  const { data: workouts, isLoading } = useQuery<Workout[]>({
    queryKey: ['/api/workouts', workoutType],
    queryFn: () => fetch(`/api/workouts?type=${workoutType}`).then(res => res.json())
  });

  // Create user workout mutation
  const createUserWorkoutMutation = useMutation({
    mutationFn: async (workoutData: any) => {
      const res = await apiRequest("POST", "/api/user-workouts", workoutData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-workouts'] });
      toast({
        title: "Workout Completed!",
        description: "Great job! Your workout has been saved.",
      });
    }
  });

  // Generate AI-powered workout based on workout type if no workouts available
  const generateWorkout = (type: string): Workout => {
    const workoutTemplates: Record<string, Workout> = {
      strength: {
        id: 1,
        name: "AI Strength Training",
        type: "strength",
        duration: 45,
        difficulty: "intermediate",
        description: "A comprehensive strength training session designed by your AI coach",
        exercises: [
          { name: "Push-ups", reps: 12, sets: 3, restTime: 60, instructions: "Keep your body straight and lower until chest nearly touches ground" },
          { name: "Squats", reps: 15, sets: 3, restTime: 60, instructions: "Lower until thighs are parallel to ground, keep chest up" },
          { name: "Plank", reps: 1, sets: 3, restTime: 60, instructions: "Hold for 30-60 seconds, keep body straight" },
          { name: "Mountain Climbers", reps: 20, sets: 3, restTime: 60, instructions: "Alternate bringing knees to chest rapidly" }
        ]
      },
      cardio: {
        id: 2,
        name: "AI Cardio Blast",
        type: "cardio", 
        duration: 30,
        difficulty: "intermediate",
        description: "High-intensity cardio workout with AI coaching",
        exercises: [
          { name: "Jumping Jacks", reps: 30, sets: 3, restTime: 30, instructions: "Jump while spreading legs and raising arms overhead" },
          { name: "High Knees", reps: 20, sets: 3, restTime: 30, instructions: "Run in place bringing knees up to chest level" },
          { name: "Burpees", reps: 10, sets: 3, restTime: 60, instructions: "Squat, jump back to plank, push-up, jump forward, jump up" },
          { name: "Sprint Intervals", reps: 8, sets: 2, restTime: 90, instructions: "30 seconds all-out effort, 30 seconds rest" }
        ]
      },
      yoga: {
        id: 3,
        name: "AI Mindful Flow",
        type: "yoga",
        duration: 40,
        difficulty: "beginner",
        description: "Relaxing yoga flow with mindfulness guidance",
        exercises: [
          { name: "Sun Salutation", reps: 5, sets: 1, restTime: 30, instructions: "Flow through the complete sequence mindfully" },
          { name: "Warrior II", reps: 1, sets: 2, restTime: 30, instructions: "Hold for 30 seconds each side, focus on breath" },
          { name: "Downward Dog", reps: 1, sets: 3, restTime: 30, instructions: "Hold for 45 seconds, lengthen spine" },
          { name: "Child's Pose", reps: 1, sets: 1, restTime: 0, instructions: "Rest and breathe deeply for 2 minutes" }
        ]
      }
    };
    
    return workoutTemplates[type] || workoutTemplates.strength;
  };

  const currentWorkout = workouts?.[0] || generateWorkout(workoutType);
  const exercises = currentWorkout?.exercises || [];
  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;
  const progress = totalExercises > 0 ? ((currentExerciseIndex + 1) / totalExercises) * 100 : 0;

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeRemaining]);

  const startExercise = () => {
    if (!sessionStarted) {
      setSessionStarted(true);
    }
    setTimeRemaining(currentExercise?.duration || 30);
    setIsPlaying(true);
  };

  const pauseExercise = () => {
    setIsPlaying(false);
  };

  const completeSet = () => {
    const setKey = `${currentExerciseIndex}-${currentSet}`;
    setCompletedSets(prev => new Set([...prev, setKey]));
    
    if (currentSet < (currentExercise?.sets || 1)) {
      setCurrentSet(prev => prev + 1);
      setTimeRemaining(currentExercise?.duration || 30);
    } else {
      nextExercise();
    }
  };

  const nextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSet(1);
      setTimeRemaining(0);
      setIsPlaying(false);
    } else {
      completeWorkout();
    }
  };

  const completeWorkout = async () => {
    if (!user || !currentWorkout) return;

    const workoutData = {
      userId: user.id,
      workoutId: currentWorkout.id,
      duration: currentWorkout.duration,
      completedAt: new Date().toISOString()
    };

    await createUserWorkoutMutation.mutateAsync(workoutData);
    onBack();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!currentWorkout) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">No Workouts Available</h2>
        <p className="text-gray-600 mb-4">No workouts found for the selected type.</p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="text-center">
          <h1 className="text-2xl font-bold">{currentWorkout.name}</h1>
          <Badge variant="secondary">{currentWorkout.type}</Badge>
        </div>
        <div className="text-sm text-gray-500">
          {currentExerciseIndex + 1} of {totalExercises}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Workout Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Current Exercise */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{currentExercise?.name}</span>
            <div className="flex items-center space-x-2">
              <Timer className="w-4 h-4" />
              <span className="text-lg font-mono">
                {formatTime(timeRemaining)}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600 mb-4">{currentExercise?.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Sets:</span>
                  <span>{currentSet} / {currentExercise?.sets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Reps:</span>
                  <span>{currentExercise?.reps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Duration:</span>
                  <span>{currentExercise?.duration}s</span>
                </div>
              </div>

              {currentExercise?.muscles && (
                <div className="mt-4">
                  <span className="font-medium">Target Muscles:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentExercise.muscles.map((muscle, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center justify-center space-y-4">
              {/* Timer Display */}
              <div className="text-6xl font-mono font-bold text-purple-600">
                {formatTime(timeRemaining)}
              </div>

              {/* Control Buttons */}
              <div className="flex space-x-2">
                {!isPlaying ? (
                  <Button onClick={startExercise} className="px-8">
                    <Play className="w-4 h-4 mr-2" />
                    {sessionStarted ? 'Resume' : 'Start'}
                  </Button>
                ) : (
                  <Button onClick={pauseExercise} variant="outline" className="px-8">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                )}
                
                <Button onClick={completeSet} variant="default">
                  <Check className="w-4 h-4 mr-2" />
                  Complete Set
                </Button>

                {currentExerciseIndex < totalExercises - 1 && (
                  <Button onClick={nextExercise} variant="outline">
                    <SkipForward className="w-4 h-4 mr-2" />
                    Skip
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise List */}
      <Card>
        <CardHeader>
          <CardTitle>Exercise List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {exercises.map((exercise, index) => (
              <div
                key={`${exercise.name}-${index}`}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  index === currentExerciseIndex
                    ? 'border-purple-500 bg-purple-50'
                    : index < currentExerciseIndex
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200'
                }`}
              >
                <div>
                  <span className="font-medium">{exercise.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {exercise.sets} sets × {exercise.reps}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {index < currentExerciseIndex && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                  {index === currentExerciseIndex && (
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}