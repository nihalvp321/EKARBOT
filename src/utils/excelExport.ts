import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

export const exportLeadsToExcel = (leads: any[]) => {
  const worksheet = XLSX.utils.json_to_sheet(
    leads.map(lead => ({
      'Lead ID': lead.lead_id || '',
      'Lead Name': lead.lead_name || '',
      'Current Status': lead.current_status || '',
      'Previous Status': lead.previous_status || '',
      'Type of Lead': lead.type_of_lead || '',
      'Project Name': lead.project_name || '',
      'Developer': lead.developer || '',
      'Building Name': lead.building_name || '',
      'Unit Type': lead.unit_type || '',
      'Unit Number': lead.unit_number || '',
      'Bedrooms': lead.number_of_bed_room || '',
      'Budget': lead.budget || '',
      'Timeline': lead.timeline || '',
      'Booking Amount': lead.booking_amount || '',
      'Expected Booking Date': lead.expected_date_of_booking || '',
      'Purpose of Buying': lead.purpose_of_buying || '',
      'Effective Date': lead.effective_date_of_change || '',
      'Customer ID': lead.customer_id || ''
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
  XLSX.writeFile(workbook, 'leads_template.xlsx');
};

export const exportCustomersToExcel = (customers: any[]) => {
  const worksheet = XLSX.utils.json_to_sheet(
    customers.map(customer => ({
      'Customer ID': customer.customer_id || '',
      'Full Name': customer.customer_full_name || customer.customer_name || '',
      'Email': customer.email_address || customer.email || '',
      'Phone': customer.phone || customer.contact_no || '',
      'Status': customer.status || '',
      'Budget Range': customer.budget_range || '',
      'Source': customer.source || '',
      'Assigned To': customer.assigned_to || '',
      'Observer': customer.observer || '',
      'Comments': customer.comments || '',
      'Last Contacted': customer.last_contacted_date || '',
      'Lead ID': customer.lead_id || ''
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
  XLSX.writeFile(workbook, 'customers_template.xlsx');
};

export const exportActivitiesToExcel = (activities: any[]) => {
  const worksheet = XLSX.utils.json_to_sheet(
    activities.map(activity => ({
      'Activity ID': activity.activity_id || '',
      'Activity Type': activity.activity_type || '',
      'Activity Date': activity.activity_date || '',
      'Effective Date': activity.effective_date || '',
      'Description': activity.description || '',
      'Lead ID': activity.lead_id || '',
      'Customer ID': activity.customer_id || '',
      'Created By': activity.created_by || '',
      'Media Type': activity.media_type || '',
      'Event Type': activity.event_type || ''
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Activities');
  XLSX.writeFile(workbook, 'activities_template.xlsx');
};

export const downloadEmptyLeadsTemplate = async () => {
  const { data: existingLeads } = await supabase.from('Lead').select('lead_id');
  const existingIds = existingLeads?.map(l => l.lead_id).join(', ') || 'None';

  const emptyData = [{
    'EXISTING LEAD IDs (DO NOT USE)': existingIds,
    'Lead ID': 'Generate unique ID (e.g., LEAD' + (Date.now() % 10000) + ')',
    'Lead Name': 'John Doe',
    'Current Status': 'New',
    'Previous Status': '',
    'Type of Lead': 'Hot',
    'Project Name': 'Sample Project',
    'Developer': 'ABC Developers',
    'Building Name': 'Tower A',
    'Unit Type': '2BHK',
    'Unit Number': '101',
    'Bedrooms': '2',
    'Budget': '1000000',
    'Timeline': '3 months',
    'Booking Amount': '50000',
    'Expected Booking Date': '2025-06-01',
    'Purpose of Buying': 'Investment',
    'Effective Date': '2025-03-26',
    'Customer ID': ''
  }];

  const worksheet = XLSX.utils.json_to_sheet(emptyData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads Template');
  XLSX.writeFile(workbook, 'leads_import_template.xlsx');
};

export const downloadEmptyCustomersTemplate = async () => {
  const { data: existingCustomers } = await supabase.from('Customer').select('customer_id');
  const existingIds = existingCustomers?.map(c => c.customer_id).join(', ') || 'None';

  const emptyData = [{
    'EXISTING CUSTOMER IDs (DO NOT USE)': existingIds,
    'Customer ID': 'Generate unique ID (e.g., CUST' + (Date.now() % 10000) + ')',
    'Full Name': 'Jane Smith',
    'Email': 'jane@example.com',
    'Phone': '+971501234567',
    'Status': 'Active',
    'Budget Range': '500000-1000000',
    'Source': 'Website',
    'Assigned To': 'Agent Name',
    'Observer': '',
    'Comments': '',
    'Last Contacted': '2025-03-26',
    'Lead ID': ''
  }];

  const worksheet = XLSX.utils.json_to_sheet(emptyData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers Template');
  XLSX.writeFile(workbook, 'customers_import_template.xlsx');
};

export const downloadEmptyActivitiesTemplate = async () => {
  const { data: existingActivities } = await supabase.from('Activity').select('activity_id');
  const existingIds = existingActivities?.map(a => a.activity_id).join(', ') || 'None';

  const emptyData = [{
    'EXISTING ACTIVITY IDs (DO NOT USE)': existingIds,
    'Activity ID': 'Generate unique ID (e.g., ACT' + (Date.now() % 10000) + ')',
    'Activity Type': 'Call',
    'Activity Date': '2025-03-26',
    'Effective Date': '2025-03-26',
    'Description': 'Follow-up call with client',
    'Lead ID': 'LEAD001',
    'Customer ID': '',
    'Created By': 'Agent Name',
    'Media Type': 'audio',
    'Event Type': 'Follow Up'
  }];

  const worksheet = XLSX.utils.json_to_sheet(emptyData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Activities Template');
  XLSX.writeFile(workbook, 'activities_import_template.xlsx');
};
