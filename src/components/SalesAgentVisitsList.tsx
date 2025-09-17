import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Calendar, Clock, User, Building,
  CheckCircle, XCircle, CalendarDays, Trash2, Search, Filter, X
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

type VisitStatus = 'scheduled' | 'completed' | 'cancelled';

interface SiteVisit {
  id: string;
  project_id: string;
  project_title: string;
  developer_name: string;
  buyer_name: string;
  sales_agent_id: string;
  visit_date: string;
  visit_time: string;
  status: VisitStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

const SalesAgentVisitsList = () => {
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { profile } = useSalesAgentAuth();

  useEffect(() => {
    fetchVisits();
  }, [profile]);

  // Memoized filtered visits
  const filteredVisits = useMemo(() => {
    return visits.filter(visit => {
      const matchesSearch = searchTerm === '' || 
        visit.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.developer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.buyer_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || visit.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [visits, searchTerm, statusFilter]);

  // Status counts for badges
  const statusCounts = useMemo(() => {
    const counts = visits.reduce((acc, visit) => {
      acc[visit.status] = (acc[visit.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      all: visits.length,
      scheduled: counts.scheduled || 0,
      completed: counts.completed || 0,
      cancelled: counts.cancelled || 0
    };
  }, [visits]);

  const fetchVisits = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('site_visits')
        .select('*')
        .eq('sales_agent_id', profile.sales_agent_id)
        .order('visit_date', { ascending: false });

      if (error) {
        toast.error('Failed to fetch visits');
        return;
      }

      const typedData = (data || []).map(visit => ({
        ...visit,
        status: visit.status as VisitStatus
      }));

      setVisits(typedData);
    } catch (error) {
      toast.error('Failed to fetch visits');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (visitId: string, newStatus: VisitStatus) => {
    try {
      const { error } = await supabase
        .from('site_visits')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', visitId);

      if (error) {
        toast.error('Failed to update visit status');
        return;
      }

      setVisits(prev =>
        prev.map(visit =>
          visit.id === visitId
            ? { ...visit, status: newStatus, updated_at: new Date().toISOString() }
            : visit
        )
      );

      toast.success('Visit status updated');
    } catch (error) {
      toast.error('Failed to update visit status');
    }
  };

  const handleDeleteVisit = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from('site_visits')
        .delete()
        .eq('id', deleteId);

      if (error) {
        toast.error('Failed to delete visit');
        return;
      }

      setVisits(prev => prev.filter(v => v.id !== deleteId));
      toast.success('Visit deleted');
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete visit');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  const getStatusColor = (status: VisitStatus) => {
    switch (status) {
      case 'scheduled': return { backgroundColor: '#dbeafe', color: '#1e40af' };
      case 'completed': return { backgroundColor: '#dcfce7', color: '#166534' };
      case 'cancelled': return { backgroundColor: '#fee2e2', color: '#dc2626' };
      default: return { backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  const getStatusIcon = (status: VisitStatus) => {
    switch (status) {
      case 'scheduled': return <CalendarDays className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getFilterBadgeColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
            Loading visit lists...
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
    <div className="p-6 space-y-6 animate-in fade-in duration-500" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 animate-in slide-in-from-top duration-700">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-700">
          <CalendarDays className="h-8 w-8 animate-pulse" />
          My Site Visits
        </h1>
        <Badge variant="outline" className="text-lg px-3 py-1 text-gray-700 border-gray-700 animate-in zoom-in duration-500 delay-200">
          {filteredVisits.length} of {visits.length} visits
        </Badge>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-xl p-6 shadow-lg border-0 animate-in slide-in-from-top duration-700 delay-100">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by project, developer, or buyer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 transition-colors duration-200"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Filter className="h-4 w-4 text-gray-600" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 border-gray-300 focus:border-blue-500 transition-colors duration-300">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="animate-in slide-in-from-top duration-200">
                <SelectItem value="all">
                  <div className="flex items-center justify-between w-full">
                    <span>All Status</span>
                    <Badge className={getFilterBadgeColor('all')}>{statusCounts.all}</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="scheduled">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      <span>Scheduled</span>
                    </div>
                    <Badge className={getFilterBadgeColor('scheduled')}>{statusCounts.scheduled}</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Completed</span>
                    </div>
                    <Badge className={getFilterBadgeColor('completed')}>{statusCounts.completed}</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="cancelled">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      <span>Cancelled</span>
                    </div>
                    <Badge className={getFilterBadgeColor('cancelled')}>{statusCounts.cancelled}</Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {(searchTerm || statusFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400 transition-all duration-300 animate-in zoom-in duration-200"
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || statusFilter !== 'all') && (
          <div className="mt-4 flex flex-wrap gap-2 animate-in slide-in-from-top duration-300 delay-100">
            {searchTerm && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                Search: "{searchTerm}"
              </Badge>
            )}
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className={getFilterBadgeColor(statusFilter)}>
                Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {filteredVisits.length === 0 ? (
        <div className="text-center py-12 animate-in fade-in duration-700 delay-300">
          {visits.length === 0 ? (
            <>
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400 animate-bounce" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Site Visits</h2>
              <p className="text-gray-600">Schedule your first site visit to see them here</p>
            </>
          ) : (
            <>
              <Search className="h-16 w-16 mx-auto mb-4 text-gray-400 animate-pulse" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No visits found</h2>
              <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
              <Button variant="outline" onClick={clearFilters} className="animate-in zoom-in duration-300">
                Clear filters
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredVisits.map((visit, index) => (
            <Card 
              key={visit.id} 
              className="shadow-lg border-0 rounded-xl bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-in slide-in-from-bottom duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl mb-2 text-gray-700 hover:text-gray-900 transition-colors duration-200">
                      {visit.project_title}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2 hover:text-gray-800 transition-colors duration-200">
                        <Building className="h-4 w-4 text-gray-700" />
                        <span>{visit.developer_name}</span>
                      </div>
                      <div className="flex items-center gap-2 hover:text-gray-800 transition-colors duration-200">
                        <User className="h-4 w-4 text-gray-700" />
                        <span>{visit.buyer_name}</span>
                      </div>
                      <div className="flex items-center gap-2 hover:text-gray-800 transition-colors duration-200">
                        <Calendar className="h-4 w-4 text-gray-700" />
                        <span>{new Date(visit.visit_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 hover:text-gray-800 transition-colors duration-200">
                        <Clock className="h-4 w-4 text-gray-700" />
                        <span>{visit.visit_time}</span>
                      </div>
                    </div>

                    {visit.notes && (
                      <div className="mt-4 p-3 rounded-lg bg-slate-100 hover:bg-slate-50 transition-colors duration-200 animate-in fade-in duration-300">
                        <h4 className="font-medium mb-1 text-gray-700">Notes</h4>
                        <p className="text-sm text-gray-600">{visit.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="ml-6 flex flex-col items-end gap-3">
                    <div 
                      className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105" 
                      style={getStatusColor(visit.status)}
                    >
                      {getStatusIcon(visit.status)}
                      {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                    </div>

                    <Select
                      value={visit.status}
                      onValueChange={(value: VisitStatus) => handleStatusUpdate(visit.id, value)}
                    >
                      <SelectTrigger className="w-36 border-gray-400 hover:border-gray-600 transition-colors duration-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="animate-in slide-in-from-top duration-200">
                        <SelectItem value="scheduled">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            Scheduled
                          </div>
                        </SelectItem>
                        <SelectItem value="completed">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Completed
                          </div>
                        </SelectItem>
                        <SelectItem value="cancelled">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            Cancelled
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="mt-2 flex items-center gap-2 text-sm hover:scale-105 transition-all duration-200"
                          onClick={() => setDeleteId(visit.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="animate-in zoom-in duration-300">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. It will permanently delete this visit.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteVisit}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="text-xs text-gray-400 border-t pt-3 border-gray-200 transition-colors duration-200 hover:text-gray-500">
                  Created: {new Date(visit.created_at).toLocaleDateString()} • Last updated: {new Date(visit.updated_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SalesAgentVisitsList;