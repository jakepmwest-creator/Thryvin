/**
 * DiagnosticsScreen - Hidden debug screen accessible via 7 taps on app logo
 * 
 * PRIORITY 2: In-app diagnostics to verify mobile app is using correct backend
 * 
 * Displays:
 * - API base URL (runtime value)
 * - /api/health result
 * - /api/version result
 * - /api/auth/me result
 * - Token present (yes/no)
 * - Last ensure() result
 * - Last 5 API errors
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/colors';
import * as api from '../services/api-client';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://login-wizard-3.preview.emergentagent.com';

interface HealthResponse {
  ok: boolean;
  timestamp?: string;
  version?: string;
  environment?: string;
  features?: Record<string, boolean>;
  aiReady?: boolean;
}

interface VersionResponse {
  ok: boolean;
  commit?: string;
  env?: string;
  serverTime?: string;
  baseUrl?: string;
  requestId?: string;
}

interface DiagnosticsResponse {
  ok: boolean;
  requestId?: string;
  serverTime?: string;
  recentErrors?: Array<{
    timestamp: string;
    requestId: string;
    method: string;
    path: string;
    status: number;
    error: string;
  }>;
}

interface EndpointResult {
  status: number | 'error';
  contentType: string;
  data: any;
  error?: string;
  latency: number;
}

export function DiagnosticsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<EndpointResult | null>(null);
  const [version, setVersion] = useState<EndpointResult | null>(null);
  const [diagnostics, setDiagnostics] = useState<EndpointResult | null>(null);
  const [authMe, setAuthMe] = useState<EndpointResult | null>(null);
  const [planStatus, setPlanStatus] = useState<EndpointResult | null>(null);
  const [tokenPresent, setTokenPresent] = useState(false);
  const [clientErrors, setClientErrors] = useState<typeof api.recentApiErrors>([]);
  const [refreshCount, setRefreshCount] = useState(0);

  const testEndpoint = async (endpoint: string, useAuth: boolean = false): Promise<EndpointResult> => {
    const startTime = Date.now();
    try {
      const token = useAuth ? await api.getToken() : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: endpoint.includes('ensure') ? 'POST' : 'GET',
        headers,
      });
      
      const contentType = response.headers.get('content-type') || 'unknown';
      const latency = Date.now() - startTime;
      
      let data;
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }
      
      return {
        status: response.status,
        contentType,
        data,
        latency,
      };
    } catch (error: any) {
      return {
        status: 'error',
        contentType: 'none',
        data: null,
        error: error.message,
        latency: Date.now() - startTime,
      };
    }
  };

  const runDiagnostics = async () => {
    setLoading(true);
    
    // Check token
    const hasToken = await api.hasToken();
    setTokenPresent(hasToken);
    
    // Get client-side errors
    const diagInfo = await api.getDiagnosticsInfo();
    setClientErrors(diagInfo.recentErrors);
    
    const [healthResult, versionResult, diagResult, authResult, planResult] = await Promise.all([
      testEndpoint('/api/health'),
      testEndpoint('/api/version'),
      testEndpoint('/api/diagnostics'),
      testEndpoint('/api/auth/me', true),
      hasToken ? testEndpoint('/api/workouts/plan/status', true) : Promise.resolve(null),
    ]);
    
    setHealth(healthResult);
    setVersion(versionResult);
    setDiagnostics(diagResult);
    setAuthMe(authResult);
    setPlanStatus(planResult);
    setLoading(false);
    setRefreshCount(prev => prev + 1);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const StatusBadge = ({ status }: { status: number | 'error' }) => {
    const isOk = status === 200 || status === 201;
    return (
      <View style={[styles.badge, isOk ? styles.badgeSuccess : styles.badgeError]}>
        <Text style={styles.badgeText}>
          {status === 'error' ? 'ERR' : status}
        </Text>
      </View>
    );
  };

  const EndpointCard = ({ 
    title, 
    endpoint, 
    result 
  }: { 
    title: string; 
    endpoint: string; 
    result: EndpointResult | null;
  }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        {result && <StatusBadge status={result.status} />}
      </View>
      <Text style={styles.endpoint}>{endpoint}</Text>
      {result && (
        <>
          <Text style={styles.meta}>
            Content-Type: {result.contentType}
          </Text>
          <Text style={styles.meta}>
            Latency: {result.latency}ms
          </Text>
          <View style={styles.responseBox}>
            <Text style={styles.responseText}>
              {typeof result.data === 'object' 
                ? JSON.stringify(result.data, null, 2).slice(0, 500)
                : String(result.data).slice(0, 500)}
              {result.error && `\nError: ${result.error}`}
            </Text>
          </View>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔧 Diagnostics</Text>
        <TouchableOpacity onPress={runDiagnostics} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={COLORS.gradientStart} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* API Base URL */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>API Base URL (Runtime)</Text>
          <View style={styles.urlBox}>
            <Text style={styles.urlText} selectable>{API_BASE_URL}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.gradientStart} />
            <Text style={styles.loadingText}>Running diagnostics...</Text>
          </View>
        ) : (
          <>
            {/* Token Status */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Auth Token</Text>
                <View style={[styles.badge, tokenPresent ? styles.badgeSuccess : styles.badgeError]}>
                  <Text style={styles.badgeText}>{tokenPresent ? 'Present' : 'Missing'}</Text>
                </View>
              </View>
              <Text style={styles.meta}>
                Bearer token stored in SecureStore: {tokenPresent ? 'Yes' : 'No'}
              </Text>
            </View>
            
            {/* Health Check */}
            <EndpointCard
              title="Health Check"
              endpoint="/api/health"
              result={health}
            />

            {/* Version Check */}
            <EndpointCard
              title="Version Info"
              endpoint="/api/version"
              result={version}
            />
            
            {/* Auth Me */}
            <EndpointCard
              title="Auth Verification"
              endpoint="/api/auth/me"
              result={authMe}
            />
            
            {/* Plan Status */}
            {planStatus && (
              <EndpointCard
                title="Plan Status"
                endpoint="/api/workouts/plan/status"
                result={planStatus}
              />
            )}

            {/* Server-Side Errors */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Server-Side Errors (Last 5)</Text>
              {diagnostics?.data?.recentErrors?.length > 0 ? (
                diagnostics.data.recentErrors.slice(0, 5).map((err: any, i: number) => (
                  <View key={i} style={styles.errorItem}>
                    <View style={styles.errorHeader}>
                      <Text style={styles.errorMethod}>{err.method}</Text>
                      <Text style={styles.errorPath}>{err.path}</Text>
                      <StatusBadge status={err.status} />
                    </View>
                    <Text style={styles.errorBody} numberOfLines={2}>
                      {err.error}
                    </Text>
                    <Text style={styles.errorTime}>{err.timestamp}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noErrors}>✅ No server-side errors</Text>
              )}
            </View>
            
            {/* Client-Side Errors */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Client-Side Errors (Last 5)</Text>
              {clientErrors.length > 0 ? (
                clientErrors.map((err, i) => (
                  <View key={i} style={styles.errorItem}>
                    <View style={styles.errorHeader}>
                      <Text style={styles.errorPath}>{err.endpoint}</Text>
                      <StatusBadge status={err.status} />
                    </View>
                    <Text style={styles.errorBody} numberOfLines={2}>
                      {err.body}
                    </Text>
                    <Text style={styles.errorTime}>{err.timestamp}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noErrors}>✅ No client-side errors</Text>
              )}
            </View>

            {/* Refresh Info */}
            <Text style={styles.refreshInfo}>
              Refreshed {refreshCount} time(s) • Tap 🔄 to re-run
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  endpoint: {
    fontSize: 12,
    color: COLORS.mediumGray,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  meta: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginBottom: 4,
  },
  urlBox: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  urlText: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: COLORS.text,
  },
  responseBox: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  responseText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#d4d4d4',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeSuccess: {
    backgroundColor: '#dcfce7',
  },
  badgeError: {
    backgroundColor: '#fee2e2',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  errorItem: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  errorMethod: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  errorPath: {
    flex: 1,
    fontSize: 12,
    color: COLORS.mediumGray,
    fontFamily: 'monospace',
  },
  errorBody: {
    fontSize: 11,
    color: '#dc2626',
    marginBottom: 4,
  },
  errorTime: {
    fontSize: 10,
    color: COLORS.mediumGray,
  },
  noErrors: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    paddingVertical: 16,
  },
  refreshInfo: {
    fontSize: 12,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default DiagnosticsScreen;
