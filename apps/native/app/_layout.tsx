import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { WorkoutsProvider } from '../store/workoutsStore';
import { useAuthStore } from '../src/stores/auth-store';
import { useEffect } from 'react';

export default function Layout() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <WorkoutsProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="index" />
          </Stack>
          <StatusBar style="dark" backgroundColor="#ffffff" />
        </WorkoutsProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
