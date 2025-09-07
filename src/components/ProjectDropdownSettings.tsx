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
} from "@/components/ui/dropdown-menu"
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

      if (error) {
        console.error('Error fetching dropdown settings:', error);
        toast.error('Failed to fetch dropdown settings');
        return;
      }

      // Ensure description field is present, defaulting to empty string if null
      const settingsWithDescription = (data || []).map(item => ({
        ...item,
        description: item.description || ''
      }));

      setSettings(settingsWithDescription);
    } catch (error) {
      console.error('Error fetching dropdown settings:', error);
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
    setNewItemCategory('');
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dropdown_settings')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Failed to delete item');
        return;
      }

      setSettings(prev => prev.filter(item => item.id !== id));
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleSave = async () => {
    if (!formData.category || !formData.value) {
      toast.error('Category and value are required');
      return;
    }

    try {
      const projectData = {
        category: formData.category,
        code: formData.code || '',
        value: formData.value,
        description: formData.description || '',
        is_active: formData.is_active ?? true,
        display_order: formData.display_order || 0
      };

      if (editingItem) {
        const { error } = await supabase
          .from('dropdown_settings')
          .update(projectData)
          .eq('id', editingItem);

        if (error) {
          toast.error('Failed to update item');
          return;
        }
        toast.success('Item updated successfully');
      } else {
        const { error } = await supabase
          .from('dropdown_settings')
          .insert([projectData]);

        if (error) {
          toast.error('Failed to add item');
          return;
        }
        toast.success('Item added successfully');
      }

      setEditingItem(null);
      setFormData({});
      setNewItemCategory('');
      await fetchSettings();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Project Dropdown Settings
        </h1>
      </div>

      {categories.map(category => (
        <Card key={category} className="shadow-sm">
          <CardHeader>
            <CardTitle>{category.replace(/_/g, ' ').toUpperCase()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settings
                .filter(item => item.category === category)
                .map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span>{item.value}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              
              {editingItem === null && (
                <div className="flex items-center justify-between">
                  <Input
                    type="text"
                    placeholder="New item value"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                  />
                  <Button 
                    onClick={() => {
                      setFormData({ category: category, value: newItemCategory });
                      handleSave();
                    }}
                    disabled={!newItemCategory.trim()}
                  >
                    Add Item
                  </Button>
                </div>
              )}
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
            <form className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category || ''}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="value">Value</Label>
                <Input
                  type="text"
                  id="value"
                  value={formData.value || ''}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="code">Code</Label>
                <Input
                  type="text"
                  id="code"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  type="text"
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  type="number"
                  id="display_order"
                  value={formData.display_order || 0}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="is_active">Is Active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectDropdownSettings;
