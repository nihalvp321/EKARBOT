import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Save, X, Trash2 } from 'lucide-react';
import { useDropdownOptions } from '@/components/hooks/useDropdownOptions';

interface Unit {
  id?: string;
  unit_code: string;
  unit_size_range: string;
  bedrooms_range: string;
  bathrooms_range: string;
  furnishing_status: string;
  ownership_type: string;
  has_balcony: boolean;
  starting_price_aed: number;
  price_per_sqft: number;
  service_charges: number;
  payment_plan: string;
  amenities?: string[];
}

interface EditableUnitCardProps {
  unit: Unit;
  index: number;
  onUpdate: (index: number, updatedUnit: Unit) => void;
  onRemove: (index: number) => void;
}

const EditableUnitCard = ({ unit, index, onUpdate, onRemove }: EditableUnitCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUnit, setEditedUnit] = useState<Unit>(unit);

  const { options: bedroomOptions } = useDropdownOptions('bedroom_range');
  const { options: bathroomOptions } = useDropdownOptions('bathroom_range');


  const furnishingOptions = [
    { value: 'Unfurnished', label: 'Unfurnished' },
    { value: 'Semi-Furnished', label: 'Semi-Furnished' },
    { value: 'Furnished', label: 'Furnished' }
  ];

  const ownershipOptions = [
    { value: 'Freehold', label: 'Freehold' },
    { value: 'Leasehold', label: 'Leasehold' }
  ];

  const handleSave = () => {
    onUpdate(index, editedUnit);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUnit(unit);
    setIsEditing(false);
  };

  const formatPrice = (price: number): string => {
    if (price >= 10000000) return `${(price / 10000000).toFixed(1)}Cr`;
    if (price >= 100000) return `${(price / 100000).toFixed(1)}L`;
    if (price >= 1000) return `${(price / 1000).toFixed(1)}K`;
    return price.toString();
  };

  if (isEditing) {
    return (
      <Card className="border-blue-200">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-gray-800">Edit Unit: {editedUnit.unit_code}</h4>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Unit Code</Label>
                <Input
                  value={editedUnit.unit_code}
                  onChange={(e) => setEditedUnit(prev => ({ ...prev, unit_code: e.target.value }))}
                />
              </div>
              
              <div>
                <Label>Unit Size Range</Label>
                <Input
                  value={editedUnit.unit_size_range}
                  onChange={(e) => setEditedUnit(prev => ({ ...prev, unit_size_range: e.target.value }))}
                  placeholder="e.g., 800-1200 sq ft"
                />
              </div>

              <div>
                <Label>Bedrooms</Label>
                <Select value={editedUnit.bedrooms_range} onValueChange={(value) => setEditedUnit(prev => ({ ...prev, bedrooms_range: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bedrooms" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {bedroomOptions.map((option) => (
                      <SelectItem key={option.id || option.value} value={option.value}>
                        {option.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Bathrooms</Label>
                <Select value={editedUnit.bathrooms_range} onValueChange={(value) => setEditedUnit(prev => ({ ...prev, bathrooms_range: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bathrooms" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {bathroomOptions.map((option) => (
                      <SelectItem key={option.id || option.value} value={option.value}>
                        {option.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Furnishing Status</Label>
                <Select value={editedUnit.furnishing_status} onValueChange={(value) => setEditedUnit(prev => ({ ...prev, furnishing_status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select furnishing" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {furnishingOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ownership Type</Label>
                <Select value={editedUnit.ownership_type} onValueChange={(value) => setEditedUnit(prev => ({ ...prev, ownership_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ownership" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {ownershipOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Starting Price (AED)</Label>
                <Input
                  type="number"
                  value={editedUnit.starting_price_aed || ''}
                  onChange={(e) => setEditedUnit(prev => ({ ...prev, starting_price_aed: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <Label>Price per Sq Ft (AED)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editedUnit.price_per_sqft || ''}
                  onChange={(e) => setEditedUnit(prev => ({ ...prev, price_per_sqft: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <Label>Service Charges</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editedUnit.service_charges || ''}
                  onChange={(e) => setEditedUnit(prev => ({ ...prev, service_charges: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={editedUnit.has_balcony}
                onCheckedChange={(checked) => setEditedUnit(prev => ({ ...prev, has_balcony: !!checked }))}
              />
              <Label>Has Balcony</Label>
            </div>

            <div>
              <Label>Payment Plan</Label>
              <Textarea
                value={editedUnit.payment_plan}
                onChange={(e) => setEditedUnit(prev => ({ ...prev, payment_plan: e.target.value }))}
                rows={2}
              />
            </div>

          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-semibold text-gray-800">{unit.unit_code}</h4>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <div>
          <span className="font-medium text-gray-600">Bedrooms:</span>
          <p>{unit.bedrooms_range || 'Not specified'}</p>
        </div>
        <div>
          <span className="font-medium text-gray-600">Bathrooms:</span>
          <p>{unit.bathrooms_range || 'Not specified'}</p>
        </div>
        <div>
          <span className="font-medium text-gray-600">Size:</span>
          <p>{unit.unit_size_range || 'Not specified'}</p>
        </div>
        <div>
          <span className="font-medium text-gray-600">Starting Price:</span>
          <p className="text-blue-600 font-semibold">
            AED {unit.starting_price_aed ? formatPrice(unit.starting_price_aed) : '0'}
          </p>
        </div>
        <div>
          <span className="font-medium text-gray-600">Furnishing:</span>
          <p>{unit.furnishing_status || 'Not specified'}</p>
        </div>
        <div>
          <span className="font-medium text-gray-600">Ownership:</span>
          <p>{unit.ownership_type || 'Not specified'}</p>
        </div>
        <div>
          <span className="font-medium text-gray-600">Balcony:</span>
          <p>{unit.has_balcony ? 'Yes' : 'No'}</p>
        </div>
        <div>
          <span className="font-medium text-gray-600">Price/sqft:</span>
          <p>AED {unit.price_per_sqft || '0'}</p>
        </div>
      </div>
      
      {unit.payment_plan && (
        <div className="mt-3">
          <span className="font-medium text-gray-600">Payment Plan:</span>
          <p className="text-sm">{unit.payment_plan}</p>
        </div>
      )}
      
      {unit.amenities && unit.amenities.length > 0 && (
        <div className="mt-3">
          <span className="font-medium text-gray-600">Amenities:</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {unit.amenities.map((amenity, idx) => (
              <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                {amenity}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableUnitCard;