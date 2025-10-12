import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar,
  PieChart,
  Lightbulb,
  Heart,
  ShoppingCart,
  Coffee,
  Sun,
  Moon,
  Utensils,
  ChevronRight,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, isToday } from 'date-fns';

interface StreamlinedOverviewProps {
  userId: number;
  selectedDate: Date;
  nutritionProfile: any;
  dailyStats: any;
  onShoppingListClick: () => void;
  onMealPlanClick: () => void;
}

interface TodaysMeal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  image: string;
  isLogged: boolean;
}

interface NutrientData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface FavoriteMeal {
  id: string;
  name: string;
  image: string;
  calories: number;
  rating: number;
}

export default function StreamlinedOverview({
  userId,
  selectedDate,
  nutritionProfile,
  dailyStats,
  onShoppingListClick,
  onMealPlanClick
}: StreamlinedOverviewProps) {
  
  // Mock data for today's meals (in real app, this would come from API)
  const todaysMeals: TodaysMeal[] = [
    {
      id: '1',
      name: 'Greek Yogurt Berry Bowl',
      type: 'breakfast',
      calories: 320,
      image: '/api/placeholder/100/100',
      isLogged: true
    },
    {
      id: '2',
      name: 'Mediterranean Quinoa Salad',
      type: 'lunch',
      calories: 480,
      image: '/api/placeholder/100/100',
      isLogged: false
    },
    {
      id: '3',
      name: 'Grilled Salmon & Vegetables',
      type: 'dinner',
      calories: 520,
      image: '/api/placeholder/100/100',
      isLogged: false
    }
  ];

  // Calculate nutrient breakdown from logged meals
  const nutrients: NutrientData[] = [
    {
      name: 'Carbs',
      value: dailyStats?.carbs || 45,
      color: '#10b981',
      percentage: 40
    },
    {
      name: 'Protein',
      value: dailyStats?.protein || 35,
      color: '#3b82f6',
      percentage: 30
    },
    {
      name: 'Fat',
      value: dailyStats?.fat || 30,
      color: '#f59e0b',
      percentage: 30
    }
  ];

  // Mock recent favorites
  const recentFavorites: FavoriteMeal[] = [
    {
      id: '1',
      name: 'Avocado Toast',
      image: '/api/placeholder/80/80',
      calories: 280,
      rating: 5
    },
    {
      id: '2',
      name: 'Protein Smoothie',
      image: '/api/placeholder/80/80',
      calories: 350,
      rating: 4
    },
    {
      id: '3',
      name: 'Chicken Stir Fry',
      image: '/api/placeholder/80/80',
      calories: 420,
      rating: 5
    },
    {
      id: '4',
      name: 'Quinoa Bowl',
      image: '/api/placeholder/80/80',
      calories: 380,
      rating: 4
    }
  ];

  // Generate AI tip based on current progress
  const getAITip = () => {
    const loggedMeals = todaysMeals.filter(meal => meal.isLogged).length;
    const totalCalories = dailyStats?.calories || 0;
    const targetCalories = nutritionProfile?.dailyCalories || 2000;

    if (loggedMeals === 0) {
      return "Start your day strong! Log your breakfast to track your nutrition progress.";
    } else if (totalCalories < targetCalories * 0.5) {
      return "You're behind on calories today. Consider adding a healthy snack between meals.";
    } else if (totalCalories > targetCalories * 0.8) {
      return "Great progress today! You're on track to meet your nutrition goals.";
    } else {
      return "Stay hydrated and consider adding more vegetables to your remaining meals.";
    }
  };

  const getMealIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return <Coffee className="w-4 h-4" />;
      case 'lunch': return <Sun className="w-4 h-4" />;
      case 'dinner': return <Moon className="w-4 h-4" />;
      default: return <Utensils className="w-4 h-4" />;
    }
  };

  const getMealColor = (type: string) => {
    switch (type) {
      case 'breakfast': return 'from-orange-400 to-yellow-400';
      case 'lunch': return 'from-blue-400 to-cyan-400';
      case 'dinner': return 'from-purple-400 to-indigo-400';
      default: return 'from-green-400 to-emerald-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Today's Summary */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-green-500" />
              {isToday(selectedDate) ? "Today's Meals" : `Meals for ${format(selectedDate, 'MMM d')}`}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onMealPlanClick}
              className="text-green-600 hover:text-green-700 rounded-xl"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {todaysMeals.map((meal) => (
            <motion.div
              key={meal.id}
              whileHover={{ scale: 1.02 }}
              className={`flex items-center p-3 rounded-2xl transition-all duration-200 ${
                meal.isLogged ? 'bg-green-50 border border-green-200' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getMealColor(meal.type)} flex items-center justify-center text-white mr-3`}>
                {getMealIcon(meal.type)}
              </div>
              
              <img 
                src={meal.image} 
                alt={meal.name}
                className="w-12 h-12 rounded-xl object-cover mr-3"
              />
              
              <div className="flex-1">
                <h4 className="font-medium text-sm">{meal.name}</h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500 capitalize">{meal.type}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs font-medium">{meal.calories} cal</span>
                </div>
              </div>
              
              {meal.isLogged && (
                <Badge className="bg-green-100 text-green-700 text-xs">
                  Logged
                </Badge>
              )}
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Nutrient Breakdown */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-green-500" />
            Nutrient Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="16"
                />
                {nutrients.map((nutrient, index) => {
                  const offset = nutrients.slice(0, index).reduce((acc, n) => acc + (n.percentage * 351.86) / 100, 0);
                  const strokeLength = (nutrient.percentage * 351.86) / 100;
                  
                  return (
                    <circle
                      key={nutrient.name}
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke={nutrient.color}
                      strokeWidth="16"
                      strokeDasharray={`${strokeLength} 351.86`}
                      strokeDashoffset={-offset}
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-800">{dailyStats?.calories || 0}</span>
                <span className="text-xs text-gray-500">calories</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            {nutrients.map((nutrient) => (
              <div key={nutrient.name} className="space-y-1">
                <div className="flex items-center justify-center space-x-1">
                  <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: nutrient.color }}></div>
                  <span className="text-sm font-medium">{nutrient.name}</span>
                </div>
                <div className="text-lg font-bold text-gray-800">{nutrient.value}g</div>
                <div className="text-xs text-gray-500">{nutrient.percentage}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Smart AI Tip of the Day */}
      <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-800 mb-1">AI Nutrition Tip</h4>
              <p className="text-sm text-blue-700">{getAITip()}</p>
            </div>
            <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* Recent Favorites */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Heart className="w-5 h-5 mr-2 text-green-500" />
              Recent Favorites
            </div>
            <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 rounded-xl">
              <span className="text-xs">View All</span>
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-3 overflow-x-auto pb-2">
            {recentFavorites.map((favorite) => (
              <motion.div
                key={favorite.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 w-20 cursor-pointer"
              >
                <div className="relative">
                  <img 
                    src={favorite.image} 
                    alt={favorite.name}
                    className="w-20 h-20 rounded-2xl object-cover"
                  />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <Heart className="w-3 h-3 text-white fill-current" />
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs font-medium line-clamp-2">{favorite.name}</p>
                  <p className="text-xs text-gray-500">{favorite.calories} cal</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Build Shopping List Button */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={onShoppingListClick}
          className="w-full h-16 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl shadow-lg"
        >
          <div className="flex items-center justify-center space-x-3">
            <ShoppingCart className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">Build My Shopping List</div>
              <div className="text-xs text-green-100">Auto-generate from your meal plan</div>
            </div>
            <TrendingUp className="w-5 h-5" />
          </div>
        </Button>
      </motion.div>
    </div>
  );
}