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
  is_active: boolean;
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
    { key: 'project_subtype', label: 'Project Subtype', icon: Building },
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
      console.log('fetchDropdownOptions called');
      setLoading(true);
      const { data, error } = await supabase
        .from('dropdown_settings')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });

      console.log('Fetch dropdown options response:', { data: data?.length, error });

      if (error) {
        console.error('Error fetching dropdown options:', error);
        toast.error('Failed to fetch dropdown options');
        return;
      }

      console.log('Setting dropdown options:', data?.length || 0, 'items');
      setDropdownOptions(data || []);
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
      toast.error('An error occurred while fetching dropdown options');
    } finally {
      setLoading(false);
      console.log('Fetch completed, loading set to false');
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
    console.log('Edit button clicked for option:', option);
    console.log('Current editingOption state before:', editingOption);
    setEditingOption({ ...option });
    console.log('Edit option state set to:', { ...option });
  };

  const handleUpdateOption = async () => {
    console.log('handleUpdateOption called with editingOption:', editingOption);
    
    if (!editingOption || !editingOption.value.trim()) {
      console.log('Validation failed: missing editingOption or value');
      toast.error('Value is required');
      return;
    }

    // Get the original option from the current state
    const originalOption = dropdownOptions.find(opt => opt.id === editingOption.id);
    console.log('Original option found:', originalOption);
    
    if (!originalOption) {
      console.log('Original option not found');
      toast.error('Original option not found');
      return;
    }

    // Check if the new value is the same as the original (case-insensitive)
    if (originalOption.value.toLowerCase() === editingOption.value.trim().toLowerCase()) {
      console.log('No changes detected, closing dialog');
      setEditingOption(null);
      toast.info('No changes made');
      return;
    }

    // Check if another option with the same category and value already exists
    const duplicateOption = dropdownOptions.find(opt => 
      opt.id !== editingOption.id && 
      opt.category === editingOption.category && 
      opt.value.toLowerCase() === editingOption.value.trim().toLowerCase() &&
      opt.is_active !== false
    );
    console.log('Duplicate check result:', duplicateOption);

    if (duplicateOption) {
      console.log('Duplicate found, showing error');
      toast.error(`An option with the value "${editingOption.value.trim()}" already exists in this category`);
      return;
    }

    console.log('Starting database update...');
    setSavingStates(prev => ({ ...prev, [`edit_${editingOption.id}`]: true }));

    try {
      console.log('Calling supabase update with:', {
        id: editingOption.id,
        value: editingOption.value.trim(),
        category: editingOption.category
      });

      // First, let's fetch the current record to make sure it exists
      const { data: currentRecord, error: fetchError } = await supabase
        .from('dropdown_settings')
        .select('*')
        .eq('id', editingOption.id)
        .eq('is_active', true)
        .single();

      if (fetchError || !currentRecord) {
        console.error('Failed to fetch current record:', fetchError);
        toast.error('Failed to find the option to update');
        return;
      }

      console.log('Current record:', currentRecord);

      // Now update only if the value is actually different
      const { data, error } = await supabase
        .from('dropdown_settings')
        .update({
          value: editingOption.value.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingOption.id)
        .eq('is_active', true)
        .select()
        .single();

      console.log('Supabase update response:', { data, error });

      if (error) {
        console.error('Database error:', error);
        if (error.code === '23505') {
          toast.error('This value already exists in this category. Please choose a different value.');
        } else {
          toast.error('Failed to update option: ' + error.message);
        }
        return;
      }

      if (!data) {
        console.log('No data returned from update');
        toast.error('Failed to update option - no data returned');
        return;
      }

      console.log('Update successful, refreshing data...');
      await fetchDropdownOptions();
      setEditingOption(null);
      toast.success(`Option updated successfully to "${data.value}"`);
    } catch (error) {
      console.error('Catch block error:', error);
      toast.error('An error occurred while updating the option');
    } finally {
      console.log('Clearing saving state...');
      setSavingStates(prev => ({ ...prev, [`edit_${editingOption.id}`]: false }));
    }
  };

  const handleDeleteOption = async (optionId: string, optionValue: string) => {
    setSavingStates(prev => ({ ...prev, [`delete_${optionId}`]: true }));

    try {
      const { error } = await supabase
        .from('dropdown_settings')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', optionId)
        .eq('is_active', true);

      if (error) {
        console.error('Error deleting option:', error);
        toast.error('Failed to delete option: ' + error.message);
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

  if (loading) {
  return (
    <div className="flex items-center justify-center min-h-[400px] flex-col space-y-8">
      {/* Morphing blob animation with logo */}
      <div className="relative">
        {/* Animated blob background */}
        <div className="w-24 h-24 bg-gradient-to-br from-blue-400/20 via-purple-500/15 to-indigo-600/20 rounded-full relative overflow-hidden"
             style={{
               animation: 'morph 4s ease-in-out infinite',
               filter: 'blur(1px)'
             }}>
          <div className="absolute inset-2 bg-gradient-to-tr from-cyan-400/30 to-pink-500/25 rounded-full"
               style={{animation: 'morph 3s ease-in-out infinite reverse'}}></div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 w-24 h-24">
          {[...Array(6)].map((_, i) => (
            <div key={i} 
                 className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-60"
                 style={{
                   top: `${20 + i * 10}%`,
                   left: `${15 + i * 12}%`,
                   animation: `float ${2 + i * 0.3}s ease-in-out infinite`,
                   animationDelay: `${i * 0.2}s`
                 }}></div>
          ))}
        </div>
        
        {/* Logo with breathing effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative"
               style={{animation: 'breathe 2.5s ease-in-out infinite'}}>
            <img 
              src="/lovable-uploads/00baa288-f375-4798-aa52-0272029ed647.png"
              alt="EkarBot"
              className="w-10 h-10 relative z-10"
            />
            <div className="absolute inset-0 bg-white/30 rounded-lg blur-sm transform scale-110 -z-10"
                 style={{animation: 'glow 2s ease-in-out infinite alternate'}}></div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes morph {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: rotate(0deg) scale(1); }
          25% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; transform: rotate(90deg) scale(1.05); }
          50% { border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%; transform: rotate(180deg) scale(0.95); }
          75% { border-radius: 60% 40% 60% 30% / 70% 30% 60% 70%; transform: rotate(270deg) scale(1.02); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.6; }
          33% { transform: translateY(-8px) translateX(4px) scale(1.1); opacity: 0.8; }
          66% { transform: translateY(4px) translateX(-6px) scale(0.9); opacity: 0.4; }
        }
        
        @keyframes breathe {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(2deg); }
        }
        
        @keyframes glow {
          0% { opacity: 0.3; transform: scale(1.1); }
          100% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
      
      {/* Modern text with shimmer effect */}
      <div className="relative overflow-hidden">
        <div className="text-xl font-medium text-gray-700 bg-gradient-to-r from-gray-700 via-gray-900 to-gray-700 bg-clip-text text-transparent animate-pulse">
          Loading Dropdown Settings...
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
      </div>
      
      {/* Progress dots */}
      <div className="flex space-x-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.3s]"></div>
      </div>
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
          
          // Special handling for project_subtype to show grouped view
          if (category.key === 'project_subtype') {
            const residentialOptions = options.filter(opt => 
              ['Apartments', 'Apartment', 'Villa', 'Townhouses', 'Townhouse', 'Duplex', 'Penthouse', 'Studios', 'Studio'].includes(opt.value)
            );
            const commercialOptions = options.filter(opt => 
              ['Office Space', 'Retail Shop', 'Showroom', 'Warehouses', 'Warehouse', 'Industrial Unit', 'Hotel Apartment'].includes(opt.value)
            );
            
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
                  <p className="text-sm text-gray-600 mt-2">
                    Manage subtypes for Residential and Commercial projects. These will be filtered based on Project Type selection.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Residential Subtypes Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-green-700 bg-green-50 px-3 py-2 rounded">
                      <Home className="h-4 w-4" />
                      Residential Subtypes
                      <Badge variant="outline" className="ml-auto text-green-700 border-green-300">
                        {residentialOptions.length} options
                      </Badge>
                    </div>
                    
                    {/* Add New Residential Option */}
                    <div className="flex gap-2 p-4 bg-green-50 rounded-lg border-2 border-dashed border-green-200">
                      <Input
                        placeholder="Add residential subtype (e.g., Apartment, Villa)"
                        value={newOption.category === `${category.key}_residential` ? newOption.value : ''}
                        onChange={(e) => setNewOption(prev => ({ 
                          ...prev, 
                          value: e.target.value,
                          category: `${category.key}_residential`
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
                        disabled={savingStates[`add_${category.key}`] || !newOption.value.trim() || newOption.category !== `${category.key}_residential`}
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

                    {/* Residential Options List */}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {residentialOptions.map((option) => (
                        <div key={option.id} className="flex items-center gap-3 p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                          <Badge 
                            variant="outline" 
                            className="font-mono text-xs min-w-[60px] justify-center bg-green-50 text-green-700 border-green-300 shrink-0"
                          >
                            {option.code}
                          </Badge>
                          <span className="flex-1 text-sm font-medium">{option.value}</span>
                          <div className="flex gap-1">
                            <Button
                              onClick={() => handleEditOption(option)}
                              size="sm"
                              variant="ghost"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
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
                          </div>
                        </div>
                      ))}
                      {residentialOptions.length === 0 && (
                        <p className="text-sm text-gray-500 italic text-center py-4">
                          No residential subtypes configured
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Commercial Subtypes Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded">
                      <Building className="h-4 w-4" />
                      Commercial Subtypes
                      <Badge variant="outline" className="ml-auto text-blue-700 border-blue-300">
                        {commercialOptions.length} options
                      </Badge>
                    </div>
                    
                    {/* Add New Commercial Option */}
                    <div className="flex gap-2 p-4 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
                      <Input
                        placeholder="Add commercial subtype (e.g., Office Space, Retail Shop)"
                        value={newOption.category === `${category.key}_commercial` ? newOption.value : ''}
                        onChange={(e) => setNewOption(prev => ({ 
                          ...prev, 
                          value: e.target.value,
                          category: `${category.key}_commercial`
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
                        disabled={savingStates[`add_${category.key}`] || !newOption.value.trim() || newOption.category !== `${category.key}_commercial`}
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

                    {/* Commercial Options List */}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {commercialOptions.map((option) => (
                        <div key={option.id} className="flex items-center gap-3 p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                          <Badge 
                            variant="outline" 
                            className="font-mono text-xs min-w-[60px] justify-center bg-blue-50 text-blue-700 border-blue-300 shrink-0"
                          >
                            {option.code}
                          </Badge>
                          <span className="flex-1 text-sm font-medium">{option.value}</span>
                          <div className="flex gap-1">
                            <Button
                              onClick={() => handleEditOption(option)}
                              size="sm"
                              variant="ghost"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
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
                          </div>
                        </div>
                      ))}
                      {commercialOptions.length === 0 && (
                        <p className="text-sm text-gray-500 italic text-center py-4">
                          No commercial subtypes configured
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }
          
          // Regular category display for all other categories
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
                    placeholder={`Add new ${category.label.toLowerCase()}`}
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
                    disabled={savingStates[`add_${category.key}`] || !newOption.value.trim() || newOption.category !== category.key}
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
                      <Badge 
                        variant="outline" 
                        className="font-mono text-xs min-w-[60px] justify-center bg-gray-100 shrink-0"
                      >
                        {option.code}
                      </Badge>
                      <span className="flex-1 text-sm font-medium">{option.value}</span>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleEditOption(option)}
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
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
                      </div>
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

      {/* Edit Option Dialog */}
      {(() => {
        console.log('Rendering edit dialog check, editingOption:', editingOption);
        return editingOption ? (
          <AlertDialog open={!!editingOption} onOpenChange={() => {
            console.log('Dialog onOpenChange called, closing dialog');
            setEditingOption(null);
          }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-blue-600" />
                Edit Option
              </AlertDialogTitle>
              <AlertDialogDescription>
                Update the value for this dropdown option. The code cannot be changed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Value</label>
                <Input
                  value={editingOption.value}
                  onChange={(e) => setEditingOption(prev => prev ? { ...prev, value: e.target.value } : null)}
                  placeholder="Enter option value"
                  className="w-full"
                />
              </div>
              <div className="mt-3 p-2 bg-gray-50 rounded border">
                <span className="text-xs text-gray-600">Code: </span>
                <Badge variant="outline" className="text-xs font-mono">
                  {editingOption.code}
                </Badge>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setEditingOption(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUpdateOption}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={savingStates[`edit_${editingOption.id}`] || !editingOption.value?.trim()}
              >
                {savingStates[`edit_${editingOption.id}`] ? (
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
        ) : null;
      })()}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
  );
};

export default DeveloperSettings;
