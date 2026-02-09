/**
 * QuickTestLogin - DEV-only fast login for QA testing
 * 
 * ONLY visible when:
 * - __DEV__ is true OR
 * - EXPO_PUBLIC_ENABLE_TEST_LOGIN === 'true'
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { storeToken } from '../../services/api-client';
import { useAuthStore } from '../../stores/auth-store';
import { getApiBaseUrl } from '../../services/env';

const API_BASE_URL = getApiBaseUrl();

// Check if test login should be visible
const isTestLoginEnabled = () => {
  // @ts-ignore - __DEV__ is a React Native global
  if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
  if (process.env.EXPO_PUBLIC_ENABLE_TEST_LOGIN === 'true') return true;
  return false;
};

interface TestProfile {
  id: 'beginner' | 'intermediate' | 'injury';
  label: string;
  description: string;
  icon: string;
  color: string;
}

const TEST_PROFILES: TestProfile[] = [
  {
    id: 'beginner',
    label: 'Beginner (No Advanced)',
    description: '3 days/week, 45 min, minimal equipment',
    icon: 'leaf',
    color: '#10B981',
  },
  {
    id: 'intermediate',
    label: 'Intermediate (Advanced + Schedule)',
    description: '4 days/week, 60 min, Football Fridays',
    icon: 'barbell',
    color: '#3B82F6',
  },
  {
    id: 'injury',
    label: 'Injury Case (Advanced + Constraints)',
    description: 'Lower back + knee sensitivity, machines preferred',
    icon: 'medkit',
    color: '#F59E0B',
  },
];

export function QuickTestLogin() {
  const router = useRouter();
  const { setUserDirectly } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastError, setLastError] = useState<{ body: string; status: number } | null>(null);
  
  // Don't render if not enabled
  if (!isTestLoginEnabled()) {
    return null;
  }
  
  const handleTestLogin = async (profile: TestProfile) => {
    setLoading(profile.id);
    setError(null);
    setLastError(null);
    
    try {
      console.log(`[QA] Logging in as ${profile.id}...`);
      console.log(`[QA] API URL: ${API_BASE_URL}/api/qa/login-as`);
      
      // Call QA login endpoint to ensure user exists and get token
      const response = await fetch(`${API_BASE_URL}/api/qa/login-as`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify({ profile: profile.id }),
      });
      
      // Get response text first for debugging
      const responseText = await response.text();
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      
      console.log(`[QA] Response status: ${response.status}, Content-Type: ${contentType}`);
      console.log(`[QA] Response body preview: ${responseText.substring(0, 200)}`);
      
      // Try to parse as JSON
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        // Not valid JSON - store for diagnostics
        setLastError({ body: responseText.substring(0, 500), status: response.status });
        
        // Check for common error patterns
        if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
          throw new Error(`Server returned HTML instead of JSON (status ${response.status}). The server may be down or misconfigured.`);
        }
        if (response.status === 520) {
          throw new Error('Server error (520). Please try again in a moment.');
        }
        if (response.status === 502 || response.status === 503) {
          throw new Error(`Server temporarily unavailable (${response.status}). Please try again.`);
        }
        throw new Error(`Invalid response from server (status ${response.status}). Expected JSON but got: ${responseText.substring(0, 100)}...`);
      }
      
      // Check for QA disabled
      if (data.code === 'QA_DISABLED') {
        throw new Error('QA login is disabled in this environment. Set QA_MODE=true or use dev build.');
      }
      
      if (!data.ok) {
        throw new Error(data.error || 'QA login failed');
      }
      
      // Store token directly
      if (data.accessToken) {
        await storeToken(data.accessToken);
      } else {
        console.warn('[QA] No access token in response!');
      }
      
      // Set user directly in auth store (bypassing normal login flow)
      await setUserDirectly({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        trainingType: data.user.trainingType,
        goal: data.user.goal,
        coachingStyle: data.user.coachingStyle,
        trainingDays: data.user.trainingDaysPerWeek,
        sessionDuration: data.user.sessionDurationPreference,
        fitnessGoals: data.user.focusAreas ? JSON.parse(data.user.focusAreas) : [],
        injuries: data.user.injuries ? JSON.parse(data.user.injuries) : [],
      });
      
      console.log(`[QA] ✅ Logged in as ${profile.id} (requestId: ${data.requestId})`);
      
      // Navigate to home
      router.replace('/(tabs)');
      
    } catch (err: any) {
      console.error(`[QA] Login failed:`, err);
      const errorMessage = err.message || 'Failed to login';
      setError(errorMessage);
      Alert.alert(
        'Login Failed',
        errorMessage,
        [
          { text: 'OK' },
          lastError ? { text: 'View Details', onPress: () => {
            Alert.alert('Error Details', `Status: ${lastError.status}\nBody: ${lastError.body}`);
          }} : null,
        ].filter(Boolean) as any
      );
    } finally {
      setLoading(null);
    }
  };
  
  const handleReset = async () => {
    Alert.alert(
      'Reset User Data',
      'This will clear workout plan and history for the current test user.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            // Would need current user email - simplified for now
            Alert.alert('Info', 'Login first, then use diagnostics to reset.');
          },
        },
      ]
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="bug" size={20} color={COLORS.mediumGray} />
        <Text style={styles.headerText}>Quick Test Login (DEV)</Text>
      </View>
      
      {/* Error */}
      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {/* Test Profile Buttons */}
      {TEST_PROFILES.map((profile) => (
        <TouchableOpacity
          key={profile.id}
          style={[styles.profileButton, { borderColor: profile.color + '40' }]}
          onPress={() => handleTestLogin(profile)}
          disabled={loading !== null}
          activeOpacity={0.7}
        >
          <View style={[styles.profileIcon, { backgroundColor: profile.color + '20' }]}>
            {loading === profile.id ? (
              <ActivityIndicator size="small" color={profile.color} />
            ) : (
              <Ionicons name={profile.icon as any} size={20} color={profile.color} />
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileLabel}>{profile.label}</Text>
            <Text style={styles.profileDescription}>{profile.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
        </TouchableOpacity>
      ))}
      
      {/* Utility Buttons */}
      <View style={styles.utilityRow}>
        <TouchableOpacity style={styles.utilityButton} onPress={handleReset}>
          <Ionicons name="trash-outline" size={16} color={COLORS.mediumGray} />
          <Text style={styles.utilityText}>Reset Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.utilityButton}
          onPress={() => Alert.alert('Info', 'Login first, then this will regenerate your plan.')}
        >
          <Ionicons name="refresh-outline" size={16} color={COLORS.mediumGray} />
          <Text style={styles.utilityText}>Regenerate Plan</Text>
        </TouchableOpacity>
      </View>
      
      {/* Warning */}
      <Text style={styles.warning}>
        ⚠️ Test accounts only - Not visible in production
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  profileDescription: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  utilityRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  utilityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  utilityText: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  warning: {
    fontSize: 11,
    color: '#92400E',
    textAlign: 'center',
    marginTop: 12,
  },
});

export default QuickTestLogin;
