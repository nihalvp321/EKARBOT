-- Fix remaining security issues

-- 1. Drop and recreate views without SECURITY DEFINER
DROP VIEW IF EXISTS safe_app_users CASCADE;
DROP VIEW IF EXISTS safe_developers CASCADE;
DROP VIEW IF EXISTS safe_sales_agents CASCADE;

-- Create simple views without SECURITY DEFINER
CREATE VIEW safe_app_users AS
SELECT id, username, user_type, email, is_active, created_at, updated_at
FROM app_users;

CREATE VIEW safe_developers AS  
SELECT id, developer_id, developer_name, is_active, created_at
FROM developers;

CREATE VIEW safe_sales_agents AS
SELECT id, sales_agent_id, sales_agent_name, is_active, created_at  
FROM sales_agents;

-- 2. Fix functions by setting search_path (update existing functions)
CREATE OR REPLACE FUNCTION public.sync_lead_to_unified()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.sync_activity_to_unified()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.sync_project_to_unified()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.sync_customer_to_unified()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
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
$function$;