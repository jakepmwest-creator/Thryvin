import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  ShoppingCart, 
  BookOpen, 
  PieChart, 
  ChevronRight, 
  Heart,
  Plus,
  Utensils,
  Check,
  X
} from 'lucide-react';

// Types
interface MealItem {
  id: string;
  title: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  source?: "user" | "ai";
  time?: "breakfast" | "lunch" | "dinner" | "snack";
  consumed: boolean;
}

interface Targets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Totals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FavouriteMeal {
  id: string;
  name: string;
  kcal: number;
  image?: string;
}

interface NutritionOverviewContentProps {
  userId: number;
  nutritionProfile: any;
  onNavigateToMealPlan?: () => void;
  onNavigateToShopping?: () => void;
  onNavigateToLearn?: () => void;
}

export default function NutritionOverviewContent({ 
  userId, 
  nutritionProfile,
  onNavigateToMealPlan,
  onNavigateToShopping,
  onNavigateToLearn
}: NutritionOverviewContentProps) {
  // Sample data - in real app this would come from API
  const [todaysMeals, setTodaysMeals] = useState<MealItem[]>([
    {
      id: '1',
      title: 'Greek Yogurt with Berries',
      kcal: 320,
      protein: 20,
      carbs: 35,
      fat: 8,
      source: 'user',
      time: 'breakfast',
      consumed: true
    },
    {
      id: '2',
      title: 'Quinoa Power Bowl',
      kcal: 480,
      protein: 18,
      carbs: 65,
      fat: 12,
      source: 'ai',
      time: 'lunch',
      consumed: false
    },
    {
      id: '3',
      title: 'Grilled Salmon & Vegetables',
      kcal: 520,
      protein: 35,
      carbs: 20,
      fat: 28,
      source: 'ai',
      time: 'dinner',
      consumed: false
    },
    {
      id: '4',
      title: 'Protein Smoothie',
      kcal: 280,
      protein: 25,
      carbs: 30,
      fat: 8,
      source: 'user',
      time: 'snack',
      consumed: true
    }
  ]);

  const targets: Targets = {
    kcal: nutritionProfile?.calorieGoal || 2300,
    protein: nutritionProfile?.proteinGoal || 180,
    carbs: nutritionProfile?.carbGoal || 250,
    fat: nutritionProfile?.fatGoal || 70
  };

  // Calculate totals from consumed meals
  const totals: Totals = useMemo(() => {
    return todaysMeals
      .filter(meal => meal.consumed)
      .reduce((acc, meal) => ({
        kcal: acc.kcal + meal.kcal,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fat: acc.fat + meal.fat
      }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  }, [todaysMeals]);

  // New meals to try - with enhanced state management
  const allNewMeals = [
    { id: '1', name: 'Mediterranean Bowl', kcal: 420, liked: false },
    { id: '2', name: 'Protein Pancakes', kcal: 380, liked: false },
    { id: '3', name: 'Asian Fusion Salad', kcal: 350, liked: false },
    { id: '4', name: 'Power Smoothie Bowl', kcal: 320, liked: false },
    { id: '5', name: 'Spicy Thai Curry', kcal: 465, liked: false },
    { id: '6', name: 'Quinoa Buddha Bowl', kcal: 390, liked: false },
    { id: '7', name: 'Grilled Chicken Wrap', kcal: 425, liked: false },
    { id: '8', name: 'Avocado Toast Plus', kcal: 340, liked: false }
  ];

  const [likedMeals, setLikedMeals] = useState<string[]>([]);
  const [skippedMeals, setSkippedMeals] = useState<string[]>([]);
  const [currentMealIndex, setCurrentMealIndex] = useState(0);
  
  // Get available meals (not liked or skipped)
  const availableMeals = allNewMeals.filter(meal => 
    !likedMeals.includes(meal.id) && !skippedMeals.includes(meal.id)
  );
  
  const newMealsToTry = availableMeals.slice(currentMealIndex, currentMealIndex + 3);

  const [selectedMeal, setSelectedMeal] = useState<MealItem | null>(null);
  const [selectedDiscoverMeal, setSelectedDiscoverMeal] = useState<any | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);

  // Get meal contributions for macro breakdown
  const mealContributions = useMemo(() => {
    const consumedMeals = todaysMeals.filter(meal => meal.consumed);
    return {
      protein: consumedMeals.map(meal => ({ name: meal.title, amount: meal.protein })),
      carbs: consumedMeals.map(meal => ({ name: meal.title, amount: meal.carbs })),
      fat: consumedMeals.map(meal => ({ name: meal.title, amount: meal.fat }))
    };
  }, [todaysMeals]);

  // Functions
  const toggleConsumed = useCallback((id: string) => {
    setTodaysMeals(meals => 
      meals.map(meal => 
        meal.id === id ? { ...meal, consumed: !meal.consumed } : meal
      )
    );
  }, []);

  const handleQuickAdd = useCallback(() => {
    // Placeholder for quick add functionality
    console.log('Quick add meal');
  }, []);

  const handleMealLiked = useCallback((mealId: string) => {
    setLikedMeals(prev => [...prev, mealId]);
    // Show next meal
    if (currentMealIndex < availableMeals.length - 3) {
      setCurrentMealIndex(prev => prev + 1);
    }
  }, [currentMealIndex, availableMeals.length]);

  const handleMealSkipped = useCallback((mealId: string) => {
    setSkippedMeals(prev => [...prev, mealId]);
    // Show next meal
    if (currentMealIndex < availableMeals.length - 3) {
      setCurrentMealIndex(prev => prev + 1);
    }
  }, [currentMealIndex, availableMeals.length]);

  const handleDiscoverMealClick = useCallback((meal: any) => {
    setSelectedDiscoverMeal(meal);
    setShowDiscoverModal(true);
  }, []);

  const closeDiscoverModal = useCallback(() => {
    setShowDiscoverModal(false);
    setSelectedDiscoverMeal(null);
  }, []);

  const handleMealClick = useCallback((meal: MealItem) => {
    setSelectedMeal(meal);
    setShowRecipeModal(true);
  }, []);

  const closeRecipeModal = useCallback(() => {
    setShowRecipeModal(false);
    setSelectedMeal(null);
  }, []);

  // Mock recipe data
  const getRecipeDetails = (meal: MealItem) => ({
    ingredients: [
      "2 tbsp oats",
      "1 cup almond milk", 
      "1 banana",
      "1 tbsp almond butter",
      "1 tsp honey",
      "Handful of berries"
    ],
    instructions: [
      "Mix oats with almond milk in a bowl",
      "Slice banana and add to mixture", 
      "Stir in almond butter and honey",
      "Top with fresh berries",
      "Let sit for 5 minutes before serving",
      "Enjoy your nutritious meal!"
    ],
    prepTime: "10 minutes",
    difficulty: "Easy"
  });

  // Mock discover meal details
  const getDiscoverMealDetails = (meal: any) => ({
    ingredients: [
      "Fresh ingredients for " + meal.name,
      "High-quality proteins",
      "Seasonal vegetables",
      "Healthy fats and oils",
      "Fresh herbs and spices"
    ],
    instructions: [
      "Prepare all ingredients",
      "Follow the cooking method",
      "Season to taste",
      "Cook until done",
      "Plate beautifully",
      "Enjoy your delicious meal!"
    ],
    prepTime: "15-25 minutes",
    difficulty: "Medium",
    macros: {
      protein: Math.round(meal.kcal * 0.25 / 4),
      carbs: Math.round(meal.kcal * 0.45 / 4), 
      fat: Math.round(meal.kcal * 0.30 / 9)
    }
  });

  return (
    <div className="space-y-6">

      {/* Enhanced Today's Meals */}
      <div className="bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 rounded-3xl overflow-hidden shadow-lg">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Today's meals</h2>
                <p className="text-green-100 text-sm">Track your nutrition</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNavigateToMealPlan}
              className="bg-white/20 hover:bg-white/30 text-white rounded-xl px-3 py-2 text-sm font-medium flex items-center gap-2 transition-all backdrop-blur-sm"
            >
              View plan
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
        
        {/* Meals list with enhanced design */}
        <div className="p-4 space-y-3">
          {todaysMeals.slice(0, 3).map((meal, index) => (
            <motion.div 
              key={meal.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleMealClick(meal)}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 cursor-pointer ${
                meal.consumed 
                  ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 shadow-sm hover:shadow-md' 
                  : 'bg-white border-2 border-slate-200 hover:border-emerald-200 hover:shadow-md'
              }`}
            >
              {/* Status indicator with animation */}
              <motion.div 
                className="flex-shrink-0"
                animate={{ 
                  scale: meal.consumed ? [1, 1.2, 1] : 1,
                  rotate: meal.consumed ? [0, 360] : 0
                }}
                transition={{ duration: 0.6 }}
              >
                {meal.consumed ? (
                  <div className="w-8 h-8 bg-gradient-to-r from-[#7A3CF3] to-[#FF4FD8] rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-8 h-8 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 border border-slate-400 rounded-full"></div>
                  </div>
                )}
              </motion.div>
              
              {/* Meal info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-semibold ${
                    meal.consumed ? 'text-emerald-900' : 'text-slate-900'
                  }`}>
                    {meal.title}
                  </span>
                  {meal.source === 'ai' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium">
                      AI
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    meal.consumed ? 'text-emerald-700' : 'text-slate-600'
                  }`}>
                    {meal.kcal} calories
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-xs text-slate-500">
                    P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g
                  </span>
                </div>
              </div>
              
              {/* Time indicator */}
              <div className={`text-xs px-2 py-1 rounded-lg font-medium ${
                meal.consumed 
                  ? 'bg-emerald-200 text-emerald-700' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {meal.time}
              </div>
            </motion.div>
          ))}
          
          {/* Show more button */}
          {todaysMeals.length > 3 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center pt-2"
            >
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onNavigateToMealPlan}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl transition-all"
              >
                +{todaysMeals.length - 3} more meals
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Clean Nutrition Overview - No Box Design */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-2 py-4"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-3 mb-3"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-[#7A3CF3] to-[#FF4FD8] rounded-2xl flex items-center justify-center">
              <PieChart className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#7A3CF3] to-[#FF4FD8] bg-clip-text text-transparent">
              Today's Nutrition
            </h2>
          </motion.div>
          <p className="text-slate-500 text-sm font-medium">Track your daily macro progress</p>
        </div>
        
        <div className="flex flex-col items-center">
          {/* Enhanced circular chart */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            className="relative w-40 h-40 mb-6"
          >
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="14"
              />
              
              {/* Protein arc with gradient */}
              <defs>
                <linearGradient id="proteinGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <linearGradient id="carbsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="fatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
              
              <motion.circle
                initial={{ pathLength: 0 }}
                animate={{ pathLength: totals.protein / targets.protein }}
                transition={{ delay: 0.6, duration: 1.5 }}
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="url(#proteinGradient)"
                strokeWidth="14"
                strokeDasharray={`${(totals.protein / targets.protein) * 439.82} 439.82`}
                strokeDashoffset="0"
                strokeLinecap="round"
                className="drop-shadow-sm"
              />
              
              <motion.circle
                initial={{ pathLength: 0 }}
                animate={{ pathLength: totals.carbs / targets.carbs }}
                transition={{ delay: 0.8, duration: 1.5 }}
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="url(#carbsGradient)"
                strokeWidth="14"
                strokeDasharray={`${(totals.carbs / targets.carbs) * 439.82} 439.82`}
                strokeDashoffset={`-${(totals.protein / targets.protein) * 439.82}`}
                strokeLinecap="round"
                className="drop-shadow-sm"
              />
              
              <motion.circle
                initial={{ pathLength: 0 }}
                animate={{ pathLength: totals.fat / targets.fat }}
                transition={{ delay: 1.0, duration: 1.5 }}
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="url(#fatGradient)"
                strokeWidth="14"
                strokeDasharray={`${(totals.fat / targets.fat) * 439.82} 439.82`}
                strokeDashoffset={`-${((totals.protein / targets.protein) + (totals.carbs / targets.carbs)) * 439.82}`}
                strokeLinecap="round"
                className="drop-shadow-sm"
              />
            </svg>
            
            {/* Enhanced center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.2, type: "spring", stiffness: 200 }}
                className="text-3xl font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent"
              >
                {totals.kcal}
              </motion.span>
              <span className="text-sm font-medium text-slate-500">calories</span>
            </div>
          </motion.div>
            
          {/* Enhanced macro breakdown */}
          <div className="grid grid-cols-3 gap-4 w-full">
            {[
              { label: 'Protein', current: totals.protein, target: targets.protein, color: 'blue', gradient: 'from-blue-500 to-blue-600' },
              { label: 'Carbs', current: totals.carbs, target: targets.carbs, color: 'green', gradient: 'from-green-500 to-green-600' },
              { label: 'Fat', current: totals.fat, target: targets.fat, color: 'orange', gradient: 'from-orange-500 to-orange-600' }
            ].map((macro, index) => (
              <motion.div 
                key={macro.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-lg text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className={`w-3 h-3 bg-gradient-to-r ${macro.gradient} rounded-full shadow-sm`}></div>
                  <span className="text-xs font-semibold text-slate-700">{macro.label}</span>
                </div>
                <div className="text-lg font-bold text-slate-900 mb-1">{macro.current}g</div>
                <div className="text-xs text-slate-500">of {macro.target}g</div>
                
                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((macro.current / macro.target) * 100, 100)}%` }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 1 }}
                    className={`h-full bg-gradient-to-r ${macro.gradient} rounded-full`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tinder-Style Meal Swiper */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="py-6"
      >
        <div className="text-center mb-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-3 mb-3"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl flex items-center justify-center">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-rose-500 bg-clip-text text-transparent">
              Discover New Meals
            </h2>
          </motion.div>
          <p className="text-slate-500 text-sm font-medium">Swipe right to like, left to skip</p>
        </div>

        <div className="relative h-80 w-full max-w-sm mx-auto">
          {newMealsToTry.slice(0, 3).map((meal, index) => (
            <motion.div
              key={meal.id}
              drag="x"
              dragConstraints={{ left: -200, right: 200 }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 100) {
                  // Swiped right - like
                  handleMealLiked(meal.id);
                } else if (info.offset.x < -100) {
                  // Swiped left - skip
                  handleMealSkipped(meal.id);
                }
              }}
              onClick={() => handleDiscoverMealClick(meal)}
              initial={{ 
                scale: 1 - index * 0.05, 
                y: index * 10,
                x: 0,
                opacity: 1,
                zIndex: newMealsToTry.length - index
              }}
              animate={{ 
                scale: 1 - index * 0.05, 
                y: index * 10,
                opacity: 1 
              }}
              whileDrag={{ scale: 1.05, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              style={{ zIndex: newMealsToTry.length - index }}
            >
              <div className="w-full h-full bg-white rounded-3xl border-2 border-red-200 shadow-xl p-6 flex flex-col overflow-hidden">
                {/* Meal image */}
                <div className="w-20 h-20 bg-gradient-to-br from-red-200 to-rose-200 rounded-3xl flex items-center justify-center shadow-lg mx-auto mb-4">
                  <span className="text-4xl">🍽️</span>
                </div>
                
                {/* Meal info */}
                <div className="text-center flex-1 flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{meal.name}</h3>
                  <p className="text-lg font-semibold text-red-600 mb-3">{meal.kcal} calories</p>
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-gradient-to-r from-red-100 to-rose-100 text-red-700 font-medium border border-red-200 mx-auto">
                    ✨ AI Recommended
                  </div>
                </div>
                
                {/* Swipe indicators */}
                <div className="flex justify-between mt-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <X className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium">Skip</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-500">
                    <span className="text-xs font-medium">Like</span>
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <Heart className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Progress indicator */}
        {availableMeals.length > 0 && (
          <div className="flex justify-center gap-2 mt-6">
            {availableMeals.slice(0, 5).map((_, index) => (
              <div 
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index < currentMealIndex ? 'bg-red-500' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        )}
        
        {availableMeals.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">No more meals to discover!</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSkippedMeals([]);
                setCurrentMealIndex(0);
              }}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
            >
              Reset & Discover More
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Recipe Details Modal */}
      {showRecipeModal && selectedMeal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeRecipeModal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <button
                  onClick={closeRecipeModal}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h2 className="text-xl font-bold mb-1">{selectedMeal.title}</h2>
              <div className="flex items-center gap-4 text-emerald-100 text-sm">
                <span>⏱️ {getRecipeDetails(selectedMeal).prepTime}</span>
                <span>📊 {getRecipeDetails(selectedMeal).difficulty}</span>
                <span>🔥 {selectedMeal.kcal} cal</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto scrollbar-hide max-h-[60vh]">
              {/* Nutrition Facts */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Nutrition Facts</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200">
                    <div className="text-xs text-blue-600 font-medium mb-1">Protein</div>
                    <div className="text-lg font-bold text-blue-700">{selectedMeal.protein}g</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center border border-green-200">
                    <div className="text-xs text-green-600 font-medium mb-1">Carbs</div>
                    <div className="text-lg font-bold text-green-700">{selectedMeal.carbs}g</div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-200">
                    <div className="text-xs text-orange-600 font-medium mb-1">Fat</div>
                    <div className="text-lg font-bold text-orange-700">{selectedMeal.fat}g</div>
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Ingredients</h3>
                <div className="space-y-2">
                  {getRecipeDetails(selectedMeal).ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
                      <span className="text-slate-700">{ingredient}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Cooking Instructions</h3>
                <div className="space-y-3">
                  {getRecipeDetails(selectedMeal).instructions.map((instruction, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-slate-700 leading-relaxed">{instruction}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleConsumed(selectedMeal.id)}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                    selectedMeal.consumed
                      ? 'bg-emerald-500 text-white shadow-lg hover:bg-emerald-600'
                      : 'bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {selectedMeal.consumed ? '✓ Consumed' : 'Mark as Eaten'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Heart className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Discover Meal Details Modal */}
      {showDiscoverModal && selectedDiscoverMeal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeDiscoverModal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-orange-500 p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <button
                  onClick={closeDiscoverModal}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h2 className="text-xl font-bold mb-1">{selectedDiscoverMeal.name}</h2>
              <div className="flex items-center gap-4 text-pink-100 text-sm">
                <span>⏱️ {getDiscoverMealDetails(selectedDiscoverMeal).prepTime}</span>
                <span>📊 {getDiscoverMealDetails(selectedDiscoverMeal).difficulty}</span>
                <span>🔥 {selectedDiscoverMeal.kcal} cal</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto scrollbar-hide max-h-96 space-y-6">
              {/* Macros */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Nutrition Info</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-xl">
                    <div className="text-lg font-bold text-blue-600">
                      {getDiscoverMealDetails(selectedDiscoverMeal).macros.protein}g
                    </div>
                    <div className="text-xs text-blue-500 font-medium">Protein</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-xl">
                    <div className="text-lg font-bold text-green-600">
                      {getDiscoverMealDetails(selectedDiscoverMeal).macros.carbs}g
                    </div>
                    <div className="text-xs text-green-500 font-medium">Carbs</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-xl">
                    <div className="text-lg font-bold text-orange-600">
                      {getDiscoverMealDetails(selectedDiscoverMeal).macros.fat}g
                    </div>
                    <div className="text-xs text-orange-500 font-medium">Fat</div>
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Ingredients</h3>
                <div className="space-y-2">
                  {getDiscoverMealDetails(selectedDiscoverMeal).ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="w-2 h-2 bg-pink-400 rounded-full flex-shrink-0"></div>
                      <span className="text-slate-700">{ingredient}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Cooking Instructions</h3>
                <div className="space-y-3">
                  {getDiscoverMealDetails(selectedDiscoverMeal).instructions.map((instruction, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-slate-700 leading-relaxed">{instruction}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    handleMealLiked(selectedDiscoverMeal.id);
                    closeDiscoverModal();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  💖 Add to Liked
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    handleMealSkipped(selectedDiscoverMeal.id);
                    closeDiscoverModal();
                  }}
                  className="px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}