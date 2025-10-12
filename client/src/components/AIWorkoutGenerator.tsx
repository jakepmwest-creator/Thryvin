import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Zap, Target, Clock, User } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth-v2";
import { useToast } from "@/hooks/use-toast";

interface GeneratedExercise {
  name: string;
  sets: number;
  reps: number;
  restTime: number;
  instructions: string;
  modifications?: string;
  targetMuscles: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface GeneratedWorkout {
  title: string;
  description: string;
  estimatedDuration: number;
  difficulty: string;
  exercises: GeneratedExercise[];
  warmup: GeneratedExercise[];
  cooldown: GeneratedExercise[];
  coachNotes: string;
  progressionTips: string;
}

interface AIWorkoutGeneratorProps {
  workoutType: string;
  onWorkoutGenerated: (workout: GeneratedWorkout) => void;
  onCancel: () => void;
}

export function AIWorkoutGenerator({ workoutType, onWorkoutGenerated, onCancel }: AIWorkoutGeneratorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");

  // Redirect to auth if not logged in
  if (!user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-purple-500" />
              Sign In Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              To generate personalized AI workouts, please sign in to your account. 
              This allows the AI to analyze your fitness level, goals, and preferences.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => window.location.href = '/auth'} className="flex-1">
                Sign In
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const generateWorkoutMutation = useMutation({
    mutationFn: async (params: { workoutType: string; duration?: number; equipment?: string[]; focus?: string }) => {
      const response = await apiRequest("POST", "/api/generate-workout", params);
      return response.json();
    },
    onSuccess: (workout: GeneratedWorkout) => {
      setGenerationProgress(100);
      setCurrentStep("Workout generated successfully!");
      toast({
        title: "Personalized Workout Created",
        description: `Your ${workoutType} workout is ready!`,
      });
      setTimeout(() => onWorkoutGenerated(workout), 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate personalized workout",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (generateWorkoutMutation.isPending) {
      const steps = [
        "Analyzing your fitness profile...",
        "Considering your goals and preferences...",
        "Selecting optimal exercises...",
        "Customizing sets and reps...",
        "Adding personalized coaching notes...",
        "Finalizing your workout..."
      ];

      let stepIndex = 0;
      setCurrentStep(steps[0]);
      setGenerationProgress(10);

      const interval = setInterval(() => {
        stepIndex++;
        if (stepIndex < steps.length) {
          setCurrentStep(steps[stepIndex]);
          setGenerationProgress(15 + (stepIndex * 15));
        } else {
          clearInterval(interval);
        }
      }, 800);

      return () => clearInterval(interval);
    }
  }, [generateWorkoutMutation.isPending]);

  const handleGenerateWorkout = () => {
    generateWorkoutMutation.mutate({
      workoutType,
      duration: 45,
      equipment: [],
      focus: "general fitness"
    });
  };

  const getUserInsights = () => {
    if (!user) return [];
    
    const insights = [];
    if (user.fitnessLevel) insights.push(`${user.fitnessLevel} level`);
    if (user.goal) insights.push(`Goal: ${user.goal}`);
    if (user.age) insights.push(`Age: ${user.age}`);
    if (user.injuries) insights.push("Has injury considerations");
    
    return insights;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500" />
            AI Workout Generation
          </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Profile Summary */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-700">Your Profile</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {getUserInsights().map((insight, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {insight}
              </Badge>
            ))}
          </div>
        </div>

        {/* Workout Type Info */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-green-500" />
            <div>
              <h3 className="font-medium">{typeof workoutType === 'string' && workoutType ? workoutType.charAt(0).toUpperCase() + workoutType.slice(1) : "Personalized"} Workout</h3>
              <p className="text-sm text-gray-600">Personalized for your goals</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            45 min
          </div>
        </div>

        {/* Generation Progress */}
        {generateWorkoutMutation.isPending && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">{currentStep}</span>
            </div>
            <Progress value={generationProgress} className="h-2" />
          </div>
        )}

        {/* AI Features Highlight */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium text-sm mb-1">Personalized Selection</h4>
            <p className="text-xs text-gray-600">Exercises chosen based on your fitness level, goals, and any injury considerations</p>
          </div>
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium text-sm mb-1">Adaptive Programming</h4>
            <p className="text-xs text-gray-600">Sets, reps, and rest times optimized for your current capabilities</p>
          </div>
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium text-sm mb-1">Smart Progressions</h4>
            <p className="text-xs text-gray-600">Built-in advancement strategies as you get stronger</p>
          </div>
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium text-sm mb-1">Coach Guidance</h4>
            <p className="text-xs text-gray-600">Personalized motivational notes in your preferred coaching style</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleGenerateWorkout}
            disabled={generateWorkoutMutation.isPending}
            className="flex-1"
          >
            {generateWorkoutMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate AI Workout
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={generateWorkoutMutation.isPending}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
  );
}