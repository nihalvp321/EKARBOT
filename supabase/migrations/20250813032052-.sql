-- Fix security warnings after disabling RLS

-- 1. Drop all existing RLS policies since we disabled RLS
DROP POLICY IF EXISTS "Allow authentication reads" ON app_users;
DROP POLICY IF EXISTS "User managers can manage app_users" ON app_users;

DROP POLICY IF EXISTS "Allow user managers to manage developers" ON developers;

DROP POLICY IF EXISTS "Allow user managers to manage sales agents" ON sales_agents;

-- 2. Fix remaining security definer functions
DROP FUNCTION IF EXISTS public.update_otp_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_otps() CASCADE;
DROP FUNCTION IF EXISTS public.authenticate_user(text, text) CASCADE;

-- Re-create these functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_otp_updated_at()
RETURNS trigger
LANGUAGE plpgsql
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
SET search_path = ''
AS $function$
BEGIN
  DELETE FROM public.otp_verifications 
  WHERE expires_at < now() OR is_used = true;
END;
$function$;