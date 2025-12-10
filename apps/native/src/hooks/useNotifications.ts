import { useEffect, useRef } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuthStore } from '../stores/auth-store';
import { router } from 'expo-router';

/**
 * Hook to set up notifications for the app
 */
export function useNotifications() {
  const { user, updateUser } = useAuthStore();
  const hasSetup = useRef(false);

  useEffect(() => {
    if (!user || hasSetup.current) return;

    const setupNotifications = async () => {
      try {
        // Request permissions
        const hasPermission = await notificationService.requestPermissions();
        
        if (hasPermission) {
          // Get push token
          const pushToken = await notificationService.getPushToken();
          
          if (pushToken && pushToken !== user.pushToken) {
            // Update user with push token
            updateUser({ pushToken });
            console.log('✅ Push token saved to user');
          }

          // Schedule daily reminders
          const trainingDays = parseInt(user.trainingDays || '3');
          await notificationService.scheduleDailyReminders(trainingDays);
          console.log('✅ Daily reminders scheduled');

          // Set up notification listeners
          notificationService.setupListeners(
            // On notification received (foreground)
            (notification) => {
              console.log('📬 Notification received:', notification);
            },
            // On notification tapped
            (response) => {
              console.log('👆 Notification tapped:', response);
              const data = response.notification.request.content.data;
              
              // Navigate to appropriate screen
              if (data?.screen) {
                router.push(`/(tabs)/${data.screen}`);
              }
            }
          );
        }

        hasSetup.current = true;
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    setupNotifications();

    // Cleanup on unmount
    return () => {
      notificationService.removeListeners();
    };
  }, [user]);

  return {
    requestPermissions: () => notificationService.requestPermissions(),
    scheduleReminders: (days: number) => notificationService.scheduleDailyReminders(days),
    cancelAll: () => notificationService.cancelAll(),
  };
}
