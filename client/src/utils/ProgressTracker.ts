export interface WorkoutFeedback {
  workoutId: string;
  difficulty: 'too-easy' | 'perfect' | 'too-hard';
  feedback?: string;
  completedReps?: number;
  targetReps?: number;
  weightUsed?: number;
  targetWeight?: number;
  exerciseId?: string;
  timestamp: string;
}

export interface ProgressData {
  workoutHistory: WorkoutFeedback[];
  streakDays: number;
  lastWorkoutDate?: string;
  totalWorkouts: number;
  weeklyProgress: {
    completed: number;
    target: number;
  };
  monthlyProgress: {
    completed: number;
    target: number;
  };
  adaptations: {
    [exerciseId: string]: {
      currentReps: number;
      currentWeight: number;
      progression: number; // Percentage increase/decrease
    };
  };
}

class ProgressTracker {
  private progressKey = 'thryvin-progress-data';

  getProgressData(): ProgressData {
    const stored = localStorage.getItem(this.progressKey);
    return stored ? JSON.parse(stored) : this.getInitialProgressData();
  }

  private getInitialProgressData(): ProgressData {
    return {
      workoutHistory: [],
      streakDays: 0,
      totalWorkouts: 0,
      weeklyProgress: { completed: 0, target: 4 },
      monthlyProgress: { completed: 0, target: 16 },
      adaptations: {}
    };
  }

  saveProgressData(data: ProgressData) {
    localStorage.setItem(this.progressKey, JSON.stringify(data));
  }

  logWorkoutFeedback(feedback: WorkoutFeedback) {
    const progress = this.getProgressData();
    
    // Add feedback to history
    progress.workoutHistory.unshift(feedback);
    
    // Keep only last 100 workouts
    if (progress.workoutHistory.length > 100) {
      progress.workoutHistory.splice(100);
    }

    // Update streak
    this.updateStreak(progress, feedback.timestamp);
    
    // Update weekly/monthly progress
    this.updatePeriodProgress(progress);
    
    // Apply AI adaptations based on feedback
    this.applyAIAdaptation(progress, feedback);
    
    this.saveProgressData(progress);
    
    return progress;
  }

  private updateStreak(progress: ProgressData, workoutTimestamp: string) {
    const workoutDate = new Date(workoutTimestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const workoutDay = new Date(workoutDate);
    workoutDay.setHours(0, 0, 0, 0);
    
    if (progress.lastWorkoutDate) {
      const lastWorkoutDay = new Date(progress.lastWorkoutDate);
      lastWorkoutDay.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((workoutDay.getTime() - lastWorkoutDay.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day - increment streak
        progress.streakDays++;
      } else if (daysDiff > 1) {
        // Missed days - reset streak
        progress.streakDays = 1;
      }
      // Same day workouts don't change streak
    } else {
      // First workout
      progress.streakDays = 1;
    }
    
    progress.lastWorkoutDate = workoutTimestamp;
    progress.totalWorkouts++;
  }

  private updatePeriodProgress(progress: ProgressData) {
    const now = new Date();
    const weekStart = this.getWeekStart(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Count workouts this week
    const weeklyWorkouts = progress.workoutHistory.filter(workout => 
      new Date(workout.timestamp) >= weekStart
    ).length;
    
    // Count workouts this month
    const monthlyWorkouts = progress.workoutHistory.filter(workout => 
      new Date(workout.timestamp) >= monthStart
    ).length;
    
    progress.weeklyProgress.completed = weeklyWorkouts;
    progress.monthlyProgress.completed = monthlyWorkouts;
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  private applyAIAdaptation(progress: ProgressData, feedback: WorkoutFeedback) {
    if (!feedback.exerciseId) return;
    
    const exerciseId = feedback.exerciseId;
    let adaptation = progress.adaptations[exerciseId];
    
    if (!adaptation) {
      adaptation = {
        currentReps: feedback.targetReps || 10,
        currentWeight: feedback.targetWeight || 0,
        progression: 0
      };
      progress.adaptations[exerciseId] = adaptation;
    }
    
    switch (feedback.difficulty) {
      case 'too-easy':
        // Increase difficulty by 10-15%
        if (feedback.targetReps) {
          adaptation.currentReps = Math.ceil(feedback.targetReps * 1.15);
        }
        if (feedback.targetWeight && feedback.targetWeight > 0) {
          adaptation.currentWeight = Math.ceil(feedback.targetWeight * 1.1);
        }
        adaptation.progression += 0.15;
        break;
        
      case 'too-hard':
        // Decrease difficulty by 10-20%
        if (feedback.targetReps) {
          adaptation.currentReps = Math.max(1, Math.floor(feedback.targetReps * 0.85));
        }
        if (feedback.targetWeight && feedback.targetWeight > 0) {
          adaptation.currentWeight = Math.max(0, Math.floor(feedback.targetWeight * 0.9));
        }
        adaptation.progression -= 0.2;
        break;
        
      case 'perfect':
        // Small progressive overload (5%)
        if (feedback.targetReps) {
          adaptation.currentReps = Math.ceil(feedback.targetReps * 1.05);
        }
        if (feedback.targetWeight && feedback.targetWeight > 0) {
          adaptation.currentWeight = Math.ceil(feedback.targetWeight * 1.05);
        }
        adaptation.progression += 0.05;
        break;
    }
  }

  getAdaptationForExercise(exerciseId: string): { reps: number; weight: number } {
    const progress = this.getProgressData();
    const adaptation = progress.adaptations[exerciseId];
    
    if (!adaptation) {
      return { reps: 10, weight: 0 }; // Default values
    }
    
    return {
      reps: adaptation.currentReps,
      weight: adaptation.currentWeight
    };
  }

  getStreakInfo(): { streakDays: number; isOnStreak: boolean } {
    const progress = this.getProgressData();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!progress.lastWorkoutDate) {
      return { streakDays: 0, isOnStreak: false };
    }
    
    const lastWorkoutDay = new Date(progress.lastWorkoutDate);
    lastWorkoutDay.setHours(0, 0, 0, 0);
    
    const daysSinceLastWorkout = Math.floor((today.getTime() - lastWorkoutDay.getTime()) / (1000 * 60 * 60 * 24));
    
    // Streak is broken if more than 1 day has passed
    const isOnStreak = daysSinceLastWorkout <= 1;
    
    return {
      streakDays: isOnStreak ? progress.streakDays : 0,
      isOnStreak
    };
  }

  getWeeklyProgress(): { completed: number; target: number; percentage: number } {
    const progress = this.getProgressData();
    const percentage = Math.round((progress.weeklyProgress.completed / progress.weeklyProgress.target) * 100);
    
    return {
      ...progress.weeklyProgress,
      percentage
    };
  }

  getRecentWorkouts(limit: number = 10): WorkoutFeedback[] {
    const progress = this.getProgressData();
    return progress.workoutHistory.slice(0, limit);
  }

  resetStreak() {
    const progress = this.getProgressData();
    progress.streakDays = 0;
    this.saveProgressData(progress);
  }

  // Get achievements based on progress
  checkAchievements(): string[] {
    const progress = this.getProgressData();
    const achievements: string[] = [];
    
    // Streak achievements
    if (progress.streakDays >= 3 && progress.streakDays < 5) {
      achievements.push("🔥 3-Day Streak Starter!");
    } else if (progress.streakDays >= 5 && progress.streakDays < 7) {
      achievements.push("🔥 5-Day Streak Champion!");
    } else if (progress.streakDays >= 7) {
      achievements.push("🔥 Weekly Streak Legend!");
    }
    
    // Weekly target achievements
    if (progress.weeklyProgress.completed >= progress.weeklyProgress.target) {
      achievements.push("🎯 Weekly Target Achieved!");
    }
    
    // Total workout milestones
    if (progress.totalWorkouts === 10) {
      achievements.push("💪 First 10 Workouts Complete!");
    } else if (progress.totalWorkouts === 25) {
      achievements.push("💪 25 Workout Milestone!");
    } else if (progress.totalWorkouts === 50) {
      achievements.push("💪 50 Workout Champion!");
    } else if (progress.totalWorkouts === 100) {
      achievements.push("💪 Century Club Member!");
    }
    
    return achievements;
  }
}

export const progressTracker = new ProgressTracker();