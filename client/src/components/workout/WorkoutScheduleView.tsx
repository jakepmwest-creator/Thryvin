import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Calendar, CheckCircle, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, startOfWeek, addDays, isSameDay, isToday, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval, isPast } from 'date-fns';
import { DailyWorkoutView } from './DailyWorkoutView';
import { EnhancedMonthlyCalendar } from './EnhancedMonthlyCalendar';
import SamsungGalaxyCalendar from './SamsungGalaxyCalendar';

interface WorkoutDay {
  date: Date;
  workout?: {
    id: string;
    name: string;
    emoji: string;
    duration: number;
    difficulty: 'easy' | 'medium' | 'hard';
    type: string;
  };
  isRestDay?: boolean;
  personalEvent?: {
    title: string;
    type: 'work' | 'travel' | 'other';
  };
}

interface WorkoutScheduleViewProps {
  onWorkoutSelect: (workoutId: string, date: Date) => void;
  onAddPersonalEvent: (date: Date) => void;
  className?: string;
  weeklySchedule?: any; // AI-generated weekly schedule
}

export const WorkoutScheduleView: React.FC<WorkoutScheduleViewProps> = ({
  onWorkoutSelect,
  onAddPersonalEvent,
  weeklySchedule,
  className = ''
}) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'galaxy'>('week');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());
  
  // Load completed dates from localStorage
  useEffect(() => {
    const loadCompletedDates = () => {
      const historyKey = 'thryvin-performance-history';
      const stored = localStorage.getItem(historyKey);
      if (stored) {
        try {
          const history = JSON.parse(stored);
          const completed = new Set(history.map((workout: any) => workout.date));
          setCompletedDates(completed);
        } catch (error) {
          console.error('Error loading completed dates:', error);
        }
      }
    };
    loadCompletedDates();
  }, []);
  
  // Sample workout data - this would come from your API
  // Generate workout schedule from AI data or use default
  const generateWorkoutSchedule = (): WorkoutDay[] => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const startOfCurrentWeek = startOfWeek(currentWeek);
    
    if (weeklySchedule?.days) {
      return days.map((dayName, index) => {
        const dayData = weeklySchedule.days[dayName];
        const date = addDays(startOfCurrentWeek, index);
        
        if (dayData?.isRestDay) {
          return { date, isRestDay: true };
        }
        
        if (dayData?.workoutType && dayData.workoutType !== 'Rest') {
          const workoutTypeMap: { [key: string]: { emoji: string; difficulty: 'easy' | 'medium' | 'hard' } } = {
            'HIIT': { emoji: '🔥', difficulty: 'hard' },
            'HIIT Cardio': { emoji: '🔥', difficulty: 'hard' },
            'Lower Body': { emoji: '🦵', difficulty: 'medium' },
            'Lower Body Strength': { emoji: '🦵', difficulty: 'medium' },
            'Lower Body Power': { emoji: '💥', difficulty: 'hard' },
            'Upper Body': { emoji: '💪', difficulty: 'medium' },
            'Upper Body Strength': { emoji: '💪', difficulty: 'medium' },
            'Upper Body Power': { emoji: '💥', difficulty: 'hard' },
            'Full Body': { emoji: '⚡', difficulty: 'medium' },
            'Full Body Circuit': { emoji: '⚡', difficulty: 'hard' },
            'Cardio': { emoji: '🫁', difficulty: 'medium' },
            'Cardio Burn': { emoji: '🔥', difficulty: 'hard' },
            'Strength': { emoji: '🏋️', difficulty: 'hard' },
            'Yoga': { emoji: '🧘‍♀️', difficulty: 'easy' },
            'Calisthenics': { emoji: '🤸', difficulty: 'medium' }
          };
          
          const typeConfig = workoutTypeMap[dayData.workoutType] || { emoji: '💪', difficulty: 'medium' as const };
          
          return {
            date,
            workout: {
              id: `workout-${format(date, 'yyyy-MM-dd')}`,
              name: dayData.workoutType,
              emoji: typeConfig.emoji,
              duration: dayData.duration || 45,
              difficulty: typeConfig.difficulty,
              type: dayData.workoutType.toLowerCase().includes('hiit') ? 'hiit' :
                    dayData.workoutType.toLowerCase().includes('lower') ? 'lower' :
                    dayData.workoutType.toLowerCase().includes('upper') ? 'upper' :
                    dayData.workoutType.toLowerCase().includes('cardio') ? 'cardio' :
                    dayData.workoutType.toLowerCase().includes('yoga') ? 'yoga' :
                    dayData.workoutType.toLowerCase().includes('strength') ? 'strength' :
                    'full-body'
            }
          };
        }
        
        return { date, isRestDay: true };
      });
    }
    
    // Fallback to default schedule with proper workout type IDs
    return [
      {
        date: startOfCurrentWeek,
        workout: { id: 'upper-body-blast', name: 'Upper Body Blast', emoji: '💪', duration: 45, difficulty: 'medium', type: 'upper' }
      },
      {
        date: addDays(startOfCurrentWeek, 1),
        workout: { id: 'hiit-cardio', name: 'HIIT Cardio', emoji: '🔥', duration: 30, difficulty: 'hard', type: 'hiit' }
      },
      {
        date: addDays(startOfCurrentWeek, 2),
        workout: { id: 'lower-body-power', name: 'Lower Body Power', emoji: '🦵', duration: 50, difficulty: 'medium', type: 'lower' }
      },
      { date: addDays(startOfCurrentWeek, 3), isRestDay: true },
      {
        date: addDays(startOfCurrentWeek, 4),
        workout: { id: 'yoga-flexibility', name: 'Core & Flexibility', emoji: '🧘‍♀️', duration: 35, difficulty: 'easy', type: 'yoga' }
      },
      {
        date: addDays(startOfCurrentWeek, 5),
        workout: { id: 'full-body-circuit', name: 'Full Body Circuit', emoji: '⚡', duration: 40, difficulty: 'hard', type: 'full-body' }
      },
      { date: addDays(startOfCurrentWeek, 6), isRestDay: true }
    ];
  };

  const workoutSchedule = generateWorkoutSchedule();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(direction === 'next' ? addWeeks(currentWeek, 1) : subWeeks(currentWeek, 1));
  };

  const WeeklyView = () => (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateWeek('prev')}
            className="p-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-lg font-semibold text-gray-900">
            Week of {format(startOfWeek(currentWeek), 'MMM d')}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateWeek('next')}
            className="p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode('galaxy')}
          className="bg-gradient-to-r from-purple-500 to-pink-500 border-none text-white hover:from-purple-600 hover:to-pink-600 rounded-xl"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Month View
        </Button>
      </div>

      {/* Day Cards */}
      <div className="grid grid-cols-1 gap-3">
        {workoutSchedule.map((day, index) => {
          const isCurrentDay = isToday(day.date);
          const dayName = format(day.date, 'EEEE');
          const dayDate = format(day.date, 'MMM d');
          const dateStr = format(day.date, 'yyyy-MM-dd');
          const isCompleted = completedDates.has(dateStr);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="w-full"
            >
              <Card
                className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl rounded-2xl ${
                  isCurrentDay 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-2xl transform scale-105' 
                    : isPast(day.date) && !isToday(day.date)
                    ? 'bg-gray-50 border-gray-200 opacity-60'
                    : 'bg-white border-gray-100 shadow-md'
                } ${day.isRestDay ? 'bg-gray-100 border-gray-200' : ''} ${
                  isCompleted ? 'ring-4 ring-green-300 bg-green-50 border-green-200' : ''
                }`}
                onClick={() => {
                  if (day.workout) {
                    setSelectedWorkoutId(day.workout.id);
                    onWorkoutSelect(day.workout.id, day.date);
                  } else if (!day.isRestDay) {
                    onAddPersonalEvent(day.date);
                  }
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[80px]">
                        <div className={`text-lg font-bold ${isCurrentDay ? 'text-white' : 'text-gray-900'}`}>
                          {isCurrentDay ? `Today` : dayName}
                        </div>
                        <div className={`text-sm ${isCurrentDay ? 'text-purple-100' : 'text-gray-500'}`}>
                          {dayDate}
                        </div>
                      </div>
                      
                      {day.workout && (
                        <>
                          <div className="text-3xl">{day.workout.emoji}</div>
                          <div className="flex-1">
                            <h4 className={`text-lg font-bold ${isCurrentDay ? 'text-white' : 'text-gray-900'}`}>
                              {day.workout.name}
                            </h4>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge
                                variant="secondary"
                                className={`${isCurrentDay ? 'bg-white/20 text-white border-white/30' : getDifficultyColor(day.workout.difficulty)} rounded-full px-3 py-1`}
                              >
                                {day.workout.difficulty}
                              </Badge>
                              <span className={`text-sm font-medium ${isCurrentDay ? 'text-purple-100' : 'text-gray-600'}`}>
                                {day.workout.duration} minutes
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {day.isRestDay && !day.personalEvent && (
                        <>
                          <div className="text-3xl">🧘‍♂️</div>
                          <div className="flex-1">
                            <h4 className={`text-lg font-bold ${isCurrentDay ? 'text-white' : 'text-gray-700'}`}>
                              Rest Day
                            </h4>
                            <p className={`text-sm ${isCurrentDay ? 'text-purple-100' : 'text-gray-500'}`}>
                              Recovery & relaxation
                            </p>
                          </div>
                        </>
                      )}
                      
                      {day.personalEvent && (
                        <>
                          <div className="text-3xl">📅</div>
                          <div className="flex-1">
                            <h4 className={`text-lg font-bold ${isCurrentDay ? 'text-white' : 'text-gray-700'}`}>
                              {day.personalEvent.title}
                            </h4>
                            <p className={`text-sm ${isCurrentDay ? 'text-purple-100' : 'text-gray-500'} capitalize`}>
                              {day.personalEvent.type}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {isCompleted && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-full ${isCurrentDay ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}
                        >
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-semibold">Completed</span>
                        </motion.div>
                      )}
                      {!day.workout && !day.isRestDay && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`rounded-full p-3 ${isCurrentDay ? 'text-white hover:bg-white/20' : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'}`}
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const generateMonthDays = () => {
    const today = new Date();
    const year = currentWeek.getFullYear();
    const month = currentWeek.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 });
    
    const days = [];
    
    // Generate 42 days (6 weeks) to fill the calendar grid
    for (let i = 0; i < 42; i++) {
      const date = addDays(startDate, i);
      const isCurrentMonth = date.getMonth() === month;
      const isCurrentDay = isToday(date);
      const isPastDay = date < today && !isCurrentDay;
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Sample workout assignment logic
      const dayOfWeek = date.getDay();
      const workoutIndex = Math.floor(Math.random() * 5); // Random workout for demo
      const workoutData = dayOfWeek === 0 ? null : {
        id: `workout-${dateStr}`,
        name: ['Upper Body', 'Cardio HIIT', 'Lower Body', 'Core & Flexibility', 'Full Body'][workoutIndex],
        emoji: ['💪', '🔥', '🦵', '🧘‍♀️', '⚡'][workoutIndex],
        duration: [45, 30, 50, 35, 40][workoutIndex],
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'easy' | 'medium' | 'hard',
        type: 'workout'
      };
      
      days.push({
        date,
        dayNumber: format(date, 'd'),
        isCurrentDay,
        isCurrentMonth,
        isPastDay,
        isRestDay: dayOfWeek === 0,
        workout: isCurrentMonth ? workoutData : null,
        isCompleted: completedDates.has(dateStr)
      });
    }
    
    return days;
  };

  // Convert workout schedule to format expected by EnhancedMonthlyCalendar
  const convertToCalendarWorkouts = () => {
    const calendarWorkouts = [];
    
    // Generate a month's worth of workouts from the current weekly schedule
    const startOfCurrentMonth = startOfMonth(currentWeek);
    const endOfCurrentMonth = endOfMonth(currentWeek);
    const daysInMonth = eachDayOfInterval({ start: startOfCurrentMonth, end: endOfCurrentMonth });
    
    daysInMonth.forEach(date => {
      const dayOfWeek = format(date, 'EEEE');
      const weeklyDay = workoutSchedule.find(w => w.date && isSameDay(w.date, date));
      
      if (weeklyDay?.workout) {
        calendarWorkouts.push({
          date,
          workoutType: weeklyDay.workout.name,
          duration: weeklyDay.workout.duration,
          intensity: weeklyDay.workout.difficulty === 'easy' ? 'low' : 
                    weeklyDay.workout.difficulty === 'hard' ? 'high' : 'medium',
          isCompleted: completedDates.has(format(date, 'yyyy-MM-dd')),
          isRestDay: false,
          muscleGroups: weeklyDay.workout.type === 'upper' ? ['Chest', 'Back', 'Shoulders', 'Arms'] :
                       weeklyDay.workout.type === 'lower' ? ['Legs', 'Glutes', 'Calves'] :
                       weeklyDay.workout.type === 'cardio' ? ['Cardio'] :
                       weeklyDay.workout.type === 'hiit' ? ['Full Body', 'Cardio'] :
                       ['Full Body']
        });
      } else if (weeklyDay?.isRestDay) {
        calendarWorkouts.push({
          date,
          workoutType: 'Rest',
          duration: 0,
          intensity: 'low' as const,
          isCompleted: false,
          isRestDay: true
        });
      }
    });
    
    return calendarWorkouts;
  };

  const handleDateSelect = (date: Date, workout?: any) => {
    if (workout) {
      onWorkoutSelect(workout.workoutType.toLowerCase().replace(/\s+/g, '-'), date);
    }
  };

  const handleAddWorkout = (date: Date) => {
    onAddPersonalEvent(date);
  };

  const handleEditWorkout = (date: Date, workout: any) => {
    // Handle workout editing - for now just trigger selection
    onWorkoutSelect(workout.workoutType.toLowerCase().replace(/\s+/g, '-'), date);
  };

  const handleMoveWorkout = (fromDate: Date, toDate: Date) => {
    // Handle workout moving - placeholder for future implementation
    console.log('Move workout from', fromDate, 'to', toDate);
  };

  const MonthlyView = () => {
    const calendarWorkouts = convertToCalendarWorkouts();
    
    return (
      <EnhancedMonthlyCalendar
        workouts={calendarWorkouts}
        onDateSelect={handleDateSelect}
        onAddWorkout={handleAddWorkout}
        onEditWorkout={handleEditWorkout}
        onMoveWorkout={handleMoveWorkout}
        className="space-y-4"
      />
    );
  };

  // Convert workout data for Samsung Galaxy calendar
  const convertToGalaxyWorkouts = () => {
    const galaxyWorkouts: { [key: string]: any } = {};
    
    // Generate a month's worth of workouts from the current weekly schedule
    const startOfCurrentMonth = startOfMonth(currentWeek);
    const endOfCurrentMonth = endOfMonth(currentWeek);
    const daysInMonth = eachDayOfInterval({ start: startOfCurrentMonth, end: endOfCurrentMonth });
    
    daysInMonth.forEach(date => {
      const dayOfWeek = format(date, 'EEEE');
      const weeklyDay = workoutSchedule.find(w => w.date && isSameDay(w.date, date));
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (weeklyDay?.workout) {
        galaxyWorkouts[dateKey] = {
          completed: completedDates.has(dateKey),
          workoutType: weeklyDay.workout.name,
          muscleGroups: weeklyDay.workout.type === 'upper' ? ['Chest', 'Back', 'Shoulders', 'Arms'] :
                       weeklyDay.workout.type === 'lower' ? ['Legs', 'Glutes', 'Calves'] :
                       weeklyDay.workout.type === 'cardio' ? ['Cardio'] :
                       weeklyDay.workout.type === 'hiit' ? ['Full Body', 'Cardio'] :
                       ['Full Body'],
          estimatedDuration: weeklyDay.workout.duration,
          difficulty: weeklyDay.workout.difficulty,
          missed: false // Could be determined by logic for past dates
        };
      } else if (weeklyDay?.isRestDay) {
        galaxyWorkouts[dateKey] = {
          completed: true,
          workoutType: 'Rest Day',
          muscleGroups: [],
          estimatedDuration: 0,
          difficulty: 'easy',
          missed: false
        };
      }
    });
    
    return galaxyWorkouts;
  };

  const ViewToggle = () => (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <Button
        variant={viewMode === 'week' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('week')}
        className="flex items-center gap-2"
      >
        <List className="w-4 h-4" />
        Week
      </Button>
      <Button
        variant={viewMode === 'galaxy' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('galaxy')}
        className="flex items-center gap-2"
      >
        <CalendarDays className="w-4 h-4" />
        Month
      </Button>
    </div>
  );

  // Show detailed workout view if one is selected
  if (selectedWorkoutId) {
    return (
      <DailyWorkoutView 
        workoutId={selectedWorkoutId} 
        onBack={() => setSelectedWorkoutId(null)}
        className={className}
      />
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with View Toggle */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workout Schedule</h2>
          <p className="text-gray-600 mt-1">Plan and track your fitness journey</p>
        </div>
        <ViewToggle />
      </div>

      {/* Render appropriate view - Galaxy is now "Month" */}
      <AnimatePresence mode="wait">
        {viewMode === 'week' ? (
          <WeeklyView key="weekly" />
        ) : (
          <motion.div
            key="galaxy"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <SamsungGalaxyCalendar
              workoutData={convertToGalaxyWorkouts()}
              onDateSelect={(date) => {
                const dateKey = format(date, 'yyyy-MM-dd');
                const workout = convertToGalaxyWorkouts()[dateKey];
                if (workout && workout.workoutType !== 'Rest Day') {
                  const workoutId = workout.workoutType.toLowerCase().replace(/\s+/g, '-');
                  console.log('Galaxy calendar selecting workout:', workoutId, 'from type:', workout.workoutType);
                  onWorkoutSelect(workoutId, date);
                }
              }}
              onWorkoutComplete={(date) => {
                const dateKey = format(date, 'yyyy-MM-dd');
                const workout = convertToGalaxyWorkouts()[dateKey];
                if (workout && workout.workoutType !== 'Rest Day') {
                  onWorkoutSelect(workout.workoutType.toLowerCase().replace(/\s+/g, '-'), date);
                }
              }}
              className="w-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkoutScheduleView;