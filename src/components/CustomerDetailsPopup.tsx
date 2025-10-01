import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CustomerDetailsPopupProps {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CustomerDetailsPopup = ({ customerId, open, onOpenChange }: CustomerDetailsPopupProps) => {
  const [customer, setCustomer] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && customerId) {
      fetchCustomerDetails();
    }
  }, [open, customerId]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);

      // Fetch customer details
      const { data: customerData, error: customerError } = await supabase
        .from('Customer')
        .select('*')
        .eq('customer_id', customerId)
        .maybeSingle();

      if (customerError) throw customerError;
      setCustomer(customerData);

      if (customerData) {
        // Fetch associated leads
        const { data: leadsData } = await supabase
          .from('Lead')
          .select('*')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false });
        setLeads(leadsData || []);

        // Fetch associated activities
        const { data: activitiesData } = await supabase
          .from('Activity')
          .select('*')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false });
        setActivities(activitiesData || []);
      }
    } catch (error: any) {
      console.error('Error fetching customer details:', error);
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Details - {customerId}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !customer ? (
          <p className="text-center py-8 text-muted-foreground">Customer not found</p>
        ) : (
          <div className="space-y-6">
            {/* Customer Information */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Customer Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {customer.customer_full_name && <div><span className="font-medium">Name:</span> {customer.customer_full_name}</div>}
                {customer.email_address && <div><span className="font-medium">Email:</span> {customer.email_address}</div>}
                {customer.phone && <div><span className="font-medium">Phone:</span> {customer.phone}</div>}
                {customer.status && <div><span className="font-medium">Status:</span> {customer.status}</div>}
                {customer.source && <div><span className="font-medium">Source:</span> {customer.source}</div>}
                {customer.assigned_to && <div><span className="font-medium">Assigned To:</span> {customer.assigned_to}</div>}
                {customer.budget_range && <div><span className="font-medium">Budget Range:</span> {customer.budget_range}</div>}
                {customer.last_contacted_date && <div><span className="font-medium">Last Contacted:</span> {customer.last_contacted_date}</div>}
              </div>
              {customer.comments && (
                <div className="mt-3">
                  <span className="font-medium">Comments:</span>
                  <p className="text-muted-foreground mt-1">{customer.comments}</p>
                </div>
              )}
            </div>

            {/* Associated Leads */}
            {leads.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Associated Leads ({leads.length})</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {leads.map((lead) => (
                    <div key={lead.lead_id} className="border rounded-lg p-3 text-sm bg-gray-50">
                      <div className="font-medium mb-2 text-base">{lead.lead_name || lead.lead_id}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {lead.current_status && <div><span className="font-medium">Status:</span> {lead.current_status}</div>}
                        {lead.type_of_lead && <div><span className="font-medium">Type:</span> {lead.type_of_lead}</div>}
                        {lead.project_name && <div><span className="font-medium">Project:</span> {lead.project_name}</div>}
                        {lead.developer && <div><span className="font-medium">Developer:</span> {lead.developer}</div>}
                        {lead.unit_type && <div><span className="font-medium">Unit Type:</span> {lead.unit_type}</div>}
                        {lead.number_of_bed_room && <div><span className="font-medium">Bedrooms:</span> {lead.number_of_bed_room}</div>}
                        {lead.budget && <div><span className="font-medium">Budget:</span> {lead.budget}</div>}
                        {lead.timeline && <div><span className="font-medium">Timeline:</span> {lead.timeline}</div>}
                        {lead.purpose_of_buying && <div><span className="font-medium">Purpose:</span> {lead.purpose_of_buying}</div>}
                        {lead.booking_amount && <div><span className="font-medium">Booking Amount:</span> {lead.booking_amount}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activities */}
            {activities.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Associated Activities ({activities.length})</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {activities.map((activity) => (
                    <div key={activity.activity_id} className="border rounded-lg p-3 text-sm bg-gray-50">
                      <div className="font-medium mb-2 text-base">{activity.activity_type || 'Activity'} - {activity.activity_id}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {activity.event_type && <div><span className="font-medium">Event:</span> {activity.event_type}</div>}
                        {activity.activity_date && <div><span className="font-medium">Date:</span> {activity.activity_date}</div>}
                        {activity.employee && <div><span className="font-medium">Employee:</span> {activity.employee}</div>}
                        {activity.media_type && <div><span className="font-medium">Media:</span> {activity.media_type}</div>}
                      </div>
                      {activity.description && (
                        <div className="mt-2">
                          <span className="font-medium text-xs">Description:</span>
                          <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
