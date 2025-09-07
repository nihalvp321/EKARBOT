
import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';
import SalesAgentLoginPage from './SalesAgentLoginPage';
import SalesAgentLayout from './SalesAgentLayout';
import SalesAgentMainPage from './SalesAgentMainPage';
import SalesAgentInbox from './SalesAgentInbox';
import SalesAgentScheduleVisit from './SalesAgentScheduleVisit';
import SalesAgentSavedProjects from './SalesAgentSavedProjects';
import SalesAgentVisitsList from './SalesAgentVisitsList';
import { useState } from 'react';

const SalesAgentApp = () => {
  const { user, loading } = useSalesAgentAuth();
  const [currentPage, setCurrentPage] = useState('ekarbot');
  const [projects, setProjects] = useState<any[]>([]);
  const [n8nResponse, setN8nResponse] = useState<any>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-600">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Show login page if user is not authenticated
  if (!user) {
    return <SalesAgentLoginPage />;
  }

  // Show main app if user is authenticated
  const renderPage = () => {
    switch (currentPage) {
      case 'ekarbot':
        return <SalesAgentMainPage projects={projects} setProjects={setProjects} n8nResponse={n8nResponse} setN8nResponse={setN8nResponse} />;
      case 'saved-projects':
        return <SalesAgentSavedProjects />;
      case 'inbox':
        return <SalesAgentInbox />;
      case 'schedule-visit':
        return <SalesAgentScheduleVisit />;
      case 'visits-list':
        return <SalesAgentVisitsList />;
      default:
        return <SalesAgentMainPage projects={projects} setProjects={setProjects} n8nResponse={n8nResponse} setN8nResponse={setN8nResponse} />;
    }
  };

  return (
    <SalesAgentLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </SalesAgentLayout>
  );
};

export default SalesAgentApp;
