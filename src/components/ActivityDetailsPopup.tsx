import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ActivityDetailsPopupProps {
  activityId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ActivityDetailsPopup = ({ activityId, open, onOpenChange }: ActivityDetailsPopupProps) => {
  const [activity, setActivity] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && activityId) {
      fetchActivityDetails();
    }
  }, [open, activityId]);

  const fetchActivityDetails = async () => {
    try {
      setLoading(true);

      // Fetch activity details
      const { data: activityData, error: activityError } = await supabase
        .from('Activity')
        .select('*')
        .eq('activity_id', activityId)
        .maybeSingle();

      if (activityError) throw activityError;
      setActivity(activityData);

      if (activityData) {
        // Fetch associated customer
        if (activityData.customer_id) {
          const { data: customerData } = await supabase
            .from('Customer')
            .select('*')
            .eq('customer_id', activityData.customer_id)
            .maybeSingle();
          setCustomer(customerData);
        }

        // Fetch associated lead
        if (activityData.lead_id) {
          const { data: leadData } = await supabase
            .from('Lead')
            .select('*')
            .eq('lead_id', activityData.lead_id)
            .maybeSingle();
          setLead(leadData);
        }
      }
    } catch (error: any) {
      console.error('Error fetching activity details:', error);
      toast.error('Failed to load activity details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Activity Details - {activityId}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !activity ? (
          <p className="text-center py-8 text-muted-foreground">Activity not found</p>
        ) : (
          <div className="space-y-6">
            {/* Activity Information */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Activity Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {activity.activity_type && <div><span className="font-medium">Type:</span> {activity.activity_type}</div>}
                {activity.event_type && <div><span className="font-medium">Event Type:</span> {activity.event_type}</div>}
                {activity.activity_date && <div><span className="font-medium">Date:</span> {activity.activity_date}</div>}
                {activity.effective_date && <div><span className="font-medium">Effective Date:</span> {activity.effective_date}</div>}
                {activity.employee && <div><span className="font-medium">Employee:</span> {activity.employee}</div>}
                {activity.created_by && <div><span className="font-medium">Created By:</span> {activity.created_by}</div>}
                {activity.media_type && <div><span className="font-medium">Media Type:</span> {activity.media_type}</div>}
              </div>
              {activity.description && (
                <div className="mt-3">
                  <span className="font-medium">Description:</span>
                  <p className="text-muted-foreground mt-1">{activity.description}</p>
                </div>
              )}
              {activity.activity_description && (
                <div className="mt-3">
                  <span className="font-medium">Activity Description:</span>
                  <p className="text-muted-foreground mt-1">{activity.activity_description}</p>
                </div>
              )}
              {activity.file_path && (
                <div className="mt-3">
                  <span className="font-medium">File:</span>
                  <a href={activity.file_path} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-2">
                    View File
                  </a>
                </div>
              )}
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
                </div>
                {customer.comments && (
                  <div className="mt-3">
                    <span className="font-medium">Comments:</span>
                    <p className="text-muted-foreground mt-1">{customer.comments}</p>
                  </div>
                )}
              </div>
            )}

            {/* Lead Information */}
            {lead && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Associated Lead</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {lead.lead_name && <div><span className="font-medium">Name:</span> {lead.lead_name}</div>}
                  {lead.type_of_lead && <div><span className="font-medium">Type:</span> {lead.type_of_lead}</div>}
                  {lead.current_status && <div><span className="font-medium">Status:</span> {lead.current_status}</div>}
                  {lead.previous_status && <div><span className="font-medium">Previous Status:</span> {lead.previous_status}</div>}
                  {lead.developer && <div><span className="font-medium">Developer:</span> {lead.developer}</div>}
                  {lead.project_name && <div><span className="font-medium">Project:</span> {lead.project_name}</div>}
                  {lead.building_name && <div><span className="font-medium">Building:</span> {lead.building_name}</div>}
                  {lead.unit_type && <div><span className="font-medium">Unit Type:</span> {lead.unit_type}</div>}
                  {lead.number_of_bed_room && <div><span className="font-medium">Bedrooms:</span> {lead.number_of_bed_room}</div>}
                  {lead.budget && <div><span className="font-medium">Budget:</span> {lead.budget}</div>}
                  {lead.booking_amount && <div><span className="font-medium">Booking Amount:</span> {lead.booking_amount}</div>}
                  {lead.timeline && <div><span className="font-medium">Timeline:</span> {lead.timeline}</div>}
                  {lead.purpose_of_buying && <div><span className="font-medium">Purpose:</span> {lead.purpose_of_buying}</div>}
                  {lead.expected_date_of_booking && <div><span className="font-medium">Expected Booking Date:</span> {lead.expected_date_of_booking}</div>}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
