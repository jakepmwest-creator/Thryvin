export interface ExercisePerformance {
  exerciseId: string;
  exerciseName: string;
  date: string;
  workoutName: string;
  actualSets: number;
  actualReps: string;
  actualWeight?: string;
  suggestedSets: number;
  suggestedReps: string;
  suggestedWeight?: string;
  feedback: string;
  completed: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  timestamp: string;
}

export interface WorkoutPerformance {
  workoutId: string;
  workoutName: string;
  date: string;
  exercises: ExercisePerformance[];
  overallFeedback?: string;
  completed: boolean;
  duration?: number;
}

export interface ProgressionAdjustment {
  type: 'increase' | 'maintain' | 'decrease';
  reason: string;
  adjustment: {
    reps?: number;
    weight?: number;
    sets?: number;
  };
  aiTip: string;
}

export class PerformanceTracker {
  private static STORAGE_KEY = 'thryvin-performance-history';

  static saveWorkoutPerformance(workout: WorkoutPerformance): void {
    const history = this.getPerformanceHistory();
    history.push(workout);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
  }

  static getPerformanceHistory(): WorkoutPerformance[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static getExerciseHistory(exerciseId: string, exerciseName: string): ExercisePerformance[] {
    const history = this.getPerformanceHistory();
    return history
      .flatMap(workout => workout.exercises)
      .filter(exercise => 
        exercise.exerciseId === exerciseId || 
        exercise.exerciseName.toLowerCase() === exerciseName.toLowerCase()
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static calculateSuccessRate(exerciseHistory: ExercisePerformance[], sessions: number = 3): number {
    const recentSessions = exerciseHistory.slice(0, sessions);
    if (recentSessions.length === 0) return 0;

    const completedSessions = recentSessions.filter(session => {
      const actualReps = parseInt(session.actualReps.split('-')[0]) || 0;
      const suggestedReps = parseInt(session.suggestedReps.split('-')[0]) || 0;
      return session.completed && actualReps >= suggestedReps * 0.8; // 80% completion threshold
    });

    return completedSessions.length / recentSessions.length;
  }

  static analyzePerformanceTrend(exerciseHistory: ExercisePerformance[]): 'improving' | 'stable' | 'declining' {
    if (exerciseHistory.length < 2) return 'stable';

    const recent = exerciseHistory.slice(0, 3);
    let improvingCount = 0;
    let decliningCount = 0;

    for (let i = 0; i < recent.length - 1; i++) {
      const current = recent[i];
      const previous = recent[i + 1];

      const currentReps = parseInt(current.actualReps.split('-')[0]) || 0;
      const previousReps = parseInt(previous.actualReps.split('-')[0]) || 0;

      if (currentReps > previousReps) improvingCount++;
      else if (currentReps < previousReps) decliningCount++;
    }

    if (improvingCount > decliningCount) return 'improving';
    if (decliningCount > improvingCount) return 'declining';
    return 'stable';
  }

  static generateProgression(
    exerciseId: string,
    exerciseName: string,
    baseSets: number,
    baseReps: string,
    baseWeight?: string
  ): ProgressionAdjustment {
    const history = this.getExerciseHistory(exerciseId, exerciseName);
    
    if (history.length === 0) {
      return {
        type: 'maintain',
        reason: 'No previous data',
        adjustment: {},
        aiTip: "Let's start with the basics and build from here! 💪"
      };
    }

    const successRate = this.calculateSuccessRate(history);
    const trend = this.analyzePerformanceTrend(history);
    const lastSession = history[0];

    // Check for negative feedback patterns
    const recentNegativeFeedback = history.slice(0, 2).some(session => 
      session.feedback.toLowerCase().includes('hard') ||
      session.feedback.toLowerCase().includes('difficult') ||
      session.feedback.toLowerCase().includes('struggled') ||
      session.feedback.toLowerCase().includes('tough')
    );

    // Progression logic
    if (successRate >= 0.8 && trend === 'improving' && !recentNegativeFeedback) {
      // Increase difficulty
      const repsIncrease = Math.floor(Math.random() * 2) + 1; // 1-2 reps
      const weightIncrease = baseWeight ? (baseWeight.includes('lbs') ? 5 : 2.5) : 0;

      return {
        type: 'increase',
        reason: `High success rate (${Math.round(successRate * 100)}%) and improving trend`,
        adjustment: {
          reps: repsIncrease,
          weight: weightIncrease
        },
        aiTip: `You've been crushing this! Adding ${repsIncrease} more reps today 💥`
      };
    } else if (successRate < 0.5 || recentNegativeFeedback) {
      // Decrease difficulty
      const repsDecrease = Math.floor(Math.random() * 2) + 1; // 1-2 reps
      const weightDecrease = baseWeight ? (baseWeight.includes('lbs') ? -2.5 : -1.25) : 0;

      return {
        type: 'decrease',
        reason: `Low success rate (${Math.round(successRate * 100)}%) or negative feedback`,
        adjustment: {
          reps: -repsDecrease,
          weight: weightDecrease
        },
        aiTip: `Let's dial it back a bit and focus on perfect form today 🧠`
      };
    } else {
      // Maintain current level
      return {
        type: 'maintain',
        reason: `Stable performance (${Math.round(successRate * 100)}% success rate)`,
        adjustment: {},
        aiTip: trend === 'stable' 
          ? "Consistency is key! Let's maintain this level and perfect your form 🎯"
          : "You're making steady progress! Keep this intensity going 💪"
      };
    }
  }

  static applyProgression(
    exercise: any,
    progression: ProgressionAdjustment
  ): any {
    const adjustedExercise = { ...exercise };

    if (progression.adjustment.reps) {
      const [minReps, maxReps] = exercise.reps.split('-').map((r: string) => parseInt(r.trim()));
      const newMinReps = Math.max(1, minReps + progression.adjustment.reps);
      const newMaxReps = Math.max(newMinReps, (maxReps || minReps) + progression.adjustment.reps);
      adjustedExercise.reps = maxReps ? `${newMinReps}-${newMaxReps}` : newMinReps.toString();
    }

    if (progression.adjustment.weight && exercise.weightSuggestion) {
      const currentWeight = parseFloat(exercise.weightSuggestion.replace(/[^\d.]/g, ''));
      const newWeight = Math.max(0, currentWeight + progression.adjustment.weight);
      const unit = exercise.weightSuggestion.includes('lbs') ? 'lbs' : 'kg';
      adjustedExercise.weightSuggestion = `${newWeight} ${unit}`;
    }

    if (progression.adjustment.sets) {
      adjustedExercise.sets = Math.max(1, exercise.sets + progression.adjustment.sets);
    }

    return {
      ...adjustedExercise,
      aiProgression: progression
    };
  }

  static getUserPerformanceStats(): {
    totalWorkouts: number;
    totalExercises: number;
    averageSuccessRate: number;
    streakDays: number;
    favoriteExercises: string[];
  } {
    const history = this.getPerformanceHistory();
    const totalWorkouts = history.length;
    const totalExercises = history.reduce((sum, workout) => sum + workout.exercises.length, 0);

    // Calculate average success rate
    const allExercises = history.flatMap(workout => workout.exercises);
    const completedExercises = allExercises.filter(ex => ex.completed);
    const averageSuccessRate = allExercises.length > 0 ? completedExercises.length / allExercises.length : 0;

    // Calculate streak (simplified - consecutive workout days)
    const workoutDates = history.map(w => w.date).sort();
    let streakDays = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < workoutDates.length; i++) {
      const date = new Date(workoutDates[i]);
      const daysDiff = Math.floor((new Date(today).getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === i) {
        streakDays++;
      } else {
        break;
      }
    }

    // Find favorite exercises (most frequently completed)
    const exerciseCounts: { [key: string]: number } = {};
    completedExercises.forEach(ex => {
      exerciseCounts[ex.exerciseName] = (exerciseCounts[ex.exerciseName] || 0) + 1;
    });
    
    const favoriteExercises = Object.entries(exerciseCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([name]) => name);

    return {
      totalWorkouts,
      totalExercises,
      averageSuccessRate,
      streakDays,
      favoriteExercises
    };
  }
}