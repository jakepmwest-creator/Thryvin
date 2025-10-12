import React, { useState } from 'react';
import ProgressTab from './ProgressTab';
import WorkoutCustomizationTab from './WorkoutCustomizationTab';
// Using simple authentication (no complex provider needed)
import { TrendingUp, Dumbbell, Home, Award, PieChart, User } from 'lucide-react';
import AchievementsTab from '../settings/AchievementsTab';
import CoachHomeDashboard from './CoachHomeDashboard';
import NewHomeDashboard from './NewHomeDashboard';
import NewAIHomepage from './NewAIHomepage';
import { CoachInfo } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardTabProps {
  coachInfo?: CoachInfo;
  onNavigateToScreen?: (screen: string) => void;
  onStartWorkout?: () => void;
  onOpenProfile?: () => void;
}

type TabType = 'home' | 'workouts' | 'stats' | 'awards' | 'profile';

interface DashboardTabPropsExtended extends DashboardTabProps {
  user?: any; // Add user prop to pass down authentication
}

export default function DashboardTab({ coachInfo, onNavigateToScreen, onStartWorkout, onOpenProfile, user }: DashboardTabPropsExtended) {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Default coach info if not provided
  const defaultCoachInfo = {
    name: "Kai Rivers",
    role: "Yoga Instructor",
    icon: "fa-om",
    colorClass: "bg-teal-600"
  };

  // Use provided coach info or default
  const coach = coachInfo || defaultCoachInfo;

  // Get the active tab content
  const getTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <NewAIHomepage />;
      case 'workouts':
        return <WorkoutCustomizationTab />;
      case 'stats':
        return <ProgressTab />;
      case 'awards':
        return <AchievementsTab />;
      case 'profile':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md p-6">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-12 h-12 text-purple-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Profile</h2>
              <p className="text-gray-600 mb-4">View and edit your profile settings, preferences, and account information.</p>
              <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full">
                Edit Profile
              </button>
            </div>
          </div>
        );
      default:
        return <NewAIHomepage />;
    }
  };

  // Tab icon and label mapping
  const tabConfig = [
    { id: 'home', icon: <Home className="w-5 h-5" />, label: 'Today' },
    { id: 'workouts', icon: <Dumbbell className="w-5 h-5" />, label: 'Workouts' },
    { id: 'stats', icon: <PieChart className="w-5 h-5" />, label: 'Stats' },
    { id: 'awards', icon: <Award className="w-5 h-5" />, label: 'Awards' },
    { id: 'profile', icon: <User className="w-5 h-5" />, label: 'Profile' }
  ];

  // Animation variants
  const tabContentVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Main content area */}
      <div className="flex-1 overflow-hidden bg-white">
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            className="h-[calc(100vh-80px)] overflow-y-auto scrollbar-hide bg-white"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={tabContentVariants}
          >
            {getTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* iOS-style bottom navigation bar - fixed position */}
      <div className="fixed bottom-0 left-0 right-0 ios-bottom-nav z-20 bg-white/95 backdrop-blur-md">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            className={`ios-bottom-nav-item ${activeTab === tab.id ? 'ios-bottom-nav-item-active' : 'ios-bottom-nav-item-inactive'}`}
            onClick={() => setActiveTab(tab.id as TabType)}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeTab === tab.id ? 'bg-purple-50' : ''}`}>
              {tab.icon}
            </div>
            <span className="text-xs mt-1">{tab.label}</span>
          </button>
        ))}
      </div>

    </div>
  );
}