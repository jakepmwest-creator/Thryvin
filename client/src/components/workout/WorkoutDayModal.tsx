import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Play,
  Clock,
  Target,
  Dumbbell,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Activity,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DailyWorkoutView } from './DailyWorkoutView';

interface WorkoutExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  duration?: number;
  restTime: number;
  instructions: string;
  targetMuscles: string[];
  modifications?: string;
  isCompleted?: boolean;
}

interface WorkoutData {
  id: string;
  name: string;
  type: string;
  date: Date;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  muscleGroups: string[];
  exercises: WorkoutExercise[];
  description: string;
  coachNotes: string;
  isCompleted: boolean;
  completedAt?: Date;
  userNotes?: string;
  rating?: number;
}

interface WorkoutDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutData: WorkoutData | null;
  onWorkoutUpdate: (workout: WorkoutData) => void;
  onMarkComplete: (workoutId: string) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export const WorkoutDayModal: React.FC<WorkoutDayModalProps> = ({
  isOpen,
  onClose,
  workoutData,
  onWorkoutUpdate,
  onMarkComplete,
  onSwipeLeft,
  onSwipeRight
}) => {
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [exercisesOpen, setExercisesOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(true);
  const { toast } = useToast();

  // Guard against unmount while open and reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setShowDetailedView(false);
    }
  }, [isOpen]);

  const handleSwipe = (direction: 'left' | 'right') => {
    console.log('🔥 SWIPE DETECTED:', direction);
    if (direction === 'left' && onSwipeRight) {
      console.log('🔥 Calling onSwipeRight');
      onSwipeRight();
    } else if (direction === 'right' && onSwipeLeft) {
      console.log('🔥 Calling onSwipeLeft');
      onSwipeLeft();
    }
  };

  // Unified close handler
  const handleOpenChange = (open: boolean) => {
    console.log('🔥 MODAL CLOSE TRIGGERED:', open);
    if (!open) {
      setShowDetailedView(false);
      onClose();
    }
  };

  const handleStartWorkout = () => {
    console.log('🔥 START WORKOUT CLICKED - Setting detailed view to true');
    setShowDetailedView(true);
    console.log('🔥 Detailed view state updated');
  };

  const handleCompleteWorkout = () => {
    if (!workoutData) return;
    onMarkComplete(workoutData.id);
    toast({
      title: "Workout Complete!",
      description: "Great job! Keep up the momentum.",
    });
    onClose();
  };

  const getDifficultyBadgeStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500 text-white border-green-400';
      case 'medium': return 'bg-yellow-500 text-white border-yellow-400';
      case 'hard': return 'bg-red-500 text-white border-red-400';
      default: return 'bg-gray-500 text-white border-gray-400';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getDayBasedGradient = (date: Date) => {
    const day = date.getDay();
    const gradients = [
      'from-purple-500 via-indigo-500 to-blue-600', // Sunday
      'from-blue-500 via-purple-500 to-pink-600',   // Monday
      'from-pink-500 via-rose-500 to-red-600',      // Tuesday
      'from-orange-500 via-amber-500 to-yellow-600', // Wednesday
      'from-green-500 via-emerald-500 to-teal-600', // Thursday
      'from-teal-500 via-cyan-500 to-blue-600',     // Friday
      'from-violet-500 via-purple-500 to-pink-600'  // Saturday
    ];
    return gradients[day];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Single Dialog root to prevent overlay issues
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className={showDetailedView 
          ? "max-w-4xl max-h-[95vh] overflow-y-auto p-0" 
          : `max-w-md max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br ${workoutData ? getDayBasedGradient(workoutData.date) : 'from-gray-400 to-gray-600'} rounded-3xl border-0`
        }
      >
        <DialogTitle className="sr-only">
  {showDetailedView ? 'Daily Workout View' : `Workout Details for ${workoutData?.name || 'Unknown'}`}
        </DialogTitle>
        
        {/* Defensive fallback if workoutData is null */}
        {!workoutData ? (
          <div className="p-6 text-center text-gray-600">
            No workout data available
          </div>
        ) : showDetailedView ? (
          <DailyWorkoutView
            workoutId={workoutData.id}
            onBack={() => setShowDetailedView(false)}
            className="rounded-lg"
          />
        ) : (
        
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
onDragEnd={(_, info) => {
            console.log('🔥 DRAG END DETECTED:', info.offset.x);
            const threshold = 100;
            if (info.offset.x > threshold) {
              console.log('🔥 Threshold exceeded for RIGHT swipe');
              handleSwipe('right');
            } else if (info.offset.x < -threshold) {
              console.log('🔥 Threshold exceeded for LEFT swipe');
              handleSwipe('left');
            }
          }}
          className="w-full h-full"
        >
        
        {/* Swipe Navigation Header */}
        <div className="flex items-center justify-between p-4 text-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSwipeLeft?.();
            }}
            disabled={!onSwipeLeft}
            className="text-white hover:bg-white/20 p-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-white mb-1">{workoutData.date.toLocaleDateString('en-US', { weekday: 'long' })}</p>
            <p className="text-sm font-medium opacity-90">{workoutData.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSwipeRight?.();
            }}
            disabled={!onSwipeRight}
            className="text-white hover:bg-white/20 p-2"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Header */}
        <div className="px-6 pb-4 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{workoutData.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {workoutData.isCompleted && (
                  <Badge className="bg-green-500 text-white border-green-400 px-2 py-1 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold">{workoutData.duration}</div>
              <div className="text-xs opacity-80">Minutes</div>
            </div>
            <div>
              <div className="text-lg font-bold">{workoutData.exercises.length}</div>
              <div className="text-xs opacity-80">Exercises</div>
            </div>
            <div>
              <div className="text-lg font-bold">{workoutData.muscleGroups.length}</div>
              <div className="text-xs opacity-80">Muscle Groups</div>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="bg-white rounded-t-3xl flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            
            {/* Overview Dropdown */}
            <Collapsible open={overviewOpen} onOpenChange={setOverviewOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-sm">Overview</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${overviewOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-700 text-xs leading-relaxed">{workoutData.description}</p>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-200">
                  <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2 text-sm">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    AI Coach Notes
                  </h4>
                  <p className="text-gray-700 text-xs leading-relaxed">{workoutData.coachNotes}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <Clock className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                    <div className="text-xs font-semibold">{workoutData.duration} min</div>
                    <div className="text-xs text-gray-600">Duration</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <Target className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                    <div className="text-xs font-semibold">{workoutData.muscleGroups.join(', ')}</div>
                    <div className="text-xs text-gray-600">Target Muscles</div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Exercises Dropdown */}
            <Collapsible open={exercisesOpen} onOpenChange={setExercisesOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-3 h-auto">
                  <div className="flex items-center gap-3">
                    <Dumbbell className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-sm">Exercises ({workoutData.exercises.length})</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${exercisesOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 max-h-40 overflow-y-auto">
                {workoutData.exercises.map((exercise, index) => (
                  <div key={exercise.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{exercise.name}</h4>
                      {exercise.isCompleted && (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      {exercise.sets} sets × {exercise.reps} reps
                      {exercise.weight && ` • ${exercise.weight} lbs`}
                      {` • ${exercise.restTime}s rest`}
                    </div>
                    <p className="text-xs text-gray-700 line-clamp-2">{exercise.instructions}</p>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              {!workoutData.isCompleted ? (
                <>
                  {isToday(workoutData.date) ? (
                    <Button
                      onClick={(e) => {
                        console.log('🔥 START WORKOUT BUTTON CLICKED!');
                        e.preventDefault();
                        e.stopPropagation();
                        handleStartWorkout();
                      }}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-2 rounded-xl text-sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Workout
                    </Button>
                  ) : (
                    <div className="text-center py-3 bg-gray-50 rounded-xl">
                      <p className="text-gray-700 font-semibold text-sm mb-1">That's not today's workout</p>
                      <p className="text-gray-600 text-xs">Ask coach if you wanna swap it</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-3">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-1" />
                  <p className="text-green-700 font-semibold text-sm">Workout Completed!</p>
                  <p className="text-gray-600 text-xs">Great job on finishing your workout</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};