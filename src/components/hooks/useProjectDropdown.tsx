
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Project {
  id: string;
  project_id: string;
  project_title: string;
  developer_name: string;
  city: string;
  community: string;
  project_type: string;
  project_status: string;
  starting_price_aed: number;
  bedrooms_range: string;
  bathrooms_range: string;
  unit_sizes_range: string;
  description: string;
}

export const useProjectDropdown = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id, 
          project_id, 
          project_title, 
          developer_name, 
          city, 
          community,
          project_type,
          project_status,
          starting_price_aed,
          bedrooms_range,
          bathrooms_range,
          unit_sizes_range,
          description
        `)
        .eq('is_active', true)
        .order('project_title');

      if (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to fetch projects');
        return;
      }

      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('An error occurred while fetching projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    refetch: fetchProjects
  };
};
