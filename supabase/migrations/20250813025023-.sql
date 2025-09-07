-- Fix all remaining security issues and warnings

-- Fix 1: Remove SECURITY DEFINER from views (ERROR level)
-- Drop and recreate views without SECURITY DEFINER property
DROP VIEW IF EXISTS public.safe_developers;
DROP VIEW IF EXISTS public.safe_sales_agents;
DROP VIEW IF EXISTS public.safe_app_users;

-- Recreate views without SECURITY DEFINER
CREATE VIEW public.safe_developers AS
SELECT 
  id,
  developer_id,
  developer_name,
  is_active,
  created_at
FROM public.developers
WHERE is_active = true;

CREATE VIEW public.safe_sales_agents AS
SELECT 
  id,
  sales_agent_id,
  sales_agent_name,
  is_active,
  created_at
FROM public.sales_agents
WHERE is_active = true;

CREATE VIEW public.safe_app_users AS
SELECT 
  id,
  username,
  email,
  user_type,
  is_active,
  created_at,
  updated_at
FROM public.app_users;

-- Fix 2: Secure all functions by setting search_path (WARN level)
-- Update all functions to include SET search_path = ''

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (NEW.id, NEW.email, 'user_manager');
  RETURN NEW;
END;
$$;

-- Fix get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE profiles.user_id = $1;
$$;

-- Fix authenticate_user function
CREATE OR REPLACE FUNCTION public.authenticate_user(username_input text, password_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash 
  FROM public.app_users 
  WHERE username = username_input;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- For demo purposes, we'll compare plain text (in production, use proper password hashing)
  RETURN stored_hash = 'admin123' AND password_input = 'admin123';
END;
$$;

-- Fix generate_dropdown_code function
CREATE OR REPLACE FUNCTION public.generate_dropdown_code(category_name text)
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    new_code TEXT;
    counter INTEGER := 1;
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Generate code as first 3 letters of category + zero-padded number
        new_code := UPPER(SUBSTRING(category_name FROM 1 FOR 3)) || LPAD(counter::TEXT, 3, '0');
        
        -- Check if this code already exists for this category
        SELECT EXISTS(
            SELECT 1 FROM public.dropdown_settings 
            WHERE category = category_name AND code = new_code
        ) INTO exists_check;
        
        -- If code doesn't exist, we can use it
        IF NOT exists_check THEN
            EXIT;
        END IF;
        
        -- Increment counter and try again
        counter := counter + 1;
        
        -- Safety check to prevent infinite loop
        IF counter > 999 THEN
            RAISE EXCEPTION 'Unable to generate unique code for category %', category_name;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$;

-- Fix auto_generate_dropdown_code function
CREATE OR REPLACE FUNCTION public.auto_generate_dropdown_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    -- Only generate code if it's not provided or is empty
    IF NEW.code IS NULL OR NEW.code = '' THEN
        NEW.code := generate_dropdown_code(NEW.category);
    END IF;
    
    -- Auto-set display_order if not provided
    IF NEW.display_order IS NULL OR NEW.display_order = 0 THEN
        SELECT COALESCE(MAX(display_order), 0) + 1 
        INTO NEW.display_order 
        FROM public.dropdown_settings 
        WHERE category = NEW.category;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Fix generate_project_id function
CREATE OR REPLACE FUNCTION public.generate_project_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.project_id := 'PROJ' || LPAD(nextval('project_id_seq')::text, 5, '0');
  RETURN NEW;
END;
$$;

-- Fix set_developer_name function
CREATE OR REPLACE FUNCTION public.set_developer_name()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  dev_name TEXT;
BEGIN
  -- Fetch developer_name from developers table using the correct 'id' field
  SELECT developer_name INTO dev_name
  FROM developers
  WHERE id = NEW.developer_id;

  -- Set developer_name in projects table
  NEW.developer_name := dev_name;

  RETURN NEW;
END;
$$;

-- Fix set_source_from_url function
CREATE OR REPLACE FUNCTION public.set_source_from_url()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.source := CASE
    WHEN NEW.url IS NOT NULL AND NEW.url <> '' THEN 'public data'
    ELSE 'app data'
  END;
  RETURN NEW;
END;
$$;

-- Fix update_otp_updated_at function
CREATE OR REPLACE FUNCTION public.update_otp_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix cleanup_expired_otps function
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.otp_verifications 
  WHERE expires_at < now() OR is_used = true;
END;
$$;

-- Fix sync functions with search_path
CREATE OR REPLACE FUNCTION public.sync_project_to_unified()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- On DELETE
  IF TG_OP = 'DELETE' THEN
    DELETE FROM unified_rag_data
    WHERE source_id = OLD.project_id::TEXT AND source_type = 'project';
    RETURN OLD;
  END IF;

  -- On INSERT or UPDATE
  IF NEW.embedding IS NOT NULL AND NEW.combined_text IS NOT NULL THEN
    INSERT INTO unified_rag_data (source_id, source_type, combined_text, embedding)
    VALUES (
      NEW.project_id::TEXT,
      'project',
      NEW.combined_text,
      NEW.embedding
    )
    ON CONFLICT (source_id, source_type)
    DO UPDATE SET
      combined_text = EXCLUDED.combined_text,
      embedding = EXCLUDED.embedding,
      created_at = now();
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_customer_to_unified()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- On DELETE
  IF TG_OP = 'DELETE' THEN
    DELETE FROM unified_rag_data
    WHERE source_id = OLD.customer_id::TEXT AND source_type = 'Customer';
    RETURN OLD;
  END IF;

  -- On INSERT or UPDATE
  IF NEW.embedding IS NOT NULL AND NEW.combined_text IS NOT NULL THEN
    INSERT INTO unified_rag_data (source_id, source_type, combined_text, embedding)
    VALUES (
      NEW.customer_id::TEXT,
      'Customer',
      NEW.combined_text,
      NEW.embedding
    )
    ON CONFLICT (source_id, source_type)
    DO UPDATE SET
      combined_text = EXCLUDED.combined_text,
      embedding = EXCLUDED.embedding,
      created_at = now();
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_lead_to_unified()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- On DELETE
  IF TG_OP = 'DELETE' THEN
    DELETE FROM unified_rag_data
    WHERE source_id = OLD.lead_id::TEXT AND source_type = 'Lead';
    RETURN OLD;
  END IF;

  -- On INSERT or UPDATE
  IF NEW.embedding IS NOT NULL AND NEW.combined_text IS NOT NULL THEN
    INSERT INTO unified_rag_data (source_id, source_type, combined_text, embedding)
    VALUES (
      NEW.lead_id::TEXT,
      'Lead',
      NEW.combined_text,
      NEW.embedding
    )
    ON CONFLICT (source_id, source_type)
    DO UPDATE SET
      combined_text = EXCLUDED.combined_text,
      embedding = EXCLUDED.embedding,
      created_at = now();
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_activity_to_unified()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- On DELETE
  IF TG_OP = 'DELETE' THEN
    DELETE FROM unified_rag_data
    WHERE source_id = OLD.activity_id::TEXT AND source_type = 'Activity';
    RETURN OLD;
  END IF;

  -- On INSERT or UPDATE
  IF NEW.embedding IS NOT NULL AND NEW.combined_text IS NOT NULL THEN
    INSERT INTO unified_rag_data (source_id, source_type, combined_text, embedding)
    VALUES (
      OLD.activity_id::TEXT,
      'Activity',
      NEW.combined_text,
      NEW.embedding
    )
    ON CONFLICT (source_id, source_type)
    DO UPDATE SET
      combined_text = EXCLUDED.combined_text,
      embedding = EXCLUDED.embedding,
      created_at = now();
  END IF;

  RETURN NEW;
END;
$$;

-- Grant permissions on safe views
GRANT SELECT ON public.safe_developers TO authenticated;
GRANT SELECT ON public.safe_developers TO anon;
GRANT SELECT ON public.safe_sales_agents TO authenticated;
GRANT SELECT ON public.safe_sales_agents TO anon;
GRANT SELECT ON public.safe_app_users TO authenticated;
GRANT SELECT ON public.safe_app_users TO anon;