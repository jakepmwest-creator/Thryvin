import Constants from 'expo-constants';

const normalizeBase = (value?: string) => {
  if (!value) return value;
  const trimmed = value.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
};

export const getApiBaseUrl = () => {
  const raw =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    (Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL as string | undefined);
  return normalizeBase(raw);
};

export const getRevenueCatKey = () => {
  return (
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ||
    (Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_API_KEY as string | undefined)
  );
};
