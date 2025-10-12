import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronDown, 
  ChevronUp,
  Coffee, 
  Sun, 
  Moon, 
  Utensils,
  Repeat,
  Heart,
  Check,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, addDays, subDays } from 'date-fns';

interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl: string;
  description: string;
  cookTime: string;
  isLogged: boolean;
}

interface MealPlanDay {
  breakfast: Meal[];
  lunch: Meal[];
  dinner: Meal[];
  snacks: Meal[];
}

interface DayMealPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onRecipeClick: (meal: Meal, mealType: string) => void;
  onMealSwap: (mealType: string, mealId: string) => void;
  onMarkEaten: (mealId: string, eaten: boolean) => void;
}

export default function DayMealPlanModal({
  isOpen,
  onClose,
  selectedDate,
  onRecipeClick,
  onMealSwap,
  onMarkEaten
}: DayMealPlanModalProps) {
  const [expandedMealType, setExpandedMealType] = useState<string | null>('breakfast');
  const [currentDate, setCurrentDate] = useState(selectedDate);

  // Mock meal plan data - in real app this would come from API
  const mealPlan: MealPlanDay = {
    breakfast: [
      {
        id: '1',
        name: 'Greek Yogurt Berry Bowl',
        calories: 320,
        protein: 20,
        carbs: 35,
        fat: 8,
        imageUrl: '/api/placeholder/300/200',
        description: 'Creamy Greek yogurt topped with fresh berries and granola',
        cookTime: '5 min',
        isLogged: false
      },
      {
        id: '2',
        name: 'Avocado Toast with Egg',
        calories: 380,
        protein: 18,
        carbs: 30,
        fat: 22,
        imageUrl: '/api/placeholder/300/200',
        description: 'Whole grain toast with mashed avocado and poached egg',
        cookTime: '10 min',
        isLogged: false
      }
    ],
    lunch: [
      {
        id: '3',
        name: 'Mediterranean Quinoa Salad',
        calories: 480,
        protein: 16,
        carbs: 58,
        fat: 18,
        imageUrl: '/api/placeholder/300/200',
        description: 'Fresh quinoa salad with vegetables and feta cheese',
        cookTime: '15 min',
        isLogged: false
      },
      {
        id: '4',
        name: 'Chicken Caesar Wrap',
        calories: 420,
        protein: 32,
        carbs: 35,
        fat: 16,
        imageUrl: '/api/placeholder/300/200',
        description: 'Grilled chicken wrap with Caesar dressing and romaine',
        cookTime: '12 min',
        isLogged: false
      }
    ],
    dinner: [
      {
        id: '5',
        name: 'Grilled Salmon & Vegetables',
        calories: 520,
        protein: 45,
        carbs: 25,
        fat: 28,
        imageUrl: '/api/placeholder/300/200',
        description: 'Fresh salmon with roasted seasonal vegetables',
        cookTime: '25 min',
        isLogged: false
      },
      {
        id: '6',
        name: 'Veggie Stir Fry with Tofu',
        calories: 380,
        protein: 22,
        carbs: 32,
        fat: 18,
        imageUrl: '/api/placeholder/300/200',
        description: 'Mixed vegetables and tofu in savory sauce',
        cookTime: '20 min',
        isLogged: false
      }
    ],
    snacks: [
      {
        id: '7',
        name: 'Mixed Nuts & Berries',
        calories: 180,
        protein: 6,
        carbs: 12,
        fat: 14,
        imageUrl: '/api/placeholder/300/200',
        description: 'Trail mix with almonds, walnuts, and dried berries',
        cookTime: '0 min',
        isLogged: false
      }
    ]
  };

  const getMealIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return <Coffee className="w-5 h-5" />;
      case 'lunch': return <Sun className="w-5 h-5" />;
      case 'dinner': return <Moon className="w-5 h-5" />;
      case 'snacks': return <Utensils className="w-5 h-5" />;
      default: return <Utensils className="w-5 h-5" />;
    }
  };

  const getMealColor = (type: string) => {
    switch (type) {
      case 'breakfast': return 'from-orange-400 to-yellow-400';
      case 'lunch': return 'from-blue-400 to-cyan-400';
      case 'dinner': return 'from-purple-400 to-indigo-400';
      case 'snacks': return 'from-green-400 to-emerald-400';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const toggleMealType = (mealType: string) => {
    setExpandedMealType(expandedMealType === mealType ? null : mealType);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1);
    setCurrentDate(newDate);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide rounded-2xl p-0">
        <DialogHeader className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateDate('prev')}
                className="text-white hover:bg-white/20 rounded-xl p-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="text-center">
                <DialogTitle className="text-lg font-bold">
                  {format(currentDate, 'EEEE')}
                </DialogTitle>
                <p className="text-green-100 text-sm">
                  {format(currentDate, 'MMM d, yyyy')}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateDate('next')}
                className="text-white hover:bg-white/20 rounded-xl p-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-xl p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-1 space-y-2">
          {Object.entries(mealPlan).map(([mealType, meals]) => (
            <div key={mealType} className="mb-4">
              <div
                className={`bg-gradient-to-r ${getMealColor(mealType)} p-4 cursor-pointer transition-all duration-200 rounded-2xl`}
                onClick={() => toggleMealType(mealType)}
              >
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-3">
                    {getMealIcon(mealType)}
                    <div>
                      <h3 className="font-semibold capitalize">{mealType}</h3>
                      <p className="text-xs opacity-90">{meals.length} option{meals.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-white/20 text-white border-white/30 text-xs">
                      {meals.reduce((total: number, meal: Meal) => total + meal.calories, 0)} cal
                    </Badge>
                    {expandedMealType === mealType ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {expandedMealType === mealType && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="px-2 pb-2"
                  >
                    <div className="p-4 space-y-3">
                      {meals.map((meal: Meal) => (
                        <motion.div
                          key={meal.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-2xl transition-all duration-200 cursor-pointer ${
                            meal.isLogged
                              ? 'bg-green-50'
                              : 'bg-white hover:bg-green-50'
                          }`}
                          onClick={() => onRecipeClick(meal, mealType)}
                        >
                          <div className="flex items-start space-x-3">
                            <img
                              src={meal.imageUrl}
                              alt={meal.name}
                              className="w-16 h-16 rounded-xl object-cover"
                            />
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm mb-1">{meal.name}</h4>
                              <p className="text-xs text-gray-600 mb-2 line-clamp-2">{meal.description}</p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <span>{meal.calories} cal</span>
                                  <span>•</span>
                                  <span>{meal.cookTime}</span>
                                </div>
                                
                                <div className="flex items-center space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onMealSwap(mealType, meal.id);
                                    }}
                                    className="p-1 h-6 w-6 rounded-lg hover:bg-gray-200"
                                  >
                                    <Repeat className="w-3 h-3" />
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onMarkEaten(meal.id, !meal.isLogged);
                                    }}
                                    className={`p-1 h-6 w-6 rounded-lg ${
                                      meal.isLogged 
                                        ? 'text-green-600 hover:bg-green-100' 
                                        : 'hover:bg-gray-200'
                                    }`}
                                  >
                                    {meal.isLogged ? (
                                      <Check className="w-3 h-3" />
                                    ) : (
                                      <Heart className="w-3 h-3" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* Daily Summary */}
          <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-r from-gray-50 to-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">Daily Total</h4>
                  <p className="text-sm text-gray-600">Planned nutrition for today</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-800">
                    {Object.values(mealPlan).flat().reduce((total, meal) => total + meal.calories, 0)}
                  </div>
                  <div className="text-xs text-gray-600">calories</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {Object.values(mealPlan).flat().reduce((total, meal) => total + meal.protein, 0)}g
                  </div>
                  <div className="text-xs text-gray-500">Protein</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {Object.values(mealPlan).flat().reduce((total, meal) => total + meal.carbs, 0)}g
                  </div>
                  <div className="text-xs text-gray-500">Carbs</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-yellow-600">
                    {Object.values(mealPlan).flat().reduce((total, meal) => total + meal.fat, 0)}g
                  </div>
                  <div className="text-xs text-gray-500">Fat</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}