import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

// How notifications appear while app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Storage keys ────────────────────────────────────────────────────────────
const KEYS = {
  NOTIF_PREFS: 'thryvin_notif_prefs',
  LAST_STREAK_ALERT: 'thryvin_last_streak_alert',
};

// ─── User notification preferences ───────────────────────────────────────────
export interface NotificationPrefs {
  enabled: boolean;
  morningHour: number;   // default 8
  morningMinute: number; // default 0
  eveningHour: number;   // default 18
  eveningMinute: number; // default 0
}

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: true,
  morningHour: 8,
  morningMinute: 0,
  eveningHour: 18,
  eveningMinute: 0,
};

// ─── Notification IDs (for targeted cancellation) ────────────────────────────
export const NOTIF_IDS = {
  MORNING_WORKOUT: 'thryvin_morning_workout',
  EVENING_REMINDER: 'thryvin_evening_reminder',
  STREAK_AT_RISK: 'thryvin_streak_at_risk',
  REENGAGEMENT: 'thryvin_reengagement',
};

class NotificationService {
  private notificationListener: any;
  private responseListener: any;

  // ── Permissions ─────────────────────────────────────────────────────────────

  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('📱 [Notif] Notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ [Notif] Permissions denied');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('thryvin_workouts', {
        name: 'Workout Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#A22BF6',
      });
      await Notifications.setNotificationChannelAsync('thryvin_achievements', {
        name: 'Achievements & Badges',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#FF4EC7',
      });
    }

    console.log('✅ [Notif] Permissions granted');
    return true;
  }

  // ── Prefs ────────────────────────────────────────────────────────────────────

  async getPrefs(): Promise<NotificationPrefs> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.NOTIF_PREFS);
      return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  }

  async savePrefs(prefs: Partial<NotificationPrefs>): Promise<void> {
    const current = await this.getPrefs();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(KEYS.NOTIF_PREFS, JSON.stringify(updated));
    // Re-schedule with new times
    await this.scheduleSmartReminders({ workoutTitle: undefined });
  }

  // ── Smart daily scheduling ────────────────────────────────────────────────────
  /**
   * Schedule the core 2-notification daily pattern:
   * 1. Morning: specific workout name (if known) at user's preferred time
   * 2. Evening: "still haven't trained?" follow-up if not completed
   *
   * Call this after plan generation or app launch.
   */
  async scheduleSmartReminders({
    workoutTitle,
    isRestDay = false,
  }: {
    workoutTitle?: string;
    isRestDay?: boolean;
  }): Promise<void> {
    const prefs = await this.getPrefs();
    if (!prefs.enabled) return;

    try {
      // Cancel existing recurring reminders before rescheduling
      await Notifications.cancelScheduledNotificationAsync(NOTIF_IDS.MORNING_WORKOUT).catch(() => {});
      await Notifications.cancelScheduledNotificationAsync(NOTIF_IDS.EVENING_REMINDER).catch(() => {});

      if (isRestDay) {
        // Rest day — gentle recovery note only, no follow-up
        await Notifications.scheduleNotificationAsync({
          identifier: NOTIF_IDS.MORNING_WORKOUT,
          content: {
            title: '💤 Rest Day',
            body: 'Recovery is training too. Stretch, hydrate, and recharge for tomorrow! 🧘',
            sound: true,
            data: { screen: 'home' },
          },
          trigger: {
            channelId: 'thryvin_workouts',
            hour: prefs.morningHour,
            minute: prefs.morningMinute,
            repeats: false,
          } as any,
        });
        return;
      }

      // Morning notification — specific if we know today's workout
      const morningTitle = workoutTitle
        ? `🏋️ Today: ${workoutTitle}`
        : '🌅 Your Workout Awaits';
      const morningBody = workoutTitle
        ? `Ready to crush it? Open Thryvin to get started. 💪`
        : `Your workout is planned and ready. Let\'s go! 💪`;

      await Notifications.scheduleNotificationAsync({
        identifier: NOTIF_IDS.MORNING_WORKOUT,
        content: {
          title: morningTitle,
          body: morningBody,
          sound: true,
          data: { screen: 'workouts', workoutTitle },
        },
        trigger: {
          channelId: 'thryvin_workouts',
          hour: prefs.morningHour,
          minute: prefs.morningMinute,
          repeats: true,
        } as any,
      });

      // Evening follow-up — only fires if they haven't trained (we can't know on the client,
      // so we schedule it and cancel it from the workout completion handler)
      await Notifications.scheduleNotificationAsync({
        identifier: NOTIF_IDS.EVENING_REMINDER,
        content: {
          title: '⏰ Still time today!',
          body: workoutTitle
            ? `${workoutTitle} is still waiting. Even 20 min counts. 💪`
            : `Your workout is still pending. Finish strong today!`,
          sound: true,
          data: { screen: 'workouts' },
        },
        trigger: {
          channelId: 'thryvin_workouts',
          hour: prefs.eveningHour,
          minute: prefs.eveningMinute,
          repeats: true,
        } as any,
      });

      console.log('✅ [Notif] Smart reminders scheduled');
    } catch (error) {
      console.error('[Notif] Error scheduling reminders:', error);
    }
  }

  /**
   * Call this when a user completes their workout — cancels the evening follow-up.
   */
  async onWorkoutCompleted(): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(NOTIF_IDS.EVENING_REMINDER);
      console.log('✅ [Notif] Evening reminder cancelled (workout done)');
    } catch {}
  }

  // ── Streak at risk ───────────────────────────────────────────────────────────
  /**
   * Call this on app launch / heartbeat. If user hasn't trained in 2 days,
   * send a streak-at-risk nudge (max once per 48h).
   */
  async checkStreakAtRisk(daysSinceLastWorkout: number): Promise<void> {
    if (daysSinceLastWorkout < 2) return;

    const lastAlert = await AsyncStorage.getItem(KEYS.LAST_STREAK_ALERT);
    const lastAlertTime = lastAlert ? parseInt(lastAlert, 10) : 0;
    const hoursSinceLast = (Date.now() - lastAlertTime) / (1000 * 60 * 60);

    if (hoursSinceLast < 48) return; // Don't spam

    const messages = daysSinceLastWorkout >= 3
      ? [
          { title: '👋 We miss you!', body: 'It\'s been a few days. Your comeback starts today — even a short session counts! 🔥' },
          { title: '🎯 Get back on track', body: 'Your goals don\'t go away. Let\'s pick up where you left off!' },
        ]
      : [
          { title: '🔥 Streak at risk!', body: 'You haven\'t trained in 2 days. Jump back in before your streak breaks!' },
          { title: '⚠️ Don\'t lose it now', body: 'Your streak is on the line. One workout keeps it alive! 💪' },
        ];

    const msg = messages[Math.floor(Math.random() * messages.length)];

    await this.sendImmediate(msg.title, msg.body, { screen: 'workouts' }, 'thryvin_workouts');
    await AsyncStorage.setItem(KEYS.LAST_STREAK_ALERT, Date.now().toString());
  }

  // ── Celebrations & achievements ──────────────────────────────────────────────

  async notifyWorkoutCompleted(xpEarned: number, streakDays: number): Promise<void> {
    const streakNote = streakDays > 1 ? ` ${streakDays}-day streak! 🔥` : '';
    await this.sendImmediate(
      '🎉 Workout Complete!',
      `+${xpEarned} XP earned.${streakNote} Keep it up! 💪`,
      { screen: 'stats' },
      'thryvin_achievements'
    );
    await this.onWorkoutCompleted();
  }

  async notifyBadgeUnlocked(badgeName: string): Promise<void> {
    await this.sendImmediate(
      '🏆 Achievement Unlocked!',
      `You earned the "${badgeName}" badge! Check it out in Awards. 🎖️`,
      { screen: 'awards' },
      'thryvin_achievements'
    );
  }

  async notifyStreakMilestone(days: number): Promise<void> {
    await this.sendImmediate(
      `🔥 ${days}-Day Streak!`,
      `Incredible consistency! ${days} days in a row — you\'re unstoppable! 💪`,
      { screen: 'stats' },
      'thryvin_achievements'
    );
  }

  async notifyNewPlanReady(): Promise<void> {
    await this.sendImmediate(
      '✨ Fresh Plan Ready!',
      'Your AI coach built a new 3-week program just for you. Ready to crush it?',
      { screen: 'workouts' },
      'thryvin_workouts'
    );
  }

  async notifyWeeklyRecap(completed: number, total: number): Promise<void> {
    const emoji = completed >= total ? '🏆' : completed >= Math.ceil(total * 0.5) ? '💪' : '📅';
    await this.sendImmediate(
      `${emoji} Weekly Recap`,
      `You completed ${completed}/${total} workouts this week. ${completed >= total ? 'Perfect week! Incredible!' : 'Keep building that habit!'}`,
      { screen: 'stats' },
      'thryvin_achievements'
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  async sendImmediate(title: string, body: string, data?: any, channelId = 'thryvin_workouts'): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true, data },
        trigger: null,
      });
    } catch (error) {
      console.error('[Notif] sendImmediate error:', error);
    }
  }

  async getPushToken(): Promise<string | null> {
    if (!Device.isDevice) return null;
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch {
      return null;
    }
  }

  setupListeners(
    onReceived?: (n: Notifications.Notification) => void,
    onResponse?: (r: Notifications.NotificationResponse) => void
  ) {
    this.notificationListener = Notifications.addNotificationReceivedListener(n => {
      onReceived?.(n);
    });
    this.responseListener = Notifications.addNotificationResponseReceivedListener(r => {
      onResponse?.(r);
    });
  }

  removeListeners() {
    if (this.notificationListener) Notifications.removeNotificationSubscription(this.notificationListener);
    if (this.responseListener) Notifications.removeNotificationSubscription(this.responseListener);
  }

  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // ─── Legacy compat ─────────────────────────────────────────────────────────
  // Keep these for any existing call sites
  async scheduleDailyReminders(userTrainingDays?: number): Promise<void> {
    await this.scheduleSmartReminders({ workoutTitle: undefined });
  }
  async scheduleSlackingReminder(): Promise<void> {
    await this.checkStreakAtRisk(3);
  }
  async notifyNewWorkout(): Promise<void> {
    await this.notifyNewPlanReady();
  }
  async sendImmediateNotification(title: string, body: string, data?: any): Promise<void> {
    await this.sendImmediate(title, body, data);
  }

  // Keep old NOTIFICATION_MESSAGES shape for any consumer
  NOTIFICATION_MESSAGES = {
    morning: [{ title: '🌅 Your Workout Awaits', body: 'Ready to crush today? Open Thryvin! 💪' }],
    afternoon: [{ title: '⏰ Still time today!', body: 'Your workout is waiting. Finish strong!' }],
    evening: [{ title: '⏰ Still time today!', body: 'Last chance — even a short session counts! 💪' }],
    slacking: [{ title: '👋 We miss you!', body: 'Jump back in before you lose your streak!' }],
    streakMilestone: [{ title: '🔥 Streak Milestone!', body: "You're on fire! Keep going!" }],
    restDay: [{ title: '💤 Rest Day', body: 'Recovery is training too. Rest up! 🧘' }],
    newWorkout: [{ title: '✨ Fresh Workout Ready!', body: 'Your AI coach built something new for you!' }],
    badgeUnlocked: [{ title: '🏆 Achievement Unlocked!', body: 'You earned a new badge! Check Awards.' }],
  };
}

export const notificationService = new NotificationService();
export const NOTIFICATION_MESSAGES = notificationService.NOTIFICATION_MESSAGES;
