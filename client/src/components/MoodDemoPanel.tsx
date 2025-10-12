import React from 'react';
import { useCloudMood } from '../context/CloudMoodContext';
import { motion } from 'framer-motion';

export const MoodDemoPanel: React.FC = () => {
  const { 
    moodState, 
    workoutCompleted, 
    goalAchieved, 
    newRecord, 
    celebrate, 
    showError,
    userInteraction 
  } = useCloudMood();

  const demoButtons = [
    {
      label: "Workout Complete",
      action: () => workoutCompleted('high'),
      color: "bg-green-500 hover:bg-green-600",
      icon: "🏋️"
    },
    {
      label: "Goal Achieved",
      action: goalAchieved,
      color: "bg-yellow-500 hover:bg-yellow-600",
      icon: "🎯"
    },
    {
      label: "New Record",
      action: newRecord,
      color: "bg-orange-500 hover:bg-orange-600",
      icon: "🏆"
    },
    {
      label: "Celebrate",
      action: celebrate,
      color: "bg-purple-500 hover:bg-purple-600",
      icon: "🎉"
    },
    {
      label: "Error",
      action: showError,
      color: "bg-red-500 hover:bg-red-600",
      icon: "❌"
    },
    {
      label: "Interact",
      action: () => userInteraction('medium'),
      color: "bg-purple-500 hover:bg-purple-600",
      icon: "👋"
    }
  ];

  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-sm p-4 mb-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-lg font-semibold mb-3">Mr. Cloud Mood System</h3>
      
      {/* Current mood display */}
      <div className="bg-gray-50 rounded-xl p-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-600">Current Mood:</span>
            <span className="ml-2 font-medium capitalize">{moodState.currentMood}</span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Intensity:</span>
            <span className="ml-2 font-medium">{Math.round(moodState.intensity * 100)}%</span>
          </div>
        </div>
        
        {moodState.isTransitioning && (
          <div className="mt-2 text-xs text-purple-600">
            Transitioning...
          </div>
        )}
      </div>

      {/* Demo buttons */}
      <div className="grid grid-cols-2 gap-2">
        {demoButtons.map((button, index) => (
          <motion.button
            key={index}
            className={`${button.color} text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors`}
            onClick={button.action}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="mr-1">{button.icon}</span>
            {button.label}
          </motion.button>
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-500 text-center">
        Click buttons to see Mr. Cloud react with different moods!
      </div>
    </motion.div>
  );
};