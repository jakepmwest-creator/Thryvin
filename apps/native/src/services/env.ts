import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

let _overrideUrl: string | undefined;

const OVERRIDE_KEY = 'thryvin_api_url_override';

const normalizeBase = (value?: string) => {
  if (!value) return value;
  const trimmed = value.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
};

const getExtraValue = (key: string) => {
  const extra =
    (Constants.expoConfig?.extra as Record<string, string> | undefined) ||
    ((Constants as any).manifest?.extra as Record<string, string> | undefined) ||
    ((Constants as any).manifest2?.extra as Record<string, string> | undefined);
  return extra?.[key];
};

/**
 * Load any saved URL override from AsyncStorage on app start.
 * Call this once in _layout.tsx before rendering auth screens.
 */
export const initializeApiUrl = async () => {
  try {
    const saved = await AsyncStorage.getItem(OVERRIDE_KEY);
    if (saved) {
      _overrideUrl = normalizeBase(saved);
      console.log('[ENV] Loaded API URL override from storage:', _overrideUrl);
    }
  } catch (e) {
    console.warn('[ENV] Failed to load API URL override:', e);
  }
};

/**
 * Save a manual URL override. Persists to AsyncStorage.
 * Used by the diagnostics panel on the login screen.
 */
export const setApiBaseUrlOverride = async (url: string) => {
  const normalized = normalizeBase(url);
  _overrideUrl = normalized;
  try {
    await AsyncStorage.setItem(OVERRIDE_KEY, url);
    console.log('[ENV] API URL override saved:', normalized);
  } catch (e) {
    console.warn('[ENV] Failed to save API URL override:', e);
  }
};

export const clearApiBaseUrlOverride = async () => {
  _overrideUrl = undefined;
  try {
    await AsyncStorage.removeItem(OVERRIDE_KEY);
  } catch (e) {}
};

export const getApiBaseUrlInfo = () => {
  if (_overrideUrl) {
    return { value: _overrideUrl, source: 'override' as const };
  }
  const envValue = process.env.EXPO_PUBLIC_API_BASE_URL;
  const extraValue = getExtraValue('EXPO_PUBLIC_API_BASE_URL');
  const value = normalizeBase(envValue || extraValue);
  return {
    value,
    source: envValue ? ('env' as const) : extraValue ? ('extra' as const) : ('missing' as const),
  };
};

export const getApiBaseUrl = () => getApiBaseUrlInfo().value;

export const getRevenueCatKey = () => {
  return (
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ||
    getExtraValue('EXPO_PUBLIC_REVENUECAT_API_KEY')
  );
};
