import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth-v2';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  Clock, 
  Users, 
  Heart, 
  Award, 
  ArrowRight, 
  PlayCircle, 
  MessageCircle,
  CheckCircle,
  Camera,
  Utensils,
  Target,
  TrendingUp,
  Droplets,
  Flame,
  Trophy,
  ChevronRight,
  Bell,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ThryvinLogo } from '../ui/ThryvinLogo';
import { StreakDisplay } from '../progress/StreakDisplay';
import { MotivationalToasts, useMotivationalToasts } from '../progress/MotivationalToasts';
import { WorkoutFeedbackModal } from '../progress/WorkoutFeedbackModal';
import { NotificationSettings } from '../notifications/NotificationSettings';
import { progressTracker } from '@/utils/ProgressTracker';
import { streakManager } from '@/utils/StreakManager';
import { notificationManager } from '@/utils/NotificationManager';

interface NewHomeDashboardProps {
  coachInfo: {
    name: string;
    role: string;
    icon: string;
    colorClass: string;
  };
  onStartWorkout?: () => void;
  onOpenProfile?: () => void;
  onNavigateToWorkouts?: () => void;
  onNavigateToChat?: () => void;
  onNavigateToNutrition?: () => void;
  onNavigateToAwards?: () => void;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

export default function NewHomeDashboard({ 
  coachInfo, 
  onStartWorkout, 
  onOpenProfile,
  onNavigateToWorkouts,
  onNavigateToChat,
  onNavigateToNutrition,
  onNavigateToAwards
}: NewHomeDashboardProps) {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [hydrationGlasses, setHydrationGlasses] = useState(6);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [streakData, setStreakData] = useState(streakManager.getStreakStatus());
  const [weeklyProgress, setWeeklyProgress] = useState(progressTracker.getWeeklyProgress());
  
  const { triggerWorkoutComplete } = useMotivationalToasts();

  useEffect(() => {
    // Update progress data when component mounts
    setStreakData(streakManager.getStreakStatus());
    setWeeklyProgress(progressTracker.getWeeklyProgress());

    // Set up notification manager auto-reminders
    notificationManager.setupDailyReminders();

    // Listen for workout completions to update data
    const handleWorkoutComplete = () => {
      setStreakData(streakManager.getStreakStatus());
      setWeeklyProgress(progressTracker.getWeeklyProgress());
    };

    window.addEventListener('workout-completed', handleWorkoutComplete);
    return () => {
      window.removeEventListener('workout-completed', handleWorkoutComplete);
    };
  }, []);

  // Fetch user's workout profile
  const { data: workoutProfile } = useQuery({
    queryKey: ['/api/user/workout-profile'],
    enabled: !!user
  });

  // Generate greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Update user progress with real data from tracking utilities
  const userProgress = {
    completedWorkouts: weeklyProgress.completed,
    weeklyGoal: weeklyProgress.target,
    caloriesLeft: 1450,
    hydrationGlasses: hydrationGlasses,
    hydrationGoal: 8,
    currentStreak: streakData.currentStreak,
    nextWorkout: "Upper Body – Push",
    weeklyProgress: weeklyProgress.percentage
  };

  const weeklyCalendar = generateWeeklyCalendar();
  const fitnessCategories = generateFitnessCategories();
  const smartNudge = generateSmartNudge(userProgress);

  // Helper functions
  function generateWeeklyCalendar() {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const isToday = date.toDateString() === new Date().toDateString();
      const isCompleted = i < 2; // Mock: first 2 days completed
      
      return {
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        isToday,
        isCompleted,
        workoutType: isCompleted ? (i === 0 ? 'HIIT' : 'Yoga') : (i === 2 ? 'Upper Body' : null)
      };
    });
  }

  function generateFitnessCategories() {
    return [
      { 
        id: 1, 
        name: 'HIIT Cardio', 
        emoji: '🔥', 
        description: 'High-intensity interval training', 
        color: 'from-red-500 to-orange-600',
        videoCount: 47,
        avgDuration: '20 min',
        keyFeatures: ['Fat burning focus', 'Quick 15-30 min sessions', 'No equipment needed']
      },
      { 
        id: 2, 
        name: 'Strength', 
        emoji: '💪', 
        description: 'Build muscle and power', 
        color: 'from-blue-500 to-purple-600',
        videoCount: 63,
        avgDuration: '35 min',
        keyFeatures: ['Progressive overload', 'Compound movements', 'Muscle building focus']
      },
      { 
        id: 3, 
        name: 'Yoga Flow', 
        emoji: '🧘‍♀️', 
        description: 'Flexibility and mindfulness', 
        color: 'from-green-500 to-teal-600',
        videoCount: 28,
        avgDuration: '45 min',
        keyFeatures: ['Stress relief', 'Flexibility improvement', 'Mind-body connection']
      },
      { 
        id: 4, 
        name: 'Running', 
        emoji: '🏃‍♂️', 
        description: 'Cardio endurance training', 
        color: 'from-yellow-500 to-red-600',
        videoCount: 35,
        avgDuration: '30 min',
        keyFeatures: ['Cardiovascular health', 'Endurance building', 'Calorie burning']
      },
      { 
        id: 5, 
        name: 'Dance', 
        emoji: '💃', 
        description: 'Fun cardio workouts', 
        color: 'from-pink-500 to-purple-600',
        videoCount: 42,
        avgDuration: '25 min',
        keyFeatures: ['Fun & engaging', 'Full body workout', 'Coordination training']
      },
      { 
        id: 6, 
        name: 'Pilates', 
        emoji: '🤸‍♀️', 
        description: 'Core strength and stability', 
        color: 'from-cyan-500 to-blue-600',
        videoCount: 31,
        avgDuration: '40 min',
        keyFeatures: ['Core strengthening', 'Posture improvement', 'Low-impact exercise']
      },
      { 
        id: 7, 
        name: 'Boxing', 
        emoji: '🥊', 
        description: 'Combat fitness training', 
        color: 'from-red-600 to-pink-600',
        videoCount: 24,
        avgDuration: '30 min',
        keyFeatures: ['High intensity cardio', 'Stress relief', 'Self-defense skills']
      },
      { 
        id: 8, 
        name: 'Swimming', 
        emoji: '🏊‍♂️', 
        description: 'Full-body aquatic workouts', 
        color: 'from-blue-400 to-cyan-500',
        videoCount: 18,
        avgDuration: '45 min',
        keyFeatures: ['Low impact', 'Full body engagement', 'Joint-friendly']
      },
      { 
        id: 9, 
        name: 'Cycling', 
        emoji: '🚴‍♀️', 
        description: 'Indoor and outdoor cycling', 
        color: 'from-green-600 to-lime-600',
        videoCount: 39,
        avgDuration: '35 min',
        keyFeatures: ['Leg strengthening', 'Outdoor adventures', 'Eco-friendly fitness']
      },
      { 
        id: 10, 
        name: 'Calisthenics', 
        emoji: '🧗‍♂️', 
        description: 'Bodyweight mastery', 
        color: 'from-indigo-500 to-purple-600',
        videoCount: 55,
        avgDuration: '30 min',
        keyFeatures: ['No equipment needed', 'Functional strength', 'Progressive skills']
      }
    ];
  }

  function generateSmartNudge(progress: typeof userProgress) {
    if (progress.completedWorkouts === 0) {
      return "Ready to start your fitness journey? Your first workout is waiting! 💪";
    }
    if (progress.completedWorkouts >= progress.weeklyGoal) {
      return "Amazing! You've completed your weekly goal. Want to challenge yourself with bonus workouts? 🔥";
    }
    if (progress.currentStreak >= 3) {
      return `You're on a ${progress.currentStreak}-day streak! Keep the momentum going strong! ⚡`;
    }
    return "You're making great progress! Ready for your next workout session? 🎯";
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-white pb-20"
    >
      {/* Header with Logo */}
      <motion.div variants={itemVariants} className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <ThryvinLogo size="lg" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenProfile}
              className="rounded-full"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 1. Welcome Banner */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold mb-2">
                {getGreeting()}, {user?.name || 'Champion'}! 👋
              </h1>
              <p className="text-purple-100">
                Ready to crush your fitness goals today?
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* 2. AI Summary Card */}
        <motion.div variants={itemVariants}>
          <Card className="border border-purple-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Your AI Fitness Plan
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNavigateToWorkouts}
                  className="border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  View AI Plan
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {userProgress.completedWorkouts}/{userProgress.weeklyGoal}
                  </div>
                  <div className="text-sm text-gray-500">Weekly Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {userProgress.caloriesLeft}
                  </div>
                  <div className="text-sm text-gray-500">Calories Left</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {userProgress.hydrationGlasses}/{userProgress.hydrationGoal}
                  </div>
                  <div className="text-sm text-gray-500">Hydration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {userProgress.currentStreak}
                  </div>
                  <div className="text-sm text-gray-500">Day Streak</div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Next Workout:</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    {userProgress.nextWorkout}
                  </Badge>
                </div>
                <Progress value={userProgress.weeklyProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 3. Quick Actions */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  onClick={() => setShowFeedbackModal(true)}
                  className="h-20 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white flex-col gap-2"
                >
                  <CheckCircle className="w-6 h-6" />
                  <span className="text-xs">Mark Complete</span>
                </Button>
                <Button
                  onClick={onNavigateToChat}
                  className="h-20 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white flex-col gap-2"
                >
                  <MessageCircle className="w-6 h-6" />
                  <span className="text-xs">Talk to Coach</span>
                </Button>
                <Button
                  onClick={onNavigateToNutrition}
                  className="h-20 bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white flex-col gap-2"
                >
                  <Utensils className="w-6 h-6" />
                  <span className="text-xs">Log a Meal</span>
                </Button>
                <Button
                  onClick={() => {
                    // Trigger hydration logging
                    setHydrationGlasses(prev => Math.min(prev + 1, 8));
                    notificationManager.showNotification({
                      id: `hydration-${Date.now()}`,
                      type: 'hydration',
                      title: '💧 Hydration Logged',
                      message: `Glass ${hydrationGlasses + 1} logged! Keep staying hydrated.`
                    });
                  }}
                  className="h-20 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white flex-col gap-2"
                >
                  <Droplets className="w-6 h-6" />
                  <span className="text-xs">Log Water</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 4. Weekly Mini Calendar */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weeklyCalendar.map((day, index) => (
                  <Button
                    key={index}
                    variant={day.isToday ? "default" : "ghost"}
                    className={`h-16 flex-col gap-1 p-2 relative ${
                      day.isToday 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                        : day.isCompleted 
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'hover:bg-purple-50'
                    }`}
                    onClick={() => onNavigateToWorkouts?.()}
                  >
                    <span className="text-xs font-medium">{day.dayName}</span>
                    <span className="text-lg font-bold">{day.dayNumber}</span>
                    {day.isCompleted && (
                      <CheckCircle className="w-3 h-3 text-green-600 absolute bottom-1 right-1" />
                    )}
                    {day.workoutType && !day.isCompleted && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                      </div>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 5. Explore Fitness Scroll */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Explore Fitness
                </CardTitle>
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-6">
              <div className="flex gap-6 overflow-x-auto pb-4 px-2">
                {fitnessCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex-shrink-0 w-48 cursor-pointer group"
                    onClick={() => {/* Handle category selection */}}
                  >
                    <div className={`relative h-36 rounded-3xl bg-gradient-to-br ${category.color} flex flex-col items-center justify-center mb-4 group-hover:scale-105 group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-500 border border-white/20 backdrop-blur-sm overflow-hidden`}>
                      <div className="absolute inset-0 bg-white/15 rounded-3xl"></div>
                      <div className="absolute top-3 right-3 bg-white/25 rounded-full px-2 py-1">
                        <span className="text-xs font-bold text-white">{category.videoCount}</span>
                      </div>
                      <span className="relative z-10 filter drop-shadow-lg text-5xl mb-2">{category.emoji}</span>
                      <div className="relative z-10 text-white text-xs font-medium bg-black/25 rounded-full px-3 py-1 mb-2">
                        {category.avgDuration}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-white/40 to-white/70 rounded-b-3xl"></div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="font-bold text-base text-gray-900 group-hover:text-purple-600 transition-colors text-center">{category.name}</h3>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed text-center">{category.description}</p>
                      
                      {/* Key Features */}
                      <div className="bg-gray-50 rounded-2xl p-3 space-y-2">
                        <h4 className="text-xs font-bold text-gray-800 text-center">Key Features</h4>
                        <div className="space-y-1">
                          {category.keyFeatures?.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                              <span className="text-xs text-gray-700">{feature}</span>
                            </div>
                          )) || [
                            <div key="1" className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                              <span className="text-xs text-gray-700">Expert-designed programs</span>
                            </div>,
                            <div key="2" className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                              <span className="text-xs text-gray-700">Progressive difficulty levels</span>
                            </div>,
                            <div key="3" className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                              <span className="text-xs text-gray-700">Video demonstrations</span>
                            </div>
                          ]}
                        </div>
                      </div>
                      
                      {/* AI Coach Button */}
                      <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-3 rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all text-xs font-medium shadow-lg">
                        Ask Coach the benefits for me
                      </button>
                      
                      <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="text-purple-600">📹</span>
                          {category.videoCount} videos
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-green-600">⏱️</span>
                          {category.avgDuration}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 6. Awards/Challenge Tracker */}
        <motion.div variants={itemVariants}>
          <Card className="border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  Next Achievement
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNavigateToAwards}
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  View Awards
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Consistency Champion</span>
                  <span className="text-sm text-gray-500">7/10 days</span>
                </div>
                <Progress value={70} className="h-2" />
                <p className="text-sm text-gray-600">Complete 3 more workouts to unlock this badge!</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 7. Smart Nudge */}
        <motion.div variants={itemVariants}>
          <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  AI
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium mb-2">Smart Suggestion</p>
                  <p className="text-gray-700 text-sm mb-3">{smartNudge}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={onStartWorkout}
                      className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
                    >
                      Let's Go!
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNotificationSettings(true)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Streak Display */}
        <motion.div variants={itemVariants}>
          <Card className="border-orange-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Streak & Progress
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFeedbackModal(true)}
                  className="border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  Log Workout
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <StreakDisplay showDetailed={false} />
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Motivational Message:</strong>
                </p>
                <p className="text-sm text-gray-800">{streakData.motivationalMessage}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Stage 4 Modals */}
      <WorkoutFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        workoutId={`workout-${Date.now()}`}
        workoutName={userProgress.nextWorkout}
        exercises={[
          { id: 'push-ups', name: 'Push-ups', targetReps: 15, targetWeight: 0 },
          { id: 'squats', name: 'Squats', targetReps: 20, targetWeight: 0 },
          { id: 'plank', name: 'Plank Hold', targetReps: 1, targetWeight: 0 }
        ]}
      />

      {showNotificationSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Notification Settings</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotificationSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </Button>
              </div>
              <NotificationSettings onClose={() => setShowNotificationSettings(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Add MotivationalToasts component */}
      <MotivationalToasts />
    </motion.div>
  );
}