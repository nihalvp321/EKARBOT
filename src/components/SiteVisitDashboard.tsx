import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, User, Clock, CheckCircle, XCircle, AlertCircle, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDeveloperAuth } from '@/hooks/useDeveloperAuth';

interface SiteVisit {
  id: string;
  project_id: string;
  project_title: string;
  developer_name: string;
  buyer_name: string;
  sales_agent_id: string;
  visit_date: string;
  visit_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
  created_at: string;
  updated_at: string;
}

const SiteVisitDashboard = () => {
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const { user, profile } = useDeveloperAuth();

  useEffect(() => {
    if (user && profile) {
      fetchVisits();
    }
  }, [user, profile]);

  useEffect(() => {
    if (selectedStatus === 'all') {
      setFilteredVisits(visits);
    } else {
      setFilteredVisits(visits.filter(visit => visit.status === selectedStatus));
    }
  }, [visits, selectedStatus]);

  const fetchVisits = async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    try {
      // Filter visits by the logged-in developer's name
      const { data, error } = await supabase
        .from('site_visits')
        .select('*')
        .eq('developer_name', profile.developer_name)
        .order('visit_date', { ascending: false });

      if (error) {
        console.error('Error fetching visits:', error);
        toast.error('Failed to fetch site visits');
        return;
      }

      // Type-cast the status field to ensure it matches our interface
      const typedVisits = (data || []).map(visit => ({
        ...visit,
        status: (visit.status as 'scheduled' | 'completed' | 'cancelled') || 'scheduled'
      }));

      setVisits(typedVisits);
    } catch (error) {
      console.error('Error fetching visits:', error);
      toast.error('Failed to fetch site visits');
    } finally {
      setLoading(false);
    }
  };

  const getVisitStats = () => {
    const total = visits.length;
    const scheduled = visits.filter(v => v.status === 'scheduled').length;
    const completed = visits.filter(v => v.status === 'completed').length;
    const cancelled = visits.filter(v => v.status === 'cancelled').length;

    return { total, scheduled, completed, cancelled };
  };

  const stats = getVisitStats();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { backgroundColor: '#dbeafe', color: '#1e40af' };
      case 'completed':
        return { backgroundColor: '#dcfce7', color: '#166534' };
      case 'cancelled':
        return { backgroundColor: '#fee2e2', color: '#dc2626' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <AlertCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  if (loading) {
  return (
    <div className="flex items-center justify-center min-h-[400px] flex-col space-y-8">
      {/* Morphing blob animation with logo */}
      <div className="relative">
        {/* Animated blob background */}
        <div className="w-24 h-24 bg-gradient-to-br from-blue-400/20 via-purple-500/15 to-indigo-600/20 rounded-full relative overflow-hidden"
             style={{
               animation: 'morph 4s ease-in-out infinite',
               filter: 'blur(1px)'
             }}>
          <div className="absolute inset-2 bg-gradient-to-tr from-cyan-400/30 to-pink-500/25 rounded-full"
               style={{animation: 'morph 3s ease-in-out infinite reverse'}}></div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 w-24 h-24">
          {[...Array(6)].map((_, i) => (
            <div key={i} 
                 className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-60"
                 style={{
                   top: `${20 + i * 10}%`,
                   left: `${15 + i * 12}%`,
                   animation: `float ${2 + i * 0.3}s ease-in-out infinite`,
                   animationDelay: `${i * 0.2}s`
                 }}></div>
          ))}
        </div>
        
        {/* Logo with breathing effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative"
               style={{animation: 'breathe 2.5s ease-in-out infinite'}}>
            <img 
              src="/lovable-uploads/00baa288-f375-4798-aa52-0272029ed647.png"
              alt="EkarBot"
              className="w-10 h-10 relative z-10"
            />
            <div className="absolute inset-0 bg-white/30 rounded-lg blur-sm transform scale-110 -z-10"
                 style={{animation: 'glow 2s ease-in-out infinite alternate'}}></div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes morph {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: rotate(0deg) scale(1); }
          25% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; transform: rotate(90deg) scale(1.05); }
          50% { border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%; transform: rotate(180deg) scale(0.95); }
          75% { border-radius: 60% 40% 60% 30% / 70% 30% 60% 70%; transform: rotate(270deg) scale(1.02); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.6; }
          33% { transform: translateY(-8px) translateX(4px) scale(1.1); opacity: 0.8; }
          66% { transform: translateY(4px) translateX(-6px) scale(0.9); opacity: 0.4; }
        }
        
        @keyframes breathe {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(2deg); }
        }
        
        @keyframes glow {
          0% { opacity: 0.3; transform: scale(1.1); }
          100% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
      
      {/* Modern text with shimmer effect */}
      <div className="relative overflow-hidden">
        <div className="text-xl font-medium text-gray-700 bg-gradient-to-r from-gray-700 via-gray-900 to-gray-700 bg-clip-text text-transparent animate-pulse">
          Loading site visits...
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
      </div>
      
      {/* Progress dots */}
      <div className="flex space-x-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.3s]"></div>
      </div>
    </div>
  );
}

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Site Visit Dashboard</h1>
        {profile && (
          <p className="text-gray-600">Showing visits for: <span className="font-semibold">{profile.developer_name}</span></p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedStatus('all')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Visits</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedStatus('scheduled')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.scheduled}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedStatus('completed')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedStatus('cancelled')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedStatus === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedStatus('all')}
        >
          All Visits ({stats.total})
        </Button>
        <Button
          variant={selectedStatus === 'scheduled' ? 'default' : 'outline'}
          onClick={() => setSelectedStatus('scheduled')}
        >
          Scheduled ({stats.scheduled})
        </Button>
        <Button
          variant={selectedStatus === 'completed' ? 'default' : 'outline'}
          onClick={() => setSelectedStatus('completed')}
        >
          Completed ({stats.completed})
        </Button>
        <Button
          variant={selectedStatus === 'cancelled' ? 'default' : 'outline'}
          onClick={() => setSelectedStatus('cancelled')}
        >
          Cancelled ({stats.cancelled})
        </Button>
      </div>

      {/* Site Visits List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Site Visit Records
            {selectedStatus !== 'all' && (
              <Badge variant="outline" className="ml-2">
                {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredVisits.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {selectedStatus === 'all' ? 'No Site Visits Found' : `No ${selectedStatus} visits found`}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {selectedStatus === 'all' 
                  ? 'No site visits have been scheduled for your projects yet.'
                  : `There are currently no ${selectedStatus} site visits for your projects.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVisits.map((visit) => (
                <Card key={visit.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg text-gray-900 mb-2">
                          {visit.project_title}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span>{visit.developer_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{visit.buyer_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{new Date(visit.visit_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{visit.visit_time}</span>
                          </div>
                        </div>

                        {visit.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>Notes:</strong> {visit.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium" style={getStatusColor(visit.status)}>
                          {getStatusIcon(visit.status)}
                          {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                        </div>
                        
                        <div className="text-xs text-gray-500 text-right">
                          <div>Agent: {visit.sales_agent_id}</div>
                          <div>Created: {new Date(visit.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteVisitDashboard;
