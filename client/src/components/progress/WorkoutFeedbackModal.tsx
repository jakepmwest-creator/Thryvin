import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ThumbsUp, ThumbsDown, Target, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { progressTracker, WorkoutFeedback } from '@/utils/ProgressTracker';
import { streakManager } from '@/utils/StreakManager';
import { notificationManager } from '@/utils/NotificationManager';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

interface WorkoutFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutId: string;
  workoutName: string;
  exercises?: Array<{
    id: string;
    name: string;
    targetReps?: number;
    targetWeight?: number;
  }>;
}

export const WorkoutFeedbackModal: React.FC<WorkoutFeedbackModalProps> = ({
  isOpen,
  onClose,
  workoutId,
  workoutName,
  exercises = []
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'too-easy' | 'perfect' | 'too-hard' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const difficultyOptions = [
    {
      value: 'too-easy' as const,
      label: 'Too Easy',
      icon: '😴',
      description: 'I could do more reps/weight',
      color: 'bg-green-100 text-green-700 border-green-300'
    },
    {
      value: 'perfect' as const,
      label: 'Perfect',
      icon: '🎯',
      description: 'Just right, great challenge',
      color: 'bg-blue-100 text-blue-700 border-blue-300'
    },
    {
      value: 'too-hard' as const,
      label: 'Too Hard',
      icon: '😰',
      description: 'Need to reduce intensity',
      color: 'bg-red-100 text-red-700 border-red-300'
    }
  ];

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in this browser.",
        variant: "destructive"
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFeedback(prev => prev + ' ' + transcript);
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };

  const handleSubmit = async () => {
    if (!selectedDifficulty) {
      toast({
        title: "Select Difficulty",
        description: "Please rate how the workout felt.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Record workout feedback
      const workoutFeedback: WorkoutFeedback = {
        workoutId,
        difficulty: selectedDifficulty,
        feedback: feedback.trim(),
        timestamp: new Date().toISOString()
      };

      progressTracker.logWorkoutFeedback(workoutFeedback);
      const streakData = streakManager.recordWorkout();

      // Show celebration effects
      if (streakData.currentStreak > 1) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8b5cf6', '#ec4899', '#06b6d4']
        });
      }

      // Show streak notification if applicable
      if (streakData.currentStreak >= 3) {
        notificationManager.showStreakNotification(streakData.currentStreak);
      }

      // Check for achievements
      const achievements = progressTracker.checkAchievements();
      achievements.forEach(achievement => {
        notificationManager.showProgressAchievement(achievement);
      });

      toast({
        title: "Workout Logged! 🎉",
        description: `Great job! Your AI coach will adapt future workouts based on your feedback.`,
      });

      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to save workout feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAdaptationMessage = () => {
    if (!selectedDifficulty) return null;

    switch (selectedDifficulty) {
      case 'too-easy':
        return "📈 Next time: AI will increase reps/weight by 10-15%";
      case 'perfect':
        return "🎯 Next time: AI will apply progressive overload (+5%)";
      case 'too-hard':
        return "📉 Next time: AI will reduce intensity by 10-20%";
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">How was your workout?</h2>
                <p className="text-sm text-gray-600">{workoutName}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">How did it feel?</h3>
                <div className="grid gap-3">
                  {difficultyOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant="outline"
                      className={`p-4 h-auto flex items-center justify-start gap-3 ${
                        selectedDifficulty === option.value
                          ? option.color + ' border-2'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedDifficulty(option.value)}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <div className="text-left">
                        <div className="font-semibold">{option.label}</div>
                        <div className="text-xs text-gray-600">{option.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {selectedDifficulty && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-purple-50 rounded-lg p-3"
                >
                  <p className="text-sm text-purple-700 font-medium">
                    {getAdaptationMessage()}
                  </p>
                </motion.div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Additional feedback (optional)</h3>
                <div className="relative">
                  <Textarea
                    placeholder="Any specific comments about the exercises, form, or how you felt?"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="pr-12"
                    rows={3}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`absolute top-2 right-2 ${isListening ? 'text-red-500' : 'text-gray-400'}`}
                    onClick={handleVoiceInput}
                    disabled={isListening}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                </div>
                {isListening && (
                  <p className="text-xs text-red-500 mt-1">Listening... Speak now</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Skip
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  disabled={!selectedDifficulty || isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Complete Workout'}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};