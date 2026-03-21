import React, { useState, useEffect } from 'react';
import { Stack, useSegments, usePathname } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SplashScreen } from '../src/components/SplashScreen';
import { useAuthStore } from '../src/stores/auth-store';
import { useSubscriptionStore } from '../src/stores/subscription-store';
import { initializeApiUrl } from '../src/services/env';

export default function RootLayout() {
  const segments = useSegments();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const initializeSubscriptions = useSubscriptionStore((state) => state.initialize);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    initializeApiUrl();
    checkAuth();
    // Clear any stale workout generation lock left over from a previous crash.
    // This ensures workouts reload correctly after the app is force-closed or crashes.
    AsyncStorage.removeItem('workout_generation_lock').catch(() => {});
    AsyncStorage.removeItem('today_workout').catch(() => {});
    AsyncStorage.removeItem('today_workout_date').catch(() => {});
  }, [checkAuth]);

  const inAuthGroup = segments[0] === '(auth)';
  const showCoachButton = !!user && !inAuthGroup && !showSplash;

  const isInWorkout = pathname?.includes('workout-hub');
  const contextMode = isInWorkout ? 'in_workout' : 'home';

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  useEffect(() => {
    initializeSubscriptions(user?.id ? String(user.id) : null);
  }, [user?.id, initializeSubscriptions]);

  const CoachButton = showCoachButton
    ? require('../src/components/FloatingCoachButton').FloatingCoachButton
    : null;

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <Stack screenOptions={{ headerShown: false }} />
        {CoachButton ? <CoachButton contextMode={contextMode} /> : null}
        {showSplash && <SplashScreen onAnimationComplete={handleSplashComplete} />}
      </PaperProvider>
    </SafeAreaProvider>
  );
}
