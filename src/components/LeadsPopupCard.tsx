import React, { useState, useEffect } from 'react';
import { X, User, Calendar, MapPin, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Lead {
  lead_id: string;
  lead_name: string;
  current_status: string;
  project_name: string;
  unit_type: string;
  budget: string;
  timeline: string;
  purpose_of_buying: string;
  created_at: string;
}

interface LeadsPopupCardProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: string;
  activityId?: string;
  title: string;
}

const LeadsPopupCard: React.FC<LeadsPopupCardProps> = ({ 
  isOpen, 
  onClose, 
  customerId, 
  activityId, 
  title 
}) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && (customerId || activityId)) {
      fetchLeads();
    }
  }, [isOpen, customerId, activityId]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let query = supabase.from('Lead').select('*');
      
      if (customerId) {
        query = query.eq('customer_id', customerId);
      } else if (activityId) {
        // For activities, we need to get leads associated through customer_id or lead_id
        const { data: activity } = await supabase
          .from('Activity')
          .select('customer_id, lead_id')
          .eq('activity_id', activityId)
          .single();
          
        if (activity?.lead_id) {
          query = query.eq('lead_id', activity.lead_id);
        } else if (activity?.customer_id) {
          query = query.eq('customer_id', activity.customer_id);
        }
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'hot': return 'bg-red-500/10 text-red-700 border-red-200';
      case 'warm': return 'bg-orange-500/10 text-orange-700 border-orange-200';
      case 'cold': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'converted': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'lost': return 'bg-gray-500/10 text-gray-700 border-gray-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading leads...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No associated leads found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {leads.map((lead) => (
                <Card key={lead.lead_id} className="border border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{lead.lead_name || 'Unnamed Lead'}</CardTitle>
                        <p className="text-sm text-muted-foreground">ID: {lead.lead_id}</p>
                      </div>
                      <Badge className={getStatusColor(lead.current_status)}>
                        {lead.current_status || 'No Status'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Project</p>
                        <p className="text-sm text-muted-foreground">
                          {lead.project_name || 'Not specified'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Budget</p>
                        <p className="text-sm text-muted-foreground">
                          {lead.budget || 'Not specified'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Timeline</p>
                        <p className="text-sm text-muted-foreground">
                          {lead.timeline || 'Not specified'}
                        </p>
                      </div>
                    </div>
                    
                    {lead.unit_type && (
                      <div>
                        <p className="text-sm font-medium">Unit Type</p>
                        <p className="text-sm text-muted-foreground">{lead.unit_type}</p>
                      </div>
                    )}
                    
                    {lead.purpose_of_buying && (
                      <div>
                        <p className="text-sm font-medium">Purpose</p>
                        <p className="text-sm text-muted-foreground">{lead.purpose_of_buying}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </p>
                    </div>
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

export default LeadsPopupCard;