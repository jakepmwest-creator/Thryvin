import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";

// Create an initial empty state for the context
const initialUserContextValue = {
  user: null,
  isLoading: false,
  error: null,
  saveUser: async () => null,
  logOut: () => {}
};

// Define the UserContext type
type UserContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  saveUser: (userData: Partial<User>) => Promise<User | null>;
  logOut: () => void;
};

// Create the context with initial values to avoid undefined check
const UserContext = createContext<UserContextType>(initialUserContextValue);

// UserProvider component
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  
  // Try to load user from local storage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem("thryvin_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user");
        localStorage.removeItem("thryvin_user");
      }
    }
    // Mark loading as complete
    setIsLoading(false);
  }, []);
  
  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      setIsLoading(true);
      const res = await apiRequest("POST", "/api/users", userData);
      return res.json();
    },
    onSuccess: (newUser: User) => {
      setUser(newUser);
      localStorage.setItem("thryvin_user", JSON.stringify(newUser));
      setIsLoading(false);
    },
    onError: () => {
      setIsLoading(false);
    }
  });
  
  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<User> }) => {
      setIsLoading(true);
      const res = await apiRequest("PATCH", `/api/users/${id}`, data);
      return res.json();
    },
    onSuccess: (updatedUser: User) => {
      setUser(updatedUser);
      localStorage.setItem("thryvin_user", JSON.stringify(updatedUser));
      queryClient.invalidateQueries({ queryKey: [`/api/users/${updatedUser.id}`] });
      setIsLoading(false);
    },
    onError: () => {
      setIsLoading(false);
    }
  });
  
  // Function to save user data (either create or update)
  const saveUser = async (userData: Partial<User>): Promise<User | null> => {
    try {
      if (user?.id) {
        // Update existing user
        const updatedUser = await updateUserMutation.mutateAsync({
          id: user.id,
          data: userData
        });
        return updatedUser;
      } else {
        // Create new user
        const newUser = await createUserMutation.mutateAsync(userData);
        return newUser;
      }
    } catch (error) {
      console.error("Error saving user:", error);
      return null;
    }
  };
  
  // Function to log out
  const logOut = () => {
    setUser(null);
    localStorage.removeItem("thryvin_user");
    queryClient.clear();
  };
  
  // Create the context value object
  const contextValue: UserContextType = {
    user,
    isLoading: isLoading || createUserMutation.isPending || updateUserMutation.isPending,
    error: createUserMutation.error || updateUserMutation.error,
    saveUser,
    logOut
  };
  
  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

// Hook for consuming the context
export function useUser() {
  return useContext(UserContext);
}
