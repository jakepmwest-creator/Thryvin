import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AchievementBadge } from './AchievementBadge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Achievement {
  id: number;
  name: string;
  description: string;
  category: string;
  badgeIcon: string;
  badgeColor: string;
  threshold: number;
}

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
}

export function AchievementNotification({ 
  achievement, 
  onClose 
}: AchievementNotificationProps) {
  useEffect(() => {
    // Trigger confetti when the achievement notification appears
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ type: 'spring', bounce: 0.4 }}
        className="fixed bottom-4 left-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700 max-w-md mx-auto"
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center">
          <div className="mr-4">
            <AchievementBadge
              name={achievement.name}
              description={achievement.description}
              badgeIcon={achievement.badgeIcon}
              badgeColor={achievement.badgeColor}
              animate={true}
              size="md"
            />
          </div>
          
          <div>
            <motion.h3 
              className="font-bold text-lg"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Achievement Unlocked!
            </motion.h3>
            
            <motion.h4 
              className="text-md font-medium"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {achievement.name}
            </motion.h4>
            
            <motion.p 
              className="text-sm text-gray-500 dark:text-gray-400 mt-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              {achievement.description}
            </motion.p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}