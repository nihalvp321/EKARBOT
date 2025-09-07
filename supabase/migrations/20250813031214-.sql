-- Create comprehensive RLS policies to fix all security issues

-- 1. app_users table policies
CREATE POLICY "User managers can manage all app_users" ON app_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'user_manager'
    )
  );

-- 2. messages table policies  
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

-- 3. chat_prompts table policies
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

-- 4. site_visits table policies
CREATE POLICY "Sales agents can manage their own site visits" ON site_visits
  FOR ALL USING (
    sales_agent_id IN (
      SELECT sales_agent_id FROM sales_agents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Developers can view site visits for their projects" ON site_visits
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

-- 5. saved_projects table policies
CREATE POLICY "Sales agents can manage their own saved projects" ON saved_projects
  FOR ALL USING (
    sales_agent_id IN (
      SELECT sales_agent_id FROM sales_agents WHERE user_id = auth.uid()
    )
  );

-- 6. dropdown_settings table policies
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

-- 7. otp_verifications table policies (if it exists)
CREATE POLICY "Users can manage their own OTP verifications" ON otp_verifications
  FOR ALL USING (
    auth.uid() = user_id
  );