import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { ThryvinLogo } from '@/components/ui/ThryvinLogo';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'scroll' | 'none';
  showLogo?: boolean;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: '🔥 Ready to Transform Your Life?',
    description: "Welcome to Thryvin'! Your AI-powered fitness companion is here to make you stronger, healthier, and more confident than ever before!",
    position: 'center',
    showLogo: true
  },
  {
    id: 'dashboard',
    title: '🏠 Your Fitness Command Center',
    description: "This is where the magic happens! Track your progress, celebrate wins, and get personalized recommendations from your AI coach. Every great journey starts here!",
    targetElement: '[data-tutorial="dashboard-tab"]',
    position: 'center'
  },
  {
    id: 'workouts',
    title: '💪 Unleash Your Potential',
    description: "Ready to crush your goals? Get AI-generated workouts tailored just for YOU. Whether you want to build muscle, burn fat, or get stronger - we've got you covered!",
    targetElement: '[data-tutorial="workouts-tab"]',
    position: 'center'
  },
  {
    id: 'achievements',
    title: '🏆 Celebrate Every Victory',
    description: "You deserve recognition! Unlock badges, complete challenges, and show the world what you're made of. Every workout is a win worth celebrating!",
    targetElement: '[data-tutorial="awards-tab"]',
    position: 'center'
  },
  {
    id: 'stats',
    title: '📈 Watch Yourself Level Up',
    description: "Numbers don't lie! Track every rep, every pound, every victory. See your transformation unfold with detailed progress charts and insights.",
    targetElement: '[data-tutorial="stats-tab"]',
    position: 'center'
  },
  {
    id: 'profile',
    title: '👤 Your Personal Space',
    description: "Make it yours! Customize your experience, update your goals, and track your journey. This is your story - make it legendary!",
    targetElement: '[data-tutorial="profile-tab"]',
    position: 'center'
  },
  {
    id: 'nutrition',
    title: '🍎 Fuel Your Success',
    description: "Food is fuel! Track your nutrition, get personalized meal plans, and learn how to eat for peak performance. Great abs are made in the kitchen!",
    targetElement: '[data-tutorial="nutrition-tab"]',
    position: 'center'
  },
  {
    id: 'social',
    title: '🤝 Join the Community',
    description: "You don't have to do this alone! Connect with other fitness enthusiasts, share your wins, and get inspired by amazing transformations!",
    targetElement: '[data-tutorial="social-tab"]',
    position: 'center'
  },
  {
    id: 'coach',
    title: '💬 Chat with Your AI Coach',
    description: "See this floating button? Your personal AI coach is always here to help! Get motivation, workout tips, or just chat about your fitness journey anytime!",
    targetElement: '[data-tutorial="coach-chat-button"]',
    position: 'center'
  },
  {
    id: 'complete',
    title: "🚀 You're Ready to Thrive!",
    description: "That's a wrap! Your AI coach is waiting to help you become the best version of yourself. Time to turn those dreams into reality!",
    position: 'center'
  }
];

interface AppTutorialProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function AppTutorial({ isOpen, onComplete, onSkip }: AppTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Remove previous highlights and blur
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
    document.querySelectorAll('.tutorial-blur').forEach(el => {
      el.classList.remove('tutorial-blur');
    });

    if (isOpen) {
      // Add blur only to the main content area inside the scroll container
      const mainContent = document.querySelector('[data-tutorial="dashboard"]');
      if (mainContent) {
        mainContent.classList.add('tutorial-blur');
      }

      if (tutorialSteps[currentStep]?.targetElement) {
        const element = document.querySelector(tutorialSteps[currentStep].targetElement!);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add highlight class to target element
          setTimeout(() => {
            element.classList.add('tutorial-highlight');
          }, 200);
        }
      }
    }

    // Cleanup on unmount
    return () => {
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
      });
      document.querySelectorAll('.tutorial-blur').forEach(el => {
        el.classList.remove('tutorial-blur');
      });
    };
  }, [currentStep, isOpen]);

  if (!isOpen) return null;

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 overflow-hidden"
            initial={{ scale: 0.7, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            {/* Gradient background accent */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600"></div>
            
            <div className="text-center">
              <div className="mb-6">
                {/* Logo for welcome step or icon for others */}
                {step.showLogo ? (
                  <div className="flex justify-center mb-4">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
                      className="relative"
                    >
                      <ThryvinLogo size="xl" animated={false} />
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-bounce">
                        ✨
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <ThryvinLogo size="lg" animated={false} />
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-bounce">
                        ✨
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Enhanced Title */}
                <motion.h3 
                  className="text-2xl font-bold mb-3 text-gradient-brand"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {step.title}
                </motion.h3>
                
                {/* Enhanced Description */}
                <motion.p 
                  className="text-gray-700 text-base leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {step.description}
                </motion.p>
              </div>

              {/* Enhanced Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-center space-x-2 mb-2">
                  {tutorialSteps.map((_, index) => (
                    <motion.div
                      key={index}
                      className={`h-2 rounded-full transition-all duration-500 ${
                        index === currentStep 
                          ? 'w-8 bg-gradient-to-r from-purple-500 to-pink-500' 
                          : index < currentStep
                            ? 'w-2 bg-gradient-to-r from-purple-400 to-pink-400'
                            : 'w-2 bg-gray-200'
                      }`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  Step {currentStep + 1} of {tutorialSteps.length}
                </p>
              </div>
              
              {/* Enhanced Buttons */}
              <div className="flex space-x-3">
                {!isFirstStep && (
                  <motion.button
                    onClick={handlePrev}
                    className="flex-1 px-6 py-3 text-gray-600 border-2 border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-sm font-semibold flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </motion.button>
                )}
                
                <motion.button
                  onClick={handleNext}
                  className={`${!isFirstStep ? 'flex-1' : 'w-full'} px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 text-sm font-semibold flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-[1.02]`}
                  whileHover={{ scale: 1.02 }}
                >
                  {isLastStep ? (
                    <>
                      <span className="mr-2">🚀</span>
                      Let's Go!
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </motion.button>
              </div>

              {/* Enhanced Skip button */}
              <motion.button
                onClick={onSkip}
                className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
              >
                Skip tutorial
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}