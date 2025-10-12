import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';

interface Achievement {
  id: number;
  name: string;
  description: string;
  category: string;
  badgeIcon: string;
  badgeColor: string;
  threshold: number;
  createdAt: string;
}

interface UserAchievement {
  id: number;
  userId: number;
  achievementId: number;
  unlockedAt: string;
  displayed: boolean;
  achievement: Achievement;
}

export function useAchievements() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query to get all user achievements
  const userAchievementsQuery = useQuery({
    queryKey: ['/api/users', user?.id, 'achievements'],
    queryFn: async () => {
      if (!user?.id) return [] as UserAchievement[];
      return apiRequest(`/api/users/${user.id}/achievements`) as Promise<UserAchievement[]>;
    },
    enabled: !!user?.id
  });

  // Query to get new/unviewed achievements
  const newAchievementsQuery = useQuery({
    queryKey: ['/api/users', user?.id, 'achievements', 'new'],
    queryFn: async () => {
      if (!user?.id) return [] as UserAchievement[];
      return apiRequest(`/api/users/${user.id}/achievements/new`) as Promise<UserAchievement[]>;
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // Check for new achievements every minute
  });

  // Mutation to mark achievements as viewed
  const markAchievementsViewedMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return null;
      return apiRequest(`/api/users/${user.id}/achievements/viewed`, { 
        method: 'POST',
        body: JSON.stringify({})
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'achievements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'achievements', 'new'] });
    },
    onError: (error) => {
      console.error('Error marking achievements as viewed:', error);
      toast({
        title: 'Error',
        description: 'Failed to update achievements',
        variant: 'destructive'
      });
    }
  });

  return {
    achievements: userAchievementsQuery.data || [] as UserAchievement[],
    newAchievements: newAchievementsQuery.data || [] as UserAchievement[],
    isLoading: userAchievementsQuery.isLoading,
    isNewAchievementsLoading: newAchievementsQuery.isLoading,
    markAchievementsAsViewed: markAchievementsViewedMutation.mutateAsync,
    hasNewAchievements: (newAchievementsQuery.data?.length || 0) > 0,
  };
}