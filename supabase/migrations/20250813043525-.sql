-- Fix the set_developer_name function to properly reference the public schema
CREATE OR REPLACE FUNCTION public.set_developer_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  dev_name TEXT;
BEGIN
  -- Fetch developer_name from developers table using the correct 'id' field
  SELECT developer_name INTO dev_name
  FROM public.developers
  WHERE id = NEW.developer_id;

  -- Set developer_name in projects table
  NEW.developer_name := dev_name;

  RETURN NEW;
END;
$function$;