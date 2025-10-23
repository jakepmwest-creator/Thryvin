import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { WorkoutsProvider } from '../store/workoutsStore';
import { useAuthStore } from '../src/stores/auth-store';

export default function Layout() {
  const { user, checkAuth, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect to tabs if authenticated and in auth screens
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <WorkoutsProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="index" />
          </Stack>
          <StatusBar style="dark" backgroundColor="#ffffff" />
        </WorkoutsProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
