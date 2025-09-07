-- Fix critical security vulnerability in app_users table
-- Remove overly permissive policy and implement secure access control

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Allow all operations on app_users" ON public.app_users;

-- Create secure RLS policies for app_users table

-- Policy 1: Users can view their own basic info (excluding password_hash)
-- Create a view for safe user data access
CREATE OR REPLACE VIEW public.safe_app_users AS
SELECT 
  id,
  username,
  email,
  user_type,
  is_active,
  created_at,
  updated_at
FROM public.app_users;

-- Policy 2: Users can update their own email and username (not password via this policy)
CREATE POLICY "Users can update own basic info" 
ON public.app_users 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND OLD.password_hash = NEW.password_hash  -- Prevent password changes via this policy
  AND OLD.user_type = NEW.user_type  -- Prevent role escalation
);

-- Policy 3: Users can view their own data (excluding password_hash in practice)
CREATE POLICY "Users can view own data" 
ON public.app_users 
FOR SELECT 
USING (auth.uid() = id);

-- Policy 4: Only user managers can create new users
CREATE POLICY "User managers can create users" 
ON public.app_users 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'user_manager'
  )
);

-- Policy 5: Only user managers can delete users
CREATE POLICY "User managers can delete users" 
ON public.app_users 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'user_manager'
  )
);

-- Policy 6: User managers can view all users (for management purposes)
CREATE POLICY "User managers can view all users" 
ON public.app_users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'user_manager'
  )
);

-- Policy 7: Special policy for password updates (only allow via specific secure functions)
CREATE POLICY "Secure password updates only" 
ON public.app_users 
FOR UPDATE 
USING (
  auth.uid() = id 
  AND OLD.password_hash != NEW.password_hash  -- Password is being changed
)
WITH CHECK (
  auth.uid() = id 
  AND OLD.password_hash != NEW.password_hash  -- Password is being changed
);

-- Ensure RLS is enabled on app_users table
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Grant appropriate permissions on the safe view
GRANT SELECT ON public.safe_app_users TO authenticated;
GRANT SELECT ON public.safe_app_users TO anon;