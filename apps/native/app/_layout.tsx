import React from 'react';
import { Stack, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { FloatingCoachButton } from '../src/components/FloatingCoachButton';
import { useAuthStore } from '../src/stores/auth-store';

export default function RootLayout() {
  const segments = useSegments();
  const user = useAuthStore((state) => state.user);
  
  // Show coach button only when user is logged in AND not in auth flow
  const inAuthGroup = segments[0] === '(auth)';
  const showCoachButton = user && !inAuthGroup;

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <Stack screenOptions={{ headerShown: false }} />
        {showCoachButton && <FloatingCoachButton />}
      </PaperProvider>
    </SafeAreaProvider>
  );
}