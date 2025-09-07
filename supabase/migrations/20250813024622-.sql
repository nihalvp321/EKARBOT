-- Fix security vulnerability: Protect sales agents and developers personal data
-- Remove overly permissive policies and implement secure access control

-- Fix developers table security
-- Drop the overly permissive policy that allows all operations
DROP POLICY IF EXISTS "Allow all operations on developers" ON public.developers;

-- Create secure RLS policies for developers table
-- Policy 1: Developers can view and update their own profile
CREATE POLICY "Developers can manage own profile" 
ON public.developers 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 2: User managers can create, view, and manage all developers
CREATE POLICY "User managers can manage all developers" 
ON public.developers 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'user_manager'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'user_manager'
  )
);

-- Policy 3: Authenticated users can view basic developer info (name only, no contact details)
-- Create a safe view for public developer information
CREATE OR REPLACE VIEW public.safe_developers AS
SELECT 
  id,
  developer_id,
  developer_name,
  is_active,
  created_at
FROM public.developers
WHERE is_active = true;

-- Fix sales_agents table security
-- Update the existing policy to be more restrictive
DROP POLICY IF EXISTS "Authenticated users can view sales agents basic info" ON public.sales_agents;

-- Create a safe view for sales agents basic info (no contact details)
CREATE OR REPLACE VIEW public.safe_sales_agents AS
SELECT 
  id,
  sales_agent_id,
  sales_agent_name,
  is_active,
  created_at
FROM public.sales_agents
WHERE is_active = true;

-- Policy: Only user managers can view full sales agent contact information
CREATE POLICY "User managers can view sales agents contact info" 
ON public.sales_agents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'user_manager'
  )
);

-- Policy: Only sales agents themselves can view their own full contact info
CREATE POLICY "Sales agents can view own full info" 
ON public.sales_agents 
FOR SELECT 
USING (auth.uid() = user_id);

-- Grant appropriate permissions on the safe views
GRANT SELECT ON public.safe_developers TO authenticated;
GRANT SELECT ON public.safe_developers TO anon;
GRANT SELECT ON public.safe_sales_agents TO authenticated;
GRANT SELECT ON public.safe_sales_agents TO anon;

-- Ensure RLS is enabled on both tables
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_agents ENABLE ROW LEVEL SECURITY;