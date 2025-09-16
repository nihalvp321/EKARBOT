import { useEffect, useState } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Bookmark, BookmarkCheck, MapPin, Building, DollarSign, Eye, Mic, MessageSquare, Bot, Zap, Sparkles, Send, X
} from 'lucide-react';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { supabase } from '@/integrations/supabase/client';
import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';
import { toast } from 'sonner';
import { sanitizeInput } from '@/utils/inputValidation';
import {
  logSecurityEvent, checkRateLimit
} from '@/utils/securityUtils';
import ProjectDetailModal from '@/components/ProjectDetailModal';

interface SalesAgentMainPageProps {
  projects: any[];
  setProjects: (projects: any[]) => void;
  n8nResponse: any;
  setN8nResponse: (response: any) => void;
}

// These types are correct as they were in your prompt
type PropertyListingMode = 'inhouse' | 'external';
type EkarBotMode = 'inhouse' | 'external';
type ChatMode = 'chatgpt' | 'hybrid' | 'property-listing' | 'ekarbot-ai';

const SalesAgentMainPage = ({
  projects,
  setProjects,
  n8nResponse,
  setN8nResponse
}: SalesAgentMainPageProps) => {
  const [chatPrompt, setChatPrompt] = useState('');
  const [lastPrompt, setLastPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [savedProjectIds, setSavedProjectIds] = useState<string[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string>('');
  
  // State variables for chat modes
  const [chatMode, setChatMode] = useState<ChatMode>('ekarbot-ai'); // Default to ekarbot-ai
  const [propertyListingMode, setPropertyListingMode] = useState<PropertyListingMode>('external'); // Default to external for property-listing
  const [ekarBotMode, setEkarBotMode] = useState<EkarBotMode>('inhouse'); // Default for ekarbot-ai

  const [showResponse, setShowResponse] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const { profile } = useSalesAgentAuth();

  // Status messages with color enhancements
  const statusMessages = [
    { text: "🔍 Processing your request...", color: "text-blue-600" },
    { text: "🏢 Searching ...", color: "text-indigo-600" },
    { text: "📊 Analyzing data...", color: "text-teal-600" },
    { text: "⚡ Almost there...", color: "text-orange-500" },
    { text: "✨ Finalizing results...", color: "text-pink-600" }
  ];

  // Progressive status message effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let currentIndex = 0;

    if (isSending) {
      setSendStatus(statusMessages[0].text);

      interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % statusMessages.length;
        setSendStatus(statusMessages[currentIndex].text);
      }, 2500);
    } else {
      setSendStatus(null);
    }

    return () => interval && clearInterval(interval);
  }, [isSending]);

  // Show response with animation
  useEffect(() => {
    if (n8nResponse && !isSending) {
      setShowResponse(false);
      setTimeout(() => {
        setShowResponse(true);
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 1500);
      }, 300);
    }
  }, [n8nResponse, isSending]);

  /** Get webhook URL based on chat mode and sub-modes */
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
      case 'chatgpt':
        return 'https://ekarbotproject.duckdns.org/webhook/chatgpt';
      case 'hybrid':
        return 'https://ekarbotproject.duckdns.org/webhook/hybrid';
      default:
        return '';
    }
  };
  /** Fetch projects from Supabase */
  const fetchProjects = async (filterIds: string[] = []) => {
    try {
      setLoadingProjects(true);
      let query = supabase.from('projects').select('*').eq('is_active', true);
      if (filterIds.length) query = query.in('project_id', filterIds);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setProjects(data || []);
    } catch {
      toast.error('Failed to fetch projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  /** Fetch saved project IDs */
  const fetchSavedProjects = async () => {
    if (!profile?.sales_agent_id) return;
    const { data } = await supabase
      .from('saved_projects')
      .select('project_id')
      .eq('sales_agent_id', profile.sales_agent_id);
    setSavedProjectIds(data?.map((d) => d.project_id) || []);
  };

  /** Toggle save/unsave */
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
        const { error } = await supabase
          .from('saved_projects')
          .delete()
          .eq('sales_agent_id', profile.sales_agent_id)
          .eq('project_id', projectId);
        if (error) throw error;
        setSavedProjectIds(savedProjectIds.filter((id) => id !== projectId));
        toast.info('Project unsaved', { icon: '📤', style: { background: '#f3f4f6' } });
      } else {
        const { error } = await supabase.from('saved_projects').insert({
          sales_agent_id: profile.sales_agent_id,
          project_id: projectId
        });
        if (error) throw error;
        setSavedProjectIds([...savedProjectIds, projectId]);
        toast.success('Project saved!', { icon: '💾', style: { background: '#dcfce7' } });
      }
    } catch {
      toast.error('Failed to toggle save');
    }
  };

  /** Chat submission */
  const handleChatSubmit = async (promptText?: string) => {
    const textToSubmit = promptText || chatPrompt;
    if (!textToSubmit.trim() || !profile?.sales_agent_id) return;
    if (textToSubmit.length > 1000) return toast.error('Message too long');

    const rateLimitKey = `chat_${profile.sales_agent_id}`;
    if (!checkRateLimit(rateLimitKey, 10, 60000)) return toast.error('Too many messages. Wait.');

    const sanitizedPrompt = sanitizeInput(textToSubmit);
    setIsSending(true);
    setLoadingProjects(true);
    setShowResponse(false);

    try {
      setLastPrompt(textToSubmit);

      await supabase.from('chat_prompts').insert({
        sales_agent_id: profile.sales_agent_id,
        prompt_text: sanitizedPrompt
      });

      const res = await fetch(getWebhookUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: sanitizedPrompt,
          prompt: sanitizedPrompt,
          sales_agent_id: profile.sales_agent_id,
          timestamp: new Date().toISOString(),
          source: 'sales_agent_main_page',
          mode: chatMode === 'property-listing' ? `property-listing-${propertyListingMode}` : chatMode === 'ekarbot-ai' ? `ekarbot-ai-${ekarBotMode}` : chatMode
        })
      });

      const text = await res.text();
      const parsed = text.startsWith('{') ? JSON.parse(text) : { type: 'single', content: text };
      setN8nResponse(parsed);

      if (parsed.type === 'multiple' && parsed.projects?.length) {
        const ids = parsed.projects.map((p: any) => p.project_id);
        await fetchProjects(ids);
      }

      if (!promptText) setChatPrompt('');
    } catch {
      toast.error('Error contacting EkarBot', { icon: '🤖', style: { background: '#fef2f2' } });
    } finally {
      setIsSending(false);
      setLoadingProjects(false);
    }
  };

  /** Voice input */
  const handleVoiceMessage = (text: string) => {
    setTranscribedText(text);
    setChatPrompt(text);
    handleChatSubmit(text);
  };

  /** Clear response */
  const clearResponse = () => {
    setN8nResponse(null);
    setShowResponse(false);
    setLastPrompt('');
    setTranscribedText('');
  };

  useEffect(() => {
    if (profile?.sales_agent_id) fetchSavedProjects();
  }, [profile]);

  /** Merge similarity + content */
  const sortedProjects = projects
    .map((p) => {
      const match = n8nResponse?.projects?.find((m: any) => m.project_id === p.project_id);
      const percentage = match?.similarity_percentage
        ? parseFloat(String(match.similarity_percentage).replace('%', ''))
        : 0;
      return { ...p, match: { similarity_percentage: percentage, content: match?.content || '' } };
    })
    .sort((a, b) => b.match.similarity_percentage - a.match.similarity_percentage);

  const visibleProjects = sortedProjects.slice(0, visibleCount);

  const handleChatModeChange = (mode: ChatMode) => {
    setChatMode(mode);
    if (mode === 'property-listing') {
      setPropertyListingMode('external'); // Default to external
    }
    if (mode === 'ekarbot-ai') {
      setEkarBotMode('inhouse'); // Default for ekarbot-ai
    }
  };

  const chatModeConfig = {
    'ekarbot-ai': {
      label: 'EkarBot AI',
      icon: MessageSquare,
      description: `Proprietary AI assistant (${ekarBotMode})`,
      gradient: 'from-gray-500 to-gray-600'
    },
    chatgpt: {
      label: 'ChatGPT',
      icon: Bot,
      description: 'OpenAI ChatGPT integration',
      gradient: 'from-gray-500 to-gray-600'
    },
    hybrid: {
      label: 'Hybrid Power',
      icon: Zap,
      description: 'Combined AI intelligence',
      gradient: 'from-gray-500 to-gray-600'
    },
    'property-listing': {
      label: 'Property Listing',
      icon: Building,
      description: `Fetch latest active listings (${propertyListingMode})`,
      gradient: 'from-gray-500 to-gray-600'
    }
  };

  // Fallback logo in case the primary logo fails to load
  const handleLogoError = () => {
    toast.error('Failed to load logo', { style: { background: '#fef2f2' } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="space-y-8 px-4 md:px-8 pb-10 pt-6">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <img
                src="/lovable-uploads/00baa288-f375-4798-aa52-0272029ed647.png"
                alt="EkarBot"
                className="h-12 w-auto animate-bounce"
                onError={handleLogoError}
                // Fallback to a default image or placeholder if the primary image fails
                onErrorCapture={(e) => {
                  e.currentTarget.src = '/placeholder-logo.png'; // Ensure you have a placeholder image in the public folder
                }}
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-500 via-gray-600 to-gray-700 bg-clip-text text-transparent">
                EkarBot Assistant
              </h1>
              <p className="text-gray-600">Your AI-powered real estate companion</p>
            </div>
          </div>
        </div>

        {/* Ask EkarBot Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm transform transition-all duration-300 hover:shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-gray-500 via-gray-600 to-gray-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-white/20 rounded-full">
                <Sparkles className="h-6 w-6" />
              </div>
              <span>Ask EkarBot Anything</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {/* Chat Mode Toggle */}
            <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Bot className="w-4 h-4" />
                Choose Your AI Mode:
              </p>
              <div className="flex flex-wrap gap-3">
                {(Object.keys(chatModeConfig) as ChatMode[]).map((mode) => {
                  const config = chatModeConfig[mode];
                  const Icon = config.icon;
                  const isActive = chatMode === mode;
                  return (
                    <Button
                      key={mode}
                      variant={isActive ? "default" : "outline"}
                      size="lg"
                      onClick={() => handleChatModeChange(mode)}
                      className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                        isActive 
                          ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg border-0 hover:shadow-xl` 
                          : 'hover:bg-blue-50 border-blue-200 hover:border-blue-300'
                      }`}
                      disabled={isSending}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{config.label}</span>
                    </Button>
                  );
                })}
              </div>
              {(chatMode === 'property-listing' || chatMode === 'ekarbot-ai') && (
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={chatMode === 'property-listing' ? (propertyListingMode === 'inhouse' ? 'default' : 'outline') : (chatMode === 'ekarbot-ai' ? (ekarBotMode === 'inhouse' ? 'default' : 'outline') : 'outline')}
                    size="sm"
                    onClick={() => {
                      if (chatMode === 'property-listing') setPropertyListingMode('inhouse');
                      else setEkarBotMode('inhouse');
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                      chatMode === 'property-listing' ? (propertyListingMode === 'inhouse'
                        ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg border-0 hover:shadow-xl'
                        : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300') : (chatMode === 'ekarbot-ai' ? (ekarBotMode === 'inhouse'
                        ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg border-0 hover:shadow-xl'
                        : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300') : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300')
                    }`}
                    disabled={isSending}
                  >
                    Inhouse
                  </Button>
                  <Button
                    variant={chatMode === 'property-listing' ? (propertyListingMode === 'external' ? 'default' : 'outline') : (chatMode === 'ekarbot-ai' ? (ekarBotMode === 'external' ? 'default' : 'outline') : 'outline')}
                    size="sm"
                    onClick={() => {
                      if (chatMode === 'property-listing') setPropertyListingMode('external');
                      else setEkarBotMode('external');
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                      chatMode === 'property-listing' ? (propertyListingMode === 'external'
                        ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg border-0 hover:shadow-xl'
                        : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300') : (chatMode === 'ekarbot-ai' ? (ekarBotMode === 'external'
                        ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg border-0 hover:shadow-xl'
                        : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300') : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300')
                    }`}
                    disabled={isSending}
                  >
                    External
                  </Button>
                </div>
              )}
              {/* Active Mode Info */}
              <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-medium text-gray-700">Active:</span> 
                  <span className="text-gray-600">{chatModeConfig[chatMode].description}</span>
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <Input
                  value={chatPrompt}
                  onChange={(e) => setChatPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isSending && handleChatSubmit()}
                  placeholder="Ask to ekarbot....."
                  className="flex-1 h-14 text-lg border-2 border-gray-200 focus:border-blue-400 rounded-xl transition-all duration-300"
                  disabled={isSending}
                />
                <Button 
                  onClick={() => handleChatSubmit()} 
                  disabled={!chatPrompt.trim() || isSending}
                  className="h-14 px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  {isSending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      <span className="font-semibold">Send</span>
                    </div>
                  )}
                </Button>
                <VoiceRecorder onVoiceMessage={handleVoiceMessage} disabled={isSending} />
              </div>

              {/* Status Message */}
              {sendStatus && (
                <div className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                      {sendStatus}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Voice Input */}
        {transcribedText && (
          <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-emerald-50 animate-slide-in-up">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-green-800">
                <div className="p-2 bg-green-200 rounded-full">
                  <Mic className="h-5 w-5" />
                </div>
                Voice Input Converted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
                <p className="text-green-900 font-medium">"{transcribedText}"</p>
              </div>
              <p className="text-sm text-green-600 mt-3 flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                Processed with {chatModeConfig[chatMode].label}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Response Cards */}
{n8nResponse?.type === "single" &&
  n8nResponse.content &&
  showResponse && (
    <Card className="shadow-2xl border-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 animate-slide-in-up">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between border-b border-indigo-100">
        <CardTitle className="text-xl font-bold flex items-center gap-3 text-indigo-900">
          <div className="p-2 bg-indigo-200 rounded-full shadow-md">
            <Bot className="h-6 w-6 text-indigo-700" />
          </div>
          EkarBot Answer
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearResponse}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      {/* Content */}
      <CardContent className="space-y-6 pt-4">
        {/* User Question */}
        {lastPrompt && (
          <div className="bg-gradient-to-r from-indigo-100 to-blue-100 p-4 rounded-xl border border-indigo-200 shadow-sm">
            <p className="font-semibold text-indigo-900 mb-2">
              Your Question:
            </p>
            <p className="text-gray-700 italic">“{lastPrompt}”</p>
          </div>
        )}

        {/* Bot Response */}
        <div
          className={`bg-white p-6 rounded-xl border border-indigo-200 shadow-md ${
            isTyping ? "animate-pulse" : "animate-fade-in"
          }`}
        >
          <div className="prose max-w-none text-gray-800 leading-relaxed text-lg">
            {n8nResponse.content
              .split(/\n|\. /) // split into chunks
              .filter(Boolean)
              .map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 mb-3 transition hover:translate-x-1"
                >
                  <div className="w-2 h-2 mt-2 rounded-full bg-indigo-400 flex-shrink-0" />
                  <span className="block">{point.trim()}</span>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )}


        {/* Multiple Project Suggestions */}
        {!loadingProjects &&
          n8nResponse?.type === 'multiple' &&
          n8nResponse.projects?.length > 0 &&
          showResponse && (
            <>
              <Card className="shadow-xl border-0 bg-gradient-to-r from-purple-50 to-pink-50 animate-slide-in-up">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-3 text-purple-800">
                    <div className="p-2 bg-purple-200 rounded-full">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    EkarBot Recommendations
                    <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                      {sortedProjects.length} matches
                    </Badge>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearResponse}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {lastPrompt && (
                    <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm mb-4">
                      <p className="font-semibold text-gray-700 mb-2">Your Search:</p>
                      <p className="text-gray-600 italic">"{lastPrompt}"</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
                {visibleProjects.map((project, index) => {
                  const isSaved = savedProjectIds.includes(project.project_id);
                  return (
                    <Card
                      key={project.project_id}
                      className="relative border-0 rounded-2xl overflow-hidden shadow-xl bg-white hover:shadow-2xl transform transition-all duration-500 hover:scale-105 animate-fade-in-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="absolute top-4 right-4 z-10">
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold px-3 py-1 rounded-full shadow-lg">
                          {project.match?.similarity_percentage || 0}% match
                        </Badge>
                      </div>

                      {project.cover_image_url ? (
                        <div className="relative overflow-hidden">
                          <img
                            src={project.cover_image_url}
                            alt={project.project_title}
                            className="w-full h-52 object-cover transition-transform duration-500 hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                      ) : (
                        <div className="w-full h-52 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <Building className="h-16 w-16 text-gray-400" />
                        </div>
                      )}

                      <CardHeader className="p-5 pb-3">
                        <CardTitle className="text-lg font-bold text-gray-800 line-clamp-2">
                          {project.project_title}
                        </CardTitle>
                        <p className="text-purple-600 font-semibold">{project.developer_name}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="text-xs px-3 py-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white capitalize rounded-full">
                            {project.source}
                          </Badge>
                          <Badge variant="outline" className="text-xs px-3 py-1 border-gray-300 text-gray-600 rounded-full">
                            {project.project_ztype}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 text-sm text-gray-700 px-5 pb-5">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4 text-red-500" />
                          <span className="font-medium">{project.city || 'Unknown Location'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span className="font-bold text-green-600">
                            AED {project.starting_price_aed?.toLocaleString() || 'Price on request'}
                          </span>
                        </div>

                        {project.match?.content && (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-blue-800 line-clamp-3">
                              {project.match.content}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-3 items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedProject(project)}
                            className="flex-1 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 rounded-xl transition-all duration-300"
                          >
                            <Eye className="h-4 w-4 mr-2" /> 
                            Details
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSaveToggle(project.project_id)}
                            className={`rounded-xl transition-all duration-300 transform hover:scale-110 ${
                              isSaved ? 'text-pink-600 bg-pink-50' : 'text-gray-400 hover:text-pink-600 hover:bg-pink-50'
                            }`}
                          >
                            {isSaved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                          </Button>
                        </div>

                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors duration-200 block"
                        >
                          View Original Listing ↗
                        </a>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {visibleCount < sortedProjects.length && (
                <div className="text-center mt-8 animate-fade-in">
                  <Button 
                    onClick={() => setVisibleCount((prev) => prev + 3)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Show More Properties ({sortedProjects.length - visibleCount} remaining)
                  </Button>
                </div>
              )}
            </>
          )}

        {/* Project Detail Modal */}
        {selectedProject && (
          <ProjectDetailModal
            open={!!selectedProject}
            onClose={() => setSelectedProject(null)}
            project={selectedProject}
          />
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-in-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-slide-in-up { animation: slide-in-up 0.8s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
};

export default SalesAgentMainPage;