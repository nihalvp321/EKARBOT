import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDeveloperAuth } from '@/hooks/useDeveloperAuth';
import { toast } from 'sonner';

interface ContactInfo {
  name: string;
  phone: string;
  email: string;
}

interface FormData {
  project_title: string;
  developer_name: string;
  description: string;
  project_type: string;
  listing_type: string;
  project_status: string;
  handover_date: string;
  total_units: string;
  city: string;
  community: string;
  sub_community: string;
  nearby_landmarks: string;
  starting_price_aed: string;
  price_per_sqft: string;
  payment_plan: string;
  service_charges: string;
  unit_sizes_range: string;
  bedrooms_range: string;
  bathrooms_range: string;
  has_balcony: boolean;
  furnishing_status: string;
  ownership_type: string;
  amenities: string[];
  parking_spaces: string;
  has_security: boolean;
  security_details: string;
  has_elevators: boolean;
  cover_image_url: string;
  brochure_url: string;
  video_tour_url: string;
  sales_contact_name: string;
  sales_phone: string;
  sales_email: string;
  contacts: ContactInfo[];
}

const initialFormData: FormData = {
  project_title: '',
  developer_name: '',
  description: '',
  project_type: '',
  listing_type: '',
  project_status: '',
  handover_date: '',
  total_units: '',
  city: '',
  community: '',
  sub_community: '',
  nearby_landmarks: '',
  starting_price_aed: '',
  price_per_sqft: '',
  payment_plan: '',
  service_charges: '',
  unit_sizes_range: '',
  bedrooms_range: '',
  bathrooms_range: '',
  has_balcony: false,
  furnishing_status: '',
  ownership_type: '',
  amenities: [],
  parking_spaces: '',
  has_security: false,
  security_details: '',
  has_elevators: false,
  cover_image_url: '',
  brochure_url: '',
  video_tour_url: '',
  sales_contact_name: '',
  sales_phone: '',
  sales_email: '',
  contacts: [{ name: '', phone: '', email: '' }]
};

export const useProjectForm = (editProject?: any, autoFillData?: any, onSave?: () => void) => {
  const { user, profile } = useDeveloperAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [files, setFiles] = useState<{[key: string]: FileList | null}>({
    cover_image: null,
    gallery_images: null,
    brochure: null,
    legal_documents: null,
    other_documents: null
  });

  useEffect(() => {
    if (autoFillData) {
      setFormData(prev => ({
        ...prev,
        ...autoFillData
      }));
    }
  }, [autoFillData]);

  useEffect(() => {
    if (editProject) {
      setFormData({
        project_title: editProject.project_title || '',
        developer_name: editProject.developer_name || '',
        description: editProject.description || '',
        project_type: editProject.project_type || '',
        listing_type: editProject.listing_type || '',
        project_status: editProject.project_status || '',
        handover_date: editProject.handover_date || '',
        total_units: editProject.total_units?.toString() || '',
        city: editProject.city || '',
        community: editProject.community || '',
        sub_community: editProject.sub_community || '',
        nearby_landmarks: editProject.nearby_landmarks || '',
        starting_price_aed: editProject.starting_price_aed?.toString() || '',
        price_per_sqft: editProject.price_per_sqft?.toString() || '',
        payment_plan: editProject.payment_plan || '',
        service_charges: editProject.service_charges?.toString() || '',
        unit_sizes_range: editProject.unit_sizes_range || '',
        bedrooms_range: editProject.bedrooms_range || '',
        bathrooms_range: editProject.bathrooms_range || '',
        has_balcony: editProject.has_balcony || false,
        furnishing_status: editProject.furnishing_status || '',
        ownership_type: editProject.ownership_type || '',
        amenities: Array.isArray(editProject.amenities) ? editProject.amenities as string[] : [],
        parking_spaces: editProject.parking_spaces?.toString() || '',
        has_security: editProject.has_security || false,
        security_details: editProject.security_details || '',
        has_elevators: editProject.has_elevators || false,
        cover_image_url: editProject.cover_image_url || '',
        brochure_url: editProject.brochure_url || '',
        video_tour_url: editProject.video_tour_url || '',
        sales_contact_name: editProject.sales_contact_name || '',
        sales_phone: editProject.sales_phone || '',
        sales_email: editProject.sales_email || '',
        contacts: Array.isArray(editProject.contacts) ? editProject.contacts : [{ name: '', phone: '', email: '' }]
      });
    }
  }, [editProject]);

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: string, values: string[]) => {
    setFormData(prev => ({ ...prev, [field]: values }));
  };

  const handleFileChange = (field: string, files: FileList | null) => {
    setFiles(prev => ({ ...prev, [field]: files }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setFiles({
      cover_image: null,
      gallery_images: null,
      brochure: null,
      legal_documents: null,
      other_documents: null
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile) {
      toast.error('You must be logged in to add a project');
      return;
    }

    setIsSubmitting(true);

    try {
      let generatedProjectId = null;
      if (!editProject) {
        // Generate a simple project ID since the RPC function doesn't exist
        const timestamp = Date.now();
        generatedProjectId = `PROJ${timestamp.toString().slice(-8)}`;
      }

      const projectData = {
        ...(generatedProjectId && { project_id: generatedProjectId }),
        project_title: formData.project_title,
        developer_name: formData.developer_name,
        developer_id: profile.developer_id || profile.id,
        user_id: user.id,
        description: formData.description,
        project_type: formData.project_type,
        listing_type: formData.listing_type,
        project_status: formData.project_status,
        handover_date: formData.handover_date || null,
        total_units: parseInt(formData.total_units) || null,
        city: formData.city,
        community: formData.community,
        sub_community: formData.sub_community,
        nearby_landmarks: formData.nearby_landmarks,
        starting_price_aed: parseInt(formData.starting_price_aed) || null,
        price_per_sqft: parseFloat(formData.price_per_sqft) || null,
        payment_plan: formData.payment_plan,
        service_charges: parseFloat(formData.service_charges) || null,
        unit_sizes_range: formData.unit_sizes_range,
        bedrooms_range: formData.bedrooms_range,
        bathrooms_range: formData.bathrooms_range,
        has_balcony: formData.has_balcony,
        furnishing_status: formData.furnishing_status,
        ownership_type: formData.ownership_type,
        amenities: formData.amenities,
        parking_spaces: parseInt(formData.parking_spaces) || null,
        has_security: formData.has_security,
        security_details: formData.security_details,
        has_elevators: formData.has_elevators,
        cover_image_url: formData.cover_image_url,
        brochure_url: formData.brochure_url,
        video_tour_url: formData.video_tour_url,
        sales_contact_name: formData.sales_contact_name,
        sales_phone: formData.sales_phone,
        sales_email: formData.sales_email,
        contacts: JSON.stringify(formData.contacts),
        source: 'app data'
      };

      let result;
      if (editProject) {
        result = await supabase
          .from('projects')
          .update(projectData)
          .eq('project_id', editProject.project_id);
      } else {
        result = await supabase
          .from('projects')
          .insert(projectData);
      }

      if (result.error) {
        console.error('Error saving project:', result.error);
        toast.error('Failed to save project: ' + result.error.message);
        return;
      }

      toast.success(editProject ? 'Project updated successfully!' : 'Project added successfully!');
      
      if (onSave) {
        onSave();
      }

      if (!editProject) {
        resetForm();
      }

    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    files,
    isSubmitting,
    handleInputChange,
    handleArrayChange,
    handleFileChange,
    handleSubmit
  };
};
