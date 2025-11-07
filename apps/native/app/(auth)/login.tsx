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
      {/* Animated Gradient Background */}
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd, COLORS.white]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Floating gradient orbs for depth */}
        <View style={[styles.gradientOrb, styles.orb1]} />
        <View style={[styles.gradientOrb, styles.orb2]} />
      </LinearGradient>

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
            {/* Animated Logo */}
            <Animated.View 
              style={[
                styles.logoContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: pulseAnim }
                  ]
                }
              ]}
            >
              <Image 
                source={require('../../assets/images/thryvin-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>

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
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 60,
  },
  welcomeContainer: {
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 18,
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gradientButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  testAccountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.accent}10`,
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  testAccountText: {
    fontSize: 12,
    color: COLORS.accent,
    marginLeft: 6,
    fontWeight: '500',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 16,
    gap: 8,
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
    backgroundColor: COLORS.lightGray,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  startJourneyButton: {
    borderRadius: 16,
    marginBottom: 20,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.white,
  },
  startJourneyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
    marginLeft: 8,
  },
});