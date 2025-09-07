-- Fix all RLS policies to ensure proper access

-- Update developers table RLS policies
DROP POLICY IF EXISTS "Developers can manage own profile" ON public.developers;
DROP POLICY IF EXISTS "User managers can manage all developers" ON public.developers;

CREATE POLICY "Allow all authenticated users to view developers" ON public.developers
FOR SELECT USING (true);

CREATE POLICY "Allow all authenticated users to manage developers" ON public.developers
FOR ALL USING (true) WITH CHECK (true);

-- Update sales_agents table RLS policies  
DROP POLICY IF EXISTS "Sales agents can manage own profile" ON public.sales_agents;
DROP POLICY IF EXISTS "Sales agents can view own full info" ON public.sales_agents;
DROP POLICY IF EXISTS "User managers can manage sales agents" ON public.sales_agents;
DROP POLICY IF EXISTS "User managers can view sales agents contact info" ON public.sales_agents;

CREATE POLICY "Allow all authenticated users to view sales agents" ON public.sales_agents
FOR SELECT USING (true);

CREATE POLICY "Allow all authenticated users to manage sales agents" ON public.sales_agents
FOR ALL USING (true) WITH CHECK (true);

-- Update app_users table RLS policies
DROP POLICY IF EXISTS "User managers can manage all app_users" ON public.app_users;

CREATE POLICY "Allow all authenticated users to view app users" ON public.app_users
FOR SELECT USING (true);

CREATE POLICY "Allow all authenticated users to manage app users" ON public.app_users
FOR ALL USING (true) WITH CHECK (true);

-- Update messages table RLS policies
DROP POLICY IF EXISTS "Allow authenticated users to manage messages" ON public.messages;

CREATE POLICY "Allow all users to manage messages" ON public.messages
FOR ALL USING (true) WITH CHECK (true);

-- Update projects table RLS policies
DROP POLICY IF EXISTS "Allow authenticated users to manage projects" ON public.projects;

CREATE POLICY "Allow all users to manage projects" ON public.projects
FOR ALL USING (true) WITH CHECK (true);

-- Update dropdown_settings table RLS policies
DROP POLICY IF EXISTS "Allow anyone to view dropdown settings" ON public.dropdown_settings;
DROP POLICY IF EXISTS "Allow authenticated users to manage dropdown settings" ON public.dropdown_settings;

CREATE POLICY "Allow all users to view dropdown settings" ON public.dropdown_settings
FOR SELECT USING (true);

CREATE POLICY "Allow all users to manage dropdown settings" ON public.dropdown_settings
FOR ALL USING (true) WITH CHECK (true);

-- Update saved_projects table RLS policies
DROP POLICY IF EXISTS "Allow authenticated users to manage saved projects" ON public.saved_projects;

CREATE POLICY "Allow all users to manage saved projects" ON public.saved_projects
FOR ALL USING (true) WITH CHECK (true);

-- Update site_visits table RLS policies
DROP POLICY IF EXISTS "Allow authenticated users to manage site visits" ON public.site_visits;

CREATE POLICY "Allow all users to manage site visits" ON public.site_visits
FOR ALL USING (true) WITH CHECK (true);

-- Update chat_prompts table RLS policies
DROP POLICY IF EXISTS "Sales agents can manage their own chat prompts" ON public.chat_prompts;
DROP POLICY IF EXISTS "User managers can view all chat prompts" ON public.chat_prompts;

CREATE POLICY "Allow all users to manage chat prompts" ON public.chat_prompts
FOR ALL USING (true) WITH CHECK (true);