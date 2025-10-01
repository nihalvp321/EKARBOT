import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Activity, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalLeads: number;
  totalCustomers: number;
  totalActivities: number;
  leadsByStatus: { status: string; count: number }[];
  upcomingActivities: any[];
}

interface CRMDashboardProps {
  onNavigate: (view: string, id?: string) => void;
}

const CRMDashboard: React.FC<CRMDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    totalCustomers: 0,
    totalActivities: 0,
    leadsByStatus: [],
    upcomingActivities: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // Leads
      const { data: leads } = await supabase.from('Lead').select('current_status');
      // Customers
      const { data: customers } = await supabase.from('Customer').select('customer_id');
      // Activities
      const { data: activities } = await supabase.from('Activity').select('activity_id');

      // Upcoming activities
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const { data: activitiesData } = await supabase
        .from('Activity')
        .select('*')
        .gte('activity_date', new Date().toISOString().split('T')[0])
        .lte('activity_date', nextWeek.toISOString().split('T')[0])
        .order('activity_date')
        .limit(5);

      const upcomingActivities = await Promise.all(
        (activitiesData || []).map(async (activity) => {
          let Lead = null;
          let Customer = null;

          if (activity.lead_id) {
            const { data: leadData } = await supabase
              .from('Lead')
              .select('lead_name')
              .eq('lead_id', activity.lead_id)
              .single();
            Lead = leadData;
          }
          if (activity.customer_id) {
            const { data: customerData } = await supabase
              .from('Customer')
              .select('customer_full_name')
              .eq('customer_id', activity.customer_id)
              .single();
            Customer = customerData;
          }
          return { ...activity, Lead, Customer };
        })
      );

      const statusCounts =
        leads?.reduce((acc, lead) => {
          const status = lead.current_status || 'Unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

      const leadsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count: count as number
      }));

      setStats({
        totalLeads: leads?.length || 0,
        totalCustomers: customers?.length || 0,
        totalActivities: activities?.length || 0,
        leadsByStatus,
        upcomingActivities: upcomingActivities || []
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'converted': return 'bg-green-100 text-green-700';
      case 'lost': return 'bg-red-100 text-red-700';
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'contacted': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-foreground">📊 CRM Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer hover:shadow-lg transition rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50"
          onClick={() => onNavigate('leads')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition rounded-xl bg-gradient-to-r from-green-50 to-emerald-50"
          onClick={() => onNavigate('customers')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <UserCheck className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50"
          onClick={() => onNavigate('activities')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActivities}</div>
          </CardContent>
        </Card>
      </div>

      {/* Leads by Status & Upcoming Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Leads by Status */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle>Leads by Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.leadsByStatus.map((item) => (
              <div key={item.status} className="flex justify-between items-center">
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Activities */}
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle>Upcoming Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcomingActivities.length === 0 ? (
              <p className="text-muted-foreground text-sm">No upcoming activities</p>
            ) : (
              <div className="space-y-3">
                {stats.upcomingActivities.map((activity) => (
                  <div
                    key={activity.activity_id}
                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium">{activity.activity_type || activity.event_type}</div>
                      <div className="text-sm text-muted-foreground">
                        {activity.Lead?.lead_name || activity.Customer?.customer_full_name}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      {activity.activity_date}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CRMDashboard;
