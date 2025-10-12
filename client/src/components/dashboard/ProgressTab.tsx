import React, { useEffect } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { AnimatedProgressCard } from '@/components/AnimatedProgressCard';
import { ProgressChart } from '@/components/ProgressChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dumbbell, 
  Clock, 
  Calendar, 
  Flame
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProgressTab() {
  const {
    currentProgress,
    isCurrentProgressLoading,
    weeklySnapshots,
    monthlySnapshots,
    isWeeklySnapshotsLoading,
    isMonthlySnapshotsLoading,
    createProgressSnapshot,
    workoutProgressPercentage,
    minutesProgressPercentage
  } = useProgress();

  // Create weekly progress snapshot automatically
  useEffect(() => {
    if (currentProgress && !isCurrentProgressLoading) {
      const createWeeklySnapshot = async () => {
        // Only create a new snapshot if we have workouts or minutes
        if (currentProgress.completedWorkouts > 0 || currentProgress.trainingMinutes > 0) {
          await createProgressSnapshot({
            period: 'week',
            workoutsCompleted: currentProgress.completedWorkouts,
            minutesTraining: currentProgress.trainingMinutes,
            // We don't have these values yet but could add in future
            streakDays: 0,
            caloriesBurned: 0
          });
        }
      };

      // If we don't have any snapshots yet, create one
      if (weeklySnapshots.length === 0) {
        createWeeklySnapshot();
      } else {
        // Or if it's been more than a day since last snapshot
        const lastSnapshot = weeklySnapshots[weeklySnapshots.length - 1];
        const lastSnapshotDate = new Date(lastSnapshot.snapshotDate);
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        if (lastSnapshotDate < oneDayAgo) {
          createWeeklySnapshot();
        }
      }
    }
  }, [currentProgress, isCurrentProgressLoading, weeklySnapshots, createProgressSnapshot]);

  // Get previous values for showing changes
  const getPreviousValue = (snapshots: any[], dataKey: string) => {
    if (snapshots.length >= 2) {
      return snapshots[snapshots.length - 2][dataKey];
    }
    return undefined;
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-4">

      {isCurrentProgressLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item}>
            <AnimatedProgressCard 
              title="Weekly Workouts"
              currentValue={currentProgress?.completedWorkouts || 0}
              maxValue={currentProgress?.goalWorkouts || 0}
              icon={<Dumbbell className="h-5 w-5" />}
              valueLabel="workouts"
              progressGradient="bg-gradient-to-r from-purple-500 to-pink-500"
              showChange={true}
              previousValue={getPreviousValue(weeklySnapshots, 'workoutsCompleted')}
            />
          </motion.div>
          
          <motion.div variants={item}>
            <AnimatedProgressCard 
              title="Weekly Training Minutes"
              currentValue={currentProgress?.trainingMinutes || 0}
              maxValue={currentProgress?.goalMinutes || 0}
              icon={<Clock className="h-5 w-5" />}
              valueLabel="minutes"
              progressGradient="bg-gradient-to-r from-green-500 to-emerald-500"
              showChange={true}
              previousValue={getPreviousValue(weeklySnapshots, 'minutesTraining')}
            />
          </motion.div>
        </motion.div>
      )}

      <Tabs defaultValue="weekly" className="mt-8">
        <TabsList className="mb-6">
          <TabsTrigger value="weekly">Weekly Progress</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          {isWeeklySnapshotsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          ) : weeklySnapshots.length >= 2 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProgressChart 
                data={weeklySnapshots} 
                title="Workouts Completed"
                dataKey="workoutsCompleted"
                color="#7A3CF3"
                gradientFrom="rgba(122, 60, 243, 0.8)"
                gradientTo="rgba(255, 79, 216, 0)"
                period="week"
                valueFormatter={(value) => `${value}`}
              />
              <ProgressChart 
                data={weeklySnapshots} 
                title="Training Minutes"
                dataKey="minutesTraining"
                color="#10b981"
                gradientFrom="rgba(16, 185, 129, 0.8)"
                gradientTo="rgba(52, 211, 153, 0)"
                period="week"
                valueFormatter={(value) => `${value} min`}
              />
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="mx-auto h-12 w-12 opacity-20 mb-4" />
              <h3 className="text-lg font-medium">Not enough data yet</h3>
              <p className="mt-2">Complete more workouts to see your weekly progress charts</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="monthly">
          {isMonthlySnapshotsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          ) : monthlySnapshots.length >= 2 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProgressChart 
                data={monthlySnapshots} 
                title="Monthly Workouts"
                dataKey="workoutsCompleted"
                color="#8b5cf6"
                gradientFrom="rgba(139, 92, 246, 0.8)"
                gradientTo="rgba(139, 92, 246, 0)"
                period="month"
                valueFormatter={(value) => `${value}`}
              />
              <ProgressChart 
                data={monthlySnapshots} 
                title="Monthly Training Hours"
                dataKey="minutesTraining"
                color="#f59e0b"
                gradientFrom="rgba(245, 158, 11, 0.8)"
                gradientTo="rgba(245, 158, 11, 0)"
                period="month"
                valueFormatter={(value) => `${Math.round(value / 60)} hrs`}
              />
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="mx-auto h-12 w-12 opacity-20 mb-4" />
              <h3 className="text-lg font-medium">Not enough data yet</h3>
              <p className="mt-2">Complete more workouts to see your monthly progress charts</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}