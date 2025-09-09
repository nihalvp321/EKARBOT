import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Upload, X, FileText, Image } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
}

interface ProjectUnitsAndPricingProps {
  projectId?: string;
  units?: Unit[];
  onUnitsChange: (units: Unit[]) => void;
  reraApprovalId?: string;
  onReraChange: (value: string) => void;
  formData: any;
  handleInputChange: (field: string, value: string | any[]) => void;
}

const ProjectUnitsAndPricing = ({ 
  projectId, 
  units = [], 
  onUnitsChange, 
  reraApprovalId = '', 
  onReraChange,
  formData,
  handleInputChange
}: ProjectUnitsAndPricingProps) => {
  const [currentUnits, setCurrentUnits] = useState<Unit[]>(units);
  const [uploading, setUploading] = useState(false);
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
    payment_plan: ''
  });

  useEffect(() => {
    setCurrentUnits(units);
  }, [units]);

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

  const handleNewUnitChange = (field: keyof Unit, value: any) => {
    setNewUnit(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Media upload functions
  const uploadFileToStorage = async (file: File, pathPrefix: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `project-media/${pathPrefix}/${fileName}`;

    const { error } = await supabase.storage
      .from('project-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload failed:', error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('project-images')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl || null;
  };

  const handleFileUpload = async (field: string, files: FileList | null) => {
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

    if (field === 'gallery_images' || field === 'other_documents') {
      const existing = formData[field] || [];
      handleInputChange(field, [...existing, ...uploadedUrls]);
    } else {
      handleInputChange(field, uploadedUrls[0]);
    }

    setUploading(false);
  };

  const removeFile = (field: string, index?: number) => {
    if (field === 'gallery_images' || field === 'other_documents') {
      const currentFiles = formData[field] || [];
      const updatedFiles = currentFiles.filter((_: any, i: number) => i !== index);
      handleInputChange(field, updatedFiles);
    } else {
      handleInputChange(field, '');
    }
  };

  const validateUnit = (unit: Unit): string[] => {
    const errors = [];
    
    if (!unit.unit_code.trim()) errors.push('Unit Code');
    // Bedrooms range is optional
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
      unit_code: newUnit.unit_code || generateUnitCode(),
      id: Date.now().toString() // Temporary ID for frontend
    };

    const updatedUnits = [...currentUnits, unitToAdd];
    setCurrentUnits(updatedUnits);
    onUnitsChange(updatedUnits);
    
    // Reset form
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
      payment_plan: ''
    });

    toast.success('Unit added successfully');
  };

  const handleRemoveUnit = (index: number) => {
    const updatedUnits = currentUnits.filter((_, i) => i !== index);
    setCurrentUnits(updatedUnits);
    onUnitsChange(updatedUnits);
    toast.success('Unit removed successfully');
  };

  const formatPrice = (price: number): string => {
    if (price >= 10000000) return `${(price / 10000000).toFixed(1)}Cr`;
    if (price >= 100000) return `${(price / 100000).toFixed(1)}L`;
    if (price >= 1000) return `${(price / 1000).toFixed(1)}K`;
    return price.toString();
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-2">
        <h3 className="text-lg font-semibold text-gray-800">Units, Pricing & Media</h3>
        <p className="text-sm text-gray-600">Add multiple units with pricing details and upload project media</p>
      </div>

      {/* Project-level RERA ID */}
      <Card>
        <CardHeader>
          <CardTitle className="text-md">Project Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="rera_approval_id">RERA Approval ID</Label>
            <Input
              id="rera_approval_id"
              value={reraApprovalId}
              onChange={(e) => onReraChange(e.target.value)}
              placeholder="RERA-123456"
            />
          </div>
        </CardContent>
      </Card>

      {/* Add New Unit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-md flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add New Unit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Unit Details Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Unit Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_code">Unit Code *</Label>
                <Input
                  id="unit_code"
                  value={newUnit.unit_code}
                  onChange={(e) => handleNewUnitChange('unit_code', e.target.value)}
                  placeholder={generateUnitCode()}
                />
              </div>

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
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Pricing Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="starting_price_aed">Starting Price (AED) *</Label>
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

          <div className="flex justify-end">
            <Button onClick={handleAddUnit} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Units List */}
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
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-gray-800">{unit.unit_code}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveUnit(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-md">Media Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cover Image */}
          <div>
            <Label htmlFor="cover_image">Cover Image</Label>
            <Input
              type="file"
              accept="image/*"
              id="cover_image"
              onChange={(e) => handleFileUpload('cover_image', e.target.files)}
            />
            {formData.cover_image && (
              <div className="relative mt-2">
                <img src={formData.cover_image} alt="cover" className="h-32 rounded" />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => removeFile('cover_image')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Gallery Images */}
          <div>
            <Label htmlFor="gallery_images">Gallery Images</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              id="gallery_images"
              onChange={(e) => handleFileUpload('gallery_images', e.target.files)}
            />
            <div className="grid grid-cols-3 gap-2 mt-2">
              {formData.gallery_images?.map((img: string, i: number) => (
                <div key={i} className="relative">
                  <img src={img} className="h-24 w-full object-cover rounded" />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    onClick={() => removeFile('gallery_images', i)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Brochure PDF */}
          <div>
            <Label htmlFor="brochure_pdf">Brochure PDF</Label>
            <Input
              type="file"
              accept=".pdf"
              id="brochure_pdf"
              onChange={(e) => handleFileUpload('brochure_pdf', e.target.files)}
            />
            {formData.brochure_pdf && (
              <div className="mt-2 flex items-center justify-between bg-gray-100 p-2 rounded">
                <FileText className="h-5 w-5 text-gray-600" />
                <a href={formData.brochure_pdf} className="text-sm text-blue-600 truncate max-w-xs" target="_blank" rel="noreferrer">
                  Brochure PDF
                </a>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFile('brochure_pdf')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Video Tour URL */}
          <div>
            <Label htmlFor="video_tour_url">Video Tour URL</Label>
            <Input
              type="url"
              id="video_tour_url"
              placeholder="https://youtube.com/..."
              value={formData.video_tour_url || ''}
              onChange={(e) => handleInputChange('video_tour_url', e.target.value)}
            />
          </div>

          {/* Other Documents */}
          <div>
            <Label htmlFor="other_documents">Other Documents</Label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              multiple
              id="other_documents"
              onChange={(e) => handleFileUpload('other_documents', e.target.files)}
            />
            {formData.other_documents?.length > 0 && (
              <ul className="mt-2 space-y-1">
                {formData.other_documents.map((doc: string, i: number) => (
                  <li key={i} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                    <span className="truncate text-sm">{doc}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeFile('other_documents', i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {uploading && <p className="text-sm text-blue-500">Uploading files...</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectUnitsAndPricing;