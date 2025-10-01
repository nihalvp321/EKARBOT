import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportLeadsToPDF = (leads: any[]) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  
  // Add title
  doc.setFontSize(18);
  doc.text('Leads Report', 14, 20);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
  
  // Prepare table data
  const tableData = leads.map(lead => [
    lead.lead_id || '-',
    lead.lead_name || '-',
    lead.current_status || '-',
    lead.project_name || '-',
    lead.developer || '-',
    lead.budget || '-',
    lead.timeline || '-',
    lead.purpose_of_buying || '-'
  ]);
  
  autoTable(doc, {
    startY: 35,
    head: [['Lead ID', 'Name', 'Status', 'Project', 'Developer', 'Budget', 'Timeline', 'Purpose']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2 },
  });
  
  doc.save('leads_report.pdf');
};

export const exportCustomersToPDF = (customers: any[]) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  
  doc.setFontSize(18);
  doc.text('Customers Report', 14, 20);
  
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
  
  const tableData = customers.map(customer => [
    customer.customer_id || '-',
    customer.customer_full_name || customer.customer_name || '-',
    customer.email_address || customer.email || '-',
    customer.phone || customer.contact_no || '-',
    customer.status || '-',
    customer.budget_range || '-',
    customer.source || '-',
    customer.assigned_to || '-'
  ]);
  
  autoTable(doc, {
    startY: 35,
    head: [['Customer ID', 'Name', 'Email', 'Phone', 'Status', 'Budget', 'Source', 'Assigned To']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2 },
  });
  
  doc.save('customers_report.pdf');
};

export const exportActivitiesToPDF = (activities: any[]) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  
  doc.setFontSize(18);
  doc.text('Activities Report', 14, 20);
  
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
  
  const tableData = activities.map(activity => [
    activity.activity_id || '-',
    activity.activity_type || activity.event_type || '-',
    activity.activity_date || '-',
    activity.Lead?.lead_name || '-',
    activity.Customer?.customer_full_name || '-',
    activity.created_by || '-',
    (activity.description || '').substring(0, 50) + (activity.description?.length > 50 ? '...' : ''),
    activity.media_type || '-'
  ]);
  
  autoTable(doc, {
    startY: 35,
    head: [['Activity ID', 'Type', 'Date', 'Lead', 'Customer', 'Created By', 'Description', 'Media Type']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [245, 158, 11], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2 },
  });
  
  doc.save('activities_report.pdf');
};
