import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectBasicInfoProps {
  formData: any;
  handleInputChange: (field: string, value: string) => void;
}

const ProjectBasicInfo = ({ formData, handleInputChange }: ProjectBasicInfoProps) => {
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
              <SelectContent>
                <SelectItem value="Apartment">Apartment</SelectItem>
                <SelectItem value="Villa">Villa</SelectItem>
                <SelectItem value="Townhouse">Townhouse</SelectItem>
                <SelectItem value="Plot">Plot</SelectItem>
                <SelectItem value="Office">Office</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="listing_type">Listing Type *</Label>
            <Select value={formData.listing_type || ''} onValueChange={(value) => handleInputChange('listing_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select listing type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sale">Sale</SelectItem>
                <SelectItem value="Rent">Rent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="project_status">Completion Status *</Label>
            <Select value={formData.project_status || ''} onValueChange={(value) => handleInputChange('project_status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Off-plan">Off-plan</SelectItem>
                <SelectItem value="Under Construction">Under Construction</SelectItem>
                <SelectItem value="Ready">Ready</SelectItem>
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