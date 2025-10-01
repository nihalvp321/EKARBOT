import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomerFormProps {
  onBack: () => void;
  customerId?: string;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ onBack, customerId }) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_full_name: '',
    customer_name: '',
    email: '',
    email_address: '',
    phone: '',
    contact_no: '',
    status: 'Active',
    assigned_to: '',
    source: '',
    budget_range: '',
    last_contacted_date: '',
    comments: '',
    observer: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedCustomerId, setGeneratedCustomerId] = useState('');

  useEffect(() => {
    if (customerId) {
      fetchCustomerData();
    } else {
      generateCustomerId();
    }
  }, [customerId]);

  const fetchCustomerData = async () => {
    if (!customerId) return;
    
    try {
      const { data, error } = await supabase
        .from('Customer')
        .select('*')
        .eq('customer_id', customerId)
        .single();

      if (error) throw error;
      
      if (data) {
        setFormData({
          customer_id: data.customer_id,
          customer_full_name: data.customer_full_name || '',
          customer_name: data.customer_name || '',
          email: data.email || '',
          email_address: data.email_address || '',
          phone: data.phone || '',
          contact_no: data.contact_no ? data.contact_no.toString() : '',
          status: data.status || 'Active',
          assigned_to: data.assigned_to || '',
          source: data.source || '',
          budget_range: data.budget_range || '',
          last_contacted_date: data.last_contacted_date || '',
          comments: data.comments || '',
          observer: data.observer || ''
        });
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast.error('Failed to fetch customer data');
    }
  };

  const generateCustomerId = async () => {
    try {
      const { data, error } = await supabase
        .from('Customer')
        .select('customer_id')
        .order('customer_id', { ascending: false });

      if (error) throw error;

      const existingNumbers = data
        ?.map(item => parseInt(item.customer_id.replace('CUST', '')))
        .filter(num => !isNaN(num))
        .sort((a, b) => b - a) || [];

      let nextNumber = 1001;
      while (existingNumbers.includes(nextNumber)) {
        nextNumber++;
      }

      const newCustomerId = `CUST${nextNumber}`;
      setGeneratedCustomerId(newCustomerId);
      setFormData(prev => ({ ...prev, customer_id: newCustomerId }));
    } catch (error) {
      console.error('Error generating customer ID:', error);
      const fallbackId = `CUST${Date.now()}`;
      setGeneratedCustomerId(fallbackId);
      setFormData(prev => ({ ...prev, customer_id: fallbackId }));
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: value,
      ...(field === 'customer_full_name' && { customer_name: value }),
      ...(field === 'email' && { email_address: value }),
      ...(field === 'phone' && { contact_no: value })
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_full_name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const customerData = {
        customer_id: formData.customer_id,
        customer_full_name: formData.customer_full_name,
        customer_name: formData.customer_full_name,
        email: formData.email,
        email_address: formData.email,
        phone: formData.phone,
        contact_no: formData.phone ? parseInt(formData.phone) : null,
        status: formData.status,
        assigned_to: formData.assigned_to,
        source: formData.source,
        budget_range: formData.budget_range,
        last_contacted_date: formData.last_contacted_date || new Date().toISOString().split('T')[0],
        comments: formData.comments,
        observer: formData.observer
      };

      if (customerId) {
        const { error } = await supabase
          .from('Customer')
          .update(customerData)
          .eq('customer_id', customerId);

        if (error) throw error;
        toast.success('Customer updated successfully!');
      } else {
        const { error } = await supabase
          .from('Customer')
          .insert(customerData);

        if (error) throw error;
        toast.success('Customer added successfully!');
      }

      onBack();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      toast.error(error?.message || 'Failed to save customer');
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
          .form-input,
          .form-textarea {
            width: 100%;
            border-radius: 0.375rem;
            border: 1px solid #d1d5db;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
          }
          .form-input:focus,
          .form-textarea:focus {
            outline: 2px solid #2563eb;
            border-color: #2563eb;
          }
          .form-input:disabled {
            background: #f3f4f6;
            cursor: not-allowed;
          }
          .form-textarea {
            min-height: 48px;
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
            .form-input,
            .form-textarea {
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
          }
        `}
      </style>
      <div className="form-container">
        <Card className="form-card">
          <CardHeader className="form-header">
            <CardTitle className="form-title">{customerId ? 'Edit Customer' : 'Add New Customer'}</CardTitle>
          </CardHeader>
          <CardContent className="form-content">
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="customer_id" className="form-label">Customer ID (Auto-generated on save)</Label>
                <Input
                  id="customer_id"
                  value={formData.customer_id || generatedCustomerId || 'Will be generated...'}
                  disabled
                  className="form-input bg-gray-100 font-mono"
                />
              </div>
              <div className="form-grid">
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="customer_full_name" className="form-label">Customer Name *</Label>
                  <Input
                    id="customer_full_name"
                    value={formData.customer_full_name}
                    onChange={(e) => handleChange('customer_full_name', e.target.value)}
                    placeholder="Enter customer full name"
                    required
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="status" className="form-label">Status</Label>
                  <Input
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    placeholder="e.g., Active, Inactive, Pending"
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="email" className="form-label">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="Enter email address"
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="phone" className="form-label">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="assigned_to" className="form-label">Assigned To</Label>
                  <Input
                    id="assigned_to"
                    value={formData.assigned_to}
                    onChange={(e) => handleChange('assigned_to', e.target.value)}
                    placeholder="Enter assigned agent name"
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="source" className="form-label">Source</Label>
                  <Input
                    id="source"
                    value={formData.source}
                    onChange={(e) => handleChange('source', e.target.value)}
                    placeholder="e.g., Website, Referral, Social Media"
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="budget_range" className="form-label">Budget Range</Label>
                  <Input
                    id="budget_range"
                    value={formData.budget_range}
                    onChange={(e) => handleChange('budget_range', e.target.value)}
                    placeholder="e.g., 500K - 1M AED, 2M - 5M AED"
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="last_contacted_date" className="form-label">Last Contacted Date</Label>
                  <Input
                    id="last_contacted_date"
                    type="date"
                    value={formData.last_contacted_date}
                    onChange={(e) => handleChange('last_contacted_date', e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="observer" className="form-label">Observer</Label>
                  <Input
                    id="observer"
                    value={formData.observer}
                    onChange={(e) => handleChange('observer', e.target.value)}
                    placeholder="Enter observer name"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="comments" className="form-label">Comments</Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => handleChange('comments', e.target.value)}
                  placeholder="Enter any additional comments"
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <div className="flex gap-2 md:gap-3 pt-2 md:pt-3">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="form-button"
                >
                  {isSubmitting ? 'Saving...' : customerId ? 'Update Customer' : 'Save Customer'}
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

export default CustomerForm;