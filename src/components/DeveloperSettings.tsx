import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Settings as SettingsIcon,
  Tag,
  Building,
  Home,
  AlertCircle,
  Save,
  X
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

const DeveloperSettings = () => {
  const [newOption, setNewOption] = useState({ value: '', category: '' });
  const [editingOption, setEditingOption] = useState<DropdownOption | null>(null);
  const [dropdownOptions, setDropdownOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStates, setSavingStates] = useState<{ [key: string]: boolean }>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; value: string } | null>(null);

  const categories = [
    { key: 'project_type', label: 'Project Type', icon: Building },
    { key: 'listing_type', label: 'Listing Type', icon: Tag },
    { key: 'project_status', label: 'Completion Status', icon: Tag },
    { key: 'bedroom_range', label: 'Bedroom Range', icon: Home },
    { key: 'bathroom_range', label: 'Bathroom Range', icon: Home },
    { key: 'furnishing_status', label: 'Furnishing Status', icon: Building },
    { key: 'ownership_type', label: 'Ownership Type', icon: Building },
    { key: 'amenities', label: 'Amenities', icon: Home },
  ];

  const fetchDropdownOptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dropdown_settings')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching dropdown options:', error);
        toast.error('Failed to fetch dropdown options');
        return;
      }

      setDropdownOptions(data || []);
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
      toast.error('An error occurred while fetching dropdown options');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdownOptions();
  }, []);

  const getOptionsForCategory = (category: string) => {
    return dropdownOptions.filter(option => option.category === category);
  };

  const handleAddOption = async (category: string) => {
    if (!newOption.value.trim()) {
      toast.error('Value is required');
      return;
    }

    setSavingStates(prev => ({ ...prev, [`add_${category}`]: true }));

    try {
      const { data, error } = await supabase
        .from('dropdown_settings')
        .insert({
          category: category,
          value: newOption.value.trim(),
          code: `${category.toUpperCase().substring(0,3)}${Date.now().toString().slice(-6)}`
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error adding option:', error);
        toast.error('Failed to add option');
        return;
      }

      await fetchDropdownOptions();
      setNewOption({ value: '', category: '' });
      toast.success(`Option "${newOption.value}" added successfully with code: ${data?.code}`);
    } catch (error) {
      console.error('Error adding option:', error);
      toast.error('An error occurred while adding the option');
    } finally {
      setSavingStates(prev => ({ ...prev, [`add_${category}`]: false }));
    }
  };

  const handleEditOption = (option: DropdownOption) => {
    setEditingOption({ ...option });
  };

  const handleUpdateOption = async () => {
    if (!editingOption || !editingOption.value.trim()) {
      toast.error('Value is required');
      return;
    }

    setSavingStates(prev => ({ ...prev, [`edit_${editingOption.id}`]: true }));

    try {
      const { data, error } = await supabase
        .from('dropdown_settings')
        .update({
          value: editingOption.value.trim(),
        })
        .eq('id', editingOption.id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating option:', error);
        toast.error('Failed to update option');
        return;
      }

      await fetchDropdownOptions();
      setEditingOption(null);
      toast.success(`Option updated successfully`);
    } catch (error) {
      console.error('Error updating option:', error);
      toast.error('An error occurred while updating the option');
    } finally {
      setSavingStates(prev => ({ ...prev, [`edit_${editingOption.id}`]: false }));
    }
  };

  const handleDeleteOption = async (optionId: string, optionValue: string) => {
    setSavingStates(prev => ({ ...prev, [`delete_${optionId}`]: true }));

    try {
      const { error } = await supabase
        .from('dropdown_settings')
        .update({ is_active: false })
        .eq('id', optionId);

      if (error) {
        console.error('Error deleting option:', error);
        toast.error('Failed to delete option');
        return;
      }

      await fetchDropdownOptions();
      toast.success(`Option "${optionValue}" deleted successfully`);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting option:', error);
      toast.error('An error occurred while deleting the option');
    } finally {
      setSavingStates(prev => ({ ...prev, [`delete_${optionId}`]: false }));
    }
  };

  const openDeleteDialog = (optionId: string, optionValue: string) => {
    setItemToDelete({ id: optionId, value: optionValue });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      handleDeleteOption(itemToDelete.id, itemToDelete.value);
    }
  };

  const cancelEdit = () => {
    setEditingOption(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dropdown settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <SettingsIcon className="h-8 w-8" style={{ color: '#455560' }} />
          Dropdown Settings
        </h1>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">Auto-Generated Unique Codes</p>
            <p className="text-sm text-blue-700">
              Each dropdown option automatically gets a unique code (e.g., PRO001, PRO002). 
              These codes are used throughout the system and ensure data consistency.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {categories.map((category) => {
          const CategoryIcon = category.icon;
          const options = getOptionsForCategory(category.key);
          
          return (
            <Card key={category.key} className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CategoryIcon className="h-5 w-5" style={{ color: '#455560' }} />
                  {category.label}
                  <Badge variant="outline" className="ml-auto">
                    {options.length} options
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Option */}
                <div className="flex gap-2 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Input
                    value={newOption.category === category.key ? newOption.value : ''}
                    onChange={(e) => setNewOption(prev => ({ 
                      ...prev, 
                      value: e.target.value,
                      category: category.key 
                    }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddOption(category.key);
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleAddOption(category.key)}
                    disabled={savingStates[`add_${category.key}`] || !newOption.value.trim()}
                    style={{ backgroundColor: '#455560' }}
                    className="text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {savingStates[`add_${category.key}`] ? (
                      <>Adding...</>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </>
                    )}
                  </Button>
                </div>

                {/* Existing Options */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {options.map((option) => (
                    <div key={option.id} className="flex items-center gap-3 p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                      {editingOption?.id === option.id ? (
                        <>
                          <Badge 
                            variant="outline" 
                            className="font-mono text-xs min-w-[60px] justify-center bg-gray-100 shrink-0"
                          >
                            {option.code}
                          </Badge>
                          <Input
                            value={editingOption.value}
                            onChange={(e) => setEditingOption(prev => 
                              prev ? { ...prev, value: e.target.value } : null
                            )}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateOption();
                              } else if (e.key === 'Escape') {
                                cancelEdit();
                              }
                            }}
                            className="flex-1"
                            autoFocus
                          />
                          <Button
                            onClick={handleUpdateOption}
                            disabled={savingStates[`edit_${editingOption.id}`]}
                            size="sm"
                            style={{ backgroundColor: '#455560' }}
                            className="text-white hover:opacity-90"
                          >
                            {savingStates[`edit_${editingOption.id}`] ? (
                              <>Saving...</>
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            onClick={cancelEdit}
                            size="sm"
                            variant="outline"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Badge 
                            variant="outline" 
                            className="font-mono text-xs min-w-[60px] justify-center bg-green-50 text-green-700 border-green-300 shrink-0"
                          >
                            {option.code}
                          </Badge>
                          <span className="flex-1 text-sm font-medium">{option.value}</span>
                          <div className="flex gap-1">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2">
                                    <Edit2 className="h-5 w-5 text-blue-500" />
                                    Edit Option
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Update the value for this dropdown option. The unique code <strong>"{option.code}"</strong> will remain unchanged.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Option Value</label>
                                    <Input
                                      defaultValue={option.value}
                                      onChange={(e) => setEditingOption({ ...option, value: e.target.value })}
                                      placeholder="Enter option value"
                                      className="w-full"
                                    />
                                  </div>
                                  <div className="mt-3 p-2 bg-gray-50 rounded border">
                                    <span className="text-xs text-gray-600">Code: </span>
                                    <Badge variant="outline" className="text-xs font-mono">
                                      {option.code}
                                    </Badge>
                                  </div>
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setEditingOption(null)}>
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      if (editingOption) {
                                        handleUpdateOption();
                                      }
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    disabled={savingStates[`edit_${option.id}`] || !editingOption?.value?.trim()}
                                  >
                                    {savingStates[`edit_${option.id}`] ? (
                                      <>Saving...</>
                                    ) : (
                                      <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                      </>
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                              <AlertDialogTrigger asChild>
                                <Button
                                  onClick={() => openDeleteDialog(option.id, option.value)}
                                  disabled={savingStates[`delete_${option.id}`]}
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  {savingStates[`delete_${option.id}`] ? (
                                    <>Deleting...</>
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                    Delete Option
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the option <strong>"{itemToDelete?.value}"</strong>?
                                    <br />
                                    <br />
                                    This action cannot be undone. The option will be deactivated and removed from all dropdown menus throughout the system.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={confirmDelete}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    disabled={savingStates[`delete_${itemToDelete?.id}`]}
                                  >
                                    {savingStates[`delete_${itemToDelete?.id}`] ? (
                                      <>Deleting...</>
                                    ) : (
                                      <>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Option
                                      </>
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  
                  {options.length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      <Building className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No options configured for this category</p>
                      <p className="text-xs">Add your first option above</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DeveloperSettings;
