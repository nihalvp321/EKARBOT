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
import { validateProjectTitle, validateEmail, validatePhoneNumber } from '@/utils/inputValidation';

interface ContactInfo {
  name: string;
  phone: string;
  email: string;
}

interface ProjectFormData {
  project_id?: string;
  project_title: string;
  developer_name: string;
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
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const [formData, setFormData] = useState<ProjectFormData>(initializeFormData);

  useEffect(() => {
    console.log('EditProject changed, re-initializing form data:', editProject);
    setFormData(initializeFormData());
  }, [editProject?.project_id, profile?.developer_name]);

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

  const handleAutoFillData = (extractedData: any) => {
    setFormData(prev => ({
      ...prev,
      developer_name: profile?.developer_name || prev.developer_name,
      ...extractedData
    }));
  };

  const handleInputChange = (field: string, value: string | boolean | string[] | any[] | ContactInfo[] | Date) => {
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

  const validateMandatoryFields = () => {
    const errors = [];

    const hasUnits = Array.isArray(formData.units) && formData.units.length > 0;

    const hasProjectName = !!formData.project_title || (hasUnits && formData.units.some((u: any) => !!u.project_title));
    if (!hasProjectName) {
      errors.push('Project Name');
    } else if (!hasUnits && formData.project_title && !validateProjectTitle(formData.project_title)) {
      errors.push('Valid Project Name (3-200 chars, alphanumeric and basic punctuation only)');
    }

    if (!formData.developer_name) errors.push('Developer Name');

    const hasProjectType = !!formData.project_type || (hasUnits && formData.units.some((u: any) => !!u.project_type));
    if (!hasProjectType) errors.push('Project Type');

    const hasListingType = !!formData.listing_type || (hasUnits && formData.units.some((u: any) => !!u.listing_type));
    if (!hasListingType) errors.push('Listing Type');

    if (!formData.project_status) errors.push('Completion Status');
    if (!formData.emirate) errors.push('Emirate');
    if (!formData.region_area) errors.push('Region/Area');
    if (!formData.location_description) errors.push('Location Description');

    const hasValidUnitPrices = hasUnits && formData.units.some((unit: any) => unit.starting_price_aed > 0);
    if (!hasUnits && (!formData.starting_price_aed || formData.starting_price_aed <= 0)) {
      errors.push('Starting Price (must be greater than 0)');
    } else if (hasUnits && !hasValidUnitPrices) {
      errors.push('At least one unit must have a starting price greater than 0');
    }

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

    if (hasUnits) {
      for (let i = 0; i < formData.units.length; i++) {
        const unit = formData.units[i];
        if (!unit.unit_code) errors.push(`Unit ${i + 1}: Unit Code`);
        // if (!unit.bedrooms_range) errors.push(`Unit ${i + 1}: Bedrooms`);
        if (!unit.starting_price_aed || unit.starting_price_aed <= 0) errors.push(`Unit ${i + 1}: Starting Price`);
        if (!formData.project_title && !unit.project_title) errors.push(`Unit ${i + 1}: Project Name`);
        if (!formData.project_type && !unit.project_type) errors.push(`Unit ${i + 1}: Project Type`);
        if (!formData.listing_type && !unit.listing_type) errors.push(`Unit ${i + 1}: Listing Type`);
      }
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
    console.log('Form data at submission:', {
      project_title: formData.project_title,
      project_type: formData.project_type,
      listing_type: formData.listing_type,
      developer_name: formData.developer_name,
      emirate: formData.emirate,
      region_area: formData.region_area
    });

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

      const firstContact = formData.contacts?.[0] || { name: '', phone: '', email: '' };

      if (!editProject && formData.units && formData.units.length > 0) {
        const projectCreationPromises = formData.units.map(async (unit: any, index: number) => {
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
            handover_date: unit.handover_date || formData.handover_date || null,
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

      } else if (editProject) {
        const projectData = {
          project_title: formData.project_title,
          developer_name: profile?.developer_name || formData.developer_name,
          emirate: formData.emirate,
          region_area: formData.region_area,
          project_type: formData.project_type,
          description: formData.description,
          project_status: formData.project_status,
          listing_type: formData.listing_type,
          starting_price_aed: formData.starting_price_aed || null,
          price_per_sqft: formData.price_per_sqft || null,
          service_charges: formData.service_charges || null,
          payment_plan: formData.payment_plan,
          cover_image_url: formData.cover_image,
          gallery_images: formData.gallery_images,
          brochure_url: formData.brochure_pdf,
          video_tour_url: formData.video_tour_url,
          other_documents: formData.other_documents,
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
          handover_date: formData.handover_date || null,
          ownership_type: formData.ownership_type,
          rera_approval_id: formData.rera_approval_id,
          unit_sizes_range: formData.unit_sizes_range,
          bedrooms_range: formData.bedrooms_range,
          bathrooms_range: formData.bathrooms_range,
          furnishing_status: formData.furnishing_status,
          has_balcony: formData.has_balcony
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
      />
    },
    {
      id: 'location',
      title: 'Location Details',
      component: <ProjectLocationDetails formData={formData} handleInputChange={handleInputChange} />
    },
    {
      id: 'amenities',
      title: 'Amenities',
      component: <ProjectAmenities formData={formData} handleInputChange={handleInputChange} handleArrayChange={handleArrayChange} />
    },
    {
      id: 'contact',
      title: 'Contact Information',
      component: <ProjectContactInfo formData={formData} handleInputChange={handleInputChange} />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 sm:p-10 transform transition-transform duration-500 ease-in-out hover:scale-[1.01]">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-50 mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-500">
          {editProject ? 'Edit Project' : 'Add New Project'}
        </h2>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-lg mx-auto">
          {editProject ? "Effortlessly update your project details and listings." : "Create a new, professional project listing in a few simple steps."}
        </p>

        {!editProject && (
          <div className="animate-fade-in-down mb-8">
            <DocumentAutofill onAutoFillData={handleAutoFillData} />
            <div className="border-t border-gray-200 dark:border-gray-700 my-8"></div>
          </div>
        )}

        {/* Dynamic Step Indicator with Icons */}
        <div className="mb-10 flex justify-between items-center relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full transform -translate-y-1/2">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700 ease-in-out rounded-full" 
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
          {steps.map((step, index) => (
            <div key={step.id} className="relative z-10 flex-1 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ease-in-out
                  ${currentStep >= index ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-400 dark:bg-gray-600'}
                  transform ${currentStep === index ? 'scale-125' : ''}
                `}
              >
                {index + 1}
              </div>
              <span className={`mt-2 text-xs text-center transition-colors duration-300 ${currentStep === index ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
        
        <Card className="border-none shadow-none animate-slide-in-right">
          <CardContent className="p-0">
            {steps[currentStep].component}
            
            <div className="flex justify-between mt-12">
              <Button 
                variant="outline" 
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="rounded-full px-8 py-3 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                Previous
              </Button>
              
              {currentStep === steps.length - 1 ? (
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="rounded-full px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-500 hover:from-blue-700 hover:to-purple-600 text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editProject ? 'Updating...' : 'Submitting...'}
                    </span>
                  ) : (
                    editProject ? 'Update Project' : 'Submit Project'
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                  className="rounded-full px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-500 hover:from-blue-700 hover:to-purple-600 text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                >
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectFormContainer;