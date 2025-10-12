import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { 
  Apple, Plus, Calendar, TrendingUp, Target, 
  Utensils, Coffee, Sunrise, Sun, Moon, 
  ChevronLeft, ChevronRight, Sparkles,
  CheckCircle, Circle, BarChart3, Activity,
  Mic, MicOff, Play, Pause, BookOpen,
  ShoppingCart, GraduationCap, 
  ChevronDown, Check, Undo2, ShoppingBag,
  Edit3, HelpCircle, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format, addDays, subDays, isToday, parseISO } from 'date-fns';
import GenerateMealPlanDialog from './GenerateMealPlanDialog';
import MealLoggingModal from './MealLoggingModal';
import DailyNutritionProgress from './DailyNutritionProgress';
import AICoachGuidance from './AICoachGuidance';
import InteractiveAIMealPlan from './InteractiveAIMealPlan';
import NutritionCalendarView from './NutritionCalendarView';
import AutoShoppingList from './AutoShoppingList';
import NutritionEducationalContent from './NutritionEducationalContent';
import DayMealPlanModal from './DayMealPlanModal';
import RecipeDetailModal from './RecipeDetailModal';
import FavoritesContent from './FavoritesContent';
import NutritionTrackingContent from './NutritionTrackingContent';
import NutritionOverviewContent from './NutritionOverviewContent';
import { NutritionQuickSetup } from './NutritionQuickSetup';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { startOfWeek, endOfWeek, eachDayOfInterval, format as formatDate, isSameDay, addWeeks, subWeeks } from 'date-fns';

// Types as specified by user
type MealOption = { 
  id: string; 
  title: string; 
  kcal: number; 
  protein: number; 
  carbs: number; 
  fat: number; 
};

type PlannedMeal = { 
  time: "breakfast" | "lunch" | "dinner" | "snack"; 
  selected?: MealOption; 
  options: MealOption[]; 
};

type DayPlan = { 
  date: string; 
  meals: PlannedMeal[]; 
};

interface NutritionTabProps {
  userId: number;
  onNutritionModalChange?: (isOpen: boolean) => void;
}

interface MealPlanViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

// Mock data generator for meal options
const generateMealOptions = (mealTime: string): MealOption[] => {
  const mealData = {
    breakfast: [
      { id: '1', title: 'Protein Pancakes with Berries', kcal: 320, protein: 25, carbs: 35, fat: 8 },
      { id: '2', title: 'Greek Yogurt Parfait', kcal: 280, protein: 20, carbs: 30, fat: 10 },
      { id: '3', title: 'Avocado Toast with Eggs', kcal: 380, protein: 18, carbs: 25, fat: 22 }
    ],
    lunch: [
      { id: '4', title: 'Grilled Chicken Salad', kcal: 420, protein: 35, carbs: 15, fat: 18 },
      { id: '5', title: 'Turkey & Hummus Wrap', kcal: 380, protein: 28, carbs: 40, fat: 12 },
      { id: '6', title: 'Quinoa Buddha Bowl', kcal: 450, protein: 20, carbs: 55, fat: 15 }
    ],
    dinner: [
      { id: '7', title: 'Baked Salmon with Vegetables', kcal: 480, protein: 40, carbs: 20, fat: 25 },
      { id: '8', title: 'Lean Beef Stir Fry', kcal: 520, protein: 38, carbs: 35, fat: 22 },
      { id: '9', title: 'Lentil Curry with Rice', kcal: 440, protein: 22, carbs: 65, fat: 8 }
    ],
    snack: [
      { id: '10', title: 'Apple with Almond Butter', kcal: 190, protein: 6, carbs: 20, fat: 12 },
      { id: '11', title: 'Protein Smoothie', kcal: 220, protein: 25, carbs: 15, fat: 8 },
      { id: '12', title: 'Mixed Nuts & Berries', kcal: 180, protein: 5, carbs: 12, fat: 15 }
    ]
  };
  return mealData[mealTime as keyof typeof mealData] || [];
};

// MealPlanView Component
function MealPlanView({ selectedDate, onDateSelect }: MealPlanViewProps) {
  const [activeDate, setActiveDate] = useState(formatDate(selectedDate, 'yyyy-MM-dd'));
  const [plansByDate, setPlansByDate] = useState<Map<string, DayPlan>>(new Map());
  const [currentWeek, setCurrentWeek] = useState(selectedDate);
  const [undoSnackbar, setUndoSnackbar] = useState<{show: boolean, message: string, undoAction?: () => void}>({show: false, message: ''});
  const [aiQuery, setAiQuery] = useState<Record<string, string>>({});
  const [selectedMealForDetail, setSelectedMealForDetail] = useState<any>(null);
  const { toast } = useToast();

  // Generate week days
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Get or create day plan
  const getDayPlan = (date: string): DayPlan => {
    if (!plansByDate.has(date)) {
      const newPlan: DayPlan = {
        date,
        meals: [
          { time: 'breakfast', options: generateMealOptions('breakfast') },
          { time: 'lunch', options: generateMealOptions('lunch') },
          { time: 'dinner', options: generateMealOptions('dinner') },
          { time: 'snack', options: generateMealOptions('snack') }
        ]
      };
      setPlansByDate(new Map(plansByDate.set(date, newPlan)));
      return newPlan;
    }
    return plansByDate.get(date)!;
  };

  // Calculate completion percentage for a day
  const getCompletionPercentage = (date: string): number => {
    const plan = plansByDate.get(date);
    if (!plan) return 0;
    const selectedCount = plan.meals.filter(meal => meal.selected).length;
    return (selectedCount / plan.meals.length) * 100;
  };

  // Navigate to date
  const navigateToDate = (date: Date) => {
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    setActiveDate(dateStr);
    onDateSelect(date);
  };

  // Select meal option
  const selectOption = (date: string, mealTime: string, optionId: string) => {
    const plan = getDayPlan(date);
    const meal = plan.meals.find(m => m.time === mealTime);
    const option = meal?.options.find(o => o.id === optionId);
    
    if (meal && option) {
      const previousSelection = meal.selected;
      meal.selected = option;
      setPlansByDate(new Map(plansByDate.set(date, plan)));
      
      // Show undo snackbar
      setUndoSnackbar({
        show: true,
        message: `${option.title} selected for ${mealTime}`,
        undoAction: () => {
          meal.selected = previousSelection;
          setPlansByDate(new Map(plansByDate.set(date, plan)));
          setUndoSnackbar({show: false, message: ''});
        }
      });
      
      setTimeout(() => setUndoSnackbar({show: false, message: ''}), 5000);
    }
  };

  // Swap with AI
  const swapWithAI = (date: string, mealTime: string, query: string) => {
    const plan = getDayPlan(date);
    const meal = plan.meals.find(m => m.time === mealTime);
    
    if (meal) {
      // Simulate AI generating new options
      meal.options = generateMealOptions(mealTime).map((option, index) => ({
        ...option,
        id: `${option.id}_new_${Date.now()}_${index}`,
        title: query ? `${query} - ${option.title}` : option.title
      }));
      setPlansByDate(new Map(plansByDate.set(date, plan)));
      
      toast({
        title: "New options generated!",
        description: `AI found fresh ${mealTime} options${query ? ` for "${query}"` : ''}`
      });
    }
  };

  // Add missing to shopping list
  const addMissingToShopping = (option: MealOption) => {
    toast({
      title: "Added to shopping list!",
      description: `Ingredients for ${option.title} added to your list`
    });
  };

  const currentDayPlan = getDayPlan(activeDate);

  return (
    <div className="space-y-6">
      {/* Enhanced Calendar - Clean Design */}
      <div className="mb-6">
        <NutritionCalendarView
          selectedDate={selectedDate}
          onDateSelect={(date) => {
            navigateToDate(date);
            onDateSelect(date);
          }}
          loggedMeals={{}}
          plannedMeals={Object.fromEntries(
            Array.from(plansByDate.entries()).map(([date, plan]) => [
              date, 
              plan.meals.filter(meal => meal.selected).map(meal => ({
                ...meal.selected,
                type: meal.time
              }))
            ])
          )}
          onDayClick={(date) => navigateToDate(date)}
        />
      </div>

      {/* Today's Nutrition Plan - No Borders */}
      <div className="px-2">
        <div className="flex items-center justify-between mb-6">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold bg-gradient-to-r from-[#7A3CF3] to-[#FF4FD8] bg-clip-text text-transparent"
          >
            {formatDate(new Date(activeDate), 'EEEE, MMMM d')}
          </motion.h2>
          <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 shadow-lg">
            {currentDayPlan.meals.filter(m => m.selected).length}/4 meals planned
          </Badge>
        </div>

          <Accordion type="multiple" className="space-y-4">
            {currentDayPlan.meals.map((meal, index) => {
              const mealIcons = {
                breakfast: Sunrise,
                lunch: Sun, 
                dinner: Moon,
                snack: Coffee
              };
              const mealGradients = {
                breakfast: 'from-orange-400 via-amber-400 to-yellow-400',
                lunch: 'from-blue-400 via-cyan-400 to-teal-400',
                dinner: 'from-purple-500 via-indigo-500 to-blue-500',
                snack: 'from-green-400 via-emerald-400 to-teal-400'
              };
              const MealIcon = mealIcons[meal.time];
              const gradient = mealGradients[meal.time];

              return (
                <motion.div
                  key={meal.time}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <AccordionItem 
                    value={meal.time} 
                    className="border-0 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden mb-4 mx-2"
                  >
                    <AccordionTrigger className="hover:no-underline py-4 px-5">
                      <div className="flex items-center gap-3 w-full">
                        <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center`}>
                          <MealIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-semibold text-slate-900 capitalize">{meal.time}</div>
                          {meal.selected ? (
                            <div className="text-sm text-slate-600">
                              {meal.selected.title} • 
                              <span className="text-green-600 font-medium">{meal.selected.kcal} kcal</span>
                            </div>
                          ) : (
                            <div className="text-sm text-slate-400">Tap to choose your meal</div>
                          )}
                        </div>
                        {meal.selected && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </AccordionTrigger>
                
                    <AccordionContent className="pt-0 pb-3 px-5">
                      <div className="space-y-2">
                        {meal.options.map((option, optionIndex) => (
                          <motion.div 
                            key={option.id} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: optionIndex * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className={`relative overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer group ${
                              meal.selected?.id === option.id 
                                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg' 
                                : 'bg-white hover:shadow-xl border-2 border-slate-200 hover:border-purple-300'
                            }`}
                            onClick={() => setSelectedMealForDetail({
                              ...option,
                              mealType: meal.time,
                              imageUrl: '/api/placeholder/400/300'
                            })}
                          >
                            {/* Background Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50/50 to-purple-50/30 opacity-50" />
                            
                            {/* Selected Badge */}
                            {meal.selected?.id === option.id && (
                              <div className="absolute top-3 right-3 z-10">
                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                </div>
                              </div>
                            )}
                            
                            <div className="relative z-10 p-4">
                              {/* Meal Image Placeholder */}
                              <div className="w-full h-32 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl mb-3 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                <div className="text-slate-500 text-sm font-medium">🍽️ {option.title}</div>
                              </div>
                              
                              {/* Meal Info */}
                              <div className="mb-3">
                                <h4 className="font-bold text-slate-900 mb-2 text-lg group-hover:text-purple-600 transition-colors">{option.title}</h4>
                                <p className="text-sm text-slate-600 mb-3">Delicious and nutritious meal perfect for your {meal.time}</p>
                                
                                {/* Macro Grid */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  <div className="bg-gradient-to-r from-orange-100 to-orange-200 rounded-lg p-2 text-center">
                                    <div className="text-lg font-bold text-orange-700">{option.kcal}</div>
                                    <div className="text-xs text-orange-600 font-medium">kcal</div>
                                  </div>
                                  <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg p-2 text-center">
                                    <div className="text-lg font-bold text-blue-700">{option.protein}g</div>
                                    <div className="text-xs text-blue-600 font-medium">protein</div>
                                  </div>
                                  <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-lg p-2 text-center">
                                    <div className="text-lg font-bold text-green-700">{option.carbs}g</div>
                                    <div className="text-xs text-green-600 font-medium">carbs</div>
                                  </div>
                                  <div className="bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg p-2 text-center">
                                    <div className="text-lg font-bold text-purple-700">{option.fat}g</div>
                                    <div className="text-xs text-purple-600 font-medium">fat</div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    selectOption(activeDate, meal.time, option.id);
                                  }}
                                  className={`flex-1 rounded-xl transition-all duration-300 ${
                                    meal.selected?.id === option.id
                                      ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
                                      : 'bg-gradient-to-r from-[#7A3CF3] to-[#FF4FD8] hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl'
                                  }`}
                                >
                                  {meal.selected?.id === option.id ? 'Selected' : 'Select'}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    swapWithAI(activeDate, meal.time, '');
                                  }}
                                  className="rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addMissingToShopping(option);
                                  }}
                                  className="rounded-xl border-2 border-green-200 hover:border-green-400 hover:bg-green-50"
                                >
                                  <ShoppingBag className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        
                        {/* Ask AI Bar */}
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Input 
                              placeholder="Ask AI to modify options..."
                              value={aiQuery[meal.time] || ''}
                              onChange={(e) => setAiQuery({...aiQuery, [meal.time]: e.target.value})}
                              className="flex-1 h-8 text-sm"
                            />
                            <Button 
                              size="sm"
                              onClick={() => {
                                swapWithAI(activeDate, meal.time, aiQuery[meal.time] || '');
                                setAiQuery({...aiQuery, [meal.time]: ''});
                              }}
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white h-8 text-xs"
                            >
                              Ask AI
                            </Button>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap">
                            {['No chicken', 'Gluten-free', 'Cheaper', 'High protein', 'Low carb'].map((chip) => (
                              <Button 
                                key={chip}
                                size="sm" 
                                variant="outline" 
                                className="text-xs h-6 px-2"
                                onClick={() => swapWithAI(activeDate, meal.time, chip)}
                              >
                                {chip}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              );
          })}
          </Accordion>
      </div>

      {/* Undo Snackbar */}
      {undoSnackbar.show && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50"
        >
          <span className="text-sm">{undoSnackbar.message}</span>
          {undoSnackbar.undoAction && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white hover:bg-slate-700 h-auto py-1 px-2"
              onClick={undoSnackbar.undoAction}
            >
              <Undo2 className="w-3 h-3 mr-1" />Undo
            </Button>
          )}
        </motion.div>
      )}

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        isOpen={!!selectedMealForDetail}
        onClose={() => setSelectedMealForDetail(null)}
        meal={selectedMealForDetail ? {
          id: selectedMealForDetail.id,
          name: selectedMealForDetail.title,
          calories: selectedMealForDetail.kcal,
          protein: selectedMealForDetail.protein,
          carbs: selectedMealForDetail.carbs,
          fat: selectedMealForDetail.fat,
          prepTime: '15 min',
          cookTime: '20 min',
          servings: 2,
          difficulty: 'easy' as const,
          tags: ['healthy', 'nutritious', selectedMealForDetail.mealType],
          imageUrl: selectedMealForDetail.imageUrl || '/api/placeholder/400/300',
          eaten: false,
          description: `Delicious ${selectedMealForDetail.title} perfect for your ${selectedMealForDetail.mealType}. This meal combines fresh ingredients with balanced nutrition to fuel your day.`,
          ingredients: [
            { id: '1', name: 'Fresh ingredients', amount: '1', unit: 'cup', category: 'produce' },
            { id: '2', name: 'Quality protein', amount: '150', unit: 'g', category: 'protein' },
            { id: '3', name: 'Healthy carbs', amount: '100', unit: 'g', category: 'grains' },
            { id: '4', name: 'Good fats', amount: '2', unit: 'tbsp', category: 'fats' }
          ],
          instructions: [
            { step: 1, title: 'Prepare ingredients', description: 'Wash and prepare all fresh ingredients as needed.' },
            { step: 2, title: 'Cook protein', description: 'Cook the protein source using your preferred method.' },
            { step: 3, title: 'Combine', description: 'Combine all ingredients and season to taste.' },
            { step: 4, title: 'Serve', description: 'Plate beautifully and enjoy your nutritious meal!' }
          ],
          videoUrl: '',
          tips: [
            'Prep ingredients ahead of time for quicker cooking',
            'Season well for maximum flavor',
            'Don\'t overcook to preserve nutrients'
          ],
          nutritionBenefits: [
            'High in protein for muscle maintenance',
            'Balanced macronutrients for sustained energy',
            'Rich in vitamins and minerals',
            'Supports your fitness goals'
          ]
        } : null}
        mealType={selectedMealForDetail?.mealType || ''}
        onMarkEaten={(mealId, eaten) => {
          console.log('Mark eaten:', mealId, eaten);
        }}
        onAddToShoppingList={(ingredients) => {
          console.log('Add to shopping list:', ingredients);
          toast({
            title: 'Added to Shopping List',
            description: 'Ingredients have been added to your shopping list.',
          });
        }}
        onSaveToFavorites={(meal) => {
          console.log('Save to favorites:', meal);
          toast({
            title: 'Saved to Favorites',
            description: 'Meal has been saved to your favorites.',
          });
        }}
      />
    </div>
  );
}

export default function EnhancedNutritionTab({ userId, onNutritionModalChange }: NutritionTabProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isMealLoggingOpen, setIsMealLoggingOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [isDayMealPlanOpen, setIsDayMealPlanOpen] = useState(false);
  const [isRecipeDetailOpen, setIsRecipeDetailOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [selectedMealTypeForRecipe, setSelectedMealTypeForRecipe] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [currentTab, setCurrentTab] = useState<'overview' | 'mealplan' | 'shopping' | 'learn' | 'favourites' | 'track'>('overview');
  const [showNutritionSetupModal, setShowNutritionSetupModal] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const dateString = format(selectedDate, 'yyyy-MM-dd');

  // Modal handlers
  const handleRecipeClick = (meal: any, mealType: string) => {
    setSelectedMeal(meal);
    setSelectedMealTypeForRecipe(mealType);
    setIsRecipeDetailOpen(true);
  };

  const handleMealSwap = (mealType: string, mealId: string) => {
    toast({
      title: "Meal swapped!",
      description: "AI is adjusting your remaining meals for optimal nutrition balance."
    });
  };

  const handleMarkEaten = (mealId: string, eaten: boolean) => {
    toast({
      title: eaten ? "Meal logged!" : "Meal unmarked",
      description: eaten ? "Added to your daily nutrition tracking" : "Removed from your daily log"
    });
  };

  const handleAddToShoppingList = (ingredients: any[]) => {
    toast({
      title: "Added to shopping list!",
      description: `${ingredients.length} ingredients added to your shopping list.`
    });
  };

  // Shared favorites state
  const [sharedFavorites, setSharedFavorites] = useState<any[]>(() => {
    // Load from localStorage if available
    try {
      const saved = localStorage.getItem(`favorites-${userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleSaveToFavorites = (meal: any) => {
    const favoritesMeal = {
      id: meal.id,
      name: meal.name,
      description: meal.description || meal.nutrients?.description || 'Delicious meal',
      image: meal.image || '/api/placeholder/300/200',
      calories: meal.kcal || meal.calories || 0,
      protein: meal.protein || 0,
      carbs: meal.carbs || 0,
      fat: meal.fat || 0,
      cookTime: meal.prepTime || meal.cookTime || '20 min',
      difficulty: meal.difficulty || 'medium',
      servings: meal.servings || 2,
      tags: meal.tags || ['healthy'],
      rating: meal.rating || 4.5,
      cuisine: meal.cuisine || 'Modern',
      addedDate: new Date()
    };

    setSharedFavorites(prev => {
      // Check if already exists
      if (prev.some(fav => fav.id === meal.id)) {
        toast({
          title: "Already in favorites!",
          description: "This meal is already saved to your favorites."
        });
        return prev;
      }
      
      const updated = [favoritesMeal, ...prev];
      
      // Save to localStorage
      try {
        localStorage.setItem(`favorites-${userId}`, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save favorites:', e);
      }
      
      toast({
        title: "Saved to favorites! ❤️",
        description: "This recipe has been added to your favorite meals."
      });
      
      return updated;
    });
  };

  // Get nutrition profile
  const { 
    data: nutritionProfile, 
    isLoading: isLoadingProfile 
  } = useQuery({
    queryKey: [`/api/users/${userId}/nutrition-profile`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/nutrition-profile`);
      if (!res.ok && res.status !== 404) throw new Error('Failed to fetch nutrition profile');
      return res.status === 404 ? null : res.json();
    }
  });

  // Get daily logged meals
  const { 
    data: dailyMeals = [], 
    isLoading: isLoadingMeals 
  } = useQuery({
    queryKey: [`/api/users/${userId}/logged-meals`, dateString],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/logged-meals?date=${dateString}`);
      if (!res.ok) throw new Error('Failed to fetch logged meals');
      return res.json();
    },
    enabled: !!nutritionProfile
  });

  // Get daily nutrition stats
  const { 
    data: dailyStats, 
    isLoading: isLoadingStats 
  } = useQuery({
    queryKey: [`/api/users/${userId}/nutrition-stats`, dateString],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/nutrition-stats/${dateString}`);
      if (!res.ok) throw new Error('Failed to fetch nutrition stats');
      return res.json();
    },
    enabled: !!nutritionProfile
  });

  // Get meal plans
  const {
    data: mealPlans = [],
    isLoading: isLoadingMealPlans,
  } = useQuery({
    queryKey: [`/api/users/${userId}/meal-plans`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/meal-plans`);
      if (!res.ok) throw new Error('Failed to fetch meal plans');
      return res.json();
    },
    enabled: !!nutritionProfile,
  });

  const generateMealPlanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/users/${userId}/generate-meal-plan`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Meal Plan Generated',
        description: 'Your personalized meal plan has been created!',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/meal-plans`] });
      setIsGenerateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Generate Meal Plan',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Show nutrition setup modal when no profile exists
  useEffect(() => {
    if (!isLoadingProfile && !nutritionProfile) {
      setShowNutritionSetupModal(true);
    }
  }, [isLoadingProfile, nutritionProfile]);

  // Update parent component when modal state changes
  useEffect(() => {
    if (onNutritionModalChange) {
      onNutritionModalChange(showNutritionSetupModal);
    }
  }, [showNutritionSetupModal, onNutritionModalChange]);

  // Speech recognition for meal logging
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      // Handle speech-to-text for meal logging
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    if (isListening) {
      recognition.start();
    }

    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, [isListening]);

  if (isLoadingProfile) {
    return (
      <div className="flex-1 overflow-auto scrollbar-hide pb-16 bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 min-h-screen">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-3 border-purple-500/20 border-t-purple-500 rounded-full mx-auto mb-4"
            />
            <p className="text-slate-600 font-medium">Loading your nutrition profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Create dummy nutrition profile for demo when no real profile exists (modal will handle setup)
  const displayProfile = nutritionProfile || {
    goal: 'eat-healthier',
    dietType: 'omnivore',
    calorieGoal: 2000,
    proteinGoal: 150,
    carbGoal: 200,
    fatGoal: 65
  };

  const getMealTypeIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return <Sunrise className="w-5 h-5" />;
      case 'lunch': return <Sun className="w-5 h-5" />;
      case 'dinner': return <Moon className="w-5 h-5" />;
      case 'snack': return <Coffee className="w-5 h-5" />;
      default: return <Utensils className="w-5 h-5" />;
    }
  };

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case 'breakfast': return 'from-orange-400 to-yellow-400';
      case 'lunch': return 'from-blue-400 to-cyan-400';
      case 'dinner': return 'from-purple-400 to-indigo-400';
      case 'snack': return 'from-green-400 to-emerald-400';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const loggedMealsByType = dailyMeals.reduce((acc: any, meal: any) => {
    if (!acc[meal.mealType]) acc[meal.mealType] = [];
    acc[meal.mealType].push(meal);
    return acc;
  }, {});

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <div className="flex-1 overflow-auto scrollbar-hide pb-16 bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 min-h-screen">
      <div className="max-w-xl mx-auto">
        {/* Funky New Banner */}
        <div className="relative bg-gradient-to-br from-[#7A3CF3] via-purple-500 to-[#FF4FD8] rounded-2xl p-4 mb-4 text-white overflow-hidden shadow-xl">
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <motion.div 
              animate={{ 
                x: [0, 20, 0],
                y: [0, -10, 0],
                scale: [1, 1.1, 1],
                rotate: [0, 5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-4 right-8 w-20 h-20 bg-white/10 rounded-full backdrop-blur-sm"
            />
            <motion.div 
              animate={{ 
                x: [0, -15, 0],
                y: [0, 15, 0],
                scale: [1, 0.9, 1],
                rotate: [0, -8, 0]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-16 left-8 w-12 h-12 bg-white/15 rounded-2xl backdrop-blur-sm"
            />
            <motion.div 
              animate={{ 
                x: [0, 10, 0],
                y: [0, -20, 0],
                scale: [1, 1.2, 1],
                rotate: [0, 10, 0]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-6 right-16 w-16 h-16 bg-white/8 rounded-full backdrop-blur-sm"
            />
            <motion.div 
              animate={{ 
                x: [0, -25, 0],
                y: [0, 5, 0],
                scale: [1, 1.15, 1]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-12 left-12 w-8 h-8 bg-white/12 rounded-lg backdrop-blur-sm"
            />
          </div>
          
          <div className="relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <motion.div 
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"
              >
                <Utensils className="w-8 h-8 text-white" />
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-black bg-gradient-to-r from-white via-cyan-100 to-emerald-100 bg-clip-text text-transparent mb-2"
              >
                Your Nutrition Journey
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-emerald-100 text-base font-medium leading-relaxed max-w-sm mx-auto"
              >
                Track, learn, and thrive with AI-powered nutrition insights
              </motion.p>
              
              {/* Fun progress indicators */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6 flex justify-center space-x-2"
              >
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                    className="w-2 h-2 bg-white/60 rounded-full"
                  />
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Enhanced Tab Navigation - 3x2 Grid */}
        <div className="px-6 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-purple-100/50 overflow-hidden">
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'overview', label: 'Overview', icon: Target },
                { id: 'mealplan', label: 'Meal Plan', icon: Calendar },
                { id: 'shopping', label: 'Shopping', icon: ShoppingCart },
                { id: 'learn', label: 'Learn', icon: GraduationCap },
                { id: 'favourites', label: 'Favourites', icon: Target },
                { id: 'track', label: 'Track', icon: BarChart3 }
              ].map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant={currentTab === id ? 'default' : 'ghost'}
                  className={`w-full px-2 py-3 rounded-xl text-xs font-semibold transition-all duration-200 flex flex-col items-center gap-1 h-16 ${
                    currentTab === id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                  onClick={() => setCurrentTab(id as any)}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] leading-tight">{label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Tab Content */}
        <div className="px-6 space-y-6">
          <AnimatePresence mode="wait">
            {currentTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-6"
              >
                <NutritionOverviewContent
                  userId={userId}
                  nutritionProfile={displayProfile}
                  onNavigateToMealPlan={() => setCurrentTab('mealplan')}
                  onNavigateToShopping={() => setCurrentTab('shopping')}
                  onNavigateToLearn={() => setCurrentTab('learn')}
                />
              </motion.div>
            )}

            {currentTab === 'mealplan' && (
              <motion.div
                key="mealplan"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-6"
              >
                <MealPlanView selectedDate={selectedDate} onDateSelect={setSelectedDate} />
              </motion.div>
            )}

            {currentTab === 'shopping' && (
              <motion.div
                key="shopping"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-6"
              >
                <AutoShoppingList
                  userId={userId}
                  selectedDate={selectedDate}
                />
              </motion.div>
            )}

            {currentTab === 'learn' && (
              <motion.div
                key="learn"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-purple-100/50">
                  <NutritionEducationalContent
                    selectedMealType={selectedMealType}
                    userLevel="intermediate"
                  />
                </div>
              </motion.div>
            )}

            {currentTab === 'favourites' && (
              <motion.div
                key="favourites"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-6"
              >
                <FavoritesContent 
                  userId={userId} 
                  sharedFavorites={sharedFavorites}
                  setSharedFavorites={setSharedFavorites}
                />
              </motion.div>
            )}

            {currentTab === 'track' && (
              <motion.div
                key="track"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-6"
              >
                <NutritionTrackingContent userId={userId} />
              </motion.div>
            )}

            {/* Legacy logging section removed */}
            {false && (
              <motion.div
                key="logging"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Meal Types Grid */}
                <div className="grid grid-cols-1 gap-4">
                  {mealTypes.map((type) => {
                    const meals = loggedMealsByType[type] || [];
                    const totalCalories = meals.reduce((sum: number, meal: any) => sum + meal.calories, 0);
                    
                    return (
                      <Card key={type} className="rounded-2xl border-0 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-xl bg-gradient-to-r ${getMealTypeColor(type)}`}>
                                {getMealTypeIcon(type)}
                              </div>
                              <div>
                                <h3 className="font-semibold capitalize">{type}</h3>
                                <p className="text-sm text-gray-500">
                                  {meals.length} items • {totalCalories} cal
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl"
                              onClick={() => {
                                setSelectedMealType(type as any);
                                setIsMealLoggingOpen(true);
                              }}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          {meals.length > 0 && (
                            <div className="space-y-2">
                              {meals.map((meal: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                                >
                                  <div>
                                    <p className="font-medium">{meal.mealName}</p>
                                    {meal.notes && (
                                      <p className="text-sm text-gray-500">{meal.notes}</p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">{meal.calories} cal</p>
                                    <p className="text-xs text-gray-500">
                                      P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {meals.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <Circle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No meals logged yet</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {false && (
              <motion.div
                key="plans"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {mealPlans.length > 0 ? (
                  <div className="space-y-4">
                    {mealPlans.map((plan: any) => (
                      <Card key={plan.id} className="rounded-2xl border-0 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 text-white">
                          <h3 className="text-lg font-bold">{plan.title}</h3>
                          <p className="text-green-100 text-sm">{plan.description}</p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="text-sm">
                              <span className="font-medium">{plan.totalCalories}</span> calories
                            </div>
                            <div className="text-xs text-green-100">
                              P: {plan.totalProtein}g • C: {plan.totalCarbs}g • F: {plan.totalFat}g
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          {plan.meals && (
                            <div className="space-y-3">
                              <h4 className="font-medium text-gray-700 mb-2">Meal Plan Details</h4>
                              {JSON.parse(plan.meals).map((meal: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                  <div>
                                    <div className="font-medium capitalize">{meal.type}</div>
                                    <div className="text-sm text-gray-500">{meal.name}</div>
                                  </div>
                                  <div className="text-right text-sm">
                                    <div className="font-medium">{meal.calories} cal</div>
                                    <div className="text-gray-500">
                                      P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Button
                      onClick={() => setIsGenerateDialogOpen(true)}
                      variant="outline"
                      className="w-full h-12 rounded-2xl border-2 border-dashed border-green-200 hover:border-green-300 hover:bg-green-50 text-green-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Generate New Plan
                    </Button>
                  </div>
                ) : (
                  <Card className="rounded-2xl border-0 shadow-sm">
                    <CardContent className="p-8 text-center">
                      <div className="bg-green-50 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-green-500" />
                      </div>
                      <h3 className="font-semibold mb-2">No Meal Plans Yet</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Generate AI-powered meal plans based on your nutrition profile
                      </p>
                      <Button
                        onClick={() => generateMealPlanMutation.mutate()}
                        disabled={generateMealPlanMutation.isPending}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl"
                      >
                        {generateMealPlanMutation.isPending ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                            />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate AI Plan
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Meal Logging Modal */}
      <MealLoggingModal
        open={isMealLoggingOpen}
        onOpenChange={setIsMealLoggingOpen}
        userId={userId}
        mealType={selectedMealType}
        selectedDate={selectedDate}
        onMealLogged={() => {
          queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/logged-meals`] });
          queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/nutrition-stats`] });
        }}
      />

      {/* Day Meal Plan Modal */}
      <DayMealPlanModal
        isOpen={isDayMealPlanOpen}
        onClose={() => setIsDayMealPlanOpen(false)}
        selectedDate={selectedDate}
        onRecipeClick={handleRecipeClick}
        onMealSwap={handleMealSwap}
        onMarkEaten={handleMarkEaten}
      />

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        isOpen={isRecipeDetailOpen}
        onClose={() => setIsRecipeDetailOpen(false)}
        meal={selectedMeal}
        mealType={selectedMealTypeForRecipe}
        onMarkEaten={handleMarkEaten}
        onAddToShoppingList={handleAddToShoppingList}
        onSaveToFavorites={handleSaveToFavorites}
      />

      {/* Generate Meal Plan Dialog */}
      <GenerateMealPlanDialog
        open={isGenerateDialogOpen}
        onOpenChange={setIsGenerateDialogOpen}
        nutritionProfile={displayProfile}
        userId={userId}
      />

      {/* Enhanced Nutrition Setup Modal */}
      {showNutritionSetupModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4" 
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNutritionSetupModal(false);
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide border border-purple-100/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 rounded-t-3xl p-6 text-white overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-4 right-6 w-12 h-12 bg-white/10 rounded-full"></div>
              <div className="absolute bottom-6 left-8 w-6 h-6 bg-white/20 rounded-full"></div>
              
              <div className="relative z-10">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-3">
                    <Apple className="w-5 h-5" />
                  </div>
                  <h1 className="text-2xl font-bold">Welcome to Nutrition</h1>
                </div>
                <p className="text-purple-100 text-sm leading-relaxed">Set up your nutrition profile to get started with personalized AI-powered meal planning and tracking</p>
              </div>
            </div>
            <div className="p-6">
              <NutritionQuickSetup 
                onComplete={async (data) => {
                  console.log('Nutrition profile completed:', data);
                  
                  try {
                    // Map questionnaire data to nutrition profile schema
                    const nutritionProfileData = {
                      userId: userId,
                      goal: data.goal,
                      dietaryPattern: data.pattern === 'none' ? null : data.pattern,
                      dietaryPatternNotes: data.patternNotes || null,
                      cookingTimePreference: data.cookTime,
                      allergiesAndRestrictions: data.restrictionsList || [],
                      foodDislikes: data.dislikesList || [],
                      // Set reasonable defaults for required legacy fields
                      dietType: data.pattern === 'vegetarian' ? 'vegetarian' : 
                               data.pattern === 'vegan' ? 'vegan' : 
                               data.pattern === 'pescatarian' ? 'pescatarian' : 'omnivore',
                      calorieGoal: 2000, // Will be calculated later based on user profile
                      proteinGoal: 150,  // Will be calculated based on goal
                      carbGoal: 200,     // Will be calculated based on goal
                      fatGoal: 65,       // Will be calculated based on goal
                      allergies: data.restrictionsList || [],
                      preferences: [],
                      excludedFoods: data.dislikesList || []
                    };
                    
                    // Save to database
                    const response = await apiRequest('POST', `/api/users/${userId}/nutrition-profile`, nutritionProfileData);
                    
                    toast({
                      title: "Profile Created!",
                      description: "Your nutrition profile has been saved successfully.",
                    });
                    
                    // Refresh the nutrition profile data and close modal
                    queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/nutrition-profile`] });
                    setShowNutritionSetupModal(false);
                    
                  } catch (error: any) {
                    console.error('Failed to save nutrition profile:', error);
                    toast({
                      title: "Error",
                      description: "Failed to save your nutrition profile. Please try again.",
                      variant: "destructive"
                    });
                  }
                }}
                onSkip={() => {
                  console.log('Nutrition setup skipped - navigating to home');
                  setShowNutritionSetupModal(false);
                  window.location.href = '/'; // Navigate to actual home page
                }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}