import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type User = {
  id: number;
  name: string;
  email: string;
  selectedCoach?: string;
};

type AuthState = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

type AuthActions = {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

type AuthContextType = AuthState & AuthActions;

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Robust fetch with error handling
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Fallback to status text if JSON parsing fails
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response;
  };

  // Check authentication status - hydrate from /api/auth/me
  const refreshUser = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await authFetch('/api/auth/me');
      const { user } = await response.json();
      
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  // Login function - expect {ok: true, user} response
  const login = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await authFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const { ok, user } = await response.json();
      
      if (ok && user) {
        // Update UI state immediately
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });

        toast({
          title: "Welcome back!",
          description: "Successfully logged in",
        });

        // Navigate to main app immediately after successful login
        setLocation("/");
      } else {
        throw new Error("Login failed");
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      
      const message = error instanceof Error ? error.message : "Login failed";
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
      
      throw error;
    }
  };

  // Register function - expect {ok: true, user} response
  const register = async (userData: any) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await authFetch('/api/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      const { ok, user } = await response.json();
      
      if (ok && user) {
        // Update UI state immediately
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });

        toast({
          title: "Account created!",
          description: "Welcome to Thryvin'",
        });

        // Navigate to main app immediately after successful registration
        setLocation("/");
      } else {
        throw new Error("Registration failed");
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      
      const message = error instanceof Error ? error.message : "Registration failed";
      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      });
      
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authFetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      window.location.href = '/auth';
    }
  };

  // Check auth on mount
  useEffect(() => {
    refreshUser();
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}