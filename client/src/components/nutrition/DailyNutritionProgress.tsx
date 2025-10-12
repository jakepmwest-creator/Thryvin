import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DailyNutritionProgressProps {
  nutritionProfile: any;
  dailyStats: any;
  isLoading: boolean;
}

export default function DailyNutritionProgress({ 
  nutritionProfile, 
  dailyStats, 
  isLoading 
}: DailyNutritionProgressProps) {
  if (isLoading) {
    return (
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = dailyStats || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const goals = {
    calories: nutritionProfile?.calorieGoal || 2000,
    protein: nutritionProfile?.proteinGoal || 150,
    carbs: nutritionProfile?.carbGoal || 250,
    fat: nutritionProfile?.fatGoal || 65
  };

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'from-green-400 to-emerald-500';
    if (percentage >= 50) return 'from-yellow-400 to-orange-500';
    return 'from-purple-400 to-pink-500';
  };

  const macros = [
    { name: 'Calories', current: stats.calories, goal: goals.calories, unit: 'cal' },
    { name: 'Protein', current: stats.protein, goal: goals.protein, unit: 'g' },
    { name: 'Carbs', current: stats.carbs, goal: goals.carbs, unit: 'g' },
    { name: 'Fat', current: stats.fat, goal: goals.fat, unit: 'g' }
  ];

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Target className="w-5 h-5 mr-2 text-purple-500" />
          Daily Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {macros.map((macro, index) => {
            const percentage = getProgressPercentage(macro.current, macro.goal);
            const colorClass = getProgressColor(percentage);
            
            return (
              <div key={macro.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{macro.name}</span>
                  <span className="text-sm text-gray-500">
                    {macro.current} / {macro.goal} {macro.unit}
                  </span>
                </div>
                
                <div className="relative">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className={`h-full bg-gradient-to-r ${colorClass} rounded-full`}
                    />
                  </div>
                  
                  {percentage > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-xs font-medium text-white bg-black/20 rounded px-1"
                    >
                      {Math.round(percentage)}%
                    </motion.div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall Progress Summary */}
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <span className="font-medium text-gray-800">Today's Progress</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-purple-600">
                {Math.round(getProgressPercentage(stats.calories, goals.calories))}%
              </div>
              <div className="text-xs text-gray-500">of calorie goal</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}