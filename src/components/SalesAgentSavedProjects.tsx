import { useEffect, useState } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookmarkCheck, Building, DollarSign, Eye, MapPin, Heart, Search
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';
import { toast } from 'sonner';
import ProjectDetailModal from '@/components/ProjectDetailModal';
import { Input } from '@/components/ui/input';

const SavedProjectsPage = () => {
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [savedProjectIds, setSavedProjectIds] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const { profile } = useSalesAgentAuth();

  const fetchSavedProjects = async () => {
    if (!profile?.sales_agent_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_projects')
        .select('project_id, projects (*)')
        .eq('sales_agent_id', profile.sales_agent_id);

      if (error) throw error;

      const projects = (data || []).map((item: any) => item.projects).filter(Boolean);
      const ids = (data || []).map((item: any) => item.project_id);
      setSavedProjects(projects);
      setSavedProjectIds(ids);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load saved projects');
    } finally {
      setLoading(false);
    }
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

  const filteredProjects = savedProjects.filter(project => {
    const query = searchQuery.toLowerCase();
    return (
      project.project_title?.toLowerCase().includes(query) ||
      project.developer_name?.toLowerCase().includes(query) ||
      project.city?.toLowerCase().includes(query)
    );
  });

  const visibleProjects = filteredProjects.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 animate-fade-in">
                <Heart className="h-8 w-8 text-pink-500 animate-pulse" />
                Your Saved Projects
              </h1>
              <p className="text-gray-600 mt-2">
                {savedProjects.length} saved {savedProjects.length === 1 ? 'project' : 'projects'}
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-1/3">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, developer, or city..."
                className="pl-10 pr-4 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-gray-200 h-80"></div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto animate-fade-in">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No matching projects</h3>
              <p className="text-gray-500">Try adjusting your search or save more projects!</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {visibleProjects.map((project, index) => (
                <Card
                  key={project.project_id}
                  className="relative border-0 rounded-2xl overflow-hidden shadow-xl bg-white hover:shadow-2xl transform transition-all duration-500 hover:scale-105 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-10">
                    {project.listing_type && (
                      <Badge className="text-xs px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white capitalize shadow-lg rounded-full">
                        {project.listing_type}
                      </Badge>
                    )}
                    {project.project_status && (
                      <Badge
                        className={`text-xs px-3 py-1 shadow-lg rounded-full ${
                          project.project_status === 'Ready'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                            : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                        }`}
                      >
                        {project.project_status}
                      </Badge>
                    )}
                  </div>

                  {project.cover_image_url ? (
                    <div className="relative overflow-hidden">
                      <img
                        src={project.cover_image_url}
                        alt={project.project_title}
                        className="w-full h-52 object-cover transition-transform duration-500 hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  ) : (
                    <div className="w-full h-52 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <Building className="h-16 w-16 text-gray-400" />
                    </div>
                  )}

                  <CardHeader className="p-5 pb-3">
                    <CardTitle className="text-lg font-bold text-gray-800 line-clamp-2">
                      {project.project_title}
                    </CardTitle>
                    <p className="text-purple-600 font-semibold">{project.developer_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="text-xs px-3 py-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white capitalize rounded-full">
                        {project.source}
                      </Badge>
                      <Badge variant="outline" className="text-xs px-3 py-1 border-gray-300 text-gray-600 rounded-full">
                        {project.project_type}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 text-sm text-gray-700 px-5 pb-5">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4 text-red-500" />
                      <span className="font-medium">{project.city || 'Unknown Location'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="font-bold text-green-600">
                        AED {project.starting_price_aed?.toLocaleString() || 'Price on request'}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-3 items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProject(project)}
                        className="flex-1 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 rounded-xl transition-all duration-300"
                      >
                        <Eye className="h-4 w-4 mr-2" /> 
                        Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUnsaveProject(project.project_id)}
                        className="rounded-xl transition-all duration-300 transform hover:scale-110 text-pink-600 bg-pink-50 hover:bg-pink-100"
                      >
                        <BookmarkCheck className="h-5 w-5" />
                      </Button>
                    </div>

                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors duration-200 block"
                    >
                      View Original Listing ↗
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>

            {visibleCount < filteredProjects.length && (
              <div className="text-center mt-12">
                <Button 
                  onClick={() => setVisibleCount(prev => prev + 6)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105"
                >
                  Load More Projects
                </Button>
              </div>
            )}
          </>
        )}
      </div>

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
