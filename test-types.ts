// Test the types for the badge integration
import { useAwardsStore } from './apps/native/src/stores/awards-store';
import { useWorkoutStore } from './apps/native/src/stores/workout-store';

// Test that the function signature works
async function testTypes() {
  const awardsStore = useAwardsStore.getState();
  const workoutStore = useWorkoutStore.getState();
  
  // This should compile without errors
  const result = await awardsStore.updateBadgeProgress({
    totalWorkouts: 5,
    currentStreak: 3,
    totalSets: 0,
    totalReps: 0,
    totalMinutes: 150,
    cardioMinutes: 45,
    strengthSessions: 1,
    cardioSessions: 1,
    upperBodySessions: 1,
    lowerBodySessions: 0,
    fullBodySessions: 1,
  });
  
  console.log('Types work correctly!');
}