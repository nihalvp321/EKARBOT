-- Drop all existing policies to clean slate
-- app_users table
DROP POLICY IF EXISTS "User managers can manage all app_users" ON app_users;
DROP POLICY IF EXISTS "Users can view their own app_users record" ON app_users;

-- messages table  
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update messages they received" ON messages;

-- sales_agents table
DROP POLICY IF EXISTS "Limited public view of sales agents" ON sales_agents;

-- chat_prompts table
DROP POLICY IF EXISTS "Sales agents can manage their own chat prompts" ON chat_prompts;
DROP POLICY IF EXISTS "User managers can view all chat prompts" ON chat_prompts;

-- site_visits table
DROP POLICY IF EXISTS "Sales agents can manage their own site visits" ON site_visits;
DROP POLICY IF EXISTS "Developers can view site visits for their projects NEW" ON site_visits;
DROP POLICY IF EXISTS "User managers can manage all site visits" ON site_visits;

-- saved_projects table
DROP POLICY IF EXISTS "Sales agents can manage their own saved projects" ON saved_projects;

-- dropdown_settings table
DROP POLICY IF EXISTS "Anyone can view dropdown settings" ON dropdown_settings;
DROP POLICY IF EXISTS "User managers can manage dropdown settings" ON dropdown_settings;

-- otp_verifications table
DROP POLICY IF EXISTS "Users can manage their own OTP verifications" ON otp_verifications;