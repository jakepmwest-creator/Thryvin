/**
 * API Client for Mobile (Expo)
 * 
 * PART A4-A6: Bearer token authentication
 * - Stores token in SecureStore
 * - Adds Authorization header to all requests
 * - Handles 401 with automatic logout
 */

import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { getApiBaseUrl } from './env';

/** Resolve the base URL dynamically on every call (supports runtime override). */
function getBaseNoApi(): string {
  const raw = getApiBaseUrl() || '';
  const normalized = raw.replace(/\/+$/, '');
  return normalized.endsWith('/api') ? normalized.slice(0, -4) : normalized;
}

export const buildApiUrl = (endpoint: string) => {
  const base = getBaseNoApi();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!base) return path;
  if (path.startsWith('/api/')) {
    return `${base}${path}`;
  }
  return `${base}/api${path}`;
};

// Token storage key
const TOKEN_KEY = 'thryvin_access_token';

// Last API errors for diagnostics
export const recentApiErrors: Array<{
  timestamp: string;
  endpoint: string;
  status: number;
  body: string;
}> = [];

const MAX_ERRORS = 5;

function logError(endpoint: string, status: number, body: string) {
  recentApiErrors.unshift({
    timestamp: new Date().toISOString(),
    endpoint,
    status,
    body: body.slice(0, 200),
  });
  if (recentApiErrors.length > MAX_ERRORS) {
    recentApiErrors.pop();
  }
}

/**
 * Store access token securely
 */
export async function storeToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    console.log('[API] Token stored');
  } catch (error) {
    console.error('[API] Failed to store token:', error);
  }
}

/**
 * Get stored access token
 */
export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('[API] Failed to get token:', error);
    return null;
  }
}

/**
 * Clear stored token (logout)
 */
export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    console.log('[API] Token cleared');
  } catch (error) {
    console.error('[API] Failed to clear token:', error);
  }
}

/**
 * Check if token exists
 */
export async function hasToken(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}

/**
 * Handle 401 response - clear token and redirect to login
 */
async function handle401(): Promise<void> {
  await clearToken();
  
  // Show toast/alert
  Alert.alert(
    'Session Expired',
    'Please log in again.',
    [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
  );
}

/**
 * Make authenticated API request
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; data?: T; error?: string; status: number }> {
  if (!getBaseNoApi()) {
    return {
      ok: false,
      error: 'API base URL is not configured. Open Diagnostics on the login screen to set it.',
      status: 0,
    };
  }
  const token = await getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
    ...(options.headers || {}),
  };
  
  // Add Bearer token if available
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  const url = buildApiUrl(endpoint);
  
  try {
    console.log(`[API] ${options.method || 'GET'} ${endpoint}`);
    
    // Retry once on network errors (tunnel may be restarting)
    let response: Response;
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        response = await fetch(url, {
          ...options,
          headers,
        });
        lastError = null;
        break;
      } catch (fetchErr: any) {
        lastError = fetchErr;
        if (attempt === 0) {
          console.log(`[API] Retry ${endpoint} after network error: ${fetchErr.message}`);
          await new Promise(r => setTimeout(r, 1500));
        }
      }
    }
    
    if (lastError || !response!) {
      throw lastError || new Error('Network request failed after retry');
    }
    
    const contentType = response.headers.get('content-type');
    let data: any;
    
    // Parse response
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      logError(endpoint, response.status, text);
      return {
        ok: false,
        error: `Server returned non-JSON response: ${text.slice(0, 100)}`,
        status: response.status,
      };
    }
    
    // Handle 401 - session expired
    if (response.status === 401) {
      logError(endpoint, 401, JSON.stringify(data));
      await handle401();
      return {
        ok: false,
        error: data.error || 'Session expired',
        status: 401,
      };
    }
    
    // Handle other errors
    if (!response.ok) {
      logError(endpoint, response.status, JSON.stringify(data));
      return {
        ok: false,
        error: data.error || data.message || `Request failed with status ${response.status}`,
        status: response.status,
        data,
      };
    }
    
    return {
      ok: true,
      data,
      status: response.status,
    };
  } catch (error: any) {
    console.error(`[API] Request failed: ${endpoint}`, error);
    logError(endpoint, 0, error.message);
    return {
      ok: false,
      error: error.message || 'Network request failed',
      status: 0,
    };
  }
}

/**
 * GET request
 */
export function get<T = any>(endpoint: string): Promise<{ ok: boolean; data?: T; error?: string; status: number }> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
export function post<T = any>(
  endpoint: string,
  body?: any
): Promise<{ ok: boolean; data?: T; error?: string; status: number }> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request
 */
export function put<T = any>(
  endpoint: string,
  body?: any
): Promise<{ ok: boolean; data?: T; error?: string; status: number }> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request
 */
export function del<T = any>(endpoint: string): Promise<{ ok: boolean; data?: T; error?: string; status: number }> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

// ============================================
// AUTH API
// ============================================

export interface LoginResponse {
  ok: boolean;
  user: any;
  accessToken: string;
  requestId: string;
}

export interface RegisterResponse {
  ok: boolean;
  user: any;
  accessToken: string;
  requestId: string;
}

/**
 * Login and store token
 */
export async function login(email: string, password: string): Promise<{ ok: boolean; user?: any; error?: string }> {
  const result = await post<LoginResponse>('/auth/login', { email, password });
  
  if (result.ok && result.data?.accessToken) {
    await storeToken(result.data.accessToken);
    return { ok: true, user: result.data.user };
  }
  
  return { ok: false, error: result.error || 'Login failed' };
}

/**
 * Register and store token
 */
export async function register(userData: any): Promise<{ ok: boolean; user?: any; error?: string }> {
  const result = await post<RegisterResponse>('/auth/register', userData);
  
  if (result.ok && result.data?.accessToken) {
    await storeToken(result.data.accessToken);
    return { ok: true, user: result.data.user };
  }
  
  return { ok: false, error: result.error || 'Registration failed' };
}

/**
 * Verify current token is valid
 */
export async function verifyAuth(): Promise<{ ok: boolean; user?: any }> {
  const result = await get('/api/auth/me');
  return { ok: result.ok, user: result.data?.user };
}

/**
 * Logout - clear token
 */
export async function logout(): Promise<void> {
  await post('/api/auth/logout');
  await clearToken();
}

// ============================================
// PLAN API (PART B)
// ============================================

export interface PlanEnsureResponse {
  ok: boolean;
  planId: string;
  workoutsCount: number;
  lastGeneratedAt: string;
  generated: boolean;
  requestId: string;
}

export interface PlanStatusResponse {
  ok: boolean;
  exists: boolean;
  workoutsCount: number;
  lastGeneratedAt: string | null;
  planId: string | null;
  requestId: string;
}

/**
 * Ensure user has a workout plan (idempotent)
 */
export async function ensurePlan(): Promise<{ ok: boolean; data?: PlanEnsureResponse; error?: string }> {
  const result = await post<PlanEnsureResponse>('/api/workouts/plan/ensure');
  return { ok: result.ok, data: result.data, error: result.error };
}

/**
 * Get plan status
 */
export async function getPlanStatus(): Promise<{ ok: boolean; data?: PlanStatusResponse; error?: string }> {
  const result = await get<PlanStatusResponse>('/api/workouts/plan/status');
  return { ok: result.ok, data: result.data, error: result.error };
}

// ============================================
// COACH ACTIONS API (PART C)
// ============================================

export interface CoachActionExecuteResponse {
  ok: boolean;
  message: string;
  updatedPlanSummary: {
    workoutsCount: number;
    workouts: Array<{ id: number; dayName: string; workoutType: string; duration: number }>;
  };
  requestId: string;
}

/**
 * Execute a coach action
 */
export async function executeCoachAction(action: any): Promise<{ ok: boolean; data?: CoachActionExecuteResponse; error?: string }> {
  const result = await post<CoachActionExecuteResponse>('/api/coach/actions/execute', { action });
  return { ok: result.ok, data: result.data, error: result.error };
}

// ============================================
// DIAGNOSTICS
// ============================================

export interface DiagnosticsInfo {
  apiBaseUrl: string;
  tokenPresent: boolean;
  recentErrors: typeof recentApiErrors;
}

/**
 * Get diagnostics info for the diagnostics screen
 */
export async function getDiagnosticsInfo(): Promise<DiagnosticsInfo> {
  const tokenPresent = await hasToken();
  return {
    apiBaseUrl: getBaseNoApi(),
    tokenPresent,
    recentErrors,
  };
}
