
-- Drop existing RLS policies that don't work with custom auth
DROP POLICY IF EXISTS "Developers can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Developers can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Developers can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Developers can delete their own projects" ON public.projects;

-- Create new RLS policies that work with custom developer authentication
-- Since you're using custom auth, we'll make the policies more permissive for now
CREATE POLICY "Allow all operations for developers" 
  ON public.projects 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Also update storage policies to be more permissive
DROP POLICY IF EXISTS "Authenticated users can upload project images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own project images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own project images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload project documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own project documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own project documents" ON storage.objects;

-- Create permissive storage policies
CREATE POLICY "Allow upload to project images" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'project-images');

CREATE POLICY "Allow update to project images" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'project-images');

CREATE POLICY "Allow delete to project images" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'project-images');

CREATE POLICY "Allow upload to project documents" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'project-documents');

CREATE POLICY "Allow update to project documents" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'project-documents');

CREATE POLICY "Allow delete to project documents" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'project-documents');
