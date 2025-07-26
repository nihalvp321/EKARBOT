
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Unit {
  id: string;
  unit_code: string;
  total_bhk: string;
  min_price: number;
  max_price: number;
  status: string;
}

interface UnitDetailsFormProps {
  units: Unit[];
  onUnitsChange: (units: Unit[]) => void;
  projectType?: string;
}

interface DropdownOption {
  id: string;
  code: string;
  value: string;
  category: string;
}

const UnitDetailsForm = ({ units, onUnitsChange, projectType }: UnitDetailsFormProps) => {
  const [newUnit, setNewUnit] = useState<Partial<Unit>>({
    unit_code: '',
    total_bhk: '',
    min_price: 0,
    max_price: 0,
    status: 'Available'
  });

  const [bhkOptions, setBhkOptions] = useState<DropdownOption[]>([]);
  const statusOptions = ['Available', 'Booked', 'Sold'];

  useEffect(() => {
    fetchBhkOptions();
  }, []);

  const fetchBhkOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('dropdown_settings')
        .select('*')
        .eq('category', 'total_bhk')
        .eq('is_active', true)
        .order('value', { ascending: true });

      if (error) {
        console.error('Error fetching BHK options:', error);
        toast.error('Failed to fetch BHK options');
        return;
      }

      setBhkOptions(data || []);
    } catch (error) {
      console.error('Error fetching BHK options:', error);
      toast.error('An error occurred while fetching BHK options');
    }
  };

  // Generate unique unit code
  const generateUnitCode = () => {
    const prefix = 'UC';
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
  };

  useEffect(() => {
    if (!newUnit.unit_code) {
      setNewUnit(prev => ({ ...prev, unit_code: generateUnitCode() }));
    }
  }, []);

  const handleAddUnit = () => {
    if (!newUnit.total_bhk || !newUnit.min_price || !newUnit.max_price) {
      return;
    }

    const unit: Unit = {
      id: Date.now().toString(),
      unit_code: newUnit.unit_code || generateUnitCode(),
      total_bhk: newUnit.total_bhk,
      min_price: Number(newUnit.min_price),
      max_price: Number(newUnit.max_price),
      status: newUnit.status || 'Available'
    };

    onUnitsChange([...units, unit]);
    setNewUnit({
      unit_code: generateUnitCode(),
      total_bhk: '',
      min_price: 0,
      max_price: 0,
      status: 'Available'
    });
  };

  const handleRemoveUnit = (unitId: string) => {
    onUnitsChange(units.filter(unit => unit.id !== unitId));
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `${(price / 10000000).toFixed(1)}Cr`;
    } else if (price >= 100000) {
      return `${(price / 100000).toFixed(1)}L`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}K`;
    }
    return price.toString();
  };

  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value.replace(/[^\d.]/g, ''));
    if (isNaN(numValue)) return '';
    return numValue.toLocaleString('en-IN');
  };

  const parseCurrency = (value: string) => {
    return parseFloat(value.replace(/[^\d.]/g, '')) || 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Unit Details
          {projectType && (
            <Badge variant="outline" className="text-sm">
              Project Type: {projectType}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Unit Form */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium mb-4">Add New Unit</h4>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <Label>Unit Code</Label>
              <Input
                value={newUnit.unit_code}
                onChange={(e) => setNewUnit({ ...newUnit, unit_code: e.target.value })}
                placeholder="Auto-generated"
                className="bg-gray-100"
                readOnly
              />
            </div>
            
            <div>
              <Label>Total BHK</Label>
              <Select
                value={newUnit.total_bhk}
                onValueChange={(value) => setNewUnit({ ...newUnit, total_bhk: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select BHK" />
                </SelectTrigger>
                <SelectContent>
                  {bhkOptions.map((bhk) => (
                    <SelectItem key={bhk.id} value={bhk.value}>
                      {bhk.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Min Price (AED)</Label>
              <Input
                type="text"
                value={newUnit.min_price ? formatCurrency(newUnit.min_price.toString()) : ''}
                onChange={(e) => setNewUnit({ 
                  ...newUnit, 
                  min_price: parseCurrency(e.target.value) 
                })}
                placeholder="e.g., 500,000"
              />
            </div>

            <div>
              <Label>Max Price (AED)</Label>
              <Input
                type="text"
                value={newUnit.max_price ? formatCurrency(newUnit.max_price.toString()) : ''}
                onChange={(e) => setNewUnit({ 
                  ...newUnit, 
                  max_price: parseCurrency(e.target.value) 
                })}
                placeholder="e.g., 800,000"
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={newUnit.status}
                onValueChange={(value) => setNewUnit({ ...newUnit, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleAddUnit}
                style={{ backgroundColor: '#455560' }}
                className="text-white hover:opacity-90 w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Unit
              </Button>
            </div>
          </div>
        </div>

        {/* Units List */}
        <div className="space-y-4">
          <h4 className="font-medium">Units ({units.length})</h4>
          {units.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No units added yet. Add your first unit above.
            </div>
          ) : (
            <div className="space-y-3">
              {units.map((unit) => (
                <div key={unit.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline" className="font-mono">
                        {unit.unit_code}
                      </Badge>
                      <span className="font-medium">{unit.total_bhk}</span>
                      <span className="text-green-600 font-semibold">
                        AED {formatPrice(unit.min_price)} - {formatPrice(unit.max_price)}
                      </span>
                      <Badge 
                        className={`${
                          unit.status === 'Available' 
                            ? 'bg-green-100 text-green-800 border-green-300' 
                            : unit.status === 'Booked'
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                            : 'bg-red-100 text-red-800 border-red-300'
                        } border`}
                      >
                        {unit.status}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUnit(unit.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UnitDetailsForm;
