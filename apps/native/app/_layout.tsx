import React, { useState, useEffect } from 'react';
import { Stack, useSegments, usePathname } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { FloatingCoachButton } from '../src/components/FloatingCoachButton';
import { SplashScreen } from '../src/components/SplashScreen';
import { useAuthStore } from '../src/stores/auth-store';
import { useSubscriptionStore } from '../src/stores/subscription-store';
import { initializeApiUrl } from '../src/services/env';

export default function RootLayout() {
  const segments = useSegments();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const initializeSubscriptions = useSubscriptionStore((state) => state.initialize);
  const [showSplash, setShowSplash] = useState(true);
  const [apiReady, setApiReady] = useState(false);
  
  // Load any saved API URL override from AsyncStorage on mount
  useEffect(() => {
    initializeApiUrl().then(() => setApiReady(true));
  }, []);
  
  // Show coach button only when user is logged in AND not in auth flow
  const inAuthGroup = segments[0] === '(auth)';
  const showCoachButton = user && !inAuthGroup && !showSplash;
  
  // Determine context mode based on current screen
  // If in workout-hub, use 'in_workout' mode for short/directive responses
  const isInWorkout = pathname?.includes('workout-hub');
  const contextMode = isInWorkout ? 'in_workout' : 'home';

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  useEffect(() => {
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