
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDropdownOptions } from '@/components/hooks/useDropdownOptions';

interface ProjectBasicInfoProps {
  formData: any;
  handleInputChange: (field: string, value: string) => void;
}

const ProjectBasicInfo = ({ formData, handleInputChange }: ProjectBasicInfoProps) => {
  const { options: projectTypeOptions } = useDropdownOptions('project_type');
  const { options: listingTypeOptions } = useDropdownOptions('listing_type');
  const { options: projectStatusOptions } = useDropdownOptions('project_status');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Project Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="project_title">Project Name *</Label>
            <Input
              id="project_title"
              value={formData.project_title || ''}
              onChange={(e) => handleInputChange('project_title', e.target.value)}
              placeholder="Marina Vista"
              required
            />
          </div>
          <div>
            <Label htmlFor="developer_name">Developer Name *</Label>
            <Input
              id="developer_name"
              value={formData.developer_name || ''}
              readOnly
              className="bg-gray-100 cursor-not-allowed"
              placeholder="Developer name"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Project Description</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="A luxury development with sea views..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="project_type">Project Type *</Label>
            <Select value={formData.project_type || ''} onValueChange={(value) => handleInputChange('project_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {projectTypeOptions.map((option) => (
                  <SelectItem key={option.id} value={option.value}>
                    {option.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="listing_type">Listing Type *</Label>
            <Select value={formData.listing_type || ''} onValueChange={(value) => handleInputChange('listing_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select listing type" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {listingTypeOptions.map((option) => (
                  <SelectItem key={option.id} value={option.value}>
                    {option.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="project_status">Completion Status *</Label>
            <Select value={formData.project_status || ''} onValueChange={(value) => handleInputChange('project_status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {projectStatusOptions.map((option) => (
                  <SelectItem key={option.id} value={option.value}>
                    {option.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="handover_date">Handover Date</Label>
            <Input
              id="handover_date"
              type="date"
              value={formData.handover_date || ''}
              onChange={(e) => handleInputChange('handover_date', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectBasicInfo;
