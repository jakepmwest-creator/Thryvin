import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Clock,
  Timer,
  Target,
  Dumbbell,
  Heart,
  Flame,
  Star,
  Trophy,
  TrendingUp,
  Calendar,
  Activity,
  Brain,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SamsungGalaxyCalendar } from './SamsungGalaxyCalendar';
import { AICoachTips } from './AICoachTips';
import { AICalendarEditor } from './AICalendarEditor';
import { CircularProgress } from '@/components/ui/circular-progress';

interface WorkoutStats {
  weeklyGoal: number;
  completed: number;
  streak: number;
  totalMinutes: number;
  caloriesBurned: number;
}

interface TodaysWorkout {
  id: string;
  name: string;
  type: string;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  muscleGroups: string[];
  equipment: string[];
  description: string;
}

interface EnhancedWorkoutDashboardProps {
  onWorkoutSelect: (workoutId: string, date: Date) => void;
  weeklySchedule?: any;
  userProfile?: any;
}

export const EnhancedWorkoutDashboard: React.FC<EnhancedWorkoutDashboardProps> = ({
  onWorkoutSelect,
  weeklySchedule,
  userProfile
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [workoutStats] = useState<WorkoutStats>({
    weeklyGoal: 5,
    completed: 3,
    streak: 7,
    totalMinutes: 150,
    caloriesBurned: 890
  });

  const [todaysWorkout] = useState<TodaysWorkout>({
    id: 'hiit-cardio',
    name: 'HIIT Cardio Blast',
    type: 'HIIT',
    duration: 30,
    difficulty: 'hard',
    muscleGroups: ['Full Body', 'Cardio'],
    equipment: ['None'],
    description: 'High-intensity interval training to boost your metabolism and burn calories efficiently.'
  });

  const fitnessCategories = [
    { 
      id: 'strength', 
      name: 'Strength Training', 
      icon: Dumbbell, 
      color: 'from-blue-500 to-blue-600',
      description: 'Build muscle, increase power, and develop functional strength',
      benefits: ['Muscle Building', 'Bone Density', 'Metabolism Boost', 'Functional Power'],
      workoutTypes: ['Powerlifting', 'Bodybuilding', 'Olympic Lifting', 'Functional Training']
    },
    { 
      id: 'hiit', 
      name: 'HIIT Cardio', 
      icon: Flame, 
      color: 'from-red-500 to-red-600',
      description: 'High-intensity intervals for maximum calorie burn and endurance',
      benefits: ['Fat Burning', 'Time Efficient', 'Cardiovascular Health', 'Metabolic Boost'],
      workoutTypes: ['Tabata', 'Sprint Intervals', 'Circuit Training', 'Plyometrics']
    },
    { 
      id: 'calisthenics', 
      name: 'Calisthenics', 
      icon: Activity, 
      color: 'from-green-500 to-green-600',
      description: 'Master your bodyweight with functional movement patterns',
      benefits: ['Body Control', 'Flexibility', 'Core Strength', 'Mobility'],
      workoutTypes: ['Bodyweight Basics', 'Advanced Skills', 'Flow Training', 'Static Holds']
    },
    { 
      id: 'yoga', 
      name: 'Yoga & Flexibility', 
      icon: Brain, 
      color: 'from-purple-500 to-purple-600',
      description: 'Improve flexibility, balance, and mind-body connection',
      benefits: ['Flexibility', 'Mental Clarity', 'Stress Relief', 'Balance'],
      workoutTypes: ['Vinyasa Flow', 'Restorative', 'Power Yoga', 'Yin Yoga']
    },
    { 
      id: 'cardio', 
      name: 'Endurance Training', 
      icon: Heart, 
      color: 'from-pink-500 to-pink-600',
      description: 'Build cardiovascular endurance and stamina',
      benefits: ['Heart Health', 'Endurance', 'Mental Toughness', 'Recovery'],
      workoutTypes: ['Running', 'Cycling', 'Swimming', 'Dancing']
    },
    { 
      id: 'sports', 
      name: 'Sports Training', 
      icon: Target, 
      color: 'from-orange-500 to-orange-600',
      description: 'Sport-specific training for athletic performance',
      benefits: ['Sport Skills', 'Agility', 'Competition Ready', 'Team Spirit'],
      workoutTypes: ['Basketball', 'Soccer', 'Tennis', 'Martial Arts']
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleScheduleUpdate = (edits: any[]) => {
    console.log('Schedule updated with:', edits);
  };

  const startWorkout = () => {
    onWorkoutSelect(todaysWorkout.id, new Date());
  };

  // Get mock workout data for calendar
  const getWorkoutData = () => {
    const workoutData: { [key: string]: any } = {};
    const today = new Date();
    
    // Add sample workout data for the week
    for (let i = -3; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      
      if (i % 2 === 0) {
        workoutData[dateKey] = {
          completed: i < 0,
          workoutType: i % 4 === 0 ? 'HIIT Cardio' : 'Strength Training',
          muscleGroups: ['Full Body'],
          estimatedDuration: 45,
          difficulty: 'medium'
        };
      } else if (i % 3 === 0) {
        workoutData[dateKey] = {
          completed: false,
          workoutType: 'Rest Day',
          muscleGroups: [],
          estimatedDuration: 0,
          difficulty: 'easy'
        };
      }
    }
    
    return workoutData;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Banner with Gradient */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-none">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Your Fitness Journey</h1>
              <p className="text-purple-100 mt-1">Stay consistent, stay strong, achieve your goals</p>
            </div>
            
            <div className="flex gap-3">
              <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    View Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      Your Workout Calendar
                    </DialogTitle>
                  </DialogHeader>
                  <SamsungGalaxyCalendar 
                    onDateSelect={onWorkoutSelect}
                    onWorkoutComplete={(date) => console.log('Workout completed:', date)}
                    workoutData={getWorkoutData()}
                  />
                </DialogContent>
              </Dialog>
              
              <AICalendarEditor 
                onScheduleUpdate={handleScheduleUpdate}
                currentSchedule={weeklySchedule}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* AI Coach Tips */}
        <AnimatePresence>
          {showTips && (
            <AICoachTips 
              userProfile={userProfile}
              currentWorkout={todaysWorkout.name}
              onDismiss={() => setShowTips(false)}
            />
          )}
        </AnimatePresence>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Weekly Progress</p>
                <p className="text-2xl font-bold text-gray-900">{workoutStats.completed}/{workoutStats.weeklyGoal}</p>
              </div>
              <CircularProgress 
                value={(workoutStats.completed / workoutStats.weeklyGoal) * 100}
                size={50}
                strokeWidth={4}
                color="text-purple-600"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">{workoutStats.streak} days</p>
              </div>
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-full">
                <Flame className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{workoutStats.totalMinutes}min</p>
              </div>
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-full">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Calories Burned</p>
                <p className="text-2xl font-bold text-gray-900">{workoutStats.caloriesBurned}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Today's Workout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Today's Workout</h2>
                  <h3 className="text-2xl font-bold text-gray-800">{todaysWorkout.name}</h3>
                </div>
                <Badge className={getDifficultyColor(todaysWorkout.difficulty)}>
                  {todaysWorkout.difficulty.toUpperCase()}
                </Badge>
              </div>
              
              <p className="text-gray-600 mb-6">{todaysWorkout.description}</p>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="flex items-center gap-3">
                  <Timer className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-700">{todaysWorkout.duration} minutes</span>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-700">{todaysWorkout.muscleGroups.join(', ')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-700">{todaysWorkout.type}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Dumbbell className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-700">{todaysWorkout.equipment.join(', ')}</span>
                </div>
              </div>
              
              <Button 
                onClick={startWorkout}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Workout
              </Button>
            </div>
          </div>

          {/* Explore Fitness */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-6">Explore Fitness</h3>
            <div className="space-y-3">
              {fitnessCategories.slice(0, 4).map((category) => {
                const IconComponent = category.icon;
                return (
                  <motion.div
                    key={category.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all border border-gray-100"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{category.name}</p>
                        <p className="text-xs text-gray-600">{category.workoutTypes.length} workout types</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              <Button 
                variant="outline" 
                className="w-full mt-4 border-gray-200 hover:bg-gray-50"
                onClick={() => setSelectedCategory('all')}
              >
                View All Categories
              </Button>
            </div>
          </div>
        </div>

        {/* Explore Fitness Categories Detail Modal */}
        <AnimatePresence>
          {selectedCategory && (
            <Dialog open={!!selectedCategory} onOpenChange={() => setSelectedCategory(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    Explore Fitness Categories
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fitnessCategories.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <motion.div
                        key={category.id}
                        className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 transition-all"
                        whileHover={{ y: -4 }}
                      >
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center mb-4`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">{category.name}</h3>
                        <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                        
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-gray-800 text-sm mb-2">Benefits:</h4>
                            <div className="flex flex-wrap gap-1">
                              {category.benefits.map((benefit) => (
                                <span key={benefit} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                  {benefit}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-800 text-sm mb-2">Workout Types:</h4>
                            <div className="space-y-1">
                              {category.workoutTypes.map((type) => (
                                <div key={type} className="text-xs text-gray-600">• {type}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => {
                            onWorkoutSelect(category.id, new Date());
                            setSelectedCategory(null);
                          }}
                          className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg transition-all"
                          size="sm"
                        >
                          Start {category.name}
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};