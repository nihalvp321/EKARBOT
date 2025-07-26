
-- First, remove orphaned records in saved_projects that reference non-existent projects
DELETE FROM public.saved_projects 
WHERE project_id NOT IN (SELECT project_id FROM public.projects);

-- Now add the foreign key constraint
ALTER TABLE public.saved_projects 
ADD CONSTRAINT fk_saved_projects_project_id 
FOREIGN KEY (project_id) REFERENCES public.projects(project_id);

-- Update the RLS policies to ensure proper access
DROP POLICY IF EXISTS "Sales agents can manage their saved projects" ON public.saved_projects;

CREATE POLICY "Sales agents can manage their saved projects" 
  ON public.saved_projects 
  FOR ALL 
  USING (sales_agent_id IN (
    SELECT sales_agent_id FROM public.sales_agents 
    WHERE user_id = auth.uid()
  ));
