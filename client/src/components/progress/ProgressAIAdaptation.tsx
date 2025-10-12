import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, ArrowRight, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { progressTracker } from '@/utils/ProgressTracker';

interface ProgressAIAdaptationProps {
  className?: string;
}

export const ProgressAIAdaptation: React.FC<ProgressAIAdaptationProps> = ({ className = "" }) => {
  const [recentWorkouts, setRecentWorkouts] = useState(progressTracker.getRecentWorkouts(5));
  const [adaptations, setAdaptations] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    // Update data when component mounts and when workouts are completed
    const updateData = () => {
      setRecentWorkouts(progressTracker.getRecentWorkouts(5));
      
      // Get adaptations for common exercises
      const commonExercises = ['push-ups', 'squats', 'plank', 'burpees', 'lunges'];
      const exerciseAdaptations: { [key: string]: any } = {};
      
      commonExercises.forEach(exercise => {
        exerciseAdaptations[exercise] = progressTracker.getAdaptationForExercise(exercise);
      });
      
      setAdaptations(exerciseAdaptations);
    };

    updateData();

    // Listen for workout completions
    const handleWorkoutComplete = () => updateData();
    window.addEventListener('workout-completed', handleWorkoutComplete);

    return () => {
      window.removeEventListener('workout-completed', handleWorkoutComplete);
    };
  }, []);

  const getDifficultyTrend = () => {
    if (recentWorkouts.length < 2) return null;
    
    const recentDifficulties = recentWorkouts.slice(0, 3);
    const tooHardCount = recentDifficulties.filter(w => w.difficulty === 'too-hard').length;
    const tooEasyCount = recentDifficulties.filter(w => w.difficulty === 'too-easy').length;
    const perfectCount = recentDifficulties.filter(w => w.difficulty === 'perfect').length;
    
    if (tooHardCount >= 2) {
      return { type: 'decrease', message: 'AI is reducing intensity based on your recent feedback' };
    } else if (tooEasyCount >= 2) {
      return { type: 'increase', message: 'AI is increasing difficulty to challenge you more' };
    } else if (perfectCount >= 2) {
      return { type: 'progressive', message: 'AI is applying progressive overload for steady growth' };
    }
    
    return { type: 'stable', message: 'AI is maintaining current difficulty level' };
  };

  const getAIInsights = () => {
    const insights = [];
    
    if (recentWorkouts.length >= 3) {
      const avgDifficulty = recentWorkouts.slice(0, 3);
      const consistentPerfect = avgDifficulty.every(w => w.difficulty === 'perfect');
      
      if (consistentPerfect) {
        insights.push({
          type: 'success',
          title: 'Perfect Consistency',
          message: 'Your workouts are consistently well-calibrated. Great job!',
          icon: <Target className="w-4 h-4 text-green-500" />
        });
      }
    }
    
    if (recentWorkouts.length >= 5) {
      const recentFeedback = recentWorkouts.slice(0, 5);
      const hasVariedFeedback = new Set(recentFeedback.map(w => w.difficulty)).size > 1;
      
      if (hasVariedFeedback) {
        insights.push({
          type: 'info',
          title: 'AI Learning Mode',
          message: 'AI is analyzing your feedback patterns to optimize future workouts',
          icon: <Lightbulb className="w-4 h-4 text-blue-500" />
        });
      }
    }
    
    return insights;
  };

  const trend = getDifficultyTrend();
  const insights = getAIInsights();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* AI Adaptation Status */}
      {trend && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                trend.type === 'increase' ? 'bg-orange-100' :
                trend.type === 'decrease' ? 'bg-blue-100' :
                trend.type === 'progressive' ? 'bg-green-100' :
                'bg-gray-100'
              }`}>
                {trend.type === 'increase' && <TrendingUp className="w-5 h-5 text-orange-600" />}
                {trend.type === 'decrease' && <TrendingDown className="w-5 h-5 text-blue-600" />}
                {trend.type === 'progressive' && <Target className="w-5 h-5 text-green-600" />}
                {trend.type === 'stable' && <ArrowRight className="w-5 h-5 text-gray-600" />}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">AI Adaptation</h3>
                <p className="text-sm text-gray-600">{trend.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercise Adaptations */}
      {Object.keys(adaptations).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Exercise Progressions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(adaptations).slice(0, 3).map(([exercise, data]) => (
              <div key={exercise} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900 capitalize">
                    {exercise.replace('-', ' ')}
                  </span>
                  <div className="text-sm text-gray-600">
                    {data.reps > 0 && `${data.reps} reps`}
                    {data.weight > 0 && ` • ${data.weight}lbs`}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  Optimized
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">AI Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {insight.icon}
                <div>
                  <h4 className="font-medium text-gray-900">{insight.title}</h4>
                  <p className="text-sm text-gray-600">{insight.message}</p>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Feedback Summary */}
      {recentWorkouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentWorkouts.slice(0, 3).map((workout, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {new Date(workout.timestamp).toLocaleDateString()}
                  </span>
                  <Badge 
                    variant={workout.difficulty === 'perfect' ? 'default' : 'outline'}
                    className={`text-xs ${
                      workout.difficulty === 'too-easy' ? 'text-green-700 bg-green-100' :
                      workout.difficulty === 'too-hard' ? 'text-red-700 bg-red-100' :
                      'text-blue-700 bg-blue-100'
                    }`}
                  >
                    {workout.difficulty === 'too-easy' ? '😴 Too Easy' :
                     workout.difficulty === 'too-hard' ? '😰 Too Hard' :
                     '🎯 Perfect'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};