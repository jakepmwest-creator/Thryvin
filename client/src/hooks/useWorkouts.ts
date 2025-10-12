import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/context/UserContext";
import { Workout } from "@shared/schema";

export function useWorkouts() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  
  // Get workouts for user's training type
  const { data: workouts, isLoading, error } = useQuery<Workout[]>({
    queryKey: [`/api/workouts?type=${user?.trainingType}`],
    enabled: !!user,
  });
  
  // Get user's completed workouts
  const { data: userWorkouts } = useQuery<Workout[]>({
    queryKey: [`/api/users/${user?.id}/workouts`],
    enabled: !!user,
  });
  
  // Complete a workout
  const completeWorkoutMutation = useMutation({
    mutationFn: async (workoutId: number) => {
      if (!user?.id) throw new Error("User not logged in");
      
      const res = await apiRequest("POST", `/api/users/${user.id}/workouts`, {
        workoutId
      });
      
      return res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/workouts`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/progress`] });
    },
  });
  
  return {
    workouts,
    userWorkouts,
    isLoading,
    error,
    completeWorkout: (workoutId: number) => completeWorkoutMutation.mutateAsync(workoutId),
    isCompleting: completeWorkoutMutation.isPending,
  };
}
