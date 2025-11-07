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
  Alert,
  Animated,
  Dimensions
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  accent: '#a259ff',
  accentSecondary: '#3a86ff',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  shadow: 'rgba(162, 89, 255, 0.1)',
  error: '#FF3B30',
  gradientStart: '#f5f0ff',
  gradientEnd: '#e6f2ff',
};

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    
    try {
      await login({ email, password });
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'Invalid credentials');
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
          Alert.alert('Error', 'No saved credentials found. Please log in with email and password.');
        }
      }
    } catch (error) {
      Alert.alert('Authentication Failed', 'Please try again or use password');
    }
  };

  return (
    <View style={styles.container}>
      {/* Full Gradient Background */}
      <LinearGradient
        colors={[COLORS.accent, COLORS.accentSecondary, COLORS.white]}
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
  welcomeContainer: {
    marginBottom: 28,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: COLORS.mediumGray,
    fontWeight: '500',
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