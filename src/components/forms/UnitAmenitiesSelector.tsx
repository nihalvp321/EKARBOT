import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useDropdownOptions } from '@/components/hooks/useDropdownOptions';

interface UnitAmenitiesSelectorProps {
  selectedAmenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
}

const UnitAmenitiesSelector = ({ selectedAmenities, onAmenitiesChange }: UnitAmenitiesSelectorProps) => {
  const { options: amenityOptions, loading } = useDropdownOptions('amenities');
  const normalizedSelected = React.useMemo(() => {
    console.log('UnitAmenitiesSelector - selectedAmenities input:', selectedAmenities);
    const arr = (selectedAmenities as unknown as any[]) || [];
    const normalized = arr
      .map((item: any) => typeof item === 'string' ? item : (item?.value ?? item?.code ?? ''))
      .filter(Boolean);
    console.log('UnitAmenitiesSelector - normalized selected:', normalized);
    return normalized;
  }, [selectedAmenities]);

  const handleAmenityChange = (amenity: { value: string; code: string }, checked: boolean) => {
    const { value, code } = amenity;
    let updated = [...normalizedSelected];

    if (checked) {
      if (!updated.includes(value)) {
        updated = updated.includes(code)
          ? updated.map(a => (a === code ? value : a))
          : [...updated, value];
      }
    } else {
      updated = updated.filter(a => a !== value && a !== code);
    }

    onAmenitiesChange(updated);
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Select Unit Amenities</Label>
      {loading ? (
        <div className="text-sm text-gray-500">Loading amenities...</div>
      ) : (
        <div>
          <div className="text-sm text-gray-600 mb-2">Available options: {amenityOptions.length}</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {amenityOptions.map((amenity) => (
              <div key={amenity.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`unit-amenity-${amenity.id}`}
                  checked={normalizedSelected.includes(amenity.value) || normalizedSelected.includes(amenity.code)}
                  onCheckedChange={(checked) => handleAmenityChange({ value: amenity.value, code: amenity.code }, checked as boolean)}
                />
                <Label htmlFor={`unit-amenity-${amenity.id}`} className="text-sm cursor-pointer">
                  {amenity.value}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}
      {selectedAmenities.length > 0 && (
        <div className="mt-3">
          <Label className="text-sm font-medium text-gray-600">Selected Amenities:</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {normalizedSelected.map((a, index) => {
              const match = amenityOptions.find(opt => opt.value === a || opt.code === a);
              const label = match ? match.value : a;
              return (
                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitAmenitiesSelector;