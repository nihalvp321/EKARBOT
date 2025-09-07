import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Send, Bot, User, Zap, Sparkles, X, Minimize2, Maximize2, MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeInput } from '@/utils/inputValidation';
import { logSecurityEvent } from '@/utils/securityUtils';

interface ResponseItem {
  project_id: string;
  similarity_percentage: number;
  content: string;
}

interface ProjectWithSimilarity {
  project_id: string;
  project_title: string;
  developer_name: string;
  emirate: string;
  region_area: string;
  project_type: string;
  description: string;
  similarity_percentage: number;
  content: string;
  starting_price_aed?: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  searchResults?: {
    query: string;
    total: number;
    currentPage: number;
    totalPages: number;
    projects: ProjectWithSimilarity[];
  };
}

type ChatMode = 'inhouse' | 'chatgpt' | 'hybrid' | 'property-listing';

const SalesAgentChatBot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "👋 Welcome to EkarBot! I'm your AI-powered Dubai real estate specialist. I can help you discover the perfect properties using advanced search and relevance scoring. What kind of property are you looking for today?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>('inhouse');
  const [searchState, setSearchState] = useState<{
    query: string;
    allProjects: ProjectWithSimilarity[];
    currentPage: number;
    totalPages: number;
  } | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTypingResponse, setIsTypingResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const profile = { sales_agent_id: 'S107' };

  const statusMessages = [
    { text: '🔍 Analyzing your request...', icon: '🤖' },
    { text: '🏢 Searching property database...', icon: '🔍' },
    { text: '📊 Calculating match scores...', icon: '⚡' },
    { text: '✨ Preparing your results...', icon: '🎯' },
    { text: '🎉 Almost ready!', icon: '🚀' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let currentIndex = 0;
    if (isLoading) {
      setSendStatus(statusMessages[0].text);
      interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % statusMessages.length;
        setSendStatus(statusMessages[currentIndex].text);
      }, 2000);
    } else {
      setSendStatus(null);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  /** Get webhook URL based on chat mode */
  /** Get webhook URL based on chat mode */
const getWebhookUrl = () => {
  switch (chatMode) {
    case 'inhouse':
      return 'https://shafil.app.n8n.cloud/webhook-test/recommend-projects';
    case 'chatgpt':
      return 'https://shafil.app.n8n.cloud/webhook-test/chatgpt';
    case 'hybrid':
      return 'https://ekarbotproject.duckdns.org/webhook/hybrid';
    case 'property-listing':
      return 'https://shafil.app.n8n.cloud/webhook-test/property-listing';
    default:
      return '';
  }
};


  const savePromptToDatabase = async (promptText: string) => {
    try {
      if (!profile?.sales_agent_id) return;
      await logSecurityEvent('chat_prompt_save', {
        table_name: 'chat_prompts',
        record_id: profile.sales_agent_id,
        new_values: { prompt_text: promptText.substring(0, 100) },
      });
      await supabase.from('chat_prompts').insert([
        {
          sales_agent_id: profile.sales_agent_id,
          prompt_text: sanitizeInput(promptText),
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Failed to save prompt to database:', error);
    }
  };

  const fetchProjectsByIds = async (
    responseItems: ResponseItem[]
  ): Promise<ProjectWithSimilarity[]> => {
    try {
      const projectIds = responseItems.map((item) => item.project_id);
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .in('project_id', projectIds)
        .eq('is_active', true);
      if (error) {
        console.error('Error fetching projects:', error);
        return [];
      }
      const projectsWithSimilarity: ProjectWithSimilarity[] =
        projects?.map((project) => {
          const responseItem = responseItems.find(
            (item) => item.project_id === project.project_id
          );
          return {
            project_id: project.project_id,
            project_title: project.project_title || 'Untitled Project',
            developer_name: project.developer_name || 'Unknown Developer',
            emirate: project.emirate || 'UAE',
            region_area: project.region_area || 'Unknown Area',
            project_type: project.project_type || 'Residential',
            description: project.description || 'No description available',
            similarity_percentage: Math.round(
              (responseItem?.similarity_percentage || 0) * 100
            ),
            content: responseItem?.content || '',
            starting_price_aed: project.starting_price_aed,
          };
        }) || [];
      projectsWithSimilarity.sort(
        (a, b) => b.similarity_percentage - a.similarity_percentage
      );
      return projectsWithSimilarity;
    } catch (error) {
      console.error('Error processing recommended projects:', error);
      return [];
    }
  };

  const simulateTyping = async (content: string): Promise<void> => {
    return new Promise((resolve) => {
      setIsTypingResponse(true);
      setTimeout(() => {
        setIsTypingResponse(false);
        resolve();
      }, Math.min(content.length * 20, 2000));
    });
  };

  const handleSearch = async (query: string, page = 1) => {
    if (!query || query.trim().length === 0) {
      toast.error('Please enter a search query', {
        icon: '⚠️',
        style: { background: '#fef2f2' },
      });
      return;
    }
    if (query.length > 1000) {
      toast.error('Search query is too long (max 1000 characters)', {
        icon: '📏',
        style: { background: '#fef2f2' },
      });
      return;
    }
    const sanitizedQuery = sanitizeInput(query);
    setIsLoading(true);
    if (page === 1) {
      const userMessage: Message = {
        role: 'user',
        content: sanitizedQuery,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
    }
    try {
      await savePromptToDatabase(sanitizedQuery);
      const requestBody = {
        message: sanitizedQuery,
        prompt: sanitizedQuery,
        sales_agent_id: profile.sales_agent_id,
        timestamp: new Date().toISOString(),
        source: 'sales_agent_chatbot',
        mode: chatMode,
      };
      const response = await fetch(getWebhookUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      const responseText = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${responseText}`);
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch {
        parsedResponse = responseText;
      }
      let allProjects: ProjectWithSimilarity[] = [];
      let assistantContent = '';
      if (Array.isArray(parsedResponse) && parsedResponse.length > 0 && parsedResponse[0].project_id) {
        allProjects = await fetchProjectsByIds(parsedResponse);
        if (allProjects.length > 0) {
          const projectsPerPage = 3;
          const totalPages = Math.ceil(allProjects.length / projectsPerPage);
          const currentPageProjects = allProjects.slice(
            (page - 1) * projectsPerPage,
            page * projectsPerPage
          );
          setSearchState({
            query: sanitizedQuery,
            allProjects,
            currentPage: page,
            totalPages,
          });
          assistantContent = `🎯 Found ${allProjects.length} matching properties! Here are the top ${currentPageProjects.length} results (Page ${page}/${totalPages}):`;
          const assistantMessage: Message = {
            role: 'assistant',
            content: assistantContent,
            timestamp: new Date(),
            searchResults: {
              query: sanitizedQuery,
              total: allProjects.length,
              currentPage: page,
              totalPages,
              projects: currentPageProjects,
            },
          };
          await simulateTyping(assistantContent);
          if (page === 1) setMessages((prev) => [...prev, assistantMessage]);
          else
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = assistantMessage;
              return newMessages;
            });
          return;
        } else {
          assistantContent =
            '😔 No matching properties found for your query. Try rephrasing or broadening your search terms.';
        }
      } else if (typeof parsedResponse === 'object' && parsedResponse.content) {
        assistantContent = parsedResponse.content;
      } else if (typeof parsedResponse === 'string') {
        assistantContent = parsedResponse;
      } else {
        assistantContent =
          "🤖 I received your query but couldn't find relevant project matches. Please try a different search.";
      }
      await simulateTyping(assistantContent);
      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      toast.error('Error contacting EkarBot', {
        icon: '🤖',
        style: { background: '#fef2f2' },
      });
      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ Error: ${error.message}. Please try again or contact support.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePagination = (direction: 'prev' | 'next') => {
    if (!searchState) return;
    const newPage =
      direction === 'prev'
        ? searchState.currentPage - 1
        : searchState.currentPage + 1;
    if (newPage >= 1 && newPage <= searchState.totalPages) {
      handleSearch(searchState.query, newPage);
    }
  };

  const handleSendMessage = async () => {
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage) return;
    setInputMessage('');
    await handleSearch(trimmedMessage);
  };

  const handleSaveProject = async (project: ProjectWithSimilarity) => {
    try {
      await logSecurityEvent('project_save', {
        table_name: 'saved_projects',
        record_id: project.project_id,
        new_values: { project_title: project.project_title },
      });
      const { error } = await supabase.from('saved_projects').insert([
        {
          sales_agent_id: profile.sales_agent_id,
          project_id: project.project_id,
        },
      ]);
      if (error) {
        console.error('Error saving project:', error);
        toast.error('Failed to save project');
        return;
      }
      toast.success(`Project "${project.project_title}" saved!`, {
        icon: '💾',
        style: { background: '#dcfce7' },
      });
    } catch {
      toast.error('Failed to save project');
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          "👋 Chat cleared! I'm ready to help you find your perfect property. What are you looking for?",
        timestamp: new Date(),
      },
    ]);
    setSearchState(null);
  };

 const chatModeConfig: Record<ChatMode, {
  label: string;
  icon: any;
  description: string;
  gradient: string;
  bgColor: string;
  textColor: string;
}> = {
  inhouse: {
    label: 'EkarBot AI',
    icon: MessageSquare,
    description: 'Our proprietary AI assistant',
    gradient: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
  },
  chatgpt: {
    label: 'ChatGPT',
    icon: Bot,
    description: 'OpenAI ChatGPT integration',
    gradient: 'from-green-500 to-green-600',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
  },
  hybrid: {
    label: 'Hybrid Power',
    icon: Zap,
    description: 'Combined AI intelligence',
    gradient: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
  },
  'property-listing': {
    label: 'Property Listing',
    icon: Bot, // you can swap with Building if imported
    description: 'Fetch latest active listings',
    gradient: 'from-pink-500 to-pink-600',
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-700',
  },
};

  const currentModeConfig = chatModeConfig[chatMode];

  return (
    <div
      className={`flex flex-col bg-white shadow-2xl border-0 rounded-2xl overflow-hidden transition-all duration-500 transform ${
        isMinimized ? 'h-16 max-w-sm' : 'h-[700px] max-w-5xl'
      } mx-auto`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 bg-gradient-to-r ${currentModeConfig.gradient} text-white shadow-lg`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`w-10 h-10 ${currentModeConfig.bgColor} rounded-full flex items-center justify-center shadow-lg`}
            >
              <Bot className={`w-6 h-6 ${currentModeConfig.textColor}`} />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-white"></div>
          </div>
          {!isMinimized && (
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                EkarBot Assistant{' '}
                <Sparkles className="w-5 h-5 animate-pulse" />
              </h3>
              <p className="text-sm text-white/90">
                AI-powered Dubai real estate expert
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="text-white hover:bg-white/20 rounded-lg"
            disabled={isMinimized}
          >
            <X className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white hover:bg-white/20 rounded-lg"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Mode Toggle */}
          <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex flex-wrap gap-2 mb-2">
              <p className="text-sm font-semibold text-gray-700 w-full mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Select AI Mode:
              </p>
              {(Object.keys(chatModeConfig) as ChatMode[]).map((mode) => {
                const config = chatModeConfig[mode];
                const Icon = config.icon;
                const isActive = chatMode === mode;
                return (
                  <Button
                    key={mode}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChatMode(mode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                      isActive
                        ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg border-0 hover:shadow-xl`
                        : 'hover:bg-blue-50 border-blue-200 hover:border-blue-300'
                    }`}
                    disabled={isLoading}
                  >
                    <Icon className="w-4 h-4" /> {config.label}
                  </Button>
                );
              })}
            </div>
            <div
              className={`p-3 rounded-lg border shadow-sm ${currentModeConfig.bgColor} border-opacity-50`}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-medium text-gray-700">Active:</span>{' '}
                <span className={currentModeConfig.textColor}>
                  {currentModeConfig.description}
                </span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 animate-fade-in-up ${
                  message.role === 'user' ? 'justify-end' : ''
                }`}
              >
                {message.role === 'assistant' && (
                  <div
                    className={`w-10 h-10 ${currentModeConfig.bgColor} rounded-full flex items-center justify-center flex-shrink-0 shadow-md`}
                  >
                    <Bot className={`w-5 h-5 ${currentModeConfig.textColor}`} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] ${
                    message.role === 'user' ? 'order-1' : ''
                  }`}
                >
                  <div
                    className={`rounded-2xl p-4 shadow-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white ml-auto'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && !isLoading && handleSendMessage()
                }
                placeholder="Ask about properties, locations, prices, or amenities..."
                className="flex-1"
                disabled={isLoading}
                maxLength={1000}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="sm"
                className="px-4 min-w-[60px]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <div
                      className="w-2 h-2 bg-white rounded-full animate-pulse"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-white rounded-full animate-pulse"
                      style={{ animationDelay: '0.4s' }}
                    ></div>
                  </div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-500">
                Powered by AI • Secure & Rate Limited • Max 1000 characters
              </p>
              {sendStatus && (
                <p className="text-xs text-blue-600 animate-pulse font-medium">
                  {sendStatus}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesAgentChatBot;
