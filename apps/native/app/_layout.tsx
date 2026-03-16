import React, { useState, useEffect } from 'react';
import { Stack, useSegments, usePathname } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { FloatingCoachButton } from '../src/components/FloatingCoachButton';
import { SplashScreen } from '../src/components/SplashScreen';
import { useAuthStore } from '../src/stores/auth-store';
import { useSubscriptionStore } from '../src/stores/subscription-store';
import { initializeApiUrl } from '../src/services/env';
import { LogBox } from 'react-native';

// Ignore specific warnings in development
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

console.log('[APP] RootLayout starting...');

export default function RootLayout() {
  const segments = useSegments();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const initializeSubscriptions = useSubscriptionStore((state) => state.initialize);
  const [showSplash, setShowSplash] = useState(true);
  const [apiReady, setApiReady] = useState(false);
  
  // Load any saved API URL override from AsyncStorage on mount
  useEffect(() => {
    console.log('[APP] Initializing API URL...');
    initializeApiUrl().then(() => {
      console.log('[APP] API URL initialized');
      setApiReady(true);
    }).catch(err => {
      console.log('[APP] API URL init error (non-fatal):', err);
      setApiReady(true); // Continue anyway
    });
  }, []);
  
  // Show coach button only when user is logged in AND not in auth flow
  const inAuthGroup = segments[0] === '(auth)';
  const showCoachButton = user && !inAuthGroup && !showSplash;
  
  // Determine context mode based on current screen
  // If in workout-hub, use 'in_workout' mode for short/directive responses
  const isInWorkout = pathname?.includes('workout-hub');
  const contextMode = isInWorkout ? 'in_workout' : 'home';

  const handleSplashComplete = () => {
    console.log('[APP] Splash animation complete');
    setShowSplash(false);
  };

  // Failsafe: auto-hide splash after 5 seconds even if animation doesn't complete
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[APP] Splash timeout - hiding splash');
      setShowSplash(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log('[APP] Initializing subscriptions for user:', user?.id);
    initializeSubscriptions(user?.id ? String(user.id) : null);
  }, [user?.id, initializeSubscriptions]);

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <Stack screenOptions={{ headerShown: false }} />
        {showCoachButton && <FloatingCoachButton contextMode={contextMode} />}
        {showSplash && <SplashScreen onAnimationComplete={handleSplashComplete} />}
      </PaperProvider>
    </SafeAreaProvider>
  );
}