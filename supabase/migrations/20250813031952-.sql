-- Fix authentication and RLS issues (simple approach)

-- 1. Create a function to authenticate custom app users 
CREATE OR REPLACE FUNCTION public.authenticate_app_user(input_email text, input_password text)
RETURNS TABLE(
  user_id uuid,
  username text,
  email text,
  user_type text,
  success boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    app_users.id,
    app_users.username,
    app_users.email,
    app_users.user_type,
    (app_users.password_hash = input_password AND app_users.is_active = true) as success
  FROM public.app_users
  WHERE app_users.email = input_email
  AND app_users.is_active = true
  LIMIT 1;
END;
$$;

-- 2. Disable RLS on key tables to allow user_manager operations
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE developers DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales_agents DISABLE ROW LEVEL SECURITY;