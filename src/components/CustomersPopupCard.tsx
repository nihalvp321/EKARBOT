import React, { useState, useEffect } from 'react';
import { X, Users, Mail, Phone, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Customer {
  customer_id: string;
  customer_name: string;
  customer_full_name: string;
  email: string;
  email_address: string;
  phone: string;
  contact_no: number;
  status: string;
  budget_range: string;
  source: string;
  assigned_to: string;
  created_at: string;
}

interface CustomersPopupCardProps {
  isOpen: boolean;
  onClose: () => void;
  activityId: string;
  title: string;
}

const CustomersPopupCard: React.FC<CustomersPopupCardProps> = ({ 
  isOpen, 
  onClose, 
  activityId, 
  title 
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activityId) {
      fetchCustomers();
    }
  }, [isOpen, activityId]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Get customer_id from activity
      const { data: activity } = await supabase
        .from('Activity')
        .select('customer_id')
        .eq('activity_id', activityId)
        .single();
        
      if (activity?.customer_id) {
        const { data, error } = await supabase
          .from('Customer')
          .select('*')
          .eq('customer_id', activity.customer_id);
          
        if (error) throw error;
        setCustomers(data || []);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'prospect': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'inactive': return 'bg-gray-500/10 text-gray-700 border-gray-200';
      case 'converted': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const formatContactNumber = (contact: any) => {
    if (contact?.contact_no) return contact.contact_no.toString();
    if (contact?.phone) return contact.phone;
    return 'Not provided';
  };

  const getEmailAddress = (customer: Customer) => {
    return customer.email_address || customer.email || 'Not provided';
  };

  const getCustomerName = (customer: Customer) => {
    return customer.customer_full_name || customer.customer_name || 'Unnamed Customer';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No associated customers found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {customers.map((customer) => (
                <Card key={customer.customer_id} className="border border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{getCustomerName(customer)}</CardTitle>
                        <p className="text-sm text-muted-foreground">ID: {customer.customer_id}</p>
                      </div>
                      <Badge className={getStatusColor(customer.status)}>
                        {customer.status || 'No Status'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">
                          {getEmailAddress(customer)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">
                          {formatContactNumber(customer)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Created</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(customer.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {customer.budget_range && (
                      <div>
                        <p className="text-sm font-medium">Budget Range</p>
                        <p className="text-sm text-muted-foreground">{customer.budget_range}</p>
                      </div>
                    )}
                    
                    {customer.source && (
                      <div>
                        <p className="text-sm font-medium">Source</p>
                        <p className="text-sm text-muted-foreground">{customer.source}</p>
                      </div>
                    )}
                    
                    {customer.assigned_to && (
                      <div>
                        <p className="text-sm font-medium">Assigned To</p>
                        <p className="text-sm text-muted-foreground">{customer.assigned_to}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomersPopupCard;