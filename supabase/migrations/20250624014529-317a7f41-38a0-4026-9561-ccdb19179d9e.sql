
-- Fix RLS policies for saved_projects table
DROP POLICY IF EXISTS "Sales agents can manage their saved projects" ON public.saved_projects;

CREATE POLICY "Sales agents can view their saved projects" 
  ON public.saved_projects 
  FOR SELECT 
  USING (sales_agent_id IN (
    SELECT sales_agent_id FROM public.sales_agents 
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Sales agents can insert their saved projects" 
  ON public.saved_projects 
  FOR INSERT 
  WITH CHECK (sales_agent_id IN (
    SELECT sales_agent_id FROM public.sales_agents 
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Sales agents can delete their saved projects" 
  ON public.saved_projects 
  FOR DELETE 
  USING (sales_agent_id IN (
    SELECT sales_agent_id FROM public.sales_agents 
    WHERE user_id = auth.uid() AND is_active = true
  ));

-- Fix RLS policies for site_visits table
DROP POLICY IF EXISTS "Sales agents can view their own site visits" ON public.site_visits;
DROP POLICY IF EXISTS "Sales agents can create site visits" ON public.site_visits;
DROP POLICY IF EXISTS "Sales agents can update their own site visits" ON public.site_visits;

CREATE POLICY "Sales agents can view their own site visits" 
  ON public.site_visits 
  FOR SELECT 
  USING (sales_agent_id IN (
    SELECT sales_agent_id FROM public.sales_agents 
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Sales agents can create site visits" 
  ON public.site_visits 
  FOR INSERT 
  WITH CHECK (sales_agent_id IN (
    SELECT sales_agent_id FROM public.sales_agents 
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Sales agents can update their own site visits" 
  ON public.site_visits 
  FOR UPDATE 
  USING (sales_agent_id IN (
    SELECT sales_agent_id FROM public.sales_agents 
    WHERE user_id = auth.uid() AND is_active = true
  ));

-- Fix RLS policies for chat_prompts table
DROP POLICY IF EXISTS "Sales agents can manage their chat prompts" ON public.chat_prompts;

CREATE POLICY "Sales agents can view their chat prompts" 
  ON public.chat_prompts 
  FOR SELECT 
  USING (sales_agent_id IN (
    SELECT sales_agent_id FROM public.sales_agents 
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Sales agents can insert their chat prompts" 
  ON public.chat_prompts 
  FOR INSERT 
  WITH CHECK (sales_agent_id IN (
    SELECT sales_agent_id FROM public.sales_agents 
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Sales agents can delete their chat prompts" 
  ON public.chat_prompts 
  FOR DELETE 
  USING (sales_agent_id IN (
    SELECT sales_agent_id FROM public.sales_agents 
    WHERE user_id = auth.uid() AND is_active = true
  ));

-- Add missing is_active column to projects table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'is_active') THEN
        ALTER TABLE public.projects ADD COLUMN is_active boolean NOT NULL DEFAULT true;
    END IF;
END $$;
