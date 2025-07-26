
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDeveloperAuth } from '@/hooks/useDeveloperAuth';
import ProjectBasicInfo from './ProjectBasicInfo';
import ProjectLocationDetails from './ProjectLocationDetails';
import ProjectUnitDetails from './ProjectUnitDetails';
import ProjectAmenities from './ProjectAmenities';
import ProjectPricingDetails from './ProjectPricingDetails';
import ProjectContactInfo from './ProjectContactInfo';
import ProjectMediaUpload from './ProjectMediaUpload';

interface ContactInfo {
  name: string;
  phone: string;
  email: string;
}

interface ProjectFormData {
  project_title: string;
  developer_name: string;
  emirate: string;
  region_area: string;
  project_type: string;
  description: string;
  project_status?: string;
  listing_type?: string;
  starting_price_aed?: number;
  price_per_sqft?: number;
  service_charges?: number;
  payment_plan?: string;
  contacts?: ContactInfo[];
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
  const { profile } = useDeveloperAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initializeFormData = () => {
    const baseData = {
      project_title: '',
      developer_name: '',
      emirate: '',
      region_area: '',
      project_type: '',
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
    };

    if (editProject) {
      return {
        ...baseData,
        project_title: editProject.project_title || '',
        developer_name: editProject.developer_name || profile?.developer_name || '',
        emirate: editProject.emirate || '',
        region_area: editProject.region_area || '',
        project_type: editProject.project_type || '',
        description: editProject.description || '',
        project_status: editProject.project_status || 'planned',
        listing_type: editProject.listing_type || '',
        starting_price_aed: editProject.starting_price_aed || 0,
        price_per_sqft: editProject.price_per_sqft || 0,
        service_charges: editProject.service_charges || 0,
        payment_plan: editProject.payment_plan || '',
        contacts: editProject.sales_contact_name ? [{
          name: editProject.sales_contact_name || '',
          phone: editProject.sales_phone || '',
          email: editProject.sales_email || ''
        }] : [{ name: '', phone: '', email: '' }],
        cover_image: editProject.cover_image_url || '',
        gallery_images: editProject.gallery_images || [],
        brochure_pdf: editProject.brochure_url || '',
        video_tour_url: editProject.video_tour_url || '',
        other_documents: editProject.other_documents || [],
        amenities: editProject.amenities || [],
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

  const handleInputChange = (field: string, value: string | boolean | string[] | any[] | ContactInfo[]) => {
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
    
    if (!formData.project_title) errors.push('Project Name');
    if (!formData.developer_name) errors.push('Developer Name');
    if (!formData.project_type) errors.push('Project Type');
    if (!formData.listing_type) errors.push('Listing Type');
    if (!formData.project_status) errors.push('Completion Status');
    if (!formData.emirate) errors.push('Emirate');
    if (!formData.region_area) errors.push('Region/Area');
    if (!formData.location_description) errors.push('Location Description');
    if (!formData.starting_price_aed || formData.starting_price_aed <= 0) errors.push('Starting Price');
    
    // Check contacts
    if (!formData.contacts || formData.contacts.length === 0) {
      errors.push('Contact Information');
    } else {
      const firstContact = formData.contacts[0];
      if (!firstContact.name) errors.push('Contact Name');
      if (!firstContact.phone) errors.push('Phone Number');
      if (!firstContact.email) errors.push('Email');
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
    // Validate mandatory fields
    const validationErrors = validateMandatoryFields();
    if (validationErrors.length > 0) {
      toast.error(`Please fill in the following mandatory fields: ${validationErrors.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (!profile?.id) {
        toast.error("You must be logged in as a developer to submit a project.");
        return;
      }

      // Generate project ID if creating new project
      let projectId = editProject?.project_id;
      if (!editProject) {
        // Generate a simple project ID since the RPC function doesn't exist
        const timestamp = Date.now();
        projectId = `PROJ${timestamp.toString().slice(-8)}`;
      }

      // Extract first contact for backward compatibility
      const firstContact = formData.contacts?.[0] || { name: '', phone: '', email: '' };

      const projectData = {
        project_id: projectId,
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
        has_balcony: formData.has_balcony,
        developer_id: profile.id,
        user_id: profile.user_id,
        source: 'app data'
      };

      let result;
      if (editProject) {
        result = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editProject.id)
          .select();
      } else {
        result = await supabase
          .from('projects')
          .insert([projectData])
          .select();
      }

      const { data, error } = result;

      if (error) {
        console.error("Error submitting project:", error);
        toast.error(`Failed to ${editProject ? 'update' : 'submit'} project: ${error.message}`);
      } else {
        toast.success(`Project ${editProject ? 'updated' : 'submitted'} successfully!`);
        console.log("Project submitted successfully:", data);

        // ✅ Send to n8n Webhook
        try {
          const webhookRes = await fetch('https://shafil.app.n8n.cloud/webhook/project-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(projectData),
          });

          if (!webhookRes.ok) {
            console.warn("n8n webhook call failed:", await webhookRes.text());
          } else {
            console.log("Project sent to n8n webhook successfully.");
          }
        } catch (webhookError) {
          console.error("Error posting to n8n webhook:", webhookError);
        }

        // Reset form or call onSave
        if (onSave) {
          onSave();
        } else if (!editProject) {
          setFormData(initializeFormData());
          setCurrentStep(0);
        }
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
      id: 'basic',
      title: 'Basic Information',
      component: <ProjectBasicInfo formData={formData} handleInputChange={handleInputChange} />
    },
    {
      id: 'location',
      title: 'Location Details',
      component: <ProjectLocationDetails formData={formData} handleInputChange={handleInputChange} />
    },
    {
      id: 'units',
      title: 'Unit Details',
      component: <ProjectUnitDetails formData={formData} handleInputChange={handleInputChange} />
    },
    {
      id: 'amenities',
      title: 'Amenities',
      component: <ProjectAmenities formData={formData} handleInputChange={handleInputChange} handleArrayChange={handleArrayChange} />
    },
    {
      id: 'pricing',
      title: 'Pricing & Financials',
      component: <ProjectPricingDetails formData={formData} handleInputChange={handleInputChange} />
    },
  {
  id: 'contact',
  title: 'Contact Information',
  component: (
    <ProjectContactInfo
      formData={{ contacts: formData.contacts || [{ name: '', phone: '', email: '' }] }}
      handleInputChange={(field, value) => handleInputChange(field, value)}
    />
  )
},
    {
      id: 'media',
      title: 'Media Upload',
      component: <ProjectMediaUpload formData={formData} handleInputChange={handleInputChange} />
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">{editProject ? 'Edit Project' : 'Add New Project'}</h2>

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
