import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface WorkoutCardProps {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  duration: number;
  difficulty: string;
  tags: string[];
  type: string;
  isRecommended?: boolean;
  coachType: string;
}

const WorkoutCard = ({
  id,
  title,
  description,
  imageUrl,
  duration,
  difficulty,
  tags,
  type,
  isRecommended = false,
  coachType
}: WorkoutCardProps) => {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const completeWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not logged in");
      
      const res = await apiRequest("POST", `/api/users/${user.id}/workouts`, {
        workoutId: id
      });
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/progress`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/workouts`] });
      
      toast({
        title: "Workout Complete!",
        description: "Great job! Your progress has been updated.",
      });
    },
  });
  
  const handleStartWorkout = async () => {
    try {
      await completeWorkoutMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to complete workout:", error);
      toast({
        title: "Error",
        description: "Failed to record workout. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Format difficulty to capitalize first letter
  const formattedDifficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="h-40 bg-gray-200 relative">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
          <div className="text-xs font-medium">{tags?.[0]?.toUpperCase() || type.toUpperCase()}</div>
          <div className="text-lg font-bold">{title}</div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-sm text-gray-600">
            <i className="fas fa-clock mr-1"></i>
            <span>{duration} min</span>
            <span className="mx-2">•</span>
            <i className="fas fa-fire-alt mr-1"></i>
            <span>{formattedDifficulty}</span>
          </div>
          {isRecommended && (
            <div className="text-xs text-white bg-primary px-2 py-1 rounded-full">
              Recommended
            </div>
          )}
        </div>
        <div className="text-sm text-gray-600 mb-4">
          {description}
        </div>
        <Button 
          className={`w-full py-6 bg-${coachType}`}
          onClick={handleStartWorkout}
          disabled={completeWorkoutMutation.isPending}
        >
          {completeWorkoutMutation.isPending ? "Completing..." : "Start Workout"}
        </Button>
      </div>
    </div>
  );
};

export default WorkoutCard;
