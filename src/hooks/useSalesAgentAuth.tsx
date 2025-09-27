
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { validateSalesAgentCredentials, logSecurityEvent } from '@/utils/securityUtils';
import { supabase } from '@/integrations/supabase/client';

interface SalesAgent {
  id: string;
  sales_agent_id: string;
  sales_agent_name: string;
  contact_number: string;
  email_address: string;
  profile_image_url: string | null;
  is_active: boolean;
  user_id?: string;
}

interface SalesAgentAuthContextType {
  user: SalesAgent | null;
  profile: SalesAgent | null;
  signIn: (salesAgentId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const SalesAgentAuthContext = createContext<SalesAgentAuthContextType | undefined>(undefined);

export const SalesAgentAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SalesAgent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem('sales_agent_user');
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('sales_agent_user');
      }
    }
    
    setLoading(false);
  }, []);

  const signIn = async (salesAgentId: string, password: string) => {
    try {
      console.log('Attempting to sign in with sales agent ID:', salesAgentId);

      // Use the secure validation function
      const result = await validateSalesAgentCredentials(salesAgentId, password);
      
      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Store in state and localStorage
      setUser(result.agent);
      localStorage.setItem('sales_agent_user', JSON.stringify(result.agent));

      console.log('Sign in successful:', result.agent);
      return { success: true };
    } catch (error) {
      console.error('Sign in exception:', error);
      await logSecurityEvent('sales_agent_signin_exception', { error: error.message });
      return { success: false, error: 'Sign in failed' };
    }
  };

  const refreshProfile = async () => {
  if (!user) return;

  try {
    const { data, error } = await supabase
      .from('sales_agents')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setUser(data); // update context state
      localStorage.setItem('sales_agent_user', JSON.stringify(data)); // persist
      console.log('Profile refreshed:', data);
    } else {
      console.error('Error fetching updated profile:', error);
    }
  } catch (err) {
    console.error('Exception refreshing profile:', err);
  }
};


  const signOut = async () => {
    if (user) {
      await logSecurityEvent('sales_agent_signout', { sales_agent_id: user.sales_agent_id });
    }
    setUser(null);
    localStorage.removeItem('sales_agent_user');
  };

  return (
    <SalesAgentAuthContext.Provider value={{ 
      user, 
      profile: user,
      signIn,
      signOut, 
      loading,
      refreshProfile
    }}>
      {children}
    </SalesAgentAuthContext.Provider>
  );
};

export const useSalesAgentAuth = () => {
  const context = useContext(SalesAgentAuthContext);
  if (context === undefined) {
    throw new Error('useSalesAgentAuth must be used within a SalesAgentAuthProvider');
  }
  return context;
};
