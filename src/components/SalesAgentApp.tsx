
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
  const [currentPage, setCurrentPage] = useState(() => localStorage.getItem('salesAgent.currentPage') || 'ekarbot');
  const [projects, setProjects] = useState<any[]>(() => {
    // Load projects from localStorage on initialization
    const stored = localStorage.getItem('salesAgent.projects');
    return stored ? JSON.parse(stored) : [];
  });
  const [n8nResponse, setN8nResponse] = useState<any>(() => {
    // Load n8nResponse from localStorage on initialization
    const stored = localStorage.getItem('salesAgent.n8nResponse');
    return stored ? JSON.parse(stored) : null;
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('salesAgent.currentPage', currentPage);
  }, [currentPage]);

  // Persist projects and n8nResponse to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('salesAgent.projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('salesAgent.n8nResponse', JSON.stringify(n8nResponse));
  }, [n8nResponse]);

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
        return (
          <SalesAgentMainPage 
            projects={projects} 
            setProjects={setProjects} 
            n8nResponse={n8nResponse} 
            setN8nResponse={setN8nResponse}
            currentSessionId={currentSessionId}
            setCurrentSessionId={setCurrentSessionId}
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
            currentSessionId={currentSessionId}
            setCurrentSessionId={setCurrentSessionId}
          />
        );
    }
  };

  const handleSessionLoad = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  return (
    <SalesAgentLayout 
      currentPage={currentPage} 
      onNavigate={setCurrentPage}
      setCurrentSessionId={handleSessionLoad}
    >
      {renderPage()}
    </SalesAgentLayout>
  );
};

export default SalesAgentApp;
