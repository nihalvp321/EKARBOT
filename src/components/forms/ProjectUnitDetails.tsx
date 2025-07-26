import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDropdownOptions } from '@/components/hooks/useDropdownOptions';

interface ProjectUnitDetailsProps {
  formData: any;
  handleInputChange: (field: string, value: string | boolean) => void;
}

const ProjectUnitDetails = ({ formData, handleInputChange }: ProjectUnitDetailsProps) => {
  const { options: ownershipOptions, loading: ownershipLoading } = useDropdownOptions('ownership_type');
  const { options: bedroomOptions, loading: bedroomLoading } = useDropdownOptions('bedrooms');
  const { options: bathroomOptions, loading: bathroomLoading } = useDropdownOptions('bathrooms');
  const { options: furnishingOptions, loading: furnishingLoading } = useDropdownOptions('furnishing_status');

  const renderSelect = (
    label: string,
    field: string,
    options: { id: string; value: string }[],
    loading: boolean,
    value: string | undefined
  ) => (
    <div className="space-y-2">
      <Label htmlFor={field} className="text-sm font-medium text-gray-700">{label}</Label>
      <Select
        value={value || ''}
        onValueChange={(val) => handleInputChange(field, val)}
        disabled={loading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? 'Loading...' : `Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent className="bg-white z-50">
          {options.length > 0 ? (
            options.map((option) => (
              <SelectItem key={option.id} value={option.value}>
                {option.value}
              </SelectItem>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">No options found</div>
          )}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="border-b pb-2">
        <h3 className="text-lg font-semibold text-gray-800">Unit Details</h3>
        <p className="text-sm text-gray-600">Specify the unit configurations and features</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Unit Size */}
        <div className="space-y-2">
          <Label htmlFor="unit_sizes_range" className="text-sm font-medium text-gray-700">
            Unit Size Range (sq ft)
          </Label>
          <Input
            id="unit_sizes_range"
            type="text"
            placeholder="e.g., 800-1200 sq ft"
            value={formData.unit_sizes_range || ''}
            onChange={(e) => handleInputChange('unit_sizes_range', e.target.value)}
            className="w-full"
          />
        </div>

        {renderSelect('Bedrooms Range', 'bedrooms_range', [
  { id: 'studio', value: 'Studio' },
  { id: '1', value: '1 Bedroom' },
  { id: '2', value: '2 Bedrooms' },
  { id: '3', value: '3 Bedrooms' },
  { id: '4', value: '4 Bedrooms' },
  { id: '5', value: '5+ Bedrooms' }
], false, formData.bedrooms_range)}

{renderSelect('Bathrooms Range', 'bathrooms_range', [
  { id: '1', value: '1 Bathroom' },
  { id: '2', value: '2 Bathrooms' },
  { id: '3', value: '3 Bathrooms' },
  { id: '4', value: '4+ Bathrooms' }
], false, formData.bathrooms_range)}

{renderSelect('Furnishing Status', 'furnishing_status', [
  { id: 'unfurnished', value: 'Unfurnished' },
  { id: 'semi-furnished', value: 'Semi-Furnished' },
  { id: 'furnished', value: 'Furnished' }
], false, formData.furnishing_status)}

{renderSelect('Ownership Type', 'ownership_type', [
  { id: 'freehold', value: 'Freehold' },
  { id: 'leasehold', value: 'Leasehold' }
], false, formData.ownership_type)}

        {/* Balcony */}
        <div className="flex items-center space-x-2 pt-6">
          <Checkbox
            id="has_balcony"
            checked={formData.has_balcony || false}
            onCheckedChange={(checked) => handleInputChange('has_balcony', !!checked)}
          />
          <Label htmlFor="has_balcony" className="text-sm font-medium text-gray-700">
            Has Balcony
          </Label>
        </div>
      </div>
    </div>
  );
};

export default ProjectUnitDetails;
