import { useState, useCallback } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { 
  Heart, 
  X, 
  RotateCcw, 
  Sparkles,
  Clock,
  Users,
  ChefHat,
  Star,
  Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface MealCard {
  id: string;
  name: string;
  description: string;
  image: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  cookTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  servings: number;
  tags: string[];
  rating: number;
  cuisine: string;
}

interface TinderMealDiscoveryProps {
  onLikeMeal: (meal: MealCard) => void;
  onPassMeal: (meal: MealCard) => void;
}

// Sample meal data - in real app would come from API
const sampleMeals: MealCard[] = [
  {
    id: '1',
    name: 'Mediterranean Quinoa Power Bowl',
    description: 'Fresh and vibrant bowl packed with quinoa, roasted vegetables, chickpeas, and tahini dressing',
    image: '/api/placeholder/400/500',
    calories: 480,
    protein: 18,
    carbs: 65,
    fat: 12,
    cookTime: '25 min',
    difficulty: 'easy',
    servings: 2,
    tags: ['vegetarian', 'healthy', 'protein-rich'],
    rating: 4.8,
    cuisine: 'Mediterranean'
  },
  {
    id: '2',
    name: 'Honey Garlic Salmon',
    description: 'Perfectly glazed salmon with a sweet and savory honey garlic sauce, served with steamed broccoli',
    image: '/api/placeholder/400/500',
    calories: 520,
    protein: 35,
    carbs: 20,
    fat: 28,
    cookTime: '20 min',
    difficulty: 'medium',
    servings: 4,
    tags: ['high-protein', 'omega-3', 'gluten-free'],
    rating: 4.9,
    cuisine: 'Asian'
  },
  {
    id: '3',
    name: 'Avocado Toast Supreme',
    description: 'Artisanal sourdough topped with smashed avocado, poached egg, and everything bagel seasoning',
    image: '/api/placeholder/400/500',
    calories: 380,
    protein: 18,
    carbs: 30,
    fat: 22,
    cookTime: '10 min',
    difficulty: 'easy',
    servings: 1,
    tags: ['breakfast', 'healthy-fats', 'quick'],
    rating: 4.6,
    cuisine: 'Modern'
  },
  {
    id: '4',
    name: 'Thai Chicken Curry',
    description: 'Aromatic coconut curry with tender chicken, bell peppers, and fresh basil served over jasmine rice',
    image: '/api/placeholder/400/500',
    calories: 580,
    protein: 32,
    carbs: 45,
    fat: 25,
    cookTime: '35 min',
    difficulty: 'medium',
    servings: 4,
    tags: ['spicy', 'comfort-food', 'dairy-free'],
    rating: 4.7,
    cuisine: 'Thai'
  },
  {
    id: '5',
    name: 'Berry Protein Smoothie Bowl',
    description: 'Thick and creamy smoothie bowl topped with fresh berries, granola, and chia seeds',
    image: '/api/placeholder/400/500',
    calories: 320,
    protein: 25,
    carbs: 35,
    fat: 8,
    cookTime: '5 min',
    difficulty: 'easy',
    servings: 1,
    tags: ['post-workout', 'antioxidants', 'vegan'],
    rating: 4.5,
    cuisine: 'Modern'
  }
];

export default function TinderMealDiscovery({ onLikeMeal, onPassMeal }: TinderMealDiscoveryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedMeals, setLikedMeals] = useState<MealCard[]>([]);
  const [passedMeals, setPassedMeals] = useState<MealCard[]>([]);
  const { toast } = useToast();

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-20, 20]);
  const opacity = useTransform(x, [-200, -50, 0, 50, 200], [0, 1, 1, 1, 0]);

  const currentMeal = sampleMeals[currentIndex];
  const nextMeal = sampleMeals[currentIndex + 1];

  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const threshold = 150;
    
    if (info.offset.x > threshold) {
      // Swiped right - Like
      handleLike();
    } else if (info.offset.x < -threshold) {
      // Swiped left - Pass
      handlePass();
    } else {
      // Reset position
      x.set(0);
    }
  }, [currentIndex]);

  const handleLike = useCallback(() => {
    if (!currentMeal) return;
    
    setLikedMeals(prev => [...prev, currentMeal]);
    onLikeMeal(currentMeal);
    
    toast({
      title: "Added to Favorites! ❤️",
      description: `${currentMeal.name} has been saved to your favorites`,
    });
    
    nextCard();
  }, [currentMeal, onLikeMeal]);

  const handlePass = useCallback(() => {
    if (!currentMeal) return;
    
    setPassedMeals(prev => [...prev, currentMeal]);
    onPassMeal(currentMeal);
    
    nextCard();
  }, [currentMeal, onPassMeal]);

  const nextCard = useCallback(() => {
    if (currentIndex < sampleMeals.length - 1) {
      setCurrentIndex(prev => prev + 1);
      x.set(0);
    } else {
      // Reset to beginning or show completion message
      setCurrentIndex(0);
      x.set(0);
      toast({
        title: "Great job! 🎉",
        description: "You've discovered all available meals. The deck will reset!",
      });
    }
  }, [currentIndex, x]);

  const undoLast = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      // Remove from liked or passed meals
      setLikedMeals(prev => prev.slice(0, -1));
      setPassedMeals(prev => prev.slice(0, -1));
      x.set(0);
    }
  }, [currentIndex, x]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!currentMeal) {
    return (
      <div className="flex items-center justify-center h-96 text-center">
        <div>
          <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No more meals to discover!</h3>
          <p className="text-gray-600">Check back later for new meal suggestions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm mx-auto h-[600px]">
      {/* Next card (background) */}
      {nextMeal && (
        <motion.div
          className="absolute inset-0 bg-white rounded-3xl shadow-lg border border-gray-200"
          initial={{ scale: 0.95, opacity: 0.5 }}
          animate={{ scale: 0.95, opacity: 0.5 }}
        >
          <div className="relative h-full overflow-hidden rounded-3xl">
            <div className="h-2/3 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
              <ChefHat className="w-12 h-12 text-slate-400" />
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-800 mb-1">{nextMeal.name}</h3>
              <p className="text-sm text-gray-600">{nextMeal.cuisine} • {nextMeal.cookTime}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Current card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x, rotate, opacity }}
        whileDrag={{ scale: 1.05 }}
        className="absolute inset-0 bg-white rounded-3xl shadow-2xl border border-gray-200 cursor-grab active:cursor-grabbing z-10"
      >
        <div className="relative h-full overflow-hidden rounded-3xl">
          {/* Meal Image */}
          <div className="h-2/3 bg-gradient-to-br from-purple-200 via-pink-200 to-orange-200 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl">🍽️</div>
            </div>
            
            {/* Swipe indicators */}
            <motion.div
              className="absolute top-8 left-8 bg-red-500 text-white p-3 rounded-2xl font-bold text-xl transform -rotate-12"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: useTransform(x, [-100, -50, 0], [1, 0.5, 0]).get(),
                scale: useTransform(x, [-100, -50, 0], [1.2, 1, 0.8]).get()
              }}
            >
              PASS
            </motion.div>
            
            <motion.div
              className="absolute top-8 right-8 bg-green-500 text-white p-3 rounded-2xl font-bold text-xl transform rotate-12"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: useTransform(x, [0, 50, 100], [0, 0.5, 1]).get(),
                scale: useTransform(x, [0, 50, 100], [0.8, 1, 1.2]).get()
              }}
            >
              LIKE
            </motion.div>

            {/* Rating badge */}
            <div className="absolute top-4 left-4 bg-black/20 backdrop-blur-sm rounded-xl px-3 py-1">
              <div className="flex items-center gap-1 text-white">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-sm">{currentMeal.rating}</span>
              </div>
            </div>
          </div>

          {/* Meal Info */}
          <div className="h-1/3 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-gray-900 mb-1">{currentMeal.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{currentMeal.description}</p>
                </div>
                <Badge className={`ml-2 ${getDifficultyColor(currentMeal.difficulty)}`}>
                  {currentMeal.difficulty}
                </Badge>
              </div>

              {/* Nutrition & Stats */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Flame className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="font-bold text-orange-600">{currentMeal.calories}</span>
                  </div>
                  <span className="text-xs text-gray-500">calories</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="w-4 h-4 text-blue-500 mr-1" />
                    <span className="font-bold text-blue-600">{currentMeal.cookTime}</span>
                  </div>
                  <span className="text-xs text-gray-500">cook time</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="w-4 h-4 text-green-500 mr-1" />
                    <span className="font-bold text-green-600">{currentMeal.servings}</span>
                  </div>
                  <span className="text-xs text-gray-500">servings</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {currentMeal.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 flex items-center gap-6">
        <Button
          onClick={undoLast}
          disabled={currentIndex === 0}
          size="lg"
          variant="outline"
          className="rounded-full w-14 h-14 p-0 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
        >
          <RotateCcw className="w-5 h-5 text-gray-600" />
        </Button>
        
        <Button
          onClick={handlePass}
          size="lg"
          variant="outline"
          className="rounded-full w-16 h-16 p-0 border-2 border-red-300 hover:border-red-400 hover:bg-red-50 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <X className="w-7 h-7 text-red-500" />
        </Button>
        
        <Button
          onClick={handleLike}
          size="lg"
          className="rounded-full w-16 h-16 p-0 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl border-0"
        >
          <Heart className="w-7 h-7 text-white" />
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
        <span className="text-sm text-gray-500">
          {currentIndex + 1} of {sampleMeals.length}
        </span>
        <div className="flex gap-1">
          {sampleMeals.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index <= currentIndex ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}