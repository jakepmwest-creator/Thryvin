import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';

interface Quest {
  id: number;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  category: 'fitness' | 'nutrition' | 'engagement';
  target: number;
  xpReward: number;
  icon: string;
  isActive: boolean;
  createdAt: string;
}

interface UserQuest {
  id: number;
  userId: number;
  questId: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  completedAt?: string;
  claimedAt?: string;
  assignedAt: string;
  quest: Quest;
}

interface UserStats {
  workoutStreak: number;
  nutritionStreak: number;
  recoveryStreak: number;
  lastWorkoutDate?: string;
  lastNutritionLogDate?: string;
  lastRecoveryDate?: string;
  totalWorkouts: number;
  thisWeekWorkouts: number;
  level: number;
  xpPoints: number;
  nextLevelXP: number;
}

export function useQuests() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query to get user quests
  const userQuestsQuery = useQuery({
    queryKey: ['/api/users', user?.id, 'quests'],
    queryFn: async () => {
      if (!user?.id) return [] as UserQuest[];
      return apiRequest(`/api/users/${user.id}/quests`) as Promise<UserQuest[]>;
    },
    enabled: !!user?.id
  });

  // Query to get user stats/streaks
  const userStatsQuery = useQuery({
    queryKey: ['/api/users', user?.id, 'stats'],
    queryFn: async () => {
      if (!user?.id) return {} as UserStats;
      return apiRequest(`/api/users/${user.id}/stats`) as Promise<UserStats>;
    },
    enabled: !!user?.id
  });

  // Mutation to claim quest rewards
  const claimQuestRewardMutation = useMutation({
    mutationFn: async (questId: number) => {
      if (!user?.id) return null;
      return apiRequest(`/api/users/${user.id}/quests/${questId}/claim`, { 
        method: 'POST',
        body: JSON.stringify({})
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'quests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'stats'] });
      toast({
        title: 'Reward Claimed!',
        description: 'XP has been added to your account',
      });
    },
    onError: (error) => {
      console.error('Error claiming quest reward:', error);
      toast({
        title: 'Error',
        description: 'Failed to claim quest reward',
        variant: 'destructive'
      });
    }
  });

  // Mutation to track quest (pin to home)
  const trackQuestMutation = useMutation({
    mutationFn: async (questId: number) => {
      if (!user?.id) return null;
      return apiRequest(`/api/users/${user.id}/quests/${questId}/track`, { 
        method: 'POST',
        body: JSON.stringify({})
      });
    },
    onSuccess: () => {
      toast({
        title: 'Quest Tracked',
        description: 'Quest added to your Home Activity feed',
      });
    },
    onError: (error) => {
      console.error('Error tracking quest:', error);
      toast({
        title: 'Error',
        description: 'Failed to track quest',
        variant: 'destructive'
      });
    }
  });

  return {
    quests: userQuestsQuery.data || [] as UserQuest[],
    stats: userStatsQuery.data || {} as UserStats,
    isLoading: userQuestsQuery.isLoading || userStatsQuery.isLoading,
    claimQuestReward: claimQuestRewardMutation.mutateAsync,
    trackQuest: trackQuestMutation.mutateAsync,
    isClaimingReward: claimQuestRewardMutation.isPending,
    isTrackingQuest: trackQuestMutation.isPending,
  };
}