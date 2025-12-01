import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PINSetup } from '../../src/components/PINSetup';
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
  const { user } = useAuthStore();
  const { resetProgram } = useWorkoutStore();
  // Stats will come from a future stats-store implementation
  const totalWorkouts = 0;
  const totalMinutes = 0;
  const currentStreak = 0;
  const [notifications, setNotifications] = useState(true);
  const [workoutReminders, setWorkoutReminders] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [showPINSetup, setShowPINSetup] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  // Compute profile data from stores
  const profileData = {
    name: user?.name || 'User',
    email: user?.email || 'user@example.com',
    level: user?.experience || 'Beginner',
    joinDate: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently',
    workoutsCompleted: totalWorkouts || 0,
    totalMinutes: totalMinutes || 0,
    currentStreak: currentStreak || 0,
    nextGoal: user?.goal || 'Get fit',
  };

  const handleResetProgram = () => {
    Alert.alert(
      'Reset Program',
      'This will clear your current workout program and generate a fresh one. Your completed workout history will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive', 
          onPress: async () => {
            setIsResetting(true);
            try {
              await resetProgram();
              Alert.alert('Success', 'Your workout program has been reset!');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset program. Please try again.');
            }
            setIsResetting(false);
          }
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => console.log('Logout') },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete account') },
      ]
    );
  };

  const handleStartTour = async () => {
    try {
      // Clear the tour completion flag
      await AsyncStorage.removeItem('onboarding_tour_completed');
      // Set a flag to trigger tour immediately
      await AsyncStorage.setItem('tour_trigger', 'true');
      
      Alert.alert(
        'App Tour Ready! 🎉',
        'Navigate to the Home tab and the tour will start automatically!',
        [
          { 
            text: 'Got it!', 
            style: 'default',
          }
        ]
      );
    } catch (error) {
      console.error('Error starting tour:', error);
      Alert.alert('Error', 'Could not start tour. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="create" size={20} color={COLORS.accent} />
        </TouchableOpacity>
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
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profileData.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{profileData.name}</Text>
                <Text style={styles.profileEmail}>{profileData.email}</Text>
                <Text style={styles.profileLevel}>{profileData.level} • Since {profileData.joinDate}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profileData.workoutsCompleted}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(profileData.totalMinutes / 60)}h</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profileData.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuContainer}>
            <MenuButton
              icon="person"
              title="Edit Profile"
              subtitle="Update your personal information"
              onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available in the next update!')}
            />
            <MenuButton
              icon="fitness"
              title="Workout Preferences"
              subtitle="Customize your training settings"
              onPress={() => Alert.alert('Coming Soon', 'Workout preferences will be available soon!')}
            />
            <MenuButton
              icon="trophy"
              title="Goals & Progress"
              subtitle={profileData.nextGoal}
              onPress={() => Alert.alert('Coming Soon', 'Goals tracking will be available soon!')}
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
              onPress={() => Alert.alert('Coming Soon', 'Biometric authentication will be available soon!')}
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
              onToggle={() => setNotifications(!notifications)}
            />
            <SettingToggle
              icon="alarm"
              title="Workout Reminders"
              subtitle="Daily reminders to stay on track"
              value={workoutReminders}
              onToggle={() => setWorkoutReminders(!workoutReminders)}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Program</Text>
          <View style={styles.menuContainer}>
            <MenuButton
              icon="refresh"
              title="Reset Program"
              subtitle="Generate a fresh workout program"
              onPress={handleResetProgram}
            />
            <MenuButton
              icon="calendar"
              title="View All Weeks"
              subtitle="See your upcoming workout schedule"
              onPress={() => Alert.alert('Coming Soon', 'Week overview will be available soon!')}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Privacy & Data</Text>
          <View style={styles.menuContainer}>
            <SettingToggle
              icon="analytics"
              title="Share Analytics"
              subtitle="Help improve the app with anonymous data"
              value={analytics}
              onToggle={() => setAnalytics(!analytics)}
            />
            <MenuButton
              icon="shield"
              title="Privacy Policy"
              onPress={() => Alert.alert('Coming Soon', 'Privacy policy will be available soon!')}
            />
            <MenuButton
              icon="document-text"
              title="Terms of Service"
              onPress={() => Alert.alert('Coming Soon', 'Terms of service will be available soon!')}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuContainer}>
            <MenuButton
              icon="help-circle"
              title="Help & FAQ"
              onPress={() => Alert.alert('Coming Soon', 'Help center will be available soon!')}
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
              onPress={() => Alert.alert('Coming Soon', 'Support channels will be available soon!')}
            />
            <MenuButton
              icon="star"
              title="Rate Thryvin"
              subtitle="Love the app? Leave us a review!"
              onPress={() => Alert.alert('Coming Soon', 'App store ratings will be enabled soon!')}
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

      {/* PIN Setup Modal */}
      <PINSetup
        visible={showPINSetup}
        onClose={() => setShowPINSetup(false)}
        onSuccess={() => {
          setShowPINSetup(false);
          Alert.alert('Success', 'PIN has been set successfully!');
        }}
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
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.accent,
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
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 32,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 16,
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