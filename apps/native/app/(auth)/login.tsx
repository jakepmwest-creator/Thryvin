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
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  form: {
    padding: 24,
    marginTop: 32,
    borderRadius: 20,
    elevation: 2,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#7A3CF3',
  },
  input: {
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
  },
  biometricButton: {
    marginBottom: 16,
    borderRadius: 12,
  },
  registerButton: {
    marginTop: 8,
  },
});