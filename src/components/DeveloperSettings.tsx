// ✅ Updated DeveloperSettings.tsx to support
// - Dynamic dropdowns used in ProjectForm
// - Modifying existing options
// - Adding new dropdown options (including amenities)

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Settings as SettingsIcon,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DropdownOption {
  id: string;
  code: string;
  value: string;
  category: string;
  display_order: number;
}

const categories = [
  { key: 'property_type', label: 'Property Type' },
  { key: 'property_status', label: 'Property Status' },
  { key: 'listing_type', label: 'Listing Type' },
  { key: 'total_bhk', label: 'Total BHK' },
  { key: 'unit_status', label: 'Unit Status' },
  { key: 'ownership_type', label: 'Ownership Type' },
  { key: 'availability_status', label: 'Availability Status' },
  { key: 'furnishing_status', label: 'Furnishing Status' },
  { key: 'amenities', label: 'Amenities' }, // Newly added for managing dynamic amenities
];

const DeveloperSettings = () => {
  const [dropdownOptions, setDropdownOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOption, setNewOption] = useState({ value: '', category: '' });
  const [editingOption, setEditingOption] = useState<DropdownOption | null>(null);
  const [savingStates, setSavingStates] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('dropdown_settings')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) toast.error('Error fetching options');
    else setDropdownOptions(data || []);
    setLoading(false);
  };

  const getOptions = (category: string) => dropdownOptions.filter(opt => opt.category === category);

  const handleAdd = async (category: string) => {
    const value = newOption.value.trim();
    if (!value) return toast.error('Option value required');
    setSavingStates(prev => ({ ...prev, [`add_${category}`]: true }));

    const { error } = await supabase.from('dropdown_settings').insert({ value, category, code: '' });
    if (error) toast.error('Failed to add');
    else toast.success(`Added "${value}" to ${category}`);
    setNewOption({ value: '', category: '' });
    await fetchOptions();
    setSavingStates(prev => ({ ...prev, [`add_${category}`]: false }));
  };

  const handleEdit = async () => {
    if (!editingOption) return;
    setSavingStates(prev => ({ ...prev, [`edit_${editingOption.id}`]: true }));

    const { error } = await supabase
      .from('dropdown_settings')
      .update({ value: editingOption.value })
      .eq('id', editingOption.id);

    if (error) toast.error('Failed to update');
    else toast.success('Updated successfully');
    setEditingOption(null);
    await fetchOptions();
    setSavingStates(prev => ({ ...prev, [`edit_${editingOption.id}`]: false }));
  };

  const handleDelete = async (id: string, value: string) => {
    if (!confirm(`Delete "${value}"?`)) return;
    setSavingStates(prev => ({ ...prev, [`delete_${id}`]: true }));

    const { error } = await supabase
      .from('dropdown_settings')
      .update({ is_active: false })
      .eq('id', id);

    if (error) toast.error('Delete failed');
    else toast.success('Deleted successfully');
    await fetchOptions();
    setSavingStates(prev => ({ ...prev, [`delete_${id}`]: false }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <SettingsIcon className="h-6 w-6 text-gray-700" /> Dropdown Settings
      </h1>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <AlertCircle className="inline h-5 w-5 text-blue-600 mr-2" />
        You can manage dropdown values and amenities here. These changes reflect in project forms.
      </div>

      {categories.map(cat => (
        <Card key={cat.key}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              {cat.label}
              <Badge variant="outline">{getOptions(cat.key).length} items</Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder={`Add new ${cat.label}`}
                value={newOption.category === cat.key ? newOption.value : ''}
                onChange={e => setNewOption({ value: e.target.value, category: cat.key })}
                className="flex-1"
              />
              <Button
                onClick={() => handleAdd(cat.key)}
                disabled={savingStates[`add_${cat.key}`] || !newOption.value.trim()}
              >
                {savingStates[`add_${cat.key}`] ? 'Adding...' : <><Plus className="w-4 h-4 mr-1" />Add</>}
              </Button>
            </div>

            <div className="space-y-2">
              {getOptions(cat.key).map(opt => (
                <div
                  key={opt.id}
                  className="flex items-center gap-2 border p-2 rounded bg-white"
                >
                  <Badge className="text-xs font-mono bg-gray-100">{opt.code}</Badge>
                  {editingOption?.id === opt.id ? (
                    <>
                      <Input
                        value={editingOption.value}
                        onChange={e => setEditingOption({ ...editingOption, value: e.target.value })}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleEdit();
                          else if (e.key === 'Escape') setEditingOption(null);
                        }}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={handleEdit}
                        disabled={savingStates[`edit_${opt.id}`]}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingOption(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm">{opt.value}</span>
                      <Button size="sm" variant="ghost" onClick={() => setEditingOption(opt)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => handleDelete(opt.id, opt.value)}
                        disabled={savingStates[`delete_${opt.id}`]}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DeveloperSettings;