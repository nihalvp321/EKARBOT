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
import ScrollToBottomButton from "@/components/ScrollToBottomButton"; // adjust the path
import { supabase } from '@/integrations/supabase/client';
import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';
import { toast } from 'sonner';
import { sanitizeInput } from '@/utils/inputValidation';
import { logSecurityEvent, checkRateLimit } from '@/utils/securityUtils';
import ProjectDetailModal from '@/components/ProjectDetailModal';

const scrollToBottom = () => {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth", // smooth scroll
  });
};


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
  
  // New state to store all projects from chat history
  const [allSessionProjects, setAllSessionProjects] = useState<any[]>([]);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { profile } = useSalesAgentAuth();

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [sessionProjectIds, setSessionProjectIds] = useState<Set<string>>(new Set());

  // Modified useEffect to set projects from allSessionProjects instead of fetching
  useEffect(() => {
    if (allSessionProjects.length > 0) {
      setProjects(allSessionProjects);
    } else {
      setProjects([]);
    }
  }, [allSessionProjects, setProjects]);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowModeSelector(false);
      }
    };
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
    get placeholder() {
      return ekarBotMode === 'inhouse'
        ? 'Ask about inhouse projects and CRM data...'
        : 'Ask about external projects data...';
    },
    color: 'from-[#455560] to-[#3a464f] hover:from-[#3a464f] hover:to-[#455560]'
  },
    hybrid: {
      label: 'Hybrid Power',
      icon: Zap,
      description: 'Combined AI intelligence',
      placeholder: 'Ask EkarBot anything...',
      color: 'from-[#455560] to-[#3a464f] hover:from-[#3a464f] hover:to-[#455560]'
    },
    'property-listing': {
      label: 'Property Listing',
      icon: Building,
      description: `Fetch latest active listings (${propertyListingMode})`,
      get placeholder() {
      return propertyListingMode === 'inhouse'
        ? 'Search inhouse property listings by name, type, or location...'
        : 'Search external property listings by name, type, or location...';
    },
      color: 'from-[#455560] to-[#3a464f] hover:from-[#3a464f] hover:to-[#455560]'
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

  // Modified fetchChatHistory to extract and store all projects from the session
  const fetchChatHistory = async (sessionId: string) => {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const transformed: ChatMessage[] = [];
      const sessionProjects: any[] = [];
      const projectIds = new Set<string>();
      
      for (const row of data as any[]) {
        if (row.user_message) {
          transformed.push({
            id: `${row.id}-user`,
            message_type: 'user' as const,
            message_content: row.user_message,
            chat_mode: row.chat_mode,
            created_at: row.created_at,
          });
        }
        
        if (row.bot_response) {
          const botMessage: ChatMessage = {
            id: `${row.id}-bot`,
            message_type: 'bot' as const,
            message_content: row.bot_response,
            chat_mode: row.chat_mode,
            response_data: row.response_data,
            created_at: row.created_at,
          };
          transformed.push(botMessage);

          // Extract projects from response_data - handle both 'multiple' and 'single' types
          if (row.response_data && typeof row.response_data === 'object') {
            let projectsArray = null;
            
            // Check if it's the 'multiple' type format
            if (row.response_data.type === 'multiple' && 
                row.response_data.projects && 
                Array.isArray(row.response_data.projects)) {
              projectsArray = row.response_data.projects;
            }
            // Check if projects exist directly
            else if (row.response_data.projects && 
                     Array.isArray(row.response_data.projects)) {
              projectsArray = row.response_data.projects;
            }

            // Process projects if found
            if (projectsArray) {
              projectsArray.forEach((project: any) => {
                if (project && project.project_id && !projectIds.has(project.project_id)) {
                  projectIds.add(project.project_id);
                  sessionProjects.push(project);
                }
              });
            }
          }
        }
      }

      setChatHistory(transformed);
      setAllSessionProjects(sessionProjects);
      setSessionProjectIds(projectIds);

      // Set the latest response data if there are any property listing messages
      const propertyListingMessages = transformed.filter(
        (msg) =>
          msg.message_type === 'bot' &&
          msg.response_data &&
          typeof msg.response_data === 'object' &&
          (msg.response_data as any)?.projects
      );

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
    setAllSessionProjects([]); // Clear projects for new session
    setSessionProjectIds(new Set());
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

      let responseDataToSave = parsed;

      if (chatMode === 'property-listing' && parsed.projects && Array.isArray(parsed.projects) && parsed.projects.length > 0) {
        const projectIds = parsed.projects.map((p: any) => p.project_id);
        const { data: fullProjects, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('is_active', true)
          .in('project_id', projectIds);

        if (fetchError) {
          console.error('Failed to fetch full projects:', fetchError);
          toast.error('Failed to load project details');
        } else {
          const enhancedProjects = parsed.projects.map((match: any) => {
            const full = fullProjects.find((p: any) => p.project_id === match.project_id);
            return full ? { ...full, match: { similarity_percentage: match.similarity_percentage, content: match.content } } : null;
          }).filter(Boolean);

          responseDataToSave = { ...parsed, projects: enhancedProjects };
          setN8nResponse(responseDataToSave);
          
          // Update allSessionProjects with new projects
          const newProjectIds = new Set(sessionProjectIds);
          const newSessionProjects = [...allSessionProjects];
          
          enhancedProjects.forEach((project: any) => {
            if (!newProjectIds.has(project.project_id)) {
              newProjectIds.add(project.project_id);
              newSessionProjects.push(project);
            }
          });
          
          setSessionProjectIds(newProjectIds);
          setAllSessionProjects(newSessionProjects);
        }
      } else {
        setN8nResponse(parsed);
      }

      if (insertedRow?.id) {
        await updateBotResponse(insertedRow.id, botResponse, responseDataToSave);

        const botMessageObj: ChatMessage = {
          id: `${insertedRow.id}-bot`,
          message_type: 'bot',
          message_content: botResponse,
          chat_mode: chatMode,
          response_data: responseDataToSave,
          created_at: new Date().toISOString(),
        };
        setChatHistory((prev) => [...prev, botMessageObj]);
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
            <h3 className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
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
            <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md p-3 border border-blue-100 shadow-sm">
              {/* Project header */}
              <div className="mb-2">
                <h4 className="text-xs sm:text-sm font-bold text-blue-900">
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
                <div className="space-y-1">
                  {details.map((detail, detailIndex) => {
                    const cleanDetail = detail.replace(/^\s*[-•]\s*/, '').trim();
                    
                    // Check if it's a key-value pair
                    const kvMatch = cleanDetail.match(/^(.*?):\s*(.*)$/);
                    
                    if (kvMatch) {
                      const [, key, value] = kvMatch;
                      return (
                        <div key={detailIndex} className="flex flex-col sm:flex-row sm:items-start gap-1">
                          <span className="font-bold text-xs sm:text-sm text-gray-700 min-w-20">
                            {parseBoldText(key.trim())}:
                          </span>
                          <span className="text-xs sm:text-sm text-gray-600 flex-1">
                            {parseBoldText(value.trim())}
                          </span>
                        </div>
                      );
                    } else {
                      return (
                        <div key={detailIndex} className="flex items-start gap-1">
                          <span className="text-blue-500 text-xs mt-0.5">•</span>
                          <span className="text-xs sm:text-sm text-gray-600 flex-1">
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
      <div className="text-xs sm:text-sm leading-relaxed space-y-1">
        {simpleLines.map((line, index) => (
          <p key={index}>{parseBoldText(line.trim())}</p>
        ))}
      </div>
    );
  }
  
  return (
    <div className="text-xs sm:text-sm leading-relaxed">
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
      <div className="flex-1 flex flex-col pb-28 sm:pb-32">
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-2 sm:p-3">
          {currentSessionId ? (
            <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4">
              {chatHistory.map((message) => (
                <div key={message.id} className="space-y-3 sm:space-y-4">
                  {!(message.message_type === 'bot' && message.response_data && (() => {
  const responseData = message.response_data as any;
  const projects = responseData?.type === 'multiple' 
    ? responseData?.projects 
    : responseData?.projects;
  const hasProjects = projects && Array.isArray(projects) && projects.length > 0;
  return hasProjects;
})()) && (
                      <div
                      className={`flex ${message.message_type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] md:max-w-[65%] rounded-lg sm:rounded-xl px-2 sm:px-3 md:px-4 py-1 sm:py-2 md:py-3 ${
                          message.message_type === 'user'
                            ? 'bg-[#455560] text-white'
                            : 'bg-white border border-gray-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-1 sm:gap-2">
                          {message.message_type === 'bot' && (
                            <div className="shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <img 
                                src="/lovable-uploads/00baa288-f375-4798-aa52-0272029ed647.png" 
                                alt="EkarBot" 
                                className="w-4 h-4 sm:w-5 sm:h-5"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            {message.message_type === 'user' ? (
                              <p className="text-xs sm:text-sm leading-relaxed text-white">
                                {message.message_content}
                              </p>
                            ) : (
                              formatMessageContent(message.message_content)
                            )}
                            <p className={`text-xs mt-1 ${
                              message.message_type === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                 {message.message_type === 'bot' && message.response_data && (() => {
                    const responseData = message.response_data as any;
                    const projects = responseData?.type === 'multiple' 
                      ? responseData?.projects 
                      : responseData?.projects;
                    return projects && Array.isArray(projects) && projects.length > 0;
                  })() && !loadingProjects && (
                    (() => {
                      const responseData = message.response_data as any;
                      // Handle both 'type: multiple' format and direct projects array
                      const projectsArray = responseData?.type === 'multiple' 
                        ? responseData?.projects 
                        : responseData?.projects;
                      
                      if (!projectsArray || !Array.isArray(projectsArray)) return null;

                      const localSortedProjects = projectsArray
                        .map((p: any) => {
                          const percentage = p.match?.similarity_percentage
                            ? parseFloat(String(p.match.similarity_percentage).replace('%', ''))
                            : 0;
                          return { ...p, match: { ...p.match, similarity_percentage: percentage } };
                        })
                        .sort((a: any, b: any) => b.match.similarity_percentage - a.match.similarity_percentage);

                      return (
                        <div className="mt-3 sm:mt-4">
                          <div className="mb-1 sm:mb-2 text-center">
                            <Badge className="bg-[#455560] text-white px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
                              {localSortedProjects.length === 1
                                ? "🏠 Here is the 1 property as you requested"
                                : `🏠 Here are the ${localSortedProjects.length} properties as you requested`}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                            {localSortedProjects.map((project: any) => {
                              const isSaved = savedProjectIds.includes(project.project_id);
                              return (
                                <Card
                                  key={project.project_id}
                                  className="group relative border-0 rounded-lg sm:rounded-xl overflow-hidden shadow-sm sm:shadow-md bg-white hover:shadow-md sm:hover:shadow-lg transform transition-all duration-300 hover:scale-101 sm:hover:scale-103"
                                >
                                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10">
                                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold px-1 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full shadow-sm sm:shadow-md">
                                      {project.match?.similarity_percentage}% match
                                    </Badge>
                                  </div>

                                  <div className="relative overflow-hidden">
                                    <img
                                      src={project.cover_image_url}
                                      alt={project.project_title}
                                      className="w-full h-40 sm:h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                                  </div>

                                  <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                                    <CardTitle className="text-sm sm:text-base font-bold text-gray-800 line-clamp-2">
                                      {project.project_title}
                                    </CardTitle>
                                    <p className="text-purple-600 font-semibold text-xs sm:text-sm">{project.developer_name}</p>
                                    <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                                      <Badge className="text-xs px-1 sm:px-2 py-0.5 sm:py-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white capitalize rounded-full">
                                        {project.source}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs px-1 sm:px-2 py-0.5 sm:py-1 border-gray-300 text-gray-600 rounded-full">
                                        {project.project_subtype}
                                      </Badge>
                                    </div>
                                  </CardHeader>

                                  <CardContent className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-700 px-3 sm:px-4 pb-3 sm:pb-4">
                                    <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
                                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                                      <span className="font-medium text-xs sm:text-sm">{project.emirate || 'Unknown Location'}</span>
                                    </div>
                                    <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
                                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                                      <span className="font-bold text-xs sm:text-sm text-green-600">
                                        AED {project.starting_price_aed?.toLocaleString() || 'Price on request'}
                                      </span>
                                    </div>

                                    {project.match?.content && (
                                      <div className="bg-blue-50 p-2 sm:p-3 rounded-md border border-blue-100">
                                        <p className="text-xs text-blue-800">
                                          {project.match.content}
                                        </p>
                                      </div>
                                    )}

                                    <div className="flex gap-1 sm:gap-2 pt-2 sm:pt-3 items-center">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedProject(project)}
                                        className="flex-1 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 rounded-md sm:rounded-lg text-xs sm:text-sm transition-all duration-300"
                                      >
                                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> 
                                        Details
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleSaveToggle(project.project_id)}
                                        className={`rounded-md sm:rounded-lg transition-all duration-300 ${
                                          isSaved ? 'text-pink-600 bg-pink-50' : 'text-gray-400 hover:text-pink-600 hover:bg-pink-50'
                                        }`}
                                      >
                                        {isSaved ? <BookmarkCheck className="h-4 w-4 sm:h-5 sm:w-5" /> : <Bookmark className="h-4 w-4 sm:h-5 sm:w-5" />}
                                      </Button>
                                    </div>

                                    {project.source !== 'inhouse' && (
                                      <a
                                        href={project.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors duration-200 block"
                                      >
                                        View Original Listing ↗
                                      </a>
                                    )}
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
                  <div className="bg-white border border-gray-200 shadow-sm rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-full flex items-center justify-center">
                         <img 
                              src="/lovable-uploads/00baa288-f375-4798-aa52-0272029ed647.png" 
                              alt="EkarBot" 
                              className="w-4 h-4 sm:w-5 sm:h-5"
                            />
                      </div>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
              </div>
            </div>
          )}
        </div>

          <ScrollToBottomButton scrollToBottom={scrollToBottom} isCollapsed={isCollapsed} />


        <div className={`fixed bottom-0 left-0 right-0 bg-gray-50 supports-[backdrop-filter]:bg-background/60 backdrop-blur p-2 sm:p-3 z-20 transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
          {currentSessionId && (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-1 sm:gap-2">
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
                      className="absolute bottom-20 sm:bottom-24 left-100 -translate-x-1/2 w-[60vw] sm:w-72 bg-white rounded-md sm:rounded-lg shadow-lg sm:shadow-xl border border-gray-200 z-50"
                    >
                      <div className="p-2 sm:p-3">
                        <div className="space-y-3 sm:space-y-4">
                          {(Object.keys(chatModeConfig) as ChatMode[]).map((mode) => {
                            const config = chatModeConfig[mode];
                            const Icon = config.icon;
                            const isActive = chatMode === mode;
                            return (
                              <Button
                                key={mode}
                                variant="ghost"
                                onClick={() => setChatMode(mode)}
                                className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1 sm:py-2 justify-start rounded-md transition-colors ${
                                  isActive ? "bg-gray-100 text-gray-900" : "hover:bg-gray-50"
                                }`}
                              >
                                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                                <div className="text-left">
                                  <div className="text-[12px] sm:text-[13px] font-medium">{config.label}</div>
                                  <div className="text-[11px] sm:text-[12px] text-gray-500">{config.description}</div>
                                </div>
                              </Button>
                            );
                          })}
                        </div>

                        {(chatMode === "property-listing" || chatMode === "ekarbot-ai") && (
                          <div className="mt-2 sm:mt-3 border-t pt-1 sm:pt-2">
                            <div className="text-[12px] font-medium text-gray-500 mb-1 sm:mb-2 px-1">
                              {chatMode === "property-listing"
                                ? "Property Listing Mode"
                                : "EkarBot AI Mode"}
                            </div>
                            <div className="flex gap-1 sm:gap-2 px-1">
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
                                className="flex-1 text-[12px] py-1 sm:py-2 rounded-full"
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
                                className="flex-1 text-[12px] py-1 sm:py-2 rounded-full"
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

                        <div className="mt-2 sm:mt-3 px-1">
                          <Button
                            onClick={() => setShowModeSelector(false)}
                            className="w-full from-[#455560] to-[#3a464f] hover:from-[#3a464f] hover:to-[#455560] text-white rounded-md text-[12px] sm:text-[13px] py-1 sm:py-2"
                          >
                            Apply Settings
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex-1 flex items-center gap-1 sm:gap-2 bg-white border border-gray-300 rounded-full px-2 sm:px-3 py-1 sm:py-2">
                  <motion.div
  initial={{ scale: 1 }}
  animate={{
    scale: showModeSelector ? 1.1 : 1,
  }}
  transition={{ duration: 0.4, ease: "easeInOut" }} // slowed down
>
  <Button
    variant="ghost"
    size="icon"
    onClick={() => setShowModeSelector(!showModeSelector)}
    className="shrink-0 rounded-full bg-gray-100 hover:bg-gray-200 w-8 h-8 sm:w-8 sm:h-8 relative overflow-hidden"
  >
    <AnimatePresence mode="wait" initial={false}>
      {showModeSelector ? (
        <motion.div
          key="x"
          initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <X className="w-3 h-3 sm:w-4 sm:h-4" />
        </motion.div>
      ) : (
        <motion.div
          key="plus"
          initial={{ opacity: 0, rotate: 90, scale: 0.8 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: -90, scale: 0.8 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
        </motion.div>
      )}
    </AnimatePresence>
  </Button>
</motion.div>


                  <Input
  value={chatPrompt}
  onChange={(e) => setChatPrompt(e.target.value)}
  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChatSubmit()}
  placeholder={
    chatMode === 'ekarbot-ai'
      ? ekarBotMode === 'inhouse'
        ? 'Ask about inhouse projects and CRM data...'
        : 'Ask about external projects data...'
      : chatMode === 'property-listing'
      ? propertyListingMode === 'inhouse'
        ? 'Ask about inhouse property listings...'
        : 'Ask about external property listings...'
      : chatModeConfig[chatMode]?.placeholder || 'Ask EkarBot anything...'
  }
  className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-[12px] sm:text-[13px]"
  disabled={isSending}
/>

                  <VoiceRecorder onVoiceMessage={handleVoiceMessage} disabled={isSending} />

                  <Button
                   onClick={handleChatSubmit}
                   disabled={!chatPrompt.trim() || isSending}
                   className="bg-[#455560] text-white rounded-full h-8 w-8  flex items-center justify-center p-0 shadow-md"
                  >
                   <ArrowUp className="w-3 h-3 sm:h-4 sm:w-4" />
                  </Button>

                </div>
              </div>

              <div className="mt-1 sm:mt-2 text-center">
                <span className="text-[12px] text-gray-500">
                 Current mode: {chatModeConfig[chatMode].label}{" "}
                               {chatMode === "property-listing"
                               ? `(${propertyListingMode})`
                               : chatMode === "ekarbot-ai"
                               ? `(${ekarBotMode})`
                              : ""}
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