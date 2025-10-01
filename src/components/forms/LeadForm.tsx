import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LeadFormProps {
  onBack: () => void;
  leadId?: string;
}

const LeadForm: React.FC<LeadFormProps> = ({ onBack, leadId }) => {
  const [formData, setFormData] = useState({
    lead_id: '',
    lead_name: '',
    project_name: '',
    building_name: '',
    unit_number: '',
    unit_type: '',
    developer: '',
    type_of_lead: '',
    purpose_of_buying: '',
    budget: '',
    booking_amount: '',
    timeline: '',
    number_of_bed_room: '',
    expected_date_of_booking: '',
    current_status: 'New'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (leadId) {
      fetchLeadData();
    } else {
      generateLeadId();
    }
  }, [leadId]);

  const fetchLeadData = async () => {
    if (!leadId) return;
    
    try {
      const { data, error } = await supabase
        .from('Lead')
        .select('*')
        .eq('lead_id', leadId)
        .single();

      if (error) throw error;
      
      if (data) {
        setFormData({
          lead_id: data.lead_id,
          lead_name: data.lead_name || '',
          project_name: data.project_name || '',
          building_name: data.building_name || '',
          unit_number: data.unit_number || '',
          unit_type: data.unit_type || '',
          developer: data.developer || '',
          type_of_lead: data.type_of_lead || '',
          purpose_of_buying: data.purpose_of_buying || '',
          budget: data.budget || '',
          booking_amount: data.booking_amount || '',
          timeline: data.timeline || '',
          number_of_bed_room: data.number_of_bed_room || '',
          expected_date_of_booking: data.expected_date_of_booking || '',
          current_status: data.current_status || 'New'
        });
      }
    } catch (error) {
      console.error('Error fetching lead:', error);
      toast.error('Failed to fetch lead data');
    }
  };

  const generateLeadId = async () => {
    try {
      const { data, error } = await supabase
        .from('Lead')
        .select('lead_id')
        .order('lead_id', { ascending: false });

      if (error) throw error;

      const existingNumbers = data
        ?.map(item => parseInt(item.lead_id.replace('LEAD', '')))
        .filter(num => !isNaN(num))
        .sort((a, b) => b - a) || [];

      let nextNumber = 1001;
      while (existingNumbers.includes(nextNumber)) {
        nextNumber++;
      }

      const newLeadId = `LEAD${nextNumber}`;
      setFormData(prev => ({ ...prev, lead_id: newLeadId }));
    } catch (error) {
      console.error('Error generating lead ID:', error);
      const fallbackId = `LEAD${Date.now()}`;
      setFormData(prev => ({ ...prev, lead_id: fallbackId }));
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lead_name.trim()) {
      toast.error('Lead name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const leadData = {
        ...formData,
        effective_date_of_change: new Date().toISOString().split('T')[0]
      };

      if (leadId) {
        const { error } = await supabase
          .from('Lead')
          .update(leadData)
          .eq('lead_id', leadId);

        if (error) throw error;
        toast.success('Lead updated successfully!');
      } else {
        const { error } = await supabase
          .from('Lead')
          .insert(leadData);

        if (error) throw error;
        toast.success('Lead added successfully!');
      }

      onBack();
    } catch (error: any) {
      console.error('Error saving lead:', error);
      toast.error(error?.message || 'Failed to save lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>
        {`
          .form-container {
            max-width: 48rem;
            margin-left: auto;
            margin-right: auto;
            padding: 0.75rem;
            background: linear-gradient(to bottom, #f9fafb, #ffffff);
            min-height: 100vh;
          }
          .form-card {
            background: #ffffff;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
            border-radius: 0.75rem;
            overflow: hidden;
            border: 1px solid #e5e7eb;
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
          }
          .form-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 0.25rem;
          }
          .form-label {
            font-size: 0.75rem;
            font-weight: 500;
            color: #374151;
            margin-bottom: 0.25rem;
          }
          .form-input {
            width: 100%;
            border-radius: 0.375rem;
            border: 1px solid #d1d5db;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
          }
          .form-input:focus {
            outline: 2px solid #2563eb;
            border-color: #2563eb;
          }
          .form-input:disabled {
            background: #f3f4f6;
            cursor: not-allowed;
          }
          .form-button {
            flex: 1;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            font-weight: 500;
            padding: 0.375rem;
            transition: all 0.2s ease-in-out;
          }
          .form-button:disabled {
            cursor: not-allowed;
            opacity: 0.6;
          }
          .form-card:hover {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
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
            .form-input {
              padding: 0.375rem 0.75rem;
              font-size: 0.875rem;
            }
            .form-button {
              padding: 0.5rem;
              font-size: 0.875rem;
            }
          }
        `}
      </style>
      <div className="form-container">
        <Card className="form-card">
          <CardHeader className="form-header">
            <CardTitle className="form-title">{leadId ? 'Edit Lead' : 'Add New Lead'}</CardTitle>
          </CardHeader>
          <CardContent className="form-content">
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="lead_id" className="form-label">Lead ID (Auto-generated on save)</Label>
                <Input
                  id="lead_id"
                  value={formData.lead_id || 'Will be generated...'}
                  disabled
                  className="form-input bg-gray-100 font-mono"
                />
              </div>
              <div className="form-grid">
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="lead_name" className="form-label">Lead Name *</Label>
                  <Input
                    id="lead_name"
                    value={formData.lead_name}
                    onChange={(e) => handleChange('lead_name', e.target.value)}
                    placeholder="Enter lead name"
                    required
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="current_status" className="form-label">Status</Label>
                  <Input
                    id="current_status"
                    value={formData.current_status}
                    onChange={(e) => handleChange('current_status', e.target.value)}
                    placeholder="e.g., New, Contacted, Qualified"
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="project_name" className="form-label">Project Name</Label>
                  <Input
                    id="project_name"
                    value={formData.project_name}
                    onChange={(e) => handleChange('project_name', e.target.value)}
                    placeholder="Enter project name"
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="building_name" className="form-label">Building Name</Label>
                  <Input
                    id="building_name"
                    value={formData.building_name}
                    onChange={(e) => handleChange('building_name', e.target.value)}
                    placeholder="Enter building name"
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="unit_number" className="form-label">Unit Number</Label>
                  <Input
                    id="unit_number"
                    value={formData.unit_number}
                    onChange={(e) => handleChange('unit_number', e.target.value)}
                    placeholder="Enter unit number"
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="unit_type" className="form-label">Unit Type</Label>
                  <Input
                    id="unit_type"
                    value={formData.unit_type}
                    onChange={(e) => handleChange('unit_type', e.target.value)}
                    placeholder="e.g., Studio, 1BR, 2BR, Villa"
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="developer" className="form-label">Developer</Label>
                  <Input
                    id="developer"
                    value={formData.developer}
                    onChange={(e) => handleChange('developer', e.target.value)}
                    placeholder="Enter developer name"
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="type_of_lead" className="form-label">Lead Type</Label>
                  <Input
                    id="type_of_lead"
                    value={formData.type_of_lead}
                    onChange={(e) => handleChange('type_of_lead', e.target.value)}
                    placeholder="e.g., Hot, Warm, Cold, Referral"
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="purpose_of_buying" className="form-label">Purpose of Buying</Label>
                  <Input
                    id="purpose_of_buying"
                    value={formData.purpose_of_buying}
                    onChange={(e) => handleChange('purpose_of_buying', e.target.value)}
                    placeholder="e.g., Investment, End User, Resale"
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="budget" className="form-label">Budget</Label>
                  <Input
                    id="budget"
                    value={formData.budget}
                    onChange={(e) => handleChange('budget', e.target.value)}
                    placeholder="Enter budget (AED)"
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="booking_amount" className="form-label">Booking Amount</Label>
                  <Input
                    id="booking_amount"
                    value={formData.booking_amount}
                    onChange={(e) => handleChange('booking_amount', e.target.value)}
                    placeholder="Enter booking amount (AED)"
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="timeline" className="form-label">Timeline</Label>
                  <Input
                    id="timeline"
                    value={formData.timeline}
                    onChange={(e) => handleChange('timeline', e.target.value)}
                    placeholder="Enter timeline"
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="number_of_bed_room" className="form-label">Number of Bedrooms</Label>
                  <Input
                    id="number_of_bed_room"
                    value={formData.number_of_bed_room}
                    onChange={(e) => handleChange('number_of_bed_room', e.target.value)}
                    placeholder="e.g., Studio, 1, 2, 3, 5+"
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="expected_date_of_booking" className="form-label">Expected Date of Booking</Label>
                  <Input
                    id="expected_date_of_booking"
                    type="date"
                    value={formData.expected_date_of_booking}
                    onChange={(e) => handleChange('expected_date_of_booking', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="flex gap-2 md:gap-3 pt-2 md:pt-3">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="form-button"
                >
                  {isSubmitting ? 'Saving...' : leadId ? 'Update Lead' : 'Save Lead'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onBack}
                  className="form-button"
                >
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

export default LeadForm;