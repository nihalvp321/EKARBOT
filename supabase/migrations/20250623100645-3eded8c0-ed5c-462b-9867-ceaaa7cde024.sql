
-- Create projects table (renamed from properties)
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL UNIQUE,
  developer_id UUID REFERENCES public.developers(id) NOT NULL,
  user_id UUID REFERENCES public.app_users(id) NOT NULL,
  
  -- Basic Info
  project_title TEXT,
  project_type TEXT,
  listing_type TEXT,
  project_status TEXT,
  handover_date DATE,
  description TEXT,
  
  -- Unit Details
  units JSONB DEFAULT '[]'::jsonb, -- Array of unit objects
  
  -- Location
  emirate TEXT,
  region_area TEXT,
  street_name TEXT,
  location_description TEXT,
  pincode TEXT,
  
  -- Media
  cover_image_url TEXT,
  gallery_images JSONB DEFAULT '[]'::jsonb, -- Array of image URLs
  brochure_url TEXT,
  other_documents JSONB DEFAULT '[]'::jsonb, -- Array of document URLs
  
  -- Amenities
  amenities JSONB DEFAULT '[]'::jsonb, -- Array of amenity strings
  
  -- Legal & Developer info
  rera_approval_id TEXT,
  ownership_type TEXT,
  developer_name TEXT,
  legal_documents JSONB DEFAULT '[]'::jsonb, -- Array of legal document URLs
  
  -- Contact info
  contact_persons JSONB DEFAULT '[]'::jsonb, -- Array of contact objects
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('developer-files', 'developer-files', true),
  ('project-images', 'project-images', true),
  ('project-documents', 'project-documents', true);

-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policies for projects table
CREATE POLICY "Developers can view their own projects" 
  ON public.projects 
  FOR SELECT 
  USING (user_id = auth.uid() OR developer_id IN (
    SELECT id FROM public.developers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Developers can create their own projects" 
  ON public.projects 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid() OR developer_id IN (
    SELECT id FROM public.developers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Developers can update their own projects" 
  ON public.projects 
  FOR UPDATE 
  USING (user_id = auth.uid() OR developer_id IN (
    SELECT id FROM public.developers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Developers can delete their own projects" 
  ON public.projects 
  FOR DELETE 
  USING (user_id = auth.uid() OR developer_id IN (
    SELECT id FROM public.developers WHERE user_id = auth.uid()
  ));

-- Create storage policies for developer-files bucket
CREATE POLICY "Developers can upload their own files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'developer-files');

CREATE POLICY "Anyone can view developer files" ON storage.objects
  FOR SELECT USING (bucket_id = 'developer-files');

CREATE POLICY "Developers can update their own files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'developer-files');

CREATE POLICY "Developers can delete their own files" ON storage.objects
  FOR DELETE USING (bucket_id = 'developer-files');

-- Create storage policies for project-images bucket
CREATE POLICY "Developers can upload project images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'project-images');

CREATE POLICY "Anyone can view project images" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-images');

CREATE POLICY "Developers can update project images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'project-images');

CREATE POLICY "Developers can delete project images" ON storage.objects
  FOR DELETE USING (bucket_id = 'project-images');

-- Create storage policies for project-documents bucket
CREATE POLICY "Developers can upload project documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'project-documents');

CREATE POLICY "Anyone can view project documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-documents');

CREATE POLICY "Developers can update project documents" ON storage.objects
  FOR UPDATE USING (bucket_id = 'project-documents');

CREATE POLICY "Developers can delete project documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'project-documents');

-- Add constraint to make developer_id non-changeable after creation
ALTER TABLE public.developers ADD CONSTRAINT developers_id_immutable 
  CHECK (developer_id IS NOT NULL);

-- Create function to generate unique project ID
CREATE OR REPLACE FUNCTION generate_project_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    new_id := 'PROJ' || LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 100000)::TEXT, 5, '0');
    SELECT EXISTS(SELECT 1 FROM projects WHERE project_id = new_id) INTO exists;
    IF NOT exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;
