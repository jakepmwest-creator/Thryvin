import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Trophy, Star, Target, Calendar, Flame, Award, Gift, Zap, Lock, Play, Clock, CheckCircle, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-v2';
import { useToast } from '@/hooks/use-toast';
import { useAchievements } from '@/hooks/useAchievements';
import { useQuests } from '@/hooks/useQuests';
import { Button } from '@/components/ui/button';
import { AchievementBadge } from '@/components/AchievementBadge';
import confetti from 'canvas-confetti';

interface CategoryFilter {
  id: string;
  label: string;
  color: string;
}

export default function AwardsPageSwipe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { achievements, markAchievementsAsViewed } = useAchievements();
  const { quests, stats, claimQuestReward, trackQuest, isClaimingReward } = useQuests();
  
  const [currentTab, setCurrentTab] = useState<'awards' | 'quests'>('awards');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [selectedQuest, setSelectedQuest] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const categoryFilters: CategoryFilter[] = [
    { id: 'All', label: 'All', color: 'from-purple-500 to-pink-500' },
    { id: 'Consistency', label: 'Consistency', color: 'from-blue-500 to-cyan-500' },
    { id: 'Strength', label: 'Strength', color: 'from-red-500 to-orange-500' },
    { id: 'Mobility', label: 'Mobility', color: 'from-green-500 to-emerald-500' },
    { id: 'Nutrition', label: 'Nutrition', color: 'from-yellow-500 to-orange-500' },
    { id: 'Challenges', label: 'Challenges', color: 'from-purple-500 to-indigo-500' },
  ];

  // XP Progress calculation
  const xpProgress = stats.xpPoints ? (stats.xpPoints % 100) / 100 * 100 : 0;

  // Filter achievements by selected category
  const filteredAchievements = selectedFilter === 'All' 
    ? achievements 
    : achievements.filter(achievement => achievement.achievement?.category === selectedFilter);

  // Group quests by type
  const dailyQuests = quests.filter(q => q.quest.type === 'daily');
  const weeklyQuests = quests.filter(q => q.quest.type === 'weekly');
  const monthlyQuests = quests.filter(q => q.quest.type === 'monthly');

  const handleTabSwipe = (info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      if (info.offset.x > 0 && currentTab === 'quests') {
        setCurrentTab('awards');
      } else if (info.offset.x < 0 && currentTab === 'awards') {
        setCurrentTab('quests');
      }
    }
  };

  const handleClaimReward = async (questId: number) => {
    try {
      await claimQuestReward(questId);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (error) {
      console.error('Failed to claim reward:', error);
    }
  };

  const handleTrackQuest = async (questId: number) => {
    try {
      await trackQuest(questId);
    } catch (error) {
      console.error('Failed to track quest:', error);
    }
  };

  const getCategoryGradient = (category: string) => {
    switch (category) {
      case 'fitness': return 'from-purple-500 to-purple-600';
      case 'nutrition': return 'from-green-500 to-green-600';
      case 'engagement': return 'from-blue-500 to-blue-600';
      case 'recovery': return 'from-cyan-500 to-cyan-600';
      default: return 'from-purple-500 to-pink-500';
    }
  };

  // Render Top Banner with Purple Gradient
  const renderTopBanner = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 shadow-xl text-white overflow-hidden relative"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Trophy className="mr-3 h-7 w-7 text-yellow-300" />
              Level {stats.level || 1}
            </h1>
            <p className="text-purple-100 text-sm font-medium">Keep going, you're doing great!</p>
          </div>
          <div className="text-right bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
            <div className="text-2xl font-bold text-white">{stats.xpPoints || 0}</div>
            <div className="text-purple-200 text-xs font-medium">XP Points</div>
          </div>
        </div>
        
        {/* XP Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
          <motion.div
            className="h-3 bg-white rounded-full shadow-lg"
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-xs text-purple-100 mt-1">
          <span>{stats.xpPoints || 0} XP</span>
          <span>Next: {stats.nextLevelXP || 100} XP</span>
        </div>
      </div>
    </motion.div>
  );

  // Render Segmented Control
  const renderSegmentedControl = () => (
    <div className="bg-gray-100 rounded-2xl p-2 mb-6 flex">
      {['awards', 'quests'].map((tab) => (
        <button
          key={tab}
          onClick={() => setCurrentTab(tab as 'awards' | 'quests')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
            currentTab === tab
              ? 'bg-white text-purple-600 shadow-md'
              : 'text-gray-600 hover:text-purple-600'
          }`}
        >
          {tab === 'awards' ? '🏆 Awards' : '🎯 Quests'}
        </button>
      ))}
    </div>
  );

  // Render Streaks Row (for Awards tab)
  const renderStreaksRow = () => (
    <div className="mb-6">
      <h3 className="font-bold text-gray-800 mb-3 text-lg">Your Streaks</h3>
      <div className="grid grid-cols-3 gap-3">
        {[
          { 
            title: 'Workout', 
            streak: stats.workoutStreak || 0, 
            icon: '💪', 
            color: 'from-purple-500 to-purple-600',
            lastDate: stats.lastWorkoutDate
          },
          { 
            title: 'Nutrition', 
            streak: stats.nutritionStreak || 0, 
            icon: '🥗', 
            color: 'from-green-500 to-green-600',
            lastDate: stats.lastNutritionLogDate
          },
          { 
            title: 'Recovery', 
            streak: stats.recoveryStreak || 0, 
            icon: '😴', 
            color: 'from-blue-500 to-blue-600',
            lastDate: stats.lastRecoveryDate
          }
        ].map((streak) => (
          <motion.div
            key={streak.title}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`bg-gradient-to-br ${streak.color} rounded-2xl p-4 text-white cursor-pointer shadow-lg`}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">{streak.icon}</div>
              <div className="text-2xl font-bold">{streak.streak}</div>
              <div className="text-xs opacity-90">{streak.title}</div>
              {streak.lastDate && (
                <div className="text-xs opacity-75 mt-1">
                  {new Date(streak.lastDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Render Badge Filters
  const renderBadgeFilters = () => (
    <div className="mb-6">
      <h3 className="font-bold text-gray-800 mb-3 text-lg">Filter Badges</h3>
      <div className="flex flex-wrap gap-2">
        {categoryFilters.map((filter) => (
          <motion.button
            key={filter.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedFilter(filter.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              selectedFilter === filter.id
                ? `bg-gradient-to-r ${filter.color} text-white shadow-lg`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </motion.button>
        ))}
      </div>
    </div>
  );

  // Render Recent Badges
  const renderRecentBadges = () => (
    <div className="mb-6">
      <h3 className="font-bold text-gray-800 mb-3 text-lg">Recent Badges</h3>
      <div className="grid grid-cols-2 gap-4">
        {filteredAchievements.slice(0, 6).map((achievement) => (
          <motion.div
            key={achievement.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedBadge(achievement)}
            className={`bg-white rounded-2xl p-4 shadow-lg border border-gray-100 cursor-pointer relative overflow-hidden ${
              achievement.unlockedAt ? 'opacity-100' : 'opacity-60 grayscale'
            }`}
          >
            {achievement.unlockedAt && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-pulse" />
            )}
            <div className="relative z-10">
              <AchievementBadge
                name={achievement.achievement.name}
                description={achievement.achievement.description}
                badgeIcon={achievement.achievement.badgeIcon}
                badgeColor={achievement.achievement.badgeColor}
                unlocked={!!achievement.unlockedAt}
                size="md"
              />
              {!achievement.unlockedAt && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Render Daily Quests Carousel - Enhanced and More Enticing
  const renderDailyQuests = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 text-xl flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          Daily Quests
        </h3>
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 rounded-full">
          <span className="text-purple-700 text-sm font-medium">Swipe →</span>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
        {dailyQuests.map((quest, index) => (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className={`min-w-[320px] bg-gradient-to-br ${getCategoryGradient(quest.quest.category)} rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden snap-center`}
          >
            {/* Floating particles effect */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/5 rounded-full blur-lg" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-2xl">{quest.quest.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xl">{quest.quest.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Zap className="w-4 h-4 text-yellow-300" />
                      <span className="text-yellow-300 font-bold text-sm">+{quest.quest.xpReward} XP</span>
                    </div>
                  </div>
                </div>
                {quest.completed && !quest.claimed && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
                  >
                    <Gift className="w-4 h-4 text-yellow-800" />
                  </motion.div>
                )}
              </div>
              
              <p className="text-white/90 text-sm mb-4 leading-relaxed">{quest.quest.description}</p>
              
              {/* Enhanced Progress Section */}
              <div className="mb-4">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="font-medium">Progress</span>
                  <span className="bg-white/20 px-2 py-1 rounded-full font-bold">
                    {quest.progress}/{quest.quest.target}
                  </span>
                </div>
                <div className="relative">
                  <div className="w-full bg-white/20 rounded-full h-3 backdrop-blur-sm">
                    <motion.div
                      className="bg-white h-3 rounded-full shadow-lg relative overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: `${(quest.progress / quest.quest.target) * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    >
                      {quest.progress > 0 && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                      )}
                    </motion.div>
                  </div>
                  <div className="text-xs text-white/80 mt-1">
                    {Math.round((quest.progress / quest.quest.target) * 100)}% Complete
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {quest.completed && !quest.claimed ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleClaimReward(quest.questId)}
                    disabled={isClaimingReward}
                    className="flex-1 bg-white text-purple-600 py-3 px-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Gift className="w-5 h-5" />
                    Claim Reward!
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTrackQuest(quest.questId)}
                    className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 text-white py-3 px-4 rounded-2xl font-semibold hover:bg-white/30 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Target className="w-4 h-4" />
                    Start Quest
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-2xl hover:bg-white/30 transition-all duration-200 flex items-center justify-center"
                >
                  <Play className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* Add Quest Teaser Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="min-w-[320px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl p-6 shadow-xl relative overflow-hidden snap-center border-2 border-dashed border-gray-300"
        >
          <div className="text-center h-full flex flex-col justify-center items-center">
            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-gray-500" />
            </div>
            <h4 className="font-bold text-lg text-gray-600 mb-2">More Quests Coming</h4>
            <p className="text-gray-500 text-sm text-center leading-relaxed">
              Complete your current quests to unlock exciting new challenges!
            </p>
            <div className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-full">
              <span className="text-white text-sm font-semibold">Coming Soon</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );

  // Render Weekly Quests Grid - Enhanced
  const renderWeeklyQuests = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 text-xl flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          Weekly Challenges
        </h3>
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 px-3 py-1 rounded-full">
          <span className="text-blue-700 text-sm font-medium">7 Days Left</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {weeklyQuests.map((quest, index) => (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.01, y: -2 }}
            className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 relative overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full -translate-y-12 translate-x-12 opacity-50" />
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">{quest.quest.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-gray-800 mb-1">{quest.quest.name}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{quest.quest.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full">
                    <span className="font-bold text-sm">+{quest.quest.xpReward} XP</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-medium">Weekly Quest</div>
                </div>
              </div>
              
              {/* Enhanced Progress Section */}
              <div className="mb-4">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="font-semibold text-gray-700">Progress</span>
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 px-2 py-1 rounded-lg font-bold text-gray-800">
                      {quest.progress}/{quest.quest.target}
                    </span>
                    <span className="text-purple-600 font-medium">
                      {Math.round((quest.progress / quest.quest.target) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                    <motion.div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full shadow-lg relative overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: `${(quest.progress / quest.quest.target) * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    >
                      {quest.progress > 0 && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-pulse" />
                      )}
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Action Section */}
              <div className="flex gap-3">
                {quest.completed && !quest.claimed ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleClaimReward(quest.questId)}
                    disabled={isClaimingReward}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Gift className="w-5 h-5" />
                    Claim Weekly Reward!
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <Zap className="w-4 h-4 text-yellow-300" />
                    </motion.div>
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleTrackQuest(quest.questId)}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Target className="w-4 h-4" />
                      Accept Challenge
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-14 h-12 bg-gray-100 border border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-200 transition-all duration-200 flex items-center justify-center"
                    >
                      <Clock className="w-5 h-5" />
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Render Monthly/Seasonal Challenges - Epic Quests
  const renderMonthlyChallenges = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 text-xl flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mr-3">
            <Star className="w-4 h-4 text-white" />
          </div>
          Epic Monthly Challenges
        </h3>
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 px-3 py-1 rounded-full">
          <span className="text-orange-700 text-sm font-medium">🔥 Legendary</span>
        </div>
      </div>
      
      {monthlyQuests.map((quest, index) => (
        <motion.div
          key={quest.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.2 }}
          whileHover={{ scale: 1.01, y: -4 }}
          className="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-3xl p-8 text-white shadow-2xl mb-6 relative overflow-hidden"
        >
          {/* Epic background effects */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 blur-xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400/20 rounded-full translate-y-16 -translate-x-16 blur-lg" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-xl">
                    <span className="text-3xl">{quest.quest.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-2xl mb-1">{quest.quest.name}</h4>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-300" />
                      <span className="text-yellow-300 font-semibold text-sm">Epic Quest</span>
                    </div>
                  </div>
                </div>
                <p className="text-white/90 text-base leading-relaxed mb-4">{quest.quest.description}</p>
              </div>
              
              <div className="text-center ml-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 border border-white/30">
                  <div className="text-2xl font-bold">{quest.quest.xpReward}</div>
                  <div className="text-xs opacity-90">XP + Badge</div>
                </div>
                <div className="text-xs mt-2 bg-red-500/80 px-2 py-1 rounded-full">
                  30 days left
                </div>
              </div>
            </div>
            
            {/* Epic Circular Progress */}
            <div className="flex items-center gap-6 mb-6">
              <div className="relative">
                <div className="w-20 h-20 relative">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                    <circle
                      cx="40"
                      cy="40"
                      r="35"
                      fill="none"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="6"
                    />
                    <motion.circle
                      cx="40"
                      cy="40"
                      r="35"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: quest.progress / quest.quest.target }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      style={{ 
                        pathLength: quest.progress / quest.quest.target,
                        filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.5))'
                      }}
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{stopColor:"#fbbf24", stopOpacity:1}} />
                        <stop offset="100%" style={{stopColor:"#ffffff", stopOpacity:1}} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold">{Math.round((quest.progress / quest.quest.target) * 100)}%</span>
                  </div>
                </div>
                {quest.progress > quest.quest.target * 0.5 && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"
                  >
                    <Flame className="w-3 h-3 text-yellow-800" />
                  </motion.div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Epic Progress</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full font-bold">
                    {quest.progress}/{quest.quest.target}
                  </span>
                </div>
                <div className="text-xs text-white/80 mb-3">
                  {quest.quest.target - quest.progress} more to unlock legendary rewards!
                </div>
                
                {/* Milestone indicators */}
                <div className="flex justify-between text-xs mb-4">
                  {[25, 50, 75, 100].map((milestone) => (
                    <div key={milestone} className="text-center">
                      <div className={`w-2 h-2 rounded-full mb-1 ${
                        (quest.progress / quest.quest.target) * 100 >= milestone 
                          ? 'bg-yellow-300' 
                          : 'bg-white/30'
                      }`} />
                      <span className="text-white/60">{milestone}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Epic Action Section */}
            <div className="flex gap-4">
              {quest.completed && !quest.claimed ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleClaimReward(quest.questId)}
                  disabled={isClaimingReward}
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-orange-900 py-4 px-6 rounded-2xl font-bold shadow-2xl hover:shadow-yellow-400/25 transition-all duration-200 flex items-center justify-center gap-3"
                >
                  <Trophy className="w-6 h-6" />
                  Claim Epic Reward!
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Star className="w-5 h-5" />
                  </motion.div>
                </motion.button>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTrackQuest(quest.questId)}
                    className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 text-white py-4 px-6 rounded-2xl font-bold hover:bg-white/30 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Target className="w-5 h-5" />
                    Accept Epic Challenge
                    <Zap className="w-4 h-4 text-yellow-300" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-16 h-16 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-2xl hover:bg-white/30 transition-all duration-200 flex items-center justify-center"
                  >
                    <RotateCcw className="w-6 h-6" />
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  // Render Awards Tab Content
  const renderAwardsTab = () => (
    <motion.div
      key="awards"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.2 }}
    >
      {renderStreaksRow()}
      {renderBadgeFilters()}
      {renderRecentBadges()}
    </motion.div>
  );

  // Render Quests Tab Content
  const renderQuestsTab = () => (
    <motion.div
      key="quests"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.2 }}
    >
      {renderDailyQuests()}
      {renderWeeklyQuests()}
      {renderMonthlyChallenges()}
    </motion.div>
  );

  return (
    <div className="flex-1 overflow-auto scrollbar-hide bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 space-y-6" ref={constraintsRef}>
        {/* Top Banner */}
        {renderTopBanner()}
        
        {/* Segmented Control */}
        {renderSegmentedControl()}
        
        {/* Swipeable Content */}
        <motion.div
          drag="x"
          dragConstraints={constraintsRef}
          dragElastic={0.1}
          onDragEnd={(_, info) => handleTabSwipe(info)}
          className="cursor-grab active:cursor-grabbing"
        >
          <AnimatePresence mode="wait">
            {currentTab === 'awards' ? renderAwardsTab() : renderQuestsTab()}
          </AnimatePresence>
        </motion.div>

        {/* Badge Modal */}
        <AnimatePresence>
          {selectedBadge && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedBadge(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <AchievementBadge
                    name={selectedBadge.achievement.name}
                    description={selectedBadge.achievement.description}
                    badgeIcon={selectedBadge.achievement.badgeIcon}
                    badgeColor={selectedBadge.achievement.badgeColor}
                    unlocked={!!selectedBadge.unlockedAt}
                    size="lg"
                  />
                  <h3 className="font-bold text-xl text-gray-800 mt-4">
                    {selectedBadge.achievement.name}
                  </h3>
                  <p className="text-gray-600 mt-2">{selectedBadge.achievement.description}</p>
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                      +{selectedBadge.achievement.xpReward} XP
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                      {selectedBadge.achievement.category}
                    </span>
                  </div>
                  {!selectedBadge.unlockedAt && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600">
                        Complete {selectedBadge.achievement.threshold} {selectedBadge.achievement.category.toLowerCase()} activities to unlock
                      </p>
                      <Button
                        className="w-full mt-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        onClick={() => {
                          // Track this badge
                          setSelectedBadge(null);
                          toast({
                            title: 'Badge Tracked',
                            description: 'Added to your Home Activity tracker',
                          });
                        }}
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Track This Badge
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}