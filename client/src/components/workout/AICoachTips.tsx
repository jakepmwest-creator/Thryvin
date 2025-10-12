import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AICoachTipsProps {
  userProfile?: any;
  currentWorkout?: string;
  onDismiss?: () => void;
}

export const AICoachTips: React.FC<AICoachTipsProps> = ({
  userProfile,
  currentWorkout,
  onDismiss
}) => {
  const [currentTip, setCurrentTip] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  // Fallback tips based on workout type and user profile
  const getFallbackTips = () => {
    const tips = [
      "💪 Remember to breathe steadily during your lifts - exhale on exertion, inhale on release.",
      "🔥 Stay hydrated! Aim for small sips of water between sets to maintain performance.",
      "⚡ Focus on form over speed - proper technique prevents injuries and maximizes results.",
      "🎯 Listen to your body - if something feels wrong, stop and reassess your form.",
      "💡 Progressive overload is key - gradually increase weight, reps, or time each week.",
      "🧘‍♀️ Take 5-10 minutes to warm up properly - your muscles will thank you later.",
      "📱 Log your progress consistently - seeing improvement is incredibly motivating!",
      "🔄 Allow 48-72 hours between training the same muscle groups for optimal recovery.",
      "🍎 Post-workout nutrition matters - aim for protein within 30 minutes of finishing.",
      "😴 Quality sleep is when your muscles actually grow - aim for 7-9 hours nightly."
    ];

    if (currentWorkout) {
      if (currentWorkout.toLowerCase().includes('hiit')) {
        return [
          "🔥 HIIT tip: Push yourself during work intervals, but use rest periods to truly recover.",
          "⏱️ HIIT works best when you give 80-90% effort during active intervals.",
          "💨 Focus on quick, explosive movements during HIIT for maximum calorie burn."
        ];
      } else if (currentWorkout.toLowerCase().includes('strength')) {
        return [
          "💪 Strength tip: Control the negative (lowering) portion of each rep for better gains.",
          "🏋️ Rest 2-3 minutes between heavy sets to maintain strength output.",
          "📈 Track your weights - progressive overload is essential for strength gains."
        ];
      } else if (currentWorkout.toLowerCase().includes('cardio')) {
        return [
          "🫁 Cardio tip: Find a pace where you can still hold a conversation for sustainable endurance.",
          "❤️ Monitor your heart rate - aim for 65-75% of max HR for fat burning.",
          "🎵 Use music with 120-140 BPM to naturally match your cardio rhythm."
        ];
      }
    }

    return tips;
  };

  const generateAITip = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/coach-tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile,
          currentWorkout,
          context: 'workout_tip'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentTip(data.tip);
      } else {
        throw new Error('AI service unavailable');
      }
    } catch (error) {
      // Use fallback tips
      const fallbackTips = getFallbackTips();
      setCurrentTip(fallbackTips[tipIndex % fallbackTips.length]);
      setTipIndex(prev => prev + 1);
    }
    setIsLoading(false);
  };

  const getNewTip = () => {
    const fallbackTips = getFallbackTips();
    setCurrentTip(fallbackTips[tipIndex % fallbackTips.length]);
    setTipIndex(prev => prev + 1);
  };

  useEffect(() => {
    getNewTip();
  }, [currentWorkout]);

  if (!currentTip && !isLoading) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full"
      >
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 p-4">
          <div className="flex items-start gap-3">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            
            <div className="flex-1">
              <h4 className="font-semibold text-purple-900 mb-1">Coach Tip</h4>
              {isLoading ? (
                <div className="flex items-center gap-2 text-purple-700">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Getting personalized tip...</span>
                </div>
              ) : (
                <p className="text-purple-800 text-sm leading-relaxed">{currentTip}</p>
              )}
            </div>
            
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={getNewTip}
                className="h-8 w-8 p-0 text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                disabled={isLoading}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-8 w-8 p-0 text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};