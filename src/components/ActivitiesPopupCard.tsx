import React, { useState, useEffect } from 'react';
import { Activity as ActivityIcon, Calendar, FileText, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Activity {
  activity_id: string;
  activity_date: string;
  activity_type: string;
  event_type: string;
  description: string;
  created_by: string;
  employee: string;
  media_type: string;
  created_at: string;
}

interface ActivitiesPopupCardProps {
  isOpen: boolean;
  onClose: () => void;
  leadId?: string;
  customerId?: string;
  title: string;
}

const ActivitiesPopupCard: React.FC<ActivitiesPopupCardProps> = ({ 
  isOpen, 
  onClose, 
  leadId,
  customerId,
  title 
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && (leadId || customerId)) {
      fetchActivities();
    }
  }, [isOpen, leadId, customerId]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      let query = supabase.from('Activity').select('*');
      
      if (leadId) {
        query = query.eq('lead_id', leadId);
      } else if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      
      const { data, error } = await query.order('activity_date', { ascending: false });
      
      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'call': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'meeting': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'email': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'site visit': return 'bg-orange-500/10 text-orange-700 border-orange-200';
      case 'follow-up': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading activities...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <ActivityIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No activities found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {activities.map((activity) => (
                <Card key={activity.activity_id} className="border border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {activity.activity_type || 'Activity'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">ID: {activity.activity_id}</p>
                      </div>
                      <Badge className={getActivityTypeColor(activity.activity_type)}>
                        {activity.activity_type || 'General'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Date</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.activity_date || 'Not specified'}
                          </p>
                        </div>
                      </div>
                      
                      {activity.event_type && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Event Type</p>
                            <p className="text-sm text-muted-foreground">
                              {activity.event_type}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {activity.created_by && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Created By</p>
                            <p className="text-sm text-muted-foreground">
                              {activity.created_by}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {activity.employee && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Employee</p>
                            <p className="text-sm text-muted-foreground">
                              {activity.employee}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {activity.media_type && (
                        <div>
                          <p className="text-sm font-medium">Media Type</p>
                          <p className="text-sm text-muted-foreground">{activity.media_type}</p>
                        </div>
                      )}
                    </div>
                    
                    {activity.description && (
                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium mb-1">Description</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(activity.created_at).toLocaleString()}
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

export default ActivitiesPopupCard;
