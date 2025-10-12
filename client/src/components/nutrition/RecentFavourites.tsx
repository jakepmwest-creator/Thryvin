import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, X } from 'lucide-react';

interface FavouriteMeal {
  id: string;
  name: string;
  kcal: number;
  image?: string;
}

interface RecentFavouritesProps {
  favourites: FavouriteMeal[];
  onQuickAdd: (meal: FavouriteMeal) => void;
}

export default function RecentFavourites({ favourites, onQuickAdd }: RecentFavouritesProps) {
  const [showUndo, setShowUndo] = useState<string | null>(null);

  const handleQuickAdd = (meal: FavouriteMeal) => {
    onQuickAdd(meal);
    setShowUndo(meal.name);
    setTimeout(() => setShowUndo(null), 3000);
  };

  const handleUndo = () => {
    // Implement undo logic here
    setShowUndo(null);
  };

  if (favourites.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Recent favourites</h2>
      
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 pb-2">
          {favourites.map((favourite) => (
            <motion.div
              key={favourite.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0 cursor-pointer"
              onClick={() => handleQuickAdd(favourite)}
            >
              <div className="w-20 h-20 bg-slate-200 rounded-2xl flex items-center justify-center mb-2 overflow-hidden">
                {favourite.image ? (
                  <img 
                    src={favourite.image} 
                    alt={favourite.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Heart className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-slate-900 line-clamp-2 mb-1">
                  {favourite.name}
                </p>
                <p className="text-xs text-slate-500">{favourite.kcal} cal</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Undo snackbar */}
      {showUndo && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-50"
        >
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <span className="text-sm">Added {showUndo}</span>
            <button
              onClick={handleUndo}
              className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
            >
              Undo
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}