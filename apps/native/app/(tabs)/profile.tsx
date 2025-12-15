import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PINSetupModal } from '../../src/components/PINSetupModal';
import { EditProfileModal } from '../../src/components/EditProfileModal';
import { ResetProgramModal } from '../../src/components/ResetProgramModal';
import { BiometricsModal } from '../../src/components/BiometricsModal';
import { HelpFAQModal } from '../../src/components/HelpFAQModal';
import { LegalModal } from '../../src/components/LegalModal';
import { ViewAllWeeksModal } from '../../src/components/ViewAllWeeksModal';
import { CustomAlert } from '../../src/components/CustomAlert';
import { AdvancedQuestionnaireModal, AdvancedQuestionnaireData } from '../../src/components/AdvancedQuestionnaireModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../src/stores/auth-store';
import { useWorkoutStore } from '../../src/stores/workout-store';
import { useCoachStore, COACH_PERSONALITIES, CoachPersonality } from '../../src/stores/coach-store';

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
      trackColor={{ false: COLORS.lightGray, true: COLORS.accentSecondary }}
      thumbColor={value ? COLORS.accent : COLORS.mediumGray}
      ios_backgroundColor={COLORS.lightGray}
    />
  </View>
);

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { resetProgram, stats } = useWorkoutStore();
  const { coachName, coachPersonality, setCoachPersonality, loadCoachSettings } = useCoachStore();
  
  // Modal states
  const [showPINSetup, setShowPINSetup] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showResetProgram, setShowResetProgram] = useState(false);
  const [showBiometrics, setShowBiometrics] = useState(false);
  const [showHelpFAQ, setShowHelpFAQ] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showAllWeeks, setShowAllWeeks] = useState(false);
  const [showAdvancedQuestionnaire, setShowAdvancedQuestionnaire] = useState(false);
  const [hasCompletedQuestionnaire, setHasCompletedQuestionnaire] = useState(false);
  const [showCoachPersonality, setShowCoachPersonality] = useState(false);
  
  // Settings states (persisted)
  const [notifications, setNotifications] = useState(true);
  const [workoutReminders, setWorkoutReminders] = useState(true);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [hasPinSet, setHasPinSet] = useState(false);
  
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
  
  // Load coach settings
  useEffect(() => {
    loadCoachSettings();
  }, []);
  
  // Load persisted settings
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      // Use user-specific keys to avoid data leaking between accounts
      const userId = user?.id;
      if (!userId) {
        // No user logged in, reset to defaults
        setProfileImage(null);
        setBio('');
        setUserName('User');
        setHasCompletedQuestionnaire(false);
        setHasPinSet(false);
        setPinEnabled(false);
        setBiometricsEnabled(false);
        return;
      }
      
      // Load user-specific settings
      const savedNotifications = await AsyncStorage.getItem(`notifications_enabled_${userId}`);
      const savedReminders = await AsyncStorage.getItem(`workout_reminders_${userId}`);
      const savedImage = await AsyncStorage.getItem(`profile_image_${userId}`);
      const savedBio = await AsyncStorage.getItem(`user_bio_${userId}`);
      const advancedQuestionnaire = await AsyncStorage.getItem(`advancedQuestionnaire_${userId}`);
      const savedPin = await AsyncStorage.getItem(`user_pin_${userId}`);
      const savedPinEnabled = await AsyncStorage.getItem(`pin_enabled_${userId}`);
      const savedBiometrics = await AsyncStorage.getItem(`biometrics_enabled_${userId}`);
      
      // Also check global keys for backward compatibility
      const globalImage = await AsyncStorage.getItem('user_profile_image');
      const globalBio = await AsyncStorage.getItem('user_bio');
      const globalName = await AsyncStorage.getItem('user_name');
      const globalQuestionnaire = await AsyncStorage.getItem('advancedQuestionnaire');
      
      if (savedNotifications !== null) setNotifications(savedNotifications === 'true');
      if (savedReminders !== null) setWorkoutReminders(savedReminders === 'true');
      
      // Prefer user-specific data, fall back to global only if it belongs to this user
      if (savedImage) {
        setProfileImage(savedImage);
      } else {
        // Don't use global image - it belongs to another user
        setProfileImage(null);
      }
      
      if (savedBio) {
        setBio(savedBio);
      } else {
        setBio('');
      }
      
      // Always use the user's name from the auth store
      setUserName(user?.name || 'User');
      
      if (advancedQuestionnaire || globalQuestionnaire) setHasCompletedQuestionnaire(true);
      if (savedPin) setHasPinSet(true);
      if (savedPinEnabled !== null) setPinEnabled(savedPinEnabled === 'true');
      if (savedBiometrics !== null) setBiometricsEnabled(savedBiometrics === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleQuestionnaireComplete = async (data: AdvancedQuestionnaireData) => {
    console.log('Advanced Questionnaire completed from profile:', data);
    setShowAdvancedQuestionnaire(false);
    setHasCompletedQuestionnaire(true);
    
    showAlert({
      type: 'success',
      title: 'Preferences Saved',
      message: 'Your advanced preferences have been saved. Your workouts will be even more personalized!',
      buttons: [{ text: 'OK', onPress: hideAlert }]
    });
  };
  
  const toggleNotifications = async () => {
    const newValue = !notifications;
    setNotifications(newValue);
    await AsyncStorage.setItem('notifications_enabled', newValue.toString());
    
    if (newValue) {
      showAlert({
        type: 'success',
        title: 'Notifications Enabled',
        message: "You'll receive updates about your workouts and achievements!",
        buttons: [{ text: 'OK', onPress: hideAlert }]
      });
    }
  };
  
  const toggleWorkoutReminders = async () => {
    const newValue = !workoutReminders;
    setWorkoutReminders(newValue);
    await AsyncStorage.setItem('workout_reminders_enabled', newValue.toString());
    
    if (newValue) {
      showAlert({
        type: 'success',
        title: 'Reminders Enabled',
        message: "You'll get daily reminders to stay on track with your workouts!",
        buttons: [{ text: 'OK', onPress: hideAlert }]
      });
    }
  };
  
  const togglePinEnabled = async () => {
    if (!hasPinSet) {
      // No PIN set yet, open PIN setup
      setShowPINSetup(true);
      return;
    }
    
    const newValue = !pinEnabled;
    setPinEnabled(newValue);
    await AsyncStorage.setItem('pin_enabled', newValue.toString());
    
    showAlert({
      type: 'success',
      title: newValue ? 'PIN Login Enabled' : 'PIN Login Disabled',
      message: newValue 
        ? 'You can now use your PIN code to log in quickly!' 
        : 'PIN login has been disabled. You\'ll use your password instead.',
      buttons: [{ text: 'OK', onPress: hideAlert }]
    });
  };
  
  const toggleBiometrics = async () => {
    const newValue = !biometricsEnabled;
    setBiometricsEnabled(newValue);
    await AsyncStorage.setItem('biometrics_enabled', newValue.toString());
    
    if (newValue) {
      showAlert({
        type: 'success',
        title: 'Biometric Login Enabled',
        message: 'You can now use Face ID / Touch ID for quick and secure login!',
        buttons: [{ text: 'OK', onPress: hideAlert }]
      });
    } else {
      showAlert({
        type: 'info',
        title: 'Biometric Login Disabled',
        message: 'Biometric login has been turned off.',
        buttons: [{ text: 'OK', onPress: hideAlert }]
      });
    }
  };

  const handlePinSetupComplete = async (pin: string) => {
    await AsyncStorage.setItem('user_pin', pin);
    await AsyncStorage.setItem('pin_enabled', 'true');
    setHasPinSet(true);
    setPinEnabled(true);
    setShowPINSetup(false);
    
    showAlert({
      type: 'success',
      title: 'PIN Code Set!',
      message: 'Your 6-digit PIN has been saved. You can now use it for quick login!',
      buttons: [{ text: 'OK', onPress: hideAlert }]
    });
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
    showAlert({
      type: 'warning',
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: hideAlert },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            hideAlert();
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        },
      ]
    });
  };

  const handleDeleteAccount = () => {
    showAlert({
      type: 'error',
      title: 'Delete Account',
      message: 'This action cannot be undone. All your data will be permanently deleted.',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: hideAlert },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            hideAlert();
            setTimeout(() => {
              showAlert({
                type: 'error',
                title: 'Confirm Deletion',
                message: 'Are you absolutely sure? This will permanently delete all your workout data.',
                buttons: [
                  { text: 'Cancel', style: 'cancel', onPress: hideAlert },
                  { 
                    text: 'Delete Forever', 
                    style: 'destructive', 
                    onPress: async () => {
                      hideAlert();
                      await AsyncStorage.clear();
                      showAlert({
                        type: 'info',
                        title: 'Account Deleted',
                        message: 'Your account has been deleted.',
                        buttons: [{ text: 'OK', onPress: async () => { hideAlert(); await logout(); } }]
                      });
                    }
                  },
                ]
              });
            }, 300);
          }
        },
      ]
    });
  };

  const handleStartTour = async () => {
    try {
      await AsyncStorage.removeItem('onboarding_tour_completed');
      await AsyncStorage.setItem('tour_trigger', 'true');
      
      showAlert({
        type: 'success',
        title: 'App Tour Ready! 🎉',
        message: 'Navigate to the Home tab and the tour will start automatically!',
        buttons: [{ text: 'Got it!', onPress: hideAlert }]
      });
    } catch (error) {
      console.error('Error starting tour:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Could not start tour. Please try again.',
        buttons: [{ text: 'OK', onPress: hideAlert }]
      });
    }
  };
  
  const handleRateApp = () => {
    showAlert({
      type: 'info',
      title: 'Rate Thryvin ⭐',
      message: 'Loving the app? Your review helps us grow and improve!',
      buttons: [
        { text: 'Maybe Later', style: 'cancel', onPress: hideAlert },
        { 
          text: 'Rate Now', 
          onPress: () => {
            hideAlert();
            setTimeout(() => {
              showAlert({
                type: 'success',
                title: 'Thank You! 🙏',
                message: 'App store rating will be available soon. We appreciate your support!',
                buttons: [{ text: 'OK', onPress: hideAlert }]
              });
            }, 300);
          }
        },
      ]
    });
  };
  
  const handleContactSupport = () => {
    Linking.openURL('mailto:support@thryvin.app?subject=Support%20Request%20-%20Thryvin%20App');
  };
  
  const handleProfileSave = async () => {
    await loadSettings(); // Reload to get updated profile data
    showAlert({
      type: 'success',
      title: 'Profile Updated!',
      message: 'Your profile changes have been saved.',
      buttons: [{ text: 'OK', onPress: hideAlert }]
    });
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
              icon="sparkles"
              title="Advanced Questionnaire"
              subtitle={hasCompletedQuestionnaire ? 'Edit your preferences' : 'Personalize your workouts'}
              onPress={() => setShowAdvancedQuestionnaire(true)}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.menuContainer}>
            {/* PIN Code Section */}
            <View style={styles.securityItem}>
              <MenuButton
                icon="keypad"
                title={hasPinSet ? "Change PIN Code" : "Set PIN Code"}
                subtitle={hasPinSet ? "Update your 6-digit PIN" : "Quick login with 6-digit PIN"}
                onPress={() => setShowPINSetup(true)}
              />
              {hasPinSet && (
                <View style={styles.toggleOverlay}>
                  <Switch
                    value={pinEnabled}
                    onValueChange={togglePinEnabled}
                    trackColor={{ false: COLORS.lightGray, true: COLORS.accentSecondary }}
                    thumbColor={pinEnabled ? COLORS.accent : COLORS.mediumGray}
                    ios_backgroundColor={COLORS.lightGray}
                  />
                </View>
              )}
            </View>
            
            {/* Biometrics Section */}
            <SettingToggle
              icon="finger-print"
              title="Biometric Login"
              subtitle="Use Face ID / Touch ID"
              value={biometricsEnabled}
              onToggle={toggleBiometrics}
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
              icon="person-circle"
              title="Coach Style"
              subtitle={`Current: ${COACH_PERSONALITIES.find(p => p.id === coachPersonality)?.name || 'Friendly'}`}
              onPress={() => setShowCoachPersonality(true)}
            />
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
      <PINSetupModal
        visible={showPINSetup}
        onClose={() => setShowPINSetup(false)}
        onComplete={handlePinSetupComplete}
        isChangingPin={hasPinSet}
      />
      
      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        onSave={handleProfileSave}
      />
      
      <ResetProgramModal
        visible={showResetProgram}
        onClose={() => setShowResetProgram(false)}
        onReset={() => {}}
      />
      
      <BiometricsModal
        visible={showBiometrics}
        onClose={() => setShowBiometrics(false)}
        onSuccess={() => {
          setBiometricsEnabled(true);
          showAlert({
            type: 'success',
            title: 'Biometrics Enabled!',
            message: 'You can now use biometric login for quick access.',
            buttons: [{ text: 'Great!', onPress: hideAlert }]
          });
        }}
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
      
      <AdvancedQuestionnaireModal
        visible={showAdvancedQuestionnaire}
        onClose={() => setShowAdvancedQuestionnaire(false)}
        onComplete={handleQuestionnaireComplete}
      />
      
      {/* Coach Personality Modal */}
      <Modal
        visible={showCoachPersonality}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCoachPersonality(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.personalityModal}>
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={styles.personalityModalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setShowCoachPersonality(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
              <Ionicons name="person-circle" size={48} color={COLORS.white} />
              <Text style={styles.personalityModalTitle}>Coach Style</Text>
              <Text style={styles.personalityModalSubtitle}>
                Choose how {coachName} talks to you
              </Text>
            </LinearGradient>
            
            <ScrollView style={styles.personalityOptions}>
              {COACH_PERSONALITIES.map((personality) => (
                <TouchableOpacity
                  key={personality.id}
                  style={[
                    styles.personalityOption,
                    coachPersonality === personality.id && styles.personalityOptionActive,
                  ]}
                  onPress={() => {
                    setCoachPersonality(personality.id);
                    setShowCoachPersonality(false);
                    showAlert({
                      type: 'success',
                      title: 'Coach Style Updated!',
                      message: `${coachName} will now be ${personality.name.toLowerCase()}.`,
                      buttons: [{ text: 'Got it!', onPress: hideAlert }]
                    });
                  }}
                >
                  <View style={styles.personalityOptionContent}>
                    <View style={[
                      styles.personalityCheck,
                      coachPersonality === personality.id && styles.personalityCheckActive,
                    ]}>
                      {coachPersonality === personality.id && (
                        <Ionicons name="checkmark" size={16} color={COLORS.white} />
                      )}
                    </View>
                    <View style={styles.personalityInfo}>
                      <Text style={[
                        styles.personalityName,
                        coachPersonality === personality.id && styles.personalityNameActive,
                      ]}>
                        {personality.name}
                      </Text>
                      <Text style={styles.personalityDescription}>
                        {personality.description}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons || [{ text: 'OK', onPress: hideAlert }]}
        onClose={hideAlert}
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
  securityItem: {
    position: 'relative',
  },
  toggleOverlay: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 10,
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