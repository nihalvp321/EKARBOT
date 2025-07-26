
-- Create site_visits table for scheduling and tracking visits
CREATE TABLE public.site_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL,
  project_title TEXT,
  developer_name TEXT,
  buyer_name TEXT NOT NULL,
  sales_agent_id TEXT NOT NULL,
  visit_date DATE NOT NULL,
  visit_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create saved_projects table for sales agents to save projects
CREATE TABLE public.saved_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_agent_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sales_agent_id, project_id)
);

-- Create chat_prompts table to store sales agent conversation history
CREATE TABLE public.chat_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_agent_id TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  response_projects JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_prompts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for site_visits
CREATE POLICY "Sales agents can view their own site visits" 
  ON public.site_visits 
  FOR SELECT 
  USING (sales_agent_id IN (
    SELECT sales_agent_id FROM public.sales_agents 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Sales agents can create site visits" 
  ON public.site_visits 
  FOR INSERT 
  WITH CHECK (sales_agent_id IN (
    SELECT sales_agent_id FROM public.sales_agents 
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Sales agents can update their own site visits" 
  ON public.site_visits 
  FOR UPDATE 
  USING (sales_agent_id IN (
    SELECT sales_agent_id FROM public.sales_agents 
    WHERE user_id = auth.uid()
  ));

-- Allow developers to view site visits for their projects
CREATE POLICY "Developers can view site visits for their projects" 
  ON public.site_visits 
  FOR SELECT 
  USING (project_id IN (
    SELECT project_id FROM public.projects 
    WHERE user_id = auth.uid()
  ));

-- Create RLS policies for saved_projects
CREATE POLICY "Sales agents can manage their saved projects" 
  ON public.saved_projects 
  FOR ALL 
  USING (sales_agent_id IN (
    SELECT sales_agent_id FROM public.sales_agents 
    WHERE user_id = auth.uid()
  ));

-- Create RLS policies for chat_prompts
CREATE POLICY "Sales agents can manage their chat prompts" 
  ON public.chat_prompts 
  FOR ALL 
  USING (sales_agent_id IN (
    SELECT sales_agent_id FROM public.sales_agents 
    WHERE user_id = auth.uid()
  ));

-- Add indexes for better performance
CREATE INDEX idx_site_visits_sales_agent ON public.site_visits(sales_agent_id);
CREATE INDEX idx_site_visits_project ON public.site_visits(project_id);
CREATE INDEX idx_saved_projects_sales_agent ON public.saved_projects(sales_agent_id);
CREATE INDEX idx_chat_prompts_sales_agent ON public.chat_prompts(sales_agent_id);
