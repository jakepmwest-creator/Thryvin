import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import DashboardTab from "./dashboard/DashboardTab";
import { WorkoutPageNew } from "./workout/WorkoutPageNew";
import StatsTab from "./dashboard/StatsTab";
import BasicProfile from "./profile/BasicProfile";
import AchievementsTab from "./settings/AchievementsTab";
import EnhancedNutritionTab from "./nutrition/EnhancedNutritionTab";
import SocialTab from "./social/SocialTab";
import AwardsPageComponent from "./awards/AwardsPageSwipe";
import { AppTutorial } from "./AppTutorial";

import GlobalCoachButton from "./coach/GlobalCoachButton";
import { useGlobalCoach } from "@/hooks/useGlobalCoach";
import ChatModal from "./chat/ChatModal";
import { WorkoutSelector } from "./WorkoutSelector";
import { WorkoutSession } from "./WorkoutSession";
import { UserProfile } from "./UserProfile";
import { AIWorkoutGenerator } from "./AIWorkoutGenerator";
// Using direct fetch-based authentication (working approach)
import { queryClient } from "@/lib/queryClient";
import { ThryvinLogo } from "./ui/ThryvinLogo";


// Define all the coaches with their specific IDs
type CoachType = 
  // Strength Training Specialists
  | "max-stone" | "alexis-steel" 
  // Cardio and Endurance Specialists
  | "ethan-dash" | "zoey-blaze" 
  // Yoga and Flexibility Specialists
  | "kai-rivers" | "lila-sage" 
  // Calisthenics and Bodyweight Specialists
  | "leo-cruz" | "maya-flex" 
  // Nutrition and Wellness Specialists
  | "nate-green" | "sophie-gold" 
  // General Fitness and Motivation Specialists
  | "dylan-power" | "ava-blaze" 
  // Running & Triathlon Specialists
  | "ryder-swift" | "chloe-fleet";

// Simplified content placeholders for now
const ChatPlaceholder = () => (
  <div className="flex flex-col h-full p-4">
    <div className="flex-1 overflow-y-auto scrollbar-hide mb-4 space-y-4">
      <div className="flex items-start">
        <div className="w-8 h-8 bg-coach-kai rounded-full flex items-center justify-center text-white text-xs mr-2">
          <i className="fas fa-running"></i>
        </div>
        <div className="message-bubble bg-gray-100 p-3 rounded-lg rounded-tl-none max-w-[80%]">
          <p>Hi there! I'm Kai, your calisthenics coach. Ready to start your bodyweight fitness journey?</p>
        </div>
      </div>
      
      <div className="flex items-start justify-end">
        <div className="message-bubble bg-primary text-white p-3 rounded-lg rounded-tr-none">
          <p>Yes! I'm excited to get started.</p>
        </div>
      </div>
      
      <div className="flex items-start">
        <div className="w-8 h-8 bg-coach-kai rounded-full flex items-center justify-center text-white text-xs mr-2">
          <i className="fas fa-running"></i>
        </div>
        <div className="message-bubble bg-gray-100 p-3 rounded-lg rounded-tl-none max-w-[80%]">
          <p>Excellent! I've prepared some beginner-friendly workouts that will help you build strength progressively. What's your experience level with push-ups?</p>
        </div>
      </div>
    </div>
    
    <div className="relative">
      <input 
        type="text" 
        placeholder="Type your message..."
        className="w-full bg-white shadow rounded-full px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <button className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center text-primary">
        <i className="fas fa-paper-plane"></i>
      </button>
    </div>
  </div>
);

type CoachInfo = {
  name: string;
  role: string;
  icon: string;
  colorClass: string;
};

const COACHES: Record<string, CoachInfo> = {
  // Strength Training Specialists
  "max-stone": {
    name: "Max Stone",
    role: "Strength Training Specialist",
    icon: "fa-dumbbell",
    colorClass: "bg-purple-600",
  },
  "alexis-steel": {
    name: "Alexis Steel",
    role: "Strength Training Specialist",
    icon: "fa-dumbbell",
    colorClass: "bg-purple-600",
  },
  // Cardio and Endurance Specialists
  "ethan-dash": {
    name: "Ethan Dash",
    role: "Cardio Specialist",
    icon: "fa-heartbeat",
    colorClass: "bg-red-600",
  },
  "zoey-blaze": {
    name: "Zoey Blaze",
    role: "HIIT Specialist",
    icon: "fa-bolt",
    colorClass: "bg-orange-600",
  },
  // Yoga and Flexibility Specialists
  "kai-rivers": {
    name: "Kai Rivers",
    role: "Yoga Instructor",
    icon: "fa-om",
    colorClass: "bg-teal-600",
  },

  "lila-sage": {
    name: "Lila Sage",
    role: "Flexibility Coach",
    icon: "fa-wind",
    colorClass: "bg-green-600",
  },
  // Calisthenics and Bodyweight Specialists
  "leo-cruz": {
    name: "Leo Cruz",
    role: "Calisthenics Coach",
    icon: "fa-running",
    colorClass: "bg-purple-500",
  },
  "maya-flex": {
    name: "Maya Flex",
    role: "Bodyweight Specialist",
    icon: "fa-child",
    colorClass: "bg-pink-500",
  },
  // Nutrition and Wellness Specialists
  "nate-green": {
    name: "Nate Green",
    role: "Nutrition Coach",
    icon: "fa-leaf",
    colorClass: "bg-green-500",
  },
  "sophie-gold": {
    name: "Sophie Gold",
    role: "Wellness Specialist",
    icon: "fa-spa",
    colorClass: "bg-yellow-500",
  },
  // General Fitness and Motivation Specialists
  "dylan-power": {
    name: "Dylan Power",
    role: "General Fitness Coach",
    icon: "fa-fire",
    colorClass: "bg-gray-700",
  },
  "ava-blaze": {
    name: "Ava Blaze",
    role: "Motivational Coach",
    icon: "fa-medal",
    colorClass: "bg-red-500",
  },
  // Running & Triathlon Specialists
  "ryder-swift": {
    name: "Ryder Swift",
    role: "Running Coach",
    icon: "fa-running",
    colorClass: "bg-purple-500",
  },
  "chloe-fleet": {
    name: "Chloe Fleet",
    role: "Triathlon Coach",
    icon: "fa-swimmer",
    colorClass: "bg-indigo-600",
  },
  // Keep legacy keys for backward compatibility
  kai: {
    name: "Kai Rivers",
    role: "Yoga Instructor",
    icon: "fa-om",
    colorClass: "bg-teal-600",
  },
};

type Tab = "dashboard" | "awards" | "settings" | "nutrition" | "social" | "workouts" | "stats" | "profile";
type AppView = "main" | "workout-selector" | "workout-session" | "user-profile" | "ai-workout-generator";

interface MainAppProps {
  selectedCoach?: CoachType | string;  // Allow string for legacy support
  onNavigateToScreen?: (screen: string) => void; // Add navigation function
}

export default function MainApp({ selectedCoach, onNavigateToScreen }: MainAppProps) {
  // Simple working authentication state
  const [user, setUser] = useState<any | null>(null);
  
  // Check auth status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.log('Not logged in');
      }
    };
    checkAuthStatus();
  }, []);
  
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      // Redirect to home
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  const [location] = useLocation();
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<string>("");
  const [isNutritionModalOpen, setIsNutritionModalOpen] = useState(false);
  
  // Global Coach functionality
  const globalCoach = useGlobalCoach();
  const [currentView, setCurrentView] = useState<AppView>("main");
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<string>("");
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);

  // Set active tab based on current URL
  const getActiveTabFromLocation = (): Tab => {
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'nutrition') return 'nutrition';
    if (tabParam === 'workouts') return 'workouts';
    if (tabParam === 'social') return 'social';
    if (tabParam === 'stats') return 'stats';
    if (tabParam === 'awards') return 'awards';
    if (tabParam === 'profile') return 'profile';
    
    // Fallback to route-based detection
    if (location.startsWith('/workouts')) return 'workouts';
    if (location.startsWith('/nutrition')) return 'nutrition';
    if (location.startsWith('/social')) return 'social';
    if (location.startsWith('/coach')) return 'dashboard';
    if (location.startsWith('/recovery')) return 'dashboard';
    if (location.startsWith('/stats')) return 'stats';
    if (location.startsWith('/awards')) return 'awards';
    if (location.startsWith('/profile')) return 'profile';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<Tab>(getActiveTabFromLocation());

  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(getActiveTabFromLocation());
  }, [location]);
  
  // Force refresh user data to get updated coach
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
  }, []);
  
  // Get coach info based on user's selected coach, prop, or default to max-stone
  const actualCoach = user?.selectedCoach || selectedCoach || 'max-stone';
  const coachInfo = COACHES[actualCoach] || COACHES['max-stone'];

  // Check if user just completed onboarding and should see tutorial
  useEffect(() => {
    const checkTutorial = () => {
      const hasSeenTutorial = localStorage.getItem('thryvin-tutorial-completed');
      const justCompletedOnboarding = localStorage.getItem('thryvin-onboarding-just-completed');
      
      console.log('Tutorial check:', { hasSeenTutorial, justCompletedOnboarding });
      
      // If user just completed onboarding, ALWAYS show tutorial
      if (justCompletedOnboarding === 'true') {
        console.log('NEW USER: Showing tutorial prompt for new user!');
        // Clear any previous tutorial completion for new users
        localStorage.removeItem('thryvin-tutorial-completed');
        // Show tutorial prompt immediately
        setShowTutorialPrompt(true);
        // Clear the onboarding flag so tutorial won't show on future logins
        localStorage.removeItem('thryvin-onboarding-just-completed');
      }
    };

    // Check immediately
    checkTutorial();

    // Also check after a delay in case flag was set after component mount
    const delayedCheck = setTimeout(checkTutorial, 500);
    return () => clearTimeout(delayedCheck);
  }, [user]); // Re-run when user changes

  const handleTutorialComplete = () => {
    localStorage.setItem('thryvin-tutorial-completed', 'true');
    setShowTutorial(false);
  };

  const handleTutorialSkip = () => {
    localStorage.setItem('thryvin-tutorial-completed', 'true');
    setShowTutorial(false);
    setShowTutorialPrompt(false);
  };

  const handleStartTutorial = () => {
    setShowTutorialPrompt(false);
    setShowTutorial(true);
  };

  // Handle view navigation
  const handleStartWorkout = (workoutType?: string) => {
    const type = workoutType || "strength"; // Default to strength training
    setSelectedWorkoutType(type);
    setCurrentView("ai-workout-generator");
  };

  const handleWorkoutGenerated = (workout: any) => {
    setGeneratedWorkout(workout);
    setCurrentView("workout-session");
  };

  const handleSelectWorkout = (workoutType: string) => {
    setSelectedWorkoutType(workoutType);
    setCurrentView("workout-session");
  };

  const handleBackToMain = () => {
    setCurrentView("main");
    setActiveTab("dashboard");
  };

  const handleOpenProfile = () => {
    setCurrentView("user-profile");
  };

  const handleOpenChatWithMessage = (message: string) => {
    setChatInitialMessage(message);
    setShowChat(true);
  };

  // Render different views based on current view
  if (currentView === "workout-selector") {
    return (
      <WorkoutSelector 
        onBack={handleBackToMain}
        onSelectWorkout={handleSelectWorkout}
      />
    );
  }

  if (currentView === "workout-session") {
    return (
      <WorkoutSession 
        onBack={handleBackToMain}
        workoutType={selectedWorkoutType}
        generatedWorkout={generatedWorkout}
      />
    );
  }

  if (currentView === "ai-workout-generator") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <AIWorkoutGenerator
          workoutType={selectedWorkoutType}
          onWorkoutGenerated={handleWorkoutGenerated}
          onCancel={handleBackToMain}
        />
      </div>
    );
  }

  if (currentView === "user-profile") {
    return (
      <UserProfile onBack={handleBackToMain} />
    );
  }
  
  return (
    <motion.div 
      className="flex flex-col h-full bg-white ios-style-app"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* iOS-style status bar */}
      <div className="ios-status-bar px-4 pt-2 pb-1 flex justify-between items-center text-xs text-gray-600 bg-white">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <i className="fas fa-signal"></i>
          <i className="fas fa-wifi"></i>
          <i className="fas fa-battery-full"></i>
        </div>
      </div>
      
      {/* iOS-style header */}
      <div className="ios-header px-4 py-2 flex justify-between items-center bg-white">
        <div className="flex items-center">
          <div className="flex flex-col">
            <div className="flex items-center">
              <ThryvinLogo size="lg" animated={false} />
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 font-medium">PRO</span>
            </div>
            
            <div className="flex items-center mt-0.5">
              <span className="text-xs text-gray-500 flex items-center">
                <i className="fas fa-user-circle text-purple-500 mr-1"></i>
                Coach: {coachInfo.name}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="flex items-center space-x-3">
            <button 
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              onClick={() => setActiveTab("nutrition")}
              data-tutorial="nutrition-tab"
            >
              <i className="fas fa-apple-alt text-gray-500 text-sm"></i>
            </button>
            <button 
              className={`w-8 h-8 rounded-full flex items-center justify-center ${activeTab === "social" ? "bg-purple-500 text-white" : "bg-gray-100"}`}
              onClick={() => {
                console.log("Social tab clicked!");
                setActiveTab("social");
              }}
              data-tutorial="social-tab"
            >
              <i className={`fas fa-users text-sm ${activeTab === "social" ? "text-white" : "text-gray-500"}`}></i>
            </button>

          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide" data-tutorial="dashboard">
        {activeTab === "dashboard" && (
          <DashboardTab 
            coachInfo={coachInfo}
            onNavigateToScreen={onNavigateToScreen}
            onStartWorkout={handleStartWorkout}
            onOpenProfile={handleOpenProfile}
          />
        )}
        {activeTab === "awards" && <AwardsPageComponent />}
        {activeTab === "settings" && <AchievementsTab />}
        {activeTab === "nutrition" && (
          <EnhancedNutritionTab 
            userId={user?.id || 2} 
            onNutritionModalChange={setIsNutritionModalOpen}
          />
        )}
        {activeTab === "social" && (
          <div className="w-full">
            <SocialTab userId={user?.id || 2} />
          </div>
        )}
        {activeTab === "workouts" && (
          <WorkoutPageNew 
            onWorkoutSelect={(workoutId, date) => {
              setSelectedWorkoutType(workoutId);
              setCurrentView("workout-session");
            }}
            onOpenChatWithMessage={handleOpenChatWithMessage}
          />
        )}
        {activeTab === "stats" && <StatsTab />}
        {activeTab === "profile" && <BasicProfile />}
      </div>



      {/* iOS-style bottom navigation bar - shown on all pages */}
      <div className="fixed bottom-0 left-0 right-0 ios-bottom-nav z-20">
        <button
          className={`ios-bottom-nav-item ${activeTab === "dashboard" ? 'ios-bottom-nav-item-active' : 'ios-bottom-nav-item-inactive'}`}
          onClick={() => setActiveTab("dashboard")}
          data-tutorial="dashboard-tab"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeTab === "dashboard" ? 'bg-purple-50' : ''}`}>
            <i className="fas fa-home"></i>
          </div>
          <span className="text-xs mt-1">Today</span>
        </button>
        <button
          className={`ios-bottom-nav-item ${activeTab === "workouts" ? 'ios-bottom-nav-item-active' : 'ios-bottom-nav-item-inactive'}`}
          onClick={() => setActiveTab("workouts")}
          data-tutorial="workouts-tab"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeTab === "workouts" ? 'bg-purple-50' : ''}`}>
            <i className="fas fa-dumbbell"></i>
          </div>
          <span className="text-xs mt-1">Workouts</span>
        </button>
        <button
          className={`ios-bottom-nav-item ${activeTab === "awards" ? 'ios-bottom-nav-item-active' : 'ios-bottom-nav-item-inactive'}`}
          onClick={() => setActiveTab("awards")}
          data-tutorial="awards-tab"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeTab === "awards" ? 'bg-purple-50' : ''}`}>
            <i className="fas fa-trophy"></i>
          </div>
          <span className="text-xs mt-1">Awards</span>
        </button>
        <button
          className={`ios-bottom-nav-item ${activeTab === "stats" ? 'ios-bottom-nav-item-active' : 'ios-bottom-nav-item-inactive'}`}
          onClick={() => setActiveTab("stats")}
          data-tutorial="stats-tab"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeTab === "stats" ? 'bg-purple-50' : ''}`}>
            <i className="fas fa-chart-pie"></i>
          </div>
          <span className="text-xs mt-1">Stats</span>
        </button>
        <button
          className={`ios-bottom-nav-item ${activeTab === "profile" ? 'ios-bottom-nav-item-active' : 'ios-bottom-nav-item-inactive'}`}
          onClick={() => setActiveTab("profile")}
          data-tutorial="profile-tab"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeTab === "profile" ? 'bg-purple-50' : ''}`}>
            <i className="fas fa-user"></i>
          </div>
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
      
      {/* Empty div to provide spacing for the fixed bottom nav */}
      <div className="h-20"></div>

      {/* Enhanced Tutorial Prompt */}
      {showTutorialPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 overflow-hidden"
            initial={{ scale: 0.7, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            {/* Gradient accent bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600"></div>
            
            <div className="text-center">
              <div className="mb-6">
                {/* Enhanced welcome icon with animation */}
                <div className="flex justify-center mb-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 500, delay: 0.1 }}
                    className="relative"
                  >
                    <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="welcomeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#7A3CF3', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#FF4FD8', stopOpacity: 1 }} />
                        </linearGradient>
                        <filter id="welcomeGlow">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge> 
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      <circle cx="40" cy="40" r="35" fill="url(#welcomeGradient)" filter="url(#welcomeGlow)" />
                      <g transform="translate(40, 40)">
                        <rect x="-16" y="-3" width="32" height="6" rx="3" fill="white" opacity="0.95"/>
                        <rect x="-20" y="-8" width="8" height="16" rx="4" fill="white" opacity="0.95"/>
                        <rect x="12" y="-8" width="8" height="16" rx="4" fill="white" opacity="0.95"/>
                      </g>
                    </svg>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-bounce">
                      👋
                    </div>
                  </motion.div>
                </div>
                
                {/* Enhanced welcome text */}
                <motion.h3 
                  className="text-2xl font-bold mb-3 text-gradient-brand"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  🔥 Welcome to Thryvin'!
                </motion.h3>
                
                <motion.p 
                  className="text-gray-700 text-base leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Ready to transform your fitness journey? Let me show you around your powerful new AI fitness companion!
                </motion.p>
              </div>
              
              <div className="flex space-x-3">
                <motion.button
                  onClick={handleTutorialSkip}
                  className="flex-1 px-6 py-3 text-gray-600 border-2 border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-sm font-semibold"
                  whileHover={{ scale: 1.02 }}
                >
                  Maybe Later
                </motion.button>
                <motion.button
                  onClick={handleStartTutorial}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.02 }}
                >
                  🚀 Start Tour!
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tutorial System */}
      <AppTutorial
        isOpen={showTutorial}
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialSkip}
      />

      {/* Global Coach Button with Quick Actions */}
      <GlobalCoachButton
        onChatOpen={() => setShowChat(true)}
        coachName={coachInfo.name}
        coachIcon={coachInfo.icon}
        coachColorClass={coachInfo.colorClass}
        currentContext={location === "/workouts" ? "workout" : location === "/nutrition" ? "nutrition" : "home"}
        recentActions={globalCoach.actions}
        onUndo={(actionId) => {
          globalCoach.undoAction(actionId);
          // Show success message or update UI as needed
        }}
        onQuickAction={async (action) => {
          const result = await globalCoach.performQuickAction(action, {
            coach: "kai-rivers", // Use default coach for now
            userProfile: user,
            currentWorkout: generatedWorkout
          });
          if (result) {
            setChatInitialMessage(result.response);
            setShowChat(true);
          }
        }}
      />

      {/* Chat Modal */}
      <ChatModal
        isOpen={showChat}
        onClose={() => {
          setShowChat(false);
          setChatInitialMessage("");
        }}
        coachName={coachInfo.name}
        coachIcon={coachInfo.icon}
        coachColorClass={coachInfo.colorClass}
        initialMessage={chatInitialMessage}
      />
    </motion.div>
  );
}