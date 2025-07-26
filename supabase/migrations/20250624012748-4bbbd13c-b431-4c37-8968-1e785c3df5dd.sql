
-- Add profile_image_url column to sales_agents table
ALTER TABLE public.sales_agents 
ADD COLUMN profile_image_url text;

-- Create storage bucket for sales agent profile images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sales-agent-profiles', 'sales-agent-profiles', true);

-- Create storage policies for sales agent profile images
CREATE POLICY "Sales agents can upload their own profile images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'sales-agent-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Sales agents can view their own profile images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'sales-agent-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Sales agents can update their own profile images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'sales-agent-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Sales agents can delete their own profile images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'sales-agent-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Make profile images publicly viewable
CREATE POLICY "Public profile images are viewable by everyone" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'sales-agent-profiles');
