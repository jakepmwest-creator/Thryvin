import { toast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  workoutReminders: boolean;
  hydrationReminders: boolean;
  mealReminders: boolean;
  restDayReminders: boolean;
  streakAlerts: boolean;
  progressUpdates: boolean;
}

export interface NotificationData {
  id: string;
  type: 'workout' | 'hydration' | 'meal' | 'rest' | 'streak' | 'progress';
  title: string;
  message: string;
  scheduledTime?: Date;
  icon?: string;
}

class NotificationManager {
  private preferences: NotificationPreferences;
  private scheduledNotifications: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // Load preferences from localStorage
    const savedPrefs = localStorage.getItem('thryvin-notification-preferences');
    this.preferences = savedPrefs ? JSON.parse(savedPrefs) : this.getDefaultPreferences();
  }

  private getDefaultPreferences(): NotificationPreferences {
    return {
      workoutReminders: true,
      hydrationReminders: true,
      mealReminders: true,
      restDayReminders: true,
      streakAlerts: true,
      progressUpdates: true
    };
  }

  updatePreferences(newPrefs: Partial<NotificationPreferences>) {
    this.preferences = { ...this.preferences, ...newPrefs };
    localStorage.setItem('thryvin-notification-preferences', JSON.stringify(this.preferences));
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // Schedule workout reminder (30 minutes before)
  scheduleWorkoutReminder(workoutTime: Date, workoutName: string) {
    if (!this.preferences.workoutReminders) return;

    const reminderTime = new Date(workoutTime.getTime() - 30 * 60 * 1000); // 30 minutes before
    const now = new Date();
    
    if (reminderTime > now) {
      const timeoutId = setTimeout(() => {
        this.showNotification({
          id: `workout-${Date.now()}`,
          type: 'workout',
          title: '⏰ Workout Reminder',
          message: `It's 30 mins before your ${workoutName} — ready to go?`,
          icon: '💪'
        });
      }, reminderTime.getTime() - now.getTime());

      this.scheduledNotifications.set(`workout-${workoutTime.getTime()}`, timeoutId);
    }
  }

  // Show hydration reminder
  showHydrationReminder() {
    if (!this.preferences.hydrationReminders) return;

    this.showNotification({
      id: `hydration-${Date.now()}`,
      type: 'hydration',
      title: '💧 Stay Hydrated',
      message: "You haven't logged water today.",
      icon: '💧'
    });
  }

  // Show meal reminder
  showMealReminder(mealType: string = 'meal') {
    if (!this.preferences.mealReminders) return;

    this.showNotification({
      id: `meal-${Date.now()}`,
      type: 'meal',
      title: '🍽️ Meal Time',
      message: `Time to log your next ${mealType}?`,
      icon: '🍽️'
    });
  }

  // Show rest day reminder
  showRestDayReminder() {
    if (!this.preferences.restDayReminders) return;

    this.showNotification({
      id: `rest-${Date.now()}`,
      type: 'rest',
      title: '💤 Rest Day Tomorrow',
      message: "Rest day tomorrow. Want a recovery suggestion?",
      icon: '💤'
    });
  }

  // Show streak notification
  showStreakNotification(streakDays: number) {
    if (!this.preferences.streakAlerts) return;

    let message = `🔥 ${streakDays}-day streak, let's go!`;
    if (streakDays >= 7) {
      message = `🔥 Amazing ${streakDays}-day streak! You're on fire!`;
    } else if (streakDays >= 5) {
      message = `🔥 ${streakDays}-day streak! Almost at your weekly badge!`;
    }

    this.showNotification({
      id: `streak-${Date.now()}`,
      type: 'streak',
      title: '🔥 Streak Alert',
      message,
      icon: '🔥'
    });
  }

  // Show progress achievement
  showProgressAchievement(achievement: string) {
    if (!this.preferences.progressUpdates) return;

    this.showNotification({
      id: `progress-${Date.now()}`,
      type: 'progress',
      title: '🎉 Achievement Unlocked',
      message: achievement,
      icon: '🏆'
    });
  }

  // Show weekly target completion
  showWeeklyTargetCompletion() {
    if (!this.preferences.progressUpdates) return;

    this.showNotification({
      id: `weekly-target-${Date.now()}`,
      type: 'progress',
      title: '🎯 Weekly Target Hit',
      message: "You've hit your weekly target — amazing!",
      icon: '🎯'
    });
  }

  showNotification(notification: NotificationData) {
    // Show toast notification
    toast({
      title: notification.title,
      description: notification.message,
      duration: 5000,
    });

    // Store notification history
    this.storeNotificationHistory(notification);
  }

  private storeNotificationHistory(notification: NotificationData) {
    const history = this.getNotificationHistory();
    history.unshift({
      ...notification,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 notifications
    if (history.length > 50) {
      history.splice(50);
    }
    
    localStorage.setItem('thryvin-notification-history', JSON.stringify(history));
  }

  getNotificationHistory(): (NotificationData & { timestamp: string })[] {
    const history = localStorage.getItem('thryvin-notification-history');
    return history ? JSON.parse(history) : [];
  }

  // Clear all scheduled notifications
  clearAllScheduled() {
    this.scheduledNotifications.forEach(timeoutId => clearTimeout(timeoutId));
    this.scheduledNotifications.clear();
  }

  // Auto-schedule daily reminders
  setupDailyReminders() {
    // Schedule hydration reminder every 2 hours
    const hydrationInterval = setInterval(() => {
      const lastHydration = localStorage.getItem('thryvin-last-hydration');
      const now = new Date();
      
      if (!lastHydration || (now.getTime() - new Date(lastHydration).getTime()) > 2 * 60 * 60 * 1000) {
        this.showHydrationReminder();
      }
    }, 2 * 60 * 60 * 1000); // Every 2 hours

    // Schedule meal reminders
    const mealTimes = [
      { hour: 8, meal: 'breakfast' },
      { hour: 12, meal: 'lunch' },
      { hour: 18, meal: 'dinner' }
    ];

    mealTimes.forEach(({ hour, meal }) => {
      const now = new Date();
      const mealTime = new Date();
      mealTime.setHours(hour, 0, 0, 0);
      
      if (mealTime < now) {
        mealTime.setDate(mealTime.getDate() + 1);
      }

      const timeUntilMeal = mealTime.getTime() - now.getTime();
      setTimeout(() => {
        this.showMealReminder(meal);
      }, timeUntilMeal);
    });
  }
}

export const notificationManager = new NotificationManager();