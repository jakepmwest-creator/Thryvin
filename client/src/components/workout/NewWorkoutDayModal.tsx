import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  CheckCircle, 
  Dumbbell,
  Clock,
  Target,
  Calendar,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DailyWorkoutView } from './DailyWorkoutView';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  restTime: number;
  instructions: string;
  targetMuscles: string[];
  isCompleted: boolean;
  weight?: number;
}

interface WorkoutData {
  id: string;
  name: string;
  type: string;
  date: Date;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  muscleGroups: string[];
  exercises: Exercise[];
  description: string;
  coachNotes: string;
  isCompleted: boolean;
}

interface NewWorkoutDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutData: WorkoutData | null;
  onWorkoutUpdate: (workout: WorkoutData) => void;
  onMarkComplete: (workoutId: string) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export const NewWorkoutDayModal: React.FC<NewWorkoutDayModalProps> = ({
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

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowDetailedView(false);
      setExercisesOpen(false);
      setOverviewOpen(true);
    }
  }, [isOpen]);

  const handleStartWorkout = () => {
    console.log('🔥 START WORKOUT CLICKED - Going to detailed view!');
    setShowDetailedView(true);
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    console.log('🔥 SWIPE DETECTED:', direction);
    // 🎯 SWAPPED BACK: User prefers original swipe direction
    if (direction === 'left' && onSwipeRight) {
      console.log('🔥 Calling onSwipeRight');
      onSwipeRight();
    } else if (direction === 'right' && onSwipeLeft) {
      console.log('🔥 Calling onSwipeLeft');
      onSwipeLeft();
    }
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

  const getDifficultyBadgeStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500 text-white border-green-400';
      case 'medium': return 'bg-yellow-500 text-white border-yellow-400';
      case 'hard': return 'bg-red-500 text-white border-red-400';
      default: return 'bg-gray-500 text-white border-gray-400';
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (!isOpen || !workoutData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={onClose}
          />
          
          {/* Modal Wrapper */}
          <div className="fixed inset-0 z-[110] pointer-events-none grid place-items-center p-4">
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`pointer-events-auto ${
              showDetailedView 
                ? "w-full max-w-4xl max-h-[95vh] overflow-y-auto" 
                : "w-full max-w-md max-h-[90vh] overflow-hidden"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {showDetailedView ? (
              <div className="bg-white rounded-2xl shadow-2xl">
                <DailyWorkoutView
                  workoutId={workoutData.id}
                  workout={{
                    id: workoutData.id,
                    title: workoutData.name,
                    description: workoutData.description,
                    duration: workoutData.duration,
                    muscleGroups: workoutData.muscleGroups,
                    difficulty: workoutData.difficulty,
                    exercises: workoutData.exercises.map(ex => ({
                      id: ex.id,
                      name: ex.name,
                      description: ex.instructions,
                      sets: ex.sets || 3,
                      reps: typeof ex.reps === 'string' ? parseInt(ex.reps) || 10 : (ex.reps || 10),
                      weight: ex.weight
                    })),
                    coachComments: workoutData.coachNotes || 'Focus on form over speed. Take adequate rest between sets.'
                  }}
                  workoutType={workoutData.type}
                  onBack={() => setShowDetailedView(false)}
                  className="rounded-2xl"
                />
              </div>
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
                className={`bg-gradient-to-br ${getDayBasedGradient(workoutData.date)} rounded-3xl border-0 shadow-2xl overflow-hidden`}
              >
                {/* Close Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('🔥 CLOSE BUTTON CLICKED');
                    onClose();
                  }}
                  className="absolute right-4 top-4 z-10 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
                
                {/* Swipe Navigation Header */}
                <div className="flex items-center justify-between p-4 text-white">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('🔥 LEFT ARROW CLICKED - Going to previous day');
                      onSwipeLeft?.();
                    }}
                    disabled={!onSwipeLeft}
                    className="text-white hover:bg-white/20 p-2 rounded-lg disabled:opacity-50 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white mb-1">
                      {workoutData.date.toLocaleDateString('en-US', { weekday: 'long' })}
                    </p>
                    <p className="text-sm font-medium opacity-90">
                      {workoutData.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('🔥 RIGHT ARROW CLICKED - Going to next day');
                      onSwipeRight?.();
                    }}
                    disabled={!onSwipeRight}
                    className="text-white hover:bg-white/20 p-2 rounded-lg disabled:opacity-50 transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
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
                      <Badge className={`${getDifficultyBadgeStyle(workoutData.difficulty)} px-2 py-1 text-xs`}>
                        {workoutData.difficulty.charAt(0).toUpperCase() + workoutData.difficulty.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-t-3xl px-6 py-6 space-y-4">
                  {/* Overview Section */}
                  <Collapsible open={overviewOpen} onOpenChange={setOverviewOpen}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-purple-600" />
                          <span className="font-semibold text-gray-900">Overview</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${overviewOpen ? 'rotate-90' : ''}`} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 mt-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Description</h4>
                        <p className="text-sm text-gray-600">{workoutData.description}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Target Muscle Groups</h4>
                        <div className="flex flex-wrap gap-1">
                          {workoutData.muscleGroups.map((group, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {group}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {workoutData.coachNotes && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Coach Notes</h4>
                          <p className="text-sm text-gray-600 italic">{workoutData.coachNotes}</p>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Exercises Section */}
                  <Collapsible open={exercisesOpen} onOpenChange={setExercisesOpen}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="w-4 h-4 text-purple-600" />
                          <span className="font-semibold text-gray-900">Exercises</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${exercisesOpen ? 'rotate-90' : ''}`} />
                      </button>
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('🔥 START WORKOUT BUTTON CLICKED!');
                              handleStartWorkout();
                            }}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg"
                          >
                            <Play className="w-4 h-4" />
                            Start Workout
                          </button>
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
              </motion.div>
            )}
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};