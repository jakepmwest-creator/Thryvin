import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Edit3, Save, X, ChevronRight, Sun, Moon, Bell, Shield, 
  Zap, Ruler, LogOut, RotateCcw, Upload, Trophy, Users, Target, Fingerprint,
  Volume2, VolumeX, Smartphone, Monitor, Calendar, Clock, Activity,
  Star, Award, MessageSquare, Video, Download, Trash2, Lock, Eye,
  Globe, Database, RefreshCw, Settings, User, Heart, Dumbbell
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-v2';
import { useBiometricAuth } from '@/hooks/use-biometric-auth';
import { useQuery } from '@tanstack/react-query';

// Settings interface for proper typing
interface Settings {
  theme: 'light' | 'dark';
  colorScheme: string;
  fontSize: 'small' | 'medium' | 'large';
  animations: boolean;
  units: {
    weight: 'lbs' | 'kg';
    height: 'ft' | 'cm';
    distance: 'miles' | 'km';
    calories: 'kcal' | 'kJ';
  };
  notifications: {
    workoutReminders: boolean;
    mealReminders: boolean;
    progressUpdates: boolean;
    socialActivity: boolean;
    achievements: boolean;
    coachMessages: boolean;
    weeklyReports: boolean;
    systemUpdates: boolean;
  };
  coach: {
    style: 'gentle' | 'motivational' | 'tough' | 'analytical';
    frequency: 'minimal' | 'balanced' | 'frequent';
    expertise: string;
    voiceFeedback: boolean;
    realTimeTips: boolean;
    personalizedWorkouts: boolean;
  };
  workout: {
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration: string;
    equipment: string[];
    restTime: string;
    warmupCooldown: boolean;
    modifications: boolean;
  };
  nutrition: {
    trackingMode: 'simple' | 'detailed' | 'advanced';
    mealPlanning: boolean;
    macroTracking: boolean;
    waterReminders: boolean;
    recipeSuggestions: boolean;
    smartPortions: boolean;
  };
  social: {
    profileVisibility: 'private' | 'friends' | 'public';
    activitySharing: 'none' | 'friends' | 'public';
    achievementSharing: boolean;
    workoutSharing: boolean;
    leaderboards: boolean;
    friendRequests: string;
  };
  data: {
    autoBackup: boolean;
    syncDevices: boolean;
    dataRetention: string;
    analytics: boolean;
    crashReports: boolean;
  };
  security: {
    biometricAuth: boolean;
    twoFactor: boolean;
    sessionTimeout: string;
    deviceLogging: boolean;
  };
  audio: {
    workoutMusic: boolean;
    voiceCommands: boolean;
    systemSounds: boolean;
    coachVoice: boolean;
    volume: number;
  };
}

// Toggle Switch Component with Gradient
const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) => (
  <motion.button
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ${
      enabled ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25' : 'bg-gray-300'
    }`}
    whileHover={{ scale: 1.05 }}
  >
    <motion.span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
      layout
    />
  </motion.button>
);

export default function BasicProfile() {
  const { user, logout } = useAuth();
  const { isSupported, isRegistered, register, disable } = useBiometricAuth();
  
  // Load user data with body metrics
  const { data: userWithMetrics } = useQuery({
    queryKey: ['/api/user'],
    retry: false,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const profileImageRef = useRef<HTMLInputElement>(null);

  // Default settings
  const defaultSettings: Settings = {
    theme: 'light',
    colorScheme: 'purple',
    fontSize: 'medium',
    animations: true,
    units: {
      weight: 'lbs',
      height: 'ft',
      distance: 'miles',
      calories: 'kcal'
    },
    notifications: {
      workoutReminders: true,
      mealReminders: true,
      progressUpdates: true,
      socialActivity: true,
      achievements: true,
      coachMessages: true,
      weeklyReports: true,
      systemUpdates: false
    },
    coach: {
      style: 'motivational',
      frequency: 'balanced',
      expertise: 'general',
      voiceFeedback: true,
      realTimeTips: true,
      personalizedWorkouts: true
    },
    workout: {
      difficulty: 'intermediate',
      duration: '30-45min',
      equipment: ['bodyweight', 'dumbbells'],
      restTime: 'normal',
      warmupCooldown: true,
      modifications: true
    },
    nutrition: {
      trackingMode: 'detailed',
      mealPlanning: true,
      macroTracking: true,
      waterReminders: true,
      recipeSuggestions: true,
      smartPortions: true
    },
    social: {
      profileVisibility: 'public',
      activitySharing: 'friends',
      achievementSharing: true,
      workoutSharing: false,
      leaderboards: true,
      friendRequests: 'anyone'
    },
    data: {
      autoBackup: true,
      syncDevices: true,
      dataRetention: '2-years',
      analytics: true,
      crashReports: true
    },
    security: {
      biometricAuth: isRegistered,
      twoFactor: false,
      sessionTimeout: '30-min',
      deviceLogging: true
    },
    audio: {
      workoutMusic: true,
      voiceCommands: false,
      systemSounds: true,
      coachVoice: true,
      volume: 75
    }
  };

  // Default user profile
  const defaultProfile = {
    name: user?.name || 'Jake',
    email: user?.email || 'jakepmwest@gmail.com',
    bio: 'Passionate about fitness and always pushing my limits! Currently focusing on strength training and marathon prep. 💪',
    profilePicture: '/api/placeholder/100/100',
    level: 12,
    xpPoints: 2450,
    nextLevelXP: 3000,
    title: 'Silver Champion 🥈'
  };

  // User profile state with persistence
  const [userProfile, setUserProfile] = useState(defaultProfile);
  const [tempProfile, setTempProfile] = useState(userProfile);

  // Settings state with persistence
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('thryvin-app-settings');
      if (saved) {
        const parsedSettings = JSON.parse(saved) as Partial<Settings>;
        setSettings(prev => ({...prev, ...parsedSettings}));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  // Load user profile from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('thryvin-user-profile');
      if (saved) {
        const parsedProfile = JSON.parse(saved);
        setUserProfile({...defaultProfile, ...parsedProfile});
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }, []);

  // Save settings to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem('thryvin-app-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [settings]);

  // Save user profile to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem('thryvin-user-profile', JSON.stringify(userProfile));
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  }, [userProfile]);

  // Sync biometric auth state
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        biometricAuth: isRegistered
      }
    }));
  }, [isRegistered]);

  // Typed settings update functions
  const updateRootSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateNestedSetting = <K extends keyof Settings>(
    category: K,
    subcategory: keyof Settings[K],
    value: Settings[K][keyof Settings[K]]
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [subcategory]: value
      }
    }));
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const startEdit = () => {
    setIsEditing(true);
    setTempProfile(userProfile);
  };

  const saveEdit = () => {
    setUserProfile(tempProfile);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setTempProfile(userProfile);
    setIsEditing(false);
  };

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setTempProfile(prev => ({ ...prev, profilePicture: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleStartTour = () => {
    localStorage.setItem('thryvin-onboarding-just-completed', 'true');
    localStorage.removeItem('thryvin-tutorial-completed');
    window.location.hash = '#/';
    window.location.reload();
  };

  const resetData = () => {
    if (confirm('Are you sure you want to reset all your data? This cannot be undone.')) {
      localStorage.clear();
      console.log('Data reset requested');
    }
  };

  // Settings sections configuration
  const settingsSections = [
    {
      id: 'appearance',
      title: 'Appearance & Display',
      icon: Monitor,
      color: 'from-purple-500 to-pink-500',
      items: [
        {
          label: 'Dark Mode',
          description: 'Switch between light and dark themes',
          type: 'toggle' as const,
          value: settings.theme === 'dark',
          onChange: (enabled: boolean) => updateRootSetting('theme', enabled ? 'dark' : 'light')
        },
        {
          label: 'Animations',
          description: 'Enable smooth transitions and effects',
          type: 'toggle' as const,
          value: settings.animations,
          onChange: (enabled: boolean) => updateRootSetting('animations', enabled)
        },
        {
          label: 'Font Size',
          description: 'Adjust text size throughout the app',
          type: 'select' as const,
          value: settings.fontSize,
          options: ['small', 'medium', 'large'],
          onChange: (value: string) => updateRootSetting('fontSize', value as 'small' | 'medium' | 'large')
        }
      ]
    },
    {
      id: 'units',
      title: 'Units & Measurements',
      icon: Ruler,
      color: 'from-blue-500 to-cyan-500',
      items: [
        {
          label: 'Weight',
          type: 'select' as const,
          value: settings.units.weight,
          options: ['lbs', 'kg'],
          onChange: (value: string) => updateNestedSetting('units', 'weight', value as 'lbs' | 'kg')
        },
        {
          label: 'Height',
          type: 'select' as const,
          value: settings.units.height,
          options: ['ft', 'cm'],
          onChange: (value: string) => updateNestedSetting('units', 'height', value as 'ft' | 'cm')
        },
        {
          label: 'Distance',
          type: 'select' as const,
          value: settings.units.distance,
          options: ['miles', 'km'],
          onChange: (value: string) => updateNestedSetting('units', 'distance', value as 'miles' | 'km')
        },
        {
          label: 'Calories',
          type: 'select' as const,
          value: settings.units.calories,
          options: ['kcal', 'kJ'],
          onChange: (value: string) => updateNestedSetting('units', 'calories', value as 'kcal' | 'kJ')
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications & Alerts',
      icon: Bell,
      color: 'from-green-500 to-emerald-500',
      items: [
        {
          label: 'Workout Reminders',
          description: 'Get reminded when it\'s time to work out',
          type: 'toggle' as const,
          value: settings.notifications.workoutReminders,
          onChange: (enabled: boolean) => updateNestedSetting('notifications', 'workoutReminders', enabled)
        },
        {
          label: 'Meal Reminders',
          description: 'Get reminded about meal times and logging',
          type: 'toggle' as const,
          value: settings.notifications.mealReminders,
          onChange: (enabled: boolean) => updateNestedSetting('notifications', 'mealReminders', enabled)
        },
        {
          label: 'Progress Updates',
          description: 'Weekly and monthly progress notifications',
          type: 'toggle' as const,
          value: settings.notifications.progressUpdates,
          onChange: (enabled: boolean) => updateNestedSetting('notifications', 'progressUpdates', enabled)
        },
        {
          label: 'Social Activity',
          description: 'Friend workouts and achievements',
          type: 'toggle' as const,
          value: settings.notifications.socialActivity,
          onChange: (enabled: boolean) => updateNestedSetting('notifications', 'socialActivity', enabled)
        },
        {
          label: 'Achievement Badges',
          description: 'Get notified when you earn new badges',
          type: 'toggle' as const,
          value: settings.notifications.achievements,
          onChange: (enabled: boolean) => updateNestedSetting('notifications', 'achievements', enabled)
        },
        {
          label: 'AI Coach Messages',
          description: 'Motivational messages and tips',
          type: 'toggle' as const,
          value: settings.notifications.coachMessages,
          onChange: (enabled: boolean) => updateNestedSetting('notifications', 'coachMessages', enabled)
        }
      ]
    },
    {
      id: 'coach',
      title: 'AI Coach Preferences',
      icon: MessageSquare,
      color: 'from-orange-500 to-red-500',
      items: [
        {
          label: 'Coaching Style',
          description: 'How your AI coach motivates you',
          type: 'select' as const,
          value: settings.coach.style,
          options: ['gentle', 'motivational', 'tough', 'analytical'],
          onChange: (value: string) => updateNestedSetting('coach', 'style', value as any)
        },
        {
          label: 'Message Frequency',
          description: 'How often your coach checks in',
          type: 'select' as const,
          value: settings.coach.frequency,
          options: ['minimal', 'balanced', 'frequent'],
          onChange: (value: string) => updateNestedSetting('coach', 'frequency', value as any)
        },
        {
          label: 'Voice Feedback',
          description: 'Hear your coach during workouts',
          type: 'toggle' as const,
          value: settings.coach.voiceFeedback,
          onChange: (enabled: boolean) => updateNestedSetting('coach', 'voiceFeedback', enabled)
        },
        {
          label: 'Real-time Tips',
          description: 'Get form tips during exercises',
          type: 'toggle' as const,
          value: settings.coach.realTimeTips,
          onChange: (enabled: boolean) => updateNestedSetting('coach', 'realTimeTips', enabled)
        }
      ]
    },
    {
      id: 'security',
      title: 'Security & Authentication',
      icon: Fingerprint,
      color: 'from-amber-500 to-orange-500',
      items: [
        {
          label: 'Biometric Authentication',
          description: isSupported ? 'Use Touch ID, Face ID, or fingerprint' : 'Not supported on this device',
          type: 'toggle' as const,
          value: settings.security.biometricAuth,
          disabled: !isSupported,
          onChange: async (enabled: boolean) => {
            if (enabled && !isRegistered) {
              await register();
            } else if (!enabled && isRegistered) {
              await disable();
            }
            updateNestedSetting('security', 'biometricAuth', enabled);
          }
        },
        {
          label: 'Two-Factor Authentication',
          description: 'Extra security for your account',
          type: 'toggle' as const,
          value: settings.security.twoFactor,
          onChange: (enabled: boolean) => updateNestedSetting('security', 'twoFactor', enabled)
        },
        {
          label: 'Session Timeout',
          description: 'Auto-logout after inactivity',
          type: 'select' as const,
          value: settings.security.sessionTimeout,
          options: ['15-min', '30-min', '1-hour', 'never'],
          onChange: (value: string) => updateNestedSetting('security', 'sessionTimeout', value)
        }
      ]
    }
  ];

  return (
    <div className="h-full bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-purple-100 px-6 py-4">
        <div className="flex items-center justify-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Profile & Settings
          </h1>
        </div>
      </div>

      {/* Editable Profile Section */}
      <motion.div
        className="mx-6 mt-6 mb-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-100 overflow-hidden relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Edit Button */}
        <div className="absolute top-4 right-4 z-10">
          {!isEditing ? (
            <motion.button
              onClick={startEdit}
              className="p-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 hover:from-purple-200 hover:to-pink-200 transition-all duration-200 shadow-md hover:shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              data-testid="button-edit-profile"
            >
              <Edit3 className="w-5 h-5" />
            </motion.button>
          ) : (
            <div className="flex items-center gap-2">
              <motion.button
                onClick={saveEdit}
                className="p-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-600 hover:from-green-200 hover:to-emerald-200 transition-all duration-200 shadow-md hover:shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                data-testid="button-save-profile"
              >
                <Save className="w-5 h-5" />
              </motion.button>
              <motion.button
                onClick={cancelEdit}
                className="p-2 rounded-full bg-gradient-to-r from-red-100 to-rose-100 text-red-600 hover:from-red-200 hover:to-rose-200 transition-all duration-200 shadow-md hover:shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                data-testid="button-cancel-edit"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          )}
        </div>

        {/* Profile Content */}
        <div className="p-6">
          {/* Profile Picture and Basic Info */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <motion.div
                className="w-24 h-24 rounded-full overflow-hidden border-4 border-purple-200 shadow-lg"
                whileHover={{ scale: 1.05 }}
              >
                <img
                  src={tempProfile.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </motion.div>
              {isEditing && (
                <motion.button
                  onClick={() => profileImageRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg shadow-purple-500/25"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  data-testid="button-upload-photo"
                >
                  <Camera className="w-4 h-4" />
                </motion.button>
              )}
              <input
                ref={profileImageRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className="hidden"
              />
            </div>
            
            <div className="flex-1">
              {isEditing ? (
                <input
                  value={tempProfile.name}
                  onChange={(e) => setTempProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full text-2xl font-bold text-purple-800 bg-purple-50 border-2 border-purple-200 rounded-lg p-3 focus:border-purple-400 outline-none"
                  placeholder="Your name"
                  data-testid="input-name"
                />
              ) : (
                <h2 className="text-2xl font-bold text-purple-800">{userProfile.name}</h2>
              )}
              <p className="text-purple-600 font-medium flex items-center gap-2">
                {userProfile.title}
              </p>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-gray-600">Level {userProfile.level}</p>
                <p className="text-sm text-gray-600">{userProfile.xpPoints} XP</p>
                {userWithMetrics && typeof userWithMetrics === 'object' && 'age' in userWithMetrics && userWithMetrics.age && (
                  <p className="text-sm text-gray-600">{userWithMetrics.age} years</p>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
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
                data-testid="input-bio"
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
              <span className="text-sm font-medium text-purple-600">Next Level Progress</span>
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

          {/* Body Metrics */}
          {(userWithMetrics && typeof userWithMetrics === 'object' && (('height' in userWithMetrics && userWithMetrics.height) || ('weight' in userWithMetrics && userWithMetrics.weight))) && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <Ruler className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Body Metrics</span>
                <span className="text-xs text-gray-500">From your onboarding</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {userWithMetrics && typeof userWithMetrics === 'object' && 'height' in userWithMetrics && userWithMetrics.height && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-700">{String(userWithMetrics.height)}</div>
                    <div className="text-xs text-gray-600">height</div>
                  </div>
                )}
                {userWithMetrics && typeof userWithMetrics === 'object' && 'weight' in userWithMetrics && userWithMetrics.weight && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-700">{String(userWithMetrics.weight)}</div>
                    <div className="text-xs text-gray-600">weight</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Settings Sections */}
      <div className="px-6 space-y-4">
        {settingsSections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="bg-white/80 backdrop-blur-sm rounded-xl border border-purple-100 overflow-hidden shadow-sm"
          >
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full p-4 flex items-center justify-between hover:bg-purple-50 transition-colors"
              data-testid={`button-expand-${section.id}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 bg-gradient-to-r ${section.color} rounded-lg flex items-center justify-center`}>
                  <section.icon className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-purple-800">{section.title}</span>
              </div>
              <motion.div
                animate={{ rotate: expandedSection === section.id ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </motion.div>
            </button>
            
            <AnimatePresence>
              {expandedSection === section.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="border-t border-purple-100"
                >
                  <div className="p-4 space-y-4">
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{item.label}</div>
                          {'description' in item && item.description && (
                            <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                          )}
                        </div>
                        <div className="ml-4">
                          {item.type === 'toggle' ? (
                            <ToggleSwitch
                              enabled={item.value as boolean}
                              onChange={item.onChange as (enabled: boolean) => void}
                            />
                          ) : item.type === 'select' ? (
                            <div className="flex bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-1 shadow-inner">
                              {item.options?.map((option) => (
                                <button
                                  key={option}
                                  onClick={() => item.onChange(option)}
                                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                                    item.value === option
                                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:shadow-lg transform scale-105'
                                      : 'text-gray-600 hover:text-purple-600 hover:bg-white/50'
                                  }`}
                                  data-testid={`button-${section.id}-${item.label.toLowerCase().replace(/\s+/g, '-')}-${option}`}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl border border-purple-100 overflow-hidden shadow-sm"
        >
          <div className="p-4">
            <h3 className="font-semibold text-purple-800 mb-4 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                <Settings className="w-3 h-3 text-white" />
              </div>
              Quick Actions
            </h3>
            <div className="space-y-3">
              <motion.button
                onClick={handleStartTour}
                className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 hover:from-blue-100 hover:to-cyan-100 transition-all duration-200 text-left shadow-sm hover:shadow-md"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                data-testid="button-restart-tour"
              >
                <RotateCcw className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-800">Restart App Tour</div>
                  <div className="text-xs text-blue-600">Learn about new features</div>
                </div>
              </motion.button>
              
              <motion.button
                onClick={resetData}
                className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200 hover:from-red-100 hover:to-orange-100 transition-all duration-200 text-left shadow-sm hover:shadow-md"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                data-testid="button-reset-data"
              >
                <Trash2 className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-medium text-red-800">Reset All Data</div>
                  <div className="text-xs text-red-600">Clear all progress and settings</div>
                </div>
              </motion.button>

              <motion.button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200 hover:from-gray-100 hover:to-slate-100 transition-all duration-200 text-left shadow-sm hover:shadow-md"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                data-testid="button-logout"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-800">Sign Out</div>
                  <div className="text-xs text-gray-600">Log out of your account</div>
                </div>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}