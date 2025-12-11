import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth-store';
import { CustomAlert } from '../../src/components/CustomAlert';

const COLORS = {
  accent: '#a259ff',
  accentSecondary: '#3a86ff',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  shadow: 'rgba(162, 89, 255, 0.1)',
};

export default function QuickSignupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { register, isLoading } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // CustomAlert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });
  
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setAlertConfig({ visible: true, type, title, message });
  };
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const handleCreateAccount = async () => {
    // Validation
    if (!email || !password) {
      showAlert('warning', 'Error', 'Please enter email and password');
      return;
    }

    if (password.length < 6) {
      showAlert('warning', 'Error', 'Password must be at least 6 characters');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('warning', 'Error', 'Please enter a valid email address');
      return;
    }

    try {
      // Parse onboarding data
      const onboardingData = params.onboardingData 
        ? JSON.parse(params.onboardingData as string) 
        : {};

      // Save coach name to AsyncStorage
      if (onboardingData.coachName) {
        await AsyncStorage.setItem('coach_name', onboardingData.coachName);
      }

      // Combine onboarding data with credentials
      const userData = {
        ...onboardingData,
        email,
        password,
      };

      await register(userData);
      
      // Show biometric modal after successful registration
      router.replace({
        pathname: '/(auth)/biometric-setup',
        params: { fromSignup: 'true' },
      });
    } catch (error) {
      showAlert('error', 'Signup Failed', error instanceof Error ? error.message : 'Could not create account');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={hideAlert}
      />
      
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
              source={require('../../assets/images/thryvin-logo-final.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.accent} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Almost There!</Text>
          <Text style={styles.subtitle}>
            Create your account to save your personalized fitness plan
          </Text>

          {/* Quick Form */}
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
                placeholder="Password (min 6 characters)"
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

            {/* Create Account Button */}
            <TouchableOpacity 
              style={styles.createButton} 
              onPress={handleCreateAccount}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[COLORS.accent, COLORS.accentSecondary]}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading ? (
                  <Text style={styles.buttonText}>Creating Account...</Text>
                ) : (
                  <>
                    <Text style={styles.buttonText}>Create Account & Start</Text>
                    <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Privacy Note */}
            <Text style={styles.privacyText}>
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </Text>

            {/* Already have account */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLinkTextBold}>Login</Text>
              </Text>
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
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 140,
    height: 42,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.accent}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 20,
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
  createButton: {
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
    flexDirection: 'row',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  privacyText: {
    fontSize: 12,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  loginLink: {
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  loginLinkTextBold: {
    color: COLORS.accent,
    fontWeight: '600',
  },
});
