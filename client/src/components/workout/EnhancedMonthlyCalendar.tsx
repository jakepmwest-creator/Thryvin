import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle, Plus, Calendar, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  isToday, 
  addMonths, 
  subMonths,
  eachDayOfInterval
} from 'date-fns';

interface WorkoutDay {
  date: Date;
  workoutType: string;
  duration: number;
  intensity: 'low' | 'medium' | 'high';
  isCompleted: boolean;
  isRestDay: boolean;
  isPastIncomplete?: boolean; // Track past incomplete days
  muscleGroups?: string[];
}

interface EnhancedMonthlyCalendarProps {
  workouts: WorkoutDay[];
  onDateSelect: (date: Date, workout?: WorkoutDay) => void;
  onAddWorkout: (date: Date) => void;
  onEditWorkout: (date: Date, workout: WorkoutDay) => void;
  onMoveWorkout: (fromDate: Date, toDate: Date) => void;
  onToggleCompletion?: (date: Date, workout: WorkoutDay) => void;
  className?: string;
}

export function EnhancedMonthlyCalendar({
  workouts,
  onDateSelect,
  onAddWorkout,
  onEditWorkout,
  onMoveWorkout,
  onToggleCompletion,
  className = ''
}: EnhancedMonthlyCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getWorkoutForDate = (date: Date): WorkoutDay | undefined => {
    return workouts.find(workout => isSameDay(workout.date, date));
  };

  const isWorkoutCompleted = (date: Date): boolean => {
    const workout = getWorkoutForDate(date);
    return workout?.isCompleted || false;
  };

  const handleDateClick = (date: Date) => {
    const workout = getWorkoutForDate(date);
    if (workout) {
      onDateSelect(date, workout);
    } else {
      onAddWorkout(date);
    }
  };

  const getDayStatus = (date: Date) => {
    const workout = getWorkoutForDate(date);
    const isCurrentDay = isToday(date);
    const isCompleted = isWorkoutCompleted(date);
    
    if (isCompleted) return 'completed';
    if (workout?.isPastIncomplete) return 'missed'; // 🚨 Handle past incomplete days
    if (isCurrentDay) return 'today';
    if (workout?.isRestDay) return 'rest';
    if (workout) return 'scheduled';
    return 'empty';
  };

  const getIntensityColor = (intensity: 'low' | 'medium' | 'high') => {
    switch (intensity) {
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWorkoutTypeEmoji = (workoutType: string) => {
    const typeMap: { [key: string]: string } = {
      'Upper Body': '💪',
      'Lower Body': '🦵',
      'Full Body': '⚡',
      'Cardio': '🫁',
      'HIIT': '🔥',
      'Yoga': '🧘‍♀️',
      'Strength': '🏋️',
      'Calisthenics': '🤸',
      'Rest': '🧘‍♂️'
    };
    return typeMap[workoutType] || '💪';
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = addDays(calendarStart, 41); // 6 weeks

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(direction === 'next' ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="h-10 w-10 p-0 rounded-full hover:bg-purple-50 hover:border-purple-300"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-2xl font-bold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="h-10 w-10 p-0 rounded-full hover:bg-purple-50 hover:border-purple-300"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth(new Date())}
          className="flex items-center gap-2 hover:bg-purple-50 hover:border-purple-300"
        >
          <Calendar className="w-4 h-4" />
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
        <CardContent className="p-0">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-gradient-to-r from-purple-500 to-pink-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="p-4 text-center text-sm font-semibold text-white"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-0">
            {calendarDays.map((date, index) => {
              const workout = getWorkoutForDate(date);
              const dayStatus = getDayStatus(date);
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              const dayNumber = format(date, 'd');

              return (
                <motion.div
                  key={index}
                  className={`
                    relative aspect-square border-r border-b border-gray-200 last:border-r-0 
                    cursor-pointer transition-all duration-200 p-2
                    ${!isCurrentMonth ? 'bg-gray-50 opacity-60' : 'bg-white hover:bg-purple-50'}
                    ${dayStatus === 'today' ? 'bg-gradient-to-br from-purple-100 to-pink-100 ring-2 ring-purple-400' : ''}
                    ${dayStatus === 'completed' ? 'bg-gradient-to-br from-green-50 to-emerald-50' : ''}
                    ${dayStatus === 'missed' ? 'bg-gradient-to-br from-red-50 to-orange-50 ring-1 ring-red-200' : ''}
                  `}
                  onClick={() => isCurrentMonth && handleDateClick(date)}
                >
                  {/* Date Number */}
                  <div className={`
                    absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${dayStatus === 'today' ? 'bg-purple-600 text-white' : ''}
                    ${dayStatus === 'completed' ? 'bg-green-600 text-white' : ''}
                    ${dayStatus === 'missed' ? 'bg-red-500 text-white' : ''}
                    ${dayStatus === 'scheduled' ? 'bg-blue-100 text-blue-800' : ''}
                    ${dayStatus === 'rest' ? 'bg-gray-100 text-gray-600' : ''}
                    ${dayStatus === 'empty' && isCurrentMonth ? 'text-gray-700' : ''}
                    ${!isCurrentMonth ? 'text-gray-400' : ''}
                  `}>
                    {dayNumber}
                  </div>

                  {/* Completion Badge & Toggle */}
                  {workout && isCurrentMonth && (
                    <div className="absolute top-1 right-1">
                      {onToggleCompletion ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleCompletion(date, workout);
                          }}
                          className={`rounded-full p-1 shadow-sm transition-all hover:scale-110 ${
                            dayStatus === 'completed' 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-gray-300 hover:bg-green-400'
                          }`}
                        >
                          <CheckCircle className={`w-3 h-3 ${
                            dayStatus === 'completed' ? 'text-white' : 'text-gray-500'
                          }`} />
                        </button>
                      ) : (
                        dayStatus === 'completed' && (
                          <div className="bg-green-500 rounded-full p-1 shadow-sm">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Workout Content */}
                  {workout && isCurrentMonth && (
                    <div className="absolute inset-0 pt-8 pb-2 px-2 flex flex-col items-center justify-center">
                      {/* Workout Emoji */}
                      <div className="text-lg mb-1">
                        {getWorkoutTypeEmoji(workout.workoutType)}
                      </div>
                      
                      {/* Workout Name */}
                      <div className="text-xs font-medium text-gray-700 text-center leading-tight mb-1 line-clamp-2">
                        {workout.workoutType}
                      </div>
                      
                      {/* Duration and Intensity */}
                      {!workout.isRestDay && (
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-xs text-gray-500 font-medium">
                            {workout.duration}min
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-1 py-0 h-4 ${getIntensityColor(workout.intensity)}`}
                          >
                            {workout.intensity}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add Workout Button for Empty Days */}
                  {!workout && isCurrentMonth && dayStatus !== 'today' && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <div className="bg-purple-100 rounded-full p-2 shadow-sm">
                        <Plus className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-full flex items-center justify-center">
                <CheckCircle className="w-2.5 h-2.5 text-green-600" />
              </div>
              <span className="text-gray-700 font-medium">Completed</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-400 rounded-full"></div>
              <span className="text-gray-700 font-medium">Today</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center">
                <Target className="w-2.5 h-2.5 text-blue-600" />
              </div>
              <span className="text-gray-700 font-medium">Scheduled</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded-full"></div>
              <span className="text-gray-700 font-medium">Rest Day</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Stats */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-purple-600">
                {workouts.filter(w => w.isCompleted && w.date.getMonth() === currentMonth.getMonth()).length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-600">
                {workouts.filter(w => !w.isRestDay && w.date.getMonth() === currentMonth.getMonth()).length}
              </div>
              <div className="text-sm text-gray-600">Scheduled</div>
            </div>
            
            <div className="space-y-1">
              <div className="text-2xl font-bold text-gray-600">
                {workouts.filter(w => w.isRestDay && w.date.getMonth() === currentMonth.getMonth()).length}
              </div>
              <div className="text-sm text-gray-600">Rest Days</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}