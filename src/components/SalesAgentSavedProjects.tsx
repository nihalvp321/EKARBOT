import { useEffect, useState } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookmarkCheck, Building, DollarSign, Eye, MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';
import { toast } from 'sonner';
import ProjectDetailModal from '@/components/ProjectDetailModal';

const SavedProjectsPage = () => {
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [savedProjectIds, setSavedProjectIds] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [visibleCount, setVisibleCount] = useState(3);

  const { profile } = useSalesAgentAuth();

  const fetchSavedProjects = async () => {
    if (!profile?.sales_agent_id) return;

    const { data, error } = await supabase
      .from('saved_projects')
      .select('project_id, projects (*)')
      .eq('sales_agent_id', profile.sales_agent_id);

    if (error) {
      toast.error('Failed to load saved projects');
      return;
    }

    const projects = (data || []).map((item: any) => item.projects).filter(Boolean);
    const ids = (data || []).map((item: any) => item.project_id);
    setSavedProjects(projects);
    setSavedProjectIds(ids);
  };

  const handleUnsaveProject = async (projectId: string) => {
    if (!profile?.sales_agent_id) return;
    try {
      const { error } = await supabase
        .from('saved_projects')
        .delete()
        .eq('sales_agent_id', profile.sales_agent_id)
        .eq('project_id', projectId);

      if (error) throw error;

      setSavedProjectIds(prev => prev.filter(id => id !== projectId));
      setSavedProjects(prev => prev.filter(p => p.project_id !== projectId));
      toast.success('Project removed from saved');
    } catch (err) {
      toast.error('Failed to unsave project');
    }
  };

  useEffect(() => {
    if (profile?.sales_agent_id) {
      fetchSavedProjects();
    }
  }, [profile]);

  const visibleProjects = savedProjects.slice(0, visibleCount);

  return (
    <div className="space-y-6 px-4 md:px-8 pb-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Your Saved Projects</CardTitle>
        </CardHeader>
      </Card>

      {savedProjects.length === 0 ? (
        <p className="text-center text-gray-500">No saved projects yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleProjects.map((project) => {
              const isSaved = savedProjectIds.includes(project.project_id);

              return (
                <Card key={project.project_id} className="relative border rounded-xl overflow-hidden">
                  {project.cover_image_url ? (
                    <img
                      src={project.cover_image_url}
                      alt={project.project_title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center bg-gray-200">
                      <Building className="h-10 w-10 text-gray-500" />
                    </div>
                  )}
<div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 z-10">
    {project.listing_type && (
      <Badge className="text-xs px-2 py-1 bg-blue-600 text-white capitalize shadow">
        {project.listing_type}
      </Badge>
    )}
    {project.project_status && (
      <Badge
        className={`text-xs px-2 py-1 shadow ${
          project.project_status === 'Ready'
            ? 'bg-green-600 text-white'
            : 'bg-yellow-500 text-white'
        }`}
      >
        {project.project_status}
      </Badge>
    )}
  </div>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-semibold">
                      {project.project_title}
                    </CardTitle>
                    <span>{project.developer_name}</span>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <Badge className="text-xs px-2 py-1 bg-gray-700 text-white capitalize">
                        {project.source}
                      </Badge>
                      <span className="text-gray-400">|</span>
                      <span>{project.project_type}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2 text-sm text-gray-700 px-4 pb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{project.city || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>AED {project.starting_price_aed?.toLocaleString()}</span>
                    </div>

                    <div className="flex gap-2 pt-2 items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProject(project)}
                        className="border-neutral-400 text-neutral-700"
                      >
                        <Eye className="h-4 w-4 mr-1" /> View Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUnsaveProject(project.project_id)}
                      >
                        <BookmarkCheck className="h-5 w-5 text-pink-600" />
                      </Button>
                    </div>

                    <a
                      href={project.url}
                      target="_blank"
                      className="text-xs text-blue-600 underline pt-1 block"
                    >
                      Full Details ↗
                    </a>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {visibleCount < savedProjects.length && (
            <div className="text-center mt-6">
              <Button onClick={() => setVisibleCount((prev) => prev + 3)}>
                View More
              </Button>
            </div>
          )}
        </>
      )}

      {selectedProject && (
        <ProjectDetailModal
          open={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          project={selectedProject}
        />
      )}
    </div>
  );
};

export default SavedProjectsPage;
