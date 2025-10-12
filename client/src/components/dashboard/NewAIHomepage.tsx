import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { 
  Play, 
  Calendar,
  ChevronRight,
  Trophy,
  Users,
  TrendingUp,
  Apple,
  Dumbbell,
  Heart,
  Sparkles,
  MessageCircle,
  Target,
  Clock,
  Star,
  Award,
  Activity,
  Utensils,
  Zap,
  RefreshCw,
  X,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth-v2';
import { useQuery } from '@tanstack/react-query';
import { useWorkoutStore } from '@/stores/workout-store';
import { NewWorkoutDayModal } from '@/components/workout/NewWorkoutDayModal';

interface TodaysWorkout {
  id: string;
  name: string;
  type: string;
  duration: number;
  muscleGroups: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
}

interface TodaysMeal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner';
  calories: number;
  isLogged: boolean;
}

interface ProgressRing {
  label: string;
  current: number;
  target: number;
  color: string;
  route: string;
}

interface SocialPost {
  id: string;
  userName: string;
  content: string;
  achievement?: string;
  time: string;
}

// Voice wave animation component
const VoiceWave = () => (
  <motion.div 
    className="flex items-center space-x-1"
    initial={{ opacity: 0.5 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
  >
    {[1, 2, 3, 4].map((i) => (
      <motion.div
        key={i}
        className="w-1 bg-gradient-to-t from-purple-400 to-pink-400 rounded-full"
        style={{ height: `${8 + i * 2}px` }}
        animate={{ 
          height: [`${8 + i * 2}px`, `${12 + i * 3}px`, `${8 + i * 2}px`] 
        }}
        transition={{ 
          duration: 0.6, 
          repeat: Infinity, 
          delay: i * 0.1 
        }}
      />
    ))}
  </motion.div>
);

// Circular progress ring component
const CircularProgress = ({ progress, size = 80, strokeWidth = 8, color = "#7A3CF3" }: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#EDF0F5"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span 
          className="text-sm font-bold text-gray-800"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
    </div>
  );
};

export default function NewAIHomepage() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedProgressRing, setSelectedProgressRing] = useState<string | null>(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);

  const { 
    selectedDateISO, 
    daysByDate, 
    todayISO, 
    week,
    today,
    loading,
    error,
    setSelectedDate, 
    initializeToday,
    loadWeek,
    loadToday 
  } = useWorkoutStore();

  useEffect(() => {
    initializeToday();
    loadWeek();
    loadToday();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todaysWorkoutData = daysByDate[selectedDateISO] || daysByDate[todayISO];
  const workoutStatus = todaysWorkoutData?.meta?.status || today?.status || 'pending';
  const workoutTitle = todaysWorkoutData?.meta?.title || todaysWorkoutData?.payload?.title || today?.title || null;
  
  const getCurrentDayName = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { weekday: 'long' });
  };
  
  const displayTitle = workoutTitle || `${getCurrentDayName()}'s Workout`;

  // Fetch today's workout (fallback for existing system)
  const { data: todaysWorkout } = useQuery<TodaysWorkout>({
    queryKey: ['/api/workouts/today'],
    enabled: !!user
  });

  // Fetch nutrition data
  const { data: todaysMeals } = useQuery<TodaysMeal[]>({
    queryKey: ['/api/nutrition/today'],
    enabled: !!user
  });

  // Fetch user progress
  const { data: userProgress } = useQuery({
    queryKey: ['/api/user/progress/today'],
    enabled: !!user
  });

  // Fetch weekly workout data for accurate titles
  const { data: weeklyWorkoutData } = useQuery<{status: string, workouts: any}>({
    queryKey: ['/api/workouts/week'],
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // 🎯 Navigation handlers that set selectedDate first
  const handleViewWeek = () => {
    setSelectedDate(todayISO);
    // Then navigate to workouts
    window.location.href = '/workouts?view=week';
  };

  const handleStartWorkout = () => {
    setSelectedDate(todayISO);
    // Open workout modal like weekly calendar does
    setShowWorkoutModal(true);
  };

  // Generate AI daily message based on time and context
  const getAIMessage = () => {
    const hour = currentTime.getHours();
    const day = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (hour < 12) {
      return `Good morning! Ready to crush ${day}? Your ${todaysWorkout?.name || 'workout'} is queued up.`;
    } else if (hour < 17) {
      return `${day} afternoon energy check—want me to adjust your workout intensity?`;
    } else {
      return `Evening, ${user?.name}! Perfect time for that ${todaysWorkout?.name || 'workout'}—shall we start?`;
    }
  };

  // Progress rings data
  const progress = userProgress as any || {};
  const progressRings: ProgressRing[] = [
    {
      label: 'Workouts',
      current: progress.workoutsCompleted || 2,
      target: progress.workoutTarget || 5,
      color: '#FF4FD8',
      route: '/workouts?date=today'
    },
    {
      label: 'Nutrition',
      current: progress.mealsLogged || 1,
      target: 3,
      color: '#10B981',
      route: '/nutrition?date=today'
    },
    {
      label: 'Recovery',
      current: progress.recoveryScore || 75,
      target: 100,
      color: '#F59E0B',
      route: '/recovery'
    }
  ];

  // Activity deck cards
  const activityCards = [
    {
      title: 'Complete 3 healthy meals',
      subtitle: `${todaysMeals?.filter(m => m.isLogged).length || 0}/3 logged`,
      gradient: 'from-green-400 to-emerald-500',
      icon: <Apple className="w-5 h-5" />,
      route: '/nutrition?date=today'
    },
    {
      title: 'Log your relaxation',
      subtitle: 'Track recovery',
      gradient: 'from-blue-400 to-cyan-500',
      icon: <Heart className="w-5 h-5" />,
      route: '/recovery'
    },
    {
      title: `Workouts this week: ${progress.weeklyWorkouts || 0}/5`,
      subtitle: 'Stay consistent',
      gradient: 'from-purple-400 to-pink-500',
      icon: <TrendingUp className="w-5 h-5" />,
      route: '/stats'
    },
    {
      title: 'Alex hit a PB today',
      subtitle: 'Social highlight',
      gradient: 'from-orange-400 to-red-500',
      icon: <Users className="w-5 h-5" />,
      route: '/social?view=trending'
    },
    {
      title: 'Coach tip for today',
      subtitle: 'AI guidance',
      gradient: 'from-indigo-400 to-purple-500',
      icon: <Sparkles className="w-5 h-5" />,
      route: '/coach?prefill=Coach%20tip%20for%20today'
    },
    {
      title: '3-Day Core Challenge',
      subtitle: 'Join the challenge',
      gradient: 'from-pink-400 to-rose-500',
      icon: <Target className="w-5 h-5" />,
      route: '/stats?view=challenges'
    }
  ];

  const firstName = user?.name?.split(' ')[0] || 'there';

  // Progress details for each ring
  const getProgressDetails = (ringLabel: string) => {
    switch (ringLabel) {
      case 'Workouts':
        return {
          title: 'Weekly Workouts',
          current: progress.workoutsCompleted || 2,
          target: progress.workoutTarget || 5,
          description: 'Complete workouts to maintain your fitness routine',
          achievements: [
            { text: 'Monday: Upper Body Push ✓', completed: true },
            { text: 'Wednesday: Cardio HIIT ✓', completed: true },
            { text: 'Friday: Lower Body Strength', completed: false },
            { text: 'Sunday: Recovery Yoga', completed: false }
          ],
          tips: 'You\'re on track! Keep up the consistency to reach your weekly goal.'
        };
      case 'Nutrition':
        return {
          title: 'Daily Meals',
          current: progress.mealsLogged || 1,
          target: 3,
          description: 'Log your meals to track nutrition progress',
          achievements: [
            { text: 'Breakfast: Greek Yogurt Bowl ✓', completed: true },
            { text: 'Lunch: Mediterranean Salad', completed: false },
            { text: 'Dinner: Grilled Salmon', completed: false }
          ],
          tips: 'Great start with breakfast! Remember to log your other meals for better tracking.'
        };
      case 'Recovery':
        return {
          title: 'Recovery Score',
          current: progress.recoveryScore || 75,
          target: 100,
          description: 'Your overall recovery and wellness score',
          achievements: [
            { text: '7+ hours sleep ✓', completed: true },
            { text: 'Stress management ✓', completed: true },
            { text: 'Hydration goal', completed: false },
            { text: 'Rest day activity', completed: false }
          ],
          tips: 'Good recovery so far! Focus on hydration and light movement on rest days.'
        };
      default:
        return null;
    }
  };

  return (
    <div className="h-full min-h-0 bg-white pb-20">
      {/* AI Talking Banner */}
      <div className="p-6">
        <motion.div 
          className="bg-gradient-to-br from-purple-500 to-pink-500 px-6 py-8 rounded-2xl shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/coach?thread=new&prefill=Tell%20me%20about%20today" className="cursor-pointer block">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <motion.h1 
                  className="text-2xl font-bold text-white mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Hey, {firstName} 👋
                </motion.h1>
                <motion.p 
                  className="text-white/90 text-sm leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {getAIMessage()}
                </motion.p>
              </div>
              
              <div className="ml-4 p-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-200">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Today Progress Row */}
      <div className="px-6 py-6 bg-white relative">
        <div className="flex justify-center items-center space-x-8">
          {progressRings.map((ring, index) => (
            <motion.div 
              key={ring.label}
              className="flex flex-col items-center cursor-pointer group relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              onClick={() => setSelectedProgressRing(selectedProgressRing === ring.label ? null : ring.label)}
            >
              <div className="mb-3 transition-transform group-hover:scale-105">
                <CircularProgress
                  progress={(ring.current / ring.target) * 100}
                  size={70}
                  strokeWidth={6}
                  color={ring.color}
                />
              </div>
              <div className="text-center">
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                    {ring.label}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${selectedProgressRing === ring.label ? 'rotate-180' : ''}`} />
                </div>
                <span className="text-xs text-gray-500">
                  {ring.current}/{ring.target}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Progress Details Dropdown */}
        <AnimatePresence>
          {selectedProgressRing && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-6 right-6 z-10 mt-2"
            >
              <Card className="bg-white shadow-lg border border-gray-200 rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  {(() => {
                    const details = getProgressDetails(selectedProgressRing);
                    if (!details) return null;
                    
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: progressRings.find(r => r.label === selectedProgressRing)?.color }} />
                            <h3 className="font-semibold text-gray-900">{details.title}</h3>
                          </div>
                          <button 
                            onClick={() => setSelectedProgressRing(null)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">{details.description}</span>
                            <span className="text-sm font-medium text-gray-900">
                              {details.current}/{details.target}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${(details.current / details.target) * 100}%`,
                                backgroundColor: progressRings.find(r => r.label === selectedProgressRing)?.color 
                              }}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          {details.achievements.map((achievement, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                              {achievement.completed ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-gray-300" />
                              )}
                              <span className={`text-sm ${achievement.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                                {achievement.text}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded-xl">
                          <div className="flex items-start space-x-2">
                            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-blue-700">{details.tips}</p>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <Link href={progressRings.find(r => r.label === selectedProgressRing)?.route || '#'}>
                            <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl">
                              View {selectedProgressRing}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-8 space-y-6">
        {/* Today's Workout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <Link href="/workouts?date=today">
                <div className="cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                        <Dumbbell className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Today's Workout</p>
                        {loading ? (
                          <div className="flex items-center space-x-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
                            <h4 className="font-semibold text-gray-900">Loading...</h4>
                          </div>
                        ) : error ? (
                          <h4 className="font-semibold text-red-600">Couldn't load today's workout</h4>
                        ) : workoutStatus === 'generating' ? (
                          <div className="flex items-center space-x-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
                            <h4 className="font-semibold text-purple-600">Generating your workout...</h4>
                          </div>
                        ) : workoutStatus === 'pending' ? (
                          <h4 className="font-semibold text-gray-600">Workout pending generation</h4>
                        ) : workoutStatus === 'error' ? (
                          <h4 className="font-semibold text-red-600">Error loading workout</h4>
                        ) : (
                          <h4 className="font-semibold text-gray-900">{displayTitle}</h4>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{(() => {
                        const today = new Date();
                        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                        const currentDay = dayNames[today.getDay()];
                        return weeklyWorkoutData?.workouts?.[currentDay]?.duration || todaysWorkout?.duration || 20;
                      })()} min</span>
                    </div>
                    <Badge className="bg-purple-100 text-purple-700 text-xs">
                      {(() => {
                        const today = new Date();
                        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                        const currentDay = dayNames[today.getDay()];
                        return weeklyWorkoutData?.workouts?.[currentDay]?.difficulty || todaysWorkout?.difficulty || 'Easy';
                      })()}
                    </Badge>
                    {(() => {
                      const today = new Date();
                      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                      const currentDay = dayNames[today.getDay()];
                      const muscleGroups = weeklyWorkoutData?.workouts?.[currentDay]?.muscleGroups || todaysWorkout?.muscleGroups || ['Full Body'];
                      return muscleGroups.map((group: string) => (
                        <Badge key={group} variant="outline" className="text-xs">
                          {group}
                        </Badge>
                      ));
                    })()}
                  </div>
                </div>
              </Link>

              <div className="flex items-center space-x-3">
                <Button 
                  onClick={handleStartWorkout}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Workout
                </Button>
                <button 
                  onClick={handleViewWeek}
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  View Week
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Swipe Deck - Only horizontal scroll area */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 className="font-semibold text-gray-900 mb-3">Activity</h3>
          <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {activityCards.map((card, index) => (
              <Link key={card.title} href={card.route}>
                <motion.div
                  className={`flex-shrink-0 w-48 h-24 bg-gradient-to-r ${card.gradient} rounded-2xl p-4 cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 snap-center`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                >
                  <div className="flex items-center justify-between h-full text-white">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1 line-clamp-2">{card.title}</h4>
                      <p className="text-xs opacity-90">{card.subtitle}</p>
                    </div>
                    <div className="ml-3 opacity-80">
                      {card.icon}
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Today's Meals Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="bg-white border-gray-100 shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Utensils className="w-5 h-5 text-green-500" />
                  <h3 className="font-semibold text-gray-900">Today's Meals</h3>
                </div>
                <Link href="/nutrition?date=today" className="text-green-600 hover:text-green-700">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="space-y-2 mb-4">
                {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                  const meal = todaysMeals?.find(m => m.type === mealType);
                  return (
                    <div key={mealType} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${meal?.isLogged ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm font-medium capitalize">{mealType}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {meal?.name || 'Not planned'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center space-x-3">
                <Link href="/nutrition?date=today">
                  <Button variant="outline" size="sm" className="rounded-xl">
                    View meals
                  </Button>
                </Link>
                <Link href="/coach?prefill=Suggest%20meal%20alternatives%20for%20today" className="text-gray-600 hover:text-gray-900 text-sm">
                  Swap ideas
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Awards Teaser */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Link href="/awards">
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 hover:shadow-md transition-all duration-200 rounded-2xl cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      You're 1 workout away from your next badge
                    </h4>
                    <p className="text-sm text-gray-600">Keep the momentum going!</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Social Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Community</h3>
            <Link href="/social" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
              View all
            </Link>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <Link href="/social?view=trending">
              <Card className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      A
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Alex just hit a new personal best!</p>
                      <p className="text-xs text-gray-600">2 hours ago • Deadlift PR</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs text-gray-600">12</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Workout Day Modal - same as weekly calendar */}
      <NewWorkoutDayModal
        isOpen={showWorkoutModal}
        onClose={() => setShowWorkoutModal(false)}
        workoutData={todaysWorkout ? {
          id: `today-${todayISO}`,
          name: todaysWorkout.name || displayTitle,
          type: todaysWorkout.type || 'strength',
          date: new Date(todayISO),
          duration: todaysWorkout.duration || 45,
          description: todaysWorkout.description || 'Today\'s workout session',
          coachNotes: 'Focus on form and controlled movements. Take breaks as needed.',
          exercises: [],
          muscleGroups: todaysWorkout.muscleGroups || ['Full Body'],
          difficulty: todaysWorkout.difficulty || 'medium',
          isCompleted: false
        } : null}
        onWorkoutUpdate={(workout) => {
          console.log('Workout updated:', workout);
        }}
        onMarkComplete={(workoutId) => {
          console.log('Workout completed:', workoutId);
        }}
        onSwipeLeft={() => {
          const currentDate = new Date(selectedDateISO);
          currentDate.setDate(currentDate.getDate() - 1);
          const prevISO = currentDate.toISOString().split('T')[0];
          setSelectedDate(prevISO);
        }}
        onSwipeRight={() => {
          const currentDate = new Date(selectedDateISO);
          currentDate.setDate(currentDate.getDate() + 1);
          const nextISO = currentDate.toISOString().split('T')[0];
          setSelectedDate(nextISO);
        }}
      />
    </div>
  );
}