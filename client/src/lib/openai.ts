import { useUser } from "@/context/UserContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";
import OpenAI from "openai";

// We'll use server-side API calls to handle OpenAI requests instead of initializing the client directly
// This way we avoid exposing the API key in the frontend

export interface Message {
  content: string;
  isFromCoach: boolean;
}

// We'll use the backend API to generate coaching responses
// This will be handled server-side in routes.ts

export function useCoachChat() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id) throw new Error("User not logged in");
      
      // First, save the user's message
      const userMessageRes = await apiRequest("POST", `/api/users/${user.id}/messages`, {
        content,
        isFromCoach: false
      });
      
      // The server will automatically generate and save the AI coach response
      // This is handled in the server-side routes.ts file
      
      return userMessageRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/messages`] });
    }
  });
  
  return {
    sendMessage: (content: string) => sendMessageMutation.mutateAsync(content),
    isPending: sendMessageMutation.isPending,
    error: sendMessageMutation.error,
  };
}
