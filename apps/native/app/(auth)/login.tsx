import React, { useState, useEffect } from 'react';
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
  Alert
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth-store';

const COLORS = {
  accent: '#a259ff',
  accentSecondary: '#3a86ff',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  shadow: 'rgba(162, 89, 255, 0.1)',
  error: '#FF3B30',
};

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    checkBiometricStatus();
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
    router.push('/(auth)/register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/thryvin-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSubtitle}>Let's continue your fitness journey</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={COLORS.accent} style={styles.inputIcon} />
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
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.accent} style={styles.inputIcon} />
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
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Test Account Info */}
            <View style={styles.testAccountInfo}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.accent} />
              <Text style={styles.testAccountText}>
                Test: test@example.com / password123
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Start Journey Button */}
            <TouchableOpacity 
              style={styles.startJourneyButton} 
              onPress={handleStartJourney}
            >
              <View style={styles.outlineButton}>
                <Ionicons name="rocket-outline" size={20} color={COLORS.accent} />
                <Text style={styles.startJourneyText}>Start Your Journey Here</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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