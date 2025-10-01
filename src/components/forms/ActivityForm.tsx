import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDropdownOptions } from '@/components/hooks/useDropdownOptions';
import { CustomAudioRecorder } from '@/components/CustomAudioRecorder';
import { FileIcon } from 'lucide-react';

interface ActivityFormProps {
  onBack: () => void;
  activityId?: string;
  relatedTo?: string;
}

const ActivityForm: React.FC<ActivityFormProps> = ({ onBack, activityId, relatedTo }) => {
  const [formData, setFormData] = useState({
    activity_id: '',
    activity_date: new Date().toISOString().split('T')[0],
    activity_type: '',
    event_type: '',
    description: '',
    activity_description: '',
    created_by: '',
    employee: '',
    lead_id: '',
    customer_id: '',
    media_type: '',
    file_path: '',
    text: '',
    effective_date: ''
  });
  
  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedActivityId, setGeneratedActivityId] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { options: activityTypeOptions } = useDropdownOptions('activity_type');
  const { options: mediaTypeOptions } = useDropdownOptions('media_type');

  useEffect(() => {
    fetchLeadsAndCustomers();
    
    if (activityId) {
      fetchActivityData();
    } else {
      generateActivityId().then(id => {
        setGeneratedActivityId(id);
        setFormData(prev => ({ ...prev, activity_id: id }));
      });
    }
  }, [activityId]);

  useEffect(() => {
    if (relatedTo && leads.length > 0 && customers.length > 0) {
      const [type, id] = relatedTo.split('-');
      if (type === 'lead') {
        setFormData(prev => ({ ...prev, lead_id: id }));
        const lead = leads.find(l => l.lead_id === id);
        if (lead) {
          setFormData(prev => ({ ...prev, description: `Activity for Lead: ${lead.lead_name}` }));
        }
      } else if (type === 'customer') {
        setFormData(prev => ({ ...prev, customer_id: id }));
        const customer = customers.find(c => c.customer_id === id);
        if (customer) {
          setFormData(prev => ({ ...prev, description: `Activity for Customer: ${customer.customer_full_name || customer.customer_name}` }));
        }
      }
    }
  }, [relatedTo, leads, customers]);

  const fetchActivityData = async () => {
    if (!activityId) return;
    
    try {
      const { data, error } = await supabase
        .from('Activity')
        .select('*')
        .eq('activity_id', activityId)
        .single();

      if (error) throw error;
      
      if (data) {
        setFormData({
          activity_id: data.activity_id,
          activity_date: data.activity_date || new Date().toISOString().split('T')[0],
          activity_type: data.activity_type || '',
          event_type: data.event_type || '',
          description: data.description || '',
          activity_description: data.activity_description || '',
          created_by: data.created_by || '',
          employee: data.employee || '',
          lead_id: data.lead_id || '',
          customer_id: data.customer_id || '',
          media_type: data.media_type || '',
          file_path: data.file_path || '',
          text: data.text || '',
          effective_date: data.effective_date || ''
        });
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
      toast.error('Failed to fetch activity data');
    }
  };

  const generateActivityId = async () => {
    try {
      const { data, error } = await supabase
        .from('Activity')
        .select('activity_id')
        .order('activity_id', { ascending: false })
        .limit(1);

      if (error) throw error;

      let newId = 'ACT001';
      if (data && data.length > 0) {
        const lastId = data[0].activity_id;
        const numPart = parseInt(lastId.substring(3)) + 1;
        newId = `ACT${numPart.toString().padStart(3, '0')}`;
      }

      return newId;
    } catch (error) {
      console.error('Error generating activity ID:', error);
      return 'ACT001';
    }
  };

  const fetchLeadsAndCustomers = async () => {
    try {
      const { data: leadsData, error: leadsError } = await supabase
        .from('Lead')
        .select('lead_id, lead_name')
        .order('lead_name');

      if (leadsError) throw leadsError;
      setLeads(leadsData || []);

      const { data: customersData, error: customersError } = await supabase
        .from('Customer')
        .select('customer_id, customer_name, customer_full_name')
        .order('customer_name');

      if (customersError) throw customersError;
      setCustomers(customersData || []);
    } catch (error) {
      console.error('Error fetching leads and customers:', error);
      toast.error('Failed to fetch leads and customers');
    }
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      setUploadProgress(0);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `activities/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('developer-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('developer-files')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleRecordingComplete = (audioUrl: string, transcribedText: string) => {
    handleChange('file_path', audioUrl);
    if (transcribedText.trim()) {
      handleChange('text', transcribedText);
      handleChange('description', transcribedText);
      toast.success('Audio recorded and transcribed successfully');
    } else {
      toast.success('Audio recorded successfully');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setFormData(prev => ({ ...prev, file_path: file.name }));
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'lead_id' && value) {
      const selectedLead = leads.find(lead => lead.lead_id === value);
      if (selectedLead) {
        setFormData(prev => ({ 
          ...prev, 
          customer_id: '',
          description: `Activity for Lead: ${selectedLead.lead_name}`
        }));
      }
    }
    
    if (field === 'customer_id' && value) {
      const selectedCustomer = customers.find(customer => customer.customer_id === value);
      if (selectedCustomer) {
        setFormData(prev => ({ 
          ...prev, 
          lead_id: '',
          description: `Activity for Customer: ${selectedCustomer.customer_full_name || selectedCustomer.customer_name}`
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.activity_type || !formData.activity_date) {
        toast.error('Please fill in required fields');
        setIsSubmitting(false);
        return;
      }

      if (!formData.lead_id && !formData.customer_id) {
        toast.error('Please select a related Lead or Customer');
        setIsSubmitting(false);
        return;
      }

      let finalFilePath = formData.file_path;

      if (uploadedFile) {
        const uploadedPath = await handleFileUpload(uploadedFile);
        if (uploadedPath) {
          finalFilePath = uploadedPath;
        } else {
          toast.error('Failed to upload file');
          setIsSubmitting(false);
          return;
        }
      }

      const activityData = {
        activity_id: formData.activity_id || '',
        activity_date: formData.activity_date,
        activity_type: formData.activity_type,
        event_type: formData.event_type,
        description: formData.description,
        activity_description: formData.activity_description,
        created_by: formData.created_by,
        employee: formData.employee,
        lead_id: formData.lead_id || null,
        customer_id: formData.customer_id || null,
        media_type: formData.media_type || null,
        file_path: finalFilePath || formData.file_path || null,
        text: formData.text || null,
        effective_date: formData.effective_date || null
      };

      if (activityId) {
        const { error } = await supabase
          .from('Activity')
          .update(activityData)
          .eq('activity_id', activityId);

        if (error) throw error;
        toast.success('Activity updated successfully!');
      } else {
        const { error } = await supabase
          .from('Activity')
          .insert([activityData]);

        if (error) throw error;
        toast.success('Activity created successfully!');
      }

      onBack();
    } catch (error: any) {
      console.error('Error saving activity:', error);
      toast.error(error?.message || 'Failed to save activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>
        {`
          .form-container {
            max-width: 100%;
            width: 100%;
            margin-left: auto;
            margin-right: auto;
            padding: 0.75rem;
            background: linear-gradient(to bottom, #f9fafb, #ffffff);
            min-height: 100vh;
            overflow-x: hidden;
            box-sizing: border-box;
          }
          .form-card {
            background: #ffffff;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
            border-radius: 0.75rem;
            overflow: hidden;
            border: 1px solid #e5e7eb;
            width: 100%;
            max-width: 48rem;
            margin: 0 auto;
          }
          .form-header {
            background: rgba(0, 0, 0, 0.05);
            border-bottom: 1px solid #e5e7eb;
            padding: 0.5rem 0.75rem;
          }
          .form-title {
            font-size: 0.875rem;
            font-weight: 600;
            color: #1f2937;
          }
          .form-content {
            padding: 0.75rem;
            overflow-x: hidden;
          }
          .form-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 0.25rem;
            width: 100%;
          }
          .form-label {
            font-size: 0.75rem;
            font-weight: 500;
            color: #374151;
            margin-bottom: 0.25rem;
          }
          .form-input,
          .form-textarea,
          .form-select {
            width: 100%;
            border-radius: 0.375rem;
            border: 1px solid #d1d5db;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
            box-sizing: border-box;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .form-input:focus,
          .form-textarea:focus,
          .form-select:focus {
            outline: 2px solid #2563eb;
            border-color: #2563eb;
          }
          .form-input:disabled {
            background: #f3f4f6;
            cursor: not-allowed;
          }
          .form-textarea {
            min-height: 48px;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .form-button {
            flex: 1;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            font-weight: 500;
            padding: 0.375rem;
            transition: all 0.2s ease-in-out;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .form-button:disabled {
            cursor: not-allowed;
            opacity: 0.6;
          }
          .form-file-upload {
            border-radius: 0.375rem;
            border: 1px solid #d1d5db;
            background: #ffffff;
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
            color: #4b5563;
            width: 100%;
            box-sizing: border-box;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .form-file-upload-container {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            flex-wrap: wrap;
            width: 100%;
          }
          .form-progress-bar {
            width: 100%;
            background: #e5e7eb;
            border-radius: 9999px;
            height: 0.25rem;
          }
          .form-progress-bar-fill {
            background: #2563eb;
            height: 100%;
            border-radius: 9999px;
            transition: width 0.3s ease-in-out;
          }
          .form-card:hover {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
          }
          .select-trigger {
            width: 100%;
            box-sizing: border-box;
          }
          .select-content {
            max-width: 100vw;
            overflow-x: auto;
          }
          .select-item {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            padding-right: 1rem;
          }
          @media (min-width: 768px) {
            .form-container {
              padding: 1rem;
            }
            .form-header {
              padding: 0.75rem 1rem;
            }
            .form-title {
              font-size: 1rem;
            }
            .form-content {
              padding: 1rem;
            }
            .form-grid {
              grid-template-columns: 1fr 1fr;
              gap: 0.5rem;
            }
            .form-label {
              font-size: 0.75rem;
            }
            .form-input,
            .form-textarea,
            .form-select {
              padding: 0.375rem 0.75rem;
              font-size: 0.875rem;
            }
            .form-textarea {
              min-height: 60px;
            }
            .form-button {
              padding: 0.5rem;
              font-size: 0.875rem;
            }
            .form-file-upload {
              padding: 0.375rem 0.75rem;
              font-size: 0.875rem;
            }
            .select-content {
              max-width: none;
            }
          }
        `}
      </style>
      <div className="form-container">
        <Card className="form-card">
          <CardHeader className="form-header">
            <CardTitle className="form-title">{activityId ? 'Edit Activity' : 'Add New Activity'}</CardTitle>
          </CardHeader>
          <CardContent className="form-content">
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="activity_id" className="form-label">Activity ID (Auto-generated on save)</Label>
                <Input
                  id="activity_id"
                  value={formData.activity_id || generatedActivityId || 'Will be generated...'}
                  disabled
                  className="form-input bg-gray-100 font-mono"
                />
              </div>
              <div className="form-grid">
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="activity_date" className="form-label">Activity Date *</Label>
                  <Input
                    id="activity_date"
                    type="date"
                    value={formData.activity_date}
                    onChange={(e) => handleChange('activity_date', e.target.value)}
                    required
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="activity_type" className="form-label">Activity Type *</Label>
                  <Input
                    id="activity_type"
                    value={formData.activity_type}
                    onChange={(e) => handleChange('activity_type', e.target.value)}
                    placeholder="e.g., Call, Email, Meeting"
                    required
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="event_type" className="form-label">Event Type</Label>
                  <Input
                    id="event_type"
                    value={formData.event_type}
                    onChange={(e) => handleChange('event_type', e.target.value)}
                    placeholder="Enter event type"
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="created_by" className="form-label">Created By</Label>
                  <Input
                    id="created_by"
                    value={formData.created_by}
                    onChange={(e) => handleChange('created_by', e.target.value)}
                    placeholder="Enter creator name"
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="employee" className="form-label">Employee</Label>
                  <Input
                    id="employee"
                    value={formData.employee}
                    onChange={(e) => handleChange('employee', e.target.value)}
                    placeholder="Enter employee name"
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="effective_date" className="form-label">Effective Date</Label>
                  <Input
                    id="effective_date"
                    type="date"
                    value={formData.effective_date}
                    onChange={(e) => handleChange('effective_date', e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="lead_id" className="form-label">Related Lead</Label>
                  <Select value={formData.lead_id || undefined} onValueChange={(value) => handleChange('lead_id', value)}>
                    <SelectTrigger className="form-select select-trigger">
                      <SelectValue placeholder="Select a lead" />
                    </SelectTrigger>
                    <SelectContent className="select-content bg-white z-50">
                      {leads.map((lead) => (
                        <SelectItem key={lead.lead_id} value={lead.lead_id} className="select-item">
                          {lead.lead_name} ({lead.lead_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="customer_id" className="form-label">Related Customer</Label>
                  <Select value={formData.customer_id || undefined} onValueChange={(value) => handleChange('customer_id', value)}>
                    <SelectTrigger className="form-select select-trigger">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent className="select-content bg-white z-50">
                      {customers.map((customer) => (
                        <SelectItem key={customer.customer_id} value={customer.customer_id} className="select-item">
                          {customer.customer_full_name || customer.customer_name} ({customer.customer_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="description" className="form-label">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Enter activity description"
                  rows={2}
                  className="form-textarea"
                />
              </div>

              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="activity_description" className="form-label">Activity Description</Label>
                <Textarea
                  id="activity_description"
                  value={formData.activity_description}
                  onChange={(e) => handleChange('activity_description', e.target.value)}
                  placeholder="Enter detailed description"
                  rows={2}
                  className="form-textarea"
                />
              </div>

              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="text" className="form-label">Notes</Label>
                <Textarea
                  id="text"
                  value={formData.text}
                  onChange={(e) => handleChange('text', e.target.value)}
                  placeholder="Enter additional notes"
                  rows={2}
                  className="form-textarea"
                />
              </div>

              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="media_type" className="form-label">Media Type</Label>
                <Select value={formData.media_type} onValueChange={(value) => handleChange('media_type', value)}>
                  <SelectTrigger className="form-select select-trigger">
                    <SelectValue placeholder="Select media type" />
                  </SelectTrigger>
                  <SelectContent className="select-content bg-white z-50">
                    <SelectItem value="None" className="select-item">None</SelectItem>
                    <SelectItem value="Audio" className="select-item">Audio</SelectItem>
                    <SelectItem value="Video" className="select-item">Video</SelectItem>
                    <SelectItem value="Image" className="select-item">Image</SelectItem>
                    <SelectItem value="Document" className="select-item">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.media_type && formData.media_type !== 'None' && (
                <div className="space-y-2 md:space-y-3">
                  <Label className="form-label">Media Upload</Label>
                  
                  {formData.media_type === 'Audio' && (
                    <div className="space-y-1 md:space-y-2">
                      <CustomAudioRecorder 
                        onRecordingComplete={handleRecordingComplete}
                        className="w-full"
                      />
                      <div className="text-center text-xs text-gray-500">OR</div>
                    </div>
                  )}
                  
                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="file_upload" className="form-label">Upload File</Label>
                    <div className="form-file-upload-container">
                      <Input
                        id="file_upload"
                        type="file"
                        onChange={handleFileSelect}
                        accept={
                          formData.media_type === 'Audio' ? 'audio/*' :
                          formData.media_type === 'Video' ? 'video/*' :
                          formData.media_type === 'Image' ? 'image/*' :
                          formData.media_type === 'Document' ? '.pdf,.doc,.docx,.txt' :
                          '*/*'
                        }
                        className="form-file-upload"
                      />
                      {uploadedFile && (
                        <div className="flex items-center gap-1 text-xs text-green-600 flex-shrink-0 min-w-0">
                          <FileIcon className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{uploadedFile.name}</span>
                        </div>
                      )}
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="form-progress-bar">
                        <div 
                          className="form-progress-bar-fill"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="file_path" className="form-label">Or Enter File Path/URL</Label>
                    <Input
                      id="file_path"
                      value={formData.file_path}
                      onChange={(e) => handleChange('file_path', e.target.value)}
                      placeholder="Enter file path or URL"
                      className="form-input"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 md:gap-3 pt-2 md:pt-3">
                <Button type="submit" disabled={isSubmitting} className="form-button">
                  {isSubmitting ? 'Saving...' : (activityId ? 'Update Activity' : 'Save Activity')}
                </Button>
                <Button type="button" variant="outline" onClick={onBack} className="form-button">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ActivityForm;