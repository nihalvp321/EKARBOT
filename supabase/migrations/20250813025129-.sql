-- Fix remaining search path for vector search functions with proper schema references

-- Fix the remaining vector search functions with search_path
CREATE OR REPLACE FUNCTION public.vector_search(input_vector extensions.vector)
RETURNS TABLE(source_id text, source_type text, combined_text text, similarity double precision)
LANGUAGE sql
SET search_path = ''
AS $$
  SELECT source_id, source_type, combined_text,
         1 - (embedding <=> input_vector) AS similarity
  FROM public.unified_rag_data
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> input_vector
  LIMIT 5;
$$;

CREATE OR REPLACE FUNCTION public.vector_search1(embedding extensions.vector)
RETURNS TABLE(source_id text, source_type text, combined_text text, similarity double precision)
LANGUAGE sql
SET search_path = ''
AS $$
  SELECT 
    u.source_id,
    u.source_type,
    u.combined_text,
    1 - (u.embedding <#> embedding)::float AS similarity
  FROM public.unified_rag_data u
  ORDER BY u.embedding <#> embedding
  LIMIT 5
$$;

CREATE OR REPLACE FUNCTION public.vector_search2(embedding_input extensions.vector)
RETURNS TABLE(source_id text, source_type text, combined_text text, similarity double precision)
LANGUAGE sql
SET search_path = ''
AS $$
  SELECT 
    u.source_id,
    u.source_type,
    u.combined_text,
    1 - (u.embedding <#> embedding_input)::float AS similarity
  FROM public.unified_rag_data u
  ORDER BY u.embedding <#> embedding_input
  LIMIT 5
$$;

CREATE OR REPLACE FUNCTION public.get_all_unified_rag_data()
RETURNS TABLE(id uuid, source_id text, source_type text, combined_text text, embedding extensions.vector, created_at timestamp with time zone)
LANGUAGE sql
SET search_path = ''
AS $$
  select * from public.unified_rag_data;
$$;