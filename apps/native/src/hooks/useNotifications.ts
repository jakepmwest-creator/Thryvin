import { useEffect, useRef } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuthStore } from '../stores/auth-store';
import { useWorkoutStore } from '../stores/workout-store';
import { router } from 'expo-router';

/**
 * Hook to set up smart notifications for the app.
 * - Requests permissions on first load
 * - Schedules today's specific workout as the morning notification
 * - Wires up deep-link navigation when a notification is tapped
 */
export function useNotifications() {
  const { user, updateUser } = useAuthStore();
  const { weekWorkouts } = useWorkoutStore();
  const hasSetup = useRef(false);

  useEffect(() => {
    if (!user || hasSetup.current) return;

    const setupNotifications = async () => {
      try {
        const hasPermission = await notificationService.requestPermissions();

        if (hasPermission) {
          // Push token
          const pushToken = await notificationService.getPushToken();
          if (pushToken && pushToken !== (user as any).pushToken) {
            updateUser({ pushToken } as any);
          }

          // Determine today's workout (if any)
          const today = new Date().toDateString();
          const todayWorkout = weekWorkouts.find(
            (w) => new Date(w.date).toDateString() === today
          );
          const isRestDay = !!todayWorkout?.isRestDay;
          const workoutTitle =
            !isRestDay && todayWorkout?.title ? todayWorkout.title : undefined;

          // Schedule smart 2-notification pattern
          await notificationService.scheduleSmartReminders({
            workoutTitle,
            isRestDay,
          });

          // Streak check — if user hasn't worked out in 2+ days, nudge them
          const completedDates = weekWorkouts
            .filter((w) => w.completed && !w.isRestDay)
            .map((w) => new Date(w.completedAt || w.date).getTime())
            .sort((a, b) => b - a);

          if (completedDates.length === 0) {
            await notificationService.checkStreakAtRisk(7); // assume long gap for new users
          } else {
            const daysSinceLast = Math.floor(
              (Date.now() - completedDates[0]) / (1000 * 60 * 60 * 24)
            );
            await notificationService.checkStreakAtRisk(daysSinceLast);
          }

          // Notification tap → navigate to correct screen
          notificationService.setupListeners(
            undefined,
            (response) => {
              const data = response.notification.request.content.data;
              if (data?.screen) {
                router.push(`/(tabs)/${data.screen}` as any);
              }
            }
          );
        }

        hasSetup.current = true;
      } catch (error) {
        console.error('[Notif] Setup error:', error);
      }
    };

    setupNotifications();

    return () => {
      notificationService.removeListeners();
    };
  }, [user, weekWorkouts]);

  return {
    requestPermissions: () => notificationService.requestPermissions(),
    scheduleReminders: (days?: number) => notificationService.scheduleSmartReminders({}),
    cancelAll: () => notificationService.cancelAll(),
    onWorkoutCompleted: (xp: number, streak: number) =>
      notificationService.notifyWorkoutCompleted(xp, streak),
    onBadgeUnlocked: (name: string) => notificationService.notifyBadgeUnlocked(name),
    onNewPlanReady: () => notificationService.notifyNewPlanReady(),
    onWeeklyRecap: (done: number, total: number) =>
      notificationService.notifyWeeklyRecap(done, total),
  };
}
