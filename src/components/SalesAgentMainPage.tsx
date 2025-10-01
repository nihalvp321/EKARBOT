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
import { LeadDetailsPopup } from './LeadDetailsPopup';
import { CustomerDetailsPopup } from './CustomerDetailsPopup';
import { ActivityDetailsPopup } from './ActivityDetailsPopup';
import { ProjectDetailsPopup } from './ProjectDetailsPopup';


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
  const [isNearBottom, setIsNearBottom] = useState(true);
  const autoScrollByUserRef = useRef(false);
  const [sessionProjectIds, setSessionProjectIds] = useState<Set<string>>(new Set());
  const [messageProjects, setMessageProjects] = useState<Record<string, any[]>>({});
  const [messageEntityIds, setMessageEntityIds] = useState<Record<string, any>>({});
  const [selectedEntityId, setSelectedEntityId] = useState<{ type: string; id: string } | null>(null);

  // Persistent storage functions
  const saveToLocalStorage = (key: string, data: any) => {
    if (profile?.sales_agent_id) {
      try {
        localStorage.setItem(`${key}_${profile.sales_agent_id}`, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    }
  };

  const loadFromLocalStorage = (key: string) => {
    if (profile?.sales_agent_id) {
      try {
        const stored = localStorage.getItem(`${key}_${profile.sales_agent_id}`);
        return stored ? JSON.parse(stored) : null;
      } catch (error) {
        console.warn('Failed to load from localStorage:', error);
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    if (currentSessionId && sessionProjectIds.size > 0) {
      fetchProjects(Array.from(sessionProjectIds));
      // Save session project IDs to localStorage per session
      saveToLocalStorage(`sessionProjects_${currentSessionId}`, Array.from(sessionProjectIds));
    }
  }, [sessionProjectIds, currentSessionId]);

  // Load persisted data on profile load
  useEffect(() => {
    if (profile?.sales_agent_id) {
      // Load current session ID
      if (!propCurrentSessionId) {
        const storedId = localStorage.getItem(`currentSessionId_${profile.sales_agent_id}`);
        if (storedId) {
          setLocalCurrentSessionId(storedId);
        }
      }
    }
  }, [profile, propCurrentSessionId]);

  // Save current session ID to localStorage
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
      } else {
        // If no sessions exist, create one with EkarBot initial message
        await createInitialChatSession();
      }
    }
  };

  const createInitialChatSession = async () => {
    const session = await createNewChatSession();
    if (session) {
      // Add initial EkarBot greeting message
      const initialMessage = "Hello! I'm EkarBot, your AI-powered real estate assistant. I'm here to help you find the perfect properties for your clients. How can I assist you today?";
      
      const { data, error } = await supabase
        .from('chat_history')
        .insert({
          session_id: session.id,
          chat_mode: 'ekarbot-ai',
          bot_response: initialMessage,
        })
        .select()
        .maybeSingle();

      if (!error && data) {
        const botMessage: ChatMessage = {
          id: `${data.id}-bot`,
          message_type: 'bot',
          message_content: initialMessage,
          chat_mode: 'ekarbot-ai',
          created_at: data.created_at,
        };
        setChatHistory([botMessage]);
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
      const allPropertyData = new Set<string>();
      const projectsByMessage: Record<string, any[]> = {};
      let lastUserRowId: string | null = null;
      
      for (const row of data as any[]) {
        // Support both legacy paired-row schema (user_message/bot_response on same row)
        // and normalized message-per-row schema (message_type/message_content)
        if (row.message_type === 'user' || row.user_message) {
          transformed.push({
            id: `${row.id}-user`,
            message_type: 'user',
            message_content: row.message_content ?? row.user_message,
            chat_mode: row.chat_mode,
            created_at: row.created_at,
          });
          // Track the latest user message row id to associate following bot response
          lastUserRowId = row.id;
        }

        // Determine if this row contains a bot message
        const hasBot = row.message_type === 'bot' || !!row.bot_response;
        if (hasBot) {
          // Ensure response_data is an object (some rows may store it as a JSON string)
          let parsedResponse: any = row.response_data;
          if (typeof parsedResponse === 'string') {
            try {
              parsedResponse = JSON.parse(parsedResponse);
            } catch {
              // leave as is if parsing fails
            }
          }

          // Extract entity IDs if present in response_data
          if (parsedResponse?.extractedIds) {
            const ids = parsedResponse.extractedIds;
            if (ids && Object.keys(ids).length > 0) {
              setMessageEntityIds(prev => ({ ...prev, [`${row.id}-bot`]: ids }));
            }
          }

          // Normalize projects from various historical payload shapes
          const getProjectsFromResponse = (r: any): any[] => {
            if (!r) return [];
            const candidates = [
              r?.projects,
              r?.data?.projects,
              r?.properties,
              r?.listings,
              r?.results,
              r?.response?.projects,
              r?.searchResults?.projects
            ];
            const found = candidates.find((c: any) => Array.isArray(c) && c.length > 0);
            return Array.isArray(found) ? found : [];
          };

          const normalizedProjects = getProjectsFromResponse(parsedResponse);

          const botMessage: ChatMessage = {
            id: `${row.id}-bot`,
            message_type: 'bot',
            message_content: row.message_content ?? row.bot_response ?? '',
            chat_mode: row.chat_mode,
            // Ensure response_data always exposes projects if we could normalize them
            response_data: normalizedProjects.length > 0
              ? { ...(typeof parsedResponse === 'object' ? parsedResponse : {}), projects: normalizedProjects }
              : parsedResponse,
            created_at: row.created_at,
          };
          transformed.push(botMessage);

          // Extract project data from response_data and populate messageProjects immediately
          if (normalizedProjects.length > 0) {
            // If this is a standalone bot row, associate its projects with the previous user row
            const targetBaseId = (row.message_type === 'bot' && lastUserRowId) ? lastUserRowId : row.id;
            projectsByMessage[targetBaseId] = projectsByMessage[targetBaseId] || [];

            normalizedProjects.forEach((project: any) => {
              const pid = project.project_id || project.projectId || project.id;
              if (pid) {
                allPropertyData.add(pid);

                // Map project data for immediate display
                const mappedProject = {
                  project_id: project.project_id || project.projectId || project.id,
                  project_title: project.project_title || project.title || project.name,
                  developer_name: project.developer_name || project.developer || project.builder,
                  emirate: project.emirate || project.location || project.city,
                  starting_price_aed: project.starting_price_aed || project.price || project.starting_price,
                  cover_image_url: project.cover_image_url || project.image_url || project.image,
                  source: project.source,
                  project_subtype: project.project_subtype || project.subtype || project.type,
                  url: project.url || project.link,
                  region_area: project.region_area || project.area || project.region,
                  description: project.description,
                  match: {
                    similarity_percentage: project.match?.similarity_percentage || project.similarity_percentage || 0,
                    content: project.match?.content || project.reasoning || project.content || ''
                  }
                };

                projectsByMessage[targetBaseId].push(mappedProject);
              }
            });

            // Sort projects by similarity percentage
            projectsByMessage[targetBaseId].sort((a, b) =>
              (b.match?.similarity_percentage || 0) - (a.match?.similarity_percentage || 0)
            );
          }
        }
      }

      console.log('fetchChatHistory - Extracted projectsByMessage:', projectsByMessage);
      console.log('fetchChatHistory - Total messages:', transformed.length);

      setChatHistory(transformed);
      
      // Set messageProjects immediately from response_data
      if (Object.keys(projectsByMessage).length > 0) {
        console.log('Setting messageProjects from database response_data');
        setMessageProjects(projectsByMessage);
        
        // Save to localStorage for next time
        saveToLocalStorage(`messageProjects_${sessionId}`, projectsByMessage);
      }

      // Update session project IDs with all extracted project data
      if (allPropertyData.size > 0) {
        const projectIds = Array.from(allPropertyData);
        setSessionProjectIds(new Set(projectIds));
        
        // Set the most recent response data for current display
        const lastPropertyMessage = transformed
          .filter(msg => 
            msg.message_type === 'bot' && 
            msg.response_data && 
            msg.response_data.projects?.length > 0
          )
          .pop();
        
          if (lastPropertyMessage && lastPropertyMessage.response_data) {
            setN8nResponse(lastPropertyMessage.response_data);
          }
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

  const touchSessionUpdatedAt = async (sessionId: string) => {
    try {
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);
    } catch (e) {
      console.warn('Failed to touch session updated_at', e);
    }
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
    // First, store full n8n response in chat_history
    const { error } = await supabase
      .from('chat_history')
      .update({ bot_response: content, response_data: responseData })
      .eq('id', rowId);

    if (error) {
      console.error('Error updating bot response:', error);
      return;
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

    autoScrollByUserRef.current = true;

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
      console.log('Full response data:', parsed);

      // Extract entity IDs from bot response using OpenAI
      let extractedIds = {};
      try {
        console.log('🔍 Extracting entity IDs from bot response...');
        const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-entity-ids', {
          body: { message: botResponse }
        });
        
        if (!extractError && extractData?.extractedIds) {
          extractedIds = extractData.extractedIds;
          console.log('✅ Extracted IDs:', extractedIds);
        }
      } catch (error) {
        console.error('⚠️ Error extracting IDs (continuing anyway):', error);
      }

      // Enrich response with full project data so cards persist on refresh/navigation
      let finalResponse: any = parsed;
      try {
        // Normalize projects array from various possible n8n payload shapes
        const getProjects = (r: any) => {
          const candidates = [
            r?.projects,
            r?.data?.projects,
            r?.properties,
            r?.listings,
            r?.results,
            r?.response?.projects
          ];
          return candidates.find((c: any) => Array.isArray(c) && c.length > 0) || [];
        };

        const normalizedProjects: any[] = getProjects(parsed);

        if (normalizedProjects.length > 0) {
          const ids = normalizedProjects
            .map((p: any) => p.project_id || p.projectId || p.id)
            .filter(Boolean);
          if (ids.length > 0) {
            const { data: dbProjects, error: dbErr } = await supabase
              .from('projects')
              .select('*')
              .in('project_id', ids);
            if (!dbErr && Array.isArray(dbProjects)) {
              const byId = new Map<string, any>(dbProjects.map((p: any) => [p.project_id, p]));
              const merged = normalizedProjects.map((item: any) => {
                const pid = item.project_id || item.projectId || item.id;
                const base = byId.get(pid);
                const match = {
                  similarity_percentage: item.match?.similarity_percentage ?? item.similarity_percentage ?? 0,
                  content: item.match?.content ?? item.content ?? item.reasoning ?? ''
                };
                return base ? { ...base, match } : { project_id: pid, match, ...item };
              });
              finalResponse = { ...parsed, projects: merged };
            } else {
              // Even if DB fetch fails, ensure we have projects array normalized
              finalResponse = { ...parsed, projects: normalizedProjects };
            }
          } else {
            finalResponse = { ...parsed, projects: normalizedProjects };
          }
        }
      } catch (e) {
        console.warn('Failed to enrich response with full project data:', e);
        finalResponse = parsed;
      }

      // Add extracted IDs to finalResponse
      if (Object.keys(extractedIds).length > 0) {
        finalResponse = { ...finalResponse, extractedIds };
      }

      if (insertedRow?.id) {
        await updateBotResponse(insertedRow.id, botResponse, finalResponse);
        
        // Store extracted IDs in state for immediate display
        if (Object.keys(extractedIds).length > 0) {
          setMessageEntityIds(prev => ({ ...prev, [`${insertedRow.id}-bot`]: extractedIds }));
        }
        if (sessionId) {
          await touchSessionUpdatedAt(sessionId);
        }

        const botMessageObj: ChatMessage = {
          id: `${insertedRow.id}-bot`,
          message_type: 'bot',
          message_content: botResponse,
          chat_mode: chatMode,
          response_data: finalResponse,
          created_at: new Date().toISOString(),
        };
        setChatHistory((prev) => [...prev, botMessageObj]);

        // Immediately extract and populate messageProjects for instant card display
        if (finalResponse.projects && Array.isArray(finalResponse.projects) && finalResponse.projects.length > 0) {
          console.log('Processing project data from response:', finalResponse.projects);
          
          const baseMessageId = insertedRow.id;
          const mappedProjects = finalResponse.projects.map((project: any) => ({
            project_id: project.project_id,
            project_title: project.project_title,
            developer_name: project.developer_name,
            emirate: project.emirate,
            starting_price_aed: project.starting_price_aed,
            cover_image_url: project.cover_image_url,
            source: project.source,
            project_subtype: project.project_subtype,
            url: project.url,
            region_area: project.region_area,
            match: {
              similarity_percentage: project.match?.similarity_percentage ?? project.similarity_percentage ?? 0,
              content: project.match?.content ?? project.reasoning ?? project.content ?? ''
            }
          }));

          // Sort by similarity percentage
          mappedProjects.sort((a, b) => 
            (b.match?.similarity_percentage || 0) - (a.match?.similarity_percentage || 0)
          );

          // Immediately update messageProjects for instant display
          setMessageProjects(prev => ({
            ...prev,
            [baseMessageId]: mappedProjects
          }));

          // Update session project IDs (append, don't replace)
          setSessionProjectIds(prev => {
            const updated = new Set(prev);
            finalResponse.projects.forEach((p: any) => {
              const pid = p.project_id || p.projectId || p.id;
              if (pid) updated.add(pid);
            });
            return updated;
          });

          // Save to localStorage for persistence
          saveToLocalStorage(`messageProjects_${currentSessionId}`, {
            ...loadFromLocalStorage(`messageProjects_${currentSessionId}`) || {},
            [baseMessageId]: mappedProjects
          });

        }
      }

      setN8nResponse(finalResponse);
      if (currentSessionId) {
        saveToLocalStorage(`lastResponse_${currentSessionId}`, finalResponse);
        if (finalResponse?.projects && Array.isArray(finalResponse.projects) && finalResponse.projects.length > 0) {
          const existing = loadFromLocalStorage(`responseHistory_${currentSessionId}`) || [];
          const nextHistory = Array.isArray(existing) ? [...existing, finalResponse] : [finalResponse];
          saveToLocalStorage(`responseHistory_${currentSessionId}`, nextHistory);
        }
      }
      /* auto-scroll handled by effect */
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

  // Persist chat history per session to localStorage
  useEffect(() => {
    if (currentSessionId) {
      saveToLocalStorage(`chatHistory_${currentSessionId}`, chatHistory);
    }
  }, [chatHistory, currentSessionId]);

  useEffect(() => {
    if (autoScrollByUserRef.current || isNearBottom) {
      scrollToBottom();
    }
    autoScrollByUserRef.current = false;
  }, [chatHistory, isSending, isNearBottom]);
  
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
    if (!currentSessionId) return;
    
    // First, try to load from localStorage for instant display
    const persistedHistory = loadFromLocalStorage(`chatHistory_${currentSessionId}`);
    const persistedProjects = loadFromLocalStorage(`sessionProjects_${currentSessionId}`);
    const persistedResponse = loadFromLocalStorage(`lastResponse_${currentSessionId}`);
    const persistedResponseHistory = loadFromLocalStorage(`responseHistory_${currentSessionId}`);
    const persistedMessageProjects = loadFromLocalStorage(`messageProjects_${currentSessionId}`);
    
    if (persistedHistory && Array.isArray(persistedHistory)) {
      // Normalize any stringified response_data back to objects for bot messages
      const normalized = persistedHistory.map((m: any) => {
        if (m?.message_type === 'bot' && typeof m?.response_data === 'string') {
          try { return { ...m, response_data: JSON.parse(m.response_data) }; } catch { return m; }
        }
        return m;
      });
      setChatHistory(normalized);
      console.log('Loaded persisted chat history:', normalized.length, 'messages');
    }
    
    if (persistedProjects && Array.isArray(persistedProjects)) {
      setSessionProjectIds(new Set(persistedProjects));
      console.log('Loaded persisted project IDs:', persistedProjects);
      // Ensure projects are fetched immediately for instant card rendering
      if (persistedProjects.length > 0) {
        fetchProjects(persistedProjects);
      }
    }

    // Load persisted messageProjects from localStorage
    if (persistedMessageProjects && typeof persistedMessageProjects === 'object') {
      // Normalize keys to base row id (strip -bot/-user suffixes)
      const normalized: Record<string, any[]> = {};
      Object.keys(persistedMessageProjects).forEach((k) => {
        const base = k.replace(/-(bot|user)$/,'');
        if (!normalized[base]) normalized[base] = [];
        const arr = Array.isArray(persistedMessageProjects[k]) ? persistedMessageProjects[k] : [];
        normalized[base] = arr;
      });
      setMessageProjects(normalized);
      saveToLocalStorage(`messageProjects_${currentSessionId}`, normalized);
      console.log('Loaded and normalized persisted message projects from localStorage');
    } else if (persistedHistory && Array.isArray(persistedHistory)) {
      // If messageProjects not in localStorage, extract from response_data in chat history
      const extractedProjects: Record<string, any[]> = {};
      persistedHistory.forEach((m: any) => {
        if (m.message_type === 'bot') {
          const r = m.response_data;
          const candidates = [
            r?.projects,
            r?.data?.projects,
            r?.properties,
            r?.listings,
            r?.results,
            r?.response?.projects,
            r?.searchResults?.projects
          ];
          const found = candidates.find((c: any) => Array.isArray(c) && c.length > 0) || [];
          if (Array.isArray(found) && found.length > 0) {
            const baseMessageId = typeof m.id === 'string' ? m.id.replace(/-(bot|user)$/,'') : m.id;
            extractedProjects[baseMessageId] = found.map((project: any) => ({
              project_id: project.project_id || project.projectId || project.id,
              project_title: project.project_title || project.title || project.name,
              developer_name: project.developer_name || project.developer || project.builder,
              emirate: project.emirate || project.location || project.city,
              starting_price_aed: project.starting_price_aed || project.price || project.starting_price,
              cover_image_url: project.cover_image_url || project.image_url || project.image,
              source: project.source,
              project_subtype: project.project_subtype || project.subtype || project.type,
              url: project.url || project.link,
              region_area: project.region_area || project.area || project.region,
              match: {
                similarity_percentage: project.match?.similarity_percentage ?? project.similarity_percentage ?? 0,
                content: project.match?.content ?? project.reasoning ?? project.content ?? ''
              }
            })).sort((a: any, b: any) => (b.match?.similarity_percentage || 0) - (a.match?.similarity_percentage || 0));
          }
        }
      });
      
      if (Object.keys(extractedProjects).length > 0) {
        setMessageProjects(extractedProjects);
        // Save to localStorage for next time
        saveToLocalStorage(`messageProjects_${currentSessionId}`, extractedProjects);
        console.log('Extracted message projects from response_data:', extractedProjects);
      }
    }

    // Hydrate all property-listing responses for instant card rendering
    const hasPropertyMessagesInPersisted = Array.isArray(persistedHistory) && persistedHistory.some(
      (m: any) => m.message_type === 'bot' && m.chat_mode === 'property-listing' && (m.response_data as any)?.projects?.length > 0
    );

    if (persistedResponse && typeof persistedResponse === 'object') {
      setN8nResponse(persistedResponse);
    } else {
      setN8nResponse(null);
    }
    
    // Then fetch fresh data from Supabase
    fetchChatHistory(currentSessionId);
  }, [currentSessionId]);


  // Ensure all projects referenced in chatHistory are fetched
  useEffect(() => {
    const ids = new Set<string>();
    chatHistory.forEach((m) => {
      const projects = (m as any)?.response_data?.projects;
      if (Array.isArray(projects)) {
        projects.forEach((p: any) => {
          const pid = p?.project_id ?? p?.projectId ?? p?.id;
          if (pid) ids.add(pid);
        });
      }
    });
    if (ids.size > 0) {
      setSessionProjectIds((prev) => new Set([...prev, ...Array.from(ids)]));
    }
  }, [chatHistory]);

  // Fetch message projects when chat history or session changes

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
                          <span className="font-bold text-xs sm:text-sm text-gray-700 min-w-24">
                            {parseBoldText(key.trim())}:
                          </span>
                          <span className="text-xs sm:text-sm text-gray-600 flex-1">
                            {parseBoldText(value.trim())}
                          </span>
                        </div>
                      );
                    } else {
                      return (
                        <div key={detailIndex} className="flex items-start gap-2">
                          <span className="text-blue-500 text-xs mt-1">•</span>
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
  
  // If message contains entity-style items (Lead/Customer/Activity/Project blocks),
  // render each block and attach corresponding "View" buttons under each item.
  const entityItemRegex = /(Lead \(lead_id:|Customer ID:|Activity ID:|project_id:|Project ID:)/i;
  if (entityItemRegex.test(normalizedContent)) {
    const paragraphs = normalizedContent.split(/\n\s*\n+/).filter(Boolean);
    let header = '';
    let items = paragraphs;
    if (!entityItemRegex.test(paragraphs[0])) {
      header = paragraphs[0];
      items = paragraphs.slice(1);
    }

    const extractIds = (text: string) => {
      const lead = text.match(/lead_id:\s*([A-Z0-9\-]+)/i)?.[1];
      const customer = text.match(/Customer ID:\s*([A-Z0-9\-]+)/i)?.[1];
      const activity = text.match(/activity_id:\s*([A-Z0-9\-]+)/i)?.[1];
      const project = text.match(/(?:project_id|Project ID):\s*([A-Z0-9\-]+)/i)?.[1];
      return { lead, customer, activity, project };
    };

    return (
      <div className="space-y-3">
        {header && (
          <p className="text-xs sm:text-sm leading-relaxed">{parseBoldText(header.trim())}</p>
        )}
        {items.map((block, idx) => {
          const lines = block.split('\n').filter(l => l.trim());
          const text = block.trim();
          const ids = extractIds(text);
          return (
            <div key={idx} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs sm:text-sm leading-relaxed space-y-1">
                {lines.map((l, i) => (
                  <p key={i}>{parseBoldText(l.trim())}</p>
                ))}
              </div>
              {(ids.lead || ids.customer || ids.activity || ids.project) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {ids.lead && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedEntityId({ type: 'lead', id: ids.lead! })}>
                      <Eye className="w-3 h-3 mr-1" /> View Lead {ids.lead}
                    </Button>
                  )}
                  {ids.customer && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedEntityId({ type: 'customer', id: ids.customer! })}>
                      <Eye className="w-3 h-3 mr-1" /> View Customer {ids.customer}
                    </Button>
                  )}
                  {ids.activity && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedEntityId({ type: 'activity', id: ids.activity! })}>
                      <Eye className="w-3 h-3 mr-1" /> View Activity {ids.activity}
                    </Button>
                  )}
                  {ids.project && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedEntityId({ type: 'project', id: ids.project! })}>
                      <Eye className="w-3 h-3 mr-1" /> View Project {ids.project}
                    </Button>
                  )}
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
      <div className="text-xs sm:text-sm leading-relaxed space-y-2">
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

  const handleChatScroll = () => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainer;
    const isScrolledUp = scrollTop + clientHeight < scrollHeight - 50;
    setIsNearBottom(!isScrolledUp);
    setShowScrollDown(isScrolledUp);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex flex-col pb-28 sm:pb-32">
        <div ref={chatContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto p-4 sm:p-6">
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
                              <>
                                {formatMessageContent(message.message_content)}
                                
                                {/* Entity Details Buttons - Inside bot message */}
                                {(() => {
                                  const entityIds = messageEntityIds[message.id];
                                  console.log('🔍 Checking entity IDs for message:', message.id, entityIds);
                                  if (!entityIds || Object.keys(entityIds).length === 0) return null;
                                  const contentText = message.message_content || '';
                                  const hasPerItemEntities = /(Lead \(lead_id:|Customer ID:|Activity ID:|project_id:|Project ID:)/i.test(contentText);
                                  if (hasPerItemEntities) return null; // Per-item buttons already rendered inside content
                                  return (
                                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                    {messageEntityIds[message.id].lead_ids && messageEntityIds[message.id].lead_ids.length > 0 && (
                                      <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-700">Leads:</p>
                                        <div className="flex flex-wrap gap-2">
                                          {messageEntityIds[message.id].lead_ids.map((leadId: string, idx: number) => (
                                            <Button
                                              key={`lead-${idx}`}
                                              size="sm"
                                              variant="outline"
                                              className="text-xs"
                                              onClick={() => setSelectedEntityId({ type: 'lead', id: leadId })}
                                            >
                                              <Eye className="w-3 h-3 mr-1" />
                                              View Lead {leadId}
                                            </Button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {messageEntityIds[message.id].customer_ids && messageEntityIds[message.id].customer_ids.length > 0 && (
                                      <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-700">Customers:</p>
                                        <div className="flex flex-wrap gap-2">
                                          {messageEntityIds[message.id].customer_ids.map((customerId: string, idx: number) => (
                                            <Button
                                              key={`customer-${idx}`}
                                              size="sm"
                                              variant="outline"
                                              className="text-xs"
                                              onClick={() => setSelectedEntityId({ type: 'customer', id: customerId })}
                                            >
                                              <Eye className="w-3 h-3 mr-1" />
                                              View Customer {customerId}
                                            </Button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {messageEntityIds[message.id].activity_ids && messageEntityIds[message.id].activity_ids.length > 0 && (
                                      <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-700">Activities:</p>
                                        <div className="flex flex-wrap gap-2">
                                          {messageEntityIds[message.id].activity_ids.map((activityId: string, idx: number) => (
                                            <Button
                                              key={`activity-${idx}`}
                                              size="sm"
                                              variant="outline"
                                              className="text-xs"
                                              onClick={() => setSelectedEntityId({ type: 'activity', id: activityId })}
                                            >
                                              <Eye className="w-3 h-3 mr-1" />
                                              View Activity {activityId}
                                            </Button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {messageEntityIds[message.id].project_ids && messageEntityIds[message.id].project_ids.length > 0 && (
                                      <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-700">Projects:</p>
                                        <div className="flex flex-wrap gap-2">
                                          {messageEntityIds[message.id].project_ids.map((projectId: string, idx: number) => (
                                            <Button
                                              key={`project-${idx}`}
                                              size="sm"
                                              variant="outline"
                                              className="text-xs"
                                              onClick={() => setSelectedEntityId({ type: 'project', id: projectId })}
                                            >
                                              <Eye className="w-3 h-3 mr-1" />
                                              View Project {projectId}
                                            </Button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  );
                                })()}
                              </>
                            )}
                            <p className={`text-[10px] sm:text-xs mt-1 sm:mt-2 ${
                              message.message_type === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Remove the old entity buttons section that was outside the message */}

{(() => {
  const baseMessageId = typeof message.id === 'string' ? message.id.replace(/-(bot|user)$/,'') : (message.id as any);
  const items = messageProjects[baseMessageId] || [];
  if (message.message_type !== 'user' || items.length === 0) return null;
  const localSortedProjects = items.slice().sort((a: any, b: any) => (b.match?.similarity_percentage || 0) - (a.match?.similarity_percentage || 0));
  return (
    <div className="mt-4 sm:mt-6">
      <div className="mb-2 sm:mb-4 text-center">
        <Badge className="bg-[#455560] text-white px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm">
          {localSortedProjects.length === 1 ? "🏠 Here is the 1 property as you requested" : `🏠 Here are the ${localSortedProjects.length} properties as you requested`}
        </Badge>
      </div>
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        {localSortedProjects.map((project: any, index: number) => {
          const isSaved = savedProjectIds.includes(project.project_id);
          return (
            <motion.div key={project.project_id} initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, delay: index * 0.1, type: "spring", stiffness: 100, damping: 15 }}>
              <Card className="group relative border-0 rounded-xl sm:rounded-2xl overflow-hidden shadow-md sm:shadow-lg bg-white hover:shadow-xl sm:hover:shadow-2xl transform transition-all duration-500 hover:scale-102 sm:hover:scale-105">
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10">
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full shadow-md sm:shadow-lg">
                    {project.match?.similarity_percentage}% match
                  </Badge>
                </div>
                <div className="relative overflow-hidden">
                  <img src={project.cover_image_url} alt={project.project_title} className="w-full h-40 sm:h-48 object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>
                <CardHeader className="p-3 sm:p-5 pb-2 sm:pb-3">
                  <CardTitle className="text-base sm:text-lg font-bold text-gray-800 line-clamp-2">{project.project_title}</CardTitle>
                  <p className="text-purple-600 font-semibold text-xs sm:text-sm">{project.developer_name}</p>
                  <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
                    <Badge className="text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white capitalize rounded-full">{project.source}</Badge>
                    <Badge variant="outline" className="text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 border-gray-300 text-gray-600 rounded-full">{project.project_subtype}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-700 px-3 sm:px-5 pb-3 sm:pb-5">
                  <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                    <span className="font-medium text-xs sm:text-sm">{project.emirate || 'Unknown Location'}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                    <span className="font-bold text-xs sm:text-sm text-green-600">AED {project.starting_price_aed?.toLocaleString() || 'Price on request'}</span>
                  </div>
                  {project.match?.content && (
                    <div className="bg-blue-50 p-2 sm:p-3 rounded-lg border border-blue-100">
                      <p className="text-[10px] sm:text-xs text-blue-800 line-clamp-3">
                        <strong>AI Reasoning:</strong> {project.match.content}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-1 sm:gap-2 pt-2 sm:pt-3 items-center">
                    <Button variant="outline" size="sm" onClick={() => setSelectedProject(project)} className="flex-1 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all duration-300">
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Details
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleSaveToggle(project.project_id)} className={`rounded-lg sm:rounded-xl transition-all duration-300 ${savedProjectIds.includes(project.project_id) ? 'text-pink-600 bg-pink-50' : 'text-gray-400 hover:text-pink-600 hover:bg-pink-50'}`}>
                      {savedProjectIds.includes(project.project_id) ? <BookmarkCheck className="h-4 w-4 sm:h-5 sm:w-5" /> : <Bookmark className="h-4 w-4 sm:h-5 sm:w-5" />}
                    </Button>
                  </div>
                  <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-800 underline transition-colors duration-200 block">
                    View Original Listing ↗
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
})()}

                </div>
              ))}

              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 shadow-sm rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2 sm:py-4">
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
                <Bot className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-2 sm:mb-4" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2 sm:mb-4">Welcome to EkarBot</h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">Create a new chat to get started</p>
                <Button onClick={createNewChatSession} className="bg-[#455560] text-white text-xs sm:text-sm">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Start New Chat
                </Button>
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showScrollDown && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-32 right-4 z-20"
            >
              <Button
                className="bg-white hover:bg-gray-50 shadow-lg hover:shadow-xl rounded-full p-3 border border-gray-200 transition-all duration-200"
                onClick={scrollToBottom}
              >
                <ArrowDown className="h-5 w-5 text-gray-600" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`fixed bottom-0 left-0 right-0 bg-gray-50 supports-[backdrop-filter]:bg-background/60 backdrop-blur p-2 sm:p-4 z-10 transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
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
                      className="absolute bottom-20 sm:bottom-[105px] left-[320px] -translate-x-1/2 w-64 sm:w-72 bg-white rounded-lg sm:rounded-xl shadow-xl sm:shadow-2xl border border-gray-200 z-50"
                    >
                      <div className="p-2 sm:p-3">
                        <div className="space-y-3 sm:space-y-5">
                          {(Object.keys(chatModeConfig) as ChatMode[]).map((mode) => {
                            const config = chatModeConfig[mode];
                            const Icon = config.icon;
                            const isActive = chatMode === mode;
                            return (
                              <Button
                                key={mode}
                                variant="ghost"
                                onClick={() => setChatMode(mode)}
                                className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1 sm:py-2 justify-start rounded-lg transition-colors ${
                                  isActive ? "bg-gray-100 text-gray-900" : "hover:bg-gray-50"
                                }`}
                              >
                                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                                <div className="text-left">
                                  <div className="text-xs sm:text-sm font-medium">{config.label}</div>
                                  <div className="text-[10px] sm:text-xs text-gray-500">{config.description}</div>
                                </div>
                              </Button>
                            );
                          })}
                        </div>

                        {(chatMode === "property-listing" || chatMode === "ekarbot-ai") && (
                          <div className="mt-2 sm:mt-3 border-t pt-1 sm:pt-2">
                            <div className="text-[10px] sm:text-xs font-medium text-gray-500 mb-1 sm:mb-2 px-2">
                              {chatMode === "property-listing"
                                ? "Property Listing Mode"
                                : "EkarBot AI Mode"}
                            </div>
                            <div className="flex gap-1 sm:gap-2 px-2">
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
                                className="flex-1 text-[10px] sm:text-xs"
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
                                className="flex-1 text-[10px] sm:text-xs"
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

                        <div className="mt-2 sm:mt-4 px-2">
                          <Button
                            onClick={() => setShowModeSelector(false)}
                            className="w-full from-[#455560] to-[#3a464f] hover:from-[#3a464f] hover:to-[#455560] text-white rounded-lg text-[10px] sm:text-sm"
                          >
                            Apply Settings
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex-1 flex items-center gap-1 sm:gap-2 bg-white border border-gray-300 rounded-full px-2 sm:px-4 py-2 sm:py-3">
                  <motion.div
                    initial={{ rotate: 0, scale: 1 }}
                    animate={{
                      rotate: showModeSelector ? 45 : 0,
                      scale: showModeSelector ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowModeSelector(!showModeSelector)}
                      className="shrink-0 rounded-full bg-gray-100 hover:bg-gray-200 w-8 h-8 sm:w-10 sm:h-10"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </motion.div>

                  <Input
                    value={chatPrompt}
                    onChange={(e) => setChatPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChatSubmit()}
                    placeholder="Ask EkarBot anything..."
                    className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-[10px] sm:text-sm"
                    disabled={isSending}
                  />

                  <VoiceRecorder onVoiceMessage={handleVoiceMessage} disabled={isSending} />

                  <Button
                    onClick={handleChatSubmit}
                    disabled={!chatPrompt.trim() || isSending}
                    className="bg-[#455560] text-white rounded-full h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center p-0 shadow-md"
                  >
                    <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-1 sm:mt-2 text-center">
                <span className="text-[10px] sm:text-xs text-gray-500">
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

      {/* Entity Detail Popups */}
      <LeadDetailsPopup
        leadId={selectedEntityId?.type === 'lead' ? selectedEntityId.id : ''}
        open={selectedEntityId?.type === 'lead' || false}
        onOpenChange={(open) => !open && setSelectedEntityId(null)}
      />
      <CustomerDetailsPopup
        customerId={selectedEntityId?.type === 'customer' ? selectedEntityId.id : ''}
        open={selectedEntityId?.type === 'customer' || false}
        onOpenChange={(open) => !open && setSelectedEntityId(null)}
      />
      <ActivityDetailsPopup
        activityId={selectedEntityId?.type === 'activity' ? selectedEntityId.id : ''}
        open={selectedEntityId?.type === 'activity' || false}
        onOpenChange={(open) => !open && setSelectedEntityId(null)}
      />
      <ProjectDetailsPopup
        projectId={selectedEntityId?.type === 'project' ? selectedEntityId.id : ''}
        open={selectedEntityId?.type === 'project' || false}
        onClose={() => setSelectedEntityId(null)}
      />
    </div>
  );
};

export default SalesAgentMainPage;