import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Trash2, Plus, Upload, X, FileText, Image, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDropdownOptions } from '@/components/hooks/useDropdownOptions';
import { validateProjectTitle, validatePhoneNumber, validateEmail, validateFileUpload } from '@/utils/inputValidation';

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
  cover_image?: string;
  gallery_images?: string[];
  brochure_pdf?: string;
  video_tour_url?: string;
  other_documents?: string[];
  // Project basic info for each unit
  project_title?: string;
  developer_name?: string;
  description?: string;
  project_type?: string;
  project_subtype?: string;
  listing_type?: string;
  project_status?: string;
  handover_date?: string;
  rera_approval_id?: string;
}

interface UnifiedProjectFormProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
  handleArrayChange: (field: string, values: string[]) => void;
  editProject?: any;
}

const UnifiedProjectForm = ({ formData, handleInputChange, handleArrayChange, editProject }: UnifiedProjectFormProps) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentUnits, setCurrentUnits] = useState<Unit[]>(formData.units || []);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [newUnit, setNewUnit] = useState<Unit>({
    unit_code: '',
    unit_size_range: '',
    bedrooms_range: '',
    bathrooms_range: '',
    furnishing_status: '',
    ownership_type: '',
    has_balcony: false,
    starting_price_aed: 0,
    price_per_sqft: 0,
    service_charges: 0,
    payment_plan: '',
    cover_image: '',
    gallery_images: [],
    brochure_pdf: '',
    video_tour_url: '',
    other_documents: [],
    project_title: '',
    developer_name: '',
    description: '',
    project_type: '',
    project_subtype: '',
    listing_type: '',
    project_status: '',
    handover_date: '',
    rera_approval_id: ''
  });

  // Fixed Project Type options - not editable in settings
  const projectTypeOptions = [
    { id: '1', value: 'Residential', code: 'residential' },
    { id: '2', value: 'Commercial', code: 'commercial' }
  ];

  const { options: projectSubtypeOptions } = useDropdownOptions('project_subtype');
  const { options: listingTypeOptions } = useDropdownOptions('listing_type');
  const { options: projectStatusOptions } = useDropdownOptions('project_status');

  // Filter project subtypes based on selected project type
  const getFilteredSubtypes = () => {
    console.log('getFilteredSubtypes called with:', {
      newUnit_project_type: newUnit.project_type,
      formData_project_type: formData.project_type,
      projectSubtypeOptions: projectSubtypeOptions.length,
      sampleOptions: projectSubtypeOptions.slice(0, 3)
    });

    // Use newUnit.project_type for the unit form section
    const projectType = newUnit.project_type || formData.project_type;
    if (!projectType) {
      console.log('No project type selected, returning empty array');
      return [];
    }
    
    if (projectType === 'Residential') {
      const filtered = projectSubtypeOptions.filter(option => 
        ['Apartments', 'Apartment', 'Villa', 'Townhouses', 'Townhouse', 'Duplex', 'Penthouse', 'Studios', 'Studio'].includes(option.value)
      );
      console.log('Residential subtypes filtered:', filtered.length, filtered.map(o => o.value));
      return filtered;
    } else if (projectType === 'Commercial') {
      const filtered = projectSubtypeOptions.filter(option => 
        ['Office Space', 'Retail Shop', 'Showroom', 'Warehouses', 'Warehouse', 'Industrial Unit', 'Hotel Apartment'].includes(option.value)
      );
      console.log('Commercial subtypes filtered:', filtered.length, filtered.map(o => o.value));
      return filtered;
    }
    console.log('Unknown project type:', projectType, 'returning empty array');
    return [];
  };

  // Reset project subtype when project type changes
  useEffect(() => {
    if (formData.project_type) {
      const filteredSubtypes = getFilteredSubtypes();
      if (filteredSubtypes.length > 0 && !filteredSubtypes.some(option => option.value === formData.project_subtype)) {
        handleInputChange('project_subtype', '');
      }
    } else {
      // Clear subtype if no type is selected
      handleInputChange('project_subtype', '');
    }
  }, [formData.project_type, projectSubtypeOptions]);

  useEffect(() => {
    setCurrentUnits(formData.units || []);
    
    // When editing and units exist, populate the newUnit form with first unit's data
    if (formData.units && formData.units.length > 0) {
      const firstUnit = formData.units[0];
      console.log('Populating newUnit form with first unit data:', firstUnit);
      setNewUnit({
        unit_code: firstUnit.unit_code || '',
        unit_size_range: firstUnit.unit_size_range || '',
        bedrooms_range: firstUnit.bedrooms_range || '',
        bathrooms_range: firstUnit.bathrooms_range || '',
        furnishing_status: firstUnit.furnishing_status || '',
        ownership_type: firstUnit.ownership_type || '',
        has_balcony: firstUnit.has_balcony || false,
        starting_price_aed: firstUnit.starting_price_aed || 0,
        price_per_sqft: firstUnit.price_per_sqft || 0,
        service_charges: firstUnit.service_charges || 0,
        payment_plan: firstUnit.payment_plan || '',
        cover_image: firstUnit.cover_image || '',
        gallery_images: firstUnit.gallery_images || [],
        brochure_pdf: firstUnit.brochure_pdf || '',
        video_tour_url: firstUnit.video_tour_url || '',
        other_documents: firstUnit.other_documents || [],
        // Project basic info from unit or fall back to main form data
        project_title: firstUnit.project_title || formData.project_title || '',
        developer_name: firstUnit.developer_name || formData.developer_name || '',
        description: firstUnit.description || formData.description || '',
        project_type: firstUnit.project_type || formData.project_type || '',
        project_subtype: firstUnit.project_subtype || formData.project_subtype || '',
        listing_type: firstUnit.listing_type || formData.listing_type || '',
        project_status: firstUnit.project_status || formData.project_status || '',
        handover_date: firstUnit.handover_date || formData.handover_date || '',
        rera_approval_id: firstUnit.rera_approval_id || formData.rera_approval_id || ''
      });
    } else if (formData.project_title) {
      // If no units but we have project data (editing existing project), create a synthetic unit
      console.log('Creating synthetic unit from project data for editing');
      setNewUnit({
        unit_code: 'MAIN', // Default unit code for single projects
        unit_size_range: formData.unit_sizes_range || '',
        bedrooms_range: formData.bedrooms_range || '',
        bathrooms_range: formData.bathrooms_range || '',
        furnishing_status: formData.furnishing_status || '',
        ownership_type: formData.ownership_type || '',
        has_balcony: formData.has_balcony || false,
        starting_price_aed: formData.starting_price_aed || 0,
        price_per_sqft: formData.price_per_sqft || 0,
        service_charges: formData.service_charges || 0,
        payment_plan: formData.payment_plan || '',
        cover_image: formData.cover_image || '',
        gallery_images: formData.gallery_images || [],
        brochure_pdf: formData.brochure_pdf || '',
        video_tour_url: formData.video_tour_url || '',
        other_documents: formData.other_documents || [],
        // Project basic info
        project_title: formData.project_title || '',
        developer_name: formData.developer_name || '',
        description: formData.description || '',
        project_type: formData.project_type || '',
        project_subtype: formData.project_subtype || '',
        listing_type: formData.listing_type || '',
        project_status: formData.project_status || '',
        handover_date: formData.handover_date || '',
        rera_approval_id: formData.rera_approval_id || ''
      });
    }
  }, [formData.units, formData.project_title, formData.project_type, formData.listing_type]);

  const generateUnitCode = () => {
    const prefix = 'UNIT';
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
  };

  const bedroomOptions = [
    { value: 'Studio', label: 'Studio' },
    { value: '1 Bedroom', label: '1 Bedroom' },
    { value: '2 Bedrooms', label: '2 Bedrooms' },
    { value: '3 Bedrooms', label: '3 Bedrooms' },
    { value: '4 Bedrooms', label: '4 Bedrooms' },
    { value: '5+ Bedrooms', label: '5+ Bedrooms' }
  ];

  const bathroomOptions = [
    { value: '1 Bathroom', label: '1 Bathroom' },
    { value: '2 Bathrooms', label: '2 Bathrooms' },
    { value: '3 Bathrooms', label: '3 Bathrooms' },
    { value: '4+ Bathrooms', label: '4+ Bathrooms' }
  ];

  const furnishingOptions = [
    { value: 'Unfurnished', label: 'Unfurnished' },
    { value: 'Semi-Furnished', label: 'Semi-Furnished' },
    { value: 'Furnished', label: 'Furnished' }
  ];

  const ownershipOptions = [
    { value: 'Freehold', label: 'Freehold' },
    { value: 'Leasehold', label: 'Leasehold' }
  ];

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      handleInputChange('handover_date', date.toISOString().split('T')[0]);
      setIsDatePickerOpen(false);
    }
  };

  const getDateFromString = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return undefined;
    return date;
  };

  const formatDate = (dateString: string): string => {
    const date = getDateFromString(dateString);
    if (!date) return "Select handover date";
    try {
      return format(date, "PPP");
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Select handover date";
    }
  };

  const handleNewUnitChange = (field: keyof Unit, value: any) => {
    setNewUnit(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Also update the form data for these fields when editing
    if (editProject) {
      const unitFieldMappings = {
        'unit_size_range': 'unit_sizes_range',
        'bedrooms_range': 'bedrooms_range',
        'bathrooms_range': 'bathrooms_range',
        'furnishing_status': 'furnishing_status',
        'ownership_type': 'ownership_type',
        'has_balcony': 'has_balcony',
        'starting_price_aed': 'starting_price_aed',
        'price_per_sqft': 'price_per_sqft',
        'service_charges': 'service_charges',
        'payment_plan': 'payment_plan',
        'video_tour_url': 'video_tour_url'
      };
      
      if (unitFieldMappings[field]) {
        handleInputChange(unitFieldMappings[field], value);
      } else if (['project_title', 'developer_name', 'description', 'project_type', 'project_subtype', 'listing_type', 'project_status', 'handover_date', 'rera_approval_id'].includes(field)) {
        handleInputChange(field, value);
      }
    }
  };

  // Media upload functions
  const uploadFileToStorage = async (file: File, pathPrefix: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `project-media/${pathPrefix}/${fileName}`;

    const bucketName = file.type.startsWith('image/') ? 'project-images' : 'project-documents';

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload failed:', error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl || null;
  };

  const handleUnitFileUpload = async (field: string, files: FileList | null, unitIndex?: number) => {
    if (!files || files.length === 0) return;
    
    // Validate files
    for (const file of Array.from(files)) {
      const validation = validateFileUpload(file);
      if (!validation.isValid) {
        toast.error(validation.error);
        return;
      }
    }
    
    setUploading(true);
    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      const url = await uploadFileToStorage(file, field);
      if (url) uploadedUrls.push(url);
    }

    if (uploadedUrls.length === 0) {
      setUploading(false);
      return;
    }

    if (unitIndex !== undefined) {
      // Handle unit-specific media
      const updatedUnits = [...currentUnits];
      if (field === 'gallery_images' || field === 'other_documents') {
        const existing = updatedUnits[unitIndex][field as keyof Unit] as string[] || [];
        updatedUnits[unitIndex] = {
          ...updatedUnits[unitIndex],
          [field]: [...existing, ...uploadedUrls]
        };
      } else {
        updatedUnits[unitIndex] = {
          ...updatedUnits[unitIndex],
          [field]: uploadedUrls[0]
        };
      }
      setCurrentUnits(updatedUnits);
      handleInputChange('units', updatedUnits);
    } else {
      // Handle new unit media
      if (field === 'gallery_images' || field === 'other_documents') {
        const existing = newUnit[field as keyof Unit] as string[] || [];
        handleNewUnitChange(field as keyof Unit, [...existing, ...uploadedUrls]);
      } else {
        handleNewUnitChange(field as keyof Unit, uploadedUrls[0]);
      }
    }

    setUploading(false);
  };

  const removeUnitFile = (field: string, index?: number, unitIndex?: number) => {
    if (unitIndex !== undefined) {
      const updatedUnits = [...currentUnits];
      if (field === 'gallery_images' || field === 'other_documents') {
        const currentFiles = updatedUnits[unitIndex][field as keyof Unit] as string[] || [];
        const updatedFiles = currentFiles.filter((_: any, i: number) => i !== index);
        updatedUnits[unitIndex] = {
          ...updatedUnits[unitIndex],
          [field]: updatedFiles
        };
      } else {
        updatedUnits[unitIndex] = {
          ...updatedUnits[unitIndex],
          [field]: ''
        };
      }
      setCurrentUnits(updatedUnits);
      handleInputChange('units', updatedUnits);
    } else {
      if (field === 'gallery_images' || field === 'other_documents') {
        const currentFiles = newUnit[field as keyof Unit] as string[] || [];
        const updatedFiles = currentFiles.filter((_: any, i: number) => i !== index);
        handleNewUnitChange(field as keyof Unit, updatedFiles);
      } else {
        handleNewUnitChange(field as keyof Unit, '');
      }
    }
  };

  const validateUnit = (unit: Unit): string[] => {
    const errors = [];
    
    // Remove unit code validation since it's auto-generated
    // if (!unit.bedrooms_range) errors.push('Bedrooms');
    if (!unit.starting_price_aed || unit.starting_price_aed <= 0) errors.push('Starting Price');
    if (unit.unit_size_range && !/^\d+(-\d+)?(\s*(sq ft|sqft))?$/i.test(unit.unit_size_range.trim())) {
      errors.push('Valid Unit Size Range (e.g., "800-1200 sq ft")');
    }
    
    return errors;
  };

  const handleAddUnit = () => {
    const errors = validateUnit(newUnit);
    if (errors.length > 0) {
      toast.error(`Please provide valid: ${errors.join(', ')}`);
      return;
    }

    const unitToAdd = {
      ...newUnit,
      unit_code: generateUnitCode(), // Always auto-generate
      id: Date.now().toString()
    };

    // Check if we're editing existing units (update first unit) or adding new
    if (currentUnits.length > 0) {
      // Update first existing unit with new data
      const updatedUnits = [...currentUnits];
      updatedUnits[0] = unitToAdd;
      setCurrentUnits(updatedUnits);
      handleInputChange('units', updatedUnits);
      toast.success('Unit updated successfully');
    } else {
      // Add new unit
      const updatedUnits = [...currentUnits, unitToAdd];
      setCurrentUnits(updatedUnits);
      handleInputChange('units', updatedUnits);
      toast.success('Unit added successfully');
    }
    
    // Reset form only when adding new (not editing)
    if (currentUnits.length === 0) {
      setNewUnit({
        unit_code: '',
        unit_size_range: '',
        bedrooms_range: '',
        bathrooms_range: '',
        furnishing_status: '',
        ownership_type: '',
        has_balcony: false,
        starting_price_aed: 0,
        price_per_sqft: 0,
        service_charges: 0,
        payment_plan: '',
        cover_image: '',
        gallery_images: [],
        brochure_pdf: '',
        video_tour_url: '',
        other_documents: [],
        project_title: '',
        developer_name: '',
        description: '',
        project_type: '',
        project_subtype: '',
        listing_type: '',
        project_status: '',
        handover_date: '',
        rera_approval_id: ''
      });
    }
  };

  const handleRemoveUnit = (index: number) => {
    const updatedUnits = currentUnits.filter((_, i) => i !== index);
    setCurrentUnits(updatedUnits);
    handleInputChange('units', updatedUnits);
    toast.success('Unit removed successfully');
  };

  const handleEditUnit = (index: number) => {
    setEditingUnit({ ...currentUnits[index], originalIndex: index } as any);
  };

  const handleUpdateUnit = () => {
    if (!editingUnit || (editingUnit as any).originalIndex === undefined) return;
    
    const updatedUnits = [...currentUnits];
    const originalIndex = (editingUnit as any).originalIndex;
    const { originalIndex: _, ...unitData } = editingUnit as any;
    updatedUnits[originalIndex] = unitData as Unit;
    
    setCurrentUnits(updatedUnits);
    handleInputChange('units', updatedUnits);
    setEditingUnit(null);
    toast.success('Unit updated successfully');
  };

  const handleCancelEdit = () => {
    setEditingUnit(null);
  };

  const formatPrice = (price: number): string => {
    if (price >= 10000000) return `${(price / 10000000).toFixed(1)}Cr`;
    if (price >= 100000) return `${(price / 100000).toFixed(1)}L`;
    if (price >= 1000) return `${(price / 1000).toFixed(1)}K`;
    return price.toString();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">

      {/* Add New Unit */}
      <Card className="shadow-lg rounded-2xl border border-gray-200">
  <CardHeader className="border-b pb-4">
    <CardTitle className="text-lg font-semibold flex items-center justify-between">
      <div className="flex items-center">
        <Plus className="h-5 w-5 mr-2 text-blue-600" />
        {currentUnits.length > 0 ? 'Edit Unit Details' : 'Add New Unit'}
      </div>
      {currentUnits.length > 0 && (
        <span className="text-xs font-medium text-blue-700 bg-blue-100 px-3 py-1 rounded-full shadow-sm">
          Editing {currentUnits.length} unit{currentUnits.length > 1 ? 's' : ''}
        </span>
      )}
    </CardTitle>
  </CardHeader>

  <CardContent className="space-y-8 pt-6">
    {/* Project Basic Info Section */}
    <div>
      <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-5 flex items-center">
        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
        Project Basic Information
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Name */}
        <div className="space-y-2">
          <Label
            htmlFor="unit_project_title"
            className="text-sm font-medium text-gray-700"
          >
            Project Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="unit_project_title"
            value={newUnit.project_title || ''}
            onChange={(e) =>
              handleNewUnitChange('project_title', e.target.value)
            }
            placeholder="e.g. Marina Vista"
            required
            className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200"
          />
        </div>

        {/* Developer Name */}
        <div className="space-y-2">
          <Label
            htmlFor="unit_developer_name"
            className="text-sm font-medium text-gray-700"
          >
            Developer Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="unit_developer_name"
            value={formData.developer_name || ''}
            readOnly
            className="rounded-lg bg-gray-100 cursor-not-allowed border-gray-300"
            placeholder="Developer name"
            required
          />
        </div>
      </div>
            {/* Project Description */}
<div className="mb-8">
  <Label htmlFor="unit_description" className="font-medium text-gray-700">
    Project Description
  </Label>
  <Textarea
    id="unit_description"
    value={newUnit.description || ''}
    onChange={(e) => handleNewUnitChange('description', e.target.value)}
    placeholder="A luxury development with sea views..."
    rows={4}
    className="mt-2 rounded-lg border-gray-300 focus:ring focus:ring-blue-200 focus:border-blue-500"
  />
</div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <Label htmlFor="unit_project_type">Project Type <span className="text-red-500">*</span></Label>
                <Select value={newUnit.project_type || ''} onValueChange={(value) => handleNewUnitChange('project_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-2 border-gray-300 shadow-xl z-[100] max-h-60 overflow-auto">
                    {projectTypeOptions.map((option) => (
                      <SelectItem 
                        key={option.id} 
                        value={option.value}
                        className="bg-white hover:bg-blue-50 cursor-pointer px-4 py-2"
                      >
                        {option.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="unit_project_subtype">Project Subtype <span className="text-red-500">*</span></Label>
                <Select 
                  value={newUnit.project_subtype || ''} 
                  onValueChange={(value) => handleNewUnitChange('project_subtype', value)}
                  disabled={!newUnit.project_type}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={newUnit.project_type ? "Select subtype" : "Select type first"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-2 border-gray-300 shadow-xl z-[100] max-h-60 overflow-auto">
                    {getFilteredSubtypes().map((option) => (
                      <SelectItem 
                        key={option.id} 
                        value={option.value}
                        className="bg-white hover:bg-blue-50 cursor-pointer px-4 py-2"
                      >
                        {option.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="unit_listing_type">Listing Type <span className="text-red-500">*</span></Label>
                <Select value={newUnit.listing_type || ''} onValueChange={(value) => handleNewUnitChange('listing_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select listing type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg z-50">
                    {listingTypeOptions.map((option) => (
                      <SelectItem key={option.id} value={option.value}>
                        {option.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="unit_project_status">Completion Status <span className="text-red-500">*</span></Label>
                <Select value={newUnit.project_status || ''} onValueChange={(value) => handleNewUnitChange('project_status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg z-50">
                    {projectStatusOptions.map((option) => (
                      <SelectItem key={option.id} value={option.value}>
                        {option.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="unit_handover_date">Expected Handover Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newUnit.handover_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newUnit.handover_date ? format(new Date(newUnit.handover_date), "PPP") : "Select handover date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white" align="start">
                    <Calendar
                      mode="single"
                      selected={newUnit.handover_date ? new Date(newUnit.handover_date) : undefined}
                      onSelect={(date) => handleNewUnitChange('handover_date', date ? date.toISOString().split('T')[0] : '')}
                      disabled={(date) => date < today}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="unit_rera_approval_id">RERA Approval ID</Label>
                <Input
                  id="unit_rera_approval_id"
                  value={newUnit.rera_approval_id || ''}
                  onChange={(e) => handleNewUnitChange('rera_approval_id', e.target.value)}
                  placeholder="RERA-123456"
                />
              </div>
            </div>
          </div>

          {/* Unit Details Section */}
          <div>
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-5 flex items-center">
        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
      Unit Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              <div className="space-y-2">
                <Label htmlFor="unit_size_range">Unit Size Range (sq ft)</Label>
                <Input
                  id="unit_size_range"
                  value={newUnit.unit_size_range}
                  onChange={(e) => handleNewUnitChange('unit_size_range', e.target.value)}
                  placeholder="e.g., 800-1200 sq ft"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bedrooms_range">Bedrooms</Label>
                <Select value={newUnit.bedrooms_range} onValueChange={(value) => handleNewUnitChange('bedrooms_range', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bedrooms" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {bedroomOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bathrooms_range">Bathrooms</Label>
                <Select value={newUnit.bathrooms_range} onValueChange={(value) => handleNewUnitChange('bathrooms_range', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bathrooms" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {bathroomOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="furnishing_status">Furnishing Status</Label>
                <Select value={newUnit.furnishing_status} onValueChange={(value) => handleNewUnitChange('furnishing_status', value)}>
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

              <div className="space-y-2">
                <Label htmlFor="ownership_type">Ownership Type</Label>
                <Select value={newUnit.ownership_type} onValueChange={(value) => handleNewUnitChange('ownership_type', value)}>
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

              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="has_balcony"
                  checked={newUnit.has_balcony}
                  onCheckedChange={(checked) => handleNewUnitChange('has_balcony', !!checked)}
                />
                <Label htmlFor="has_balcony" className="text-sm font-medium text-gray-700">
                  Has Balcony
                </Label>
              </div>
            </div>
          </div>

          {/* Pricing Details Section */}
          <div>
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-5 flex items-center">
        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
      Pricing Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="starting_price_aed">Starting Price (AED) <span className="text-red-500">*</span></Label>
                <Input
                  id="starting_price_aed"
                  type="number"
                  value={newUnit.starting_price_aed || ''}
                  onChange={(e) => handleNewUnitChange('starting_price_aed', parseInt(e.target.value) || 0)}
                  placeholder="850000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_per_sqft">Price per Sq Ft (AED)</Label>
                <Input
                  id="price_per_sqft"
                  type="number"
                  step="0.01"
                  value={newUnit.price_per_sqft || ''}
                  onChange={(e) => handleNewUnitChange('price_per_sqft', parseFloat(e.target.value) || 0)}
                  placeholder="1200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_charges">Service Charges (AED per sq ft)</Label>
                <Input
                  id="service_charges"
                  type="number"
                  step="0.01"
                  value={newUnit.service_charges || ''}
                  onChange={(e) => handleNewUnitChange('service_charges', parseFloat(e.target.value) || 0)}
                  placeholder="15"
                />
              </div>

              <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2">
                <Label htmlFor="payment_plan">Payment Plan</Label>
                <Textarea
                  id="payment_plan"
                  value={newUnit.payment_plan}
                  onChange={(e) => handleNewUnitChange('payment_plan', e.target.value)}
                  placeholder="10% on booking, 50% during construction, 40% on handover..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Media Upload Section */}
          <div>
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-5 flex items-center">
        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
      Media Uploads</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cover Image */}
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUnitFileUpload('cover_image', e.target.files)}
                    className="hidden"
                    id="new-cover-image"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="new-cover-image"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                  >
                    <Image className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Click to upload cover image</span>
                  </label>
                  {newUnit.cover_image && (
                    <div className="mt-2 relative">
                      <img src={newUnit.cover_image} alt="Cover" className="w-full h-32 object-cover rounded" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeUnitFile('cover_image')}
                        className="absolute top-1 right-1 text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Gallery Images */}
              <div className="space-y-2">
                <Label>Gallery Images</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleUnitFileUpload('gallery_images', e.target.files)}
                    className="hidden"
                    id="new-gallery-images"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="new-gallery-images"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                  >
                    <Image className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Click to upload gallery images</span>
                  </label>
                  {newUnit.gallery_images && newUnit.gallery_images.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {newUnit.gallery_images.map((url, index) => (
                        <div key={index} className="relative">
                          <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-20 object-cover rounded" />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeUnitFile('gallery_images', index)}
                            className="absolute top-1 right-1 text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Brochure PDF */}
              <div className="space-y-2">
                <Label>Brochure (PDF)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleUnitFileUpload('brochure_pdf', e.target.files)}
                    className="hidden"
                    id="new-brochure-pdf"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="new-brochure-pdf"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                  >
                    <FileText className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Click to upload brochure</span>
                  </label>
                  {newUnit.brochure_pdf && (
                    <div className="mt-2 flex items-center justify-between bg-gray-100 p-2 rounded">
                      <span className="text-sm">Brochure uploaded</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeUnitFile('brochure_pdf')}
                        className="text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Tour URL */}
              <div className="space-y-2">
                <Label htmlFor="video_tour_url">Video Tour URL</Label>
                <Input
                  id="video_tour_url"
                  value={newUnit.video_tour_url}
                  onChange={(e) => handleNewUnitChange('video_tour_url', e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              {/* Other Documents */}
              <div className="space-y-2">
                <Label>Other Documents</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    multiple
                    onChange={(e) => handleUnitFileUpload('other_documents', e.target.files)}
                    className="hidden"
                    id="new-other-documents"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="new-other-documents"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                  >
                    <FileText className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Click to upload documents</span>
                  </label>
                  {newUnit.other_documents && newUnit.other_documents.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {newUnit.other_documents.map((url, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                          <span className="text-sm">Document {index + 1}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeUnitFile('other_documents', index)}
                            className="text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!editProject && (
            <div className="flex justify-end">
              <Button onClick={handleAddUnit} className="bg-blue-600 hover:bg-blue-700" disabled={uploading}>
                <Plus className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : (currentUnits.length > 0 ? 'Update Unit' : 'Add Unit')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Units List */}
      {!editProject && (
      <Card>
        <CardHeader>
          <CardTitle className="text-md">Added Units ({currentUnits.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {currentUnits.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No units added yet. Add your first unit above.</p>
            </div>
          ) : (
            <div className="space-y-4">
               {currentUnits.map((unit, index) => (
                 <div key={unit.id || index} className="border rounded-lg p-4 bg-gray-50">
                   {editingUnit && (editingUnit as any).originalIndex === index ? (
                     // Edit mode - Show ALL unit fields
                     <div className="space-y-4">
                       <h4 className="font-semibold text-gray-800 mb-4">Edit Unit Details</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         <div>
                           <Label>Unit Code</Label>
                           <Input
                             value={editingUnit.unit_code}
                             onChange={(e) => setEditingUnit({ ...editingUnit, unit_code: e.target.value })}
                             placeholder="Unit code"
                           />
                         </div>
                         <div>
                           <Label>Unit Size Range</Label>
                           <Input
                             value={editingUnit.unit_size_range}
                             onChange={(e) => setEditingUnit({ ...editingUnit, unit_size_range: e.target.value })}
                             placeholder="e.g., 800-1200 sqft"
                           />
                         </div>
                         <div>
                           <Label>Bedrooms Range</Label>
                           <Input
                             value={editingUnit.bedrooms_range}
                             onChange={(e) => setEditingUnit({ ...editingUnit, bedrooms_range: e.target.value })}
                             placeholder="e.g., 2 Bedrooms"
                           />
                         </div>
                         <div>
                           <Label>Bathrooms Range</Label>
                           <Input
                             value={editingUnit.bathrooms_range}
                             onChange={(e) => setEditingUnit({ ...editingUnit, bathrooms_range: e.target.value })}
                             placeholder="e.g., 2 Bathrooms"
                           />
                         </div>
                         <div>
                           <Label>Furnishing Status</Label>
                           <Select
                             value={editingUnit.furnishing_status}
                             onValueChange={(value) => setEditingUnit({ ...editingUnit, furnishing_status: value })}
                           >
                             <SelectTrigger>
                               <SelectValue placeholder="Select furnishing" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="Unfurnished">Unfurnished</SelectItem>
                               <SelectItem value="Semi-Furnished">Semi-Furnished</SelectItem>
                               <SelectItem value="Fully Furnished">Fully Furnished</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                         <div>
                           <Label>Ownership Type</Label>
                           <Select
                             value={editingUnit.ownership_type}
                             onValueChange={(value) => setEditingUnit({ ...editingUnit, ownership_type: value })}
                           >
                             <SelectTrigger>
                               <SelectValue placeholder="Select ownership" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="Freehold">Freehold</SelectItem>
                               <SelectItem value="Leasehold">Leasehold</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                         <div>
                           <Label>Starting Price (AED)</Label>
                           <Input
                             type="number"
                             value={editingUnit.starting_price_aed}
                             onChange={(e) => setEditingUnit({ ...editingUnit, starting_price_aed: parseInt(e.target.value) || 0 })}
                             placeholder="Starting price"
                           />
                         </div>
                         <div>
                           <Label>Price per Sqft (AED)</Label>
                           <Input
                             type="number"
                             value={editingUnit.price_per_sqft}
                             onChange={(e) => setEditingUnit({ ...editingUnit, price_per_sqft: parseInt(e.target.value) || 0 })}
                             placeholder="Price per sqft"
                           />
                         </div>
                         <div>
                           <Label>Service Charges (AED)</Label>
                           <Input
                             type="number"
                             value={editingUnit.service_charges}
                             onChange={(e) => setEditingUnit({ ...editingUnit, service_charges: parseInt(e.target.value) || 0 })}
                             placeholder="Service charges"
                           />
                         </div>
                         <div>
                           <Label>Payment Plan</Label>
                           <Input
                             value={editingUnit.payment_plan}
                             onChange={(e) => setEditingUnit({ ...editingUnit, payment_plan: e.target.value })}
                             placeholder="e.g., 10% Down Payment"
                           />
                         </div>
                         <div>
                           <Label>Video Tour URL</Label>
                           <Input
                             value={editingUnit.video_tour_url || ''}
                             onChange={(e) => setEditingUnit({ ...editingUnit, video_tour_url: e.target.value })}
                             placeholder="https://..."
                           />
                         </div>
                         <div className="flex items-center space-x-2">
                           <Checkbox
                             checked={editingUnit.has_balcony}
                             onCheckedChange={(checked) => setEditingUnit({ ...editingUnit, has_balcony: !!checked })}
                           />
                           <Label>Has Balcony</Label>
                         </div>
                       </div>
                       <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                         <Button 
                           onClick={handleCancelEdit}
                           variant="outline"
                         >
                           Cancel
                         </Button>
                         <Button 
                           onClick={handleUpdateUnit}
                           style={{ backgroundColor: '#455560' }}
                           className="text-white hover:opacity-90"
                         >
                           Save Changes
                         </Button>
                       </div>
                     </div>
                   ) : (
                     // View mode
                     <div>
                       <div className="flex justify-between items-start mb-3">
                         <h4 className="font-semibold text-gray-800">{unit.unit_code}</h4>
                         <div className="flex items-center space-x-2">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleEditUnit(index)}
                             className="text-blue-600 hover:text-blue-700"
                           >
                             Edit
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleRemoveUnit(index)}
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
                           <span className="font-medium text-gray-600">Price/Sqft:</span>
                           <p>AED {unit.price_per_sqft ? formatPrice(unit.price_per_sqft) : '0'}</p>
                         </div>
                         <div>
                           <span className="font-medium text-gray-600">Balcony:</span>
                           <p>{unit.has_balcony ? 'Yes' : 'No'}</p>
                         </div>
                       </div>
                     </div>
                   )}

                  {(unit.cover_image || unit.gallery_images?.length || unit.brochure_pdf || unit.other_documents?.length) && (
                    <div className="mt-3 pt-3 border-t">
                      <span className="text-xs font-medium text-gray-600 block mb-2">Media Files:</span>
                      <div className="flex gap-2 text-xs">
                        {unit.cover_image && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Cover Image</span>}
                        {unit.gallery_images?.length && <span className="bg-green-100 text-green-800 px-2 py-1 rounded">{unit.gallery_images.length} Gallery Images</span>}
                        {unit.brochure_pdf && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Brochure</span>}
                        {unit.video_tour_url && <span className="bg-red-100 text-red-800 px-2 py-1 rounded">Video Tour</span>}
                        {unit.other_documents?.length && <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">{unit.other_documents.length} Other Documents</span>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default UnifiedProjectForm;