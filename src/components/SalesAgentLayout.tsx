import { useState, useEffect, cloneElement, useRef } from 'react';
import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Bookmark,
  Calendar,
  LogOut,
  User,
  MessageCircle,
  Plus,
  CalendarDays,
  Menu,
  Trash2,
  Bot,
  ChevronRight,
  ChevronLeft,
  BookmarkCheck,
  Edit3,
  Settings,
  MessageSquare
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import SalesAgentProfileModal from './SalesAgentProfileModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface SalesAgentLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  setCurrentSessionId?: (sessionId: string) => void;
}

const SalesAgentLayout = ({ children, currentPage, onNavigate, setCurrentSessionId }: SalesAgentLayoutProps) => {
  const { user, profile, signOut } = useSalesAgentAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const dropdownTriggerRef = useRef<HTMLButtonElement>(null);

  const menuItems = [
  { 
    id: 'ekarbot', 
    label: <span className="font-semibold">EkarBot</span>, 
    icon: () => (
      <div className="relative flex items-center">
        <img 
          src="/lovable-uploads/00baa288-f375-4798-aa52-0272029ed647.png" 
          alt="EkarBot" 
          className="w-5 h-5 object-contain"
        />  
        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"></div>
      </div>
    )
  },
  { id: 'saved-projects', label: <span className="font-semibold">Saved Projects</span>, icon: BookmarkCheck },
  { id: 'inbox', label: <span className="font-semibold">Inbox</span>, icon: MessageSquare, badge: unreadCount > 0 ? unreadCount.toString() : undefined },
  { id: 'schedule-visit', label: <span className="font-semibold">Schedule Site Visit</span>, icon: Calendar },
  { id: 'visits-list', label: <span className="font-semibold">My Site Visits</span>, icon: CalendarDays },
];

  useEffect(() => {
    fetchUnreadMessages();
    if (profile?.sales_agent_id) {
      fetchChatSessions();
    }
  }, [profile]);

  const fetchChatSessions = async () => {
    if (!profile?.sales_agent_id) return;
    
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('sales_agent_id', profile.sales_agent_id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(15);
    
    if (!error && data) {
      setChatSessions(data);
    }
  };

  const createNewChatSession = async () => {
    if (!profile?.sales_agent_id) return;
    
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        sales_agent_id: profile.sales_agent_id,
        title: 'New Chat'
      })
      .select()
      .single();
    
    if (!error && data) {
      setChatSessions(prev => [data, ...prev]);
      onNavigate('ekarbot');
      setCurrentSessionId?.(data.id);
    }
  };

  const deleteChatSession = async (sessionId: string) => {
    await supabase
      .from('chat_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);
    
    setChatSessions(prev => prev.filter(session => session.id !== sessionId));
    try {
      const { error: historyError } = await supabase
        .from('chat_history')
        .delete()
        .eq('session_id', sessionId);
      
      if (historyError) {
        console.error('Error deleting chat history:', historyError);
        toast({
          title: "Error",
          description: "Failed to delete chat history",
          variant: "destructive"
        });
        return;
      }
      
      const { error: sessionError } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);
      
      if (sessionError) {
        console.error('Error deleting chat session:', sessionError);
        toast({
          title: "Error",
          description: "Failed to delete chat session",
          variant: "destructive"
        });
        return;
      }
      
      setChatSessions(prev => prev.filter(session => session.id !== sessionId));
      toast({
        title: "Success",
        description: "Chat session deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting chat session:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat session",
        variant: "destructive"
      });
    }
  };

  const updateSessionTitle = async (sessionId: string, newTitle: string) => {
    await supabase
      .from('chat_sessions')
      .update({ title: newTitle })
      .eq('id', sessionId);
    
    setChatSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, title: newTitle }
          : session
      )
    );
    setEditingSessionId(null);
  };

  const fetchUnreadMessages = async () => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (!error) {
        setUnreadCount(count || 0);
      }
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

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  const MenuButton = ({ item, isActive, isCollapsed }: { item: any, isActive: boolean, isCollapsed: boolean }) => {
    const Icon = item.icon;
    const button = (
      <button
        onClick={() => handleNavigate(item.id)}
        className={`group relative w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-2 sm:px-3'} py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-all duration-300 ease-out ${
          isActive
            ? 'bg-[#4555601A] text-[#455560] font-medium border-r-4 border-[#455560]'
            : 'text-slate-600 hover:text-[#455560] hover:bg-[#4555601A] hover:shadow-sm'
        }`}
      >
        <div className={`flex items-center ${isCollapsed ? '' : 'space-x-1 sm:space-x-2'}`}>
          <div className={`${isActive ? 'text-[#455560]' : 'text-slate-500 group-hover:text-[#455560]'} flex-shrink-0 transition-all duration-300`}>
            <Icon size={16} className="sm:w-5 sm:h-5" />
          </div>
          {!isCollapsed && (
            <span className={`truncate font-normal ${isActive ? 'text-[#455560]' : 'text-slate-700'}`}>
              {item.label}
            </span>
          )}
        </div>
        {!isCollapsed && item.badge && (
          <span className="bg-red-500 text-white text-[10px] sm:text-xs rounded-full min-w-[18px] sm:min-w-[20px] h-4 sm:h-5 flex items-center justify-center px-1 sm:px-1.5 font-medium">
            {item.badge}
          </span>
        )}
        {isCollapsed && item.badge && (
          <span className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 bg-red-500 text-white text-[9px] sm:text-xs rounded-full min-w-[14px] sm:min-w-[16px] h-3.5 sm:h-4 flex items-center justify-center text-[9px] sm:text-[10px] font-medium">
            {item.badge}
          </span>
        )}
      </button>
    );

    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-1 sm:ml-2 bg-slate-800 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-md shadow-lg">
              <p className="text-xs sm:text-sm font-normal">{item.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return button;
  };

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-sm">
      <div className="flex items-center justify-between px-2 sm:px-3 py-2 sm:py-3 border-b border-slate-200/60">
        <img
          src="/lovable-uploads/130396e5-9f45-4680-a820-eb59964da497.png"
          alt="EkarBot"
          className="h-12 lg:h-16 w-auto"
        />
        {!isMobile && !isCollapsed && (
          <Button
            onClick={() => setIsCollapsed(true)}
            className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 rounded-full bg-white/80 border border-slate-200 shadow-md hover:shadow-lg hover:bg-white active:scale-95 transition-all duration-300"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600" />
          </Button>
        )}
      </div>

      <div className={`${isCollapsed && !isMobile ? 'px-2 pt-2' : 'px-2 sm:px-3 pt-2 sm:pt-4'} space-y-1 sm:space-y-2`}>
        {menuItems.map((item) => (
          <MenuButton key={item.id} item={item} isActive={currentPage === item.id} isCollapsed={isCollapsed && !isMobile} />
        ))}
        <div className={`pt-2 sm:pt-4 ${isCollapsed && !isMobile ? 'px-0' : ''}`}>
          {isCollapsed && !isMobile ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={createNewChatSession}
                    className="relative w-full h-8 sm:h-10 bg-gradient-to-r from-[#455560] to-[#3a464f] hover:from-[#3a464f] hover:to-[#455560] text-white rounded-lg flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-1 sm:ml-2 text-xs sm:text-sm bg-slate-800 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-md shadow-lg">
                  <p>New Chat</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button
              onClick={createNewChatSession}
              className="relative w-full h-8 sm:h-10 bg-gradient-to-r from-[#455560] to-[#3a464f] hover:from-[#3a464f] hover:to-[#455560] text-white rounded-2xl sm:rounded-3xl flex items-center gap-1 sm:gap-2 py-1 sm:py-2 px-2 sm:px-3 shadow-md hover:shadow-lg transition-all duration-300 font-medium text-xs sm:text-sm"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>New Chat</span>
            </Button>
          )}
        </div>
      </div>

      <div className={`mt-2 sm:mt-4 flex-1 ${isCollapsed && !isMobile ? 'px-0' : 'px-1 sm:px-2'} overflow-hidden flex flex-col`}>
        {!(isCollapsed && !isMobile) && (
          <h3 className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3">
            Recent Chats
          </h3>
        )}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent scrollbar-rounded-full space-y-1 pb-16 sm:pb-20">
          {chatSessions.slice(0, isCollapsed && !isMobile ? 8 : 10).map((session) => (
            <div
              key={session.id}
              className={`group relative rounded-lg cursor-pointer transition-all duration-200 hover:bg-[#4555601A] hover:shadow-sm ${isCollapsed && !isMobile ? 'px-0' : 'px-1'}`}
            >
              {isCollapsed && !isMobile ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        onClick={() => {
                          setCurrentSessionId?.(session.id);
                          onNavigate('ekarbot');
                        }}
                        className="w-full h-7 sm:h-9 flex items-center justify-center rounded-lg hover:bg-[#4555601A] transition-all duration-200"
                      >
                        <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="ml-1 sm:ml-2 max-w-xs bg-slate-800 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-md shadow-lg">
                      <div
                        onClick={() => {
                          setCurrentSessionId?.(session.id);
                          onNavigate('ekarbot');
                        }}
                        className="cursor-pointer"
                      >
                        <p className="font-medium text-xs sm:text-sm">{session.title}</p>
                        <p className="text-[10px] sm:text-xs opacity-75">
                          {new Date(session.updated_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <div
                  onClick={() => {
                    setCurrentSessionId?.(session.id);
                    onNavigate('ekarbot');
                  }}
                  className="flex items-center justify-between py-1 sm:py-1.5 px-1 sm:px-2 rounded-lg hover:bg-[#4555601A] transition-all duration-200"
                >
                  <div className="flex-1 min-w-0 flex items-center gap-1 sm:gap-2">
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600" />
                    <div className="min-w-0 flex-1">
                      {editingSessionId === session.id ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => updateSessionTitle(session.id, editTitle)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateSessionTitle(session.id, editTitle);
                            }
                          }}
                          className="text-xs sm:text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded px-1 sm:px-2 py-0 sm:py-0.5 w-full focus:outline-none focus:ring-2 focus:ring-[#455560] transition-all"
                          autoFocus
                        />
                      ) : (
                        <p className="text-xs sm:text-sm font-medium text-slate-800 truncate">
                          {session.title}
                        </p>
                      )}
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-0 sm:mt-0.5 flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                        {new Date(session.updated_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 sm:gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSessionId(session.id);
                        setEditTitle(session.title);
                      }}
                      className="w-6 h-6 sm:w-7 sm:h-7 p-0 hover:bg-[#4555601A] hover:text-[#455560]"
                    >
                      <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChatSession(session.id);
                      }}
                      className="w-6 h-6 sm:w-7 sm:h-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {chatSessions.length === 0 && (
            <div className={`text-center py-4 sm:py-6 ${isCollapsed && !isMobile ? 'px-1' : 'px-2'}`}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#4555601A] flex items-center justify-center mx-auto mb-1 sm:mb-2">
                <Bot className={`${isCollapsed && !isMobile ? 'w-5 h-5' : 'w-6 h-6 sm:w-8 sm:h-8'} text-slate-400`} />
              </div>
              {!(isCollapsed && !isMobile) && (
                <>
                  <p className="text-xs sm:text-sm font-medium text-slate-500">No conversations yet</p>
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-0 sm:mt-0.5">Start chatting to see your history!</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 p-1 sm:p-2 bg-white/80 backdrop-blur-sm absolute bottom-0 left-0 right-0">
        {isCollapsed && !isMobile ? (
          <div className="space-y-1 sm:space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCollapsed(false)}
                    className="w-full h-8 sm:h-10 rounded-lg hover:bg-[#4555601A] transition-all duration-300"
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-1 sm:ml-2 text-xs sm:text-sm bg-slate-800 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-md shadow-lg">
                  <p>Expand sidebar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full h-8 sm:h-10 rounded-lg hover:bg-[#4555601A] transition-all duration-300 flex justify-center"
                        ref={dropdownTriggerRef}
                      >
                        <Avatar className="w-7 h-7 sm:w-8 sm:h-8 ring-2 ring-[#455560] hover:ring-[#3a464f]">
                          <AvatarImage src={profile?.profile_image_url || undefined} />
                          <AvatarFallback className="text-white text-xs sm:text-sm bg-[#455560] font-medium">
                            {getInitials(profile?.sales_agent_name)}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 sm:w-56 p-1 sm:p-2 bg-white/95 backdrop-blur-sm border-0 shadow-lg rounded-lg">
                      <SalesAgentProfileModal>
                        <DropdownMenuItem
                          className="cursor-pointer text-xs sm:text-sm py-1 sm:py-2 px-1 sm:px-2 rounded-lg hover:bg-[#4555601A]"
                          onSelect={(e) => {
                            e.preventDefault();
                            if (dropdownTriggerRef.current) {
                              dropdownTriggerRef.current.blur();
                            }
                          }}
                        >
                          <User className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Profile Settings
                        </DropdownMenuItem>
                      </SalesAgentProfileModal>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-red-600 cursor-pointer text-xs sm:text-sm py-1 sm:py-2 px-1 sm:px-2 rounded-lg hover:bg-red-50"
                          >
                            <LogOut className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            Logout
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-lg bg-white/95 backdrop-blur-sm border-0 shadow-lg">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-sm sm:text-base font-medium">Confirm Logout</AlertDialogTitle>
                            <AlertDialogDescription className="text-xs sm:text-sm text-slate-600">
                              Are you sure you want to log out? You will need to sign in again to access your account.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                            <AlertDialogCancel className="text-xs sm:text-sm rounded-lg">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLogout} className="text-xs sm:text-sm bg-red-500 hover:bg-red-600 rounded-lg">
                              Logout
                            </AlertDialogAction>
                          </div>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-1 sm:ml-2 text-xs sm:text-sm bg-slate-800 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-md shadow-lg">
                  <p>{profile?.sales_agent_name || "Sales Agent"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full h-8 sm:h-10 rounded-lg hover:bg-[#4555601A] transition-all duration-300 flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
                ref={dropdownTriggerRef}
              >
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8 ring-2 ring-[#455560] hover:ring-[#3a464f]">
                  <AvatarImage src={profile?.profile_image_url || undefined} />
                  <AvatarFallback className="text-white text-xs sm:text-sm bg-[#455560] font-medium">
                    {getInitials(profile?.sales_agent_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="font-medium text-xs sm:text-sm text-slate-800 truncate">
                    {profile?.sales_agent_name || "Sales Agent"}
                  </p>
                </div>
                <Settings className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 hover:text-[#455560] transition-all duration-300" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 sm:w-56 p-1 sm:p-2 bg-white/95 backdrop-blur-sm border-0 shadow-lg rounded-lg">
              <SalesAgentProfileModal>
                <DropdownMenuItem
                  className="cursor-pointer text-xs sm:text-sm py-1 sm:py-2 px-1 sm:px-2 rounded-lg hover:bg-[#4555601A]"
                  onSelect={(e) => {
                    e.preventDefault();
                    if (dropdownTriggerRef.current) {
                      dropdownTriggerRef.current.blur();
                    }
                  }}
                >
                  <User className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Profile Settings
                </DropdownMenuItem>
              </SalesAgentProfileModal>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-red-600 cursor-pointer text-xs sm:text-sm py-1 sm:py-2 px-1 sm:px-2 rounded-lg hover:bg-red-50"
                  >
                    <LogOut className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Logout
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-lg bg-white/95 backdrop-blur-sm border-0 shadow-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-sm sm:text-base font-medium">Confirm Logout</AlertDialogTitle>
                    <AlertDialogDescription className="text-xs sm:text-sm text-slate-600">
                      Are you sure you want to log out? You will need to sign in again to access your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                    <AlertDialogCancel className="text-xs sm:text-sm rounded-lg">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout} className="text-xs sm:text-sm bg-red-500 hover:bg-red-600 rounded-lg">
                      Logout
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
        <div className="h-14 sm:h-16 flex items-center px-3 sm:px-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="bg-white/90 backdrop-blur-sm border border-[#455560] shadow-md hover:bg-[#4555601A] hover:shadow-lg transition-all duration-300 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center"
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5 text-[#455560]" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-56 sm:w-64 p-0 flex flex-col bg-white/80 backdrop-blur-sm shadow-lg border-0"
            >
              <div className="relative h-full">
                <SidebarContent isMobile={true} />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex-1 flex justify-center">
            <img
              src="/lovable-uploads/130396e5-9f45-4680-a820-eb59964da497.png"
              alt="EkarBot"
              className="h-7 sm:h-8"
            />
          </div>
        </div>
      </div>

      <div 
        className={`hidden lg:flex ${isCollapsed ? 'w-16' : 'w-64'} bg-white/80 backdrop-blur-sm border-r border-slate-200/60 fixed h-full z-40 flex-col transition-all duration-300 ease-in-out shadow-sm`}
      >
        <div className="relative h-full">
          <SidebarContent isMobile={false} />
        </div>
      </div>

      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'} pt-14 sm:pt-16 lg:pt-0`}>
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
          <div className="h-full w-full">{cloneElement(children as React.ReactElement, { isCollapsed })}</div>
        </main>
      </div>
    </div>
  );
};

export default SalesAgentLayout;