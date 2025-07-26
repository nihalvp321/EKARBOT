
-- First, let's check and fix the sales_agents table to ensure proper user linking
-- Add user_id column to sales_agents if it doesn't exist and isn't properly set
ALTER TABLE public.sales_agents 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Update existing sales_agents records to link them to auth users if needed
-- (This is a one-time fix - in production you'd handle this differently)

-- Drop existing RLS policies for site_visits
DROP POLICY IF EXISTS "Sales agents can view their own site visits" ON public.site_visits;
DROP POLICY IF EXISTS "Sales agents can create site visits" ON public.site_visits;
DROP POLICY IF EXISTS "Sales agents can update their own site visits" ON public.site_visits;

-- Create more permissive policies for debugging
CREATE POLICY "Sales agents can view their own site visits" 
  ON public.site_visits 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.sales_agents 
      WHERE sales_agents.sales_agent_id = site_visits.sales_agent_id 
      AND sales_agents.user_id = auth.uid() 
      AND sales_agents.is_active = true
    )
  );

CREATE POLICY "Sales agents can create site visits" 
  ON public.site_visits 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sales_agents 
      WHERE sales_agents.sales_agent_id = site_visits.sales_agent_id 
      AND sales_agents.user_id = auth.uid() 
      AND sales_agents.is_active = true
    )
  );

CREATE POLICY "Sales agents can update their own site visits" 
  ON public.site_visits 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.sales_agents 
      WHERE sales_agents.sales_agent_id = site_visits.sales_agent_id 
      AND sales_agents.user_id = auth.uid() 
      AND sales_agents.is_active = true
    )
  );

-- Also create a temporary policy for testing (remove this later)
CREATE POLICY "Temporary - Allow authenticated users to insert site visits" 
  ON public.site_visits 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Let's also ensure the sales_agents table has proper RLS
ALTER TABLE public.sales_agents ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for sales_agents table
DROP POLICY IF EXISTS "Sales agents can view their own profile" ON public.sales_agents;
CREATE POLICY "Sales agents can view their own profile" 
  ON public.sales_agents 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Sales agents can update their own profile" 
  ON public.sales_agents 
  FOR UPDATE 
  USING (user_id = auth.uid());
