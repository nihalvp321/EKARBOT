import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DeveloperUser {
  id: string;
  username: string;
  email: string;
  user_type: string;
}

interface DeveloperProfile {
  id: string;
  user_id: string;
  developer_id: string;
  developer_name: string;
  contact_person_name: string;
  contact_number: string;
  email_address: string;
  office_address?: string;
  profile_image_url?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  skills?: string[];
  experience_years?: number;
  education?: string;
  certifications?: string[];
  portfolio_url?: string;
  linkedin_url?: string;
  github_url?: string;
}

interface DeveloperAuthContextType {
  user: DeveloperUser | null;
  profile: DeveloperProfile | null;
  signIn: (developerId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<DeveloperProfile>) => Promise<{ success: boolean; error?: string }>;
  uploadProfileImage: (file: File) => Promise<{ success: boolean; error?: string; url?: string }>;
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  loading: boolean;
}

const DeveloperAuthContext = createContext<DeveloperAuthContextType | undefined>(undefined);

export const DeveloperAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<DeveloperUser | null>(null);
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem('developer_user');
    const storedToken = localStorage.getItem('developer_token');
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        fetchDeveloperProfile(userData.id);
      } catch (error) {
        console.error('Error parsing stored developer data:', error);
        localStorage.removeItem('developer_user');
        localStorage.removeItem('developer_token');
      }
    }
    
    setLoading(false);
  }, []);

  const fetchDeveloperProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('developers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching developer profile:', error);
        return;
      }

      if (data) {
        // Map developers table data to DeveloperProfile interface
        const profileData: DeveloperProfile = {
          id: data.id,
          user_id: data.user_id || '',
          developer_id: data.developer_id,
          developer_name: data.developer_name,
          contact_person_name: data.contact_person_name,
          contact_number: data.contact_number,
          email_address: data.email_address,
          office_address: data.office_address,
          profile_image_url: (data as any).profile_image_url || undefined,
          // Add default values for extended profile fields
          phone: undefined,
          address: undefined,
          date_of_birth: undefined,
          emergency_contact_name: undefined,
          emergency_contact_phone: undefined,
          skills: undefined,
          experience_years: undefined,
          education: undefined,
          certifications: undefined,
          portfolio_url: undefined,
          linkedin_url: undefined,
          github_url: undefined,
        };
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error in fetchDeveloperProfile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchDeveloperProfile(user.id);
    }
  };

  const signIn = async (developerId: string, password: string) => {
    try {
      if (!developerId || !password) {
        return { success: false, error: 'Developer ID and password are required' };
      }

      console.log('Attempting developer sign in with:', { developerId });

      // Query the app_users table for developer type users
      const { data: userData, error } = await supabase
        .from('app_users')
        .select('id, username, email, user_type, password_hash')
        .eq('username', developerId.trim())
        .eq('user_type', 'developer')
        .eq('is_active', true)
        .single();

      if (error || !userData) {
        console.error('Developer lookup error:', error);
        return { success: false, error: 'Invalid developer ID or password' };
      }

      // For demo purposes, compare plain text password
      if (userData.password_hash !== password) {
        console.error('Password mismatch');
        return { success: false, error: 'Invalid developer ID or password' };
      }

      const developerUser: DeveloperUser = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        user_type: userData.user_type
      };

      const sessionToken = `dev_token_${userData.id}_${Date.now()}`;

      setUser(developerUser);
      localStorage.setItem('developer_user', JSON.stringify(developerUser));
      localStorage.setItem('developer_token', sessionToken);

      // Fetch developer profile
      await fetchDeveloperProfile(userData.id);

      console.log('Developer sign in successful:', developerUser);
      return { success: true };
    } catch (error) {
      console.error('Developer sign in exception:', error);
      return { success: false, error: 'Sign in failed' };
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      setProfile(null);
      localStorage.removeItem('developer_user');
      localStorage.removeItem('developer_token');
      console.log('Developer sign out successful');
    } catch (error) {
      console.error('Developer sign out error:', error);
    }
  };

  const updateProfile = async (updates: Partial<DeveloperProfile>) => {
    try {
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Update the developers table with the allowed fields
      const developerUpdates: any = {};
      if (updates.developer_name) developerUpdates.developer_name = updates.developer_name;
      if (updates.contact_person_name) developerUpdates.contact_person_name = updates.contact_person_name;
      if (updates.contact_number) developerUpdates.contact_number = updates.contact_number;
      if (updates.email_address) developerUpdates.email_address = updates.email_address;
      if (updates.office_address) developerUpdates.office_address = updates.office_address;
      if (updates.profile_image_url !== undefined) developerUpdates.profile_image_url = updates.profile_image_url;

      const { data, error } = await supabase
        .from('developers')
        .update(developerUpdates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        return { success: false, error: 'Failed to update profile' };
      }

      if (data) {
        // Re-fetch the updated profile
        await fetchDeveloperProfile(user.id);
      }

      return { success: true };
    } catch (error) {
      console.error('Update profile exception:', error);
      return { success: false, error: 'Profile update failed' };
    }
  };

  const uploadProfileImage = async (file: File) => {
    try {
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Upload image to Supabase storage
      const fileName = `profile_${user.id}_${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from('developer-files')
        .upload(`profiles/${fileName}`, file);

      if (error) {
        console.error('Profile image upload error:', error);
        return { success: false, error: 'Failed to upload image' };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('developer-files')
        .getPublicUrl(`profiles/${fileName}`);

      // Update profile with new image URL
      const updateResult = await updateProfile({ profile_image_url: publicUrl });
      
      if (updateResult.success) {
        return { success: true, url: publicUrl };
      } else {
        return { success: false, error: updateResult.error };
      }
    } catch (error) {
      console.error('Upload profile image exception:', error);
      return { success: false, error: 'Image upload failed' };
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      // For now, we'll just create a mock reset token
      // In a real app, you would send an email via an edge function
      const token = Math.random().toString(36).substring(2, 15);
      
      const { data: userData } = await supabase
        .from('app_users')
        .select('id')
        .eq('email', email)
        .eq('user_type', 'developer')
        .single();

      if (!userData) {
        return { success: false, error: 'Email not found' };
      }

      // In a real app, you would send an email here
      console.log('Password reset token created:', token);
      return { success: true };
    } catch (error) {
      console.error('Send password reset email exception:', error);
      return { success: false, error: 'Failed to send reset email' };
    }
  };

  return (
    <DeveloperAuthContext.Provider value={{
      user,
      profile,
      signIn,
      signOut,
      updateProfile,
      uploadProfileImage,
      sendPasswordResetEmail,
      refreshProfile,
      loading
    }}>
      {children}
    </DeveloperAuthContext.Provider>
  );
};

export const useDeveloperAuth = () => {
  const context = useContext(DeveloperAuthContext);
  if (context === undefined) {
    throw new Error('useDeveloperAuth must be used within a DeveloperAuthProvider');
  }
  return context;
};
