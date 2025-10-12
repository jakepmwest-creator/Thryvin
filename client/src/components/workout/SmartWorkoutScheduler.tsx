import React from 'react';
import { User } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';

interface SmartWorkoutSchedulerProps {
  user: User;
  onScheduleGenerated: (schedule: WeeklySchedule) => void;
}

export interface WeeklySchedule {
  [key: string]: {
    workoutType: string;
    muscleGroups: string[];
    duration: number;
    intensity: 'low' | 'medium' | 'high';
    isRestDay: boolean;
    restDayActivities?: string[];
    aiRecommendation?: string;
    intelligentRest?: boolean; // AI-recommended rest day
  };
}

export function SmartWorkoutScheduler({ user, onScheduleGenerated }: SmartWorkoutSchedulerProps) {
  // 🧠 Fetch intelligent rest day analysis
  const { data: restAnalysis, isLoading: isAnalyzing } = useQuery({
    queryKey: ['rest-analysis', user.id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/rest-analysis?currentPlan=${encodeURIComponent(JSON.stringify({}))}`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch rest analysis');
        return response.json();
      } catch (error) {
        console.log('Rest analysis not available, using basic scheduling');
        return null;
      }
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    enabled: !!user.id
  });

  const generatePersonalizedScheduleWithAI = (): WeeklySchedule => {
    const schedule: WeeklySchedule = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Parse user preferences
    let preferredDays: string[] = [];
    let trainingDays = user.trainingDaysPerWeek || 3;
    let sessionDuration = user.sessionDurationPreference || 45;
    let focusAreas: string[] = [];
    let avoidanceAreas: string[] = [];
    
    try {
      if (user.preferredTrainingDays) {
        preferredDays = JSON.parse(user.preferredTrainingDays);
      }
      if (user.focusAreas) {
        focusAreas = JSON.parse(user.focusAreas);
      }
      if (user.avoidanceAreas) {
        avoidanceAreas = JSON.parse(user.avoidanceAreas);
      }
    } catch (error) {
      console.error('Error parsing user preferences:', error);
    }
    
    // 🧠 AI-Enhanced Rest Day Intelligence
    const aiRestRecommended = restAnalysis?.recommendRestDay;
    const restActivities = restAnalysis?.suggestedActivities || [];
    
    console.log(`🧠 AI Rest Analysis: ${aiRestRecommended ? 'REST RECOMMENDED' : 'TRAINING OK'} (confidence: ${restAnalysis?.confidenceScore || 0}%)`);
    
    // Create workout rotation based on focus areas and training type
    const workoutRotation = generateWorkoutRotation(user, focusAreas, avoidanceAreas);
    
    // Intelligent rest day scheduling
    const intelligentScheduledDays = generateIntelligentSchedule(
      days, 
      trainingDays, 
      preferredDays, 
      aiRestRecommended,
      restAnalysis
    );
    
    let workoutIndex = 0;
    
    days.forEach(day => {
      const dayInfo = intelligentScheduledDays[day];
      
      if (dayInfo.shouldTrain && workoutIndex < trainingDays) {
        const workout = workoutRotation[workoutIndex % workoutRotation.length];
        
        // Apply AI workout adjustments if recommended
        let adjustedDuration = adjustDurationForDay(sessionDuration, day, user.preferredTrainingTime);
        let adjustedIntensity = workout.intensity;
        
        if (restAnalysis?.nextWorkoutRecommendations?.reducedIntensity) {
          adjustedIntensity = adjustedIntensity === 'high' ? 'medium' : adjustedIntensity === 'medium' ? 'low' : 'low';
          adjustedDuration += (restAnalysis.nextWorkoutRecommendations.modifiedDuration || 0);
        }
        
        schedule[day] = {
          workoutType: workout.type,
          muscleGroups: workout.muscleGroups,
          duration: Math.max(20, adjustedDuration), // Minimum 20 minutes
          intensity: adjustedIntensity,
          isRestDay: false,
          aiRecommendation: restAnalysis?.reasons?.[0] || undefined
        };
        workoutIndex++;
      } else {
        // Rest day configuration - Enhanced with proper duration for active recovery
        schedule[day] = {
          workoutType: dayInfo.isIntelligentRest ? 'Active Recovery' : 'Rest',
          muscleGroups: dayInfo.isIntelligentRest ? ['mobility', 'recovery'] : [],
          duration: dayInfo.isIntelligentRest ? 25 : 0, // 🐛 FIX: Active recovery gets time allocation
          intensity: 'low',
          isRestDay: true,
          intelligentRest: dayInfo.isIntelligentRest,
          restDayActivities: dayInfo.isIntelligentRest ? restActivities : getDefaultRestActivities(user),
          aiRecommendation: dayInfo.isIntelligentRest ? 
            `AI-recommended rest: ${restAnalysis?.reasons?.[0] || 'Recovery day for optimal performance'}` : 
            undefined
        };
      }
    });
    
    return schedule;
  };
  
  React.useEffect(() => {
    if (!isAnalyzing) {
      const schedule = generatePersonalizedScheduleWithAI();
      onScheduleGenerated(schedule);
    }
  }, [user, restAnalysis, isAnalyzing]);
  
  return null; // This is a utility component
}

// 🧠 Intelligent Rest Day Scheduling Logic - Fixed Date Alignment
function generateIntelligentSchedule(
  days: string[], 
  trainingDays: number, 
  preferredDays: string[], 
  aiRestRecommended: boolean, 
  restAnalysis: any
): { [day: string]: { shouldTrain: boolean, isIntelligentRest: boolean } } {
  const result: { [day: string]: { shouldTrain: boolean, isIntelligentRest: boolean } } = {};
  
  // 🐛 FIX: Get actual current day for proper date alignment
  const today = new Date();
  const currentDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayNameMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNameMap[currentDayIndex];
  const tomorrowName = dayNameMap[(currentDayIndex + 1) % 7];
  
  // If AI strongly recommends rest (high confidence), prioritize it for today/tomorrow
  const forceRestToday = aiRestRecommended && (restAnalysis?.confidenceScore || 0) > 70;
  
  // Use preferred days if available, otherwise distribute evenly
  const scheduledDays = preferredDays.length > 0 ? preferredDays : 
    distributeWorkoutDays(days, trainingDays);
  
  let workoutDaysAssigned = 0;
  
  days.forEach((day) => {
    const isPreferredTrainingDay = scheduledDays.includes(day);
    const shouldNormallyTrain = isPreferredTrainingDay && workoutDaysAssigned < trainingDays;
    
    // 🧠 AI override logic - Apply to actual today/tomorrow
    const isToday = day === todayName;
    const isTomorrow = day === tomorrowName;
    
    if (forceRestToday && (isToday || isTomorrow)) {
      result[day] = { shouldTrain: false, isIntelligentRest: true };
    } else if (shouldNormallyTrain) {
      result[day] = { shouldTrain: true, isIntelligentRest: false };
      workoutDaysAssigned++;
    } else {
      // Regular rest day
      const isIntelligentRest = aiRestRecommended && (restAnalysis?.confidenceScore || 0) > 50;
      result[day] = { shouldTrain: false, isIntelligentRest };
    }
  });
  
  return result;
}

// 🏃‍♀️ Default Active Recovery Activities
function getDefaultRestActivities(user: User): string[] {
  const activities = ['Light stretching', 'Gentle walk', 'Meditation'];
  
  // Personalize based on user preferences
  if (user.goal === 'flexibility') {
    activities.unshift('Extended yoga session');
  }
  if (user.trainingType === 'cardio') {
    activities.push('Easy bike ride');
  }
  if (user.cardioPreference === 'love') {
    activities.push('Light swimming');
  }
  
  return activities.slice(0, 3);
}

function generateWorkoutRotation(user: User, focusAreas: string[], avoidanceAreas: string[]) {
  const workouts = [];
  
  // Base workout types based on training preference
  const baseWorkouts = getBaseWorkouts(user.trainingType);
  
  // Adjust based on focus areas
  if (focusAreas.includes('Upper body')) {
    workouts.push(
      { type: 'Upper Body - Push', muscleGroups: ['chest', 'shoulders', 'triceps'], intensity: 'medium' },
      { type: 'Upper Body - Pull', muscleGroups: ['back', 'biceps'], intensity: 'medium' }
    );
  }
  
  if (focusAreas.includes('Lower body')) {
    workouts.push(
      { type: 'Lower Body - Strength', muscleGroups: ['quads', 'glutes', 'hamstrings'], intensity: 'high' },
      { type: 'Lower Body - Power', muscleGroups: ['calves', 'glutes', 'quads'], intensity: 'high' }
    );
  }
  
  if (focusAreas.includes('Core/Abs')) {
    workouts.push(
      { type: 'Core Strength', muscleGroups: ['abs', 'obliques', 'lower back'], intensity: 'medium' }
    );
  }
  
  if (focusAreas.includes('Cardio fitness') && user.cardioPreference !== 'hate') {
    const cardioIntensity = user.cardioPreference === 'love' ? 'high' : 'medium';
    workouts.push(
      { type: 'Cardio HIIT', muscleGroups: ['full body'], intensity: cardioIntensity },
      { type: 'Cardio Endurance', muscleGroups: ['full body'], intensity: cardioIntensity }
    );
  }
  
  if (focusAreas.includes('Flexibility')) {
    workouts.push(
      { type: 'Flexibility & Mobility', muscleGroups: ['full body'], intensity: 'low' }
    );
  }
  
  // If no specific focus areas, use balanced approach
  if (workouts.length === 0) {
    workouts.push(...baseWorkouts);
  }
  
  // Filter out avoided areas
  return workouts.filter(workout => 
    !avoidanceAreas.some(avoid => 
      workout.type.toLowerCase().includes(avoid.toLowerCase())
    )
  );
}

function getBaseWorkouts(trainingType: string) {
  switch (trainingType) {
    case 'strength':
      return [
        { type: 'Upper Body - Push', muscleGroups: ['chest', 'shoulders', 'triceps'], intensity: 'high' },
        { type: 'Lower Body - Strength', muscleGroups: ['quads', 'glutes', 'hamstrings'], intensity: 'high' },
        { type: 'Upper Body - Pull', muscleGroups: ['back', 'biceps'], intensity: 'high' }
      ];
    case 'cardio':
      return [
        { type: 'Cardio HIIT', muscleGroups: ['full body'], intensity: 'high' },
        { type: 'Cardio Endurance', muscleGroups: ['full body'], intensity: 'medium' },
        { type: 'Active Recovery', muscleGroups: ['full body'], intensity: 'low' }
      ];
    case 'calisthenics':
      return [
        { type: 'Calisthenics Upper', muscleGroups: ['chest', 'shoulders', 'arms'], intensity: 'medium' },
        { type: 'Calisthenics Lower', muscleGroups: ['legs', 'glutes'], intensity: 'medium' },
        { type: 'Calisthenics Core', muscleGroups: ['abs', 'obliques'], intensity: 'medium' }
      ];
    case 'yoga':
      return [
        { type: 'Yoga Flow', muscleGroups: ['full body'], intensity: 'low' },
        { type: 'Power Yoga', muscleGroups: ['full body'], intensity: 'medium' },
        { type: 'Restorative Yoga', muscleGroups: ['full body'], intensity: 'low' }
      ];
    default:
      return [
        { type: 'Full Body Strength', muscleGroups: ['full body'], intensity: 'medium' },
        { type: 'Cardio & Conditioning', muscleGroups: ['full body'], intensity: 'medium' },
        { type: 'Flexibility & Recovery', muscleGroups: ['full body'], intensity: 'low' }
      ];
  }
}

function distributeWorkoutDays(days: string[], trainingDays: number): string[] {
  const workoutDays = [];
  const interval = Math.floor(7 / trainingDays);
  
  for (let i = 0; i < trainingDays; i++) {
    const dayIndex = (i * interval) % 7;
    workoutDays.push(days[dayIndex]);
  }
  
  return workoutDays;
}

function adjustDurationForDay(baseDuration: number, day: string, preferredTime?: string): number {
  // Adjust duration based on day and preferred time
  const isWeekend = day === 'Saturday' || day === 'Sunday';
  
  if (isWeekend && preferredTime !== 'morning') {
    // Longer sessions on weekends
    return Math.min(baseDuration * 1.2, 90);
  }
  
  if (day === 'Monday') {
    // Lighter start to the week
    return Math.max(baseDuration * 0.8, 15);
  }
  
  return baseDuration;
}