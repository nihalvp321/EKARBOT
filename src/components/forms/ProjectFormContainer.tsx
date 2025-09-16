
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDeveloperAuth } from '@/hooks/useDeveloperAuth';
import DocumentAutofill from '../DocumentAutofill';
import UnifiedProjectForm from './UnifiedProjectForm';
import ProjectLocationDetails from './ProjectLocationDetails';
import ProjectAmenities from './ProjectAmenities';
import ProjectContactInfo from './ProjectContactInfo';
import ProjectExcelImport from './ProjectExcelImport';
import ProjectMediaImport from './ProjectMediaImport';
import { validateProjectTitle, validateEmail, validatePhoneNumber } from '@/utils/inputValidation';
import { FileSpreadsheet, FolderOpen, Plus } from 'lucide-react';

interface ContactInfo {
  name: string;
  phone: string;
  email: string;
}

  interface ProjectFormData {
    project_id?: string;
    project_title: string;
    developer_name: string;
    developer_id?: string;
    emirate: string;
    region_area: string;
    project_type: string;
    project_subtype?: string;
    description: string;
    project_status?: string;
    listing_type?: string;
  starting_price_aed?: number;
  price_per_sqft?: number;
  service_charges?: number;
  payment_plan?: string;
  contacts?: ContactInfo[];
  units?: any[];
  cover_image?: string;
  gallery_images?: string[];
  brochure_pdf?: string;
  video_tour_url?: string;
  other_documents?: any[];
  amenities?: string[];
  latitude?: number;
  longitude?: number;
  street_name?: string;
  pincode?: string;
  address?: string;
  location_description?: string;
  google_maps_link?: string;
  handover_date?: string;
  ownership_type?: string;
  rera_approval_id?: string;
  unit_sizes_range?: string;
  bedrooms_range?: string;
  bathrooms_range?: string;
  furnishing_status?: string;
  has_balcony?: boolean;
}


interface ProjectFormContainerProps {
  editProject?: any;
  onSave?: () => void;
  autoFillData?: any;
}

const ProjectFormContainer = ({ editProject, onSave, autoFillData }: ProjectFormContainerProps) => {
  const { profile, user } = useDeveloperAuth();
  const [currentStep, setCurrentStep] = useState<number>(() => {
    const saved = localStorage.getItem('developer.addProject.step');
    return saved ? parseInt(saved, 10) || 0 : 0;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    localStorage.setItem('developer.addProject.step', String(currentStep));
  }, [currentStep]);
  const initializeFormData = () => {
    const baseData = {
      project_title: '',
      developer_name: '',
      emirate: '',
      region_area: '',
      project_type: '',
      project_subtype: '',
      description: '',
      project_status: 'planned',
      listing_type: '',
      starting_price_aed: 0,
      price_per_sqft: 0,
      service_charges: 0,
      payment_plan: '',
      contacts: [{ name: '', phone: '', email: '' }],
      cover_image: '',
      gallery_images: [],
      brochure_pdf: '',
      video_tour_url: '',
      other_documents: [],
      amenities: [],
      latitude: 0,
      longitude: 0,
      street_name: '',
      pincode: '',
      address: '',
      location_description: '',
      google_maps_link: '',
      handover_date: '',
      ownership_type: '',
      rera_approval_id: '',
      unit_sizes_range: '',
      bedrooms_range: '',
      bathrooms_range: '',
      furnishing_status: '',
      has_balcony: false,
      units: [],
    };

    if (editProject) {
      console.log('Edit project data received:', editProject);
      console.log('Edit project keys:', Object.keys(editProject));
      
      return {
        ...baseData,
        project_title: editProject.project_title || '',
        developer_name: editProject.developer_name || profile?.developer_name || '',
        emirate: editProject.emirate || '',
        region_area: editProject.region_area || '',
        project_type: editProject.project_type || '',
        project_subtype: editProject.project_subtype || '',
        description: editProject.description || '',
        project_status: editProject.project_status || 'planned',
        listing_type: editProject.listing_type || '',
        starting_price_aed: editProject.starting_price_aed || 0,
        price_per_sqft: editProject.price_per_sqft || 0,
        service_charges: editProject.service_charges || 0,
        payment_plan: editProject.payment_plan || '',
        contacts: (() => {
          let contacts = editProject.contacts;
          // Parse JSON string if necessary
          if (typeof contacts === 'string') {
            try {
              contacts = JSON.parse(contacts);
            } catch (e) {
              contacts = null;
            }
          }
          // Check if we have valid contacts array
          if (Array.isArray(contacts) && contacts.length > 0) {
            return contacts;
          }
          // Fallback to sales contact info
          if (editProject.sales_contact_name) {
            return [{
              name: editProject.sales_contact_name || '',
              phone: editProject.sales_phone || '',
              email: editProject.sales_email || ''
            }];
          }
          // Default empty contact
          return [{ name: '', phone: '', email: '' }];
        })(),
        cover_image: editProject.cover_image_url || '',
        gallery_images: Array.isArray(editProject.gallery_images) ? editProject.gallery_images : [],
        brochure_pdf: editProject.brochure_url || '',
        video_tour_url: editProject.video_tour_url || '',
        other_documents: Array.isArray(editProject.other_documents) ? editProject.other_documents : [],
        amenities: Array.isArray(editProject.amenities) ? editProject.amenities : [],
        latitude: editProject.latitude || 0,
        longitude: editProject.longitude || 0,
        street_name: editProject.street_name || '',
        pincode: editProject.pincode || '',
        address: editProject.address || '',
        location_description: editProject.location_description || '',
        google_maps_link: editProject.google_maps_link || '',
        handover_date: editProject.handover_date || '',
        ownership_type: editProject.ownership_type || '',
        rera_approval_id: editProject.rera_approval_id || '',
        unit_sizes_range: editProject.unit_sizes_range || '',
        bedrooms_range: editProject.bedrooms_range || '',
        bathrooms_range: editProject.bathrooms_range || '',
        furnishing_status: editProject.furnishing_status || '',
        has_balcony: editProject.has_balcony || false,
        units: editProject.units || [],
        project_id: editProject.project_id,
      };
    }

    if (autoFillData) {
      return {
        ...baseData,
        developer_name: profile?.developer_name || baseData.developer_name,
        ...autoFillData
      };
    }

    return baseData;
  };

  const [formData, setFormData] = useState<ProjectFormData>(() => {
    // Restore draft from localStorage if available and not editing
    if (!editProject) {
      const saved = localStorage.getItem('developer.addProject.formData');
      if (saved) {
        try {
          const restored = JSON.parse(saved);
          console.log('Restored formData from localStorage:', restored);
          // Ensure units array exists and is properly restored
          if (restored.units && Array.isArray(restored.units)) {
            console.log('Restored units:', restored.units.length);
            return restored;
          }
        } catch (e) {
          console.warn('Failed to parse saved draft form data:', e);
        }
      }
    }
    return initializeFormData();
  });
  const [files, setFiles] = useState<{ [key: string]: File[] }>({});
  const [importMode, setImportMode] = useState<'none' | 'excel' | 'media'>('none');
  const [importedProjectData, setImportedProjectData] = useState<any>(null);

  // Persist form data draft (including units) to localStorage
  useEffect(() => {
    if (!editProject) {
      try {
        localStorage.setItem('developer.addProject.formData', JSON.stringify(formData));
      } catch (e) {
        console.warn('Failed to save draft form data:', e);
      }
    }
  }, [formData, editProject]);

  // Normalize amenities to array to prevent runtime errors
  useEffect(() => {
    const amenities: any = (formData as any).amenities;
    if (!Array.isArray(amenities)) {
      let normalized: string[] = [];
      if (typeof amenities === 'string') {
        try {
          const parsed = JSON.parse(amenities);
          if (Array.isArray(parsed)) {
            normalized = parsed as string[];
          } else if (amenities.trim()) {
            normalized = amenities.split(',').map((s: string) => s.trim()).filter(Boolean);
          }
        } catch {
          if (amenities.trim()) {
            normalized = amenities.split(',').map((s: string) => s.trim()).filter(Boolean);
          }
        }
      }
      setFormData(prev => ({ ...prev, amenities: normalized }));
    }
  }, [formData.amenities]);
  // Re-initialize form data when editProject changes
  useEffect(() => {
    console.log('EditProject changed, re-initializing form data:', editProject);
    const initialData = initializeFormData();
    
    // If editing and no units exist, create a synthetic unit from project data
    if (editProject && (!initialData.units || initialData.units.length === 0)) {
      console.log('Creating synthetic unit from project data for editing');
      const syntheticUnit = {
        id: 'MAIN',
        unit_code: 'MAIN',
        unit_size_range: editProject.unit_sizes_range || '',
        bedrooms_range: editProject.bedrooms_range || '',
        bathrooms_range: editProject.bathrooms_range || '',
        furnishing_status: editProject.furnishing_status || '',
        ownership_type: editProject.ownership_type || '',
        has_balcony: editProject.has_balcony || false,
        starting_price_aed: editProject.starting_price_aed || 0,
        price_per_sqft: editProject.price_per_sqft || 0,
        service_charges: editProject.service_charges || 0,
        payment_plan: editProject.payment_plan || '',
        cover_image: editProject.cover_image_url || '',
        gallery_images: editProject.gallery_images || [],
        brochure_pdf: editProject.brochure_url || '',
        video_tour_url: editProject.video_tour_url || '',
        other_documents: editProject.other_documents || [],
        project_title: editProject.project_title || '',
        developer_name: editProject.developer_name || '',
        description: editProject.description || '',
        project_type: editProject.project_type || '',
        project_subtype: editProject.project_subtype || '',
        listing_type: editProject.listing_type || '',
        project_status: editProject.project_status || '',
        handover_date: editProject.handover_date || '',
        rera_approval_id: editProject.rera_approval_id || ''
      };
      initialData.units = [syntheticUnit];
    }
    
    setFormData(initialData);
  }, [editProject?.project_id, profile?.developer_name]);

  // Update developer name when profile is loaded
  useEffect(() => {
    if (profile?.developer_name && !formData.developer_name) {
      setFormData(prev => ({
        ...prev,
        developer_name: profile.developer_name
      }));
    }
  }, [profile?.developer_name, formData.developer_name]);

  useEffect(() => {
    if (autoFillData) {
      setFormData(prev => ({
        ...prev,
        developer_name: profile?.developer_name || prev.developer_name,
        ...autoFillData
      }));
    }
  }, [autoFillData, profile?.developer_name]);

  const [lastAutoFillData, setLastAutoFillData] = useState<any>(null);

  const handleAutoFillData = (extractedData: any) => {
    console.log('Applying autofill data:', extractedData);
    
    // Apply data to main form fields
    setFormData(prev => ({
      ...prev,
      developer_name: profile?.developer_name || prev.developer_name,
      ...extractedData
    }));
    
    // Store the autofill data to pass to UnifiedProjectForm
    setLastAutoFillData(extractedData);
    
    toast.success('Document data applied! Now available in unit form fields.');
  };

  const handleExcelImport = async (data: any, appendUnits = false) => {
    console.log('Excel import data received:', data, 'appendUnits:', appendUnits);
    
    if (appendUnits) {
      // Only append units, keep existing project data
      setFormData(prev => ({
        ...prev,
        units: [...prev.units, ...data.units]
      }));
      setImportMode('none');
      toast.success('Units appended from Excel successfully!');
      return;
    }
    
    // Full import including project data
    // Auto-populate dropdowns with new values from Excel
    await autoPopulateDropdowns(data);
    
    // Extract all unique amenities from units
    const allAmenities = new Set<string>();
    if (data.units && Array.isArray(data.units)) {
      data.units.forEach((unit: any) => {
        if (unit.amenities && Array.isArray(unit.amenities)) {
          console.log('Unit amenities found:', unit.amenities);
          unit.amenities.forEach((amenity: string) => {
            if (amenity && amenity.trim()) {
              allAmenities.add(amenity.trim());
            }
          });
        }
      });
    }
    
    // Convert Set to Array and add to project level amenities
    const projectAmenities = Array.from(allAmenities);
    console.log('Merged project amenities:', projectAmenities);
    
    setImportedProjectData(data);
    setFormData(prev => { 
      const newFormData = { 
        ...prev, 
        ...data,
        amenities: projectAmenities // Set project-level amenities from all units
      };
      console.log('Updated form data with amenities:', newFormData.amenities);
      return newFormData;
    });
    setImportMode('none');
    toast.success('Project data imported from Excel successfully!');
  };

  const autoPopulateDropdowns = async (importedData: any) => {
    const dropdownCategories = [
      'emirate', 'project_subtype', 'listing_type', 'project_status',
      'ownership_type', 'furnishing_status', 'amenities', 'bedroom_range', 'bathroom_range'
    ];

    for (const category of dropdownCategories) {
      let valuesToAdd: string[] = [];
      
      if (category === 'amenities') {
        // Handle amenities from both project and units
        if (importedData.amenities && Array.isArray(importedData.amenities)) {
          valuesToAdd = [...valuesToAdd, ...importedData.amenities];
        }
        if (importedData.units && Array.isArray(importedData.units)) {
          importedData.units.forEach((unit: any) => {
            if (unit.amenities && Array.isArray(unit.amenities)) {
              valuesToAdd = [...valuesToAdd, ...unit.amenities];
            }
          });
        }
      } else {
        // Handle single values from project level
        if (importedData[category]) {
          valuesToAdd.push(importedData[category]);
        }
        
        // Handle values from units
        if (importedData.units && Array.isArray(importedData.units)) {
          importedData.units.forEach((unit: any) => {
            if (unit[category]) {
              valuesToAdd.push(unit[category]);
            }
          });
        }
      }
      
      // Remove duplicates and empty values
      valuesToAdd = [...new Set(valuesToAdd)].filter(value => value && value.trim());
      
      if (valuesToAdd.length > 0) {
        await addMissingDropdownOptions(category, valuesToAdd);
      }
    }
  };

  const addMissingDropdownOptions = async (category: string, values: string[]) => {
    try {
      // Get existing options for this category
      const { data: existingOptions, error: fetchError } = await supabase
        .from('dropdown_settings')
        .select('value')
        .eq('category', category)
        .eq('is_active', true);

      if (fetchError) {
        console.error('Error fetching existing dropdown options:', fetchError);
        return;
      }

      const existingValues = existingOptions?.map(opt => opt.value) || [];
      const newValues = values.filter(value => !existingValues.includes(value));

      if (newValues.length > 0) {
        // Get the highest display order for this category
        const { data: maxOrderData } = await supabase
          .from('dropdown_settings')
          .select('display_order')
          .eq('category', category)
          .order('display_order', { ascending: false })
          .limit(1);

        const startingOrder = (maxOrderData?.[0]?.display_order || 0) + 1;

        // Insert new options
        const newOptions = newValues.map((value, index) => ({
          category,
          code: value.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          value,
          display_order: startingOrder + index,
          is_active: true
        }));

        const { error: insertError } = await supabase
          .from('dropdown_settings')
          .insert(newOptions);

        if (insertError) {
          console.error('Error inserting new dropdown options:', insertError);
        } else {
          console.log(`Added ${newValues.length} new options for ${category}:`, newValues);
        }
      }
    } catch (error) {
      console.error('Error in addMissingDropdownOptions:', error);
    }
  };

  const handleMediaImport = (mediaData: any) => {
    // Update units with their respective media
    setFormData(prev => ({
      ...prev,
      units: prev.units?.map(unit => {
        const unitMedia = mediaData[unit.unit_code];
        if (unitMedia) {
          return {
            ...unit,
            cover_image: unitMedia.cover_image_url || unit.cover_image,
            gallery_images: [...(unit.gallery_images || []), ...(unitMedia.gallery_images || [])],
            brochure_pdf: unitMedia.brochure_url || unit.brochure_pdf,
            other_documents: [...(unit.other_documents || []), ...(unitMedia.other_documents || [])]
          };
        }
        return unit;
      }) || []
    }));
    setImportMode('none');
    toast.success('Media files imported successfully and linked to units!');
  };

  const resetToManualForm = () => {
    setImportMode('none');
    setImportedProjectData(null);
  };

  const handleInputChange = (field: string, value: string | boolean | string[] | any[] | ContactInfo[] | Date) => {
    console.log(`Updating formData field ${field}:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: string, values: string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: values
    }));
  };

  const handleFileChange = (field: string, selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    const fileArray = Array.from(selectedFiles);
    setFiles(prev => ({
      ...prev,
      [field]: fileArray
    }));
  };

  const validateMandatoryFields = () => {
    const errors = [];

    const hasUnits = Array.isArray(formData.units) && formData.units.length > 0;

    // Only require units for new projects, not when editing existing ones
    if (!editProject && !hasUnits) {
      errors.push('At least one unit must be added');
      return errors;
    }

    if (!formData.developer_name) errors.push('Developer Name');
    if (!formData.project_status) errors.push('Completion Status');
    if (!formData.emirate) errors.push('Emirate');
    if (!formData.region_area) errors.push('Region/Area');
    if (!formData.location_description) errors.push('Location Description');

    // Check contacts
    if (!formData.contacts || formData.contacts.length === 0) {
      errors.push('Contact Information');
    } else {
      const firstContact = formData.contacts[0];
      if (!firstContact.name) errors.push('Contact Name');
      if (!firstContact.phone) {
        errors.push('Phone Number');
      } else if (!validatePhoneNumber(firstContact.phone)) {
        errors.push('Valid Phone Number');
      }
      if (!firstContact.email) {
        errors.push('Email');
      } else if (!validateEmail(firstContact.email)) {
        errors.push('Valid Email Address');
      }
    }

    // Validate only the added units (not the newUnit form)
    for (let i = 0; i < formData.units.length; i++) {
      const unit = formData.units[i];
      if (!unit.unit_code) errors.push(`Unit ${i + 1}: Unit Code`);
      if (!unit.starting_price_aed || unit.starting_price_aed <= 0) errors.push(`Unit ${i + 1}: Starting Price`);
      if (!unit.project_title) errors.push(`Unit ${i + 1}: Project Name`);
      if (!unit.project_type) errors.push(`Unit ${i + 1}: Project Type`);
      if (!unit.listing_type) errors.push(`Unit ${i + 1}: Listing Type`);
    }

    return errors;
  };

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    // Debug form data before validation
    console.log('Form data at submission:', {
      project_title: formData.project_title,
      project_type: formData.project_type,
      listing_type: formData.listing_type,
      developer_name: formData.developer_name,
      emirate: formData.emirate,
      region_area: formData.region_area
    });

    // Validate mandatory fields
    const validationErrors = validateMandatoryFields();
    if (validationErrors.length > 0) {
      console.log('Validation errors:', validationErrors);
      toast.error(`Please fill in the following mandatory fields: ${validationErrors.join(', ')}`);
      return;
    }

    console.log('Profile data:', profile);
    console.log('Available profile fields:', Object.keys(profile || {}));
    
    setIsSubmitting(true);
    try {
      if (!profile?.id) {
        toast.error("Developer profile not found. Please contact support.");
        return;
      }

      // Extract first contact for backward compatibility
      const firstContact = formData.contacts?.[0] || { name: '', phone: '', email: '' };

      if (!editProject && formData.units && formData.units.length > 0) {
        // Create separate project entry for each unit
        const projectCreationPromises = formData.units.map(async (unit: any, index: number) => {
          // Generate unique project ID for each unit
          const timestamp = Date.now();
          const unitProjectId = `PROJ${timestamp.toString().slice(-8)}-${index + 1}`;

          const projectData = {
            project_id: unitProjectId,
            project_title: unit.project_title && unit.project_title.trim() ? unit.project_title : (formData.project_title && formData.project_title.trim() ? `${formData.project_title} - ${unit.unit_code}` : `Project - ${unit.unit_code}`),
            developer_name: profile?.developer_name || formData.developer_name,
            emirate: formData.emirate,
            region_area: formData.region_area,
            project_type: unit.project_type || formData.project_type,
            project_subtype: unit.project_subtype || formData.project_subtype,
            description: unit.description || formData.description,
            project_status: unit.project_status || formData.project_status,
            listing_type: unit.listing_type || formData.listing_type,
            starting_price_aed: unit.starting_price_aed || null,
            price_per_sqft: unit.price_per_sqft || null,
            service_charges: unit.service_charges || null,
            payment_plan: unit.payment_plan,
            cover_image_url: unit.cover_image || '',
            gallery_images: unit.gallery_images || [],
            brochure_url: unit.brochure_pdf || '',
            video_tour_url: unit.video_tour_url || '',
            other_documents: unit.other_documents || [],
            amenities: formData.amenities,
            contacts: JSON.stringify(formData.contacts),
            sales_contact_name: firstContact.name,
            sales_email: firstContact.email,
            sales_phone: firstContact.phone,
            latitude: formData.latitude || null,
            longitude: formData.longitude || null,
            street_name: formData.street_name,
            pincode: formData.pincode,
            address: formData.address,
            location_description: formData.location_description,
            google_maps_link: formData.google_maps_link,
            handover_date: (() => {
              const dateStr = unit.handover_date || formData.handover_date;
              if (!dateStr) return null;
              
              // Handle DD-MM-YYYY format
              if (dateStr.includes('-') && dateStr.split('-')[0].length <= 2) {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                  return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
              }
              
              // Handle DD/MM/YYYY format  
              if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                  return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
              }
              
              // Try direct parsing as fallback
              try {
                return new Date(dateStr).toISOString().split('T')[0];
              } catch {
                return null;
              }
            })(),
            ownership_type: unit.ownership_type,
            rera_approval_id: unit.rera_approval_id || formData.rera_approval_id,
            unit_sizes_range: unit.unit_size_range,
            bedrooms_range: unit.bedrooms_range,
            bathrooms_range: unit.bathrooms_range,
            furnishing_status: unit.furnishing_status,
            has_balcony: unit.has_balcony,
            developer_id: profile?.id,
            user_id: user?.id,
            source: 'app data'
          };

          const result = await supabase
            .from('projects')
            .insert([projectData])
            .select();

          if (result.error) {
            throw new Error(`Failed to create project for unit ${unit.unit_code}: ${result.error.message}`);
          }

          // Create corresponding unit entry
          if (result.data && result.data[0]) {
            const unitData = {
              project_id: unitProjectId,
              unit_code: unit.unit_code,
              unit_size_range: unit.unit_size_range,
              bedrooms_range: unit.bedrooms_range,
              bathrooms_range: unit.bathrooms_range,
              furnishing_status: unit.furnishing_status,
              ownership_type: unit.ownership_type,
              has_balcony: unit.has_balcony,
              starting_price_aed: unit.starting_price_aed,
              price_per_sqft: unit.price_per_sqft,
              service_charges: unit.service_charges,
              payment_plan: unit.payment_plan
            };

            const { error: unitError } = await (supabase as any)
              .from('project_units')
              .insert([unitData]);

            if (unitError) {
              console.error("Error inserting unit:", unitError);
            }
          }

          return result.data[0];
        });

        await Promise.all(projectCreationPromises);
        toast.success(`${formData.units.length} project(s) created successfully!`);
        // Clear draft after successful creation
        localStorage.removeItem('developer.addProject.formData');

      } else if (editProject) {
        // Update existing project
        // Use the first unit's data if available, otherwise use form data
        const firstUnit = formData.units && formData.units.length > 0 ? formData.units[0] : null;
        
        const projectData = {
          project_title: firstUnit?.project_title || formData.project_title,
          developer_name: profile?.developer_name || formData.developer_name,
          emirate: formData.emirate,
          region_area: formData.region_area,
          project_type: firstUnit?.project_type || formData.project_type,
          project_subtype: firstUnit?.project_subtype || formData.project_subtype,
          description: firstUnit?.description || formData.description,
          project_status: firstUnit?.project_status || formData.project_status,
          listing_type: firstUnit?.listing_type || formData.listing_type,
          starting_price_aed: firstUnit?.starting_price_aed || formData.starting_price_aed || null,
          price_per_sqft: firstUnit?.price_per_sqft || formData.price_per_sqft || null,
          service_charges: firstUnit?.service_charges || formData.service_charges || null,
          payment_plan: firstUnit?.payment_plan || formData.payment_plan,
          cover_image_url: firstUnit?.cover_image || formData.cover_image,
          gallery_images: firstUnit?.gallery_images || formData.gallery_images,
          brochure_url: firstUnit?.brochure_pdf || formData.brochure_pdf,
          video_tour_url: firstUnit?.video_tour_url || formData.video_tour_url,
          other_documents: firstUnit?.other_documents || formData.other_documents,
          amenities: formData.amenities,
          contacts: JSON.stringify(formData.contacts),
          sales_contact_name: firstContact.name,
          sales_email: firstContact.email,
          sales_phone: firstContact.phone,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
          street_name: formData.street_name,
          pincode: formData.pincode,
          address: formData.address,
          location_description: formData.location_description,
          google_maps_link: formData.google_maps_link,
          handover_date: (() => {
            const dateStr = firstUnit?.handover_date || formData.handover_date;
            if (!dateStr) return null;
            
            // Handle DD-MM-YYYY format
            if (dateStr.includes('-') && dateStr.split('-')[0].length <= 2) {
              const parts = dateStr.split('-');
              if (parts.length === 3) {
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
            }
            
            // Handle DD/MM/YYYY format  
            if (dateStr.includes('/')) {
              const parts = dateStr.split('/');
              if (parts.length === 3) {
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
            }
            
            // Try direct parsing as fallback
            try {
              return new Date(dateStr).toISOString().split('T')[0];
            } catch {
              return null;
            }
          })(),
          ownership_type: firstUnit?.ownership_type || formData.ownership_type,
          rera_approval_id: firstUnit?.rera_approval_id || formData.rera_approval_id,
          unit_sizes_range: firstUnit?.unit_size_range || formData.unit_sizes_range,
          bedrooms_range: firstUnit?.bedrooms_range || formData.bedrooms_range,
          bathrooms_range: firstUnit?.bathrooms_range || formData.bathrooms_range,
          furnishing_status: firstUnit?.furnishing_status || formData.furnishing_status,
          has_balcony: firstUnit?.has_balcony || formData.has_balcony
        };

        const result = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editProject.id)
          .select();

        if (result.error) {
          console.error("Error updating project:", result.error);
          toast.error(`Failed to update project: ${result.error.message}`);
          return;
        }

        toast.success('Project updated successfully!');
      }

      // Reset form or call onSave
      if (onSave) {
        onSave();
      } else if (!editProject) {
        setFormData(initializeFormData());
        setCurrentStep(0);
      }

    } catch (error) {
      console.error("Error submitting project:", error);
      toast.error(`Failed to ${editProject ? 'update' : 'submit'} project. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      id: 'unified',
      title: 'Project & Units Information',
      component: <UnifiedProjectForm 
        formData={formData} 
        handleInputChange={handleInputChange} 
        handleArrayChange={handleArrayChange}
        editProject={editProject}
        autoFillData={lastAutoFillData}
      />
    },
    {
      id: 'location',
      title: 'Location Details',
      component: <ProjectLocationDetails formData={formData} handleInputChange={handleInputChange} editProject={editProject} />
    },
    {
      id: 'amenities',
      title: 'Amenities & Features',
      component: (
        <ProjectAmenities 
          formData={formData} 
          handleInputChange={handleInputChange} 
          handleArrayChange={handleArrayChange}
          showProjectAmenities
        />
      )
    },
    {
      id: 'contacts',
      title: 'Contact Information',
      component: <ProjectContactInfo 
        formData={formData} 
        handleInputChange={handleInputChange}
      />
    }
  ];

  // Show import dialogs
  if (importMode === 'excel') {
    return (
      <div className="container mx-auto px-4 py-8">
        <ProjectExcelImport
          onImport={handleExcelImport}
          onClose={() => setImportMode('none')}
          existingUnits={formData.units}
        />
      </div>
    );
  }

  if (importMode === 'media') {
    return (
      <div className="container mx-auto px-4 py-8">
        <ProjectMediaImport
          projectId={editProject?.project_id}
          onImport={handleMediaImport}
          onClose={() => setImportMode('none')}
          excelUnits={formData.units?.map((unit: any) => unit.unit_code) || importedProjectData?.units?.map((unit: any) => unit.unit_code) || []}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Import Options for New Projects */}
      {!editProject && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Add New Project</h2>
            <p className="text-gray-600 mb-6">Choose how you want to add your project:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => setImportMode('excel')}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-3"
              >
                <FileSpreadsheet className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-medium">Import from Excel</div>
                  <div className="text-sm text-gray-600">Upload project data from Excel file</div>
                </div>
              </Button>
              
              <Button
                onClick={() => setImportMode('media')}
                variant="outline"
                className={`h-auto p-4 flex flex-col items-center gap-3 ${
                  (!formData.units || formData.units.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={!formData.units || formData.units.length === 0}
              >
                <FolderOpen className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-medium">Import Media</div>
                  <div className="text-sm text-gray-600">
                    {(!formData.units || formData.units.length === 0) ? 'Import Excel data first' : 'Upload project images & documents'}
                  </div>
                </div>
              </Button>
            </div>

            {importedProjectData && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  ✓ Project data imported from Excel. You can review and edit the details below, or import media files.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <h2 className="text-2xl font-bold mb-4">{editProject ? 'Edit Project' : 'Project Details'}</h2>

      {!editProject && (
        <DocumentAutofill onAutoFillData={handleAutoFillData} />
      )}

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Step {currentStep + 1} of {steps.length}</span>
          <span className="text-sm font-medium">{steps[currentStep].title}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          {steps[currentStep].component}
          
          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            {currentStep === steps.length - 1 ? (
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (editProject ? 'Updating...' : 'Submitting...') : (editProject ? 'Update Project' : 'Submit Project')}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectFormContainer;
