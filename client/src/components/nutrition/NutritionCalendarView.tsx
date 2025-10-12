import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Grid3X3, 
  List,
  Coffee,
  Sun,
  Moon,
  ChefHat,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isPast, startOfMonth, endOfMonth } from 'date-fns';

interface NutritionCalendarViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  loggedMeals: Record<string, any[]>;
  plannedMeals: Record<string, any[]>;
  onDayClick: (date: Date) => void;
}

export default function NutritionCalendarView({
  selectedDate,
  onDateSelect,
  loggedMeals,
  plannedMeals,
  onDayClick
}: NutritionCalendarViewProps) {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentWeek, setCurrentWeek] = useState(selectedDate);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const monthStart = startOfMonth(currentWeek);
  const monthEnd = endOfMonth(currentWeek);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    newDate.setMonth(currentWeek.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentWeek(newDate);
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return Coffee;
      case 'lunch': return Sun;
      case 'dinner': return Moon;
      case 'snack': return ChefHat;
      default: return Coffee;
    }
  };

  const getDayMealStatus = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const logged = loggedMeals[dateKey] || [];
    const planned = plannedMeals[dateKey] || [];
    
    const loggedTypes = logged.map(m => m.mealType);
    const plannedTypes = planned.map(m => m.mealType);
    
    return {
      logged: loggedTypes,
      planned: plannedTypes,
      totalLogged: logged.length,
      totalPlanned: planned.length
    };
  };

  const renderWeekView = () => (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateWeek('prev')}
          className="rounded-xl"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="font-semibold">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateWeek('next')}
          className="rounded-xl"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const dayStatus = getDayMealStatus(day);
          const isSelected = isSameDay(day, selectedDate);
          const isDayToday = isToday(day);
          const isDayPast = isPast(day) && !isDayToday;
          
          return (
            <motion.div
              key={day.toISOString()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 aspect-square flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-[#7A3CF3] to-[#FF4FD8] text-white shadow-xl'
                  : isDayToday
                  ? 'bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-300 text-purple-900'
                  : isDayPast
                  ? 'bg-gray-50 text-gray-400'
                  : 'bg-white border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg'
              }`}
              onClick={() => {
                onDateSelect(day);
                onDayClick(day);
              }}
            >
              <div className="text-center">
                <div className="text-xs font-bold mb-1 uppercase tracking-wide">
                  {format(day, 'EEE')}
                </div>
                <div className="text-2xl font-black mb-2">
                  {format(day, 'd')}
                </div>
              </div>
                
              {/* Meal Status Dots */}
              <div className="flex justify-center space-x-1">
                {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
                  const isLogged = dayStatus.logged.includes(mealType);
                  const isPlanned = dayStatus.planned.includes(mealType);
                  
                  return (
                    <div
                      key={mealType}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        isLogged
                          ? 'bg-green-500 shadow-lg'
                          : isPlanned
                          ? 'bg-green-300'
                          : isSelected || isDayToday
                          ? 'bg-white/50'
                          : 'bg-gray-300'
                      }`}
                    />
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const renderMonthView = () => (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('prev')}
          className="rounded-xl"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="font-semibold">
          {format(currentWeek, 'MMMM yyyy')}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('next')}
          className="rounded-xl"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Month Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {/* Month Days */}
        {monthDays.map((day) => {
          const dayStatus = getDayMealStatus(day);
          const isSelected = isSameDay(day, selectedDate);
          const isDayToday = isToday(day);
          const isDayPast = isPast(day) && !isDayToday;
          
          return (
            <motion.div
              key={day.toISOString()}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`aspect-square p-1 rounded-xl cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  : isDayToday
                  ? 'bg-green-100 border border-green-300'
                  : isDayPast
                  ? 'bg-gray-50 text-gray-400'
                  : 'hover:bg-green-50'
              }`}
              onClick={() => {
                onDateSelect(day);
                onDayClick(day);
              }}
            >
              <div className="text-xs font-medium text-center mb-1">
                {format(day, 'd')}
              </div>
              
              {/* Simplified meal indicators for month view */}
              <div className="flex justify-center">
                {dayStatus.totalLogged > 0 ? (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                ) : dayStatus.totalPlanned > 0 ? (
                  <div className="w-2 h-2 bg-green-200 rounded-full"></div>
                ) : (
                  <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-green-500" />
            Nutrition Calendar
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={() => setViewMode('week')}
              className={`rounded-xl transition-all duration-200 ${
                viewMode === 'week' 
                  ? 'bg-gradient-to-r from-[#7A3CF3] to-[#FF4FD8] text-white shadow-lg hover:shadow-xl' 
                  : 'bg-white border-2 border-purple-200 text-purple-600 hover:bg-purple-50'
              }`}
            >
              <List className="w-3 h-3 mr-1" />
              Week
            </Button>
            <Button
              size="sm"
              onClick={() => setViewMode('month')}
              className={`rounded-xl transition-all duration-200 ${
                viewMode === 'month' 
                  ? 'bg-gradient-to-r from-[#7A3CF3] to-[#FF4FD8] text-white shadow-lg hover:shadow-xl' 
                  : 'bg-white border-2 border-purple-200 text-purple-600 hover:bg-purple-50'
              }`}
            >
              <Grid3X3 className="w-3 h-3 mr-1" />
              Month
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'week' ? renderWeekView() : renderMonthView()}
        
        {/* Legend */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Logged</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-200 rounded-full"></div>
              <span>Planned</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
              <span>Empty</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}