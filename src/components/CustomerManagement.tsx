import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Eye, Activity, Users, RefreshCw, List, FileSpreadsheet, FileText, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import LeadsPopupCard from './LeadsPopupCard';
import ActivitiesPopupCard from './ActivitiesPopupCard';
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
import { exportCustomersToPDF } from '@/utils/pdfExport';
import { exportCustomersToExcel } from '@/utils/excelExport';
import { motion, AnimatePresence } from 'framer-motion';

interface Customer {
  customer_id: string;
  customer_full_name: string;
  customer_name?: string;
  contact_no: number;
  email_address: string;
  email?: string;
  phone?: string;
  assigned_to: string;
  observer?: string;
  status: string;
  budget_range: string;
  source?: string;
  last_contacted_date: string;
  lead_id?: string;
  comments?: string;
}

interface CustomerManagementProps {
  onNavigate: (view: string, id?: string) => void;
}

const CustomerManagement: React.FC<CustomerManagementProps> = ({ onNavigate }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedCustomerForActivities, setSelectedCustomerForActivities] = useState<string | null>(null);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchQuery, statusFilter]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Customer')
        .select('*')
        .order('last_contacted_date', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    if (searchQuery) {
      filtered = filtered.filter(customer =>
        customer.customer_full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.assigned_to?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    setFilteredCustomers(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'inactive': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'qualified': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const formatContactNumber = (contact: number) => {
    if (!contact) return '';
    return contact.toString();
  };

  const deleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer? This will also delete all associated leads and activities. This action cannot be undone.')) return;

    try {
      setLoading(true);
      
      // First, find all leads associated with this customer
      const { data: associatedLeads, error: leadsQueryError } = await supabase
        .from('Lead')
        .select('lead_id')
        .eq('customer_id', customerId);

      if (leadsQueryError) throw leadsQueryError;

      // Delete activities associated with the customer directly
      const { error: customerActivitiesError } = await supabase
        .from('Activity')
        .delete()
        .eq('customer_id', customerId);

      if (customerActivitiesError) throw customerActivitiesError;

      // Delete activities associated with the leads
      if (associatedLeads && associatedLeads.length > 0) {
        const leadIds = associatedLeads.map(lead => lead.lead_id);
        const { error: leadActivitiesError } = await supabase
          .from('Activity')
          .delete()
          .in('lead_id', leadIds);

        if (leadActivitiesError) throw leadActivitiesError;

        // Delete the associated leads
        const { error: leadsDeleteError } = await supabase
          .from('Lead')
          .delete()
          .eq('customer_id', customerId);

        if (leadsDeleteError) throw leadsDeleteError;
      }

      // Finally, delete the customer
      const { error } = await supabase
        .from('Customer')
        .delete()
        .eq('customer_id', customerId);

      if (error) throw error;
      
      // Remove the deleted customer from the local state immediately
      setCustomers(prev => prev.filter(c => c.customer_id !== customerId));
      setFilteredCustomers(prev => prev.filter(c => c.customer_id !== customerId));
      
      alert('Customer and all associated data deleted successfully!');
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Error deleting customer');
    } finally {
      setLoading(false);
    }
  };

  const uniqueStatuses = [...new Set(customers.map(customer => customer.status).filter(Boolean))];

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
        <h1 className="text-xl sm:text-2xl font-bold text-foreground whitespace-nowrap">Customer Management</h1>
        <div className="flex items-center gap-2 flex-wrap">
           <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-8 px-2"
                                          onClick={() => exportCustomersToPDF(filteredCustomers)}
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
                                onClick={() => exportCustomersToExcel(filteredCustomers)}
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
                                onClick={fetchCustomers}
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
                      onClick={() => onNavigate('customer-form')}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add new Customer</TooltipContent>
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
            placeholder="Search customers..."
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
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Contact Number</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Budget Range</TableHead>
                  <TableHead>Last Contacted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        {searchQuery || statusFilter !== 'all' ? 'No customers match your search criteria' : 'No customers found. Add your first customer!'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <motion.tr
                        key={customer.customer_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-mono text-sm">{customer.customer_id}</TableCell>
                        <TableCell className="font-medium">{customer.customer_full_name}</TableCell>
                        <TableCell>{formatContactNumber(customer.contact_no)}</TableCell>
                        <TableCell>{customer.email_address}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(customer.status)} transition-colors`}>
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{customer.assigned_to}</TableCell>
                        <TableCell>{customer.budget_range}</TableCell>
                        <TableCell>{customer.last_contacted_date}</TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <div className="flex gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewCustomer(customer)}
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
                                    onClick={() => onNavigate('customer-edit', customer.customer_id)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Customer</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onNavigate('activity-form', `customer-${customer.customer_id}`)}
                                  >
                                    <Activity className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Add Activity</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedCustomer(customer.customer_id)}
                                  >
                                    <Users className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Associated Leads</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedCustomerForActivities(customer.customer_id)}
                                  >
                                    <List className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Activities</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteCustomer(customer.customer_id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Customer</TooltipContent>
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
          {filteredCustomers.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="text-center py-8 text-muted-foreground">
                {searchQuery || statusFilter !== 'all' ? 'No customers match your search criteria' : 'No customers found. Add your first customer!'}
              </CardContent>
            </Card>
          ) : (
            filteredCustomers.map((customer) => (
              <motion.div
                key={customer.customer_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold">{customer.customer_full_name}</h3>
                        <p className="text-sm text-muted-foreground">ID: {customer.customer_id}</p>
                      </div>
                      <Badge className={`${getStatusColor(customer.status)} transition-colors`}>
                        {customer.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Contact:</span> {formatContactNumber(customer.contact_no)}</p>
                      <p><span className="font-medium">Email:</span> {customer.email_address}</p>
                      <p><span className="font-medium">Assigned:</span> {customer.assigned_to}</p>
                      <p><span className="font-medium">Budget:</span> {customer.budget_range}</p>
                      <p><span className="font-medium">Last Contacted:</span> {customer.last_contacted_date}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewCustomer(customer)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigate('customer-edit', customer.customer_id)}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigate('activity-form', `customer-${customer.customer_id}`)}
                      >
                        <Activity className="h-4 w-4 mr-1" /> Add Activity
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCustomer(customer.customer_id)}
                      >
                        <Users className="h-4 w-4 mr-1" /> Leads
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCustomerForActivities(customer.customer_id)}
                      >
                        <List className="h-4 w-4 mr-1" /> Activities
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCustomer(customer.customer_id)}
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
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        customerId={selectedCustomer || undefined}
        title="Associated Leads"
      />

      <ActivitiesPopupCard
        isOpen={!!selectedCustomerForActivities}
        onClose={() => setSelectedCustomerForActivities(null)}
        customerId={selectedCustomerForActivities || undefined}
        title="Customer Activities"
      />

      <Dialog open={!!viewCustomer} onOpenChange={() => setViewCustomer(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {viewCustomer && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Customer ID</Label>
                  <p className="font-mono font-semibold">{viewCustomer.customer_id}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Full Name</Label>
                  <p className="font-semibold">{viewCustomer.customer_full_name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Customer Name</Label>
                  <p className="font-semibold">{viewCustomer.customer_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(viewCustomer.status)}>
                    {viewCustomer.status}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Contact Number</Label>
                    <p className="font-semibold">{formatContactNumber(viewCustomer.contact_no)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Email Address</Label>
                    <p className="font-semibold">{viewCustomer.email_address || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Alternative Email</Label>
                    <p className="font-semibold">{viewCustomer.email || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Phone</Label>
                    <p className="font-semibold">{viewCustomer.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Business Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Assigned To</Label>
                    <p className="font-semibold">{viewCustomer.assigned_to || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Observer</Label>
                    <p className="font-semibold">{viewCustomer.observer || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Budget Range</Label>
                    <p className="font-semibold">{viewCustomer.budget_range || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Source</Label>
                    <p className="font-semibold">{viewCustomer.source || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Last Contacted Date</Label>
                    <p className="font-semibold">{viewCustomer.last_contacted_date || 'N/A'}</p>
                  </div>
                  {viewCustomer.lead_id && (
                    <div className="col-span-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <Label className="text-sm text-blue-600 dark:text-blue-400">Converted from Lead</Label>
                      <p className="font-semibold mt-1">Lead ID: {viewCustomer.lead_id}</p>
                    </div>
                  )}
                </div>
              </div>

              {viewCustomer.comments && (
                <div className="border-t pt-4">
                  <Label className="text-sm text-muted-foreground">Comments</Label>
                  <p className="mt-1 p-3 bg-muted rounded-md">{viewCustomer.comments}</p>
                </div>
              )}
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerManagement;