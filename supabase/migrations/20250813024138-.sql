-- Fix security vulnerability in sales_agents table
-- Remove overly permissive policies and implement secure access control

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all operations for sales_agents" ON public.sales_agents;
DROP POLICY IF EXISTS "Allow all operations on sales_agents" ON public.sales_agents;

-- Create secure RLS policies for sales_agents table

-- Policy 1: Sales agents can view and update their own profile
CREATE POLICY "Sales agents can manage own profile" 
ON public.sales_agents 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 2: Authenticated users can view basic sales agent info (for legitimate business purposes)
-- This allows user managers and developers to see sales agents for inbox messaging, etc.
CREATE POLICY "Authenticated users can view sales agents basic info" 
ON public.sales_agents 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Policy 3: Only user managers can create/delete sales agents
-- This requires checking if the user has user_manager role from profiles table
CREATE POLICY "User managers can manage sales agents" 
ON public.sales_agents 
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

-- Ensure RLS is enabled on sales_agents table
ALTER TABLE public.sales_agents ENABLE ROW LEVEL SECURITY;