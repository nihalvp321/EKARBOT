
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AppUser {
  id: string;
  username: string;
  email: string;
  user_type: string;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        
        if (session?.user) {
          // Get user details from app_users table
          const { data: userData, error } = await supabase
            .from('app_users')
            .select('*')
            .eq('email', session.user.email)
            .eq('user_type', 'user_manager')
            .single();

          if (userData && !error) {
            const userInfo = {
              id: userData.id,
              username: userData.username,
              email: userData.email,
              user_type: userData.user_type
            };
            setUser(userInfo);
            localStorage.setItem('ekarbot_token', 'authenticated');
            localStorage.setItem('ekarbot_user', JSON.stringify(userInfo));
          }
        } else {
          setUser(null);
          localStorage.removeItem('ekarbot_token');
          localStorage.removeItem('ekarbot_user');
        }
        setLoading(false);
      }
    );

    // Check for existing session
    checkAuth();

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Existing session found:', session);
      } else {
        // Check localStorage for backward compatibility
        const token = localStorage.getItem('ekarbot_token');
        const userData = localStorage.getItem('ekarbot_user');
        
        if (token && userData) {
          try {
            const parsedUser = JSON.parse(userData);
            // Create a mock session for authenticated users
            await createMockSession(parsedUser);
          } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('ekarbot_token');
            localStorage.removeItem('ekarbot_user');
          }
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    }
    setLoading(false);
  };

  const createMockSession = async (userData: AppUser) => {
    try {
      // For the custom auth system, we'll create a mock session structure
      // that includes the user data but works with our custom authentication
      const mockSession = {
        access_token: 'custom-auth-token',
        refresh_token: 'custom-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: userData.id,
          email: userData.email,
          user_metadata: {
            username: userData.username,
            user_type: userData.user_type
          }
        }
      } as any;

      setSession(mockSession);
      setUser(userData);
      console.log('Mock session created for custom auth user');
    } catch (error) {
      console.error('Failed to create mock session:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login with:', email);
      
      // First authenticate using our custom function
      const { data: authResult, error: authError } = await supabase.rpc('authenticate_app_user', {
        input_email: email,
        input_password: password
      });

      if (authError || !authResult) {
        console.error('Authentication error:', authError);
        return { success: false, error: 'Invalid credentials' };
      }

      // Get user details
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', email)
        .eq('user_type', 'user_manager')
        .single();

      if (userError || !userData) {
        console.error('User lookup error:', userError);
        return { success: false, error: 'User not found' };
      }

      const userInfo = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        user_type: userData.user_type
      };

      // Store in localStorage and create mock session
      localStorage.setItem('ekarbot_token', 'authenticated');
      localStorage.setItem('ekarbot_user', JSON.stringify(userInfo));
      
      await createMockSession(userInfo);

      return { success: true };
    } catch (error) {
      console.error('Login exception:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('ekarbot_token');
    localStorage.removeItem('ekarbot_user');
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
