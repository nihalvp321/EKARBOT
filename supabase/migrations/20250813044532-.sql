-- Fix the sync_project_to_unified trigger function to handle missing table gracefully
CREATE OR REPLACE FUNCTION public.sync_project_to_unified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- On DELETE
  IF TG_OP = 'DELETE' THEN
    -- Check if unified_rag_data table exists before trying to delete
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unified_rag_data' AND table_schema = 'public') THEN
      DELETE FROM public.unified_rag_data
      WHERE source_id = OLD.project_id::TEXT AND source_type = 'project';
    END IF;
    RETURN OLD;
  END IF;

  -- On INSERT or UPDATE
  IF NEW.embedding IS NOT NULL AND NEW.combined_text IS NOT NULL THEN
    -- Check if unified_rag_data table exists before trying to insert
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unified_rag_data' AND table_schema = 'public') THEN
      INSERT INTO public.unified_rag_data (source_id, source_type, combined_text, embedding)
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
  END IF;

  RETURN NEW;
END;
$function$;