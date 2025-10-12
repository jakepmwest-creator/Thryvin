import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Search, 
  Filter, 
  Grid3X3, 
  List,
  Clock,
  Flame,
  Users,
  Star,
  Trash2,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import TinderMealDiscovery from './TinderMealDiscovery';
import { useToast } from '@/hooks/use-toast';

interface FavoriteMeal {
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
  addedDate: Date;
}

interface FavoritesContentProps {
  userId: number;
  sharedFavorites?: FavoriteMeal[];
  setSharedFavorites?: (favorites: FavoriteMeal[] | ((prev: FavoriteMeal[]) => FavoriteMeal[])) => void;
}

export default function FavoritesContent({ userId, sharedFavorites, setSharedFavorites }: FavoritesContentProps) {
  // Use shared favorites if provided, otherwise fall back to sample data
  const [favorites, setFavorites] = useState<FavoriteMeal[]>(() => {
    if (sharedFavorites) return sharedFavorites;
    
    return [
      {
        id: '1',
        name: 'Mediterranean Quinoa Power Bowl',
        description: 'Fresh and vibrant bowl packed with quinoa, roasted vegetables, chickpeas, and tahini dressing',
        image: '/api/placeholder/300/200',
        calories: 480,
        protein: 18,
        carbs: 65,
        fat: 12,
        cookTime: '25 min',
        difficulty: 'easy',
        servings: 2,
        tags: ['vegetarian', 'healthy', 'protein-rich'],
        rating: 4.8,
        cuisine: 'Mediterranean',
        addedDate: new Date(2024, 2, 15)
      },
      {
        id: '2',
        name: 'Honey Garlic Salmon',
        description: 'Perfectly glazed salmon with a sweet and savory honey garlic sauce',
        image: '/api/placeholder/300/200',
        calories: 520,
        protein: 35,
        carbs: 20,
        fat: 28,
        cookTime: '20 min',
        difficulty: 'medium',
        servings: 4,
        tags: ['high-protein', 'omega-3', 'gluten-free'],
        rating: 4.9,
        cuisine: 'Asian',
        addedDate: new Date(2024, 2, 12)
      },
      {
        id: '3',
        name: 'Berry Protein Smoothie Bowl',
        description: 'Thick and creamy smoothie bowl topped with fresh berries and granola',
        image: '/api/placeholder/300/200',
        calories: 320,
        protein: 25,
        carbs: 35,
        fat: 8,
        cookTime: '5 min',
        difficulty: 'easy',
        servings: 1,
        tags: ['post-workout', 'antioxidants', 'vegan'],
        rating: 4.5,
        cuisine: 'Modern',
        addedDate: new Date(2024, 2, 10)
      }
    ];
  });

  // Sync with shared favorites when they change
  useEffect(() => {
    if (sharedFavorites) {
      setFavorites(sharedFavorites);
    }
  }, [sharedFavorites]);

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showDiscovery, setShowDiscovery] = useState(false);
  const { toast } = useToast();

  const filteredFavorites = favorites.filter(meal =>
    meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meal.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleLikeMeal = (meal: any) => {
    const newFavorite: FavoriteMeal = {
      id: meal.id,
      name: meal.name,
      description: meal.description || 'Delicious meal',
      image: meal.image || '/api/placeholder/300/200',
      calories: meal.calories || 0,
      protein: meal.protein || 0,
      carbs: meal.carbs || 0,
      fat: meal.fat || 0,
      cookTime: meal.cookTime || '20 min',
      difficulty: meal.difficulty || 'medium',
      servings: meal.servings || 2,
      tags: meal.tags || ['healthy'],
      rating: meal.rating || 4.5,
      cuisine: meal.cuisine || 'Modern',
      addedDate: new Date()
    };
    
    // Use shared favorites if available
    if (setSharedFavorites) {
      setSharedFavorites(prev => {
        if (prev.some(fav => fav.id === meal.id)) {
          return prev;
        }
        const updated = [newFavorite, ...prev];
        // Save to localStorage
        try {
          localStorage.setItem(`favorites-${userId}`, JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save favorites:', e);
        }
        return updated;
      });
    } else {
      // Fallback to local state
      setFavorites(prev => {
        if (prev.some(fav => fav.id === meal.id)) {
          return prev;
        }
        return [newFavorite, ...prev];
      });
    }
  };

  const handlePassMeal = (meal: any) => {
    // Could implement "not interested" logic here
    console.log('Passed on meal:', meal.name);
  };

  const removeFavorite = (mealId: string) => {
    // Use shared favorites if available
    if (setSharedFavorites) {
      setSharedFavorites(prev => {
        const updated = prev.filter(meal => meal.id !== mealId);
        // Save to localStorage
        try {
          localStorage.setItem(`favorites-${userId}`, JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save favorites:', e);
        }
        return updated;
      });
    } else {
      // Fallback to local state
      setFavorites(prev => prev.filter(meal => meal.id !== mealId));
    }
    
    toast({
      title: "Removed from favorites",
      description: "Meal has been removed from your favorites list",
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (showDiscovery) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <Button
            onClick={() => setShowDiscovery(false)}
            variant="ghost"
            className="mb-4"
          >
            ← Back to Favorites
          </Button>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Discover New Meals</h2>
          <p className="text-gray-600">Swipe right to like, left to pass. Find your next favorite meal!</p>
        </div>

        {/* Tinder-style meal discovery */}
        <div className="flex justify-center pt-8 pb-20">
          <TinderMealDiscovery 
            onLikeMeal={handleLikeMeal}
            onPassMeal={handlePassMeal}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <Heart className="w-6 h-6 text-red-500" />
          Your Favorites
        </h2>
        <p className="text-gray-600">Your collection of loved meals</p>
      </div>

      {/* Discovery CTA */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Discover New Meals</h3>
              <p className="text-purple-100 mb-4">Swipe through meal suggestions and find your next favorite!</p>
              <Button
                onClick={() => setShowDiscovery(true)}
                variant="secondary"
                className="bg-white text-purple-600 hover:bg-purple-50"
              >
                Start Discovering 🔥
              </Button>
            </div>
            <div className="text-6xl opacity-20">🎴</div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search your favorites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl border-2 border-purple-200 focus:border-purple-400"
          />
        </div>
        <Button variant="outline" size="sm" className="rounded-xl">
          <Filter className="w-4 h-4" />
        </Button>
        <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden bg-white">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={`rounded-none ${viewMode === 'grid' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={`rounded-none ${viewMode === 'list' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Favorites Count */}
      <div className="text-sm text-gray-600">
        {filteredFavorites.length} favorite{filteredFavorites.length !== 1 ? 's' : ''} found
      </div>

      {/* Favorites Grid/List */}
      {filteredFavorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {searchQuery ? 'No matches found' : 'No favorites yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery ? 'Try a different search term' : 'Start discovering meals to build your favorites collection'}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setShowDiscovery(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Discover Meals
            </Button>
          )}
        </div>
      ) : (
        <div className={`${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' 
            : 'space-y-2'
        }`}>
          {filteredFavorites.map((meal, index) => (
            <motion.div
              key={meal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {viewMode === 'grid' ? (
                <Card className="group hover:shadow-lg transition-all duration-300 border-2 border-purple-100 hover:border-purple-300 rounded-2xl overflow-hidden">
                  <CardContent className="p-0">
                    {/* Image */}
                    <div className="h-48 bg-gradient-to-br from-purple-200 via-pink-200 to-orange-200 flex items-center justify-center relative">
                      <div className="text-4xl">🍽️</div>
                      
                      {/* Rating badge */}
                      <div className="absolute top-2 left-2 bg-black/20 backdrop-blur-sm rounded-lg px-2 py-1">
                        <div className="flex items-center gap-1 text-white text-xs">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="font-bold">{meal.rating}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-8 h-8 p-0 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFavorite(meal.id)}
                          className="w-8 h-8 p-0 bg-white/20 backdrop-blur-sm hover:bg-red-500 text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 mb-1">{meal.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{meal.description}</p>
                        </div>
                        <Badge className={`ml-2 ${getDifficultyColor(meal.difficulty)}`}>
                          {meal.difficulty}
                        </Badge>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          <span className="font-semibold">{meal.calories}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-500" />
                          <span className="font-semibold">{meal.cookTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-green-500" />
                          <span className="font-semibold">{meal.servings}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {meal.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Added date */}
                      <div className="text-xs text-gray-500">
                        Added {meal.addedDate.toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // Compact List View - No Images, Just Text
                <div className="group bg-white hover:bg-gray-50 border border-gray-200 hover:border-purple-300 rounded-xl p-3 transition-all duration-200 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-bold text-gray-600">{meal.rating}</span>
                      </div>
                      <h3 className="font-bold text-gray-900">{meal.name}</h3>
                      <Badge className={`${getDifficultyColor(meal.difficulty)} text-xs`}>
                        {meal.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        {meal.calories} cal
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-500" />
                        {meal.cookTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-green-500" />
                        {meal.servings} servings
                      </span>
                      <span className="text-gray-500">
                        Added {meal.addedDate.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 hover:bg-gray-200"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFavorite(meal.id)}
                      className="w-8 h-8 p-0 hover:bg-red-100 text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}