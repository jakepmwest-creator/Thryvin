import Constants from 'expo-constants';

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

export const getApiBaseUrlInfo = () => {
  const envValue = process.env.EXPO_PUBLIC_API_BASE_URL;
  const extraValue = getExtraValue('EXPO_PUBLIC_API_BASE_URL');
  const value = normalizeBase(envValue || extraValue);
  return {
    value,
    source: envValue ? 'env' : extraValue ? 'extra' : 'missing',
  };
};

export const getApiBaseUrl = () => getApiBaseUrlInfo().value;

export const getRevenueCatKey = () => {
  return (
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ||
    getExtraValue('EXPO_PUBLIC_REVENUECAT_API_KEY')
  );
};
