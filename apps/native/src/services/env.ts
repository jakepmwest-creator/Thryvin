import Constants from 'expo-constants';

export const getApiBaseUrl = () => {
  return (
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    (Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL as string | undefined)
  );
};

export const getRevenueCatKey = () => {
  return (
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ||
    (Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_API_KEY as string | undefined)
  );
};
