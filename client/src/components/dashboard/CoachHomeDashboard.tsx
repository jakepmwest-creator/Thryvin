import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import { AnimatedProgressCard } from '../AnimatedProgressCard';
import { Calendar, ChevronDown, ChevronUp, Clock, Users, Heart, Award, ArrowRight, PlayCircle, MessageCircle, CheckCircle, Camera, Utensils, Target, TrendingUp, Droplets, Flame, Trophy, ChevronRight } from 'lucide-react';

import { useCloudMood } from '../../context/CloudMoodContext';
import { MoodDemoPanel } from '../MoodDemoPanel';
import { AICoach } from '../AICoach';
import { useAuth } from '@/hooks/use-auth-v2';
import { useQuery } from '@tanstack/react-query';
import { ThryvinLogo } from '../ui/ThryvinLogo';


interface CoachHomeDashboardProps {
  coachInfo: {
    name: string;
    role: string;
    icon: string;
    colorClass: string;
  };
  onStartWorkout?: () => void;
  onOpenProfile?: () => void;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1
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

const cardHoverVariants = {
  hover: { y: -5, transition: { duration: 0.2 } }
}

const CoachHomeDashboard: React.FC<CoachHomeDashboardProps> = ({ coachInfo, onStartWorkout, onOpenProfile }) => {
  const { user } = useAuth();
  const [showAllWorkouts, setShowAllWorkouts] = useState(false);
  const [currentTab, setCurrentTab] = useState('today');

  // Fetch user's workout data
  const { data: userWorkouts = [] } = useQuery({
    queryKey: ['/api/user-workouts'],
    enabled: !!user
  });

  // Fetch user's achievements
  const { data: userAchievements = [] } = useQuery({
    queryKey: ['/api/user-achievements'],
    enabled: !!user
  });

  const { workoutCompleted, goalAchieved, newRecord, celebrate, userLogin } = useCloudMood();
  
  // This would come from API in a real app
  const userProgress = {
    completedWorkouts: 8,
    weeklyGoal: 12,
    minutesTrained: 185,
    minutesGoal: 300,
    streak: 3,
    achievements: 5,
    totalAchievements: 20,
    caloriesBurned: 1250,
    caloriesGoal: 2000,
    points: 875
  };

  // Current day tracker
  const today = new Date();
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
  const date = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  // Generate greeting based on time of day
  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Generate motivational message based on progress
  const getMotivationalMessage = () => {
    const percent = Math.round((userProgress.completedWorkouts / userProgress.weeklyGoal) * 100);
    
    if (percent >= 100) {
      return "Amazing work! You've crushed your weekly goals. Let's set new challenges!";
    } else if (percent >= 75) {
      return "You're making excellent progress! Keep pushing to reach your weekly goals.";
    } else if (percent >= 50) {
      return "You're halfway there! Keep up the momentum to achieve your weekly targets.";
    } else if (percent >= 25) {
      return "Good start to your week. Stay consistent to reach your fitness goals!";
    } else {
      return "Let's kickstart your fitness journey this week. Every workout counts!";
    }
  };

  // Get color variant based on coach
  const getPrimaryColor = () => {
    if (coachInfo.colorClass.includes('blue')) return 'blue';
    if (coachInfo.colorClass.includes('green')) return 'green';
    if (coachInfo.colorClass.includes('yellow')) return 'yellow';
    if (coachInfo.colorClass.includes('red')) return 'red';
    if (coachInfo.colorClass.includes('purple')) return 'purple';
    if (coachInfo.colorClass.includes('pink')) return 'pink';
    if (coachInfo.colorClass.includes('teal')) return 'teal';
    if (coachInfo.colorClass.includes('indigo')) return 'indigo';
    if (coachInfo.colorClass.includes('orange')) return 'orange';
    if (coachInfo.colorClass.includes('amber')) return 'amber';
    return 'gray';
  };

  const workoutSuggestions = [
    {
      title: `${dayOfWeek} Power Session`,
      description: "Perfect workout to kick off your day with energy",
      duration: "30 min",
      level: "Medium",
      tags: ["morning", "energy", "full-body"],
      icon: "fa-bolt",
      scheduledFor: "Morning",
      participants: 18
    },
    {
      title: "Core & Cardio Blast",
      description: "Build core strength while improving cardiovascular fitness",
      duration: "25 min",
      level: "Medium-Hard",
      tags: ["core", "cardio", "hiit"],
      icon: "fa-dumbbell",
      scheduledFor: "Afternoon",
      participants: 32
    },
    {
      title: "Total Body Strength",
      description: "Build functional strength with this complete workout",
      duration: "40 min",
      level: "Advanced",
      tags: ["strength", "resistance", "muscle"],
      icon: "fa-dumbbell",
      scheduledFor: "Evening",
      participants: 27
    },
    {
      title: "Recovery Flow",
      description: "Active recovery to improve flexibility and reduce soreness",
      duration: "20 min",
      level: "Easy",
      tags: ["stretch", "recovery", "mobility"],
      icon: "fa-wind",
      scheduledFor: "Evening",
      participants: 14
    },
    {
      title: "Quick Core Express",
      description: "Short but effective core workout for busy days",
      duration: "10 min",
      level: "Beginner",
      tags: ["core", "quick", "abs"],
      icon: "fa-heartbeat",
      scheduledFor: "Anytime",
      participants: 45
    }
  ];

  // Filter based on showing all or not
  const displayedWorkouts = showAllWorkouts ? workoutSuggestions : workoutSuggestions.slice(0, 3);

  // Get events specific to today
  const todaysEvents = [
    {
      time: "7:00 AM",
      title: "Morning Energizer",
      description: "Start your day with this quick 15-min routine to boost energy",
      tags: ["morning", "energy"]
    },
    {
      time: "12:30 PM",
      title: "Midday Reset",
      description: "10-min stretching routine to break up your workday",
      tags: ["stretch", "office"]
    },
    {
      time: "6:00 PM",
      title: "Evening Power Session",
      description: "Complete workout focusing on today's target areas",
      tags: ["strength", "cardio"]
    }
  ];

  // Achievements near completion
  const upcomingAchievements = [
    {
      name: "Consistency Champion",
      description: "Complete workouts 5 days in a row",
      progress: 3,
      total: 5,
      icon: "fa-calendar-check"
    },
    {
      name: "Cardio Crusher",
      description: "Burn 5000 total calories through cardio",
      progress: 3750,
      total: 5000,
      icon: "fa-heartbeat"
    }
  ];

  const color = getPrimaryColor();
  const colorClass = coachInfo.colorClass;
  const textColorClass = `text-${color}-600`;
  const darkColorClass = coachInfo.colorClass.replace("500", "600").replace("400", "500");
  const bgGradient = `bg-gradient-to-br from-${color}-50 to-${color}-100`;
  const borderColor = `border-${color}-200`;
  
  // Helper function to format progress percentage
  const formatProgress = (current: number, max: number) => {
    // Ensure we return a valid number or 0 if calculation fails
    const percentage = Math.round((current / max) * 100);
    return isNaN(percentage) ? 0 : percentage;
  };

  // Helper functions for the new components
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
      { id: 1, name: 'HIIT Cardio', emoji: '🔥', description: 'High-intensity interval training', color: 'from-red-400 to-orange-500' },
      { id: 2, name: 'Strength', emoji: '💪', description: 'Build muscle and power', color: 'from-blue-400 to-purple-500' },
      { id: 3, name: 'Yoga Flow', emoji: '🧘‍♀️', description: 'Flexibility and mindfulness', color: 'from-green-400 to-teal-500' },
      { id: 4, name: 'Running', emoji: '🏃‍♂️', description: 'Cardio endurance training', color: 'from-yellow-400 to-red-500' },
      { id: 5, name: 'Dance', emoji: '💃', description: 'Fun cardio workouts', color: 'from-pink-400 to-purple-500' },
    ];
  }

  function generateSmartNudge() {
    if (userProgress.completedWorkouts === 0) {
      return "Ready to start your fitness journey? Your first workout is waiting!";
    }
    if (userProgress.completedWorkouts >= userProgress.weeklyGoal) {
      return "Amazing! You've completed your weekly goal. Want to challenge yourself with bonus workouts?";
    }
    if (userProgress.streak >= 3) {
      return `You're on a ${userProgress.streak}-day streak! Keep the momentum going strong!`;
    }
    return "You're making great progress! Ready for your next workout session?";
  }
  
  return (
    <div className="flex-1 overflow-auto bg-white min-h-full">
      <motion.div 
        className="max-w-xl mx-auto p-4 space-y-4 bg-white"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div 
          className="pt-4 pb-4"
          variants={itemVariants}
        >
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{getGreeting()}, {user?.name || 'there'}</h1>
              <div className="flex items-center mt-1 mb-2">
                <Calendar className="w-4 h-4 text-purple-500 mr-1" />
                <span className="text-sm text-gray-500">{dayOfWeek}, {date}</span>
              </div>
              <div className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-full flex items-center shadow-sm w-fit">
                <i className="fas fa-crown mr-1"></i>
                <span>Premium</span>
              </div>
            </div>
          </div>
        </motion.div>


        
        {/* Daily Summary Card */}
        <motion.div 
          className="bg-white rounded-2xl shadow-sm overflow-hidden"
          variants={itemVariants}
        >
          <div className="relative h-48 bg-gradient-to-tr from-purple-500 to-pink-400 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-300 rounded-full -translate-x-1/2 -translate-y-1/4 opacity-20"></div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-pink-300 rounded-full -translate-x-1/4 -translate-y-1/2 opacity-20"></div>
            
            <div className="relative z-10 p-6 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-purple-50 text-lg font-medium">Today's Activity</p>
                  <h2 className="text-white text-2xl font-bold">Fitness Plan</h2>
                </div>
                <div className="flex items-center bg-white/20 backdrop-blur-md rounded-xl px-3 py-1.5 text-white">
                  <i className="fas fa-bolt mr-1.5"></i>
                  <span className="font-semibold">{userProgress.points} pts</span>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button 
                  className="bg-white text-purple-600 px-4 py-2 rounded-xl font-medium shadow-md flex items-center justify-center"
                  onClick={onStartWorkout}
                >
                  <PlayCircle className="w-4 h-4 mr-1.5" />
                  Start Workout
                </button>
                <button 
                  className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl font-medium flex items-center justify-center"
                  onClick={() => console.log('Show schedule')}
                >
                  <Calendar className="w-4 h-4 mr-1.5" />
                  Schedule
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-5">
            <div className="flex items-center mb-4">
              <div className={`w-12 h-12 rounded-full ${colorClass} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
                <i className={`fas ${coachInfo.icon} text-lg`}></i>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{coachInfo.name} says:</p>
                <p className="text-sm text-gray-600 italic">"{getCoachMessage(coachInfo.role)}"</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center justify-center">
                <span className="text-xs text-gray-500 mb-1">Weekly Target</span>
                <span className="text-lg font-bold text-gray-800">{userProgress.completedWorkouts}/{userProgress.weeklyGoal}</span>
                <span className="text-xs text-purple-500">Workouts</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center justify-center">
                <span className="text-xs text-gray-500 mb-1">Current Streak</span>
                <span className="text-lg font-bold text-gray-800">{userProgress.streak}</span>
                <span className="text-xs text-orange-500">Days</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Summary Card */}
        <motion.div 
          className="bg-white rounded-2xl shadow-sm"
          variants={itemVariants}
        >
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Your AI Fitness Plan</h3>
              <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center">
                View AI Plan
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-lg font-bold text-purple-600">{userProgress.completedWorkouts}/{userProgress.weeklyGoal}</div>
                <div className="text-xs text-gray-500">Weekly Progress</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-lg font-bold text-orange-600">1450</div>
                <div className="text-xs text-gray-500">Calories Left</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-lg font-bold text-blue-600 flex items-center justify-center">
                  <Droplets className="w-4 h-4 mr-1" />
                  6/8
                </div>
                <div className="text-xs text-gray-500">Hydration</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-lg font-bold text-green-600">{userProgress.streak}</div>
                <div className="text-xs text-gray-500">Day Streak</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Next Workout: Upper Body – Push</span>
                <div className="w-16 h-2 bg-gray-200 rounded-full">
                  <div className="w-1/2 h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="bg-white rounded-2xl shadow-sm"
          variants={itemVariants}
        >
          <div className="p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button className="h-20 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl flex flex-col items-center justify-center gap-2 transition-all">
                <CheckCircle className="w-6 h-6" />
                <span className="text-xs font-medium">Mark Complete</span>
              </button>
              <button className="h-20 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl flex flex-col items-center justify-center gap-2 transition-all">
                <MessageCircle className="w-6 h-6" />
                <span className="text-xs font-medium">Talk to Coach</span>
              </button>
              <button className="h-20 bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white rounded-xl flex flex-col items-center justify-center gap-2 transition-all">
                <Utensils className="w-6 h-6" />
                <span className="text-xs font-medium">Log a Meal</span>
              </button>
              <button className="h-20 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl flex flex-col items-center justify-center gap-2 transition-all">
                <Camera className="w-6 h-6" />
                <span className="text-xs font-medium">Progress Photo</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Weekly Mini Calendar */}
        <motion.div 
          className="bg-white rounded-2xl shadow-sm"
          variants={itemVariants}
        >
          <div className="p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week</h3>
            <div className="grid grid-cols-7 gap-2">
              {generateWeeklyCalendar().map((day, index) => (
                <button
                  key={index}
                  className={`h-16 flex flex-col items-center justify-center rounded-xl text-xs font-medium transition-all ${
                    day.isToday 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                      : day.isCompleted 
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mb-1">{day.dayName}</span>
                  <span className="text-lg font-bold">{day.dayNumber}</span>
                  {day.isCompleted && <CheckCircle className="w-3 h-3 text-green-600 mt-1" />}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Explore Fitness Scroll */}
        <motion.div 
          className="bg-white rounded-2xl shadow-sm"
          variants={itemVariants}
        >
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Explore Fitness</h3>
              <button className="text-purple-500 text-sm font-medium flex items-center">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {generateFitnessCategories().map((category) => (
                <div
                  key={category.id}
                  className="flex-shrink-0 w-32 cursor-pointer group"
                >
                  <div className={`h-20 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center text-3xl mb-2 group-hover:scale-105 transition-transform`}>
                    {category.emoji}
                  </div>
                  <h4 className="font-medium text-sm text-gray-900 mb-1">{category.name}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2">{category.description}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Awards/Challenge Tracker */}
        <motion.div 
          className="bg-white rounded-2xl shadow-sm border border-yellow-200"
          variants={itemVariants}
        >
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                Next Achievement
              </h3>
              <button className="text-yellow-600 text-sm font-medium">View Awards</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Consistency Champion</span>
                <span className="text-sm text-gray-500">7/10 days</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full" style={{width: '70%'}}></div>
              </div>
              <p className="text-sm text-gray-600">Complete 3 more workouts to unlock this badge!</p>
            </div>
          </div>
        </motion.div>

        {/* Smart Nudge */}
        <motion.div 
          className="bg-white rounded-2xl shadow-sm border border-blue-200"
          variants={itemVariants}
        >
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                AI
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium mb-2">Smart Suggestion</p>
                <p className="text-gray-700 text-sm mb-3">{generateSmartNudge()}</p>
                <button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  Let's Go!
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

// Helper function to get coach-specific messages
function getCoachMessage(role: string): string {
  if (role.toLowerCase().includes('strength')) {
    return "Focus on proper form today. It's better to lift lighter with perfect technique than to sacrifice form for weight.";
  } else if (role.toLowerCase().includes('cardio') || role.toLowerCase().includes('hiit')) {
    return "Remember to pace yourself during intervals. Push hard during work periods, but use rest periods wisely.";
  } else if (role.toLowerCase().includes('yoga') || role.toLowerCase().includes('flexibility')) {
    return "Connect with your breath today. Let each inhale create space and each exhale deepen your stretch.";
  } else if (role.toLowerCase().includes('calisthenics') || role.toLowerCase().includes('bodyweight')) {
    return "Progressive overload applies to bodyweight too! Try adding an extra rep to each set today.";
  } else if (role.toLowerCase().includes('nutrition') || role.toLowerCase().includes('wellness')) {
    return "Stay hydrated throughout the day. Often what feels like hunger is actually mild dehydration.";
  } else if (role.toLowerCase().includes('running') || role.toLowerCase().includes('triathlon')) {
    return "Focus on your cadence today. Aim for smaller, quicker steps rather than long strides to reduce impact.";
  } else {
    return "Consistency beats intensity. Show up for yourself today, even if it's just for a short session.";
  }
}

// Helper function to get tips based on coach specialty
function getTip(role: string): string {
  if (role.toLowerCase().includes('strength')) {
    return "Rest is when your muscles grow. Make sure you're giving muscle groups 48-72 hours to recover between intense strength sessions.";
  } else if (role.toLowerCase().includes('cardio') || role.toLowerCase().includes('hiit')) {
    return "Mix up your intervals to prevent plateaus. Try 30/30, 40/20, and Tabata formats to challenge your system in different ways.";
  } else if (role.toLowerCase().includes('yoga') || role.toLowerCase().includes('flexibility')) {
    return "A 10-minute morning stretch routine can set the tone for your entire day, improving posture and reducing stress.";
  } else if (role.toLowerCase().includes('calisthenics') || role.toLowerCase().includes('bodyweight')) {
    return "Can't do a full pull-up yet? Try negative pull-ups (jumping up and lowering slowly) to build the necessary strength.";
  } else if (role.toLowerCase().includes('nutrition') || role.toLowerCase().includes('wellness')) {
    return "Try the 80/20 approach: focus on whole, nutritious foods 80% of the time, allowing yourself more flexibility with the other 20%.";
  } else if (role.toLowerCase().includes('running') || role.toLowerCase().includes('triathlon')) {
    return "Incorporate hill repeats once a week to build power and endurance that will translate to improved performance on flat surfaces.";
  } else {
    return "Track your workouts to see progress over time. Even small improvements add up to significant changes when you're consistent.";
  }
}

export default CoachHomeDashboard;