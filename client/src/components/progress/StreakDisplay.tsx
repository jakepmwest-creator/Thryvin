import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Target, Trophy, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { streakManager } from '@/utils/StreakManager';
import { progressTracker } from '@/utils/ProgressTracker';

interface StreakDisplayProps {
  showDetailed?: boolean;
  className?: string;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({ 
  showDetailed = false, 
  className = "" 
}) => {
  const [streakStatus, setStreakStatus] = useState(streakManager.getStreakStatus());
  const [weeklyProgress, setWeeklyProgress] = useState(streakManager.getWeeklyStreakProgress());
  const [badges, setBadges] = useState(streakManager.getStreakBadges());

  useEffect(() => {
    // Update data when component mounts or when streak changes
    const updateData = () => {
      setStreakStatus(streakManager.getStreakStatus());
      setWeeklyProgress(streakManager.getWeeklyStreakProgress());
      setBadges(streakManager.getStreakBadges());
    };

    updateData();

    // Listen for custom events from workout completion
    const handleWorkoutComplete = () => updateData();
    window.addEventListener('workout-completed', handleWorkoutComplete);

    return () => {
      window.removeEventListener('workout-completed', handleWorkoutComplete);
    };
  }, []);

  const getStreakColor = (streak: number) => {
    if (streak >= 14) return 'from-purple-500 to-pink-500';
    if (streak >= 7) return 'from-orange-500 to-red-500';
    if (streak >= 3) return 'from-yellow-500 to-orange-500';
    return 'from-gray-400 to-gray-500';
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 14) return '🔥🔥🔥';
    if (streak >= 7) return '🔥🔥';
    if (streak >= 3) return '🔥';
    return '💫';
  };

  if (!showDetailed) {
    // Compact display for homepage
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="font-bold text-gray-900">{streakStatus.currentStreak}</span>
          <span className="text-sm text-gray-600">day streak</span>
        </div>
        {streakStatus.currentStreak >= 3 && (
          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
            {getStreakEmoji(streakStatus.currentStreak)}
          </Badge>
        )}
      </div>
    );
  }

  // Detailed display for dedicated page/modal
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Streak Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className={`bg-gradient-to-r ${getStreakColor(streakStatus.currentStreak)} p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-6 h-6" />
                  <span className="text-lg font-semibold">Current Streak</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{streakStatus.currentStreak}</span>
                  <span className="text-lg">days</span>
                </div>
              </div>
              <div className="text-4xl">
                {getStreakEmoji(streakStatus.currentStreak)}
              </div>
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-3">{streakStatus.motivationalMessage}</p>
            {!streakStatus.isOnTrack && streakStatus.daysUntilBreak > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Streak at risk! Workout today to keep it alive.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              <span className="font-semibold text-gray-900">Weekly Target</span>
            </div>
            <Badge variant="outline">
              {weeklyProgress.current} / {weeklyProgress.target}
            </Badge>
          </div>
          <Progress value={weeklyProgress.percentage} className="h-2 mb-2" />
          <p className="text-xs text-gray-600">
            {weeklyProgress.percentage >= 100 
              ? "🎉 Weekly target achieved!" 
              : `${weeklyProgress.target - weeklyProgress.current} more workouts to reach your weekly goal`
            }
          </p>
        </CardContent>
      </Card>

      {/* Streak Badges */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold text-gray-900">Streak Badges</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {badges.slice(0, 4).map((badge, index) => (
              <motion.div
                key={badge.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg border-2 ${
                  badge.earned 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{badge.name}</span>
                  {badge.earned && <span className="text-lg">🏆</span>}
                </div>
                <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
                {!badge.earned && badge.progress !== undefined && (
                  <div>
                    <Progress value={badge.progress} className="h-1" />
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(badge.progress)}% complete
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Streak History Preview */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-gray-900">Recent Activity</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 14 }, (_, i) => {
              const dayIndex = 13 - i;
              const hasWorkout = dayIndex < streakStatus.currentStreak;
              return (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-sm ${
                    hasWorkout 
                      ? 'bg-green-500' 
                      : 'bg-gray-200'
                  }`}
                  title={`Day ${dayIndex + 1}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>2 weeks ago</span>
            <span>Today</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};