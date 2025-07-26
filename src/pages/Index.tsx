
import { useState } from 'react';
import { SecureAuthProvider, useSecureAuth } from '@/hooks/useSecureAuth';
import LoginPage from '@/components/LoginPage';
import Layout from '@/components/Layout';
import ManageDevelopers from '@/components/ManageDevelopers';
import DevelopersList from '@/components/DevelopersList';
import ManageSalesAgents from '@/components/ManageSalesAgents';
import SalesAgentsList from '@/components/SalesAgentsList';
import UserManagerInbox from '@/components/UserManagerInbox';

const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('developers');
  const { user, loading } = useSecureAuth();

  const handleNavigate = (page: string) => {
    console.log('Navigating to:', page);
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Allow access for user_manager type users
  if (user.user_type !== 'user_manager') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p>You don't have permission to access this system.</p>
          <p className="text-sm text-gray-600 mt-2">Current user type: {user.user_type}</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'developers':
        return <ManageDevelopers onNavigateToList={() => setCurrentPage('developers-list')} />;
      case 'developers-list':
        return <DevelopersList onNavigateToAdd={() => setCurrentPage('developers')} />;
      case 'sales-agents':
        return <ManageSalesAgents onNavigateToList={() => setCurrentPage('sales-agents-list')} />;
      case 'sales-agents-list':
        return <SalesAgentsList onNavigateToAdd={() => setCurrentPage('sales-agents')} />;
      case 'inbox':
        return <UserManagerInbox />;
      default:
        return <ManageDevelopers onNavigateToList={() => setCurrentPage('developers-list')} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  );
};

const Index = () => {
  return (
    <SecureAuthProvider>
      <AppContent />
    </SecureAuthProvider>
  );
};

export default Index;
