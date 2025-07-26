import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Edit, Trash2 } from 'lucide-react';

interface DropdownSetting {
  id: string;
  category: string;
  code: string;
  value: string;
  description: string;
  is_active: boolean;
  display_order: number;
}

const ProjectDropdownSettings = () => {
  const [settings, setSettings] = useState<DropdownSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newItemCategory, setNewItemCategory] = useState('');
  const [formData, setFormData] = useState<Partial<DropdownSetting>>({});

  const categories = [
    'project_type',
    'project_status',
    'listing_type',
    'ownership_type',
    'emirate',
    'region_area'
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('dropdown_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) throw error;

      const settingsWithDefaults = (data || []).map(item => ({
        ...item,
        description: item.description || '',
        is_active: item.is_active ?? true
      }));

      setSettings(settingsWithDefaults);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: DropdownSetting) => {
    setEditingItem(item.id);
    setFormData(item);
  };

  const handleCancel = () => {
    setEditingItem(null);
    setFormData({});
  };

  const handleSoftDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const { error } = await supabase
        .from('dropdown_settings')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast.success('Item deleted');
      await fetchSettings();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete');
    }
  };

  const handleAddNewItem = async (category: string) => {
    if (!newItemCategory.trim()) {
      toast.error('Enter value');
      return;
    }

    const newItem = {
      category,
      code: '',
      value: newItemCategory.trim(),
      description: '',
      display_order: 0,
      is_active: true
    };

    try {
      const { error } = await supabase.from('dropdown_settings').insert([newItem]);

      if (error) throw error;

      toast.success('Item added');
      setNewItemCategory('');
      await fetchSettings();
    } catch (error) {
      console.error(error);
      toast.error('Failed to add item');
    }
  };

  const handleSave = async () => {
    if (!formData.category || !formData.value) {
      toast.error('Category and value are required');
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        code: formData.code || '',
        description: formData.description || '',
        display_order: formData.display_order || 0,
        is_active: formData.is_active ?? true
      };

      if (editingItem) {
        await supabase.from('dropdown_settings').update(dataToSave).eq('id', editingItem);
        toast.success('Item updated');
      }

      setEditingItem(null);
      setFormData({});
      await fetchSettings();
    } catch (error) {
      console.error(error);
      toast.error('Save failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Project Dropdown Settings</h1>

      {categories.map(category => (
        <Card key={category} className="shadow-sm">
          <CardHeader>
            <CardTitle>{category.replace(/_/g, ' ').toUpperCase()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {settings
                .filter(item => item.category === category && item.is_active)
                .map(item => (
                  <div key={item.id} className="flex justify-between items-center py-1 border-b">
                    <span>{item.value}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSoftDelete(item.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              <div className="flex gap-2">
                <Input
                  placeholder="New item value"
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                />
                <Button onClick={() => handleAddNewItem(category)} disabled={!newItemCategory.trim()}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {editingItem && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Edit Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={formData.category || ''}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Value</Label>
                <Input
                  value={formData.value || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                />
              </div>
              <div>
                <Label>Code</Label>
                <Input
                  value={formData.code || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={formData.display_order || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.is_active ?? true}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectDropdownSettings;
