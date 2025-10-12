import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check, Circle, Coffee, Sun, Moon, Utensils, User } from 'lucide-react';

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

interface TodaysMealsProps {
  meals: MealItem[];
  onToggleConsumed: (id: string) => void;
  onQuickAdd: () => void;
}

export default function TodaysMeals({ meals, onToggleConsumed, onQuickAdd }: TodaysMealsProps) {
  const userMeals = meals.filter(meal => meal.source === 'user');
  const aiMeals = meals.filter(meal => meal.source === 'ai');
  
  const getMealIcon = (time?: string) => {
    switch (time) {
      case 'breakfast': return <Coffee className="w-4 h-4" />;
      case 'lunch': return <Sun className="w-4 h-4" />;
      case 'dinner': return <Moon className="w-4 h-4" />;
      default: return <Utensils className="w-4 h-4" />;
    }
  };

  const MealCard = ({ meal }: { meal: MealItem }) => (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      className={`relative overflow-hidden rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${
        meal.consumed 
          ? 'bg-gradient-to-br from-emerald-50 to-green-100 border-2 border-emerald-200' 
          : 'bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 hover:border-indigo-200'
      }`}
      onClick={() => onToggleConsumed(meal.id)}
    >
      {/* Gradient overlay for consumed meals */}
      {meal.consumed && (
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/10 rounded-2xl" />
      )}
      
      <div className="relative flex items-start gap-4">
        {/* Enhanced status indicator */}
        <motion.div
          className="mt-1 flex-shrink-0"
          initial={false}
          animate={{ 
            scale: meal.consumed ? 1.2 : 1,
            rotate: meal.consumed ? 360 : 0
          }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          {meal.consumed ? (
            <div className="w-7 h-7 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center shadow-lg">
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
          ) : (
            <div className="w-7 h-7 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center hover:border-indigo-400 transition-colors">
              <Circle className="w-4 h-4 text-slate-400" />
            </div>
          )}
        </motion.div>
        
        {/* Enhanced meal content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-xl ${
              meal.consumed 
                ? 'bg-emerald-100 text-emerald-600' 
                : 'bg-slate-100 text-slate-500'
            } transition-colors`}>
              {getMealIcon(meal.time)}
            </div>
            <h3 className={`font-semibold truncate ${
              meal.consumed ? 'text-emerald-900' : 'text-slate-900'
            }`}>
              {meal.title}
            </h3>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-lg font-bold ${
              meal.consumed ? 'text-emerald-800' : 'text-slate-900'
            }`}>
              {meal.kcal} cal
            </span>
            {meal.source === 'ai' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium">
                AI Pick
              </span>
            )}
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              meal.consumed 
                ? 'bg-emerald-200 text-emerald-700 border border-emerald-300' 
                : 'bg-blue-100 text-blue-700 border border-blue-200'
            }`}>
              P: {meal.protein}g
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              meal.consumed 
                ? 'bg-emerald-200 text-emerald-700 border border-emerald-300' 
                : 'bg-orange-100 text-orange-700 border border-orange-200'
            }`}>
              C: {meal.carbs}g
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              meal.consumed 
                ? 'bg-emerald-200 text-emerald-700 border border-emerald-300' 
                : 'bg-purple-100 text-purple-700 border border-purple-200'
            }`}>
              F: {meal.fat}g
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (meals.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-indigo-50 border-2 border-dashed border-slate-300 rounded-2xl p-8 shadow-lg text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to fuel your day?</h3>
          <p className="text-sm text-slate-600">No meals planned for today. Let's get started!</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          onClick={onQuickAdd}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Add your first meal
        </motion.button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Today's meals</h2>
          <p className="text-sm text-slate-600">Track your daily nutrition</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={onQuickAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="w-4 h-4" />
          Quick add
        </motion.button>
      </div>

      {/* Picked by you section */}
      {userMeals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border border-slate-300">
              <User className="w-4 h-4 mr-2" />
              Picked by you
            </span>
          </div>
          <div className="space-y-4">
            {userMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        </div>
      )}

      {/* Picked by AI section */}
      {aiMeals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border border-indigo-200">
              <div className="w-4 h-4 mr-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              Picked by AI
            </span>
          </div>
          <div className="space-y-4">
            {aiMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}