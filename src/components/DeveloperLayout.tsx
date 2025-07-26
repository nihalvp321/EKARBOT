import * as React from 'react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Building,
  MessageSquare,
  Calendar,
  LogOut,
  User,
  Plus
} from 'lucide-react'; // Removed `Settings`
import { useDeveloperAuth } from '@/hooks/useDeveloperAuth';
import DeveloperProfileModal from './DeveloperProfileModal';

interface DeveloperLayoutProps {
  children: React.ReactNode;
}

const DeveloperLayout = ({ children }: DeveloperLayoutProps) => {
  const { signOut, profile } = useDeveloperAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/developer');
  };

  const menuItems = [
    {
      id: 'add-project',
      label: 'Add New Project',
      path: '/developer/add-project',
      icon: Plus
    },
    { id: 'projects', label: 'My Projects', path: '/developer/projects', icon: Building },
    { id: 'inbox', label: 'Messages', path: '/developer/inbox', icon: MessageSquare },
    { id: 'visits', label: 'Site Visit Dashboard', path: '/developer/visits', icon: Calendar },
    // Removed: { id: 'settings', label: 'Settings', path: '/developer/settings', icon: Settings },
  ];

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f8fafc' }}>
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r fixed h-full z-40" style={{ borderColor: '#e2e8f0' }}>
        {/* Logo */}
        <div className="p-4 border-b flex items-center justify-center sticky top-0 bg-white z-50" style={{ borderColor: '#e2e8f0' }}>
          <img
            src="/lovable-uploads/e930a97d-8b4d-4430-917f-2b39f2a881b7.png"
            alt="EKARBOT"
            className="h-12"
          />
        </div>

        {/* Menu */}
        <div className="p-4 space-y-2 overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                style={isActive ? { backgroundColor: '#455560' } : {}}
              >
                <div className={`mr-3 ${isActive ? 'filter brightness-0 invert' : ''}`}>
                  <Icon size={16} />
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Profile & Logout */}
        <div className="p-4 border-t border-gray-200 absolute bottom-0 left-0 right-0 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={profile?.profile_image_url} />
              <AvatarFallback>
                <User className="h-4 w-4 text-gray-600" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.developer_name || 'Developer'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {profile?.email_address || 'No email'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => setShowProfileModal(true)}
            >
              <User className="h-4 w-4" />
              Profile Settings
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Profile Modal */}
      <DeveloperProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};

export default DeveloperLayout;
