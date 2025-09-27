import { useEffect, useState } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BookmarkX, Building, DollarSign, Eye, MapPin, Search, Grid3X3, List, Filter,
  BookmarkCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';
import { toast } from 'sonner';
import ProjectDetailModal from '@/components/ProjectDetailModal';
import { AnimatePresence, motion } from 'framer-motion';

const SavedProjectsPage = () => {
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [savedProjectIds, setSavedProjectIds] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_saved');
  const [filterBy, setFilterBy] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { profile } = useSalesAgentAuth();

  const fetchSavedProjects = async () => {
    if (!profile?.sales_agent_id) return;

    const { data, error } = await supabase
      .from('saved_projects')
      .select(`
        project_id, 
        saved_at,
        projects (*)
      `)
      .eq('sales_agent_id', profile.sales_agent_id)
      .order('saved_at', { ascending: false });

    if (error) {
      toast.error('Failed to load saved projects');
      return;
    }

    const projectsWithSaveDate = (data || []).map((item: any) => ({
      ...item.projects,
      saved_at: item.saved_at
    })).filter(Boolean);

    const ids = (data || []).map((item: any) => item.project_id);
    setSavedProjects(projectsWithSaveDate);
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

  const filteredProjects = savedProjects.filter(project => {
    const matchesSearch = !searchQuery ||
      project.project_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.developer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.community?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterBy === 'all' ||
      project.project_type?.toLowerCase() === filterBy ||
      project.project_subtype?.toLowerCase() === filterBy ||
      project.project_status?.toLowerCase() === filterBy ||
      (filterBy === 'rent' 
        ? (project.listing_type?.toLowerCase() === 'rent' || project.listing_type?.toLowerCase() === 'yearly')
        : project.listing_type?.toLowerCase() === filterBy);

    return matchesSearch && matchesFilter;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'date_saved':
        return new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime();
      case 'price_low':
        return (a.starting_price_aed || 0) - (b.starting_price_aed || 0);
      case 'price_high':
        return (b.starting_price_aed || 0) - (a.starting_price_aed || 0);
      case 'name':
        return (a.project_title || '').localeCompare(b.project_title || '');
      case 'location':
        return (a.city || '').localeCompare(b.city || '');
      default:
        return 0;
    }
  });

  const visibleProjects = sortedProjects.slice(0, visibleCount);

  return (
     <AnimatePresence>
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    transition={{ duration: 0.5 }}
    className="max-w-[1300px] mx-auto px-4 md:px-6 pb-10 space-y-4"
  >
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex flex-col items-start gap-2 border-b border-slate-200 pb-3">
          <br></br><h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-800">
            Saved Projects
          </h1>
          <Badge
            variant="secondary"
            className="rounded-full px-3 py-1 text-xs md:text-sm font-medium bg-slate-100 text-slate-700"
          >
            {savedProjects.length} {savedProjects.length === 1 ? 'Project' : 'Projects'}
          </Badge>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm md:text-base"
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-[130px] text-xs md:text-sm">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="off-plan">Off-plan</SelectItem>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="rent">Rent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px] text-xs md:text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_saved">Date Saved</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="location">Location</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex border rounded-md overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none px-2"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none px-2"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {savedProjects.length === 0 ? (
        <Card className="text-center py-10 shadow-sm rounded-lg">
          <CardContent className="space-y-3">
            <BookmarkX className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-base font-medium">No saved projects yet</h3>
              <p className="text-sm text-muted-foreground">Start saving projects to easily access them later.</p>
            </div>
            <Button size="sm" className="mt-3">Browse Projects</Button>
          </CardContent>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card className="text-center py-8 shadow-sm rounded-lg">
          <CardContent>
            <Search className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-base font-medium mb-1">No projects found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <AnimatePresence>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4' : 'flex flex-col gap-3'}>
              {visibleProjects.map((project) => (
                <motion.div
                  key={project.project_id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`relative rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 flex ${viewMode === 'list' ? 'flex-col sm:flex-row' : 'flex-col'}`}>
                    {/* Image */}
                    <div className={`relative ${viewMode === 'list' ? 'w-full sm:w-1/3 h-48 sm:h-auto' : 'w-full h-48'}`}>
                      {project.cover_image_url ? (
                        <img
                          src={project.cover_image_url}
                          alt={project.project_title || 'Unspecified'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <Building className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5 capitalize shadow">{project.listing_type || 'Unspecified'}</Badge>
                        <Badge variant={project.project_status === 'Ready' ? 'default' : 'secondary'} className="text-xs px-1.5 py-0.5 shadow">{project.project_status || 'Unspecified'}</Badge>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between p-3 space-y-2">
                      <div>
                        <h3 className="font-semibold text-sm md:text-base text-slate-800 truncate">{project.project_title || 'Unspecified'}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground">{project.developer_name || 'Unspecified'}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs md:text-sm text-gray-600">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-red-500" />{project.city || 'Unspecified'}</span>
                          <span className="flex items-center gap-1"><DollarSign className="h-3 w-3 text-green-500" />{project.starting_price_aed ? `AED ${project.starting_price_aed.toLocaleString()}` : 'Unspecified'}</span>
                          <span>{project.bedrooms_range ? `${project.bedrooms_range} ${parseInt(project.bedrooms_range) > 1 ? 'bedrooms' : 'bedroom'}` : 'Unspecified'}</span>
                          <span>{project.bathrooms_range ? `${project.bathrooms_range} ${parseInt(project.bathrooms_range) > 1 ? 'bathrooms' : 'bathroom'}` : 'Unspecified'}</span>
                          <Badge variant="outline" className="px-2 py-0.5 text-xs">{project.project_subtype || 'Unspecified'}</Badge>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm" className="text-xs flex-1" onClick={() => setSelectedProject(project)}>
                          <Eye className="h-3 w-3 mr-1" /> View
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleUnsaveProject(project.project_id)} className="hover:text-destructive">
                          <BookmarkCheck className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {visibleCount < sortedProjects.length && (
            <div className="text-center mt-4">
              <Button size="sm" onClick={() => setVisibleCount(prev => prev + 6)} className="text-xs">
                View More ({sortedProjects.length - visibleCount} remaining)
              </Button>
            </div>
          )}

          <div className="text-center text-xs md:text-sm text-muted-foreground">
            Showing {visibleProjects.length} of {sortedProjects.length} projects
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        </>
      )}

      {selectedProject && (
        <ProjectDetailModal
          open={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          project={selectedProject}
        />
      )}
    </motion.div>
  </AnimatePresence>
  );
};

export default SavedProjectsPage;
