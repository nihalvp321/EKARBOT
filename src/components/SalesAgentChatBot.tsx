import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Bot, User, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSecureWebhook } from '@/hooks/useSecureWebhook';
import { validateInput, sanitizeInput } from '@/utils/inputValidation';
import { logSecurityEvent } from '@/utils/securityUtils';
import { toast } from 'sonner';

interface ResponseItem {
  source_id: string;
  similarity: number;
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
  searchResults?: {
    query: string;
    total: number;
    currentPage: number;
    totalPages: number;
    projects: ProjectWithSimilarity[];
  };
}

const SalesAgentChatBot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI assistant specializing in Dubai real estate projects. I can help you find properties using advanced search with relevance scoring. Just describe what you're looking for and I'll show you the most relevant projects first!",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchState, setSearchState] = useState<{
    query: string;
    allProjects: ProjectWithSimilarity[];
    currentPage: number;
    totalPages: number;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const profile = { sales_agent_id: 'S107' };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const savePromptToDatabase = async (promptText: string) => {
    try {
      if (!profile?.sales_agent_id) return;

      await logSecurityEvent('chat_prompt_save', {
        table_name: 'chat_prompts',
        record_id: profile.sales_agent_id,
        new_values: { prompt_text: promptText.substring(0, 100) }
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

  const fetchProjectsByIds = async (responseItems: ResponseItem[]): Promise<ProjectWithSimilarity[]> => {
    try {
      const projectIds = responseItems.map(item => item.source_id);
      
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .in('project_id', projectIds)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching projects:', error);
        return [];
      }

      const projectsWithSimilarity: ProjectWithSimilarity[] = projects?.map(project => {
        const responseItem = responseItems.find(item => item.source_id === project.project_id);
        return {
          project_id: project.project_id,
          project_title: project.project_title || 'Untitled Project',
          developer_name: project.developer_name || 'Unknown Developer',
          emirate: project.emirate || 'UAE',
          region_area: project.region_area || 'Unknown Area',
          project_type: project.project_type || 'Residential',
          description: project.description || 'No description available',
          similarity_percentage: Math.round((responseItem?.similarity || 0) * 100),
          content: responseItem?.content || '',
          starting_price_aed: project.starting_price_aed
        };
      }) || [];

      projectsWithSimilarity.sort((a, b) => b.similarity_percentage - a.similarity_percentage);
      
      return projectsWithSimilarity;
    } catch (error) {
      console.error('Error processing recommended projects:', error);
      return [];
    }
  };

  const handleSearch = async (query: string, page = 1) => {
    if (!query || query.trim().length === 0) {
      toast.error('Please enter a search query');
      return;
    }

    if (query.length > 1000) {
      toast.error('Search query is too long (max 1000 characters)');
      return;
    }

    const sanitizedQuery = sanitizeInput(query);
    setIsLoading(true);
    
    try {
      await savePromptToDatabase(sanitizedQuery);

      console.log('=== Sending to n8n webhook ===');
      console.log('Prompt:', sanitizedQuery);
      console.log('Sales Agent ID:', profile.sales_agent_id);

      const requestBody = {
        message: sanitizedQuery,
        prompt: sanitizedQuery,
        sales_agent_id: profile.sales_agent_id,
        timestamp: new Date().toISOString(),
        source: 'sales_agent_chatbot'
      };

      const response = await fetch('https://shafil.app.n8n.cloud/webhook-test/recommend-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response OK:', response.ok);

      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
        console.log('Parsed JSON response:', parsedResponse);
      } catch (parseError) {
        console.log('Response is not JSON, treating as plain text:', responseText);
        parsedResponse = responseText;
      }

      let allProjects: ProjectWithSimilarity[] = [];
      let assistantContent = '';

      // Handle different response formats
      if (Array.isArray(parsedResponse) && parsedResponse.length > 0 && parsedResponse[0].source_id) {
        // Multiple responses - fetch and display as project cards
        allProjects = await fetchProjectsByIds(parsedResponse);
        if (allProjects.length > 0) {
          const projectsPerPage = 3;
          const totalPages = Math.ceil(allProjects.length / projectsPerPage);
          const currentPageProjects = allProjects.slice((page - 1) * projectsPerPage, page * projectsPerPage);

          setSearchState({ query: sanitizedQuery, allProjects, currentPage: page, totalPages });

          const assistantMessage: Message = {
            role: 'assistant',
            content: `Here are the top ${currentPageProjects.length} matches (Page ${page}/${totalPages}):`,
            timestamp: new Date(),
            searchResults: {
              query: sanitizedQuery,
              total: allProjects.length,
              currentPage: page,
              totalPages,
              projects: currentPageProjects,
            },
          };

          if (page === 1) {
            const userMessage: Message = {
              role: 'user',
              content: sanitizedQuery,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, userMessage, assistantMessage]);
          } else {
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = assistantMessage;
              return newMessages;
            });
          }
          return;
        } else {
          assistantContent = 'No matching projects found for your query.';
        }
      } else if (typeof parsedResponse === 'object' && parsedResponse.content) {
        // Single response - display content only
        assistantContent = parsedResponse.content;
      } else if (typeof parsedResponse === 'string') {
        // Plain text response
        assistantContent = parsedResponse;
      } else {
        assistantContent = 'I received your query but couldn\'t find relevant project matches.';
      }

      // For single responses or when no projects found
      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };
      const userMessage: Message = {
        role: 'user',
        content: sanitizedQuery,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage, assistantMessage]);

    } catch (error) {
      console.error('n8n webhook error:', error);
      toast.error('Error contacting EkarBot');
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date(),
      };
      const userMessage: Message = {
        role: 'user',
        content: sanitizedQuery,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePagination = (direction: 'prev' | 'next') => {
    if (!searchState) return;
    const newPage = direction === 'prev' ? searchState.currentPage - 1 : searchState.currentPage + 1;
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
        new_values: { project_title: project.project_title }
      });

      const { error } = await supabase.from('saved_projects').insert({
        sales_agent_id: profile.sales_agent_id,
        project_id: project.project_id
      });

      if (error) {
        console.error('Error saving project:', error);
        toast.error('Failed to save project');
        return;
      }

      toast.success(`Project "${project.project_title}" saved successfully!`);
    } catch (error) {
      toast.error('Failed to save project');
    }
  };

  return (
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto border rounded-lg bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-gray-50">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">Dubai Real Estate Assistant</h3>
          <p className="text-sm text-gray-500">AI-powered property search with relevance scoring</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
            )}
            
            <div className={`max-w-[80%] ${message.role === 'user' ? 'order-1' : ''}`}>
              <div className={`rounded-lg p-3 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white ml-auto' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm">{message.content}</p>
              </div>
              
              {message.searchResults && (
                <div className="mt-3 space-y-3">
                  {message.searchResults.projects.map((project, projectIndex) => (
                    <Card key={projectIndex} className="border border-gray-200 border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 text-sm">{project.project_title}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              {project.similarity_percentage}% match
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSaveProject(project)}
                              className="flex items-center space-x-1"
                            >
                              <Bookmark className="h-3 w-3" />
                              <span>Save</span>
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                          <p><span className="font-medium">Developer:</span> {project.developer_name}</p>
                          <p><span className="font-medium">Type:</span> {project.project_type}</p>
                          <p><span className="font-medium">Location:</span> {project.region_area}, {project.emirate}</p>
                          {project.starting_price_aed && (
                            <p><span className="font-medium">Starting Price:</span> AED {project.starting_price_aed.toLocaleString()}</p>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-700 mb-2 line-clamp-2">{project.description}</p>
                        
                        {project.content && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                            <p className="text-blue-800"><span className="font-medium">AI Analysis:</span> {project.content}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {message.searchResults.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePagination('prev')}
                        disabled={message.searchResults.currentPage === 1}
                        className="flex items-center gap-1"
                      >
                        <ChevronLeft className="h-3 w-3" />
                        Previous
                      </Button>
                      
                      <span className="text-xs text-gray-500">
                        Page {message.searchResults.currentPage} of {message.searchResults.totalPages}
                      </span>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePagination('next')}
                        disabled={message.searchResults.currentPage === message.searchResults.totalPages}
                        className="flex items-center gap-1"
                      >
                        Next
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
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
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            placeholder="Ask about properties, locations, prices, or amenities..."
            className="flex-1"
            disabled={isLoading}
            maxLength={1000}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="sm"
            className="px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Powered by AI • Secure & Rate Limited • Max 1000 characters
        </p>
      </div>
    </div>
  );
};

export default SalesAgentChatBot;
