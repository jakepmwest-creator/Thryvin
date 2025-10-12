import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Target, Clock, Play, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FitnessCategory {
  id: string;
  name: string;
  icon: any;
  emoji: string;
  color: string;
  description: string;
  benefits: string[];
  workoutTypes: string[];
  videoThumbnails: string[];
}

interface FitnessCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: FitnessCategory | null;
  onStartWorkout?: (categoryId: string) => void;
}

export const FitnessCategoryModal: React.FC<FitnessCategoryModalProps> = ({
  isOpen,
  onClose,
  category,
  onStartWorkout
}) => {
  if (!isOpen || !category) return null;

  const handleStartWorkout = () => {
    console.log('🔥 START CATEGORY WORKOUT CLICKED:', category.id);
    onStartWorkout?.(category.id);
    onClose();
  };

  const getVideoCount = (categoryId: string) => {
    const counts: { [key: string]: number } = {
      'strength': 45,
      'calisthenics': 55,
      'hiit': 47,
      'core': 31,
      'mobility': 28,
      'conditioning': 39
    };
    return counts[categoryId] || 35;
  };

  const getAvgDuration = (categoryId: string) => {
    const durations: { [key: string]: string } = {
      'strength': '35',
      'calisthenics': '30',
      'hiit': '20',
      'core': '25',
      'mobility': '20',
      'conditioning': '30'
    };
    return durations[categoryId] || '30';
  };

  const getKeyFeatures = (categoryId: string): string[] => {
    const features: { [key: string]: string[] } = {
      'strength': ['Progressive overload', 'Compound movements', 'Muscle building focus'],
      'calisthenics': ['No equipment needed', 'Functional strength', 'Progressive skills'],
      'hiit': ['Fat burning focus', 'Quick sessions', 'High intensity'],
      'core': ['Core strengthening', 'Posture improvement', 'Low-impact exercise'],
      'mobility': ['Flexibility improvement', 'Injury prevention', 'Movement quality'],
      'conditioning': ['Cardiovascular health', 'Endurance building', 'Athletic performance']
    };
    return features[categoryId] || [];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <div className="fixed inset-0 z-[110] grid place-items-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto pointer-events-auto scrollbar-hide"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="bg-white rounded-3xl shadow-2xl mx-4 my-8">
              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('🔥 FITNESS MODAL CLOSE CLICKED');
                  onClose();
                }}
                className="absolute right-6 top-6 z-10 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>

              {/* Header */}
              <div className="pb-6 border-b border-gray-100 px-8 pt-8">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{category.emoji}</div>
                  <div>
                    <h1 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold text-2xl">
                      {category.name} Training
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                      Explore this fitness category and get AI coaching
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-8 pt-6 px-8 pb-8">
                {/* Hero Description */}
                <div className="text-center bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl p-6">
                  <p className="text-gray-700 text-xl leading-relaxed font-medium">
                    {category.description}
                  </p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white text-center">
                    <div className="text-3xl font-bold mb-2">
                      {getVideoCount(category.id)}
                    </div>
                    <div className="text-purple-100 text-sm">Video Workouts</div>
                  </div>
                  <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 text-white text-center">
                    <div className="text-3xl font-bold mb-2">
                      {getAvgDuration(category.id)}
                    </div>
                    <div className="text-pink-100 text-sm">Avg Minutes</div>
                  </div>
                </div>

                {/* Key Benefits */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Key Benefits
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {category.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-3 bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full"></div>
                        <span className="text-gray-700 font-medium">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Features */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    Key Features
                  </h3>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
                    <div className="space-y-3">
                      {getKeyFeatures(category.id).map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Target className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-700 font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Workout Types */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-500" />
                    Popular Workouts
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {category.workoutTypes.map((workoutType, index) => (
                      <div key={index} className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                              <Play className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-medium text-gray-900">{workoutType}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{getAvgDuration(category.id)} min</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartWorkout();
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 rounded-2xl text-lg font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg"
                  >
                    <Sparkles className="w-5 h-5" />
                    Generate AI Workout
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('🔥 EXPLORE VIDEOS CLICKED:', category.id);
                      onClose();
                    }}
                    className="px-6 py-4 border-2 border-gray-200 hover:border-purple-300 text-gray-700 rounded-2xl font-semibold transition-all hover:bg-purple-50"
                  >
                    <BookOpen className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};