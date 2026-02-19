import path from 'path';
import dotenv from 'dotenv';

const envResult = dotenv.config({ path: path.resolve(__dirname, '.env') });
if (envResult.error) {
  console.warn('[app.config] Could not load .env:', envResult.error.message);
}

const FALLBACK_API_URL =
  'https://thryvin-production-fbdd.up.railway.app';

export default ({ config }) => ({
  ...config,
  name: 'Thryvin',
  slug: 'thryvin',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  scheme: 'thryvin',

  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },

  ios: {
    bundleIdentifier: "com.thryvin.app",
    supportsTablet: true,
  },

  android: {
    package: "com.thryvin.app",
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },

  web: {
    favicon: './assets/favicon.png',
  },

  plugins: ['expo-router'],

  experiments: {
    bridgeless: true,
    turboModules: true,
  },

  extra: {
    ...config.extra,
    openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    EXPO_PUBLIC_API_BASE_URL:
      process.env.EXPO_PUBLIC_API_BASE_URL || FALLBACK_API_URL,
    EXPO_PUBLIC_REVENUECAT_API_KEY:
      process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
    eas: {
      projectId: 'ca2d383b-786b-4caa-bf8c-84ea08c5de58',
    },
  },
});
