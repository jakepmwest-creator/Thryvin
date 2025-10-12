import { Stack } from 'expo-router';
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
    <PaperProvider>
      <WorkoutsProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </WorkoutsProvider>
    </PaperProvider>
  );
}
