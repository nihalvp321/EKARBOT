import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';
import SalesAgentLoginPage from './SalesAgentLoginPage';
import SalesAgentLayout from './SalesAgentLayout';
import SalesAgentMainPage from './SalesAgentMainPage';
import SalesAgentInbox from './SalesAgentInbox';
import SalesAgentScheduleVisit from './SalesAgentScheduleVisit';
import SalesAgentSavedProjects from './SalesAgentSavedProjects';
import SalesAgentVisitsList from './SalesAgentVisitsList';
import { useState, useEffect } from 'react';

const SalesAgentApp = () => {
  const { user, loading } = useSalesAgentAuth();

  // ✅ Use localStorage to store the last active page
  const [currentPage, setCurrentPage] = useState('ekarbot');

  const [projects, setProjects] = useState<any[]>([]);
  const [n8nResponse, setN8nResponse] = useState<any>(null);

  // ✅ Load the saved page from localStorage when component mounts
  useEffect(() => {
    const savedPage = localStorage.getItem('salesAgentCurrentPage');
    if (savedPage) {
      setCurrentPage(savedPage);
    }
  }, []);

  // ✅ Save current page to localStorage on every change
  useEffect(() => {
    localStorage.setItem('salesAgentCurrentPage', currentPage);
  }, [currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-600">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <SalesAgentLoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'ekarbot':
        return (
          <SalesAgentMainPage
            projects={projects}
            setProjects={setProjects}
            n8nResponse={n8nResponse}
            setN8nResponse={setN8nResponse}
          />
        );
      case 'saved-projects':
        return <SalesAgentSavedProjects />;
      case 'inbox':
        return <SalesAgentInbox />;
      case 'schedule-visit':
        return <SalesAgentScheduleVisit />;
      case 'visits-list':
        return <SalesAgentVisitsList />;
      default:
        return (
          <SalesAgentMainPage
            projects={projects}
            setProjects={setProjects}
            n8nResponse={n8nResponse}
            setN8nResponse={setN8nResponse}
          />
        );
    }
  };

  return (
    <SalesAgentLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </SalesAgentLayout>
  );
};

export default SalesAgentApp;
