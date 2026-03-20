import path from 'path';
import dotenv from 'dotenv';

// Load .env from the native app directory
const envResult = dotenv.config({ path: path.resolve(__dirname, '.env') });
if (envResult.error) {
  console.warn('[app.config] Could not load .env:', envResult.error.message);
}

const RAILWAY_API_URL = 'https://thryvin-production-fbdd.up.railway.app';

export default {
  expo: {
    name: 'Thryvin',
    slug: 'thryvin',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: false,
    scheme: 'thryvin',
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      url: 'https://u.expo.dev/ca2d383b-786b-4caa-bf8c-84ea08c5de58',
    },
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#A259FF',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.thryvin.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#A259FF',
      },
      package: 'com.thryvin.app',
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: ['expo-router', 'expo-updates'],
    experiments: {
      bridgeless: false,
      turboModules: false,
    },
    extra: {
      eas: {
        projectId: 'ca2d383b-786b-4caa-bf8c-84ea08c5de58',
      },
      openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
      EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || RAILWAY_API_URL,
      EXPO_PUBLIC_REVENUECAT_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
    },
  },
};
