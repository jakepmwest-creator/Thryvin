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
  Dimensions,
  Modal
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth-store';
import { CustomAlert } from '../../src/components/CustomAlert';
import { QuickTestLogin } from '../../src/components/auth/QuickTestLogin';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { COLORS as THEME_COLORS } from '../../src/constants/colors';

const COLORS = {
  accent: THEME_COLORS.gradientStart,
  accentSecondary: THEME_COLORS.gradientEnd,
  white: THEME_COLORS.white,
  text: THEME_COLORS.text,
  lightGray: THEME_COLORS.lightGray,
  mediumGray: THEME_COLORS.mediumGray,
  shadow: THEME_COLORS.cardShadow,
  error: THEME_COLORS.danger,
  gradientStart: THEME_COLORS.gradientStart,
  gradientEnd: THEME_COLORS.gradientEnd,
};

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
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
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    checkBiometricStatus();
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const enabled = await SecureStore.getItemAsync('biometric_enabled');
      const pinCode = await SecureStore.getItemAsync('user_pin');
      const storedEmail = await SecureStore.getItemAsync('user_email');
      const storedPassword = await SecureStore.getItemAsync('user_password');
      
      const hasStoredCredentials = storedEmail && storedPassword;
      
      setBiometricAvailable(compatible && enrolled);
      setBiometricEnabled(enabled === 'true' && hasStoredCredentials);
      setPinEnabled(!!pinCode && hasStoredCredentials);
    } catch (error) {
      console.error('Biometric check failed:', error);
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

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('warning', 'Error', 'Please enter email and password');
      return;
    }
    
    try {
      await login({ email, password });
      
      if (stayLoggedIn) {
        await SecureStore.setItemAsync('user_email', email);
        await SecureStore.setItemAsync('user_password', password);
      }
      
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
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View 
              style={[
                styles.contentContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim }
                  ]
                }
              ]}
            >
              {/* Logo */}
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../../assets/images/thryvin-logo-final.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              {/* Main Welcome Card */}
              <View style={styles.card}>
                {/* Logo - Inside the card */}
                <View style={styles.logoContainer}>
                  <Image 
                    source={require('../../assets/images/thryvin-logo-final.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>

                {/* Hero Section - Welcoming New Users */}
                <View style={styles.heroSection}>
                  <Text style={styles.heroTitle}>Your Fitness{'\n'}Journey Starts Here</Text>
                  <Text style={styles.heroSubtitle}>
                    AI-powered workouts designed for you.{'\n'}Join thousands crushing their goals daily.
                  </Text>
                </View>

                {/* Feature Pills */}
                <View style={styles.featurePills}>
                  <View style={styles.featurePill}>
                    <Ionicons name="flash" size={14} color={COLORS.accent} />
                    <Text style={styles.featurePillText}>Smart AI Coach</Text>
                  </View>
                  <View style={styles.featurePill}>
                    <Ionicons name="trophy" size={14} color={COLORS.accent} />
                    <Text style={styles.featurePillText}>Earn Rewards</Text>
                  </View>
                  <View style={styles.featurePill}>
                    <Ionicons name="analytics" size={14} color={COLORS.accent} />
                    <Text style={styles.featurePillText}>Track Progress</Text>
                  </View>
                </View>

                {/* Primary CTA - Start Journey */}
                <TouchableOpacity 
                  style={styles.primaryButton} 
                  onPress={handleStartJourney}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[COLORS.accent, COLORS.accentSecondary]}
                    style={styles.primaryButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="rocket" size={20} color={COLORS.white} />
                    <Text style={styles.primaryButtonText}>Start Your Journey</Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                  </LinearGradient>
                </TouchableOpacity>

                {/* Quick Login Options for returning users */}
                {(pinEnabled || (biometricAvailable && biometricEnabled)) && (
                  <View style={styles.quickLoginSection}>
                    <Text style={styles.quickLoginTitle}>Welcome back!</Text>
                    <View style={styles.quickLoginButtons}>
                      {biometricAvailable && biometricEnabled && (
                        <TouchableOpacity 
                          style={styles.quickLoginButton}
                          onPress={handleBiometricLogin}
                        >
                          <Ionicons name="finger-print" size={24} color={COLORS.accent} />
                          <Text style={styles.quickLoginButtonText}>Face/Touch ID</Text>
                        </TouchableOpacity>
                      )}
                      {pinEnabled && (
                        <TouchableOpacity 
                          style={styles.quickLoginButton}
                          onPress={() => setShowPinLogin(true)}
                        >
                          <Ionicons name="keypad" size={24} color={COLORS.accent} />
                          <Text style={styles.quickLoginButtonText}>PIN</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}

                {/* Secondary - Already have account */}
                <View style={styles.loginSection}>
                  <Text style={styles.loginSectionText}>Already have an account?</Text>
                  <TouchableOpacity 
                    style={styles.loginLink}
                    onPress={() => setShowLoginForm(true)}
                  >
                    <Text style={styles.loginLinkText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={14} color={COLORS.accent} />
                  </TouchableOpacity>
                </View>

                {/* DEV-only Quick Test Login */}
                <QuickTestLogin />
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Login Form Modal */}
      <Modal
        visible={showLoginForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLoginForm(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowLoginForm(false)} style={styles.modalClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Welcome Back</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView 
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.loginFormContainer}>
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

              {/* Stay Logged In */}
              <TouchableOpacity 
                style={styles.stayLoggedInRow}
                onPress={() => setStayLoggedIn(!stayLoggedIn)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, stayLoggedIn && styles.checkboxChecked]}>
                  {stayLoggedIn && <Ionicons name="checkmark" size={12} color={COLORS.white} />}
                </View>
                <Text style={styles.stayLoggedInText}>Stay logged in</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity 
                style={styles.modalLoginButton} 
                onPress={handleLogin}
                disabled={isLoading || !email || !password}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentSecondary]}
                  style={styles.modalLoginButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isLoading ? (
                    <Text style={styles.modalLoginButtonText}>Logging in...</Text>
                  ) : (
                    <>
                      <Text style={styles.modalLoginButtonText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Forgot Password */}
              <TouchableOpacity 
                style={styles.forgotPasswordLink}
                onPress={() => {
                  setShowLoginForm(false);
                  router.push('/(auth)/forgot-password');
                }}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* PIN Login Modal */}
      <Modal
        visible={showPinLogin}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPinLogin(false)}
      >
        <View style={styles.pinModalOverlay}>
          <View style={styles.pinModalCard}>
            <TouchableOpacity 
              style={styles.pinModalClose}
              onPress={() => { setShowPinLogin(false); setPinInput(''); setPinError(''); }}
            >
              <Ionicons name="close" size={20} color={COLORS.mediumGray} />
            </TouchableOpacity>
            
            <Text style={styles.pinModalTitle}>Enter Your PIN</Text>
            
            <View style={styles.pinDots}>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <View 
                  key={i} 
                  style={[styles.pinDot, pinInput.length > i && styles.pinDotFilled]}
                />
              ))}
            </View>
            
            {pinError ? <Text style={styles.pinErrorText}>{pinError}</Text> : null}
            
            <View style={styles.pinKeypad}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((key, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.pinKey, key === '' && styles.pinKeyEmpty]}
                  onPress={() => {
                    if (key === 'del') {
                      setPinInput(prev => prev.slice(0, -1));
                    } else if (key !== '' && pinInput.length < 6) {
                      const newPin = pinInput + key;
                      setPinInput(newPin);
                      if (newPin.length === 6) {
                        setTimeout(handlePinLogin, 100);
                      }
                    }
                  }}
                  disabled={key === ''}
                >
                  {key === 'del' ? (
                    <Ionicons name="backspace-outline" size={22} color={COLORS.text} />
                  ) : (
                    <Text style={styles.pinKeyText}>{key}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradientBackground: { ...StyleSheet.absoluteFillObject },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 20 },
  contentContainer: { flex: 1, justifyContent: 'center' },
  
  // Logo
  logoContainer: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 120, height: 50 },
  
  // Main Card
  card: { 
    backgroundColor: COLORS.white, 
    borderRadius: 28, 
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  
  // Hero Section
  heroSection: { alignItems: 'center', marginBottom: 24 },
  heroTitle: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: COLORS.text, 
    textAlign: 'center',
    lineHeight: 34,
  },
  heroSubtitle: { 
    fontSize: 15, 
    color: COLORS.mediumGray, 
    textAlign: 'center', 
    marginTop: 12,
    lineHeight: 22,
  },
  
  // Feature Pills
  featurePills: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
  featurePill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: `${COLORS.accent}10`, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20,
    gap: 4,
  },
  featurePillText: { fontSize: 12, fontWeight: '600', color: COLORS.accent },
  
  // Primary Button
  primaryButton: { marginBottom: 20 },
  primaryButtonGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    borderRadius: 16,
    gap: 10,
  },
  primaryButtonText: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  
  // Quick Login Section
  quickLoginSection: { 
    backgroundColor: COLORS.lightGray, 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 20,
    alignItems: 'center',
  },
  quickLoginTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  quickLoginButtons: { flexDirection: 'row', gap: 16 },
  quickLoginButton: { 
    alignItems: 'center', 
    backgroundColor: COLORS.white, 
    padding: 16, 
    borderRadius: 12,
    minWidth: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickLoginButtonText: { fontSize: 11, fontWeight: '600', color: COLORS.text, marginTop: 6 },
  
  // Login Section
  loginSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 8 },
  loginSectionText: { fontSize: 14, color: COLORS.mediumGray },
  loginLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  loginLinkText: { fontSize: 14, fontWeight: '700', color: COLORS.accent },
  
  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalClose: { padding: 4 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalContent: { flex: 1 },
  modalScrollContent: { padding: 24 },
  
  loginFormContainer: { gap: 16 },
  
  // Input Styles
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 56,
  },
  inputIconContainer: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: COLORS.text },
  passwordInput: { paddingRight: 40 },
  eyeIcon: { position: 'absolute', right: 14, padding: 4 },
  
  // Stay Logged In
  stayLoggedInRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { 
    width: 20, 
    height: 20, 
    borderRadius: 5, 
    borderWidth: 2, 
    borderColor: COLORS.mediumGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  stayLoggedInText: { fontSize: 14, color: COLORS.mediumGray },
  
  // Modal Login Button
  modalLoginButton: { marginTop: 8 },
  modalLoginButtonGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    borderRadius: 14,
    gap: 8,
  },
  modalLoginButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  
  // Forgot Password
  forgotPasswordLink: { alignItems: 'center', paddingVertical: 8 },
  forgotPasswordText: { fontSize: 14, color: COLORS.accent, fontWeight: '500' },
  
  // PIN Modal
  pinModalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 24,
  },
  pinModalCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: 24, 
    padding: 28, 
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  pinModalClose: { position: 'absolute', top: 16, right: 16, padding: 4 },
  pinModalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 24 },
  pinDots: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  pinDot: { 
    width: 14, 
    height: 14, 
    borderRadius: 7, 
    backgroundColor: COLORS.lightGray,
    borderWidth: 2,
    borderColor: COLORS.mediumGray,
  },
  pinDotFilled: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  pinErrorText: { fontSize: 13, color: COLORS.error, marginBottom: 16 },
  pinKeypad: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center', 
    width: 240,
  },
  pinKey: { 
    width: 70, 
    height: 56, 
    justifyContent: 'center', 
    alignItems: 'center', 
    margin: 4,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
  },
  pinKeyEmpty: { backgroundColor: 'transparent' },
  pinKeyText: { fontSize: 24, fontWeight: '600', color: COLORS.text },
});
