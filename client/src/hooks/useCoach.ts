import { useUser } from "@/context/UserContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type CoachType = "kai" | "titan" | "lumi";

interface CoachInfo {
  id: CoachType;
  name: string;
  role: string;
  description: string;
  icon: string;
  color: string;
  expertise: string[];
}

const COACHES: Record<CoachType, CoachInfo> = {
  kai: {
    id: "kai",
    name: "Kai",
    role: "Calisthenics Expert",
    description: "Let's master your bodyweight. I'll help you build strength, agility, and control without equipment.",
    icon: "fa-running",
    color: "coach-kai",
    expertise: ["Bodyweight training", "Mobility", "Functional fitness"]
  },
  titan: {
    id: "titan",
    name: "Titan",
    role: "Strength Coach",
    description: "Ready to get strong? I'll guide you through structured weight training for optimal gains and power.",
    icon: "fa-dumbbell",
    color: "coach-titan",
    expertise: ["Weight training", "Muscle building", "Power development"]
  },
  lumi: {
    id: "lumi",
    name: "Lumi",
    role: "Wellness Guide",
    description: "Balance is key. I'll help you improve flexibility, mindfulness, and overall wellness through holistic practices.",
    icon: "fa-wind",
    color: "coach-lumi",
    expertise: ["Yoga", "Flexibility", "Recovery", "Mindfulness"]
  }
};

export function useCoach() {
  const { user, saveUser } = useUser();
  const queryClient = useQueryClient();
  
  const currentCoach = user?.selectedCoach as CoachType || "kai";
  const coachInfo = COACHES[currentCoach];
  
  const changeCoachMutation = useMutation({
    mutationFn: async (newCoach: CoachType) => {
      if (!user?.id) throw new Error("User not logged in");
      
      const res = await apiRequest("PATCH", `/api/users/${user.id}`, {
        selectedCoach: newCoach
      });
      
      return res.json();
    },
    onSuccess: (updatedUser) => {
      saveUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
    },
  });
  
  return {
    currentCoach: coachInfo,
    allCoaches: COACHES,
    changeCoach: (newCoach: CoachType) => changeCoachMutation.mutateAsync(newCoach),
    isChanging: changeCoachMutation.isPending,
  };
}
