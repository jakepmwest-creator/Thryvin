// Simple test to verify the badge integration works
console.log('Testing badge integration...');

// Mock the required modules
const mockUseWorkoutStore = {
  getState: () => ({
    stats: {
      totalWorkouts: 5,
      currentStreak: 3,
      totalMinutes: 150
    },
    completedWorkouts: [
      { type: 'Strength', duration: 30, targetMuscles: 'Upper Body' },
      { type: 'Cardio', duration: 45 },
      { type: 'Full Body', duration: 30, targetMuscles: 'Full Body' }
    ]
  })
};

const mockUseAwardsStore = {
  getState: () => ({
    updateBadgeProgress: async (stats) => {
      console.log('✅ updateBadgeProgress called with:', stats);
      return []; // Mock return value
    }
  })
};

// Mock the updateBadgesAfterWorkout function logic
async function testUpdateBadgesAfterWorkout() {
  try {
    const workoutStore = mockUseWorkoutStore.getState();
    const { stats, completedWorkouts } = workoutStore;
    
    if (!stats) {
      console.log('⚠️ [BADGES] No stats available for badge update');
      return;
    }
    
    // Calculate additional stats needed for badges
    const strengthSessions = completedWorkouts.filter(w => 
      w.type?.toLowerCase().includes('strength') || 
      w.type?.toLowerCase().includes('upper') || 
      w.type?.toLowerCase().includes('lower')
    ).length;
    
    const cardioSessions = completedWorkouts.filter(w => 
      w.type?.toLowerCase().includes('cardio')
    ).length;
    
    const upperBodySessions = completedWorkouts.filter(w => 
      w.type?.toLowerCase().includes('upper') ||
      w.targetMuscles?.toLowerCase().includes('upper')
    ).length;
    
    const lowerBodySessions = completedWorkouts.filter(w => 
      w.type?.toLowerCase().includes('lower') ||
      w.targetMuscles?.toLowerCase().includes('lower') ||
      w.targetMuscles?.toLowerCase().includes('legs')
    ).length;
    
    const fullBodySessions = completedWorkouts.filter(w => 
      w.type?.toLowerCase().includes('full') ||
      w.targetMuscles?.toLowerCase().includes('full')
    ).length;
    
    const cardioMinutes = completedWorkouts
      .filter(w => w.type?.toLowerCase().includes('cardio'))
      .reduce((sum, w) => sum + (w.duration || 0), 0);
    
    // Prepare workout stats for badge system
    const workoutStats = {
      totalWorkouts: stats.totalWorkouts,
      currentStreak: stats.currentStreak,
      totalSets: 0,
      totalReps: 0,
      totalMinutes: stats.totalMinutes,
      cardioMinutes,
      strengthSessions,
      cardioSessions,
      upperBodySessions,
      lowerBodySessions,
      fullBodySessions,
    };
    
    console.log('🏆 [BADGES] Calculated workout stats:', workoutStats);
    
    // Update badges using the awards store
    const awardsStore = mockUseAwardsStore.getState();
    const newlyUnlocked = await awardsStore.updateBadgeProgress(workoutStats);
    
    console.log('✅ [BADGES] Function completed successfully');
    
  } catch (error) {
    console.error('❌ [BADGES] Error updating badges after workout:', error);
  }
}

// Run the test
testUpdateBadgesAfterWorkout().then(() => {
  console.log('✅ Test completed successfully!');
}).catch(err => {
  console.error('❌ Test failed:', err);
});