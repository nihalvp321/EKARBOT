
-- Add is_active column to projects table
ALTER TABLE public.projects 
ADD COLUMN is_active boolean NOT NULL DEFAULT true;
