import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Eye, Play, Trash2, RefreshCw, Users, UserCheck, FileSpreadsheet, FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import LeadsPopupCard from './LeadsPopupCard';
import CustomersPopupCard from './CustomersPopupCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { exportActivitiesToPDF } from '@/utils/pdfExport';
import { exportActivitiesToExcel } from '@/utils/excelExport';
import { motion, AnimatePresence } from 'framer-motion';

interface Activity {
  activity_id: string;
  activity_date: string;
  activity_type: string;
  lead_id?: string;
  customer_id?: string;
  created_by: string;
  description: string;
  file_path?: string;
  media_type?: string;
  event_type?: string;
  Lead?: { lead_name: string } | null;
  Customer?: { customer_full_name: string } | null;
}

interface ActivityManagementProps {
  onNavigate: (view: string, id?: string) => void;
}

const ActivityManagement: React.FC<ActivityManagementProps> = ({ onNavigate }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedActivityForLeads, setSelectedActivityForLeads] = useState<string | null>(null);
  const [selectedActivityForCustomers, setSelectedActivityForCustomers] = useState<string | null>(null);
  const [viewActivity, setViewActivity] = useState<Activity | null>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [activities, searchQuery, typeFilter, startDate, endDate]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      // First fetch activities without joins to avoid foreign key naming issues
      const { data, error } = await supabase
        .from('Activity')
        .select('*')
        .order('activity_date', { ascending: false });

      if (error) throw error;
      
      // Manually fetch related lead and customer data
      const activitiesWithRelations = await Promise.all(
        (data || []).map(async (activity) => {
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

      setActivities(activitiesWithRelations || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = activities;

    if (searchQuery) {
      filtered = filtered.filter(activity =>
        activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.created_by?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.Lead?.lead_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.Customer?.customer_full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.activity_type === typeFilter || activity.event_type === typeFilter);
    }

    // Date range filter
    if (startDate && endDate) {
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.activity_date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return activityDate >= start && activityDate <= end;
      });
    } else if (startDate) {
      filtered = filtered.filter(activity => new Date(activity.activity_date) >= new Date(startDate));
    } else if (endDate) {
      filtered = filtered.filter(activity => new Date(activity.activity_date) <= new Date(endDate));
    }

    setFilteredActivities(filtered);
  };

  const deleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      const { error } = await supabase
        .from('Activity')
        .delete()
        .eq('activity_id', activityId);

      if (error) throw error;
      
      // Remove from local state
      setActivities(prev => prev.filter(a => a.activity_id !== activityId));
      setFilteredActivities(prev => prev.filter(a => a.activity_id !== activityId));
      
      alert('Activity deleted successfully!');
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Error deleting activity');
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'call': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'meeting': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'email': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'visit': return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const playAudio = (filePath: string) => {
    if (!filePath) return;
    const audio = new Audio(filePath);
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      alert('Unable to play audio file');
    });
  };

  const uniqueTypes = [...new Set([
    ...activities.map(activity => activity.activity_type).filter(Boolean),
    ...activities.map(activity => activity.event_type).filter(Boolean)
  ])];

  if (loading) {
    return (
      <div className="p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="animate-pulse space-y-4"
        >
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-64 bg-muted rounded"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Mobile Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between gap-2 flex-wrap md:flex-nowrap"
      >
        <h1 className="text-xl sm:text-2xl font-bold text-foreground whitespace-nowrap">Activity Management</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Tooltip>
                          <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2"
                                onClick={() => exportActivitiesToPDF(filteredActivities)}
                              >
                                  <FileText className="h-4 w-4" />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent>Export PDF</TooltipContent>
                      </Tooltip>
          
                    <Tooltip>
                      <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => exportActivitiesToExcel(filteredActivities)}
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent>Export Excel</TooltipContent>
                    </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={fetchActivities}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh</TooltipContent>
                    </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button  
            variant="default" 
            size="sm" 
            className="h-8 px-2"
            onClick={() => onNavigate('activity-form')}
          >
            <Plus className="h-4 w-4" />
          </Button>
          </TooltipTrigger>
          <TooltipContent>Add new Activity</TooltipContent>
          </Tooltip>
        </div>
      </motion.div>

     {/* Filters */}
<motion.div
  initial={{ y: -20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.5, delay: 0.1 }}
>
  <Card className="shadow-lg">
    <CardContent className="pt-4 sm:pt-6 space-y-4">
      
      {/* Search + Type */}
      <div className="flex gap-3 flex-col sm:flex-row">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10 py-2 text-sm rounded-lg bg-white"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px] rounded-lg bg-white">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {uniqueTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Date Range */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Label className="text-sm text-muted-foreground whitespace-nowrap">Date Range:</Label>
        
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full sm:w-44 rounded-lg text-sm px-3 py-2 bg-white"
        />
        
        <span className="text-muted-foreground hidden sm:inline">to</span>
        
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full sm:w-44 rounded-lg text-sm px-3 py-2 bg-white"
        />

        {(startDate || endDate) && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="w-full sm:w-auto rounded-lg"
          >
            Clear Range
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
</motion.div>

      {/* Desktop Table View */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="hidden md:block"
      >
        <Card className="shadow-lg overflow-hidden">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Activity ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Related To</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredActivities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {searchQuery || typeFilter !== 'all' || startDate || endDate ? 'No activities match your search criteria' : 'No activities found. Add your first activity!'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredActivities.map((activity) => (
                      <motion.tr
                        key={activity.activity_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-mono text-sm">{activity.activity_id}</TableCell>
                        <TableCell>{activity.activity_date}</TableCell>
                        <TableCell>
                          <Badge className={`${getActivityTypeColor(activity.activity_type || activity.event_type)} transition-colors`}>
                            {activity.activity_type || activity.event_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {activity.Lead?.lead_name && (
                            <span className="text-blue-600">Lead: {activity.Lead.lead_name}</span>
                          )}
                          {activity.Customer?.customer_full_name && (
                            <span className="text-green-600">Customer: {activity.Customer.customer_full_name}</span>
                          )}
                        </TableCell>
                        <TableCell>{activity.created_by}</TableCell>
                        <TableCell className="max-w-xs truncate">{activity.description}</TableCell>
                        <TableCell>
                          {activity.file_path && activity.media_type && (
                            <>
                              {activity.media_type.toLowerCase().includes('image') ? (
                                <img 
                                  src={activity.file_path} 
                                  alt="Activity media"
                                  className="h-10 w-10 rounded object-cover cursor-pointer"
                                  onClick={() => window.open(activity.file_path, '_blank')}
                                />
                              ) : activity.media_type.toLowerCase().includes('video') ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(activity.file_path, '_blank')}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              ) : activity.media_type.toLowerCase().includes('audio') ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => playAudio(activity.file_path)}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(activity.file_path, '_blank')}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                          {activity.media_type && !activity.file_path && (
                            <Badge variant="outline">{activity.media_type}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <div className="flex gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewActivity(activity)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Details</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onNavigate('activity-edit', activity.activity_id)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Activity</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedActivityForLeads(activity.activity_id)}
                                  >
                                    <Users className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs">
                                    <p className="font-semibold">View Associated</p>
                                    <p>Leads</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedActivityForCustomers(activity.activity_id)}
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs">
                                    <p className="font-semibold">View Associated</p>
                                    <p>Customers</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteActivity(activity.activity_id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Activity</TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mobile Card View */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="md:hidden space-y-4"
      >
        <AnimatePresence>
          {filteredActivities.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="text-center py-8 text-muted-foreground">
                {searchQuery || typeFilter !== 'all' || startDate || endDate ? 'No activities match your search criteria' : 'No activities found. Add your first activity!'}
              </CardContent>
            </Card>
          ) : (
            filteredActivities.map((activity) => (
              <motion.div
                key={activity.activity_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold">{activity.activity_type || activity.event_type}</h3>
                        <p className="text-sm text-muted-foreground">ID: {activity.activity_id}</p>
                      </div>
                      <Badge className={`${getActivityTypeColor(activity.activity_type || activity.event_type)} transition-colors`}>
                        {activity.activity_type || activity.event_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Date:</span> {activity.activity_date}</p>
                      <p><span className="font-medium">Related To:</span> {activity.Lead?.lead_name ? `Lead: ${activity.Lead.lead_name}` : ''} {activity.Customer?.customer_full_name ? `Customer: ${activity.Customer.customer_full_name}` : ''}</p>
                      <p><span className="font-medium">Created By:</span> {activity.created_by}</p>
                      <p><span className="font-medium">Description:</span> {activity.description}</p>
                      {activity.file_path && activity.media_type && (
                        <p><span className="font-medium">Media:</span> {activity.media_type}</p>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewActivity(activity)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigate('activity-edit', activity.activity_id)}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedActivityForLeads(activity.activity_id)}
                      >
                        <Users className="h-4 w-4 mr-1" /> Leads
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedActivityForCustomers(activity.activity_id)}
                      >
                        <UserCheck className="h-4 w-4 mr-1" /> Customers
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteActivity(activity.activity_id)}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      <LeadsPopupCard
        isOpen={!!selectedActivityForLeads}
        onClose={() => setSelectedActivityForLeads(null)}
        activityId={selectedActivityForLeads || undefined}
        title="Associated Leads"
      />

      <CustomersPopupCard
        isOpen={!!selectedActivityForCustomers}
        onClose={() => setSelectedActivityForCustomers(null)}
        activityId={selectedActivityForCustomers || ''}
        title="Associated Customers"
      />

      <Dialog open={!!viewActivity} onOpenChange={() => setViewActivity(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
          </DialogHeader>
          {viewActivity && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Activity ID</Label>
                  <p className="font-mono font-semibold">{viewActivity.activity_id}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Activity Date</Label>
                  <p className="font-semibold">{viewActivity.activity_date}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Activity Type</Label>
                  <p className="font-semibold">{viewActivity.activity_type}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Event Type</Label>
                  <p className="font-semibold">{viewActivity.event_type || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Created By</Label>
                  <p className="font-semibold">{viewActivity.created_by || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Media Type</Label>
                  <p className="font-semibold">{viewActivity.media_type || 'None'}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Description</Label>
                <p className="mt-1 p-3 bg-muted rounded-md">{viewActivity.description || 'No description'}</p>
              </div>

              {viewActivity.Lead && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <Label className="text-sm text-blue-600 dark:text-blue-400">Associated Lead</Label>
                  <p className="font-semibold mt-1">{viewActivity.Lead.lead_name}</p>
                  <p className="text-sm text-muted-foreground">Lead ID: {viewActivity.lead_id}</p>
                </div>
              )}

              {viewActivity.Customer && (
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <Label className="text-sm text-green-600 dark:text-green-400">Associated Customer</Label>
                  <p className="font-semibold mt-1">{viewActivity.Customer.customer_full_name}</p>
                  <p className="text-sm text-muted-foreground">Customer ID: {viewActivity.customer_id}</p>
                </div>
              )}

              {viewActivity.file_path && viewActivity.media_type && (
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-sm text-muted-foreground">Media File</Label>
                  <div className="mt-2 space-y-2">
                    {viewActivity.media_type.toLowerCase().includes('image') ? (
                      <img 
                        src={viewActivity.file_path} 
                        alt="Activity media"
                        className="max-w-full h-auto rounded-lg"
                      />
                    ) : viewActivity.media_type.toLowerCase().includes('video') ? (
                      <video 
                        src={viewActivity.file_path} 
                        controls
                        className="max-w-full h-auto rounded-lg"
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : viewActivity.media_type.toLowerCase().includes('audio') ? (
                      <audio 
                        src={viewActivity.file_path} 
                        controls
                        className="w-full"
                      >
                        Your browser does not support the audio tag.
                      </audio>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => window.open(viewActivity.file_path, '_blank')}>
                          <FileText className="h-4 w-4 mr-2" />
                          Open Document
                        </Button>
                      </div>
                    )}
                    <a 
                      href={viewActivity.file_path} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline block"
                    >
                      Open in new tab
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActivityManagement;