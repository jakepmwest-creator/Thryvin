import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Zap, Calendar, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NewWorkoutDayModal } from './NewWorkoutDayModal';
import { useWorkoutStore } from '@/stores/workout-store';

interface WorkoutStatus {
  completed: boolean;
  workoutType?: string;
  muscleGroups?: string[];
  estimatedDuration?: number;
  difficulty?: string;
  missed?: boolean;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  workout?: WorkoutStatus;
}

interface SamsungGalaxyCalendarProps {
  onDateSelect?: (date: Date) => void;
  onWorkoutComplete?: (date: Date) => void;
  workoutData?: { [key: string]: WorkoutStatus };
  className?: string;
}

export function SamsungGalaxyCalendar({ 
  onDateSelect, 
  onWorkoutComplete, 
  workoutData = {},
  className = "" 
}: SamsungGalaxyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);

  // 🎯 STEP 3: Wire up global workout store  
  const { selectedDateISO, todayISO, setSelectedDate } = useWorkoutStore();
  
  // 🎯 On mount: if selectedDateISO is empty, set it to todayISO
  useEffect(() => {
    if (!selectedDateISO) {
      setSelectedDate(todayISO);
    }
  }, [selectedDateISO, todayISO, setSelectedDate]);

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Generate calendar days
  const generateCalendarDays = (): CalendarDay[] => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: CalendarDay[] = [];

    // Previous month days
    const prevMonth = new Date(currentYear, currentMonth - 1, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, prevMonth.getDate() - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        workout: workoutData[formatDateKey(date)]
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        workout: workoutData[formatDateKey(date)]
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        workout: workoutData[formatDateKey(date)]
      });
    }

    return days;
  };

  const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateClick = (day: CalendarDay) => {
    // 🎯 Day tap: only call setSelectedDate(dayISO) - no local state
    const dayISO = day.date.toISOString().split('T')[0];
    setSelectedDate(dayISO);
    setShowWorkoutModal(true); // Always show modal for any day clicked
    onDateSelect?.(day.date);
  };

  const getWorkoutStatusIcon = (workout?: WorkoutStatus) => {
    if (!workout) return null;
    
    if (workout.completed) {
      return <Check className="w-3 h-3 text-white" />;
    } else if (workout.missed) {
      return <div className="w-2 h-2 bg-orange-500 rounded-full" />;
    } else {
      return <Zap className="w-3 h-3 text-white" />;
    }
  };

  const getDateStyle = (day: CalendarDay) => {
    const baseClasses = "relative w-12 h-12 rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-150 cursor-pointer";
    
    if (!day.isCurrentMonth) {
      return `${baseClasses} text-gray-400 hover:text-gray-600 hover:bg-gray-50`;
    }
    
    if (day.isToday) {
      return `${baseClasses} bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md`;
    }
    
    if (day.workout?.completed) {
      return `${baseClasses} bg-green-50 text-green-700 border border-green-200`;
    }
    
    if (day.workout) {
      return `${baseClasses} bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200`;
    }
    
    return `${baseClasses} text-gray-900 hover:bg-gray-50`;
  };

  const calendarDays = generateCalendarDays();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{monthName}</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg w-8 h-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg w-8 h-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Labels */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div key={index} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={getDateStyle(day)}
              onClick={() => handleDateClick(day)}
            >
              <span className="text-sm">{day.date.getDate()}</span>
              
              {/* Single workout indicator dot - max one per day */}
              {day.isCurrentMonth && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  {day.workout?.completed ? (
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  ) : day.workout && day.workout.workoutType !== 'Rest Day' ? (
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  ) : (
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full opacity-50" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Simple Legend */}
      <div className="px-4 pb-3 border-t border-gray-100">
        <div className="flex items-center justify-center gap-6 pt-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
            <span>Workout</span>
          </div>
        </div>
      </div>

      {/* Workout Day Modal - Removed hardcoded data, will use AI-generated content later */}

    </div>
  );
}