import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarClock, Dumbbell, Flame, Gauge, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { WorkoutOptions } from './WorkoutCustomizer';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: number; // seconds
  notes?: string;
}

interface CustomWorkoutDisplayProps {
  title: string;
  description: string;
  options: WorkoutOptions;
  exercises: Exercise[];
  onComplete: () => void;
  onEdit: () => void;
  className?: string;
}

export function CustomWorkoutDisplay({
  title,
  description,
  options,
  exercises,
  onComplete,
  onEdit,
  className
}: CustomWorkoutDisplayProps) {
  // Calculate total workout time including warmup and cooldown
  const totalTime = options.minutes + 
    (options.includeWarmup ? 5 : 0) + 
    (options.includeCooldown ? 5 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={className}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
            <Badge variant="outline" className="ml-2 py-1">
              <Gauge className="h-3.5 w-3.5 mr-1" />
              Level {options.intensity}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary" className="flex items-center">
              <CalendarClock className="h-3.5 w-3.5 mr-1" />
              {totalTime} min
            </Badge>
            
            <Badge variant="secondary" className="flex items-center">
              <Flame className="h-3.5 w-3.5 mr-1" />
              {Math.round(totalTime * 6.5 * options.intensity / 5)} cal
            </Badge>
            
            {options.equipment.map(item => (
              <Badge key={item} variant="outline">
                <Dumbbell className="h-3.5 w-3.5 mr-1" />
                {item}
              </Badge>
            ))}
            
            {options.focusAreas.map(area => (
              <Badge key={area} variant="outline">
                <Target className="h-3.5 w-3.5 mr-1" />
                {area}
              </Badge>
            ))}
          </div>
        </CardHeader>
        
        <CardContent>
          {options.includeWarmup && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <h4 className="font-medium text-sm mb-1">Warmup (5 min)</h4>
              <p className="text-xs text-gray-500">Dynamic stretches and light cardio to prepare your body</p>
            </div>
          )}
          
          <div className="space-y-3 my-2">
            {exercises.map((exercise, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="p-3 border rounded-md"
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{exercise.name}</h4>
                  <Badge>{exercise.sets} × {exercise.reps}</Badge>
                </div>
                
                <div className="text-xs text-gray-500 mt-1 flex justify-between">
                  <span>Rest: {exercise.rest}s between sets</span>
                  {exercise.notes && <span>{exercise.notes}</span>}
                </div>
              </motion.div>
            ))}
          </div>
          
          {options.includeCooldown && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <h4 className="font-medium text-sm mb-1">Cooldown (5 min)</h4>
              <p className="text-xs text-gray-500">Static stretches and breathing exercises to recover</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between gap-3">
          <Button variant="outline" onClick={onEdit} className="flex-1">
            Customize
          </Button>
          <Button onClick={onComplete} className="flex-1">
            Complete Workout
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}