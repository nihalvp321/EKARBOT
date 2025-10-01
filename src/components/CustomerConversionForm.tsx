import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDropdownOptions } from '@/components/hooks/useDropdownOptions';

interface CustomerConversionFormProps {
  leadId: string;
  leadName: string;
  onBack: () => void;
  onSuccess: () => void;
}

const CustomerConversionForm: React.FC<CustomerConversionFormProps> = ({ 
  leadId, 
  leadName, 
  onBack, 
  onSuccess 
}) => {
  const [conversionMode, setConversionMode] = useState<'new' | 'existing'>('new');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_full_name: leadName,
    contact_no: '',
    email_address: '',
    assigned_to: '',
    status: 'Active',
    budget_range: '',
    source: '',
    comments: '',
    lead_id: leadId
  });

  const [leads, setLeads] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { options: statusOptions } = useDropdownOptions('customer_status');
  const { options: budgetOptions } = useDropdownOptions('budget_range');
  const { options: sourceOptions } = useDropdownOptions('lead_source');

  useEffect(() => {
    fetchLeads();
    fetchCustomers();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('Lead')
        .select('lead_id, lead_name')
        .order('lead_name');
      
      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('Customer')
        .select('customer_id, customer_full_name, email_address, contact_no')
        .order('customer_full_name');
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let customerIdToLink = '';

      if (conversionMode === 'new') {
        if (!formData.customer_full_name) {
          toast.error('Customer name is required');
          setIsSubmitting(false);
          return;
        }

        const { data: customer, error: customerError } = await supabase
          .from('Customer')
          .insert([{
            customer_id: '',
            customer_full_name: formData.customer_full_name,
            contact_no: formData.contact_no ? parseInt(formData.contact_no) : null,
            email_address: formData.email_address || null,
            assigned_to: formData.assigned_to || null,
            status: formData.status,
            budget_range: formData.budget_range || null,
            source: formData.source || null,
            comments: formData.comments || null,
            lead_id: formData.lead_id,
            last_contacted_date: new Date().toISOString().split('T')[0]
          }])
          .select()
          .single();

        if (customerError) {
          console.error('Customer creation error:', customerError);
          throw customerError;
        }

        customerIdToLink = customer.customer_id;
      } else {
        if (!selectedCustomerId) {
          toast.error('Please select an existing customer');
          setIsSubmitting(false);
          return;
        }
        customerIdToLink = selectedCustomerId;
      }

      const { error: leadUpdateError } = await supabase
        .from('Lead')
        .update({ 
          current_status: 'Converted',
          customer_id: customerIdToLink,
          effective_date_of_change: new Date().toISOString().split('T')[0]
        })
        .eq('lead_id', leadId);

      if (leadUpdateError) {
        console.error('Lead update error:', leadUpdateError);
        throw leadUpdateError;
      }

      toast.success(
        conversionMode === 'new' 
          ? 'Lead converted to new customer successfully!' 
          : 'Lead linked to existing customer successfully!'
      );
      onSuccess();
    } catch (error: any) {
      console.error('Error converting lead:', error);
      toast.error(error?.message || 'Failed to convert lead to customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Convert Lead to Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <Label className="text-base font-semibold">Conversion Type</Label>
              <RadioGroup 
                value={conversionMode} 
                onValueChange={(value: 'new' | 'existing') => setConversionMode(value)}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors" 
                     style={{ borderColor: conversionMode === 'new' ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}>
                  <RadioGroupItem value="new" id="new" className="h-5 w-5" />
                  <Label htmlFor="new" className="cursor-pointer font-medium">Create New Customer</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                     style={{ borderColor: conversionMode === 'existing' ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}>
                  <RadioGroupItem value="existing" id="existing" className="h-5 w-5" />
                  <Label htmlFor="existing" className="cursor-pointer font-medium">Link to Existing Customer</Label>
                </div>
              </RadioGroup>
            </div>

            {conversionMode === 'existing' && (
              <div className="space-y-2">
                <Label htmlFor="existing_customer">Select Customer *</Label>
                <Select onValueChange={setSelectedCustomerId} value={selectedCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an existing customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.customer_id} value={customer.customer_id}>
                        {customer.customer_full_name} ({customer.customer_id})
                        {customer.email_address && ` - ${customer.email_address}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {conversionMode === 'new' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer_full_name">Customer Name *</Label>
                    <Input
                      id="customer_full_name"
                      value={formData.customer_full_name}
                      onChange={(e) => handleChange('customer_full_name', e.target.value)}
                      placeholder="Enter customer name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lead_id">Related Lead</Label>
                    <Select onValueChange={(value) => handleChange('lead_id', value)} value={formData.lead_id}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select related lead" />
                      </SelectTrigger>
                      <SelectContent>
                        {leads.map((lead) => (
                          <SelectItem key={lead.lead_id} value={lead.lead_id}>
                            {lead.lead_name} ({lead.lead_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_no">Contact Number</Label>
                    <Input
                      id="contact_no"
                      value={formData.contact_no}
                      onChange={(e) => handleChange('contact_no', e.target.value)}
                      placeholder="Enter contact number"
                      type="tel"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email_address">Email Address</Label>
                    <Input
                      id="email_address"
                      value={formData.email_address}
                      onChange={(e) => handleChange('email_address', e.target.value)}
                      placeholder="Enter email address"
                      type="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assigned_to">Assigned To</Label>
                    <Input
                      id="assigned_to"
                      value={formData.assigned_to}
                      onChange={(e) => handleChange('assigned_to', e.target.value)}
                      placeholder="Enter assigned person"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select onValueChange={(value) => handleChange('status', value)} value={formData.status}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.id} value={option.value}>
                            {option.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget_range">Budget Range</Label>
                    <Select onValueChange={(value) => handleChange('budget_range', value)} value={formData.budget_range}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetOptions.map((option) => (
                          <SelectItem key={option.id} value={option.value}>
                            {option.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Select onValueChange={(value) => handleChange('source', value)} value={formData.source}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceOptions.map((option) => (
                          <SelectItem key={option.id} value={option.value}>
                            {option.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comments">Comments</Label>
                  <Textarea
                    id="comments"
                    value={formData.comments}
                    onChange={(e) => handleChange('comments', e.target.value)}
                    placeholder="Enter any additional comments"
                    rows={3}
                  />
                </div>
              </>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? 'Processing...' 
                  : conversionMode === 'new' 
                    ? 'Convert to New Customer' 
                    : 'Link to Existing Customer'
                }
              </Button>
              <Button type="button" variant="outline" onClick={onBack}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerConversionForm;
