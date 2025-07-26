
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectAmenitiesProps {
  formData: any;
  handleInputChange: (field: string, value: string) => void;
  handleArrayChange: (field: string, values: string[]) => void;
}

const ProjectAmenities = ({ formData, handleInputChange, handleArrayChange }: ProjectAmenitiesProps) => {
  const amenityOptions = [
    'Swimming Pool', 'Gym/Fitness Center', 'Children\'s Play Area', 'BBQ Area',
    'Landscaped Gardens', 'Jogging Track', 'Tennis Court', 'Basketball Court',
    'Sauna', 'Steam Room', 'Spa', 'Business Center', 'Conference Room',
    'Retail Outlets', 'Restaurants', 'Covered Parking', 'Valet Parking',
    'Concierge Service', 'Housekeeping', 'Maintenance Service'
  ];

  const selectedAmenities = formData.amenities || [];

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    const updatedAmenities = checked
      ? [...selectedAmenities, amenity]
      : selectedAmenities.filter((a: string) => a !== amenity);
    handleArrayChange('amenities', updatedAmenities);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Amenities & Features</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-base font-medium mb-3 block">Select Amenities</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {amenityOptions.map((amenity) => (
              <div key={amenity} className="flex items-center space-x-2">
                <Checkbox
                  id={`amenity-${amenity}`}
                  checked={selectedAmenities.includes(amenity)}
                  onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
                />
                <Label htmlFor={`amenity-${amenity}`} className="text-sm">
                  {amenity}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_security"
              checked={formData.has_security || false}
              onCheckedChange={(checked) => handleInputChange('has_security', checked.toString())}
            />
            <Label htmlFor="has_security">24x7 Security</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_elevators"
              checked={formData.has_elevators || false}
              onCheckedChange={(checked) => handleInputChange('has_elevators', checked.toString())}
            />
            <Label htmlFor="has_elevators">Elevators</Label>
          </div>
        </div>

        <div>
          <Label htmlFor="security_details">Security Details</Label>
          <Textarea
            id="security_details"
            value={formData.security_details || ''}
            onChange={(e) => handleInputChange('security_details', e.target.value)}
            placeholder="24x7 Security, CCTV monitoring, Access control system"
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectAmenities;
