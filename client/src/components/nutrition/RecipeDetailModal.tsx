import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Clock, 
  Users, 
  ChefHat, 
  Play, 
  Heart, 
  Share, 
  BookOpen,
  Check,
  ShoppingCart,
  Star,
  Timer,
  Utensils
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
  category: string;
  optional?: boolean;
}

interface Instruction {
  step: number;
  title: string;
  description: string;
  time?: string;
  image?: string;
}

interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTime: string;
  cookTime: string;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  imageUrl?: string;
  eaten: boolean;
  description: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  videoUrl?: string;
  tips: string[];
  nutritionBenefits: string[];
}

interface RecipeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: Meal | null;
  mealType: string;
  onMarkEaten: (mealId: string, eaten: boolean) => void;
  onAddToShoppingList: (ingredients: Ingredient[]) => void;
  onSaveToFavorites: (meal: Meal) => void;
}

export default function RecipeDetailModal({
  isOpen,
  onClose,
  meal,
  mealType,
  onMarkEaten,
  onAddToShoppingList,
  onSaveToFavorites
}: RecipeDetailModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'recipe' | 'video' | 'nutrition'>('recipe');
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());

  if (!meal) return null;

  // Mock enhanced meal data for demonstration
  const enhancedMeal: Meal = {
    ...meal,
    description: "A delicious and nutritious meal that combines fresh ingredients with bold flavors. Perfect for maintaining your fitness goals while enjoying every bite.",
    ingredients: [
      { id: '1', name: 'Greek yogurt', amount: '1', unit: 'cup', category: 'dairy' },
      { id: '2', name: 'Mixed berries', amount: '1/2', unit: 'cup', category: 'fruit' },
      { id: '3', name: 'Granola', amount: '2', unit: 'tbsp', category: 'pantry' },
      { id: '4', name: 'Honey', amount: '1', unit: 'tsp', category: 'pantry', optional: true },
      { id: '5', name: 'Chia seeds', amount: '1', unit: 'tsp', category: 'pantry', optional: true },
      { id: '6', name: 'Almonds', amount: '1', unit: 'tbsp', category: 'pantry' }
    ],
    instructions: [
      {
        step: 1,
        title: 'Prepare the base',
        description: 'Add Greek yogurt to a bowl or glass. Make sure it\'s at room temperature for best texture.',
        time: '1 min'
      },
      {
        step: 2,
        title: 'Layer the berries',
        description: 'Wash and add mixed berries on top of the yogurt. Fresh or frozen berries work great.',
        time: '2 min'
      },
      {
        step: 3,
        title: 'Add toppings',
        description: 'Sprinkle granola, chia seeds, and chopped almonds. Drizzle with honey if desired.',
        time: '2 min'
      },
      {
        step: 4,
        title: 'Final touches',
        description: 'Add any additional toppings and serve immediately for best texture and flavor.',
        time: '1 min'
      }
    ],
    videoUrl: 'https://www.youtube.com/embed/UuGrBhK2c7U',
    tips: [
      'Use Greek yogurt for extra protein and creamy texture',
      'Try different berry combinations for variety',
      'Toast the granola lightly for extra crunch',
      'Prepare ingredients the night before for quick assembly'
    ],
    nutritionBenefits: [
      'High in protein for muscle recovery',
      'Rich in antioxidants from berries',
      'Probiotics support digestive health',
      'Healthy fats from nuts and seeds'
    ]
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const toggleIngredient = (ingredientId: string) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(ingredientId)) {
      newChecked.delete(ingredientId);
    } else {
      newChecked.add(ingredientId);
    }
    setCheckedIngredients(newChecked);
  };

  const handleMarkEaten = () => {
    onMarkEaten(enhancedMeal.id, !enhancedMeal.eaten);
    toast({
      title: enhancedMeal.eaten ? "Meal unmarked" : "Meal logged!",
      description: enhancedMeal.eaten ? "Removed from your daily log" : `${enhancedMeal.name} added to your daily log`
    });
  };

  const handleAddToShoppingList = () => {
    onAddToShoppingList(enhancedMeal.ingredients);
    toast({
      title: "Added to shopping list!",
      description: `${enhancedMeal.ingredients.length} ingredients added to your shopping list.`
    });
  };

  const handleSaveToFavorites = () => {
    onSaveToFavorites(enhancedMeal);
    toast({
      title: "Saved to favorites!",
      description: "This recipe has been added to your favorite meals."
    });
  };

  const totalTime = parseInt(enhancedMeal.prepTime) + parseInt(enhancedMeal.cookTime || '0');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide rounded-2xl p-0">
        <DialogHeader className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <DialogTitle className="text-2xl font-bold mb-2">
                {enhancedMeal.name}
              </DialogTitle>
              <p className="text-green-100 text-sm mb-3 line-clamp-2">
                {enhancedMeal.description}
              </p>
              
              <div className="flex items-center flex-wrap gap-3 text-sm">
                <div className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded-lg">
                  <Clock className="w-4 h-4" />
                  <span>{totalTime} min total</span>
                </div>
                <div className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded-lg">
                  <Users className="w-4 h-4" />
                  <span>{enhancedMeal.servings} serving{enhancedMeal.servings > 1 ? 's' : ''}</span>
                </div>
                <Badge className={`${getDifficultyColor(enhancedMeal.difficulty)} text-xs`}>
                  {enhancedMeal.difficulty}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 rounded-xl"
              >
                <Share className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-xl"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Nutrition Summary */}
          <div className="flex items-center justify-between mt-4 p-3 bg-white/10 rounded-xl">
            <div className="text-center">
              <div className="text-xl font-bold">{enhancedMeal.calories}</div>
              <div className="text-xs text-green-100">Calories</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{enhancedMeal.protein}g</div>
              <div className="text-xs text-green-100">Protein</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{enhancedMeal.carbs}g</div>
              <div className="text-xs text-green-100">Carbs</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{enhancedMeal.fat}g</div>
              <div className="text-xs text-green-100">Fat</div>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="px-6 pt-4">
          <div className="flex bg-gray-100 rounded-2xl p-1">
            {[
              { id: 'recipe', label: 'Recipe', icon: BookOpen },
              { id: 'video', label: 'Video', icon: Play },
              { id: 'nutrition', label: 'Nutrition', icon: ChefHat }
            ].map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={activeTab === id ? 'default' : 'ghost'}
                className={`flex-1 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === id
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab(id as any)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {activeTab === 'recipe' && (
            <div className="space-y-6">
              {/* Recipe Image */}
              <div className="relative">
                <img
                  src={enhancedMeal.imageUrl}
                  alt={enhancedMeal.name}
                  className="w-full h-64 object-cover rounded-2xl"
                />
                {enhancedMeal.eaten && (
                  <div className="absolute inset-0 bg-green-500/20 rounded-2xl flex items-center justify-center">
                    <div className="bg-green-500 text-white p-3 rounded-full">
                      <Check className="w-6 h-6" />
                    </div>
                  </div>
                )}
              </div>

              {/* Ingredients */}
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <ShoppingCart className="w-5 h-5 mr-2 text-green-500" />
                      Ingredients
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAddToShoppingList}
                      className="rounded-xl text-xs"
                    >
                      Add All to List
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {enhancedMeal.ingredients.map((ingredient) => (
                    <div
                      key={ingredient.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={checkedIngredients.has(ingredient.id)}
                          onCheckedChange={() => toggleIngredient(ingredient.id)}
                          className="rounded"
                        />
                        <span className={`${checkedIngredients.has(ingredient.id) ? 'line-through text-gray-500' : ''}`}>
                          <span className="font-medium">{ingredient.amount} {ingredient.unit}</span> {ingredient.name}
                        </span>
                      </div>
                      {ingredient.optional && (
                        <Badge variant="outline" className="text-xs">Optional</Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center">
                    <ChefHat className="w-5 h-5 mr-2 text-green-500" />
                    Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {enhancedMeal.instructions.map((instruction) => (
                    <div key={instruction.step} className="flex space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {instruction.step}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold">{instruction.title}</h4>
                          {instruction.time && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Timer className="w-3 h-3" />
                              <span>{instruction.time}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">{instruction.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
                    <Star className="w-4 h-4 mr-2" />
                    Pro Tips
                  </h4>
                  <div className="space-y-2">
                    {enhancedMeal.tips.map((tip, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-yellow-700">{tip}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="space-y-4">
              {/* Video Player */}
              <div className="aspect-video rounded-2xl overflow-hidden bg-gray-100">
                <iframe
                  src={enhancedMeal.videoUrl}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`${enhancedMeal.name} Recipe Video`}
                />
              </div>
              
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Video Guide: {enhancedMeal.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Follow along with this step-by-step video tutorial to create the perfect {enhancedMeal.name}.
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Play className="w-3 h-3" />
                      <span>HD Quality</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{totalTime} min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div className="space-y-4">
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Utensils className="w-5 h-5 mr-2 text-green-500" />
                    Nutrition Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {enhancedMeal.nutritionBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-600">{benefit}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Detailed Nutrition */}
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Detailed Nutrition Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Calories</span>
                        <span className="font-semibold">{enhancedMeal.calories}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Protein</span>
                        <span className="font-semibold">{enhancedMeal.protein}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Carbohydrates</span>
                        <span className="font-semibold">{enhancedMeal.carbs}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Fat</span>
                        <span className="font-semibold">{enhancedMeal.fat}g</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Fiber</span>
                        <span className="font-semibold">8g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Sugar</span>
                        <span className="font-semibold">12g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Sodium</span>
                        <span className="font-semibold">95mg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Calcium</span>
                        <span className="font-semibold">150mg</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-4 border-t">
            <Button
              onClick={handleMarkEaten}
              className={`flex-1 rounded-xl ${
                enhancedMeal.eaten
                  ? 'bg-green-500 text-white'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
              }`}
            >
              <Check className="w-4 h-4 mr-2" />
              {enhancedMeal.eaten ? 'Logged' : 'Mark as Eaten'}
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveToFavorites}
              className="flex-1 rounded-xl border-green-200 text-green-600 hover:bg-green-50"
            >
              <Heart className="w-4 h-4 mr-2" />
              Save to Favorites
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}