
-- Fix RLS policies for site_visits table
DROP POLICY IF EXISTS "Sales agents can view their own site visits" ON public.site_visits;
DROP POLICY IF EXISTS "Sales agents can create site visits" ON public.site_visits;
DROP POLICY IF EXISTS "Sales agents can update their own site visits" ON public.site_visits;

CREATE POLICY "Sales agents can view their own site visits" 
  ON public.site_visits 
  FOR SELECT 
  USING (sales_agent_id IN (
    SELECT sales_agent_id FROM public.sales_agents 
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Sales agents can create site visits" 
  ON public.site_visits 
  FOR INSERT 
  WITH CHECK (sales_agent_id IN (
    SELECT sales_agent_id FROM public.sales_agents 
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Sales agents can update their own site visits" 
  ON public.site_visits 
  FOR UPDATE 
  USING (sales_agent_id IN (
    SELECT sales_agent_id FROM public.sales_agents 
    WHERE user_id = auth.uid() AND is_active = true
  ));

-- Create the sales-agent-profiles storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('sales-agent-profiles', 'sales-agent-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for sales-agent-profiles bucket
CREATE POLICY "Sales agents can upload their profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sales-agent-profiles' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Sales agents can view their profile images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'sales-agent-profiles' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Sales agents can update their profile images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'sales-agent-profiles' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Sales agents can delete their profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'sales-agent-profiles' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
