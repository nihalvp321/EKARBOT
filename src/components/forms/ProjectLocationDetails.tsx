
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectLocationDetailsProps {
  formData: any;
  handleInputChange: (field: string, value: string) => void;
}

const ProjectLocationDetails = ({ formData, handleInputChange }: ProjectLocationDetailsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Location Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="emirate">Emirate *</Label>
            <Select value={formData.emirate || ''} onValueChange={(value) => handleInputChange('emirate', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select emirate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dubai">Dubai</SelectItem>
                <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                <SelectItem value="Sharjah">Sharjah</SelectItem>
                <SelectItem value="Ajman">Ajman</SelectItem>
                <SelectItem value="Ras Al Khaimah">Ras Al Khaimah</SelectItem>
                <SelectItem value="Fujairah">Fujairah</SelectItem>
                <SelectItem value="Umm Al Quwain">Umm Al Quwain</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="region_area">Region/Area *</Label>
            <Input
              id="region_area"
              value={formData.region_area || ''}
              onChange={(e) => handleInputChange('region_area', e.target.value)}
              placeholder="Downtown Dubai"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="location_description">Location Description *</Label>
          <Textarea
            id="location_description"
            value={formData.location_description || ''}
            onChange={(e) => handleInputChange('location_description', e.target.value)}
            placeholder="Describe the location and nearby landmarks..."
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="street_name">Street Name</Label>
            <Input
              id="street_name"
              value={formData.street_name || ''}
              onChange={(e) => handleInputChange('street_name', e.target.value)}
              placeholder="Sheikh Zayed Road"
            />
          </div>
          <div>
            <Label htmlFor="pincode">Pincode</Label>
            <Input
              id="pincode"
              value={formData.pincode || ''}
              onChange={(e) => handleInputChange('pincode', e.target.value)}
              placeholder="00000"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="address">Full Address</Label>
          <Textarea
            id="address"
            value={formData.address || ''}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Complete address of the project..."
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="google_maps_link">Google Maps Link</Label>
          <Input
            id="google_maps_link"
            value={formData.google_maps_link || ''}
            onChange={(e) => handleInputChange('google_maps_link', e.target.value)}
            placeholder="https://maps.google.com/..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={formData.latitude || ''}
              onChange={(e) => handleInputChange('latitude', e.target.value)}
              placeholder="25.2048"
            />
          </div>
          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={formData.longitude || ''}
              onChange={(e) => handleInputChange('longitude', e.target.value)}
              placeholder="55.2708"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectLocationDetails;
