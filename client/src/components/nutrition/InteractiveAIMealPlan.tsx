import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, 
  Coffee, 
  Sun, 
  Moon, 
  Sparkles, 
  Mic, 
  Edit3, 
  Check, 
  RefreshCw,
  Clock,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface MealOption {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime: number;
  description: string;
}

interface MealSection {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  icon: any;
  color: string;
  options: MealOption[];
  selected?: MealOption;
  logged?: boolean;
  loggedMeal?: string;
  aiTip: string;
}

interface InteractiveAIMealPlanProps {
  userId: number;
  selectedDate: Date;
  nutritionProfile: any;
  onMealLog: (mealType: string, meal: string) => void;
}

export default function InteractiveAIMealPlan({
  userId,
  selectedDate,
  nutritionProfile,
  onMealLog
}: InteractiveAIMealPlanProps) {
  const [selectedMeals, setSelectedMeals] = useState<Record<string, MealOption>>({});
  const [loggedMeals, setLoggedMeals] = useState<Record<string, string>>({});
  const [editingMeal, setEditingMeal] = useState<string | null>(null);
  const [mealInput, setMealInput] = useState('');
  const [isListening, setIsListening] = useState<string | null>(null);

  // Mock AI-generated meal plan data
  const mealSections: MealSection[] = [
    {
      type: 'breakfast',
      icon: Coffee,
      color: 'from-orange-400 to-yellow-400',
      aiTip: "Start strong! Your morning workout needs quality fuel - prioritize protein.",
      options: [
        {
          name: "Greek Yogurt Power Bowl",
          calories: 380,
          protein: 25,
          carbs: 35,
          fat: 12,
          prepTime: 5,
          description: "Greek yogurt with berries, granola, and honey"
        },
        {
          name: "Protein Pancakes",
          calories: 420,
          protein: 28,
          carbs: 45,
          fat: 8,
          prepTime: 10,
          description: "Fluffy pancakes made with protein powder and banana"
        },
        {
          name: "Avocado Toast Plus",
          calories: 350,
          protein: 18,
          carbs: 32,
          fat: 18,
          prepTime: 8,
          description: "Whole grain toast with avocado, egg, and everything seasoning"
        }
      ]
    },
    {
      type: 'lunch',
      icon: Sun,
      color: 'from-blue-400 to-cyan-400',
      aiTip: "Mid-day fuel up! Balance your macros for sustained afternoon energy.",
      options: [
        {
          name: "Mediterranean Bowl",
          calories: 520,
          protein: 32,
          carbs: 48,
          fat: 22,
          prepTime: 15,
          description: "Quinoa bowl with grilled chicken, cucumber, feta, and tahini"
        },
        {
          name: "Power Salad Wrap",
          calories: 480,
          protein: 28,
          carbs: 42,
          fat: 20,
          prepTime: 10,
          description: "Turkey and hummus wrap with mixed greens and veggies"
        },
        {
          name: "Lean Protein Stir-fry",
          calories: 450,
          protein: 35,
          carbs: 38,
          fat: 15,
          prepTime: 20,
          description: "Chicken and vegetables with brown rice"
        }
      ]
    },
    {
      type: 'dinner',
      icon: Moon,
      color: 'from-purple-400 to-indigo-400',
      aiTip: "Based on your training, try a high-carb dinner tonight for recovery.",
      options: [
        {
          name: "Salmon & Sweet Potato",
          calories: 580,
          protein: 38,
          carbs: 45,
          fat: 25,
          prepTime: 25,
          description: "Baked salmon with roasted sweet potato and asparagus"
        },
        {
          name: "Lean Beef Bowl",
          calories: 620,
          protein: 42,
          carbs: 50,
          fat: 22,
          prepTime: 30,
          description: "Grass-fed beef with quinoa and roasted vegetables"
        },
        {
          name: "Plant-Based Power",
          calories: 500,
          protein: 24,
          carbs: 65,
          fat: 16,
          prepTime: 20,
          description: "Lentil curry with brown rice and steamed broccoli"
        }
      ]
    },
    {
      type: 'snack',
      icon: ChefHat,
      color: 'from-green-400 to-emerald-400',
      aiTip: "Smart snacking! Choose based on your next activity - training or rest.",
      options: [
        {
          name: "Pre-Workout Energy",
          calories: 180,
          protein: 8,
          carbs: 28,
          fat: 4,
          prepTime: 2,
          description: "Banana with almond butter and a drizzle of honey"
        },
        {
          name: "Post-Workout Recovery",
          calories: 220,
          protein: 25,
          carbs: 12,
          fat: 8,
          prepTime: 3,
          description: "Protein shake with berries and spinach"
        },
        {
          name: "Evening Treat",
          calories: 150,
          protein: 6,
          carbs: 18,
          fat: 6,
          prepTime: 5,
          description: "Greek yogurt with dark chocolate chips and nuts"
        }
      ]
    }
  ];

  const handleMealSelect = (mealType: string, option: MealOption) => {
    setSelectedMeals(prev => ({
      ...prev,
      [mealType]: option
    }));
  };

  const handleLogMeal = (mealType: string) => {
    if (mealInput.trim()) {
      setLoggedMeals(prev => ({
        ...prev,
        [mealType]: mealInput.trim()
      }));
      onMealLog(mealType, mealInput.trim());
      setMealInput('');
      setEditingMeal(null);
    }
  };

  const startVoiceInput = (mealType: string) => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      setIsListening(mealType);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMealInput(transcript);
        setIsListening(null);
      };
      
      recognition.onerror = () => {
        setIsListening(null);
      };
      
      recognition.onend = () => {
        setIsListening(null);
      };
      
      recognition.start();
    }
  };

  const getTotalNutrition = () => {
    const selected = Object.values(selectedMeals);
    return selected.reduce((total, meal) => ({
      calories: total.calories + meal.calories,
      protein: total.protein + meal.protein,
      carbs: total.carbs + meal.carbs,
      fat: total.fat + meal.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const totalNutrition = getTotalNutrition();

  return (
    <div className="space-y-6">
      {/* Daily Nutrition Summary */}
      <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-green-800">Today's Nutrition Plan</h3>
            <Badge className="bg-green-500 text-white">
              {totalNutrition.calories} / {nutritionProfile.calorieGoal} cal
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 bg-white rounded-xl">
              <p className="text-xs text-gray-500">Protein</p>
              <p className="font-semibold text-green-600">{totalNutrition.protein}g</p>
            </div>
            <div className="p-2 bg-white rounded-xl">
              <p className="text-xs text-gray-500">Carbs</p>
              <p className="font-semibold text-green-600">{totalNutrition.carbs}g</p>
            </div>
            <div className="p-2 bg-white rounded-xl">
              <p className="text-xs text-gray-500">Fat</p>
              <p className="font-semibold text-green-600">{totalNutrition.fat}g</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Meal Sections */}
      {mealSections.map((section) => {
        const IconComponent = section.icon;
        const isLogged = loggedMeals[section.type];
        const isEditing = editingMeal === section.type;
        
        return (
          <Card key={section.type} className="rounded-2xl border-0 shadow-sm overflow-hidden">
            <div className={`bg-gradient-to-r ${section.color} p-4 text-white`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <IconComponent className="w-5 h-5" />
                  <h3 className="font-semibold capitalize">{section.type}</h3>
                </div>
                {selectedMeals[section.type] && (
                  <Badge className="bg-white/20 text-white">
                    {selectedMeals[section.type].calories} cal
                  </Badge>
                )}
              </div>
              <p className="text-sm opacity-90 flex items-center">
                <Sparkles className="w-3 h-3 mr-1" />
                {section.aiTip}
              </p>
            </div>

            <CardContent className="p-4 space-y-4">
              {/* Meal Options */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Choose your {section.type}:</h4>
                {section.options.map((option, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedMeals[section.type]?.name === option.name
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 hover:border-green-200 hover:bg-green-25'
                    }`}
                    onClick={() => handleMealSelect(section.type, option)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{option.name}</h5>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{option.prepTime}min</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        P:{option.protein}g • C:{option.carbs}g • F:{option.fat}g
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {option.calories} cal
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Log What You Actually Ate */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-700 flex items-center">
                    <Edit3 className="w-4 h-4 mr-2 text-green-500" />
                    Log what you actually ate
                  </h4>
                  {isLogged && !isEditing && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingMeal(section.type)}
                      className="text-green-600 hover:bg-green-50"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                {isLogged && !isEditing ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-700">{isLogged}</span>
                    </div>
                    <Badge className="bg-green-500 text-white text-xs">Logged</Badge>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      placeholder={`What did you have for ${section.type}?`}
                      value={isEditing ? isLogged : mealInput}
                      onChange={(e) => setMealInput(e.target.value)}
                      className="rounded-xl resize-none"
                      rows={2}
                    />
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => startVoiceInput(section.type)}
                        disabled={isListening === section.type}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl"
                      >
                        {isListening === section.type ? (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <Mic className="w-3 h-3" />
                          </motion.div>
                        ) : (
                          <Mic className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleLogMeal(section.type)}
                        disabled={!mealInput.trim()}
                        className="bg-green-600 text-white rounded-xl"
                      >
                        {isEditing ? 'Update' : 'Log Meal'}
                      </Button>
                      {isEditing && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingMeal(null);
                            setMealInput('');
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}