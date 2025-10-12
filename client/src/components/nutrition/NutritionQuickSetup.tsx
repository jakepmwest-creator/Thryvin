import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Apple, Utensils, Clock, ShieldCheck, Heart, Mic } from 'lucide-react';
import confetti from 'canvas-confetti';

interface NutritionData {
  goal: 'lose-fat' | 'build-muscle' | 'recomp' | 'eat-healthier' | null;
  restrictions: string[];
  restrictionsNotes: string;
  restrictionsList: string[];
  dislikes: string[];
  dislikesNotes: string;
  dislikesList: string[];
  pattern: 'none' | 'vegetarian' | 'vegan' | 'pescatarian' | 'halal' | 'kosher' | 'other' | null;
  patternNotes: string;
  cookTime: '5-10-min' | '15-25-min' | '30-45-min' | 'batch-cook' | null;
  batchCook: boolean;
}

interface NutritionQuickSetupProps {
  onComplete: (data: NutritionData) => void;
  onSkip: () => void;
}

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to Nutrition',
    subtitle: 'Let\'s create your personalized meal plan in just 5 quick questions',
    icon: Apple,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500'
  },
  {
    id: 'goal',
    title: 'What\'s your nutrition goal right now?',
    subtitle: 'This helps us tailor your meal recommendations',
    icon: Apple,
    color: 'bg-gradient-to-r from-green-500 to-emerald-500'
  },
  {
    id: 'restrictions',
    title: 'Any allergies or intolerances we should avoid?',
    subtitle: 'Your safety is our priority',
    icon: ShieldCheck,
    color: 'bg-gradient-to-r from-red-500 to-pink-500'
  },
  {
    id: 'dislikes',
    title: 'Any foods you dislike or never want in your plan?',
    subtitle: 'We\'ll keep these out of your recommendations',
    icon: Heart,
    color: 'bg-gradient-to-r from-orange-500 to-red-500'
  },
  {
    id: 'pattern',
    title: 'Do you follow a specific dietary pattern?',
    subtitle: 'We\'ll respect your dietary choices',
    icon: Utensils,
    color: 'bg-gradient-to-r from-blue-500 to-purple-500'
  },
  {
    id: 'cook-time',
    title: 'How much time do you usually want to spend cooking?',
    subtitle: 'You can always challenge yourself later',
    icon: Clock,
    color: 'bg-gradient-to-r from-teal-500 to-green-500'
  }
];

export const NutritionQuickSetup: React.FC<NutritionQuickSetupProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [data, setData] = useState<NutritionData>({
    goal: null,
    restrictions: [],
    restrictionsNotes: '',
    restrictionsList: [],
    dislikes: [],
    dislikesNotes: '',
    dislikesList: [],
    pattern: null,
    patternNotes: '',
    cookTime: null,
    batchCook: false
  });

  const progress = ((currentStep + 1) / steps.length) * 100;
  
  const validateStep = React.useCallback((): boolean => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return true; // Always valid
      case 'goal':
        return data.goal !== null;
      case 'restrictions':
        return true; // Always valid (can have no restrictions)
      case 'dislikes':
        return true; // Always valid (can have no dislikes)
      case 'pattern':
        return data.pattern !== null;
      case 'cook-time':
        return data.cookTime !== null;
      default:
        return false;
    }
  }, [currentStep, data]);

  const canContinue = React.useMemo(() => validateStep(), [validateStep]);

  const handleNext = React.useCallback(() => {
    if (!canContinue) return;

    if (currentStep === steps.length - 1) {
      // Complete setup
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      onComplete(data);
    } else {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    }
  }, [canContinue, currentStep, data, onComplete]);

  const handlePrevious = React.useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    } else {
      // Close the quiz modal
      onSkip();
    }
  }, [currentStep, onSkip]);

  // Enhanced smooth animation variants (matching onboarding)
  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.8
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.15 }
    }
  };

  // Enhanced reusable components with gradients
  const ChipButton: React.FC<{
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
  }> = ({ selected, onClick, children, className = "" }) => (
    <motion.button
      onClick={onClick}
      className={`px-4 py-3 rounded-full border-2 transition-all duration-300 text-sm font-medium ${
        selected
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent shadow-lg shadow-purple-500/25'
          : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 hover:shadow-md'
      } ${className}`}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );

  const MultiSelectChip: React.FC<{
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }> = ({ selected, onClick, children }) => (
    <motion.button
      onClick={onClick}
      className={`px-4 py-3 rounded-full border-2 transition-all duration-300 text-sm font-medium ${
        selected
          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/25'
          : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 hover:text-emerald-700 hover:shadow-md'
      }`}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );

  const VoiceInputField: React.FC<{
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    maxLength?: number;
  }> = ({ value, onChange, placeholder, maxLength }) => (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className="w-full p-4 pr-12 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
        autoFocus
      />
      <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-purple-500 transition-colors">
        <Mic className="w-5 h-5" />
      </button>
      {maxLength && (
        <div className="text-right text-xs text-gray-400 mt-1">
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );

  function renderStepContent() {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6 text-center"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  🍎 Let's build your perfect meal plan!
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  We'll ask you 5 quick questions about your nutrition goals, preferences, and cooking style. 
                  This takes less than 2 minutes and helps us create meals you'll actually love.
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4"
              >
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    Personalized for you
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    Quick & easy
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    5 questions only
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        );
      
      case 'goal':
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'lose-fat', label: 'Lose fat' },
                { value: 'build-muscle', label: 'Build muscle' },
                { value: 'recomp', label: 'Recomp (lean + strong)' },
                { value: 'eat-healthier', label: 'Eat healthier' }
              ].map((goal) => (
                <ChipButton
                  key={goal.value}
                  selected={data.goal === goal.value}
                  onClick={() => setData(prev => ({ ...prev, goal: goal.value as any }))}
                  className="justify-center"
                >
                  {goal.label}
                </ChipButton>
              ))}
            </div>
          </motion.div>
        );

      case 'restrictions':
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6"
          >
            {/* I have no allergies button */}
            <div className="flex justify-center">
              <ChipButton
                selected={data.restrictionsList.length === 0 && data.restrictionsNotes.trim() === ''}
                onClick={() => setData(prev => ({ 
                  ...prev, 
                  restrictions: [], 
                  restrictionsNotes: '', 
                  restrictionsList: [] 
                }))}
                className="px-8 bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300 text-green-700"
              >
                ✓ I have no allergies
              </ChipButton>
            </div>
            
            <div className="text-center text-sm text-gray-500">or</div>
            
            {/* Added allergies list */}
            {data.restrictionsList.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex flex-wrap gap-2 justify-center"
              >
                {data.restrictionsList.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {item}
                    <button
                      onClick={() => {
                        const newList = data.restrictionsList.filter((_, i) => i !== index);
                        setData(prev => ({ 
                          ...prev, 
                          restrictionsList: newList, 
                          restrictions: newList.length > 0 ? ['custom'] : [] 
                        }));
                      }}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
            
            {/* Text input for allergies */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600 text-center">Tell us about any allergies or intolerances:</p>
              <div className="flex gap-3 px-2">
                <input
                  type="text"
                  placeholder="e.g., Nut allergy, lactose intolerant..."
                  value={data.restrictionsNotes}
                  onChange={(e) => setData(prev => ({ ...prev, restrictionsNotes: e.target.value }))}
                  className="flex-1 p-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && data.restrictionsNotes.trim()) {
                      const newList = [...data.restrictionsList, data.restrictionsNotes.trim()];
                      setData(prev => ({ 
                        ...prev, 
                        restrictionsList: newList,
                        restrictions: ['custom'],
                        restrictionsNotes: ''
                      }));
                    }
                  }}
                />
                {data.restrictionsNotes.trim() && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => {
                      const newList = [...data.restrictionsList, data.restrictionsNotes.trim()];
                      setData(prev => ({ 
                        ...prev, 
                        restrictionsList: newList,
                        restrictions: ['custom'],
                        restrictionsNotes: ''
                      }));
                    }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 text-sm font-medium flex-shrink-0"
                  >
                    Add
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        );

      case 'dislikes':
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6"
          >
            {/* I'm not picky button */}
            <div className="flex justify-center">
              <ChipButton
                selected={data.dislikesList.length === 0 && data.dislikesNotes === ''}
                onClick={() => setData({ ...data, dislikes: [], dislikesNotes: '', dislikesList: [] })}
                className="px-8 bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300 text-green-700"
              >
                ✓ I'm not picky
              </ChipButton>
            </div>
            
            <div className="text-center text-sm text-gray-500">or</div>
            
            {/* Added dislikes list */}
            {data.dislikesList.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex flex-wrap gap-2 justify-center"
              >
                {data.dislikesList.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {item}
                    <button
                      onClick={() => {
                        const newList = data.dislikesList.filter((_, i) => i !== index);
                        setData({ ...data, dislikesList: newList, dislikes: newList.length > 0 ? ['custom'] : [] });
                      }}
                      className="text-orange-500 hover:text-orange-700 text-xs"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
            
            {/* Text input for dislikes */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600 text-center">Tell us what foods you'd prefer to avoid:</p>
              <div className="flex gap-3 px-2">
                <input
                  type="text"
                  placeholder="e.g., Mushrooms, cilantro, spicy food..."
                  value={data.dislikesNotes}
                  onChange={(e) => setData({ ...data, dislikesNotes: e.target.value })}
                  className="flex-1 p-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && data.dislikesNotes.trim()) {
                      const newList = [...data.dislikesList, data.dislikesNotes.trim()];
                      setData({ 
                        ...data, 
                        dislikesList: newList,
                        dislikes: ['custom'],
                        dislikesNotes: ''
                      });
                    }
                  }}
                />
                {data.dislikesNotes.trim() && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => {
                      const newList = [...data.dislikesList, data.dislikesNotes.trim()];
                      setData({ 
                        ...data, 
                        dislikesList: newList,
                        dislikes: ['custom'],
                        dislikesNotes: ''
                      });
                    }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 text-sm font-medium flex-shrink-0"
                  >
                    Add
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        );

      case 'pattern':
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'none', label: 'None' },
                { value: 'vegetarian', label: 'Vegetarian' },
                { value: 'vegan', label: 'Vegan' },
                { value: 'pescatarian', label: 'Pescatarian' },
                { value: 'halal', label: 'Halal' },
                { value: 'kosher', label: 'Kosher' },
                { value: 'other', label: 'Other' }
              ].map((pattern) => (
                <ChipButton
                  key={pattern.value}
                  selected={data.pattern === pattern.value}
                  onClick={() => setData({ ...data, pattern: pattern.value as any })}
                  className="justify-center"
                >
                  {pattern.label}
                </ChipButton>
              ))}
            </div>

            {data.pattern === 'other' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <VoiceInputField
                  value={data.patternNotes}
                  onChange={(value) => setData({ ...data, patternNotes: value })}
                  placeholder="Describe your dietary pattern..."
                  maxLength={50}
                />
              </motion.div>
            )}
          </motion.div>
        );

      case 'cook-time':
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: '5-10-min', label: '5–10 min (quick)' },
                { value: '15-25-min', label: '15–25 min (normal)' },
                { value: '30-45-min', label: '30–45 min (involved)' },
                { value: 'batch-cook', label: 'I batch cook' }
              ].map((time) => (
                <ChipButton
                  key={time.value}
                  selected={data.cookTime === time.value}
                  onClick={() => setData({ 
                    ...data, 
                    cookTime: time.value as any,
                    batchCook: time.value === 'batch-cook'
                  })}
                  className="justify-center"
                >
                  {time.label}
                </ChipButton>
              ))}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  }

  return (
    <>
      {/* Modal Backdrop */}
      <motion.div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" 
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 rounded-3xl shadow-2xl overflow-hidden"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Progress Bar - Fixed at top */}
          <div className="p-6 bg-white/80 backdrop-blur-sm flex-shrink-0">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Step Content - Smooth animations */}
          <div className="flex-1 flex flex-col min-h-0">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="flex flex-col flex-1 min-h-0 bg-white"
              >
                {/* Header */}
                <div className={`${steps[currentStep].color} p-6 text-white text-center flex-shrink-0`}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-3"
                  >
                    {React.createElement(steps[currentStep].icon, { className: "w-6 h-6" })}
                  </motion.div>
                  <h2 className="text-lg font-bold mb-2">{steps[currentStep].title}</h2>
                  <p className="text-white/90 text-sm">{steps[currentStep].subtitle}</p>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 overflow-y-auto scrollbar-hide">
                  {renderStepContent()}
                </div>

                {/* Navigation */}
                <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
                  <motion.button
                    onClick={handlePrevious}
                    className="flex items-center px-4 py-2 rounded-xl font-medium text-gray-600 hover:text-gray-800 hover:bg-white transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    {currentStep === 0 ? 'Close' : 'Back'}
                  </motion.button>

                  <motion.button
                    onClick={handleNext}
                    disabled={!canContinue}
                    className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      canContinue
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    whileHover={canContinue ? { scale: 1.02 } : {}}
                    whileTap={canContinue ? { scale: 0.98 } : {}}
                  >
                    {currentStep === steps.length - 1 ? 'Complete' : 'Continue'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </>
  );
};