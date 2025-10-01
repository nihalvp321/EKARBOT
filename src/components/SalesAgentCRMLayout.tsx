import React, { useState } from 'react';
import CRMDashboard from './CRMDashboard';
import LeadManagement from './LeadManagement';
import CustomerManagement from './CustomerManagement';
import ActivityManagement from './ActivityManagement';
import LeadForm from './forms/LeadForm';
import CustomerForm from './forms/CustomerForm';
import ActivityForm from './forms/ActivityForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Users, UserCheck, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SalesAgentCRMLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const handleNavigate = (view: string, id?: string) => {
    setCurrentView(view);
    setSelectedId(id);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <CRMDashboard onNavigate={handleNavigate} />;
      case 'leads':
        return <LeadManagement onNavigate={handleNavigate} />;
      case 'customers':
        return <CustomerManagement onNavigate={handleNavigate} />;
      case 'activities':
        return <ActivityManagement onNavigate={handleNavigate} />;
      case 'lead-detail':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Lead Detail</h1>
            <p className="text-muted-foreground">Lead ID: {selectedId}</p>
            <button 
              onClick={() => setCurrentView('leads')}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded shadow hover:shadow-md transition"
            >
              Back to Leads
            </button>
          </div>
        );
      case 'customer-detail':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Customer Detail</h1>
            <p className="text-muted-foreground">Customer ID: {selectedId}</p>
            <button 
              onClick={() => setCurrentView('customers')}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded shadow hover:shadow-md transition"
            >
              Back to Customers
            </button>
          </div>
        );
      case 'activity-detail':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Activity Detail</h1>
            <p className="text-muted-foreground">Activity ID: {selectedId}</p>
            <button 
              onClick={() => setCurrentView('activities')}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded shadow hover:shadow-md transition"
            >
              Back to Activities
            </button>
          </div>
        );
      case 'lead-form':
        return <LeadForm onBack={() => setCurrentView('leads')} />;
      case 'lead-edit':
        return <LeadForm onBack={() => setCurrentView('leads')} leadId={selectedId} />;
      case 'customer-form':
        return <CustomerForm onBack={() => setCurrentView('customers')} />;
      case 'customer-edit':
        return <CustomerForm onBack={() => setCurrentView('customers')} customerId={selectedId} />;
      case 'activity-form':
        return <ActivityForm onBack={() => setCurrentView('activities')} relatedTo={selectedId} />;
      case 'activity-edit':
        return <ActivityForm onBack={() => setCurrentView('activities')} activityId={selectedId} />;
      default:
        return <CRMDashboard onNavigate={handleNavigate} />;
    }
  };

  const getViewLabel = () => {
    const labels: Record<string, string> = {
      'dashboard': 'Dashboard',
      'leads': 'Leads',
      'customers': 'Customers',
      'activities': 'Activities'
    };
    return labels[currentView] || 'CRM Data';
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <motion.div 
        className="border-b border-border p-4 bg-background sticky top-0 z-10"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-3">
          <Select value={currentView} onValueChange={(value) => handleNavigate(value)}>
            <SelectTrigger className="w-[200px] shadow-sm hover:shadow-md transition">
              <SelectValue>{getViewLabel()}</SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-background z-50 animate-in fade-in-50 slide-in-from-top-1">
              <SelectItem value="dashboard">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Dashboard
                </div>
              </SelectItem>
              <SelectItem value="leads">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Leads
                </div>
              </SelectItem>
              <SelectItem value="customers">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Customers
                </div>
              </SelectItem>
              <SelectItem value="activities">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Activities
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <motion.h2 
            key={currentView}
            className="text-lg font-semibold text-foreground"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {getViewLabel()}
          </motion.h2>
        </div>
      </motion.div>

      {/* Main Content with transitions */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="h-full"
          >
            {renderCurrentView()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SalesAgentCRMLayout;
