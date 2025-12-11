import React, { useState, useEffect, useRef } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput as RNTextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth-store';
import { CustomAlert } from '../../src/components/CustomAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { COLORS as THEME_COLORS } from '../../src/constants/colors';

const COLORS = {
  accent: THEME_COLORS.gradientStart, // #A22BF6
  accentSecondary: THEME_COLORS.gradientEnd, // #FF4EC7
  white: THEME_COLORS.white,
  text: THEME_COLORS.text,
  lightGray: THEME_COLORS.lightGray,
  mediumGray: THEME_COLORS.mediumGray,
  shadow: THEME_COLORS.cardShadow,
  error: THEME_COLORS.danger,
  gradientStart: THEME_COLORS.gradientStart, // Purple
  gradientEnd: THEME_COLORS.gradientEnd, // Pink
};

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
  // CustomAlert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
  }>({ visible: false, type: 'info', title: '', message: '' });
  
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, buttons?: any[]) => {
    setAlertConfig({ visible: true, type, title, message, buttons });
  };
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkBiometricStatus();
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle pulse animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const enabled = await SecureStore.getItemAsync('biometric_enabled');
      
      setBiometricAvailable(compatible && enrolled);
      setBiometricEnabled(enabled === 'true');
    } catch (error) {
      console.error('Biometric check failed:', error);
    }
  };

  const createTestAccount = async () => {
    try {
      // Quick login with test@example.com account (already exists in backend)
      await login({ 
        email: 'test@example.com', 
        password: 'password123' 
      });
      return; // Exit early after successful login
      
      /* OLD CODE - REPLACED WITH DIRECT LOGIN
      // Create a fake test account with random onboarding data
      const testAccount = {
        id: Math.floor(Math.random() * 10000),
        email: 'test@thryvin.com',
        password: 'test123',
        name: 'Test User',
        // Random onboarding selections
        fitnessGoals: [['build-muscle', 'get-stronger', 'lose-weight', 'improve-endurance'][Math.floor(Math.random() * 4)]],
        goal: ['build-muscle', 'get-stronger', 'lose-weight', 'improve-endurance'][Math.floor(Math.random() * 4)],
        experience: ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)],
        trainingType: ['Strength Training', 'Calisthenics', 'Bodybuilding', 'Powerlifting'][Math.floor(Math.random() * 4)],
        trainingDays: (Math.floor(Math.random() * 4) + 3).toString(), // 3-6 days
        sessionDuration: ['30', '45', '60', '90'][Math.floor(Math.random() * 4)],
        equipment: ['gym', 'home', 'minimal'],
        injuries: [],
        preferredTime: ['morning', 'afternoon', 'evening'][Math.floor(Math.random() * 3)],
      };

      // Web-compatible storage fallback
      const setStorageItem = async (key: string, value: string) => {
        try {
          await SecureStore.setItemAsync(key, value);
        } catch (error) {
          // Fallback to localStorage for web
          if (typeof window !== 'undefined') {
            localStorage.setItem(key, value);
          }
        }
      };

      // Save to storage
      await setStorageItem('user_email', testAccount.email);
      await setStorageItem('user_password', testAccount.password);
      await setStorageItem('auth_user', JSON.stringify(testAccount));
      
      console.log('Test account created with random selections:', testAccount);
      
      // Auto-login with correct credentials format
      await login({ email: testAccount.email, password: testAccount.password });
      router.replace('/(tabs)');
      */
    } catch (error) {
      console.error('Error with test login:', error);
      showAlert('error', 'Error', 'Failed to login with test account');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('warning', 'Error', 'Please enter email and password');
      return;
    }
    
    try {
      await login({ email, password });
      router.replace('/(tabs)');
    } catch (error) {
      showAlert('error', 'Login Failed', error instanceof Error ? error.message : 'Invalid credentials');
    }
  };

  const handleStartJourney = () => {
    router.push('/(auth)/onboarding');
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Log in to Thryvin',
        fallbackLabel: 'Use Password',
      });

      if (result.success) {
        const storedEmail = await SecureStore.getItemAsync('user_email');
        const storedPassword = await SecureStore.getItemAsync('user_password');
        
        if (storedEmail && storedPassword) {
          await login({ email: storedEmail, password: storedPassword });
          router.replace('/(tabs)');
        } else {
          showAlert('warning', 'Error', 'No saved credentials found. Please log in with email and password.');
        }
      }
    } catch (error) {
      showAlert('error', 'Authentication Failed', 'Please try again or use password');
    }
  };

  return (
    <View style={styles.container}>
      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
      
      {/* Full Gradient Background */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Elevated Card Container */}
            <Animated.View 
              style={[
                styles.cardContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <LinearGradient
                colors={[COLORS.white, COLORS.white]}
                style={styles.card}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Logo in Card */}
                <View style={styles.cardLogoContainer}>
                  <Image 
                    source={require('../../assets/images/thryvin-logo-final.png')}
                    style={styles.cardLogo}
                    resizeMode="contain"
                  />
                </View>

                {/* Welcome Text - CENTERED */}
                <View style={styles.welcomeContainer}>
                  <Text style={styles.welcomeTitle}>Welcome Back 👋</Text>
                  <Text style={styles.welcomeSubtitle}>Ready to crush your goals?</Text>
                </View>

                {/* Login Form */}
                <View style={styles.formContainer}>
                  {/* Email Input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="mail-outline" size={20} color={COLORS.accent} />
                    </View>
                    <RNTextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor={COLORS.mediumGray}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="lock-closed-outline" size={20} color={COLORS.accent} />
                    </View>
                    <RNTextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="Password"
                      placeholderTextColor={COLORS.mediumGray}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity 
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-outline" : "eye-off-outline"} 
                        size={20} 
                        color={COLORS.mediumGray} 
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Login Button */}
                  <TouchableOpacity 
                    style={styles.loginButton} 
                    onPress={handleLogin}
                    disabled={isLoading || !email || !password}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[COLORS.accent, COLORS.accentSecondary]}
                      style={styles.gradientButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {isLoading ? (
                        <Text style={styles.buttonText}>Logging in...</Text>
                      ) : (
                        <>
                          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                          <Text style={styles.buttonText}>Let's Go</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Forgot Password Link */}
                  <TouchableOpacity 
                    style={styles.forgotPasswordLink}
                    onPress={() => router.push('/(auth)/forgot-password')}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>

                  {/* Test Account Button - Development Only */}
                  <TouchableOpacity 
                    style={styles.testAccountButton}
                    onPress={createTestAccount}
                  >
                    <View style={styles.testAccountContent}>
                      <Ionicons name="flask" size={18} color={COLORS.accent} />
                      <Text style={styles.testAccountText}>Quick Test Login</Text>
                    </View>
                    <Text style={styles.testAccountSubtext}>Creates random test account</Text>
                  </TouchableOpacity>

                  {/* Biometric Login */}
                  {biometricAvailable && biometricEnabled && (
                    <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricLogin}>
                      <View style={styles.biometricCircle}>
                        <Ionicons name="finger-print" size={28} color={COLORS.accent} />
                      </View>
                      <Text style={styles.biometricText}>Quick Login</Text>
                    </TouchableOpacity>
                  )}

                  {/* Divider */}
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>New here?</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Why Join - 3 Bullet Points */}
                  <View style={styles.whyJoinContainer}>
                    <View style={styles.bulletPoint}>
                      <Ionicons name="fitness" size={16} color={COLORS.accent} />
                      <Text style={styles.bulletText}>AI-powered personalized workouts</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                      <Ionicons name="trending-up" size={16} color={COLORS.accent} />
                      <Text style={styles.bulletText}>Track progress and smash your goals</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                      <Ionicons name="people" size={16} color={COLORS.accent} />
                      <Text style={styles.bulletText}>Join a community of winners</Text>
                    </View>
                  </View>

                  {/* Start Journey Button */}
                  <TouchableOpacity 
                    style={styles.startJourneyButton} 
                    onPress={handleStartJourney}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={[`${COLORS.accent}15`, `${COLORS.accentSecondary}15`]}
                      style={styles.startJourneyGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="rocket" size={20} color={COLORS.accent} />
                      <Text style={styles.startJourneyText}>Start Your Journey</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Demo Hint */}
                  <View style={styles.demoHint}>
                    <Ionicons name="bulb-outline" size={14} color={COLORS.accent} />
                    <Text style={styles.demoText}>
                      Try: test@example.com / password123
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 240,
    height: 60,
  },
  cardContainer: {
    borderRadius: 32,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 15,
  },
  card: {
    borderRadius: 32,
    padding: 28,
    backgroundColor: COLORS.white,
  },
  cardLogoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  cardLogo: {
    width: 180,
    height: 40,
  },
  welcomeContainer: {
    marginBottom: 28,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: COLORS.mediumGray,
    fontWeight: '500',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 18,
    paddingHorizontal: 18,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${COLORS.accent}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 16,
    fontWeight: '500',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 18,
    padding: 8,
  },
  loginButton: {
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 18,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  gradientButton: {
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  forgotPasswordLink: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 12,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '600',
  },
  testAccountButton: {
    backgroundColor: `${COLORS.accent}10`,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: `${COLORS.accent}30`,
    borderStyle: 'dashed',
    padding: 14,
    marginTop: 20,
    alignItems: 'center',
  },
  testAccountContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  testAccountText: {
    fontSize: 15,
    color: COLORS.accent,
    fontWeight: '600',
  },
  testAccountSubtext: {
    fontSize: 11,
    color: COLORS.mediumGray,
    fontStyle: 'italic',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 20,
    gap: 10,
  },
  biometricCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricText: {
    fontSize: 15,
    color: COLORS.accent,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: `${COLORS.mediumGray}30`,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: COLORS.mediumGray,
    fontWeight: '600',
  },
  whyJoinContainer: {
    backgroundColor: `${COLORS.accent}05`,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  startJourneyButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
  },
  startJourneyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  startJourneyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
  },
  demoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.accent}08`,
    padding: 10,
    borderRadius: 12,
    gap: 6,
  },
  demoText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '500',
  },
});