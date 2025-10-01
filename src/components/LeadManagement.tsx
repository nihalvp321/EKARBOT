import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Eye,FileSpreadsheet, UserPlus, Activity, RefreshCw, List, FileText, UserCheck, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import CustomerConversionForm from './CustomerConversionForm';
import ActivitiesPopupCard from './ActivitiesPopupCard';
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
import { exportLeadsToPDF } from '@/utils/pdfExport';
import { exportLeadsToExcel } from '@/utils/excelExport';
import { motion, AnimatePresence } from 'framer-motion';

interface Lead {
  lead_id: string;
  lead_name: string;
  current_status: string;
  previous_status?: string;
  type_of_lead?: string;
  project_name: string;
  developer?: string;
  building_name?: string;
  unit_number: string;
  unit_type?: string;
  number_of_bed_room?: string;
  budget: string;
  booking_amount?: string;
  timeline?: string;
  expected_date_of_booking?: string;
  purpose_of_buying?: string;
  assigned_to?: string;
  effective_date_of_change: string;
  customer_id?: string;
}

interface LeadManagementProps {
  onNavigate: (view: string, id?: string) => void;
}

const LeadManagement: React.FC<LeadManagementProps> = ({ onNavigate }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLeadForActivities, setSelectedLeadForActivities] = useState<string | null>(null);
  const [selectedLeadForCustomer, setSelectedLeadForCustomer] = useState<string | null>(null);
  const [viewLead, setViewLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchQuery, statusFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Lead')
        .select('*')
        .order('effective_date_of_change', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    if (searchQuery) {
      filtered = filtered.filter(lead =>
        lead.lead_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.assigned_to?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.current_status === statusFilter);
    }

    setFilteredLeads(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'converted': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'lost': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'new': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'contacted': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const [conversionData, setConversionData] = useState<{leadId: string, leadName: string} | null>(null);

  const handleConvertToCustomer = (leadId: string) => {
    const lead = leads.find(l => l.lead_id === leadId);
    if (!lead) return;
    
    setConversionData({
      leadId,
      leadName: lead.lead_name
    });
  };

  const handleConversionSuccess = () => {
    setConversionData(null);
    fetchLeads();
  };

  const deleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) return;

    try {
      setLoading(true);
      
      const { error: activitiesError } = await supabase
        .from('Activity')
        .delete()
        .eq('lead_id', leadId);

      if (activitiesError) throw activitiesError;

      const { error } = await supabase
        .from('Lead')
        .delete()
        .eq('lead_id', leadId);

      if (error) throw error;
      
      setLeads(prev => prev.filter(l => l.lead_id !== leadId));
      setFilteredLeads(prev => prev.filter(l => l.lead_id !== leadId));
      
      alert('Lead deleted successfully!');
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Error deleting lead');
    } finally {
      setLoading(false);
    }
  };

  const uniqueStatuses = [...new Set(leads.map(lead => lead.current_status).filter(Boolean))];

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

  if (conversionData) {
    return (
      <CustomerConversionForm
        leadId={conversionData.leadId}
        leadName={conversionData.leadName}
        onBack={() => setConversionData(null)}
        onSuccess={handleConversionSuccess}
      />
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
        <h1 className="text-xl sm:text-2xl font-bold text-foreground whitespace-nowrap">Lead Management</h1>
        <div className="flex items-center gap-2 flex-wrap">

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => exportLeadsToPDF(filteredLeads)}
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
            onClick={() => exportLeadsToExcel(filteredLeads)}
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
            onClick={fetchLeads}
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
            onClick={() => onNavigate('lead-form')}
          >
            <Plus className="h-4 w-4" />
          </Button>
          </TooltipTrigger>
          <TooltipContent>Add New Lead</TooltipContent>
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
      
      {/* Search + Status */}
      <div className="flex gap-3 flex-col sm:flex-row">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10 py-2 text-sm rounded-lg bg-white border border-gray-200"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] rounded-lg bg-white border border-gray-200 text-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {uniqueStatuses.map(status => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                  <TableHead>Lead ID</TableHead>
                  <TableHead>Lead Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Unit Number</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        {searchQuery || statusFilter !== 'all' ? 'No leads match your search criteria' : 'No leads found. Add your first lead!'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => (
                      <motion.tr
                        key={lead.lead_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-mono text-sm">{lead.lead_id}</TableCell>
                        <TableCell className="font-medium">{lead.lead_name}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(lead.current_status)} transition-colors`}>
                            {lead.current_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{lead.project_name}</TableCell>
                        <TableCell>{lead.unit_number}</TableCell>
                        <TableCell>{lead.budget}</TableCell>
                        <TableCell>{lead.assigned_to}</TableCell>
                        <TableCell>{lead.effective_date_of_change}</TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <div className="flex gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewLead(lead)}
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
                                    onClick={() => onNavigate('lead-edit', lead.lead_id)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Lead</TooltipContent>
                              </Tooltip>
                              {lead.current_status !== 'Converted' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleConvertToCustomer(lead.lead_id)}
                                    >
                                      <UserPlus className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Convert to Customer</TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedLeadForActivities(lead.lead_id)}
                                  >
                                    <Activity className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs">
                                    <p className="font-semibold">View Associated</p>
                                    <p>Activities</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                              {lead.customer_id && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setSelectedLeadForCustomer(lead.lead_id)}
                                    >
                                      <UserCheck className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-xs">
                                      <p className="font-semibold">View Associated</p>
                                      <p>Customer</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteLead(lead.lead_id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Lead</TooltipContent>
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
          {filteredLeads.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="text-center py-8 text-muted-foreground">
                {searchQuery || statusFilter !== 'all' ? 'No leads match your search criteria' : 'No leads found. Add your first lead!'}
              </CardContent>
            </Card>
          ) : (
            filteredLeads.map((lead) => (
              <motion.div
                key={lead.lead_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold">{lead.lead_name}</h3>
                        <p className="text-sm text-muted-foreground">ID: {lead.lead_id}</p>
                      </div>
                      <Badge className={`${getStatusColor(lead.current_status)} transition-colors`}>
                        {lead.current_status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Project:</span> {lead.project_name}</p>
                      <p><span className="font-medium">Unit:</span> {lead.unit_number}</p>
                      <p><span className="font-medium">Budget:</span> {lead.budget}</p>
                      <p><span className="font-medium">Assigned:</span> {lead.assigned_to}</p>
                      <p><span className="font-medium">Updated:</span> {lead.effective_date_of_change}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewLead(lead)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigate('lead-edit', lead.lead_id)}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      {lead.current_status !== 'Converted' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConvertToCustomer(lead.lead_id)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" /> Convert
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLeadForActivities(lead.lead_id)}
                      >
                        <Activity className="h-4 w-4 mr-1" /> Activities
                      </Button>
                      {lead.customer_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLeadForCustomer(lead.lead_id)}
                        >
                          <UserCheck className="h-4 w-4 mr-1" /> Customer
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteLead(lead.lead_id)}
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

      <ActivitiesPopupCard
        isOpen={!!selectedLeadForActivities}
        onClose={() => setSelectedLeadForActivities(null)}
        leadId={selectedLeadForActivities || undefined}
        title="Lead Activities"
      />

      <CustomersPopupCard
        isOpen={!!selectedLeadForCustomer}
        onClose={() => setSelectedLeadForCustomer(null)}
        activityId={selectedLeadForCustomer || ''}
        title="Associated Customer"
      />

      <Dialog open={!!viewLead} onOpenChange={() => setViewLead(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          {viewLead && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Lead ID</Label>
                  <p className="font-mono font-semibold">{viewLead.lead_id}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Lead Name</Label>
                  <p className="font-semibold">{viewLead.lead_name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Current Status</Label>
                  <Badge className={getStatusColor(viewLead.current_status)}>
                    {viewLead.current_status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Previous Status</Label>
                  <p className="font-semibold">{viewLead.previous_status || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Type of Lead</Label>
                  <p className="font-semibold">{viewLead.type_of_lead || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Effective Date of Change</Label>
                  <p className="font-semibold">{viewLead.effective_date_of_change || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Property Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Project Name</Label>
                    <p className="font-semibold">{viewLead.project_name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Developer</Label>
                    <p className="font-semibold">{viewLead.developer || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Building Name</Label>
                    <p className="font-semibold">{viewLead.building_name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Unit Number</Label>
                    <p className="font-semibold">{viewLead.unit_number || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Unit Type</Label>
                    <p className="font-semibold">{viewLead.unit_type || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Number of Bedrooms</Label>
                    <p className="font-semibold">{viewLead.number_of_bed_room || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Financial Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Budget</Label>
                    <p className="font-semibold">{viewLead.budget || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Booking Amount</Label>
                    <p className="font-semibold">{viewLead.booking_amount || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Timeline</Label>
                    <p className="font-semibold">{viewLead.timeline || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Expected Date of Booking</Label>
                    <p className="font-semibold">{viewLead.expected_date_of_booking || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Purpose of Buying</Label>
                    <p className="font-semibold">{viewLead.purpose_of_buying || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Assigned To</Label>
                    <p className="font-semibold">{viewLead.assigned_to || 'N/A'}</p>
                  </div>
                  {viewLead.customer_id && (
                    <div className="col-span-2 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <Label className="text-sm text-green-600 dark:text-green-400">Converted to Customer</Label>
                      <p className="font-semibold mt-1">Customer ID: {viewLead.customer_id}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadManagement;