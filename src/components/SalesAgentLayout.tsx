import { useState, useEffect } from 'react';
import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bookmark,
  Calendar,
  LogOut,
  User,
  MessageSquare,
  CalendarDays,
  Menu,
  Bell,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import SalesAgentProfileModal from './SalesAgentProfileModal';
import { supabase } from '@/integrations/supabase/client';

interface SalesAgentLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const SalesAgentLayout = ({ children, currentPage, onNavigate }: SalesAgentLayoutProps) => {
  const { user, profile, signOut } = useSalesAgentAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      id: 'ekarbot',
      label: 'EkarBot Assistant',
      icon: () => (
        <img
          src="/lovable-uploads/00baa288-f375-4798-aa52-0272029ed647.png"
          alt="EkarBot"
          className="w-5 h-5"
        />
      ),
    },
    { id: 'saved-projects', label: 'Saved Properties', icon: Bookmark },
    {
      id: 'inbox',
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadCount > 0 ? unreadCount.toString() : undefined,
    },
    { id: 'schedule-visit', label: 'Schedule Visit', icon: Calendar },
    { id: 'visits-list', label: 'My Visits', icon: CalendarDays },
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

      if (!error) setUnreadCount(count || 0);
    } catch (err) {
      console.error('Error fetching unread messages:', err);
    }
  };

  const handleLogout = () => signOut();

  const getInitials = (name?: string) => {
    if (!name) return 'S';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex flex-col gap-4">
        <img
          src="/lovable-uploads/130396e5-9f45-4680-a820-eb59964da497.png"
          alt="EkarBot"
          className="h-10 w-auto mx-auto"
        />

        {/* Profile Card */}
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 flex items-center gap-2">
  <div className="relative">
    <Avatar className="w-9 h-9 ring-2 ring-blue-400/50">
      <AvatarImage src={profile?.profile_image_url || undefined} />
      <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 text-white font-semibold text-sm">
        {getInitials(profile?.sales_agent_name)}
      </AvatarFallback>
    </Avatar>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 font-semibold text-sm truncate">
              {profile?.sales_agent_name || 'Sales Agent'}
            </p>
            <p className="text-gray-500 text-xs">Sales Agent</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-800 hover:bg-gray-100 p-1"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg">
              <SalesAgentProfileModal>
                <DropdownMenuItem className="cursor-pointer text-gray-700 hover:bg-gray-100" onSelect={(e) => e.preventDefault()}>
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
              </SalesAgentProfileModal>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-red-500 cursor-pointer hover:bg-gray-100" onSelect={(e) => e.preventDefault()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to log out? You will need to sign in again to access your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`relative w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-gray-600 text-sm">System Online</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-80 fixed h-full z-40 flex-col shadow-lg">
        <SidebarContent />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <img
              src="/lovable-uploads/130396e5-9f45-4680-a820-eb59964da497.png"
              alt="EkarBot"
              className="h-6 w-auto"
            />
            <span className="font-bold text-gray-800">EkarBot</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="rounded-full w-10 h-10">
              <Bell className="h-5 w-5 text-gray-600" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full w-10 h-10">
                  <Avatar className="w-8 h-8 ring-2 ring-blue-400/50">
                    <AvatarImage src={profile?.profile_image_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                      {getInitials(profile?.sales_agent_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg">
                <SalesAgentProfileModal>
                  <DropdownMenuItem className="cursor-pointer" onSelect={(e) => e.preventDefault()}>
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                </SalesAgentProfileModal>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-red-600 cursor-pointer" onSelect={(e) => e.preventDefault()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to log out? You will need to sign in again to access your account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full w-10 h-10">
                  <Menu className="h-5 w-5 text-gray-600" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0 flex flex-col">
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-80">
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          <div className="h-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default SalesAgentLayout;
