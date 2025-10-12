import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { 
  User, Camera, Edit3, Star, Bell, 
  Shield, LogOut, Trophy, Users, Sun, Moon, 
  Weight, Ruler, Zap, RotateCcw,
  ChevronRight, Upload, Save, X, ArrowLeft, Target, Calendar, Flame, Gift
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-v2';
import { useToast } from '@/hooks/use-toast';

interface UserSettings {
  theme: 'light' | 'dark';
  units: {
    weight: 'lbs' | 'kg';
    height: 'ft' | 'cm';
    calories: 'kcal' | 'kJ';
  };
  notifications: {
    dailyReminders: boolean;
    workoutAlerts: boolean;
    aiCoachMessages: boolean;
  };
  aiCoachStyle: 'calm' | 'motivational' | 'tough-love';
  privacy: 'public' | 'private';
}

interface UserProfile {
  username: string;
  bio: string;
  level: number;
  xpPoints: number;
  nextLevelXP: number;
  profilePicture?: string;
  bannerImage?: string;
  rank: string;
  rankIcon: string;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showImageUpload, setShowImageUpload] = useState<'profile' | 'banner' | null>(null);
  
  const profileImageRef = useRef<HTMLInputElement>(null);
  const bannerImageRef = useRef<HTMLInputElement>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    username: user?.name || 'Jake',
    bio: 'Strength training enthusiast 💪 | Level up every day!',
    level: 12,
    xpPoints: 2450,
    nextLevelXP: 3000,
    rank: 'Silver Champion',
    rankIcon: '🥈',
    profilePicture: '/api/placeholder/100/100',
    bannerImage: '/api/placeholder/400/200'
  });

  const [settings, setSettings] = useState<UserSettings>({
    theme: (localStorage.getItem('thryvin-theme') as 'light' | 'dark') || 'light',
    units: {
      weight: (localStorage.getItem('thryvin-weight-unit') as 'lbs' | 'kg') || 'lbs',
      height: (localStorage.getItem('thryvin-height-unit') as 'ft' | 'cm') || 'ft',
      calories: (localStorage.getItem('thryvin-calorie-unit') as 'kcal' | 'kJ') || 'kcal'
    },
    notifications: {
      dailyReminders: localStorage.getItem('thryvin-daily-reminders') !== 'false',
      workoutAlerts: localStorage.getItem('thryvin-workout-alerts') !== 'false',
      aiCoachMessages: localStorage.getItem('thryvin-coach-messages') !== 'false'
    },
    aiCoachStyle: (localStorage.getItem('thryvin-coach-style') as 'calm' | 'motivational' | 'tough-love') || 'motivational',
    privacy: (localStorage.getItem('thryvin-privacy') as 'public' | 'private') || 'public'
  });

  const [tempProfile, setTempProfile] = useState(userProfile);

  const handleImageUpload = (type: 'profile' | 'banner', file: File) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        if (type === 'profile') {
          setTempProfile(prev => ({ ...prev, profilePicture: imageUrl }));
        } else {
          setTempProfile(prev => ({ ...prev, bannerImage: imageUrl }));
        }
      };
      reader.readAsDataURL(file);
      setShowImageUpload(null);
    }
  };

  const saveProfile = () => {
    setUserProfile(tempProfile);
    setIsEditing(false);
    toast({
      title: "Profile Updated!",
      description: "Your profile changes have been saved.",
    });
  };

  const cancelEdit = () => {
    setTempProfile(userProfile);
    setIsEditing(false);
    setShowImageUpload(null);
  };

  const updateSetting = <K extends keyof UserSettings>(
    section: K,
    key: string,
    value: any
  ) => {
    const newSettings = { ...settings };
    if (typeof newSettings[section] === 'object') {
      (newSettings[section] as any)[key] = value;
    } else {
      (newSettings as any)[section] = value;
    }
    setSettings(newSettings);

    // Save to localStorage
    const storageKey = `thryvin-${section === 'units' ? `${key}-unit` : 
                        section === 'notifications' ? key.replace(/([A-Z])/g, '-$1').toLowerCase() :
                        section}`;
    localStorage.setItem(storageKey, value.toString());
    
    if (section === 'theme') {
      document.documentElement.setAttribute('data-theme', value);
    }
  };

  const resetAIPersonalization = () => {
    localStorage.removeItem('thryvin-coach-style');
    localStorage.removeItem('thryvin-coach-personality');
    setSettings(prev => ({ ...prev, aiCoachStyle: 'motivational' }));
    toast({
      title: "AI Reset Complete",
      description: "Your AI coach preferences have been reset to default.",
    });
  };

  const handleLogout = () => {
    await logout();
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const ToggleSwitch = ({ enabled, onChange, disabled = false }: { 
    enabled: boolean; 
    onChange: (value: boolean) => void; 
    disabled?: boolean;
  }) => (
    <motion.button
      onClick={() => !disabled && onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
        enabled 
          ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
          : 'bg-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      <motion.div
        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
        animate={{ x: enabled ? 24 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Back Navigation */}
      <div className="absolute top-4 left-4 z-20">
        <Link href="/">
          <motion.button
            className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
        </Link>
      </div>

      {/* Banner Section */}
      <div className="relative h-48 overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600"
          style={{
            backgroundImage: userProfile.bannerImage ? `url(${userProfile.bannerImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
        
        {isEditing && (
          <motion.button
            onClick={() => setShowImageUpload('banner')}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Camera className="w-5 h-5" />
          </motion.button>
        )}
        
        {/* Profile Picture */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <div className="relative">
            <motion.div
              className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 p-0.5"
              whileHover={isEditing ? { scale: 1.05 } : {}}
            >
              <div 
                className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden"
                style={{
                  backgroundImage: userProfile.profilePicture ? `url(${userProfile.profilePicture})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {!userProfile.profilePicture && (
                  <User className="w-12 h-12 text-gray-400" />
                )}
              </div>
            </motion.div>
            
            {isEditing && (
              <motion.button
                onClick={() => setShowImageUpload('profile')}
                className="absolute -bottom-1 -right-1 p-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Camera className="w-3 h-3" />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="pt-16 px-4 pb-8">
        {/* Personal Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-6 border border-purple-100"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={tempProfile.username}
                  onChange={(e) => setTempProfile(prev => ({ ...prev, username: e.target.value }))}
                  className="text-2xl font-bold text-purple-800 bg-transparent border-b-2 border-purple-300 focus:border-purple-500 outline-none"
                />
              ) : (
                <h1 className="text-2xl font-bold text-purple-800">{userProfile.username}</h1>
              )}
              
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl">{userProfile.rankIcon}</span>
                <span className="text-purple-600 font-medium">{userProfile.rank}</span>
                <div className="flex items-center gap-1 ml-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-bold text-yellow-600">Level {userProfile.level}</span>
                </div>
              </div>
            </div>
            
            <motion.button
              onClick={() => isEditing ? saveProfile() : setIsEditing(true)}
              className={`p-2 rounded-full ${
                isEditing 
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' 
                  : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
              } transition-colors`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isEditing ? <Save className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
            </motion.button>
            
            {isEditing && (
              <motion.button
                onClick={cancelEdit}
                className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors ml-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            )}
          </div>
          
          {/* Bio */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Edit3 className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Bio</span>
            </div>
            {isEditing ? (
              <textarea
                value={tempProfile.bio}
                onChange={(e) => setTempProfile(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full p-4 bg-purple-50 border-2 border-purple-200 rounded-xl focus:border-purple-400 outline-none resize-none transition-colors"
                rows={3}
                placeholder="Tell us about yourself... Share your fitness journey, goals, or what motivates you!"
                maxLength={200}
              />
            ) : (
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-gray-700 leading-relaxed">{userProfile.bio}</p>
              </div>
            )}
            {isEditing && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">Share your fitness journey and goals</span>
                <span className={`text-xs font-medium ${
                  tempProfile.bio.length > 180 ? 'text-orange-500' : 
                  tempProfile.bio.length > 150 ? 'text-yellow-600' : 'text-gray-500'
                }`}>
                  {tempProfile.bio.length}/200
                </span>
              </div>
            )}
          </div>
          
          {/* XP Progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-purple-600">XP Progress</span>
              <span className="text-sm text-gray-600">
                {userProfile.xpPoints}/{userProfile.nextLevelXP} XP
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                style={{ width: `${(userProfile.xpPoints / userProfile.nextLevelXP) * 100}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${(userProfile.xpPoints / userProfile.nextLevelXP) * 100}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <motion.a
              href="/awards"
              className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Trophy className="w-4 h-4" />
              Awards
            </motion.a>
            <motion.button
              className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Users className="w-4 h-4" />
              Friends
            </motion.button>
          </div>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Customise Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Target className="w-3 h-3 text-white" />
              </div>
              Customise
            </h2>
            
            <div className="space-y-3">
              {/* Theme Settings */}
              <motion.div
                className="bg-white/80 backdrop-blur-sm rounded-xl border border-purple-100 overflow-hidden"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={() => toggleSection('theme')}
                  className="w-full p-4 flex items-center justify-between hover:bg-purple-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {settings.theme === 'light' ? (
                      <Sun className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <Moon className="w-5 h-5 text-purple-500" />
                    )}
                    <div className="text-left">
                      <span className="font-medium text-purple-800 block">Theme & Display</span>
                      <span className="text-xs text-gray-500">Choose your preferred app appearance</span>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedSection === 'theme' ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {expandedSection === 'theme' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-purple-100"
                    >
                      <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-gray-700 block">Dark Mode</span>
                            <span className="text-xs text-gray-500">Switch between light and dark themes</span>
                          </div>
                          <ToggleSwitch
                            enabled={settings.theme === 'dark'}
                            onChange={(enabled) => updateSetting('theme', '', enabled ? 'dark' : 'light')}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Units Settings */}
              <motion.div
                className="bg-white/80 backdrop-blur-sm rounded-xl border border-purple-100 overflow-hidden"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={() => toggleSection('units')}
                  className="w-full p-4 flex items-center justify-between hover:bg-purple-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Ruler className="w-5 h-5 text-purple-500" />
                    <div className="text-left">
                      <span className="font-medium text-purple-800 block">Units & Measurements</span>
                      <span className="text-xs text-gray-500">Customize your measurement preferences</span>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedSection === 'units' ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {expandedSection === 'units' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-purple-100"
                    >
                      <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Weight</span>
                          <div className="flex bg-gray-100 rounded-lg p-1">
                            {['lbs', 'kg'].map((unit) => (
                              <button
                                key={unit}
                                onClick={() => updateSetting('units', 'weight', unit)}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                  settings.units.weight === unit
                                    ? 'bg-white text-purple-600 shadow-sm'
                                    : 'text-gray-600 hover:text-purple-600'
                                }`}
                              >
                                {unit}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Height</span>
                          <div className="flex bg-gray-100 rounded-lg p-1">
                            {['ft', 'cm'].map((unit) => (
                              <button
                                key={unit}
                                onClick={() => updateSetting('units', 'height', unit)}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                  settings.units.height === unit
                                    ? 'bg-white text-purple-600 shadow-sm'
                                    : 'text-gray-600 hover:text-purple-600'
                                }`}
                              >
                                {unit}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Calories</span>
                          <div className="flex bg-gray-100 rounded-lg p-1">
                            {['kcal', 'kJ'].map((unit) => (
                              <button
                                key={unit}
                                onClick={() => updateSetting('units', 'calories', unit)}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                  settings.units.calories === unit
                                    ? 'bg-white text-purple-600 shadow-sm'
                                    : 'text-gray-600 hover:text-purple-600'
                                }`}
                              >
                                {unit}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>

          {/* Notifications Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Bell className="w-3 h-3 text-white" />
              </div>
              Notifications
            </h2>
            
            <motion.div
              className="bg-white/80 backdrop-blur-sm rounded-xl border border-purple-100 overflow-hidden"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => toggleSection('notifications')}
                className="w-full p-4 flex items-center justify-between hover:bg-purple-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-green-500" />
                  <div className="text-left">
                    <span className="font-medium text-purple-800 block">Alert Preferences</span>
                    <span className="text-xs text-gray-500">Manage when and how you get notified</span>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: expandedSection === 'notifications' ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {expandedSection === 'notifications' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-purple-100"
                  >
                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-700 block font-medium">Daily Reminders</span>
                          <span className="text-xs text-gray-500">Get reminders for your daily goals</span>
                        </div>
                        <ToggleSwitch
                          enabled={settings.notifications.dailyReminders}
                          onChange={(enabled) => updateSetting('notifications', 'dailyReminders', enabled)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-700 block font-medium">Workout Alerts</span>
                          <span className="text-xs text-gray-500">Notifications for scheduled workouts</span>
                        </div>
                        <ToggleSwitch
                          enabled={settings.notifications.workoutAlerts}
                          onChange={(enabled) => updateSetting('notifications', 'workoutAlerts', enabled)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-700 block font-medium">AI Coach Messages</span>
                          <span className="text-xs text-gray-500">Motivational messages from your AI coach</span>
                        </div>
                        <ToggleSwitch
                          enabled={settings.notifications.aiCoachMessages}
                          onChange={(enabled) => updateSetting('notifications', 'aiCoachMessages', enabled)}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* AI Coach Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              AI Coach
            </h2>
            
            <motion.div
              className="bg-white/80 backdrop-blur-sm rounded-xl border border-purple-100 overflow-hidden"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => toggleSection('ai')}
                className="w-full p-4 flex items-center justify-between hover:bg-purple-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <div className="text-left">
                    <span className="font-medium text-purple-800 block">Coaching Preferences</span>
                    <span className="text-xs text-gray-500">Personalize your AI coaching experience</span>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: expandedSection === 'ai' ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {expandedSection === 'ai' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-purple-100"
                  >
                    <div className="p-4 space-y-4">
                      <div>
                        <span className="text-gray-700 block mb-3 font-medium">Coaching Style</span>
                        <div className="space-y-3">
                          {[
                            { value: 'calm', label: 'Calm & Supportive', desc: 'Gentle encouragement and understanding', icon: '🤗' },
                            { value: 'motivational', label: 'Motivational', desc: 'Energetic and inspiring messages', icon: '🔥' },
                            { value: 'tough-love', label: 'Tough Love', desc: 'Direct and challenging approach', icon: '💪' }
                          ].map((style) => (
                            <button
                              key={style.value}
                              onClick={() => updateSetting('aiCoachStyle', '', style.value)}
                              className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                                settings.aiCoachStyle === style.value
                                  ? 'border-purple-500 bg-purple-50 shadow-md'
                                  : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{style.icon}</span>
                                <div>
                                  <div className="font-medium text-gray-800">{style.label}</div>
                                  <div className="text-xs text-gray-600 mt-1">{style.desc}</div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <motion.button
                        onClick={resetAIPersonalization}
                        className="w-full p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reset AI Personalization
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Privacy & Account Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" />
              </div>
              Privacy & Account
            </h2>
            
            <div className="space-y-3">
              {/* Privacy Settings */}
              <motion.div
                className="bg-white/80 backdrop-blur-sm rounded-xl border border-purple-100 overflow-hidden"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={() => toggleSection('privacy')}
                  className="w-full p-4 flex items-center justify-between hover:bg-purple-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-indigo-500" />
                    <div className="text-left">
                      <span className="font-medium text-purple-800 block">Privacy Settings</span>
                      <span className="text-xs text-gray-500">Control who can see your information</span>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedSection === 'privacy' ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {expandedSection === 'privacy' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-purple-100"
                    >
                      <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-gray-700 block font-medium">Public Profile</span>
                            <span className="text-xs text-gray-500">Allow others to see your profile and achievements</span>
                          </div>
                          <ToggleSwitch
                            enabled={settings.privacy === 'public'}
                            onChange={(enabled) => updateSetting('privacy', '', enabled ? 'public' : 'private')}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Logout Button */}
              <motion.button
                onClick={handleLogout}
                className="w-full p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-3"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogOut className="w-5 h-5" />
                Logout
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Image Upload Modal */}
      <AnimatePresence>
        {showImageUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowImageUpload(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-xl text-purple-800 mb-4">
                Upload {showImageUpload === 'profile' ? 'Profile Picture' : 'Banner Image'}
              </h3>
              
              <div className="space-y-4">
                <input
                  ref={showImageUpload === 'profile' ? profileImageRef : bannerImageRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(showImageUpload!, file);
                  }}
                  className="hidden"
                />
                
                <motion.button
                  onClick={() => {
                    if (showImageUpload === 'profile') {
                      profileImageRef.current?.click();
                    } else {
                      bannerImageRef.current?.click();
                    }
                  }}
                  className="w-full p-4 border-2 border-dashed border-purple-300 rounded-xl text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Upload className="w-5 h-5" />
                  Choose Image
                </motion.button>
                
                <motion.button
                  onClick={() => setShowImageUpload(null)}
                  className="w-full p-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}