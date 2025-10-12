import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { 
  User, Star, ArrowLeft, Trophy, Users, Sun, Moon, 
  Bell, Shield, LogOut, Edit3, Save, X
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-v2';
import { useToast } from '@/hooks/use-toast';

export default function SimpleProfilePage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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
    privacy: 'public'
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

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Back Navigation */}
      <div className="absolute top-4 left-4 z-20">
        <Link href="/">
          <motion.button
            className="p-3 bg-white/80 backdrop-blur-sm rounded-full text-purple-600 hover:bg-white transition-colors shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
        </Link>
      </div>

      {/* Header */}
      <div className="relative h-48 bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        
        {/* Profile Picture */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 p-0.5">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <User className="w-12 h-12 text-gray-400" />
            </div>
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
            <div className="flex-1 text-center">
              <h1 className="text-2xl font-bold text-purple-800">{userProfile.username}</h1>
              
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-2xl">{userProfile.rankIcon}</span>
                <span className="text-purple-600 font-medium">{userProfile.rank}</span>
                <div className="flex items-center gap-1 ml-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-bold text-yellow-600">Level {userProfile.level}</span>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 text-center mb-4">{userProfile.bio}</p>
          
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
            <Link href="/awards">
              <motion.div
                className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Trophy className="w-4 h-4" />
                Awards
              </motion.div>
            </Link>
            <motion.div
              className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Users className="w-4 h-4" />
              Friends
            </motion.div>
          </div>
        </motion.div>

        {/* Simple Settings */}
        <div className="space-y-4">
          {/* Theme Setting */}
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-yellow-500" />
                <span className="font-medium text-purple-800">Theme</span>
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
            className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-green-500" />
                <span className="font-medium text-purple-800">Notifications</span>
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

          {/* Privacy Setting */}
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-indigo-500" />
                <span className="font-medium text-purple-800">Privacy</span>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSettings(prev => ({ ...prev, privacy: 'public' }))}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    settings.privacy === 'public'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600'
                  }`}
                >
                  Public
                </button>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, privacy: 'private' }))}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    settings.privacy === 'private'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600'
                  }`}
                >
                  Private
                </button>
              </div>
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
    </div>
  );
}