import { useEffect, useState, useRef } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark, BookmarkCheck, MapPin, ArrowUp, Building, DollarSign, Eye, MessageSquare, Bot, Zap, Send, X, Plus, MoreHorizontal, Trash2, Edit, Sparkles, ArrowDown
} from 'lucide-react';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { supabase } from '@/integrations/supabase/client';
import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';
import { toast } from 'sonner';
import { sanitizeInput } from '@/utils/inputValidation';
import { logSecurityEvent, checkRateLimit } from '@/utils/securityUtils';
import ProjectDetailModal from '@/components/ProjectDetailModal';

interface SalesAgentMainPageProps {
  projects: any[];
  setProjects: (projects: any[]) => void;
  n8nResponse: any;
  setN8nResponse: (response: any) => void;
  currentSessionId?: string | null;
  setCurrentSessionId?: (sessionId: string | null) => void;
  isCollapsed?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  message_type: 'user' | 'bot';
  message_content: string;
  chat_mode: string;
  response_data?: any;
  created_at: string;
}

type ChatMode = 'ekarbot-ai' | 'hybrid' | 'property-listing';

const SalesAgentMainPage = ({
  projects,
  setProjects,
  n8nResponse,
  setN8nResponse,
  currentSessionId: propCurrentSessionId,
  setCurrentSessionId: propSetCurrentSessionId,
  isCollapsed = false
}: SalesAgentMainPageProps) => {
  const [chatPrompt, setChatPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [savedProjectIds, setSavedProjectIds] = useState<string[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  
  const [localCurrentSessionId, setLocalCurrentSessionId] = useState<string | null>(null);
  const currentSessionId = propCurrentSessionId ?? localCurrentSessionId;
  const setCurrentSessionId = propSetCurrentSessionId ?? setLocalCurrentSessionId;
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('ekarbot-ai');
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { profile } = useSalesAgentAuth();

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [sessionProjectIds, setSessionProjectIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (sessionProjectIds.size > 0) {
      fetchProjects(Array.from(sessionProjectIds));
    } else {
      setProjects([]);
    }
  }, [sessionProjectIds]);

  useEffect(() => {
    if (profile?.sales_agent_id && !propCurrentSessionId) {
      const storedId = localStorage.getItem(`currentSessionId_${profile.sales_agent_id}`);
      if (storedId) {
        setLocalCurrentSessionId(storedId);
      }
    }
  }, [profile, propCurrentSessionId]);

  useEffect(() => {
    if (profile?.sales_agent_id && currentSessionId && !propCurrentSessionId) {
      localStorage.setItem(`currentSessionId_${profile.sales_agent_id}`, currentSessionId);
    }
  }, [currentSessionId, profile, propCurrentSessionId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowModeSelector(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [propertyListingMode, setPropertyListingMode] = useState<'inhouse' | 'external'>('external');
  const [ekarBotMode, setEkarBotMode] = useState<'inhouse' | 'external'>('inhouse');

  const getWebhookUrl = () => {
    if (chatMode === 'property-listing') {
      return propertyListingMode === 'inhouse'
        ? 'https://ekarbotproject.duckdns.org/webhook/property-listing/inhouse'
        : 'https://ekarbotproject.duckdns.org/webhook/property-listing/external';
    }
    if (chatMode === 'ekarbot-ai') {
      return ekarBotMode === 'inhouse'
        ? 'https://ekarbotproject.duckdns.org/webhook/ekarbot-ai/inhouse'
        : 'https://ekarbotproject.duckdns.org/webhook/ekarbot-ai/external';
    }
    switch (chatMode) {
      case 'hybrid':
        return 'https://ekarbotproject.duckdns.org/webhook/hybrid';
      default:
        return '';
    }
  };

  const chatModeConfig = {
    'ekarbot-ai': {
      label: 'EkarBot AI',
      icon: MessageSquare,
      description: `Proprietary AI assistant (${ekarBotMode})`,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    hybrid: {
      label: 'Hybrid Power',
      icon: Zap,
      description: 'Combined AI intelligence',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    'property-listing': {
      label: 'Property Listing',
      icon: Building,
      description: `Fetch latest active listings (${propertyListingMode})`,
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  };

  const fetchChatSessions = async () => {
    if (!profile?.sales_agent_id) return;
    
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('sales_agent_id', profile.sales_agent_id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });
    
    if (!error && data) {
      setChatSessions(data);
      if (data.length > 0) {
        const sessionIds = data.map(s => s.id);
        if (!currentSessionId || !sessionIds.includes(currentSessionId)) {
          setCurrentSessionId(data[0].id);
        }
      }
    }
  };

  const fetchChatHistory = async (sessionId: string) => {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const transformed: ChatMessage[] = [];
      
      for (const row of data as any[]) {
        if (row.user_message) {
          transformed.push({
            id: `${row.id}-user`,
            message_type: 'user',
            message_content: row.user_message,
            chat_mode: row.chat_mode,
            created_at: row.created_at,
          });
        }
        
        if (row.bot_response) {
          transformed.push({
            id: `${row.id}-bot`,
            message_type: 'bot',
            message_content: row.bot_response,
            chat_mode: row.chat_mode,
            response_data: row.response_data,
            created_at: row.created_at,
          });
        }
      }

      setChatHistory(transformed);

      const propertyListingMessages = transformed.filter(
        (msg) =>
          msg.message_type === 'bot' &&
          msg.response_data &&
          typeof msg.response_data === 'object' &&
          (msg.response_data as any)?.projects
      );

      const newIds = new Set<string>();
      propertyListingMessages.forEach(msg => {
        const responseProjects = (msg.response_data as any)?.projects || [];
        responseProjects.forEach((p: any) => newIds.add(p.project_id));
      });
      setSessionProjectIds(newIds);

      if (propertyListingMessages.length > 0) {
        const lastPropertyMessage = propertyListingMessages[propertyListingMessages.length - 1];
        setN8nResponse(lastPropertyMessage.response_data);
      }
    }
  };

  const createNewChatSession = async (): Promise<ChatSession | null> => {
    if (!profile?.sales_agent_id) return null;
    
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        sales_agent_id: profile.sales_agent_id,
        title: 'New Chat'
      })
      .select()
      .maybeSingle();
    
    if (error || !data) {
      console.error('Failed to create chat session:', error);
      toast.error('Failed to create chat session');
      return null;
    }
    
    setChatSessions(prev => [data as ChatSession, ...prev]);
    setCurrentSessionId((data as ChatSession).id);
    setChatHistory([]);
    setShowModeSelector(false);
    return data as ChatSession;
  };

  const updateSessionTitle = async (sessionId: string, firstMessage: string) => {
    const title = firstMessage.length > 30 
      ? firstMessage.substring(0, 30) + '...' 
      : firstMessage;
    
    await supabase
      .from('chat_sessions')
      .update({ title })
      .eq('id', sessionId);
    
    setChatSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, title }
          : session
      )
    );
  };

  const createUserMessage = async (sessionId: string, content: string) => {
    const { data, error } = await supabase
      .from('chat_history')
      .insert({
        session_id: sessionId,
        chat_mode: chatMode,
        user_message: content,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('createUserMessage insert error:', error);
      return null;
    }
    return data as { id: string; created_at: string } | null;
  };

  const updateBotResponse = async (rowId: string, content: string, responseData?: any) => {
    const { error } = await supabase
      .from('chat_history')
      .update({ bot_response: content, response_data: responseData })
      .eq('id', rowId);

    if (error) {
      console.error('updateBotResponse error:', error);
    }
  };

  const fetchProjects = async (filterIds: string[] = []) => {
    try {
      setLoadingProjects(true);
      const query = supabase.from('projects').select('*').eq('is_active', true);
      if (filterIds.length > 0) query.in('project_id', filterIds);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setProjects(data || []);
    } catch {
      toast.error('Failed to fetch projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchSavedProjects = async () => {
    if (!profile?.sales_agent_id) return;
    const { data } = await supabase.from('saved_projects').select('project_id').eq('sales_agent_id', profile.sales_agent_id);
    setSavedProjectIds(data?.map((d) => d.project_id) || []);
  };

  const handleSaveToggle = async (projectId: string) => {
    if (!profile?.sales_agent_id) return;
    const alreadySaved = savedProjectIds.includes(projectId);
    try {
      await logSecurityEvent('project_save_toggle', {
        table_name: 'saved_projects',
        record_id: projectId,
        new_values: { sales_agent_id: profile.sales_agent_id }
      });

      if (alreadySaved) {
        const { error } = await supabase.from('saved_projects')
          .delete()
          .eq('sales_agent_id', profile.sales_agent_id)
          .eq('project_id', projectId);
        if (error) throw error;
        setSavedProjectIds(savedProjectIds.filter(id => id !== projectId));
        toast.info('Project unsaved');
      } else {
        const { error } = await supabase.from('saved_projects').insert({
          sales_agent_id: profile.sales_agent_id,
          project_id: projectId
        });
        if (error) throw error;
        setSavedProjectIds([...savedProjectIds, projectId]);
        toast.success('Project saved!');
      }
    } catch {
      toast.error('Failed to toggle save');
    }
  };

  const handleChatSubmit = async () => {
    if (!chatPrompt.trim() || !profile?.sales_agent_id || isSending) return;
    if (chatPrompt.length > 1000) return toast.error('Message too long');

    const rateLimitKey = `chat_${profile.sales_agent_id}`;
    if (!checkRateLimit(rateLimitKey, 10, 60000)) return toast.error('Too many messages. Wait.');

    let sessionId = currentSessionId;
    if (!sessionId) {
      const created = await createNewChatSession();
      if (!created) {
        return;
      }
      sessionId = created.id;
    }

    scrollToBottom();

    const sanitizedPrompt = sanitizeInput(chatPrompt);
    const userMessage = chatPrompt;
    const isFirstMessage = chatHistory.length === 0;
    setChatPrompt('');

    const tempUserMsgId = `temp-user-${Date.now()}`;
    const tempUserMsg: ChatMessage = {
      id: tempUserMsgId,
      message_type: 'user',
      message_content: userMessage,
      chat_mode: chatMode,
      created_at: new Date().toISOString(),
    };
    setChatHistory((prev) => [...prev, tempUserMsg]);
    setIsSending(true);

    try {
      const insertPromise = createUserMessage(sessionId, userMessage);
      const webhookPromise = (async () => {
        const res = await fetch(getWebhookUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: sanitizedPrompt,
            prompt: sanitizedPrompt,
            sales_agent_id: profile.sales_agent_id,
            timestamp: new Date().toISOString(),
            source: 'sales_agent_main_page',
            mode:
              chatMode === 'property-listing'
                ? `property-listing-${propertyListingMode}`
                : chatMode === 'ekarbot-ai'
                ? `ekarbot-ai-${ekarBotMode}`
                : chatMode,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const text = await res.text();
        console.log('Raw n8n response:', text);
        let parsed: any;
        try {
          parsed = JSON.parse(text);
          console.log('Parsed n8n response:', parsed);
        } catch {
          console.log('Failed to parse JSON, treating as text:', text);
          parsed = { type: 'single', content: text };
        }
        return parsed;
      })();

      const [insertedRow, parsed] = await Promise.all([insertPromise, webhookPromise]);

      if (insertedRow) {
        setChatHistory((prev) =>
          prev.map((m) =>
            m.id === tempUserMsgId 
              ? { 
                  ...m, 
                  id: `${insertedRow.id}-user`,
                  created_at: insertedRow.created_at 
                } 
              : m
          )
        );
        if (isFirstMessage) {
          await updateSessionTitle(sessionId, userMessage);
        }
      }

      let botResponse = '';
      if (parsed.type === 'single' && parsed.content) {
        botResponse = parsed.content;
      } else if (parsed.content) {
        botResponse = parsed.content;
      } else if (typeof parsed === 'string') {
        botResponse = parsed;
      }

      console.log('Bot response to save:', botResponse);

      if (insertedRow?.id) {
        await updateBotResponse(insertedRow.id, botResponse, parsed);

        const botMessageObj: ChatMessage = {
          id: `${insertedRow.id}-bot`,
          message_type: 'bot',
          message_content: botResponse,
          chat_mode: chatMode,
          response_data: parsed,
          created_at: new Date().toISOString(),
        };
        setChatHistory((prev) => [...prev, botMessageObj]);
      }

      setN8nResponse(parsed);
      if (parsed.projects && Array.isArray(parsed.projects) && parsed.projects.length > 0) {
        setSessionProjectIds(prev => {
          const updated = new Set(prev);
          parsed.projects.forEach((p: any) => updated.add(p.project_id));
          return updated;
        });
      }
      scrollToBottom();
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      toast.error(`Unable to connect to AI service: ${errorMessage.substring(0, 100)}`);
      
      setChatHistory((prev) => prev.filter(m => m.id !== tempUserMsgId));
    } finally {
      setIsSending(false);
    }
  };

  const handleVoiceMessage = (text: string) => {
    setChatPrompt(text);
  };

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isSending]);
  
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    });
  };

  useEffect(() => {
    if (profile?.sales_agent_id) {
      fetchChatSessions();
      fetchSavedProjects();
    }
  }, [profile]);

  useEffect(() => {
    if (currentSessionId) {
      fetchChatHistory(currentSessionId);
    }
  }, [currentSessionId]);

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  // Enhanced function to format message content
const formatMessageContent = (content: string) => {
  // Helper function to parse bold text (**text**)
  const parseBoldText = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <span key={index} className="font-bold text-gray-800">
            {part.slice(2, -2)}
          </span>
        );
      }
      return part;
    });
  };

  // Normalize line breaks - handle both \n and actual line breaks
  const normalizedContent = content.replace(/\\n/g, '\n');

  // Check if the content appears to be detailed structured content
  const hasNumberedList = /\d+\.\s*\*\*.*?\*\*/m.test(normalizedContent);
  const hasMultipleProjects = normalizedContent.match(/\d+\.\s*\*\*.*?\*\*/g)?.length > 1;
  const hasBulletPoints = normalizedContent.includes('- Status:') || normalizedContent.includes('- Description:');
  const hasDetailedInfo = normalizedContent.length > 200;
  
  // If it's detailed structured content, format it nicely
  if (hasNumberedList && (hasMultipleProjects || hasBulletPoints || hasDetailedInfo)) {
    // Extract the main heading if it exists (text before the first numbered item)
    const mainHeadingMatch = normalizedContent.match(/^(.*?)(?=\d+\.\s*\*\*)/s);
    const mainHeading = mainHeadingMatch ? mainHeadingMatch[1].trim() : '';
    
    // Split content into sections by numbered items
    const sections = normalizedContent.split(/(?=\d+\.\s*\*\*)/g).filter(section => section.trim());
    
    return (
      <div className="space-y-4">
        {/* Main heading */}
        {mainHeading && (
          <div className="mb-4">
            <h3 className="text-sm sm:text-base font-bold text-gray-800 leading-relaxed">
              {parseBoldText(mainHeading)}
            </h3>
          </div>
        )}
        
        {/* Process each numbered section */}
        {sections.map((section, index) => {
          const lines = section.split('\n').filter(line => line.trim());
          
          if (lines.length === 0) return null;
          
          // Extract project title from the first line - improved regex to handle location after **
          const titleMatch = lines[0].match(/^(\d+\.\s*)\*\*(.*?)\*\*(.*)$/);
          const projectNumber = titleMatch ? titleMatch[1] : `${index + 1}. `;
          const projectName = titleMatch ? titleMatch[2] : lines[0].replace(/^\d+\.\s*/, '');
          const projectLocation = titleMatch ? titleMatch[3].replace(/^\s*on\s*|^\s*in\s*|^\s*at\s*|^\s*,\s*/, '').trim() : '';
          
          // Extract bullet points (details) - improved to handle various dash formats
          const details = lines.slice(1).filter(line => /^\s*[-•]\s/.test(line.trim()));
          
          return (
            <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100 shadow-sm">
              {/* Project header */}
              <div className="mb-3">
                <h4 className="text-sm sm:text-base font-bold text-blue-900">
                  {projectNumber}
                  <span className="font-bold">{projectName}</span>
                  {projectLocation && (
                    <span className="font-normal text-blue-700 ml-1">
                      📍 {projectLocation}
                    </span>
                  )}
                </h4>
              </div>
              
              {/* Project details */}
              {details.length > 0 && (
                <div className="space-y-2">
                  {details.map((detail, detailIndex) => {
                    const cleanDetail = detail.replace(/^\s*[-•]\s*/, '').trim();
                    
                    // Check if it's a key-value pair
                    const kvMatch = cleanDetail.match(/^(.*?):\s*(.*)$/);
                    
                    if (kvMatch) {
                      const [, key, value] = kvMatch;
                      return (
                        <div key={detailIndex} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                          <span className="font-bold text-sm sm:text-base text-gray-700 min-w-24">
                            {parseBoldText(key.trim())}:
                          </span>
                          <span className="text-sm sm:text-base text-gray-600 flex-1">
                            {parseBoldText(value.trim())}
                          </span>
                        </div>
                      );
                    } else {
                      return (
                        <div key={detailIndex} className="flex items-start gap-2">
                          <span className="text-blue-500 text-sm mt-1">•</span>
                          <span className="text-sm sm:text-base text-gray-600 flex-1">
                            {parseBoldText(cleanDetail)}
                          </span>
                        </div>
                      );
                    }
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
  
  // For simple/single responses, use enhanced formatting with bold text support
  // Handle line breaks in simple content too
  const simpleLines = normalizedContent.split('\n').filter(line => line.trim());
  
  if (simpleLines.length > 1) {
    return (
      <div className="text-sm sm:text-base leading-relaxed space-y-2">
        {simpleLines.map((line, index) => (
          <p key={index}>{parseBoldText(line.trim())}</p>
        ))}
      </div>
    );
  }
  
  return (
    <div className="text-sm sm:text-base leading-relaxed">
      {parseBoldText(normalizedContent)}
    </div>
  );
};

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const isScrolledUp = scrollTop + clientHeight < scrollHeight - 50;
      setShowScrollDown(isScrolledUp);
    };

    chatContainer.addEventListener('scroll', handleScroll);
    return () => chatContainer.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex flex-col pb-32 sm:pb-36">
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-4">
          {currentSessionId ? (
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
              {chatHistory.map((message) => (
                <div key={message.id} className="space-y-4 sm:space-y-6">
                  {!(message.message_type === 'bot' && message.chat_mode === 'property-listing' && message.response_data?.projects?.length > 0) && (
                    <div
                      className={`flex ${message.message_type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[90%] sm:max-w-[85%] md:max-w-[70%] rounded-xl sm:rounded-2xl px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 ${
                          message.message_type === 'user'
                            ? 'bg-[#455560] text-white'
                            : 'bg-white border border-gray-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          {message.message_type === 'bot' && (
                            <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <img 
                                src="/lovable-uploads/00baa288-f375-4798-aa52-0272029ed647.png" 
                                alt="EkarBot" 
                                className="w-5 h-5 sm:w-6 sm:h-6"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            {message.message_type === 'user' ? (
                              <p className="text-sm sm:text-base leading-relaxed text-white">
                                {message.message_content}
                              </p>
                            ) : (
                              formatMessageContent(message.message_content)
                            )}
                            <p className={`text-xs sm:text-sm mt-1 sm:mt-2 ${
                              message.message_type === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {message.message_type === 'bot' && message.chat_mode === 'property-listing' && message.response_data?.projects?.length > 0 && !loadingProjects && (
                    (() => {
                      const responseData = message.response_data;
                      const messageProjectIds = responseData.projects.map((p: any) => p.project_id);
                      const messageProjects = projects.filter(p => messageProjectIds.includes(p.project_id));
                      const localSortedProjects = messageProjects
                        .map((p: any) => {
                          const match = responseData.projects.find((m: any) => m.project_id === p.project_id);
                          const percentage = match?.similarity_percentage
                            ? parseFloat(String(match.similarity_percentage).replace('%', ''))
                            : 0;
                          return { ...p, match: { ...match, similarity_percentage: percentage } };
                        })
                        .sort((a: any, b: any) => b.match.similarity_percentage - a.match.similarity_percentage);

                      return (
                        <div className="mt-4 sm:mt-6">
                          <div className="mb-2 sm:mb-4 text-center">
                            <Badge className="bg-[#455560] text-white px-3 sm:px-4 py-1 sm:py-2 text-sm sm:text-base">
                              {localSortedProjects.length === 1
                                ? "🏠 Here is the 1 property as you requested"
                                : `🏠 Here are the ${localSortedProjects.length} properties as you requested`}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                            {localSortedProjects.map((project: any) => {
                              const isSaved = savedProjectIds.includes(project.project_id);
                              return (
                                <Card
                                  key={project.project_id}
                                  className="group relative border-0 rounded-xl sm:rounded-2xl overflow-hidden shadow-md sm:shadow-lg bg-white hover:shadow-xl sm:hover:shadow-2xl transform transition-all duration-500 hover:scale-102 sm:hover:scale-105"
                                >
                                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
                                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-full shadow-md sm:shadow-lg">
                                      {project.match?.similarity_percentage}% match
                                    </Badge>
                                  </div>

                                  <div className="relative overflow-hidden">
                                    <img
                                      src={project.cover_image_url}
                                      alt={project.project_title}
                                      className="w-full h-48 sm:h-56 object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                                  </div>

                                  <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
                                    <CardTitle className="text-base sm:text-lg font-bold text-gray-800 line-clamp-2">
                                      {project.project_title}
                                    </CardTitle>
                                    <p className="text-purple-600 font-semibold text-sm sm:text-base">{project.developer_name}</p>
                                    <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
                                      <Badge className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white capitalize rounded-full">
                                        {project.source}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 border-gray-300 text-gray-600 rounded-full">
                                        {project.project_subtype}
                                      </Badge>
                                    </div>
                                  </CardHeader>

                                  <CardContent className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700 px-4 sm:px-5 pb-4 sm:pb-5">
                                    <div className="flex items-center gap-2 sm:gap-3 text-gray-600">
                                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                                      <span className="font-medium text-sm sm:text-base">{project.emirate || 'Unknown Location'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 text-gray-600">
                                      <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                                      <span className="font-bold text-sm sm:text-base text-green-600">
                                        AED {project.starting_price_aed?.toLocaleString() || 'Price on request'}
                                      </span>
                                    </div>

                                    {project.match?.content && (
                                      <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-100">
                                        <p className="text-xs sm:text-sm text-blue-800 line-clamp-2">
                                          {project.match.content}
                                        </p>
                                      </div>
                                    )}

                                    <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 items-center">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedProject(project)}
                                        className="flex-1 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 rounded-lg sm:rounded-xl text-sm sm:text-base transition-all duration-300"
                                      >
                                        <Eye className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" /> 
                                        Details
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleSaveToggle(project.project_id)}
                                        className={`rounded-lg sm:rounded-xl transition-all duration-300 ${
                                          isSaved ? 'text-pink-600 bg-pink-50' : 'text-gray-400 hover:text-pink-600 hover:bg-pink-50'
                                        }`}
                                      >
                                        {isSaved ? <BookmarkCheck className="h-5 w-5 sm:h-6 sm:w-6" /> : <Bookmark className="h-5 w-5 sm:h-6 sm:w-6" />}
                                      </Button>
                                    </div>

                                    <a
                                      href={project.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline transition-colors duration-200 block"
                                    >
                                      View Original Listing ↗
                                    </a>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              ))}

              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 shadow-sm rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center">
                         <img 
                              src="/lovable-uploads/00baa288-f375-4798-aa52-0272029ed647.png" 
                              alt="EkarBot" 
                              className="w-5 h-5 sm:w-6 sm:h-6"
                            />
                      </div>
                      <div className="flex gap-2">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Bot className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-600 mb-3 sm:mb-4">Welcome to EkarBot</h2>
                <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">Create a new chat to get started</p>
                <Button onClick={createNewChatSession} className="bg-[#455560] text-white text-sm sm:text-base py-2 sm:py-3 px-4 sm:px-6">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                  Start New Chat
                </Button>
              </div>
            </div>
          )}
        </div>

        {showScrollDown && (
          <Button
            className="fixed bottom-28 sm:bottom-32 left-4 z-20 bg-white shadow-lg rounded-full p-3 sm:p-4"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-6 w-6 sm:h-8 sm:w-8" />
          </Button>
        )}

        <div className={`fixed bottom-0 left-0 right-0 bg-gray-50 supports-[backdrop-filter]:bg-background/60 backdrop-blur p-3 sm:p-4 z-20 transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
          {currentSessionId && (
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 sm:gap-3">
                <AnimatePresence>
                  {showModeSelector && (
                    <motion.div
                      initial={{ opacity: 0, y: 40, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 40, scale: 0.9 }}
                      transition={{
                        duration: 0.35,
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                      }}
                      ref={dropdownRef}
                      className="absolute bottom-20 sm:bottom-24 left-100 -translate-x-1/2 w-[70vw] sm:w-80 bg-white rounded-lg sm:rounded-xl shadow-xl sm:shadow-2xl border border-gray-200 z-50"
                    >
                      <div className="p-3 sm:p-4">
                        <div className="space-y-4 sm:space-y-6">
                          {(Object.keys(chatModeConfig) as ChatMode[]).map((mode) => {
                            const config = chatModeConfig[mode];
                            const Icon = config.icon;
                            const isActive = chatMode === mode;
                            return (
                              <Button
                                key={mode}
                                variant="ghost"
                                onClick={() => setChatMode(mode)}
                                className={`w-full flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 justify-start rounded-lg transition-colors ${
                                  isActive ? "bg-gray-100 text-gray-900" : "hover:bg-gray-50"
                                }`}
                              >
                                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                                <div className="text-left">
                                  <div className="text-sm sm:text-base font-medium">{config.label}</div>
                                  <div className="text-xs sm:text-sm text-gray-500">{config.description}</div>
                                </div>
                              </Button>
                            );
                          })}
                        </div>

                        {(chatMode === "property-listing" || chatMode === "ekarbot-ai") && (
                          <div className="mt-3 sm:mt-4 border-t pt-2 sm:pt-3">
                            <div className="text-xs sm:text-sm font-medium text-gray-500 mb-2 sm:mb-3 px-2">
                              {chatMode === "property-listing"
                                ? "Property Listing Mode"
                                : "EkarBot AI Mode"}
                            </div>
                            <div className="flex gap-2 sm:gap-3 px-2">
                              <Button
                                variant={
                                  chatMode === "property-listing"
                                    ? propertyListingMode === "inhouse"
                                      ? "default"
                                      : "outline"
                                    : ekarBotMode === "inhouse"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                className="flex-1 text-sm sm:text-base py-2 sm:py-3"
                                onClick={() =>
                                  chatMode === "property-listing"
                                    ? setPropertyListingMode("inhouse")
                                    : setEkarBotMode("inhouse")
                                }
                              >
                                Inhouse
                              </Button>
                              <Button
                                variant={
                                  chatMode === "property-listing"
                                    ? propertyListingMode === "external"
                                      ? "default"
                                      : "outline"
                                    : ekarBotMode === "external"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                className="flex-1 text-sm sm:text-base py-2 sm:py-3"
                                onClick={() =>
                                  chatMode === "property-listing"
                                    ? setPropertyListingMode("external")
                                    : setEkarBotMode("external")
                                }
                              >
                                External
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 sm:mt-4 px-2">
                          <Button
                            onClick={() => setShowModeSelector(false)}
                            className="w-full from-[#455560] to-[#3a464f] hover:from-[#3a464f] hover:to-[#455560] text-white rounded-lg text-sm sm:text-base py-2 sm:py-3"
                          >
                            Apply Settings
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex-1 flex items-center gap-2 sm:gap-3 bg-white border border-gray-300 rounded-full px-3 sm:px-4 py-2 sm:py-3">
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={{
                      scale: showModeSelector ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowModeSelector(!showModeSelector)}
                      className="shrink-0 rounded-full bg-gray-100 hover:bg-gray-200 w-10 h-10 sm:w-12 sm:h-12"
                    >
                      {showModeSelector ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </Button>
                  </motion.div>

                  <Input
                    value={chatPrompt}
                    onChange={(e) => setChatPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChatSubmit()}
                    placeholder="Ask EkarBot anything..."
                    className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm sm:text-base"
                    disabled={isSending}
                  />

                  <VoiceRecorder onVoiceMessage={handleVoiceMessage} disabled={isSending} />

                  <Button
                    onClick={handleChatSubmit}
                    disabled={!chatPrompt.trim() || isSending}
                    className="bg-[#455560] text-white rounded-full h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center p-0 shadow-md"
                  >
                    <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              </div>

              <div className="mt-2 sm:mt-3 text-center">
                <span className="text-xs sm:text-sm text-gray-500">
                  Current mode: {chatModeConfig[chatMode].label}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedProject && (
        <ProjectDetailModal
          open={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          project={selectedProject}
        />
      )}
    </div>
  );
};

export default SalesAgentMainPage;