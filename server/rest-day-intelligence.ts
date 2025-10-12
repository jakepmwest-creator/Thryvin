import { User, PerformanceLog } from "@shared/schema";
import { IStorage } from "./storage";

export interface RestDayRecommendation {
  recommendRestDay: boolean;
  confidenceScore: number; // 0-100
  reasons: string[];
  suggestedActivities: string[];
  nextWorkoutRecommendations: {
    reducedIntensity?: boolean;
    modifiedDuration?: number;
    focusAreas?: string[];
  };
}

export interface WorkoutRecoveryAnalysis {
  fatigueTrend: 'increasing' | 'stable' | 'decreasing';
  consistencyScore: number; // 0-100
  intensityTolerance: 'high' | 'medium' | 'low';
  recommendedRestFrequency: number; // days between rest
  adaptiveInsights: string[];
}

export class RestDayIntelligenceService {
  constructor(private storage: IStorage) {}

  /**
   * 🧠 AI-Powered Rest Day Analysis
   * Analyzes user performance, fatigue indicators, and training load to recommend optimal rest timing
   */
  async analyzeRestDayNeeds(userId: number, currentTrainingPlan: any): Promise<RestDayRecommendation> {
    console.log(`🧠 Analyzing rest day needs for user ${userId}`);

    // Get user profile and recent performance data
    const user = await this.storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const recentPerformance = await this.storage.getPerformanceHistory(userId, undefined, 14); // Last 14 workouts
    const recoveryAnalysis = await this.performRecoveryAnalysis(user, recentPerformance);

    // AI Decision Engine
    const recommendation = this.generateRestDayRecommendation(user, recentPerformance, recoveryAnalysis, currentTrainingPlan);

    console.log(`✅ Rest day analysis complete: ${recommendation.recommendRestDay ? 'REST RECOMMENDED' : 'TRAINING OK'} (confidence: ${recommendation.confidenceScore}%)`);
    
    return recommendation;
  }

  /**
   * 📊 Analyze Recovery Patterns
   * Examines performance trends, completion rates, and fatigue indicators
   */
  private async performRecoveryAnalysis(user: User, recentPerformance: PerformanceLog[]): Promise<WorkoutRecoveryAnalysis> {
    const analysis: WorkoutRecoveryAnalysis = {
      fatigueTrend: 'stable',
      consistencyScore: 100,
      intensityTolerance: 'medium',
      recommendedRestFrequency: 2,
      adaptiveInsights: []
    };

    if (recentPerformance.length === 0) {
      analysis.adaptiveInsights.push("Not enough performance data yet - using conservative rest schedule");
      return analysis;
    }

    // Analyze completion rates over time
    const completionRates = this.calculateCompletionTrends(recentPerformance);
    analysis.consistencyScore = completionRates.averageCompletion;

    // Analyze RPE trends (fatigue indicator)
    const rpeTrend = this.analyzeRPETrends(recentPerformance);
    analysis.fatigueTrend = rpeTrend.direction;
    analysis.intensityTolerance = rpeTrend.tolerance;

    // Determine optimal rest frequency based on user level and performance
    analysis.recommendedRestFrequency = this.calculateOptimalRestFrequency(user, analysis);

    // Generate adaptive insights
    analysis.adaptiveInsights = this.generateAdaptiveInsights(user, analysis, recentPerformance);

    return analysis;
  }

  /**
   * 🎯 Generate AI Rest Day Recommendation
   * Main decision engine combining all factors
   */
  private generateRestDayRecommendation(
    user: User, 
    recentPerformance: PerformanceLog[], 
    recoveryAnalysis: WorkoutRecoveryAnalysis,
    currentPlan: any
  ): RestDayRecommendation {
    
    let restScore = 0;
    const reasons: string[] = [];
    const maxScore = 100;

    // Factor 1: Performance Decline Detection (30 points)
    if (recoveryAnalysis.consistencyScore < 70) {
      restScore += 30;
      reasons.push(`Low completion rate (${recoveryAnalysis.consistencyScore}%) indicates fatigue`);
    } else if (recoveryAnalysis.consistencyScore < 85) {
      restScore += 15;
      reasons.push(`Moderate completion rate suggests building fatigue`);
    }

    // Factor 2: RPE/Fatigue Trends (25 points)
    if (recoveryAnalysis.fatigueTrend === 'increasing') {
      restScore += 25;
      reasons.push(`Increasing perceived exertion indicates accumulating fatigue`);
    } else if (recoveryAnalysis.fatigueTrend === 'stable' && recoveryAnalysis.intensityTolerance === 'low') {
      restScore += 12;
      reasons.push(`Stable but low intensity tolerance suggests need for recovery`);
    }

    // Factor 3: Training Frequency Analysis (20 points)
    const recentDays = this.countRecentTrainingDays(recentPerformance, 7);
    const optimalFrequency = user.trainingDaysPerWeek || 3;
    
    if (recentDays > optimalFrequency + 1) {
      restScore += 20;
      reasons.push(`Training ${recentDays} days this week exceeds optimal frequency`);
    } else if (recentDays === optimalFrequency + 1) {
      restScore += 10;
      reasons.push(`At upper limit of training frequency - recovery beneficial`);
    }

    // Factor 4: User Experience Level (15 points)
    const fitnessLevel = user.fitnessLevel?.toLowerCase();
    if (fitnessLevel === 'beginner' && recentDays >= 3) {
      restScore += 15;
      reasons.push(`Beginner level - frequent rest important for adaptation`);
    } else if (fitnessLevel === 'intermediate' && recentDays >= 5) {
      restScore += 10;
      reasons.push(`Intermediate level - recovery needed after high volume`);
    }

    // Factor 5: Consecutive Training Days (10 points)
    const consecutiveDays = this.countConsecutiveTrainingDays(recentPerformance);
    if (consecutiveDays >= 3) {
      restScore += 10;
      reasons.push(`${consecutiveDays} consecutive training days - rest recommended`);
    }

    // Generate recommendation
    const recommendRestDay = restScore >= 50;
    const confidenceScore = Math.min(restScore, maxScore);

    // Get personalized active recovery suggestions
    const suggestedActivities = this.getActiveRecoveryActivities(user, recommendRestDay);

    // Generate next workout recommendations if needed
    const nextWorkoutRecommendations = this.generateNextWorkoutAdjustments(recoveryAnalysis, recommendRestDay);

    if (!recommendRestDay && reasons.length === 0) {
      reasons.push("Performance indicators show good recovery - training can continue");
    }

    return {
      recommendRestDay,
      confidenceScore,
      reasons,
      suggestedActivities,
      nextWorkoutRecommendations
    };
  }

  /**
   * 📈 Calculate Completion Rate Trends
   */
  private calculateCompletionTrends(performance: PerformanceLog[]): { averageCompletion: number } {
    if (performance.length === 0) return { averageCompletion: 100 };

    const completedCount = performance.filter(p => p.completed).length;
    const averageCompletion = Math.round((completedCount / performance.length) * 100);

    return { averageCompletion };
  }

  /**
   * 💪 Analyze RPE Trends for Fatigue Detection
   */
  private analyzeRPETrends(performance: PerformanceLog[]): { direction: 'increasing' | 'stable' | 'decreasing', tolerance: 'high' | 'medium' | 'low' } {
    const rpeValues = performance.filter(p => p.rpe && p.rpe > 0).map(p => p.rpe!);
    
    if (rpeValues.length < 3) {
      return { direction: 'stable', tolerance: 'medium' };
    }

    // Calculate trend
    const recentRPE = rpeValues.slice(-3).reduce((sum, rpe) => sum + rpe, 0) / 3;
    const olderRPE = rpeValues.slice(0, -3).reduce((sum, rpe) => sum + rpe, 0) / (rpeValues.length - 3);
    
    let direction: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (recentRPE > olderRPE + 0.5) direction = 'increasing';
    else if (recentRPE < olderRPE - 0.5) direction = 'decreasing';

    // Determine tolerance
    const averageRPE = rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length;
    let tolerance: 'high' | 'medium' | 'low' = 'medium';
    if (averageRPE < 6) tolerance = 'high';
    else if (averageRPE > 8) tolerance = 'low';

    return { direction, tolerance };
  }

  /**
   * 🗓️ Calculate Optimal Rest Frequency
   */
  private calculateOptimalRestFrequency(user: User, analysis: WorkoutRecoveryAnalysis): number {
    const baseFrequency = user.trainingDaysPerWeek || 3;
    const fitnessLevel = user.fitnessLevel?.toLowerCase();

    // Adjust based on fitness level
    if (fitnessLevel === 'beginner') return Math.max(1, Math.floor(baseFrequency / 2));
    if (fitnessLevel === 'advanced') return Math.max(2, Math.floor(baseFrequency / 1.5));
    
    // Intermediate or default
    return Math.max(1, Math.floor(baseFrequency / 2));
  }

  /**
   * 💡 Generate Adaptive Insights
   */
  private generateAdaptiveInsights(user: User, analysis: WorkoutRecoveryAnalysis, performance: PerformanceLog[]): string[] {
    const insights: string[] = [];

    if (analysis.consistencyScore > 90) {
      insights.push("Excellent workout consistency! Your body is adapting well to the training load");
    } else if (analysis.consistencyScore > 75) {
      insights.push("Good consistency with room for improvement. Consider rest days when completion drops");
    } else {
      insights.push("Consistency could be improved. More frequent rest may help maintain quality");
    }

    if (analysis.fatigueTrend === 'decreasing') {
      insights.push("Your perceived effort is decreasing - great adaptation! You can handle more challenge");
    } else if (analysis.fatigueTrend === 'increasing') {
      insights.push("Rising effort levels suggest building fatigue. Recovery is becoming important");
    }

    if (performance.length >= 7) {
      insights.push(`Based on ${performance.length} recent workouts, your AI coach is learning your patterns`);
    }

    return insights;
  }

  /**
   * 🏃‍♀️ Get Personalized Active Recovery Activities
   */
  private getActiveRecoveryActivities(user: User, isRestDay: boolean): string[] {
    let activities: string[] = [];

    // Parse user's preferred rest day activities
    if (user.restDayActivities) {
      try {
        const userActivities = JSON.parse(user.restDayActivities);
        activities = Array.isArray(userActivities) ? userActivities : [];
      } catch (e) {
        // Skip if parsing fails
      }
    }

    // Default active recovery suggestions based on user profile
    const defaultActivities = [
      "Light walking (20-30 minutes)",
      "Gentle stretching or mobility work",
      "Yoga or meditation session",
      "Foam rolling and self-massage",
      "Light swimming or water activities"
    ];

    // Add user-specific suggestions
    if (user.goal === 'flexibility' || user.trainingType === 'wellness') {
      defaultActivities.unshift("Extended yoga flow", "Deep stretching session");
    }

    // Combine user preferences with defaults
    const combinedActivities = [...activities, ...defaultActivities.slice(0, 3)];
    
    return Array.from(new Set(combinedActivities)).slice(0, 5);
  }

  /**
   * 🎯 Generate Next Workout Adjustments
   */
  private generateNextWorkoutAdjustments(analysis: WorkoutRecoveryAnalysis, isRestDay: boolean) {
    const adjustments: any = {};

    if (analysis.fatigueTrend === 'increasing' || analysis.intensityTolerance === 'low') {
      adjustments.reducedIntensity = true;
      adjustments.modifiedDuration = -10; // Reduce by 10 minutes
    }

    if (analysis.consistencyScore < 75) {
      adjustments.focusAreas = ['movement_quality', 'basic_strength'];
    }

    return adjustments;
  }

  /**
   * 🔢 Helper: Count Recent Training Days
   */
  private countRecentTrainingDays(performance: PerformanceLog[], days: number): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return performance.filter(p => 
      p.completed && p.loggedAt >= cutoffDate
    ).length;
  }

  /**
   * 🔢 Helper: Count Consecutive Training Days
   */
  private countConsecutiveTrainingDays(performance: PerformanceLog[]): number {
    // Sort by date (most recent first)
    const sortedPerformance = performance
      .filter(p => p.completed)
      .sort((a, b) => b.loggedAt.getTime() - a.loggedAt.getTime());

    let consecutiveCount = 0;
    let currentDate = new Date();
    
    for (const log of sortedPerformance) {
      const logDate = new Date(log.loggedAt);
      const daysDiff = Math.floor((currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 1) {
        consecutiveCount++;
        currentDate = logDate;
      } else {
        break;
      }
    }

    return consecutiveCount;
  }
}