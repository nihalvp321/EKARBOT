import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, MapPin, Building, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDeveloperAuth } from '@/hooks/useDeveloperAuth';
import { toast } from 'sonner';
import ProjectDetailModal from './ProjectDetailModal';
import ProjectForm from './ProjectForm';

const supabaseCoverUrl =
  'https://tjfiqnaskbalqcktmpbu.supabase.co/storage/v1/object/public/project-images/cover/';

const MyProjects = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const { profile } = useDeveloperAuth();

  const fetchProjects = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('developer_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to fetch projects');
        return;
      }

      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [profile?.id]);

  const handleDelete = (projectId: string) => {
    setDeletingProjectId(projectId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingProjectId) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('project_id', deletingProjectId);

      if (error) {
        toast.error('Failed to delete project');
      } else {
        toast.success('Project deleted successfully');
        fetchProjects();
      }
    } catch (error) {
      toast.error('Failed to delete project');
    } finally {
      setShowDeleteModal(false);
      setDeletingProjectId(null);
    }
  };

  const handleView = (project: any) => {
    setSelectedProject(project);
    setShowDetailModal(true);
  };

  const handleEdit = (project: any) => {
    setEditingProject(project);
    setShowEditModal(true);
  };

  const handleEditSave = () => {
    setShowEditModal(false);
    setEditingProject(null);
    fetchProjects();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
        <Badge variant="outline" className="text-sm">
          Total: {projects.length} projects
        </Badge>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 text-center mb-4">
              Get started by creating your first project
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const resolvedImageUrl = project.cover_image_url?.startsWith('http')
              ? project.cover_image_url
              : `${supabaseCoverUrl}${project.cover_image_url?.startsWith('/') ? project.cover_image_url.slice(1) : project.cover_image_url}`;

            return (
              <Card
  key={project.project_id}
  className="relative rounded-2xl overflow-hidden border shadow hover:shadow-lg transition-all duration-300"
>
  {/* Cover Image */}
  {project.cover_image_url ? (
    <img
      src={resolvedImageUrl}
      alt={project.project_title}
      className="w-full h-48 object-cover rounded-t-2xl"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = '/default-cover.jpg';
      }}
    />
  ) : (
    <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-t-2xl">
      <Building className="h-12 w-12 text-gray-400" />
    </div>
  )}

  {/* Listing Type & Project Status Badges */}
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

  {/* Card Header */}
  <CardHeader className="p-4 pb-0 space-y-1">
    <CardTitle className="text-base font-bold text-gray-900 break-words leading-snug">
      {project.project_title || 'Untitled Project'}
    </CardTitle>

    {/* Source & Developer Name */}
    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
      {project.source && (
        <Badge className="text-xs px-2 py-1 bg-gray-700 text-white capitalize">
          {project.source}
        </Badge>
      )}
      {project.developer_name && <span>| {project.developer_name}</span>}
    </div>

    <p className="text-sm text-gray-500">{project.project_type || 'Not specified'}</p>
  </CardHeader>

  {/* Card Body */}
  <CardContent className="p-4 space-y-3">
    <div className="flex items-center text-sm text-gray-600">
      <MapPin className="h-4 w-4 mr-2" />
      <span>{project.city || 'Location not specified'}</span>
    </div>

    {project.starting_price_aed && (
      <div className="flex items-center text-sm text-gray-600">
        <DollarSign className="h-4 w-4 mr-2" />
        <span>AED {project.starting_price_aed.toLocaleString()}</span>
      </div>
    )}

    <p className="text-sm text-gray-700 line-clamp-2">
      {project.description || 'No description available'}
    </p>

    {project.url && (
      <p className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
        <a href={project.url} target="_blank" rel="noopener noreferrer" className="underline">
          Full Details
        </a>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </p>
    )}

    {/* Action Buttons */}
    <div className="flex justify-center gap-2 pt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleView(project)}
        className="px-3 py-1.5 text-xs text-blue-600 border-blue-300 hover:bg-blue-50 hover:text-blue-700"
      >
        <Eye className="h-4 w-4 mr-1" />
        View
      </Button>

      {project.source === 'app data' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEdit(project)}
          className="px-3 py-1.5 text-xs text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDelete(project.project_id)}
        className="px-3 py-1.5 text-xs text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  </CardContent>
</Card>

            );
          })}
        </div>
      )}

      {/* Modals */}
      {showDetailModal && selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedProject(null);
          }}
        />
      )}

      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-y-auto w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Edit Project</h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProject(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
              <ProjectForm editProject={editingProject} onSave={handleEditSave} />
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full space-y-4 text-center">
            <h2 className="text-lg font-semibold text-gray-900">Confirm Deletion</h2>
            <p className="text-sm text-gray-600">Are you sure you want to delete this project?</p>
            <div className="flex justify-center gap-4 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingProjectId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProjects;
