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
  const [pinEnabled, setPinEnabled] = useState(false);
  const [showPinLogin, setShowPinLogin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  
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
      const pinCode = await SecureStore.getItemAsync('user_pin');
      const storedEmail = await SecureStore.getItemAsync('user_email');
      const storedPassword = await SecureStore.getItemAsync('user_password');
      
      // Only show quick login options if user has previously logged in successfully
      const hasStoredCredentials = storedEmail && storedPassword;
      
      setBiometricAvailable(compatible && enrolled);
      setBiometricEnabled(enabled === 'true' && hasStoredCredentials);
      // Only show PIN if user has set one AND has stored credentials
      setPinEnabled(!!pinCode && hasStoredCredentials);
    } catch (error) {
      console.error('Biometric check failed:', error);
      // Ensure quick login is hidden on error
      setPinEnabled(false);
      setBiometricEnabled(false);
    }
  };

  const handlePinLogin = async () => {
    if (pinInput.length !== 6) {
      setPinError('Please enter a 6-digit PIN');
      return;
    }
    
    try {
      const savedPin = await SecureStore.getItemAsync('user_pin');
      if (pinInput === savedPin) {
        const storedEmail = await SecureStore.getItemAsync('user_email');
        const storedPassword = await SecureStore.getItemAsync('user_password');
        
        if (storedEmail && storedPassword) {
          await login({ email: storedEmail, password: storedPassword });
          router.replace('/(tabs)');
        } else {
          setPinError('No saved credentials found');
        }
      } else {
        setPinError('Incorrect PIN. Please try again.');
        setPinInput('');
      }
    } catch (error) {
      setPinError('Authentication failed');
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
          <View style={styles.contentContainer}>
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
              <View style={styles.card}>
                {/* Logo in Card */}
                <View style={styles.cardLogoContainer}>
                  <Image 
                    source={require('../../assets/images/thryvin-logo-final.png')}
                    style={styles.cardLogo}
                    resizeMode="contain"
                  />
                </View>

                {/* Welcome Text */}
                <View style={styles.welcomeContainer}>
                  <Text style={styles.welcomeTitle}>Welcome Back 👋</Text>
                  <Text style={styles.welcomeSubtitle}>Ready to crush your goals?</Text>
                </View>

                {/* Login Form */}
                <View style={styles.formContainer}>
                  {/* Email Input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="mail-outline" size={18} color={COLORS.accent} />
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
                      <Ionicons name="lock-closed-outline" size={18} color={COLORS.accent} />
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
                        size={18} 
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
                          <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
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

                  {/* Quick Login Options (PIN / Biometric) */}
                  {(pinEnabled || (biometricAvailable && biometricEnabled)) && (
                    <View style={styles.quickLoginContainer}>
                      <View style={styles.quickLoginDivider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>Quick Login</Text>
                        <View style={styles.dividerLine} />
                      </View>
                      <View style={styles.quickLoginButtons}>
                        {pinEnabled && (
                          <TouchableOpacity 
                            style={styles.quickLoginButton}
                            onPress={() => setShowPinLogin(true)}
                          >
                            <View style={styles.quickLoginIcon}>
                              <Ionicons name="keypad" size={22} color={COLORS.accent} />
                            </View>
                            <Text style={styles.quickLoginText}>PIN</Text>
                          </TouchableOpacity>
                        )}
                        {biometricAvailable && biometricEnabled && (
                          <TouchableOpacity 
                            style={styles.quickLoginButton}
                            onPress={handleBiometricLogin}
                          >
                            <View style={styles.quickLoginIcon}>
                              <Ionicons name="finger-print" size={22} color={COLORS.accent} />
                            </View>
                            <Text style={styles.quickLoginText}>Biometric</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                </View>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>New here?</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Why Join - 3 Bullet Points */}
                <View style={styles.whyJoinContainer}>
                  <View style={styles.bulletPoint}>
                    <Ionicons name="fitness" size={14} color={COLORS.accent} />
                    <Text style={styles.bulletText}>AI-powered personalized workouts</Text>
                  </View>
                  <View style={styles.bulletPoint}>
                    <Ionicons name="trending-up" size={14} color={COLORS.accent} />
                    <Text style={styles.bulletText}>Track progress and smash your goals</Text>
                  </View>
                  <View style={styles.bulletPoint}>
                    <Ionicons name="people" size={14} color={COLORS.accent} />
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
                    <Ionicons name="rocket" size={18} color={COLORS.accent} />
                    <Text style={styles.startJourneyText}>Start Your Journey</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* PIN Login Modal */}
      {showPinLogin && (
        <View style={styles.pinModalOverlay}>
          <View style={styles.pinModalContainer}>
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={styles.pinModalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <TouchableOpacity 
                style={styles.pinModalClose}
                onPress={() => {
                  setShowPinLogin(false);
                  setPinInput('');
                  setPinError('');
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
              <Ionicons name="keypad" size={40} color={COLORS.white} />
              <Text style={styles.pinModalTitle}>Enter PIN</Text>
              <Text style={styles.pinModalSubtitle}>Enter your 6-digit PIN to log in</Text>
            </LinearGradient>
            
            <View style={styles.pinInputSection}>
              <View style={styles.pinDotsContainer}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.pinDot,
                      pinInput.length > index && styles.pinDotFilled,
                      pinError && styles.pinDotError,
                    ]}
                  />
                ))}
              </View>
              {pinError ? (
                <Text style={styles.pinErrorText}>{pinError}</Text>
              ) : null}
              
              {/* Number Pad */}
              <View style={styles.pinNumberPad}>
                {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', 'back']].map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.pinNumberRow}>
                    {row.map((num, numIndex) => {
                      if (num === '') {
                        return <View key={numIndex} style={styles.pinEmptyButton} />;
                      }
                      if (num === 'back') {
                        return (
                          <TouchableOpacity 
                            key={numIndex} 
                            style={styles.pinNumberButton}
                            onPress={() => {
                              setPinInput(prev => prev.slice(0, -1));
                              setPinError('');
                            }}
                          >
                            <Ionicons name="backspace-outline" size={24} color={COLORS.text} />
                          </TouchableOpacity>
                        );
                      }
                      return (
                        <TouchableOpacity 
                          key={numIndex} 
                          style={styles.pinNumberButton}
                          onPress={() => {
                            if (pinInput.length < 6) {
                              const newPin = pinInput + num;
                              setPinInput(newPin);
                              setPinError('');
                              if (newPin.length === 6) {
                                // Auto-submit when 6 digits entered
                                setTimeout(() => handlePinLogin(), 200);
                              }
                            }
                          }}
                        >
                          <Text style={styles.pinNumberText}>{num}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      )}
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
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    borderRadius: 28,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: COLORS.white,
  },
  cardLogoContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  cardLogo: {
    width: 160,
    height: 36,
  },
  welcomeContainer: {
    marginBottom: 28,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
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
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${COLORS.accent}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 14,
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
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 14,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  forgotPasswordLink: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: `${COLORS.mediumGray}30`,
  },
  dividerText: {
    marginHorizontal: 14,
    fontSize: 12,
    color: COLORS.mediumGray,
    fontWeight: '600',
  },
  whyJoinContainer: {
    backgroundColor: `${COLORS.accent}08`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  startJourneyButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  startJourneyGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
  },
  startJourneyText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.accent,
  },
  // Quick Login Styles
  quickLoginContainer: {
    marginTop: 16,
  },
  quickLoginDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickLoginButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  quickLoginButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: `${COLORS.accent}10`,
    borderRadius: 14,
  },
  quickLoginIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  quickLoginText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
  },
  // PIN Modal Styles
  pinModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pinModalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  pinModalHeader: {
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: 'center',
  },
  pinModalClose: {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: 4,
    zIndex: 10,
  },
  pinModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 12,
  },
  pinModalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  pinInputSection: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.mediumGray,
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  pinDotError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.error,
  },
  pinErrorText: {
    fontSize: 14,
    color: COLORS.error,
    marginBottom: 16,
    fontWeight: '500',
  },
  pinNumberPad: {
    paddingHorizontal: 40,
    paddingTop: 16,
    paddingBottom: 32,
  },
  pinNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pinNumberButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinEmptyButton: {
    width: 72,
    height: 72,
  },
  pinNumberText: {
    fontSize: 28,
    fontWeight: '500',
    color: COLORS.text,
  },
});