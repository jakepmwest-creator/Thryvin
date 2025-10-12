import React, { useState, useEffect } from 'react';
import { WorkoutCustomizer, WorkoutOptions } from '@/components/WorkoutCustomizer';
import { CustomWorkoutDisplay } from '@/components/CustomWorkoutDisplay';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw, Dumbbell, Layout } from 'lucide-react';
import { motion } from 'framer-motion';

// Types for the OpenAI workout generator
interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: number;
  notes?: string;
}

interface GeneratedWorkout {
  title: string;
  description: string;
  exercises: Exercise[];
}

export default function WorkoutCustomizationTab() {
  const { user } = useUser();
  const { toast } = useToast();
  const [showCustomizer, setShowCustomizer] = useState(true);
  const [options, setOptions] = useState<WorkoutOptions>({
    minutes: 30,
    intensity: 5,
    equipment: ['No Equipment'],
    focusAreas: ['Upper Body', 'Core'],
    includeWarmup: true,
    includeCooldown: true
  });
  const [workout, setWorkout] = useState<GeneratedWorkout | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');

  // When options change, attempt to generate a workout
  useEffect(() => {
    if (!showCustomizer && options) {
      generateWorkout(options);
    }
  }, [showCustomizer, options]);

  const handleSaveOptions = (newOptions: WorkoutOptions) => {
    setOptions(newOptions);
    setShowCustomizer(false);
    generateWorkout(newOptions);
  };

  const generateWorkout = async (workoutOptions: WorkoutOptions) => {
    setIsGenerating(true);
    
    try {
      // This would typically call an API endpoint that uses OpenAI
      // For now, we'll mock a workout based on the options
      const mockExercises: Exercise[] = [];
      
      // Generate exercises based on focus areas and equipment
      if (workoutOptions.focusAreas.includes('Upper Body')) {
        if (workoutOptions.equipment.includes('Dumbbells')) {
          mockExercises.push({
            name: 'Dumbbell Press',
            sets: 3,
            reps: '10-12',
            rest: 60
          });
          mockExercises.push({
            name: 'Dumbbell Rows',
            sets: 3,
            reps: '10-12',
            rest: 60
          });
        } else {
          mockExercises.push({
            name: 'Push-ups',
            sets: 3,
            reps: '10-15',
            rest: 45
          });
          mockExercises.push({
            name: 'Inverted Rows',
            sets: 3,
            reps: '8-12',
            rest: 45
          });
        }
      }
      
      if (workoutOptions.focusAreas.includes('Core')) {
        mockExercises.push({
          name: 'Plank',
          sets: 3,
          reps: '30-45s',
          rest: 30
        });
        mockExercises.push({
          name: 'Mountain Climbers',
          sets: 3,
          reps: '20 per side',
          rest: 30
        });
      }
      
      if (workoutOptions.focusAreas.includes('Lower Body')) {
        if (workoutOptions.equipment.includes('Kettlebells')) {
          mockExercises.push({
            name: 'Kettlebell Swings',
            sets: 3,
            reps: '15-20',
            rest: 60
          });
        } else {
          mockExercises.push({
            name: 'Bodyweight Squats',
            sets: 3,
            reps: '15-20',
            rest: 45
          });
        }
      }
      
      // Add more exercises based on intensity
      if (workoutOptions.intensity > 7) {
        mockExercises.push({
          name: 'Burpees',
          sets: 3,
          reps: '10-15',
          rest: 45,
          notes: 'High intensity'
        });
      }
      
      // Scale exercise difficulty based on intensity
      if (workoutOptions.intensity < 4) {
        mockExercises.forEach(ex => {
          ex.reps = ex.reps.replace(/\d+/g, match => {
            const num = parseInt(match);
            return (num - 2).toString();
          });
          ex.rest += 15;
        });
      } else if (workoutOptions.intensity > 7) {
        mockExercises.forEach(ex => {
          ex.reps = ex.reps.replace(/\d+/g, match => {
            const num = parseInt(match);
            return (num + 2).toString();
          });
          ex.rest -= 15;
          ex.sets = Math.min(4, ex.sets + 1);
        });
      }
      
      // Create workout title and description
      let title = `Custom ${workoutOptions.minutes}-Minute `;
      if (workoutOptions.focusAreas.length > 0) {
        title += workoutOptions.focusAreas.join(' & ') + ' ';
      }
      title += 'Workout';
      
      let description = `A ${workoutOptions.intensity > 7 ? 'high' : workoutOptions.intensity > 4 ? 'moderate' : 'low'}-intensity workout `;
      description += `focusing on ${workoutOptions.focusAreas.join(', ')}.`;
      
      setWorkout({
        title,
        description,
        exercises: mockExercises
      });
      
      // Simulate delay to make it feel like generating
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Error generating workout:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate a workout. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompleteWorkout = () => {
    toast({
      title: 'Workout Completed!',
      description: 'Great job! Your progress has been updated.',
    });
    // Here you would typically save the completed workout to the user's history
  };

  const regenerateWorkout = () => {
    generateWorkout(options);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Workout Builder</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className={viewMode === 'card' ? 'bg-gray-100 dark:bg-gray-800' : ''}
            onClick={() => setViewMode('card')}
          >
            <Layout className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-800' : ''}
            onClick={() => setViewMode('list')}
          >
            <Dumbbell className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showCustomizer ? (
        <WorkoutCustomizer
          defaultMinutes={options.minutes}
          defaultIntensity={options.intensity}
          defaultEquipment={options.equipment}
          defaultFocus={options.focusAreas}
          onSave={handleSaveOptions}
        />
      ) : (
        <div className="space-y-4">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mb-4"
              >
                <RefreshCw className="h-12 w-12 text-gray-400" />
              </motion.div>
              <p className="text-gray-500">Generating your custom workout...</p>
            </div>
          ) : workout ? (
            <div className="space-y-4">
              <CustomWorkoutDisplay
                title={workout.title}
                description={workout.description}
                options={options}
                exercises={workout.exercises}
                onComplete={handleCompleteWorkout}
                onEdit={() => setShowCustomizer(true)}
              />
              
              <div className="flex justify-center mt-4">
                <Button 
                  variant="outline" 
                  onClick={regenerateWorkout}
                  className="flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate New Workout
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No workout generated yet. Please customize your options.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowCustomizer(true)}
              >
                Customize Workout
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}