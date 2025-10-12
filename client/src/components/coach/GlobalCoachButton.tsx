import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Undo2, Zap, Clock, Settings, ChevronRight } from 'lucide-react';

interface Action {
  id: string;
  type: 'workout_adjust' | 'exercise_swap' | 'nutrition_change' | 'general';
  description: string;
  timestamp: Date;
  canUndo: boolean;
  undoData?: any;
}

interface GlobalCoachButtonProps {
  onChatOpen: () => void;
  coachName: string;
  coachIcon: string;
  coachColorClass: string;
  currentContext?: 'workout' | 'nutrition' | 'home' | 'profile';
  recentActions?: Action[];
  onUndo?: (actionId: string) => void;
  onQuickAction?: (action: string) => void;
}

export default function GlobalCoachButton({
  onChatOpen,
  coachName,
  coachIcon,
  coachColorClass,
  currentContext = 'home',
  recentActions = [],
  onUndo,
  onQuickAction
}: GlobalCoachButtonProps) {
  const [showActions, setShowActions] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingDismissed, setGreetingDismissed] = useState(false);

  // Show greeting after 3 seconds if it hasn't been dismissed yet
  useEffect(() => {
    if (!greetingDismissed) {
      const timer = setTimeout(() => {
        setShowGreeting(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [greetingDismissed]);

  // Get contextual quick actions based on current screen
  const getQuickActions = () => {
    const baseActions = [
      { id: 'chat', label: 'Chat with Coach', icon: MessageCircle, color: 'bg-blue-500' },
    ];

    switch (currentContext) {
      case 'workout':
        return [
          ...baseActions,
          { id: 'adjust_time', label: 'Adjust Time', icon: Clock, color: 'bg-orange-500' },
          { id: 'modify_intensity', label: 'Change Intensity', icon: Zap, color: 'bg-yellow-500' },
          { id: 'swap_equipment', label: 'Change Equipment', icon: Settings, color: 'bg-purple-500' },
        ];
      case 'nutrition':
        return [
          ...baseActions,
          { id: 'suggest_meal', label: 'Meal Suggestion', icon: Zap, color: 'bg-green-500' },
          { id: 'track_calories', label: 'Quick Log', icon: Clock, color: 'bg-orange-500' },
        ];
      default:
        return [
          ...baseActions,
          { id: 'quick_workout', label: 'Quick Workout', icon: Zap, color: 'bg-red-500' },
          { id: 'daily_tip', label: 'Daily Tip', icon: Settings, color: 'bg-indigo-500' },
        ];
    }
  };

  const quickActions = getQuickActions();
  const undoableActions = recentActions.filter(action => action.canUndo).slice(0, 3);

  const handleMainButtonClick = () => {
    setShowGreeting(false);
    if (showActions) {
      setShowActions(false);
    } else {
      onChatOpen();
    }
  };

  const handleActionClick = (actionId: string) => {
    setShowActions(false);
    if (actionId === 'chat') {
      onChatOpen();
    } else {
      onQuickAction?.(actionId);
    }
  };

  const handleUndo = (actionId: string) => {
    setShowActions(false);
    onUndo?.(actionId);
  };

  const dismissGreeting = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowGreeting(false);
    setGreetingDismissed(true);
  };

  return (
    <div className="fixed bottom-28 right-6 z-50 flex flex-col items-end">
      {/* Action Menu */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 bg-white rounded-2xl shadow-2xl p-3 min-w-[240px]"
            style={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
          >
            {/* Quick Actions */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-3">
                Quick Actions
              </h3>
              {quickActions.map((action) => (
                <motion.button
                  key={action.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleActionClick(action.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  data-testid={`quick-action-${action.id}`}
                >
                  <div className="flex items-center">
                    <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center mr-3`}>
                      <action.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{action.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </motion.button>
              ))}
            </div>

            {/* Undo Actions */}
            {undoableActions.length > 0 && (
              <>
                <div className="border-t border-gray-100 my-3"></div>
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-3">
                    Recent Actions
                  </h3>
                  {undoableActions.map((action) => (
                    <motion.button
                      key={action.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleUndo(action.id)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-red-50 transition-colors group"
                      data-testid={`undo-action-${action.id}`}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                          <Undo2 className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="text-left">
                          <span className="text-sm font-medium text-gray-900 block">
                            Undo {action.description}
                          </span>
                          <span className="text-xs text-gray-500">
                            {action.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Greeting Bubble */}
      <AnimatePresence>
        {showGreeting && !showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="mb-3 p-4 rounded-xl shadow-lg max-w-xs bg-white relative"
          >
            <div className="absolute -bottom-2 right-8 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium">
                  Hi! Need help with your {currentContext === 'home' ? 'fitness journey' : currentContext} today?
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Chat with {coachName} for personalized guidance
                </p>
              </div>
              <button 
                onClick={dismissGreeting}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Coach Button */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
        className="relative"
        data-tutorial="global-coach-button"
      >
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleMainButtonClick}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowActions(!showActions);
          }}
          className="w-16 h-16 rounded-2xl shadow-xl flex items-center justify-center text-white relative bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300" 
          style={{ 
            boxShadow: "0 8px 25px rgba(139, 92, 246, 0.4), 0 4px 12px rgba(0, 0, 0, 0.1)" 
          }}
          data-testid="global-coach-button"
        >
          {/* Activity indicator */}
          {(recentActions.length > 0 || showActions) && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-white animate-pulse"></span>
          )}
          
          {/* Action count badge */}
          {undoableActions.length > 0 && (
            <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {undoableActions.length}
            </span>
          )}
          
          <div className="flex flex-col items-center">
            <MessageCircle className="w-6 h-6 mb-0.5" />
            <span className="text-xs font-medium opacity-90">Coach</span>
          </div>
        </motion.button>

        {/* Long press indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showActions ? 1 : 0 }}
          className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap"
        >
          Quick Actions
        </motion.div>
      </motion.div>
    </div>
  );
}