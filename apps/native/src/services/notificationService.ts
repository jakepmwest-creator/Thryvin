import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

// Configure how notifications should behave
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationSchedule {
  id: string;
  title: string;
  body: string;
  trigger: {
    hour: number;
    minute: number;
    repeats: boolean;
  };
}

// Notification messages for different scenarios
export const NOTIFICATION_MESSAGES = {
  // Morning workout reminders (7 AM)
  morning: [
    {
      title: "🌅 Rise and Grind!",
      body: "Your workout is ready. Let's start the day strong! 💪"
    },
    {
      title: "Good Morning, Champion!",
      body: "Today's workout is waiting. Time to crush it! 🔥"
    },
    {
      title: "☀️ Morning Motivation",
      body: "Your body will thank you later. Let's get moving!"
    }
  ],
  
  // Afternoon reminders (12 PM)
  afternoon: [
    {
      title: "🏋️ Midday Check-In",
      body: "Still time for your workout today. Keep that streak alive!"
    },
    {
      title: "Lunchtime Reminder",
      body: "Have you completed today's workout? Your body is calling! 📞"
    },
    {
      title: "⏰ Don't Forget!",
      body: "Your workout is still pending. Let's make today count!"
    }
  ],
  
  // Evening reminders (6 PM)
  evening: [
    {
      title: "🌆 Evening Push",
      body: "Last chance to complete today's workout. You got this!"
    },
    {
      title: "Workout Pending!",
      body: "Don't let the day end without your workout. Stay consistent! 💯"
    },
    {
      title: "⚡ Final Call",
      body: "Your evening workout awaits. Let's finish strong!"
    }
  ],
  
  // Slacking reminders (2+ days missed)
  slacking: [
    {
      title: "We Miss You! 😢",
      body: "It's been a while. Ready to get back on track?"
    },
    {
      title: "🚨 Streak in Danger",
      body: "Don't lose your progress! Time to jump back in."
    },
    {
      title: "Your Comeback Starts Now",
      body: "Every champion has setbacks. Let's restart today! 🎯"
    }
  ],
  
  // Streak celebration
  streakMilestone: [
    {
      title: "🔥 Streak Milestone!",
      body: "You're on fire! Keep the momentum going!"
    },
    {
      title: "🏆 Consistency King/Queen",
      body: "Another day, another workout. You're unstoppable!"
    }
  ],
  
  // Rest day reminders
  restDay: [
    {
      title: "🧘 Rest Day",
      body: "Recovery is part of the process. Enjoy your rest day!"
    },
    {
      title: "💤 Active Recovery",
      body: "It's your rest day. Stretch, hydrate, and prepare for tomorrow!"
    }
  ],
  
  // New workout available
  newWorkout: [
    {
      title: "✨ Fresh Workout Ready!",
      body: "Your AI Coach created a new workout just for you!"
    },
    {
      title: "🎯 Today's Challenge",
      body: "New workout unlocked! Let's see what you're made of."
    }
  ],
  
  // Badge unlocked
  badgeUnlocked: [
    {
      title: "🏆 Achievement Unlocked!",
      body: "You earned a new badge! Check it out in Awards."
    }
  ]
};

class NotificationService {
  private notificationListener: any;
  private responseListener: any;

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('📱 Notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Notification permissions denied');
      return false;
    }

    console.log('✅ Notification permissions granted');

    // Set notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Thryvin Fitness',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#A22BF6',
      });
    }

    return true;
  }

  /**
   * Get push notification token
   */
  async getPushToken(): Promise<string | null> {
    if (!Device.isDevice) return null;

    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('📱 Push token:', token);
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Schedule daily workout reminders
   */
  async scheduleDailyReminders(userTrainingDays: number = 3) {
    try {
      // Cancel existing notifications first
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Morning reminder (7 AM)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: NOTIFICATION_MESSAGES.morning[0].title,
          body: NOTIFICATION_MESSAGES.morning[0].body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          hour: 7,
          minute: 0,
          repeats: true,
        },
      });

      // Afternoon reminder (12 PM)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: NOTIFICATION_MESSAGES.afternoon[0].title,
          body: NOTIFICATION_MESSAGES.afternoon[0].body,
          sound: true,
        },
        trigger: {
          hour: 12,
          minute: 0,
          repeats: true,
        },
      });

      // Evening reminder (6 PM)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: NOTIFICATION_MESSAGES.evening[0].title,
          body: NOTIFICATION_MESSAGES.evening[0].body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          hour: 18,
          minute: 0,
          repeats: true,
        },
      });

      console.log('✅ Daily reminders scheduled');
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  }

  /**
   * Send immediate notification
   */
  async sendImmediateNotification(title: string, body: string, data?: any) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          data,
        },
        trigger: null, // Immediate
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Schedule slacking reminder (when user hasn't worked out in 2+ days)
   */
  async scheduleSlackingReminder() {
    const randomMessage = NOTIFICATION_MESSAGES.slacking[
      Math.floor(Math.random() * NOTIFICATION_MESSAGES.slacking.length)
    ];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: randomMessage.title,
        body: randomMessage.body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        seconds: 60 * 60 * 12, // In 12 hours
      },
    });
  }

  /**
   * Notify about new workout
   */
  async notifyNewWorkout() {
    const randomMessage = NOTIFICATION_MESSAGES.newWorkout[
      Math.floor(Math.random() * NOTIFICATION_MESSAGES.newWorkout.length)
    ];

    await this.sendImmediateNotification(randomMessage.title, randomMessage.body);
  }

  /**
   * Notify about badge unlocked
   */
  async notifyBadgeUnlocked(badgeName: string) {
    await this.sendImmediateNotification(
      '🏆 Achievement Unlocked!',
      `You earned the "${badgeName}" badge! 🎉`,
      { screen: 'awards' }
    );
  }

  /**
   * Notify about streak milestone
   */
  async notifyStreakMilestone(days: number) {
    await this.sendImmediateNotification(
      '🔥 Streak Milestone!',
      `${days} days strong! You're on fire! Keep it going! 💪`,
      { screen: 'stats' }
    );
  }

  /**
   * Set up notification listeners
   */
  setupListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ) {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received:', notification);
      onNotificationReceived?.(notification);
    });

    // Listener for user tapping on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      onNotificationResponse?.(response);
    });
  }

  /**
   * Clean up listeners
   */
  removeListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * Get all scheduled notifications (for debugging)
   */
  async getScheduledNotifications() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log('📅 Scheduled notifications:', scheduled);
    return scheduled;
  }

  /**
   * Cancel all notifications
   */
  async cancelAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🗑️ All notifications cancelled');
  }
}

export const notificationService = new NotificationService();
