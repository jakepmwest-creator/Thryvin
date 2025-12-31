import { db } from './db';
import { workoutDays } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { generateAIWorkout } from './ai-workout-generator';

interface UserProfile {
  fitnessGoals?: string[];
  goal?: string;
  experience?: string;
  trainingType?: string;
  sessionDuration?: string | number;
  trainingDays?: string | number;
  equipment?: string[];
  injuries?: string[];
}

export async function generateWeekWorkouts(userId: number, userProfile: UserProfile, weekNumber: number = 1) {
  console.log('🗓️ [WEEK-GEN] Starting week generation for user:', userId, '(Week', weekNumber, ')');
  console.log('📋 [WEEK-GEN] User profile:', JSON.stringify(userProfile, null, 2));
  
  try {
    // Calculate Monday-Sunday of current week
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    
    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date.toISOString().split('T')[0]);
    }
    
    console.log('📅 [WEEK-GEN] Week dates:', weekDates);
    
    // Check which days already exist
    const existingDays = await db
      .select()
      .from(workoutDays)
      .where(
        and(
          eq(workoutDays.userId, userId),
          // @ts-ignore - date is in the array
          eq(workoutDays.date, weekDates as any)
        )
      );
    
    const existingDatesSet = new Set(existingDays.map(d => d.date));
    const newDates = weekDates.filter(date => !existingDatesSet.has(date));
    
    console.log(`✨ [WEEK-GEN] Found ${existingDays.length} existing days, creating ${newDates.length} new days`);
    
    // Create pending entries for new days
    if (newDates.length > 0) {
      const pendingEntries = newDates.map(date => ({
        userId,
        date,
        status: 'pending' as const,
        payloadJson: null,
      }));
      
      await db.insert(workoutDays).values(pendingEntries);
      console.log('✅ [WEEK-GEN] Created pending entries');
    }
    
    // Generate workouts for each day
    const generatePromises = weekDates.map(async (date, index) => {
      try {
        // Check if this day already has a workout
        const [existingDay] = await db
          .select()
          .from(workoutDays)
          .where(
            and(
              eq(workoutDays.userId, userId),
              eq(workoutDays.date, date)
            )
          );
        
        if (existingDay && existingDay.status === 'ready') {
          console.log(`⏭️  [WEEK-GEN] Day ${index} (${date}) already ready, skipping`);
          return existingDay;
        }
        
        // Set status to generating
        await db
          .update(workoutDays)
          .set({
            status: 'generating',
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(workoutDays.userId, userId),
              eq(workoutDays.date, date)
            )
          );
        
        console.log(`🤖 [WEEK-GEN] Generating workout for day ${index} (${date})`);
        
        // Calculate actual day of week (Sunday=0, Monday=1, etc.)
        // Our week array starts Monday (index 0), so:
        // index 0 (Mon) = dayOfWeek 1, index 1 (Tue) = dayOfWeek 2, etc.
        // index 6 (Sun) = dayOfWeek 0
        const actualDayOfWeek = index === 6 ? 0 : index + 1;
        
        // Generate AI workout with correct day of week
        const workout = await generateAIWorkout(userProfile, actualDayOfWeek);
        
        // Store in DB
        await db
          .update(workoutDays)
          .set({
            status: 'ready',
            payloadJson: workout as any,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(workoutDays.userId, userId),
              eq(workoutDays.date, date)
            )
          );
        
        console.log(`✅ [WEEK-GEN] Day ${index} (${date}) completed`);
        
        return { date, workout };
      } catch (error: any) {
        console.error(`❌ [WEEK-GEN] Error generating day ${index} (${date}):`, error);
        
        // Store error in DB
        await db
          .update(workoutDays)
          .set({
            status: 'error',
            payloadJson: { error: error.message } as any,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(workoutDays.userId, userId),
              eq(workoutDays.date, date)
            )
          );
        
        throw error;
      }
    });
    
    // Wait for all days to complete
    const results = await Promise.allSettled(generatePromises);
    
    // Count successes and failures
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`📊 [WEEK-GEN] Complete: ${successful} successful, ${failed} failed`);
    
    if (failed > 0) {
      const errors = results
        .filter(r => r.status === 'rejected')
        .map((r: any) => r.reason.message);
      
      throw new Error(`Failed to generate ${failed} workouts: ${errors.join(', ')}`);
    }
    
    // Fetch all days for response
    const allDays = await db
      .select()
      .from(workoutDays)
      .where(eq(workoutDays.userId, userId));
    
    return {
      success: true,
      weekDates,
      workouts: allDays,
    };
    
  } catch (error: any) {
    console.error('❌ [WEEK-GEN] Fatal error:', error);
    throw error;
  }
}
