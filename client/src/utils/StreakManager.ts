import { progressTracker } from './ProgressTracker';
import { notificationManager } from './NotificationManager';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate?: string;
  streakStartDate?: string;
  weeklyStreakGoal: number;
  monthlyStreakGoal: number;
}

class StreakManager {
  private streakKey = 'thryvin-streak-data';

  getStreakData(): StreakData {
    const stored = localStorage.getItem(this.streakKey);
    return stored ? JSON.parse(stored) : this.getInitialStreakData();
  }

  private getInitialStreakData(): StreakData {
    return {
      currentStreak: 0,
      longestStreak: 0,
      weeklyStreakGoal: 4,
      monthlyStreakGoal: 16
    };
  }

  saveStreakData(data: StreakData) {
    localStorage.setItem(this.streakKey, JSON.stringify(data));
  }

  recordWorkout(): StreakData {
    const streakData = this.getStreakData();
    const today = new Date();
    const todayString = today.toDateString();
    
    // Don't increment if already worked out today
    if (streakData.lastWorkoutDate === todayString) {
      return streakData;
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();
    
    if (streakData.lastWorkoutDate === yesterdayString) {
      // Consecutive day - increment streak
      streakData.currentStreak++;
    } else if (!streakData.lastWorkoutDate || streakData.lastWorkoutDate !== todayString) {
      // Starting new streak or continuing same day
      if (streakData.currentStreak === 0) {
        streakData.streakStartDate = todayString;
      }
      streakData.currentStreak = 1;
    }
    
    // Update longest streak
    if (streakData.currentStreak > streakData.longestStreak) {
      streakData.longestStreak = streakData.currentStreak;
    }
    
    streakData.lastWorkoutDate = todayString;
    this.saveStreakData(streakData);
    
    // Show streak notifications
    this.checkStreakMilestones(streakData.currentStreak);
    
    return streakData;
  }

  checkStreakMilestones(currentStreak: number) {
    // Show motivational messages for streak milestones
    if (currentStreak === 3) {
      notificationManager.showStreakNotification(currentStreak);
    } else if (currentStreak === 5) {
      notificationManager.showProgressAchievement("Almost at your 5-day streak badge!");
    } else if (currentStreak === 7) {
      notificationManager.showProgressAchievement("🏆 Weekly Streak Champion! 7 days strong!");
    } else if (currentStreak % 7 === 0 && currentStreak > 7) {
      notificationManager.showProgressAchievement(`🔥 Incredible ${currentStreak}-day streak! You're unstoppable!`);
    }
  }

  breakStreak(): StreakData {
    const streakData = this.getStreakData();
    const brokenStreak = streakData.currentStreak;
    
    streakData.currentStreak = 0;
    streakData.streakStartDate = undefined;
    
    this.saveStreakData(streakData);
    
    // Show motivational message to get back on track
    if (brokenStreak >= 3) {
      notificationManager.showNotification({
        id: `streak-broken-${Date.now()}`,
        type: 'streak',
        title: '💔 Streak Reset',
        message: `Your ${brokenStreak}-day streak ended, but every champion faces setbacks. Ready to start a new one?`,
        icon: '💪'
      });
    }
    
    return streakData;
  }

  getStreakStatus(): {
    currentStreak: number;
    isOnTrack: boolean;
    daysUntilBreak: number;
    motivationalMessage: string;
  } {
    const streakData = this.getStreakData();
    const today = new Date();
    const lastWorkout = streakData.lastWorkoutDate ? new Date(streakData.lastWorkoutDate) : null;
    
    let isOnTrack = false;
    let daysUntilBreak = 0;
    
    if (lastWorkout) {
      const daysSinceLastWorkout = Math.floor((today.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24));
      isOnTrack = daysSinceLastWorkout <= 1;
      daysUntilBreak = Math.max(0, 2 - daysSinceLastWorkout);
    }
    
    const motivationalMessage = this.getMotivationalMessage(streakData.currentStreak, isOnTrack);
    
    return {
      currentStreak: streakData.currentStreak,
      isOnTrack,
      daysUntilBreak,
      motivationalMessage
    };
  }

  private getMotivationalMessage(streak: number, isOnTrack: boolean): string {
    if (!isOnTrack && streak > 0) {
      return "Your streak is at risk! A quick workout today will keep it alive.";
    }
    
    if (streak === 0) {
      return "Ready to start a new streak? Every journey begins with a single step!";
    } else if (streak === 1) {
      return "Great start! One more day to build momentum.";
    } else if (streak === 2) {
      return "Two days strong! You're building a habit.";
    } else if (streak < 7) {
      return `${streak} days and counting! You're on fire!`;
    } else if (streak < 14) {
      return `${streak}-day streak! You're in the zone!`;
    } else {
      return `${streak} days! You're a fitness legend!`;
    }
  }

  getWeeklyStreakProgress(): { current: number; target: number; percentage: number } {
    const streakData = this.getStreakData();
    const progressInfo = progressTracker.getWeeklyProgress();
    
    return {
      current: progressInfo.completed,
      target: streakData.weeklyStreakGoal,
      percentage: Math.round((progressInfo.completed / streakData.weeklyStreakGoal) * 100)
    };
  }

  // Check if user should get a rest day reminder
  shouldShowRestDayReminder(): boolean {
    const streakData = this.getStreakData();
    const today = new Date();
    const lastWorkout = streakData.lastWorkoutDate ? new Date(streakData.lastWorkoutDate) : null;
    
    if (!lastWorkout) return false;
    
    const daysSinceLastWorkout = Math.floor((today.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24));
    
    // Suggest rest if they've worked out 5+ days in a row
    return streakData.currentStreak >= 5 && daysSinceLastWorkout === 0;
  }

  // Get streak badge info
  getStreakBadges(): Array<{ name: string; description: string; earned: boolean; progress?: number }> {
    const streakData = this.getStreakData();
    
    return [
      {
        name: "Starter",
        description: "Complete 3 workouts in a row",
        earned: streakData.longestStreak >= 3,
        progress: Math.min(100, (streakData.currentStreak / 3) * 100)
      },
      {
        name: "Consistent",
        description: "Complete 5 workouts in a row",
        earned: streakData.longestStreak >= 5,
        progress: Math.min(100, (streakData.currentStreak / 5) * 100)
      },
      {
        name: "Champion",
        description: "Complete 7 workouts in a row",
        earned: streakData.longestStreak >= 7,
        progress: Math.min(100, (streakData.currentStreak / 7) * 100)
      },
      {
        name: "Legend",
        description: "Complete 14 workouts in a row",
        earned: streakData.longestStreak >= 14,
        progress: Math.min(100, (streakData.currentStreak / 14) * 100)
      },
      {
        name: "Unstoppable",
        description: "Complete 30 workouts in a row",
        earned: streakData.longestStreak >= 30,
        progress: Math.min(100, (streakData.currentStreak / 30) * 100)
      }
    ];
  }
}

export const streakManager = new StreakManager();