
import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { DeveloperAuthProvider, useDeveloperAuth } from '@/hooks/useDeveloperAuth';
import DeveloperLoginPage from './DeveloperLoginPage';
import DeveloperLayout from './DeveloperLayout';
import MyProjects from './MyProjects';
import DeveloperInbox from './DeveloperInbox';
import SiteVisitDashboard from './SiteVisitDashboard';
import DeveloperSettings from './DeveloperSettings';
import EkarBot from './EkarBot';
import ProjectForm from './ProjectForm';

const DeveloperAppContent = () => {
  const { user, loading } = useDeveloperAuth();
  const [currentPage, setCurrentPage] = useState(() => localStorage.getItem('developer.currentPage') || 'add-project');

  useEffect(() => {
    localStorage.setItem('developer.currentPage', currentPage);
  }, [currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <DeveloperLoginPage />;
  }

  return (
    <DeveloperLayout>
      <Routes>
        <Route path="/" element={<Navigate to={`/developer/${currentPage}`} replace />} />
        <Route path="/add-project" element={<ProjectForm />} />
        <Route path="/projects" element={<MyProjects />} />
        <Route path="/inbox" element={<DeveloperInbox />} />
        <Route path="/visits" element={<SiteVisitDashboard />} />
        <Route path="/ekarbot" element={<EkarBot />} />
        <Route path="/settings" element={<DeveloperSettings />} />
      </Routes>
    </DeveloperLayout>
  );
};

const DeveloperApp = () => {
  return (
    <DeveloperAuthProvider>
      <DeveloperAppContent />
    </DeveloperAuthProvider>
  );
};

export default DeveloperApp;
