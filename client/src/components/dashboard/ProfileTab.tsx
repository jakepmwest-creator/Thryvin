import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Star, Trophy, Users, Sun, Moon, 
  Bell, Shield, LogOut, Edit3, Save, X,
  Ruler, Volume2, VolumeX, Settings, Mic
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-v2';
import { useToast } from '@/hooks/use-toast';

export default function ProfileTab() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const [userProfile, setUserProfile] = useState({
    username: user?.name || 'Jake',
    bio: 'Strength training enthusiast 💪 | Level up every day!',
    level: 12,
    xpPoints: 2450,
    nextLevelXP: 3000,
    rank: 'Silver Champion',
    rankIcon: '🥈'
  });

  const [settings, setSettings] = useState({
    theme: 'light',
    notifications: true,
    privacy: 'public',
    units: 'metric',
    workoutReminders: true,
    aiCoachStyle: 'encouraging',
    autoSaveProgress: true,
    voiceCoaching: false
  });

  const handleLogout = async () => {
    await logout();
  };

  const saveProfile = () => {
    setIsEditing(false);
    toast({
      title: "Profile Updated!",
      description: "Your profile changes have been saved.",
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 p-0.5">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{userProfile.username}</h1>
              <div className="flex items-center gap-2">
                <span className="text-lg">{userProfile.rankIcon}</span>
                <span className="text-purple-600 font-medium">{userProfile.rank}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-bold text-yellow-600">Level {userProfile.level}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
          >
            {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          </button>
        </div>
        
        <p className="text-gray-600 mb-4">{userProfile.bio}</p>
        
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
        
        {/* Profile Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-purple-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{userProfile.level}</div>
            <div className="text-xs text-purple-500">Current Level</div>
          </div>
          <div className="p-3 bg-pink-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-pink-600">{userProfile.xpPoints}</div>
            <div className="text-xs text-pink-500">Total XP</div>
          </div>
        </div>
      </motion.div>

      {/* Settings */}
      <div className="space-y-3">
        {/* Theme Setting */}
        <motion.div
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sun className="w-5 h-5 text-yellow-500" />
              <span className="font-medium text-gray-800">Theme</span>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSettings(prev => ({ ...prev, theme: 'light' }))}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  settings.theme === 'light'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Light
              </button>
              <button
                onClick={() => setSettings(prev => ({ ...prev, theme: 'dark' }))}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  settings.theme === 'dark'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Dark
              </button>
            </div>
          </div>
        </motion.div>

        {/* Notifications Setting */}
        <motion.div
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-green-500" />
              <div>
                <span className="font-medium text-gray-800 block">Notifications</span>
                <span className="text-xs text-gray-500">Get daily reminders and alerts</span>
              </div>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, notifications: !prev.notifications }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.notifications ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.notifications ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </motion.div>

        {/* Units Setting */}
        <motion.div
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ruler className="w-5 h-5 text-purple-500" />
              <div>
                <span className="font-medium text-gray-800 block">Units</span>
                <span className="text-xs text-gray-500">Measurement system</span>
              </div>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSettings(prev => ({ ...prev, units: 'metric' }))}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  settings.units === 'metric'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Metric
              </button>
              <button
                onClick={() => setSettings(prev => ({ ...prev, units: 'imperial' }))}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  settings.units === 'imperial'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Imperial
              </button>
            </div>
          </div>
        </motion.div>

        {/* Workout Reminders */}
        <motion.div
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-orange-500" />
              <div>
                <span className="font-medium text-gray-800 block">Workout Reminders</span>
                <span className="text-xs text-gray-500">Daily workout notifications</span>
              </div>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, workoutReminders: !prev.workoutReminders }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.workoutReminders ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.workoutReminders ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </motion.div>

        {/* AI Coach Style */}
        <motion.div
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-purple-500" />
              <div>
                <span className="font-medium text-gray-800 block">AI Coach Style</span>
                <span className="text-xs text-gray-500">Coaching personality</span>
              </div>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSettings(prev => ({ ...prev, aiCoachStyle: 'encouraging' }))}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  settings.aiCoachStyle === 'encouraging'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Kind
              </button>
              <button
                onClick={() => setSettings(prev => ({ ...prev, aiCoachStyle: 'motivating' }))}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  settings.aiCoachStyle === 'motivating'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Tough
              </button>
              <button
                onClick={() => setSettings(prev => ({ ...prev, aiCoachStyle: 'balanced' }))}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  settings.aiCoachStyle === 'balanced'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Balanced
              </button>
            </div>
          </div>
        </motion.div>

        {/* Voice Coaching */}
        <motion.div
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.voiceCoaching ? <Volume2 className="w-5 h-5 text-green-500" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
              <div>
                <span className="font-medium text-gray-800 block">Voice Coaching</span>
                <span className="text-xs text-gray-500">Audio workout guidance</span>
              </div>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, voiceCoaching: !prev.voiceCoaching }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.voiceCoaching ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.voiceCoaching ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </motion.div>

        {/* Auto Save Progress */}
        <motion.div
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Save className="w-5 h-5 text-indigo-500" />
              <div>
                <span className="font-medium text-gray-800 block">Auto Save Progress</span>
                <span className="text-xs text-gray-500">Automatically save workout data</span>
              </div>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, autoSaveProgress: !prev.autoSaveProgress }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.autoSaveProgress ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.autoSaveProgress ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </motion.div>

        {/* Logout Button */}
        <motion.button
          onClick={handleLogout}
          className="w-full p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </motion.button>
      </div>
    </div>
  );
}