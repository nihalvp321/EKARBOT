import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LeadDetailsPopupProps {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LeadDetailsPopup = ({ leadId, open, onOpenChange }: LeadDetailsPopupProps) => {
  const [lead, setLead] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && leadId) {
      fetchLeadDetails();
    }
  }, [open, leadId]);

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);

      // Fetch lead details
      const { data: leadData, error: leadError } = await supabase
        .from('Lead')
        .select('*')
        .eq('lead_id', leadId)
        .maybeSingle();

      if (leadError) throw leadError;
      setLead(leadData);

      if (leadData?.customer_id) {
        // Fetch associated customer
        const { data: customerData } = await supabase
          .from('Customer')
          .select('*')
          .eq('customer_id', leadData.customer_id)
          .maybeSingle();
        setCustomer(customerData);

        // Fetch associated activities
        const { data: activitiesData } = await supabase
          .from('Activity')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false });
        setActivities(activitiesData || []);
      }
    } catch (error: any) {
      console.error('Error fetching lead details:', error);
      toast.error('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lead Details - {leadId}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !lead ? (
          <p className="text-center py-8 text-muted-foreground">Lead not found</p>
        ) : (
          <div className="space-y-6">
            {/* Lead Information */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Lead Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {lead.lead_name && <div><span className="font-medium">Name:</span> {lead.lead_name}</div>}
                {lead.type_of_lead && <div><span className="font-medium">Type:</span> {lead.type_of_lead}</div>}
                {lead.current_status && <div><span className="font-medium">Status:</span> {lead.current_status}</div>}
                {lead.developer && <div><span className="font-medium">Developer:</span> {lead.developer}</div>}
                {lead.project_name && <div><span className="font-medium">Project:</span> {lead.project_name}</div>}
                {lead.unit_type && <div><span className="font-medium">Unit Type:</span> {lead.unit_type}</div>}
                {lead.number_of_bed_room && <div><span className="font-medium">Bedrooms:</span> {lead.number_of_bed_room}</div>}
                {lead.budget && <div><span className="font-medium">Budget:</span> {lead.budget}</div>}
                {lead.timeline && <div><span className="font-medium">Timeline:</span> {lead.timeline}</div>}
                {lead.purpose_of_buying && <div><span className="font-medium">Purpose:</span> {lead.purpose_of_buying}</div>}
              </div>
            </div>

            {/* Customer Information */}
            {customer && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Associated Customer</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {customer.customer_full_name && <div><span className="font-medium">Name:</span> {customer.customer_full_name}</div>}
                  {customer.email_address && <div><span className="font-medium">Email:</span> {customer.email_address}</div>}
                  {customer.phone && <div><span className="font-medium">Phone:</span> {customer.phone}</div>}
                  {customer.contact_no && <div><span className="font-medium">Contact No:</span> {customer.contact_no}</div>}
                  {customer.status && <div><span className="font-medium">Status:</span> {customer.status}</div>}
                  {customer.source && <div><span className="font-medium">Source:</span> {customer.source}</div>}
                  {customer.assigned_to && <div><span className="font-medium">Assigned To:</span> {customer.assigned_to}</div>}
                  {customer.budget_range && <div><span className="font-medium">Budget Range:</span> {customer.budget_range}</div>}
                  {customer.last_contacted_date && <div><span className="font-medium">Last Contacted:</span> {customer.last_contacted_date}</div>}
                  {customer.observer && <div><span className="font-medium">Observer:</span> {customer.observer}</div>}
                </div>
                {customer.comments && (
                  <div className="mt-3">
                    <span className="font-medium">Comments:</span>
                    <p className="text-muted-foreground mt-1">{customer.comments}</p>
                  </div>
                )}
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
                        {activity.created_by && <div><span className="font-medium">Created By:</span> {activity.created_by}</div>}
                        {activity.effective_date && <div><span className="font-medium">Effective Date:</span> {activity.effective_date}</div>}
                      </div>
                      {activity.description && (
                        <div className="mt-2">
                          <span className="font-medium text-xs">Description:</span>
                          <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                        </div>
                      )}
                      {activity.activity_description && (
                        <div className="mt-2">
                          <span className="font-medium text-xs">Details:</span>
                          <p className="text-xs text-muted-foreground mt-1">{activity.activity_description}</p>
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
