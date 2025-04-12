import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/config/supabase';
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
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          return;
        }
        
        if (data.session) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, email, role')
            .eq('id', data.session.user.id)
            .single();
            
          if (userError) {
            console.error('Error fetching user data:', userError);
            return;
          }
          
          setUser({
            id: userData.id,
            email: userData.email,
            role: userData.role,
          });
          
          setUserRole(userData.role);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Set up auth subscription
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('id', session.user.id)
          .single();
          
        if (userError) {
          console.error('Error fetching user data:', userError);
          return;
        }
        
        setUser({
          id: userData.id,
          email: userData.email,
          role: userData.role,
        });
        
        setUserRole(userData.role);
        setLocation(`/dashboard/${userData.role}`);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserRole('supplier');
        setLocation('/');
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setLocation]);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', data.user.id)
        .single();
        
      if (userError) throw userError;
      
      setUser({
        id: userData.id,
        email: userData.email,
        role: userData.role,
      });
      
      setUserRole(userData.role);
      setLocation(`/dashboard/${userData.role}`);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, role: UserRole) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Create user record with role
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user!.id,
          email,
          role,
        });
        
      if (profileError) throw profileError;
      
      // Auto sign in after signup
      return login(email, password);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
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
