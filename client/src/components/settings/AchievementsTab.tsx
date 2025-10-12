import React, { useEffect, useState } from 'react';
import { useAchievements } from '@/hooks/useAchievements';
import { AchievementBadge } from '@/components/AchievementBadge';
import { AchievementNotification } from '@/components/AchievementNotification';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export default function AchievementsTab() {
  const { 
    achievements, 
    newAchievements, 
    isLoading, 
    markAchievementsAsViewed 
  } = useAchievements();
  
  const [showingAchievement, setShowingAchievement] = useState<typeof newAchievements[0] | null>(null);
  const [displayedIds, setDisplayedIds] = useState<number[]>([]);
  
  // Show achievements one by one with animations
  useEffect(() => {
    if (newAchievements.length > 0 && !showingAchievement) {
      // Find first achievement not already displayed
      const nextAchievement = newAchievements.find(
        ach => !displayedIds.includes(ach.id)
      );
      
      if (nextAchievement) {
        setShowingAchievement(nextAchievement);
        setDisplayedIds(prev => [...prev, nextAchievement.id]);
      } else if (displayedIds.length > 0) {
        // All achievements have been displayed, mark them as viewed in the backend
        markAchievementsAsViewed();
        setDisplayedIds([]);
      }
    }
  }, [newAchievements, showingAchievement, displayedIds, markAchievementsAsViewed]);
  
  // Group achievements by category
  const workoutAchievements = achievements.filter(a => a.achievement.category === 'workout');
  const minutesAchievements = achievements.filter(a => a.achievement.category === 'minutes');
  
  // All possible achievements for showing locked ones
  const allCategories = [...new Set(achievements.map(a => a.achievement.category))];
  
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Your Achievements</h2>
      
      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-4 w-20 mt-2" />
            </div>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="workout">Workout</TabsTrigger>
            <TabsTrigger value="minutes">Minutes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <motion.div 
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {achievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  name={achievement.achievement.name}
                  description={achievement.achievement.description}
                  badgeIcon={achievement.achievement.badgeIcon}
                  badgeColor={achievement.achievement.badgeColor}
                  size="md"
                  unlocked={true}
                />
              ))}
            </motion.div>
          </TabsContent>
          
          <TabsContent value="workout">
            <motion.div 
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {workoutAchievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  name={achievement.achievement.name}
                  description={achievement.achievement.description}
                  badgeIcon={achievement.achievement.badgeIcon}
                  badgeColor={achievement.achievement.badgeColor}
                  size="md"
                  unlocked={true}
                />
              ))}
            </motion.div>
          </TabsContent>
          
          <TabsContent value="minutes">
            <motion.div 
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {minutesAchievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  name={achievement.achievement.name}
                  description={achievement.achievement.description}
                  badgeIcon={achievement.achievement.badgeIcon}
                  badgeColor={achievement.achievement.badgeColor}
                  size="md"
                  unlocked={true}
                />
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>
      )}
      
      {/* Achievement notification */}
      {showingAchievement && (
        <AchievementNotification
          achievement={showingAchievement.achievement}
          onClose={() => setShowingAchievement(null)}
        />
      )}
    </div>
  );
}