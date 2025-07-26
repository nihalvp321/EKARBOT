
-- Drop existing restrictive RLS policies
DROP POLICY IF EXISTS "Sales agents can view their saved projects" ON public.saved_projects;
DROP POLICY IF EXISTS "Sales agents can insert their saved projects" ON public.saved_projects;
DROP POLICY IF EXISTS "Sales agents can delete their saved projects" ON public.saved_projects;

DROP POLICY IF EXISTS "Sales agents can view their own site visits" ON public.site_visits;
DROP POLICY IF EXISTS "Sales agents can create site visits" ON public.site_visits;
DROP POLICY IF EXISTS "Sales agents can update their own site visits" ON public.site_visits;

DROP POLICY IF EXISTS "Sales agents can view their own profile" ON public.sales_agents;
DROP POLICY IF EXISTS "Sales agents can update their own profile" ON public.sales_agents;

DROP POLICY IF EXISTS "Sales agents can upload their profile images" ON storage.objects;
DROP POLICY IF EXISTS "Sales agents can view their profile images" ON storage.objects;
DROP POLICY IF EXISTS "Sales agents can update their profile images" ON storage.objects;
DROP POLICY IF EXISTS "Sales agents can delete their profile images" ON storage.objects;

-- Create more permissive policies for custom auth system
-- For saved_projects table
CREATE POLICY "Allow all operations for saved_projects" 
  ON public.saved_projects 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- For site_visits table  
CREATE POLICY "Allow all operations for site_visits" 
  ON public.site_visits 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- For sales_agents table
CREATE POLICY "Allow all operations for sales_agents" 
  ON public.sales_agents 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- For chat_prompts table
DROP POLICY IF EXISTS "Sales agents can view their chat prompts" ON public.chat_prompts;
DROP POLICY IF EXISTS "Sales agents can insert their chat prompts" ON public.chat_prompts;
DROP POLICY IF EXISTS "Sales agents can delete their chat prompts" ON public.chat_prompts;

CREATE POLICY "Allow all operations for chat_prompts" 
  ON public.chat_prompts 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- For storage objects (profile images)
CREATE POLICY "Allow all storage operations for sales agents"
ON storage.objects FOR ALL
USING (bucket_id = 'sales-agent-profiles');

-- Ensure the sales-agent-profiles bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('sales-agent-profiles', 'sales-agent-profiles', true)
ON CONFLICT (id) DO UPDATE SET public = true;
