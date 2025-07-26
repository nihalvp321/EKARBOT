import * as React from 'react';
import { useState, useEffect } from 'react';
import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Bookmark,
  Calendar,
  LogOut,
  User,
  Inbox,
  CalendarDays
} from 'lucide-react';
import SalesAgentProfileModal from './SalesAgentProfileModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SalesAgentLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const SalesAgentLayout = ({ children, currentPage, onNavigate }: SalesAgentLayoutProps) => {
  const { user, profile, signOut } = useSalesAgentAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const menuItems = [
    { 
      id: 'ekarbot', 
      label: 'EkarBot', 
      icon: () => (
        <img 
          src="/lovable-uploads/00baa288-f375-4798-aa52-0272029ed647.png" 
          alt="EkarBot" 
          className="w-4 h-4"
        />
      )
    },
    { id: 'saved-projects', label: 'Saved Projects', icon: Bookmark },
    { id: 'inbox', label: 'Inbox', icon: Inbox, badge: unreadCount > 0 ? unreadCount.toString() : undefined },
    { id: 'schedule-visit', label: 'Schedule Site Visit', icon: Calendar },
    { id: 'visits-list', label: 'My Site Visits', icon: CalendarDays },
  ];

  useEffect(() => {
    fetchUnreadMessages();
  }, [profile]);

  const fetchUnreadMessages = async () => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching unread messages:', error);
        return;
      }

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  };

  const handleLogout = () => {
    signOut();
  };

  const getInitials = (name?: string) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f8fafc' }}>
      {/* Left Sidebar - Fixed */}
      <div className="w-64 bg-white border-r fixed h-full z-40" style={{ borderColor: '#e2e8f0' }}>
        {/* Header with Logo - Fixed at top of sidebar */}
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-50" style={{ borderColor: '#e2e8f0' }}>
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/130396e5-9f45-4680-a820-eb59964da497.png"
              alt="EkarBot" 
              className="h-16 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="text-xl font-bold hidden" style={{ color: '#455560' }}>EkarBot</div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-full w-8 h-8">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.profile_image_url || undefined} />
                  <AvatarFallback className="text-white text-xs" style={{ backgroundColor: '#455560' }}>
                    {getInitials(profile?.sales_agent_name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <SalesAgentProfileModal>
                <DropdownMenuItem className="cursor-pointer" onSelect={(e) => e.preventDefault()}>
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
              </SalesAgentProfileModal>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Menu Items - Scrollable content */}
        <div className="p-4 space-y-2 overflow-y-auto" style={{ height: 'calc(100vh - 120px)' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                style={isActive ? { backgroundColor: '#455560' } : {}}
              >
                <div className="flex items-center space-x-3">
                  <div className={`${isActive ? 'filter brightness-0 invert' : ''}`}>
                    <Icon size={16} />
                  </div>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content - With left margin for fixed sidebar */}
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SalesAgentLayout;
