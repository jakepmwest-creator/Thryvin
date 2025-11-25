import React, { useState } from 'react';
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
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://bitter-kings-guess.loca.lt';

const COLORS = {
  accent: '#a259ff',
  accentSecondary: '#3a86ff',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  success: '#4CAF50',
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendResetEmail = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // Call the backend API
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      // Always show success (security best practice)
      setEmailSent(true);
      
    } catch (error) {
      console.error('Forgot password error:', error);
      // Still show success for security
      setEmailSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>

            <View style={styles.cardContainer}>
              <LinearGradient
                colors={[COLORS.white, COLORS.white]}
                style={styles.card}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Logo */}
                <View style={styles.logoContainer}>
                  <Image
                    source={require('../../assets/images/thryvin-logo-final.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>

                {!emailSent ? (
                  <>
                    {/* Header */}
                    <View style={styles.headerContainer}>
                      <Ionicons name="lock-open-outline" size={48} color={COLORS.accent} />
                      <Text style={styles.title}>Forgot Password?</Text>
                      <Text style={styles.subtitle}>
                        No worries! Enter your email and we'll send you a reset link.
                      </Text>
                    </View>

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
                        autoFocus
                      />
                    </View>

                    {/* Send Button */}
                    <TouchableOpacity
                      style={styles.sendButton}
                      onPress={handleSendResetEmail}
                      disabled={isLoading || !email}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[COLORS.accent, COLORS.accentSecondary]}
                        style={styles.gradientButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        {isLoading ? (
                          <Text style={styles.buttonText}>Sending...</Text>
                        ) : (
                          <>
                            <Ionicons name="send" size={20} color={COLORS.white} />
                            <Text style={styles.buttonText}>Send Reset Link</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {/* Success State */}
                    <View style={styles.successContainer}>
                      <View style={styles.successIcon}>
                        <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
                      </View>
                      <Text style={styles.successTitle}>Email Sent!</Text>
                      <Text style={styles.successText}>
                        If an account exists for {email}, you'll receive a password reset email
                        shortly.
                      </Text>
                      <Text style={styles.successSubtext}>
                        Check your inbox and spam folder.
                      </Text>
                    </View>

                    {/* Back to Login Button */}
                    <TouchableOpacity
                      style={styles.backToLoginButton}
                      onPress={() => router.back()}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={[`${COLORS.accent}15`, `${COLORS.accentSecondary}15`]}
                        style={styles.backToLoginGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Ionicons name="arrow-back" size={20} color={COLORS.accent} />
                        <Text style={styles.backToLoginText}>Back to Login</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}

                {/* Resend Option (shown after email sent) */}
                {emailSent && (
                  <TouchableOpacity
                    style={styles.resendLink}
                    onPress={() => setEmailSent(false)}
                  >
                    <Text style={styles.resendText}>Didn't receive it? Try again</Text>
                  </TouchableOpacity>
                )}
              </LinearGradient>
            </View>
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 160,
    height: 36,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.mediumGray,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 18,
    paddingHorizontal: 18,
    marginBottom: 20,
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
  sendButton: {
    marginTop: 8,
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
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  successText: {
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  successSubtext: {
    fontSize: 13,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 32,
  },
  backToLoginButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
  },
  backToLoginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  backToLoginText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
  },
  resendLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '600',
  },
});
