
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';

interface Project {
  project_id: string;
  project_title: string;
  developer_name: string;
  emirate: string;
  region_area: string;
  project_type: string;
  description: string;
  similarity_percentage?: number;
  content?: string;
  starting_price_aed?: number;
}

interface ProjectCardProps {
  project: Project;
  onSaveProject: (project: Project) => void;
}

export const ProjectCard = ({ project, onSaveProject }: ProjectCardProps) => {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-gray-800">{project.project_title}</h3>
          <div className="flex items-center space-x-2">
            {project.similarity_percentage && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                {project.similarity_percentage}% match
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSaveProject(project)}
              className="flex items-center space-x-1"
            >
              <Bookmark className="w-4 h-4" />
              <span>Save</span>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
          <p><strong>Developer:</strong> {project.developer_name}</p>
          <p><strong>Type:</strong> {project.project_type}</p>
          <p><strong>Location:</strong> {project.emirate}</p>
          <p><strong>Area:</strong> {project.region_area}</p>
          {project.starting_price_aed && (
            <p><strong>Starting Price:</strong> AED {project.starting_price_aed.toLocaleString()}</p>
          )}
        </div>
        <p className="text-sm text-gray-700 mb-2">{project.description}</p>
        {project.content && (
          <p className="text-xs text-blue-600 italic">AI Analysis: {project.content}</p>
        )}
      </CardContent>
    </Card>
  );
};
