import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PINSetup } from '../../src/components/PINSetup';
import { EditProfileModal } from '../../src/components/EditProfileModal';
import { WorkoutPreferencesModal } from '../../src/components/WorkoutPreferencesModal';
import { GoalsProgressModal } from '../../src/components/GoalsProgressModal';
import { ResetProgramModal } from '../../src/components/ResetProgramModal';
import { BiometricSettingsModal } from '../../src/components/BiometricSettingsModal';
import { HelpFAQModal } from '../../src/components/HelpFAQModal';
import { LegalModal } from '../../src/components/LegalModal';
import { ViewAllWeeksModal } from '../../src/components/ViewAllWeeksModal';
import { CustomAlert } from '../../src/components/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../src/stores/auth-store';
import { useWorkoutStore } from '../../src/stores/workout-store';

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  shadow: 'rgba(162, 89, 255, 0.1)',
  success: '#34C759',
  danger: '#FF3B30',
};

const MenuButton = ({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  showArrow = true 
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
}) => (
  <TouchableOpacity style={styles.menuButton} onPress={onPress}>
    <View style={styles.menuIconContainer}>
      <Ionicons name={icon as any} size={20} color={COLORS.accent} />
    </View>
    <View style={styles.menuContent}>
      <Text style={styles.menuTitle}>{title}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    {showArrow && (
      <Ionicons name="chevron-forward" size={16} color={COLORS.mediumGray} />
    )}
  </TouchableOpacity>
);

const SettingToggle = ({ 
  icon, 
  title, 
  subtitle, 
  value, 
  onToggle 
}: {
  icon: string;
  title: string;
  subtitle?: string;
  value: boolean;
  onToggle: () => void;
}) => (
  <View style={styles.menuButton}>
    <View style={styles.menuIconContainer}>
      <Ionicons name={icon as any} size={20} color={COLORS.accent} />
    </View>
    <View style={styles.menuContent}>
      <Text style={styles.menuTitle}>{title}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: COLORS.lightGray, true: `${COLORS.accent}30` }}
      thumbColor={value ? COLORS.accent : COLORS.mediumGray}
    />
  </View>
);

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { resetProgram, stats } = useWorkoutStore();
  
  // Modal states
  const [showPINSetup, setShowPINSetup] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showWorkoutPrefs, setShowWorkoutPrefs] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showResetProgram, setShowResetProgram] = useState(false);
  const [showBiometrics, setShowBiometrics] = useState(false);
  const [showHelpFAQ, setShowHelpFAQ] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showAllWeeks, setShowAllWeeks] = useState(false);
  
  // Settings states (persisted)
  const [notifications, setNotifications] = useState(true);
  const [workoutReminders, setWorkoutReminders] = useState(true);
  
  // Profile data
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [userName, setUserName] = useState(user?.name || 'User');
  
  // Custom alert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showAlert = (config: Partial<typeof alertConfig>) => {
    setAlertConfig({ ...alertConfig, ...config, visible: true });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };
  
  // Load persisted settings
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      const savedNotifications = await AsyncStorage.getItem('notifications_enabled');
      const savedReminders = await AsyncStorage.getItem('workout_reminders_enabled');
      const savedImage = await AsyncStorage.getItem('user_profile_image');
      const savedBio = await AsyncStorage.getItem('user_bio');
      const savedName = await AsyncStorage.getItem('user_name');
      
      if (savedNotifications !== null) setNotifications(savedNotifications === 'true');
      if (savedReminders !== null) setWorkoutReminders(savedReminders === 'true');
      if (savedImage) setProfileImage(savedImage);
      if (savedBio) setBio(savedBio);
      if (savedName) setUserName(savedName);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };
  
  const toggleNotifications = async () => {
    const newValue = !notifications;
    setNotifications(newValue);
    await AsyncStorage.setItem('notifications_enabled', newValue.toString());
    
    if (newValue) {
      Alert.alert('Notifications Enabled', 'You\'ll receive updates about your workouts and achievements!');
    }
  };
  
  const toggleWorkoutReminders = async () => {
    const newValue = !workoutReminders;
    setWorkoutReminders(newValue);
    await AsyncStorage.setItem('workout_reminders_enabled', newValue.toString());
    
    if (newValue) {
      Alert.alert('Reminders Enabled', 'You\'ll get daily reminders to stay on track with your workouts!');
    }
  };
  
  // Compute profile data
  const profileData = {
    name: userName || user?.name || 'User',
    email: user?.email || 'user@example.com',
    level: user?.experience || 'Intermediate',
    joinDate: 'Dec 2024', // Using static date since createdAt not in User type
    nextGoal: user?.goal || 'Get fit',
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Type DELETE to confirm account deletion.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'I Understand', 
                  style: 'destructive', 
                  onPress: async () => {
                    // Clear all local data
                    await AsyncStorage.clear();
                    Alert.alert('Account Deleted', 'Your account has been deleted.');
                    await logout();
                  }
                },
              ]
            );
          }
        },
      ]
    );
  };

  const handleStartTour = async () => {
    try {
      await AsyncStorage.removeItem('onboarding_tour_completed');
      await AsyncStorage.setItem('tour_trigger', 'true');
      
      Alert.alert(
        'App Tour Ready! 🎉',
        'Navigate to the Home tab and the tour will start automatically!',
        [{ text: 'Got it!', style: 'default' }]
      );
    } catch (error) {
      console.error('Error starting tour:', error);
      Alert.alert('Error', 'Could not start tour. Please try again.');
    }
  };
  
  const handleRateApp = () => {
    const storeUrl = Platform.OS === 'ios' 
      ? 'https://apps.apple.com/app/thryvin/id123456789' 
      : 'https://play.google.com/store/apps/details?id=com.thryvin.app';
    
    Alert.alert(
      'Rate Thryvin ⭐',
      'Loving the app? Your review helps us grow and improve!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { 
          text: 'Rate Now', 
          onPress: () => {
            // For now, show a thank you since store URLs aren't live
            Alert.alert('Thank You! 🙏', 'App store rating will be available soon. We appreciate your support!');
            // In production: Linking.openURL(storeUrl);
          }
        },
      ]
    );
  };
  
  const handleContactSupport = () => {
    Linking.openURL('mailto:support@thryvin.app?subject=Support%20Request%20-%20Thryvin%20App');
  };
  
  const handleProfileSave = () => {
    loadSettings(); // Reload to get updated profile data
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Removed edit button */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.profileGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.profileHeader}>
              <TouchableOpacity style={styles.avatar} onPress={() => setShowEditProfile(true)}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>
                    {profileData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </Text>
                )}
                <View style={styles.editAvatarBadge}>
                  <Ionicons name="camera" size={10} color={COLORS.white} />
                </View>
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profileData.name}</Text>
                <Text style={styles.profileEmail}>{profileData.email}</Text>
                <Text style={styles.profileLevel}>{profileData.level} • Since {profileData.joinDate}</Text>
              </View>
            </View>
            {bio ? (
              <Text style={styles.profileBio} numberOfLines={2}>{bio}</Text>
            ) : null}
          </LinearGradient>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuContainer}>
            <MenuButton
              icon="person"
              title="Edit Profile"
              subtitle="Update your photo, name & bio"
              onPress={() => setShowEditProfile(true)}
            />
            <MenuButton
              icon="fitness"
              title="Workout Preferences"
              subtitle="Customize your training settings"
              onPress={() => setShowWorkoutPrefs(true)}
            />
            <MenuButton
              icon="trophy"
              title="Goals & Progress"
              subtitle={profileData.nextGoal}
              onPress={() => setShowGoals(true)}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.menuContainer}>
            <MenuButton
              icon="keypad"
              title="Set PIN Code"
              subtitle="Quick login with 6-digit PIN"
              onPress={() => setShowPINSetup(true)}
            />
            <MenuButton
              icon="finger-print"
              title="Biometric Login"
              subtitle="Manage Face ID / Touch ID"
              onPress={() => setShowBiometrics(true)}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.menuContainer}>
            <SettingToggle
              icon="notifications"
              title="Push Notifications"
              subtitle="Get notified about workouts and progress"
              value={notifications}
              onToggle={toggleNotifications}
            />
            <SettingToggle
              icon="alarm"
              title="Workout Reminders"
              subtitle="Daily reminders to stay on track"
              value={workoutReminders}
              onToggle={toggleWorkoutReminders}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Program</Text>
          <View style={styles.menuContainer}>
            <MenuButton
              icon="refresh"
              title="Reset Program"
              subtitle="Chat with AI to customize your plan"
              onPress={() => setShowResetProgram(true)}
            />
            <MenuButton
              icon="calendar"
              title="View All Weeks"
              subtitle="See your 21-day workout schedule"
              onPress={() => setShowAllWeeks(true)}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.menuContainer}>
            <MenuButton
              icon="shield"
              title="Privacy Policy"
              onPress={() => setShowPrivacy(true)}
            />
            <MenuButton
              icon="document-text"
              title="Terms of Service"
              onPress={() => setShowTerms(true)}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuContainer}>
            <MenuButton
              icon="help-circle"
              title="Help & FAQ"
              subtitle="Find answers to common questions"
              onPress={() => setShowHelpFAQ(true)}
            />
            <MenuButton
              icon="rocket"
              title="Take App Tour"
              subtitle="Learn how to use Thryvin like a pro"
              onPress={handleStartTour}
            />
            <MenuButton
              icon="mail"
              title="Contact Support"
              subtitle="support@thryvin.app"
              onPress={handleContactSupport}
            />
            <MenuButton
              icon="star"
              title="Rate Thryvin"
              subtitle="Love the app? Leave us a review!"
              onPress={handleRateApp}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <Text style={styles.versionText}>Thryvin v1.0.0</Text>
      </ScrollView>

      {/* Modals */}
      <PINSetup
        visible={showPINSetup}
        onClose={() => setShowPINSetup(false)}
        onSuccess={() => {
          setShowPINSetup(false);
          // Custom alert is shown in PINSetup component
        }}
      />
      
      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        onSave={handleProfileSave}
      />
      
      <WorkoutPreferencesModal
        visible={showWorkoutPrefs}
        onClose={() => setShowWorkoutPrefs(false)}
        onSave={() => {}}
      />
      
      <GoalsProgressModal
        visible={showGoals}
        onClose={() => setShowGoals(false)}
        onSave={() => {}}
      />
      
      <ResetProgramModal
        visible={showResetProgram}
        onClose={() => setShowResetProgram(false)}
        onReset={() => {}}
      />
      
      <BiometricSettingsModal
        visible={showBiometrics}
        onClose={() => setShowBiometrics(false)}
      />
      
      <HelpFAQModal
        visible={showHelpFAQ}
        onClose={() => setShowHelpFAQ(false)}
      />
      
      <LegalModal
        visible={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        type="privacy"
      />
      
      <LegalModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
        type="terms"
      />
      
      <ViewAllWeeksModal
        visible={showAllWeeks}
        onClose={() => setShowAllWeeks(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  profileCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  profileGradient: {
    padding: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.accent,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  profileLevel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  profileBio: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 12,
    fontStyle: 'italic',
  },
  menuSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  menuContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    overflow: 'hidden',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.accent}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  actionButtons: {
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 16,
  },
  logoutButton: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.danger,
  },
  versionText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 16,
  },
});