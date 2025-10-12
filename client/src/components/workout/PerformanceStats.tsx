import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Target, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PerformanceTracker } from '@/utils/performanceTracking';

interface PerformanceStatsProps {
  className?: string;
}

export const PerformanceStats: React.FC<PerformanceStatsProps> = ({ className = '' }) => {
  const stats = PerformanceTracker.getUserPerformanceStats();

  const statCards = [
    {
      title: 'Total Workouts',
      value: stats.totalWorkouts,
      icon: <Calendar className="w-5 h-5" />,
      color: 'from-blue-500 to-blue-600',
      description: 'Completed sessions'
    },
    {
      title: 'Success Rate',
      value: `${Math.round(stats.averageSuccessRate * 100)}%`,
      icon: <Target className="w-5 h-5" />,
      color: 'from-green-500 to-green-600',
      description: 'Exercise completion'
    },
    {
      title: 'Current Streak',
      value: `${stats.streakDays} days`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'from-purple-500 to-purple-600',
      description: 'Consecutive training'
    },
    {
      title: 'Total Exercises',
      value: stats.totalExercises,
      icon: <Award className="w-5 h-5" />,
      color: 'from-orange-500 to-orange-600',
      description: 'Exercises completed'
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Performance Analytics</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-white border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-10 h-10 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm font-medium text-gray-700">{stat.title}</p>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Favorite Exercises */}
      {stats.favoriteExercises.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-purple-900 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Top Exercises
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {stats.favoriteExercises.map((exercise, index) => (
                <Badge
                  key={exercise}
                  variant="secondary"
                  className="bg-white/70 text-purple-800 border-purple-200"
                >
                  #{index + 1} {exercise}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.totalWorkouts === 0 && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Start Your Journey</h3>
            <p className="text-sm text-gray-600">
              Complete your first workout to see AI progression insights and performance analytics.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceStats;