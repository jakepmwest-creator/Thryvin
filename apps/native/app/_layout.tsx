import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, useSegments, usePathname } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { FloatingCoachButton } from '../src/components/FloatingCoachButton';
import { useAuthStore } from '../src/stores/auth-store';
import { useSubscriptionStore } from '../src/stores/subscription-store';
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
  
  // Show coach button only when user is logged in AND not in auth flow
  const inAuthGroup = segments[0] === '(auth)';
  const showCoachButton = user && !inAuthGroup;
  
  // Determine context mode based on current screen
  const isInWorkout = pathname?.includes('workout-hub');
  const contextMode = isInWorkout ? 'in_workout' : 'home';

  useEffect(() => {
    console.log('[APP] Initializing subscriptions for user:', user?.id);
    initializeSubscriptions(user?.id ? String(user.id) : null);
  }, [user?.id, initializeSubscriptions]);

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <Stack screenOptions={{ headerShown: false }} />
        {showCoachButton && <FloatingCoachButton contextMode={contextMode} />}
      </PaperProvider>
    </SafeAreaProvider>
  );
}
