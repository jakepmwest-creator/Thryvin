import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  BookOpen, 
  Lightbulb, 
  Award, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EducationalContent {
  id: string;
  title: string;
  type: 'video' | 'article' | 'tip' | 'challenge';
  category: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  content: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  tags: string[];
}

interface NutritionEducationalContentProps {
  selectedMealType?: string;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
}

export default function NutritionEducationalContent({
  selectedMealType,
  userLevel
}: NutritionEducationalContentProps) {
  const [expandedContent, setExpandedContent] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock educational content
  const educationalContent: EducationalContent[] = [
    {
      id: '1',
      title: 'Pre-Workout Nutrition: Fuel Your Performance',
      type: 'video',
      category: 'timing',
      duration: '8 min',
      difficulty: 'beginner',
      description: 'Learn what to eat before training for optimal energy and performance.',
      content: 'Discover the perfect pre-workout meals and timing strategies. We cover carbohydrate loading, protein timing, and hydration strategies that will transform your training sessions.',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnailUrl: '/api/placeholder/320/180',
      tags: ['pre-workout', 'timing', 'performance']
    },
    {
      id: '2',
      title: 'Post-Workout Recovery Nutrition',
      type: 'video',
      category: 'recovery',
      duration: '6 min',
      difficulty: 'beginner',
      description: 'Maximize your recovery with the right post-workout nutrition strategy.',
      content: 'The golden hour after training is crucial. Learn about the 3:1 carb to protein ratio, the anabolic window, and how to accelerate muscle recovery and growth.',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnailUrl: '/api/placeholder/320/180',
      tags: ['post-workout', 'recovery', 'muscle-building']
    },
    {
      id: '3',
      title: 'Smart Cheat Day Strategies',
      type: 'article',
      category: 'lifestyle',
      duration: '5 min read',
      difficulty: 'intermediate',
      description: 'How to enjoy your favorite foods without derailing your progress.',
      content: 'Cheat days don\'t have to ruin your progress. Learn strategic approaches to enjoying your favorite foods while maintaining your fitness goals. We cover refeed days, flexible dieting, and psychological strategies.',
      tags: ['cheat-meals', 'psychology', 'flexibility']
    },
    {
      id: '4',
      title: 'Hydration for Peak Performance',
      type: 'tip',
      category: 'basics',
      duration: '2 min',
      difficulty: 'beginner',
      description: 'The often overlooked key to better workouts and recovery.',
      content: 'Even 2% dehydration can reduce performance by 10-15%. Learn how much water you really need, electrolyte balance, and hydration timing around workouts.',
      tags: ['hydration', 'performance', 'basics']
    },
    {
      id: '5',
      title: '7-Day Macro Tracking Challenge',
      type: 'challenge',
      category: 'skills',
      duration: '7 days',
      difficulty: 'intermediate',
      description: 'Master the art of macro tracking with our guided challenge.',
      content: 'Join thousands who have transformed their nutrition awareness. This week-long challenge teaches you to accurately track macros, understand portion sizes, and develop intuitive eating skills.',
      tags: ['macros', 'tracking', 'challenge']
    },
    {
      id: '6',
      title: 'Meal Prep Like a Pro',
      type: 'video',
      category: 'preparation',
      duration: '12 min',
      difficulty: 'intermediate',
      description: 'Efficient meal prep strategies that save time and money.',
      content: 'Transform your kitchen into a meal prep powerhouse. Learn batch cooking techniques, proper food storage, and time-saving strategies that busy athletes swear by.',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnailUrl: '/api/placeholder/320/180',
      tags: ['meal-prep', 'efficiency', 'planning']
    }
  ];

  const categories = [
    { id: 'all', name: 'All Content', count: educationalContent.length },
    { id: 'timing', name: 'Nutrition Timing', count: educationalContent.filter(c => c.category === 'timing').length },
    { id: 'recovery', name: 'Recovery', count: educationalContent.filter(c => c.category === 'recovery').length },
    { id: 'lifestyle', name: 'Lifestyle', count: educationalContent.filter(c => c.category === 'lifestyle').length },
    { id: 'basics', name: 'Basics', count: educationalContent.filter(c => c.category === 'basics').length },
    { id: 'skills', name: 'Skills', count: educationalContent.filter(c => c.category === 'skills').length },
    { id: 'preparation', name: 'Meal Prep', count: educationalContent.filter(c => c.category === 'preparation').length }
  ];

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'article': return BookOpen;
      case 'tip': return Lightbulb;
      case 'challenge': return Award;
      default: return BookOpen;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'from-red-400 to-pink-400';
      case 'article': return 'from-blue-400 to-cyan-400';
      case 'tip': return 'from-yellow-400 to-orange-400';
      case 'challenge': return 'from-purple-400 to-indigo-400';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredContent = selectedCategory === 'all' 
    ? educationalContent 
    : educationalContent.filter(content => content.category === selectedCategory);

  const toggleExpand = (contentId: string) => {
    setExpandedContent(expandedContent === contentId ? null : contentId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-green-800">Nutrition Education</h2>
              <p className="text-sm text-green-600">Level up your nutrition knowledge</p>
            </div>
            <div className="text-right">
              <Badge className="bg-green-500 text-white mb-1">
                {userLevel.charAt(0).toUpperCase() + userLevel.slice(1)}
              </Badge>
              <p className="text-xs text-green-600">{filteredContent.length} resources</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            size="sm"
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(category.id)}
            className={`rounded-2xl whitespace-nowrap ${
              selectedCategory === category.id
                ? 'bg-green-500 text-white'
                : 'border-green-200 text-green-600 hover:bg-green-50'
            }`}
          >
            {category.name}
            <Badge variant="secondary" className="ml-2 text-xs">
              {category.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="space-y-4">
        {filteredContent.map((content) => {
          const IconComponent = getContentIcon(content.type);
          const isExpanded = expandedContent === content.id;
          
          return (
            <Card key={content.id} className="rounded-2xl border-0 shadow-sm overflow-hidden">
              <div className={`bg-gradient-to-r ${getTypeColor(content.type)} p-4 text-white`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{content.title}</h3>
                      <p className="text-sm opacity-90 mb-2">{content.description}</p>
                      <div className="flex items-center space-x-3 text-xs">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{content.duration}</span>
                        </div>
                        <Badge className={`${getDifficultyColor(content.difficulty)} text-xs`}>
                          {content.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleExpand(content.id)}
                    className="text-white hover:bg-white/20 rounded-xl"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent className="p-4 space-y-4">
                      {/* Video Embed */}
                      {content.type === 'video' && content.videoUrl && (
                        <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                          <iframe
                            src={content.videoUrl}
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}

                      {/* Content Description */}
                      <div>
                        <p className="text-gray-600 leading-relaxed">{content.content}</p>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {content.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs rounded-full">
                            #{tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-3 pt-2">
                        {content.type === 'video' && (
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Watch Video
                          </Button>
                        )}
                        {content.type === 'challenge' && (
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl"
                          >
                            <Award className="w-3 h-3 mr-1" />
                            Start Challenge
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Learn More
                        </Button>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>

      {/* Daily Tip */}
      <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">Daily Nutrition Tip</h3>
              <p className="text-sm text-yellow-700">
                Eat the rainbow! Different colored fruits and vegetables provide different antioxidants and nutrients. 
                Aim for at least 5 different colors in your daily meals for optimal health benefits.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}