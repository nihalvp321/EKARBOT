
-- First, let's add the missing columns and remove unwanted ones from the projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS other_documents jsonb DEFAULT '[]'::jsonb;

-- Remove unwanted/unused columns from projects table
ALTER TABLE public.projects 
DROP COLUMN IF EXISTS units,
DROP COLUMN IF EXISTS contact_persons,
DROP COLUMN IF EXISTS legal_documents,
DROP COLUMN IF EXISTS other_documents_old;

-- Ensure all location fields are properly set up
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS google_maps_link text;

-- Add index for better performance on project lookups
CREATE INDEX IF NOT EXISTS idx_projects_developer_id ON public.projects(developer_id);
CREATE INDEX IF NOT EXISTS idx_projects_project_id ON public.projects(project_id);
