export default {
  expo: {
    name: "Thryvin'",
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
      backgroundColor: '#A259FF',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.thryvin.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.thryvin.app',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-image-picker',
      'expo-speech-recognition',
    ],
    extra: {
      eas: {
        projectId: 'ca2d383b-786b-4caa-bf8c-84ea08c5de58',
      },
      EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://thryvin-production-fbdd.up.railway.app',
      EXPO_PUBLIC_OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
      EXPO_PUBLIC_REVENUECAT_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
    },
  },
};
