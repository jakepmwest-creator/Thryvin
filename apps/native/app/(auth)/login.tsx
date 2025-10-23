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

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const { isAvailable, authenticate } = useBiometricAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    try {
      await login({ email, password });
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await authenticate();
      if (result.success) {
        // Auto-login with stored credentials
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('Biometric login failed:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ThryvinLogo />
        
        <Surface style={styles.form}>
          <Text variant="headlineMedium" style={styles.title}>
            Welcome back
          </Text>
          
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
          />
          
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={!email || !password}
            style={styles.loginButton}
          >
            Sign In
          </Button>

          {isAvailable && (
            <Button
              mode="outlined"
              onPress={handleBiometricLogin}
              icon="fingerprint"
              style={styles.biometricButton}
            >
              Use Biometric Login
            </Button>
          )}
          
          <Button
            mode="text"
            onPress={() => router.push('/(auth)/register')}
            style={styles.registerButton}
          >
            Don't have an account? Sign up
          </Button>
        </Surface>
      </View>
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