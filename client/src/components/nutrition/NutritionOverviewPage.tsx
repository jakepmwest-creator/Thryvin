import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
import SegmentedTabs from './SegmentedTabs';
import TodaysMeals from './TodaysMeals';
import NutritionOverviewBreakdown from './NutritionOverviewBreakdown';
import RecentFavourites from './RecentFavourites';

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

interface NutritionOverviewPageProps {
  userId: number;
  nutritionProfile: any;
  onTabChange?: (tab: string) => void;
}

export default function NutritionOverviewPage({ 
  userId, 
  nutritionProfile,
  onTabChange 
}: NutritionOverviewPageProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState('overview');
  
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

  // Sample recent favourites
  const recentFavourites: FavouriteMeal[] = [
    { id: '1', name: 'Avocado Toast', kcal: 280 },
    { id: '2', name: 'Chicken Stir Fry', kcal: 420 },
    { id: '3', name: 'Protein Smoothie', kcal: 350 },
    { id: '4', name: 'Quinoa Salad', kcal: 380 }
  ];

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'mealplan', label: 'Meal Plan' },
    { id: 'shopping', label: 'Shopping' },
    { id: 'learn', label: 'Learn' },
    { id: 'favourites', label: 'Favourites' },
    { id: 'track', label: 'Track' }
  ];

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

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  }, [onTabChange]);

  const handleQuickAdd = useCallback(() => {
    // Placeholder for quick add functionality
    console.log('Quick add meal');
  }, []);

  const handleQuickAddFavourite = useCallback((meal: FavouriteMeal) => {
    // Convert favourite to meal item and add to today's meals
    const newMeal: MealItem = {
      id: `fav-${meal.id}-${Date.now()}`,
      title: meal.name,
      kcal: meal.kcal,
      protein: Math.round(meal.kcal * 0.15 / 4), // Estimate protein
      carbs: Math.round(meal.kcal * 0.45 / 4),   // Estimate carbs
      fat: Math.round(meal.kcal * 0.35 / 9),      // Estimate fat
      source: 'user',
      time: 'snack',
      consumed: false
    };
    
    setTodaysMeals(meals => [...meals, newMeal]);
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Nutrition</h1>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Segmented tabs - sticky */}
      <div className="sticky top-0 z-20 bg-slate-50 px-4 py-4 border-b border-slate-200">
        <SegmentedTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* Main content */}
      <div className="overflow-y-auto scrollbar-hide pb-6">
        <div className="px-4 pt-6 space-y-6">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Today's Meals */}
              <TodaysMeals
                meals={todaysMeals}
                onToggleConsumed={toggleConsumed}
                onQuickAdd={handleQuickAdd}
              />

              {/* Nutrition Overview Breakdown */}
              <NutritionOverviewBreakdown
                targets={targets}
                totals={totals}
                mealContributions={mealContributions}
              />

              {/* Recent Favourites */}
              <RecentFavourites
                favourites={recentFavourites}
                onQuickAdd={handleQuickAddFavourite}
              />
            </motion.div>
          )}

          {activeTab === 'mealplan' && (
            <motion.div
              key="mealplan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center py-12"
            >
              <div className="text-slate-500">
                <h3 className="text-lg font-medium mb-2">Meal Plan</h3>
                <p className="text-sm">Coming soon - plan your meals for the week</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'shopping' && (
            <motion.div
              key="shopping"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center py-12"
            >
              <div className="text-slate-500">
                <h3 className="text-lg font-medium mb-2">Shopping</h3>
                <p className="text-sm">Coming soon - generate shopping lists from your meal plan</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'learn' && (
            <motion.div
              key="learn"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center py-12"
            >
              <div className="text-slate-500">
                <h3 className="text-lg font-medium mb-2">Learn</h3>
                <p className="text-sm">Coming soon - nutrition education and tips</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'favourites' && (
            <motion.div
              key="favourites"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center py-12"
            >
              <div className="text-slate-500">
                <h3 className="text-lg font-medium mb-2">Favourites</h3>
                <p className="text-sm">Your favorite meals and recipes</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'track' && (
            <motion.div
              key="track"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center py-12"
            >
              <div className="text-slate-500">
                <h3 className="text-lg font-medium mb-2">Track</h3>
                <p className="text-sm">Track your daily nutrition and progress</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}