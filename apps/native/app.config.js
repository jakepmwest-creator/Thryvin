import path from 'path';
import dotenv from 'dotenv';

// Load .env from the native app directory
const envResult = dotenv.config({ path: path.resolve(__dirname, '.env') });
if (envResult.error) {
  console.warn('[app.config] Could not load .env:', envResult.error.message);
}

// Stable tunnel URL as fallback when .env is not loaded by Metro/Expo Go
const FALLBACK_API_URL = 'https://induced-raised-polymer-protect.trycloudflare.com';

export default {
  expo: {
    name: 'native',
    slug: 'native',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: false,
    scheme: 'thryvin',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
    },
    android: {
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
      bridgeless: false,
      turboModules: false,
    },
    extra: {
      openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
      EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || FALLBACK_API_URL,
      EXPO_PUBLIC_REVENUECAT_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
    },
  },
};
