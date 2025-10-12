import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';

interface ProgressSnapshot {
  id: number;
  userId: number;
  snapshotDate: string;
  period: 'week' | 'month';
  workoutsCompleted: number;
  minutesTraining: number;
  streakDays: number;
  caloriesBurned: number;
}

interface CreateProgressSnapshotInput {
  period: 'week' | 'month';
  workoutsCompleted?: number;
  minutesTraining?: number;
  streakDays?: number;
  caloriesBurned?: number;
}

interface WeeklyProgress {
  completedWorkouts: number;
  trainingMinutes: number;
  goalWorkouts: number;
  goalMinutes: number;
}

export function useProgress() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query for current weekly progress
  const weeklyProgressQuery = useQuery({
    queryKey: ['/api/users', user?.id, 'progress'],
    queryFn: async () => {
      if (!user?.id) return null;
      return apiRequest(`/api/users/${user.id}/progress`) as Promise<WeeklyProgress>;
    },
    enabled: !!user?.id
  });

  // Query for weekly progress snapshots
  const weeklyProgressSnapshotsQuery = useQuery({
    queryKey: ['/api/users', user?.id, 'progress', 'week'],
    queryFn: async () => {
      if (!user?.id) return [] as ProgressSnapshot[];
      return apiRequest(`/api/users/${user.id}/progress/week`) as Promise<ProgressSnapshot[]>;
    },
    enabled: !!user?.id
  });

  // Query for monthly progress snapshots
  const monthlyProgressSnapshotsQuery = useQuery({
    queryKey: ['/api/users', user?.id, 'progress', 'month'],
    queryFn: async () => {
      if (!user?.id) return [] as ProgressSnapshot[];
      return apiRequest(`/api/users/${user.id}/progress/month`) as Promise<ProgressSnapshot[]>;
    },
    enabled: !!user?.id
  });

  // Mutation to create a progress snapshot
  const createProgressSnapshotMutation = useMutation({
    mutationFn: async (input: CreateProgressSnapshotInput) => {
      if (!user?.id) return null;
      return apiRequest(`/api/users/${user.id}/progress/snapshot`, { 
        method: 'POST',
        body: JSON.stringify(input)
      }) as Promise<ProgressSnapshot>;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'progress', variables.period] });
      toast({
        title: 'Progress Saved',
        description: 'Your progress snapshot has been saved'
      });
    },
    onError: (error) => {
      console.error('Error creating progress snapshot:', error);
      toast({
        title: 'Error',
        description: 'Failed to save progress snapshot',
        variant: 'destructive'
      });
    }
  });

  // Helper function to calculate progress percentage
  const calculateProgressPercentage = (current: number, goal: number): number => {
    if (!goal) return 0;
    return Math.min(100, Math.round((current / goal) * 100));
  };

  const progress = weeklyProgressQuery.data as WeeklyProgress | null;

  return {
    // Current progress data
    currentProgress: progress,
    isCurrentProgressLoading: weeklyProgressQuery.isLoading,
    
    // Progress snapshots
    weeklySnapshots: weeklyProgressSnapshotsQuery.data || [] as ProgressSnapshot[],
    monthlySnapshots: monthlyProgressSnapshotsQuery.data || [] as ProgressSnapshot[],
    isWeeklySnapshotsLoading: weeklyProgressSnapshotsQuery.isLoading,
    isMonthlySnapshotsLoading: monthlyProgressSnapshotsQuery.isLoading,
    
    // Actions
    createProgressSnapshot: createProgressSnapshotMutation.mutateAsync,
    isCreatingSnapshot: createProgressSnapshotMutation.isPending,
    
    // Helper methods
    workoutProgressPercentage: calculateProgressPercentage(
      progress?.completedWorkouts || 0, 
      progress?.goalWorkouts || 0
    ),
    minutesProgressPercentage: calculateProgressPercentage(
      progress?.trainingMinutes || 0, 
      progress?.goalMinutes || 0
    ),
  };
}