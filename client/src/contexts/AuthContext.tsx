import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { useLocation } from 'wouter';

interface AuthContextType {
  user: User | null;
  userRole: UserRole;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// For demo purposes, we'll use localStorage to simulate auth
const LOCAL_STORAGE_AUTH_KEY = 'dynamic_discounting_auth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('supplier');
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      setIsLoading(true);
      
      try {
        // Get stored user from localStorage
        const storedUser = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
        
        if (storedUser) {
          const userData = JSON.parse(storedUser) as User;
          setUser(userData);
          setUserRole(userData.role);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // For demo purposes, we'll accept any credentials
      // In a real app, this would validate against a backend
      
      // Find existing user or create default
      let userData = null;
      
      if (email === 'supplier@example.com') {
        userData = {
          id: 'supplier1',
          email: 'supplier@example.com',
          role: 'supplier' as UserRole,
        };
      } else if (email === 'buyer@example.com') {
        userData = {
          id: 'buyer1',
          email: 'buyer@example.com',
          role: 'buyer' as UserRole,
        };
      } else {
        // Create a new user with supplier role by default
        userData = {
          id: `user_${Date.now()}`,
          email,
          role: 'supplier' as UserRole,
        };
      }
      
      // Store in localStorage
      localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(userData));
      
      // Update state
      setUser(userData);
      setUserRole(userData.role);
      setLocation(`/dashboard/${userData.role}`);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, role: UserRole) => {
    try {
      // For demo purposes, we'll create a user with the given role
      const userData = {
        id: `user_${Date.now()}`,
        email,
        role,
      };
      
      // Store in localStorage
      localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(userData));
      
      // Update state
      setUser(userData);
      setUserRole(role);
      setLocation(`/dashboard/${role}`);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear from localStorage
      localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
      
      // Update state
      setUser(null);
      setUserRole('supplier');
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    userRole,
    isLoading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
