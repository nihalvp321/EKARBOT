-- Fix remaining critical security issues from the linter

-- Fix RLS policies for tables without policies
-- Add basic RLS policies for Customer, Activity, Lead, and unified_rag_data tables

-- Customer table policies
CREATE POLICY "Authenticated users can view customers" 
ON public.Customer 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "User managers can manage customers" 
ON public.Customer 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'user_manager'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'user_manager'
  )
);

-- Activity table policies
CREATE POLICY "Authenticated users can view activities" 
ON public.Activity 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "User managers can manage activities" 
ON public.Activity 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'user_manager'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'user_manager'
  )
);

-- Lead table policies
CREATE POLICY "Authenticated users can view leads" 
ON public.Lead 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "User managers can manage leads" 
ON public.Lead 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'user_manager'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'user_manager'
  )
);

-- unified_rag_data table policies
CREATE POLICY "Authenticated users can view RAG data" 
ON public.unified_rag_data 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "User managers can manage RAG data" 
ON public.unified_rag_data 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'user_manager'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'user_manager'
  )
);

-- Enable RLS on tables that don't have it
ALTER TABLE public.Customer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Lead ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_rag_data ENABLE ROW LEVEL SECURITY;