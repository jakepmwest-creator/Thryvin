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
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomAlert } from '../../src/components/CustomAlert';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://workout-data-cleanup.preview.emergentagent.com';

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
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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

  const handleSendCode = async () => {
    if (!email) {
      showAlert('warning', 'Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('warning', 'Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        // Move to code entry step
        setStep('code');
        showAlert('success', 'Code Sent!', 'Check your email for a 6-digit code.');
      } else {
        showAlert('error', 'Error', data.error || 'Something went wrong. Please try again.');
      }
      
    } catch (error) {
      console.error('Forgot password error:', error);
      showAlert('error', 'Connection Error', 'Unable to connect to the server. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      showAlert('warning', 'Error', 'Please enter the 6-digit code from your email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-reset-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (response.ok) {
        // Code is valid, move to password reset
        setStep('password');
        showAlert('success', 'Verified!', 'Now enter your new password.');
      } else {
        showAlert('error', 'Invalid Code', data.error || 'The code is incorrect. Please try again.');
      }
      
    } catch (error) {
      console.error('Verify code error:', error);
      showAlert('error', 'Connection Error', 'Unable to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showAlert('warning', 'Error', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('warning', 'Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('success', 'Success!', 'Your password has been reset. You can now log in.');
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 2000);
      } else {
        showAlert('error', 'Error', data.error || 'Failed to reset password. Please try again.');
      }
      
    } catch (error) {
      console.error('Reset password error:', error);
      showAlert('error', 'Connection Error', 'Unable to reset password. Please try again.');
    } finally {
      setIsLoading(false);
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
        onClose={hideAlert}
      />
      
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
              onPress={() => {
                if (step === 'email') {
                  router.back();
                } else if (step === 'code') {
                  setStep('email');
                  setCode('');
                } else {
                  setStep('code');
                  setNewPassword('');
                  setConfirmPassword('');
                }
              }}
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

                {/* STEP 1: EMAIL INPUT */}
                {step === 'email' && (
                  <>
                    <View style={styles.headerContainer}>
                      <Ionicons name="lock-open-outline" size={48} color={COLORS.accent} />
                      <Text style={styles.title}>Forgot Password?</Text>
                      <Text style={styles.subtitle}>
                        Enter your email to receive a reset code
                      </Text>
                    </View>

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

                    <TouchableOpacity
                      style={styles.sendButton}
                      onPress={handleSendCode}
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
                          <ActivityIndicator color={COLORS.white} />
                        ) : (
                          <>
                            <Ionicons name="send" size={20} color={COLORS.white} />
                            <Text style={styles.buttonText}>Send Code</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}

                {/* STEP 2: CODE INPUT */}
                {step === 'code' && (
                  <>
                    <View style={styles.headerContainer}>
                      <Ionicons name="mail-open-outline" size={48} color={COLORS.accent} />
                      <Text style={styles.title}>Enter Code</Text>
                      <Text style={styles.subtitle}>
                        We sent a 6-digit code to{'\n'}{email}
                      </Text>
                    </View>

                    <View style={styles.codeInputWrapper}>
                      <RNTextInput
                        style={styles.codeInput}
                        placeholder="000000"
                        placeholderTextColor={COLORS.mediumGray}
                        value={code}
                        onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                        keyboardType="number-pad"
                        maxLength={6}
                        autoFocus
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.sendButton}
                      onPress={handleVerifyCode}
                      disabled={isLoading || code.length !== 6}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[COLORS.accent, COLORS.accentSecondary]}
                        style={styles.gradientButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        {isLoading ? (
                          <ActivityIndicator color={COLORS.white} />
                        ) : (
                          <>
                            <Ionicons name="checkmark" size={20} color={COLORS.white} />
                            <Text style={styles.buttonText}>Verify Code</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.resendLink}
                      onPress={() => {
                        setStep('email');
                        setCode('');
                      }}
                    >
                      <Text style={styles.resendText}>Resend code</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* STEP 3: PASSWORD RESET */}
                {step === 'password' && (
                  <>
                    <View style={styles.headerContainer}>
                      <Ionicons name="lock-closed-outline" size={48} color={COLORS.accent} />
                      <Text style={styles.title}>New Password</Text>
                      <Text style={styles.subtitle}>
                        Enter your new password
                      </Text>
                    </View>

                    <View style={styles.inputWrapper}>
                      <View style={styles.inputIconContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={COLORS.accent} />
                      </View>
                      <RNTextInput
                        style={styles.input}
                        placeholder="New Password"
                        placeholderTextColor={COLORS.mediumGray}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoFocus
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                          size={20}
                          color={COLORS.mediumGray}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.inputWrapper}>
                      <View style={styles.inputIconContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={COLORS.accent} />
                      </View>
                      <RNTextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        placeholderTextColor={COLORS.mediumGray}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeIcon}
                      >
                        <Ionicons
                          name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                          size={20}
                          color={COLORS.mediumGray}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Password requirements */}
                    <View style={styles.requirementsBox}>
                      <View style={styles.requirementRow}>
                        <Ionicons
                          name={newPassword.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'}
                          size={16}
                          color={newPassword.length >= 6 ? COLORS.success : COLORS.mediumGray}
                        />
                        <Text style={styles.requirementText}>At least 6 characters</Text>
                      </View>
                      <View style={styles.requirementRow}>
                        <Ionicons
                          name={newPassword === confirmPassword && newPassword.length > 0 ? 'checkmark-circle' : 'ellipse-outline'}
                          size={16}
                          color={newPassword === confirmPassword && newPassword.length > 0 ? COLORS.success : COLORS.mediumGray}
                        />
                        <Text style={styles.requirementText}>Passwords match</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.sendButton}
                      onPress={handleResetPassword}
                      disabled={isLoading || !newPassword || !confirmPassword}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[COLORS.accent, COLORS.accentSecondary]}
                        style={styles.gradientButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        {isLoading ? (
                          <ActivityIndicator color={COLORS.white} />
                        ) : (
                          <>
                            <Ionicons name="checkmark-done" size={20} color={COLORS.white} />
                            <Text style={styles.buttonText}>Reset Password</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
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
    marginBottom: 16,
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
  eyeIcon: {
    padding: 8,
  },
  codeInputWrapper: {
    marginBottom: 24,
  },
  codeInput: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: 12,
    paddingVertical: 20,
    backgroundColor: COLORS.lightGray,
    borderRadius: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
  resendLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '600',
  },
  requirementsBox: {
    backgroundColor: '#F0F4FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginLeft: 8,
  },
});
