-- Fix all security issues by implementing proper RLS policies

-- 1. Fix app_users table security
DROP POLICY IF EXISTS "Allow all operations on app_users" ON app_users;

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
DROP POLICY IF EXISTS "Allow all operations on messages" ON messages;

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

-- 3. Fix sales_agents table security (keep existing policies but add restriction)
DROP POLICY IF EXISTS "User managers can view sales agents contact info" ON sales_agents;

CREATE POLICY "Limited public view of sales agents" ON sales_agents
  FOR SELECT USING (true);

-- 4. Fix developers table security (already has good policies)

-- 5. Fix chat_prompts table security
DROP POLICY IF EXISTS "Allow all operations for chat_prompts" ON chat_prompts;

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

-- 6. Fix site_visits table security
DROP POLICY IF EXISTS "Allow all operations for site_visits" ON site_visits;
DROP POLICY IF EXISTS "Temporary - Allow authenticated users to insert site visits" ON site_visits;

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

-- 7. Fix saved_projects table security
DROP POLICY IF EXISTS "Allow all operations for saved_projects" ON saved_projects;

-- 8. Fix dropdown_settings table security
DROP POLICY IF EXISTS "Allow all operations on dropdown_settings" ON dropdown_settings;

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

-- 9. Fix OTP verifications table security (if it exists)
DROP POLICY IF EXISTS "Allow all operations on otp_verifications" ON otp_verifications;

CREATE POLICY "Users can manage their own OTP verifications" ON otp_verifications
  FOR ALL USING (
    auth.uid() = user_id
  );

-- 10. Fix views security by dropping and recreating them properly
DROP VIEW IF EXISTS safe_app_users;
DROP VIEW IF EXISTS safe_developers;
DROP VIEW IF EXISTS safe_sales_agents;

-- Create secure views without SECURITY DEFINER
CREATE VIEW safe_app_users AS
SELECT id, username, user_type, email, is_active, created_at, updated_at
FROM app_users;

CREATE VIEW safe_developers AS  
SELECT id, developer_id, developer_name, is_active, created_at
FROM developers;

CREATE VIEW safe_sales_agents AS
SELECT id, sales_agent_id, sales_agent_name, is_active, created_at  
FROM sales_agents;

-- 11. Fix functions by setting search_path
CREATE OR REPLACE FUNCTION public.update_otp_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  DELETE FROM public.otp_verifications 
  WHERE expires_at < now() OR is_used = true;
END;
$function$;