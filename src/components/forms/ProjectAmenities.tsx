import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDropdownOptions } from '@/components/hooks/useDropdownOptions';

interface ProjectAmenitiesProps {
  formData: any;
  handleInputChange: (field: string, value: string | boolean) => void; // allow boolean
  handleArrayChange: (field: string, values: string[]) => void;
}


const ProjectAmenities = ({
  formData,
  handleInputChange,
  handleArrayChange,
}: ProjectAmenitiesProps) => {
  const { options: amenityOptions, loading } = useDropdownOptions('amenities');
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
        <CardTitle className="text-lg font-semibold text-gray-800">
          <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-5 flex items-center">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
            Amenities & Features
          </h4>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Amenities Selection */}
        <div>
          <Label className="text-base font-medium mb-3 block">Select Amenities</Label>
          {loading ? (
            <div className="text-sm text-gray-500">Loading amenities...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {amenityOptions.map((amenity) => (
                <label
                  key={amenity.id}
                  htmlFor={`amenity-${amenity.id}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-300 hover:border-blue-400 cursor-pointer transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                >
                  <Checkbox
                    id={`amenity-${amenity.id}`}
                    checked={selectedAmenities.includes(amenity.value)}
                    onCheckedChange={(checked) =>
                      handleAmenityChange(amenity.value, checked as boolean)
                    }
                    className="h-5 w-5 rounded-md border-gray-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-colors"
                  />
                  <span className="text-sm font-medium text-gray-700">{amenity.value}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Extra Amenities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label
  htmlFor="has_security"
  className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-300 hover:border-blue-400 cursor-pointer transition-all duration-200 bg-white shadow-sm hover:shadow-md"
>
  <Checkbox
    id="has_security"
    checked={!!formData.has_security}
    onCheckedChange={(checked) =>
      handleInputChange('has_security', checked as boolean)
    }
    className="h-5 w-5 rounded-md border-gray-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-colors"
  />
  <span className="text-sm font-medium text-gray-700">24x7 Security</span>
</label>

<label
  htmlFor="has_elevators"
  className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-300 hover:border-blue-400 cursor-pointer transition-all duration-200 bg-white shadow-sm hover:shadow-md"
>
  <Checkbox
    id="has_elevators"
    checked={!!formData.has_elevators}
    onCheckedChange={(checked) =>
      handleInputChange('has_elevators', checked as boolean)
    }
    className="h-5 w-5 rounded-md border-gray-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-colors"
  />
  <span className="text-sm font-medium text-gray-700">Elevators</span>
</label>


        </div>

        {/* Security Details */}
        <div>
          <Label
            htmlFor="security_details"
            className="font-medium text-gray-700 mb-2 block"
          >
            Security Details
          </Label>
          <Textarea
            id="security_details"
            value={formData.security_details || ''}
            onChange={(e) => handleInputChange('security_details', e.target.value)}
            placeholder="24x7 Security, CCTV monitoring, Access control system"
            rows={2}
            className="mt-1 rounded-lg border-gray-300 focus:ring focus:ring-blue-200 focus:border-blue-500"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectAmenities;
