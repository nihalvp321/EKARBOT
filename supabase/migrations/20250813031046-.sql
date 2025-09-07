-- Fix all security issues by implementing proper RLS policies (Part 2)

-- First drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Developers can view site visits for their projects" ON site_visits;
DROP POLICY IF EXISTS "Allow all operations for site_visits" ON site_visits;
DROP POLICY IF EXISTS "Temporary - Allow authenticated users to insert site visits" ON site_visits;
DROP POLICY IF EXISTS "Allow all operations on app_users" ON app_users;
DROP POLICY IF EXISTS "Allow all operations on messages" ON messages;
DROP POLICY IF EXISTS "User managers can view sales agents contact info" ON sales_agents;
DROP POLICY IF EXISTS "Allow all operations for chat_prompts" ON chat_prompts;
DROP POLICY IF EXISTS "Allow all operations for saved_projects" ON saved_projects;
DROP POLICY IF EXISTS "Allow all operations on dropdown_settings" ON dropdown_settings;
DROP POLICY IF EXISTS "Allow all operations on otp_verifications" ON otp_verifications;

-- 1. Fix app_users table security
CREATE POLICY "User managers can manage all app_users" ON app_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'user_manager'
    )
  );

CREATE POLICY "Users can view their own app_users record" ON app_users
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT user_id::text FROM sales_agents WHERE user_id::text = auth.uid()::text
      UNION
      SELECT user_id::text FROM developers WHERE user_id::text = auth.uid()::text
    )
  );

-- 2. Fix messages table security
CREATE POLICY "Users can view messages they sent or received" ON messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );

CREATE POLICY "Users can update messages they received" ON messages
  FOR UPDATE USING (
    auth.uid() = receiver_id
  );

-- 3. Fix sales_agents table security (remove overly permissive policy)
CREATE POLICY "User managers can view sales agents contact info" ON sales_agents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'user_manager'
    )
  );

-- 4. Fix chat_prompts table security
CREATE POLICY "Sales agents can manage their own chat prompts" ON chat_prompts
  FOR ALL USING (
    sales_agent_id IN (
      SELECT sales_agent_id FROM sales_agents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "User managers can view all chat prompts" ON chat_prompts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'user_manager'
    )
  );

-- 5. Fix site_visits table security
CREATE POLICY "Sales agents can manage their own site visits" ON site_visits
  FOR ALL USING (
    sales_agent_id IN (
      SELECT sales_agent_id FROM sales_agents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Developers can view site visits for their projects NEW" ON site_visits
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "User managers can manage all site visits" ON site_visits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'user_manager'
    )
  );

-- 6. Fix saved_projects table security
CREATE POLICY "Sales agents can manage their own saved projects" ON saved_projects
  FOR ALL USING (
    sales_agent_id IN (
      SELECT sales_agent_id FROM sales_agents WHERE user_id = auth.uid()
    )
  );

-- 7. Fix dropdown_settings table security
CREATE POLICY "Anyone can view dropdown settings" ON dropdown_settings
  FOR SELECT USING (true);

CREATE POLICY "User managers can manage dropdown settings" ON dropdown_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'user_manager'
    )
  );

-- 8. Fix OTP verifications table security (if it exists)
CREATE POLICY "Users can manage their own OTP verifications" ON otp_verifications
  FOR ALL USING (
    auth.uid() = user_id
  );