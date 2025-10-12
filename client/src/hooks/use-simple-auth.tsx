import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: number;
  name: string;
  email: string;
  selectedCoach?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

export const SimpleAuthContext = createContext<AuthContextType | null>(null);

export function SimpleAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  const refreshUser = async () => {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        return true;
      } else {
        const error = await response.text();
        toast({
          title: "Login failed",
          description: error || "Invalid credentials",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null); // Clear user anyway
    }
  };

  // Check auth status on mount
  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <SimpleAuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </SimpleAuthContext.Provider>
  );
}

export function useSimpleAuth() {
  const context = useContext(SimpleAuthContext);
  if (!context) {
    throw new Error("useSimpleAuth must be used within a SimpleAuthProvider");
  }
  return context;
}