import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { FloatingCoachButton } from '../src/components/FloatingCoachButton';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <FloatingCoachButton />
      </PaperProvider>
    </SafeAreaProvider>
  );
}