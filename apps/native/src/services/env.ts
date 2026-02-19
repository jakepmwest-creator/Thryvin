import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
 * Called on app start — clears any stale URL override left from
 * the old diagnostics panel so it can never hijack the connection again.
 */
export const initializeApiUrl = async () => {
  try {
    await AsyncStorage.removeItem(OVERRIDE_KEY);
  } catch (e) {
    // ignore
  }
};

// Stable tunnel URL fallback when env vars aren't injected by Expo Go
const FALLBACK_API_URL = 'https://thryvin-production-fbdd.up.railway.app';

export const getApiBaseUrlInfo = () => {
  const envValue = process.env.EXPO_PUBLIC_API_BASE_URL;
  const extraValue = getExtraValue('EXPO_PUBLIC_API_BASE_URL');
  const raw = envValue || extraValue;
  const value = normalizeBase(raw) || FALLBACK_API_URL;
  return {
    value,
    source: envValue ? ('env' as const) : extraValue ? ('extra' as const) : ('fallback' as const),
  };
};

export const getApiBaseUrl = () => getApiBaseUrlInfo().value;

export const getRevenueCatKey = () => {
  return (
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ||
    getExtraValue('EXPO_PUBLIC_REVENUECAT_API_KEY')
  );
};
