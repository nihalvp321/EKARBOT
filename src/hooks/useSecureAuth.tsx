import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AppUser {
  id: string;
  username: string;
  email: string;
  user_type: string;
}

interface SecureAuthContextType {
  user: AppUser | null;
  session: { access_token: string; user: AppUser } | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, userData: { username: string; user_type: string }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const SecureAuthContext = createContext<SecureAuthContextType | undefined>(undefined);

export const SecureAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<{ access_token: string; user: AppUser } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem('app_user');
    const storedToken = localStorage.getItem('app_token');
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setSession({ access_token: storedToken, user: userData });
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('app_user');
        localStorage.removeItem('app_token');
      }
    }
    
    setLoading(false);
  }, []);

  const linkSalesAgentToAuthUser = async (appUserId: string, email: string) => {
    try {
      // First, create or get the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: 'temp_password_' + Math.random().toString(36).substring(7), // Temporary password
        options: {
          data: {
            app_user_id: appUserId
          }
        }
      });

      if (authError && authError.message !== 'User already registered') {
        console.error('Auth user creation error:', authError);
        return;
      }

      let authUserId = authData?.user?.id;

      // If user already exists, try to get their ID
      if (!authUserId && authError?.message === 'User already registered') {
        const { data: existingAuthUser } = await supabase.auth.signInWithPassword({
          email: email,
          password: 'temp_password_123' // This will fail but we just need the ID
        });
        authUserId = existingAuthUser?.user?.id;
      }

      if (authUserId) {
        // Update sales_agents table to link with auth user
        const { error: updateError } = await supabase
          .from('sales_agents')
          .update({ user_id: authUserId })
          .eq('email_address', email)
          .eq('is_active', true);

        if (updateError) {
          console.error('Error linking sales agent to auth user:', updateError);
        } else {
          console.log('Successfully linked sales agent to auth user');
        }
      }
    } catch (error) {
      console.error('Error in linkSalesAgentToAuthUser:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Input validation
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' };
      }

      if (!email.match(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)) {
        return { success: false, error: 'Invalid email format' };
      }

      console.log('Attempting to sign in with:', { email });

      // Use the security definer function to authenticate
      const { data: authResult, error } = await supabase
        .rpc('authenticate_app_user', {
          input_email: email.trim().toLowerCase(),
          input_password: password
        });

      if (error || !authResult || authResult.length === 0) {
        console.error('Authentication error:', error);
        return { success: false, error: 'Invalid email or password' };
      }

      const userData = authResult[0];
      
      if (!userData.success) {
        console.error('Authentication failed');
        return { success: false, error: 'Invalid email or password' };
      }

      // If this is a sales agent, ensure they're linked to auth users
      if (userData.user_type === 'sales_agent') {
        await linkSalesAgentToAuthUser(userData.user_id, userData.email);
      }

      // Create user session
      const appUser: AppUser = {
        id: userData.user_id,
        username: userData.username,
        email: userData.email,
        user_type: userData.user_type
      };

      const sessionToken = `token_${userData.user_id}_${Date.now()}`;
      const userSession = { access_token: sessionToken, user: appUser };

      // Store in state and localStorage
      setUser(appUser);
      setSession(userSession);
      localStorage.setItem('app_user', JSON.stringify(appUser));
      localStorage.setItem('app_token', sessionToken);

      console.log('Sign in successful:', appUser);
      return { success: true };
    } catch (error) {
      console.error('Sign in exception:', error);
      return { success: false, error: 'Sign in failed' };
    }
  };

  const signUp = async (email: string, password: string, userData: { username: string; user_type: string }) => {
    try {
      // Input validation
      if (!email || !password || !userData.username) {
        return { success: false, error: 'All fields are required' };
      }

      if (!email.match(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)) {
        return { success: false, error: 'Invalid email format' };
      }

      if (userData.username.length < 3 || userData.username.length > 50) {
        return { success: false, error: 'Username must be between 3 and 50 characters' };
      }

      if (!['user_manager', 'developer', 'sales_agent'].includes(userData.user_type)) {
        return { success: false, error: 'Invalid user type' };
      }

      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (existingUser) {
        return { success: false, error: 'User already exists with this email' };
      }

      // Create new user in app_users table
      const { data: newUser, error: insertError } = await supabase
        .from('app_users')
        .insert({
          username: userData.username,
          email: email.trim().toLowerCase(),
          password_hash: password, // In production, hash this properly
          user_type: userData.user_type
        })
        .select()
        .single();

      if (insertError || !newUser) {
        console.error('User creation error:', insertError);
        return { success: false, error: 'Failed to create user account' };
      }

      // Automatically sign in the new user
      const signInResult = await signIn(email, password);
      return signInResult;
    } catch (error) {
      console.error('Sign up exception:', error);
      return { success: false, error: 'Sign up failed' };
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      setSession(null);
      localStorage.removeItem('app_user');
      localStorage.removeItem('app_token');
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <SecureAuthContext.Provider value={{ user, session, signIn, signUp, signOut, loading }}>
      {children}
    </SecureAuthContext.Provider>
  );
};

export const useSecureAuth = () => {
  const context = useContext(SecureAuthContext);
  if (context === undefined) {
    throw new Error('useSecureAuth must be used within a SecureAuthProvider');
  }
  return context;
};
