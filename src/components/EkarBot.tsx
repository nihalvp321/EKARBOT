import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, User, Building, MapPin, DollarSign, Eye, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDeveloperAuth } from '@/hooks/useDeveloperAuth';
import { toast } from 'sonner';
import ProjectDetailModal from '@/components/ProjectDetailModal';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  n8nResponse?: any;
}

interface Project {
  id: string;
  project_id: string;
  project_title: string;
  project_type: string;
  description: string;
  emirate: string;
  project_status: string;
  developer_name: string;
  starting_price_aed: number;
  total_units: number;
  handover_date: string;
  city: string;
  community: string;
  cover_image_url: string;
  source: string;
  similarity_percentage?: number;
  content?: string;
}

const EkarBot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm EkarBot, your AI assistant for property development queries. I can help you with information about your projects, market insights, development guidance, and project analytics. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [savedProjectIds, setSavedProjectIds] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const [n8nProjects, setN8nProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const { user, profile } = useDeveloperAuth();

  // Fetch user's projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user || !profile) return;

      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('developer_id', profile.id)
          .eq('is_active', true);

        if (error) {
          console.error('Error fetching projects:', error);
          return;
        }

        const transformedProjects = (data || []).map(project => ({
          id: project.id,
          project_id: project.project_id,
          project_title: project.project_title || '',
          project_type: project.project_type || '',
          description: project.description || '',
          emirate: project.emirate || '',
          project_status: project.project_status || '',
          developer_name: project.developer_name || '',
          starting_price_aed: project.starting_price_aed || 0,
          total_units: project.total_units || 0,
          handover_date: project.handover_date || '',
          city: project.city || '',
          community: project.community || '',
          cover_image_url: project.cover_image_url || '',
          source: project.source || 'app data'
        }));

        setProjects(transformedProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, [user, profile]);

  const fetchSavedProjects = async () => {
    if (!profile?.id) return;
    try {
      const { data } = await supabase
        .from('saved_projects')
        .select('project_id')
        .eq('sales_agent_id', profile.id);
      setSavedProjectIds(data?.map((d) => d.project_id) || []);
    } catch (error) {
      console.error('Error fetching saved projects:', error);
    }
  };

  const handleSaveToggle = async (projectId: string) => {
    if (!profile?.id) return;
    const alreadySaved = savedProjectIds.includes(projectId);
    
    try {
      if (alreadySaved) {
        const { error } = await supabase
          .from('saved_projects')
          .delete()
          .eq('sales_agent_id', profile.id)
          .eq('project_id', projectId);
        if (error) throw error;
        setSavedProjectIds(savedProjectIds.filter(id => id !== projectId));
        toast.info('Project unsaved');
      } else {
        const { error } = await supabase
          .from('saved_projects')
          .insert({
            sales_agent_id: profile.id,
            project_id: projectId
          });
        if (error) throw error;
        setSavedProjectIds([...savedProjectIds, projectId]);
        toast.success('Project saved!');
      }
    } catch (error) {
      toast.error('Failed to toggle save');
    }
  };

  const callN8nWebhook = async (promptText: string) => {
    setIsLoadingProjects(true);
    try {
      const response = await fetch('https://shafil.app.n8n.cloud/webhook-test/recommend-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          prompt: promptText,
          developer_id: profile?.id,
          timestamp: new Date().toISOString(),
          source: 'ekar_bot'
        })
      });

      const text = await response.text();
      let parsed;
      
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { type: 'single', content: text };
      }

      if (parsed.type === 'multiple' && parsed.projects?.length > 0) {
        const projectIds = parsed.projects.map((p: any) => p.source_id);
        const { data: projectsData } = await supabase
          .from('projects')
          .select('*')
          .in('project_id', projectIds)
          .eq('is_active', true);

        const enhancedProjects = (projectsData || []).map(project => {
          const match = parsed.projects.find((p: any) => p.source_id === project.project_id);
          return {
            ...project,
            similarity_percentage: match?.similarity_percentage || 0,
            content: match?.content || project.description
          };
        }).sort((a, b) => (b.similarity_percentage || 0) - (a.similarity_percentage || 0));

        setN8nProjects(enhancedProjects);
      }

      return parsed;
    } catch (error) {
      console.error('N8n webhook error:', error);
      throw error;
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const generateBotResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Enhanced project queries with more detailed information
    if (lowerMessage.includes('project') || lowerMessage.includes('development')) {
      if (projects.length === 0) {
        return "I see you don't have any active projects yet. Would you like guidance on starting your first property development project? I can help you with:\n\n• Project planning and feasibility studies\n• Market analysis and location selection\n• RERA approval processes\n• Development strategies and best practices\n• Financial planning and investment analysis";
      } else {
        const projectList = projects.map(p => 
          `• ${p.project_title} (${p.project_type})\n  Status: ${p.project_status}\n  Location: ${p.city}, ${p.emirate}\n  Units: ${p.total_units || 'TBD'}\n  Price: ${p.starting_price_aed ? `AED ${p.starting_price_aed.toLocaleString()}` : 'TBD'}`
        ).join('\n\n');
        return `You currently have ${projects.length} active project(s):\n\n${projectList}\n\nWould you like specific information about any of these projects, performance analytics, or help with development strategies?`;
      }
    }

    // Enhanced status queries with analytics
    if (lowerMessage.includes('status') && projects.length > 0) {
      const statusSummary = projects.reduce((acc, p) => {
        acc[p.project_status] = (acc[p.project_status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const statusText = Object.entries(statusSummary)
        .map(([status, count]) => `${count} ${status}`)
        .join(', ');
      
      const totalUnits = projects.reduce((sum, p) => sum + (p.total_units || 0), 0);
      const avgPrice = projects.filter(p => p.starting_price_aed > 0).reduce((sum, p) => sum + p.starting_price_aed, 0) / projects.filter(p => p.starting_price_aed > 0).length;
      
      return `Here's your portfolio summary:\n\n📊 Project Status: ${statusText}\n🏢 Total Units: ${totalUnits}\n💰 Average Starting Price: ${avgPrice ? `AED ${Math.round(avgPrice).toLocaleString()}` : 'Not available'}\n\nWould you like detailed analytics for any specific project or market insights for your locations?`;
    }

    if (lowerMessage.includes('market') || lowerMessage.includes('trend')) {
      const locations = [...new Set(projects.map(p => p.emirate).filter(Boolean))];
      const locationText = locations.length > 0 ? `\n\nBased on your project locations (${locations.join(', ')}), here are some targeted insights:` : '';
      
      return `Current UAE real estate market trends:\n\n• Dubai and Abu Dhabi continue strong growth in Q4 2024\n• Sustainable and smart building features drive 15-20% premium\n• Mixed-use developments showing highest ROI\n• Off-plan sales up 25% compared to last year\n• Areas like Dubai South, Al Reem Island, and Yas Island are emerging hotspots${locationText}\n\nWould you like specific market analysis for your project locations or competitor benchmarking?`;
    }

    if (lowerMessage.includes('rera') || lowerMessage.includes('approval') || lowerMessage.includes('regulation')) {
      return "RERA approvals and regulatory compliance:\n\n📋 Required Documents:\n• Land ownership documents\n• Architectural and engineering plans\n• NOCs from relevant authorities\n• Developer registration certificate\n• Financial guarantee\n\n⏱️ Timeline: 3-6 months typically\n💡 Pro Tips:\n• Engage RERA-approved consultants\n• Submit complete documentation\n• Monitor application status regularly\n• Prepare for site inspections\n\nDo you need help with any specific approval process or compliance requirements?";
    }

    if (lowerMessage.includes('finance') || lowerMessage.includes('investment') || lowerMessage.includes('roi')) {
      const totalInvestment = projects.filter(p => p.starting_price_aed > 0).reduce((sum, p) => sum + (p.starting_price_aed * (p.total_units || 1)), 0);
      
      return `Financial planning and investment insights:\n\n💰 Portfolio Value: ${totalInvestment ? `AED ${totalInvestment.toLocaleString()}` : 'Calculate based on your projects'}\n\n📈 Key Metrics to Track:\n• Construction cost per sq ft\n• Sales velocity (units/month)\n• Gross margin percentage\n• Customer acquisition cost\n• Time to market\n\n🎯 Optimization Strategies:\n• Phase development to manage cash flow\n• Early bird pricing to boost pre-sales\n• Value engineering without compromising quality\n• Strategic partnerships with investors\n\nWould you like help with financial modeling or investment analysis for any specific project?`;
    }

    if (lowerMessage.includes('construction') || lowerMessage.includes('building')) {
      return "Construction and development best practices:\n\n🏗️ Key Success Factors:\n• Detailed project scheduling and milestones\n• Quality contractor selection and management\n• Regular site inspections and progress monitoring\n• Material procurement optimization\n• Safety compliance and risk management\n\n📊 Technology Integration:\n• BIM (Building Information Modeling)\n• Project management software\n• IoT sensors for monitoring\n• Digital documentation systems\n\n🎯 Cost Control:\n• Value engineering reviews\n• Change order management\n• Bulk procurement strategies\n• Progress-based payments\n\nWhich aspect of construction management would you like to explore further?";
    }

    const responses = [
      "I'm here to help with your property development journey. I can assist with:\n\n🏢 Project Management\n📊 Market Analysis\n📋 RERA Compliance\n💰 Financial Planning\n🏗️ Construction Guidance\n📈 Performance Analytics\n\nWhat specific area would you like to explore?",
      
      "As your property development assistant, I can provide insights on:\n\n• Project portfolio analysis\n• Market trends and opportunities\n• Regulatory requirements and approvals\n• Investment strategies and ROI optimization\n• Construction best practices\n• Sales and marketing strategies\n\nHow can I help you today?",
      
      "I can help you optimize your property development business with:\n\n🎯 Strategic Planning\n📊 Data-Driven Insights\n🏗️ Operational Excellence\n💡 Innovation Opportunities\n📈 Growth Strategies\n🤝 Partnership Development\n\nWhat would you like to focus on?"
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setN8nProjects([]);

    try {
      const n8nResponse = await callN8nWebhook(userMessage.text);
      
      setTimeout(() => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: n8nResponse.type === 'single' ? n8nResponse.content : generateBotResponse(userMessage.text),
          sender: 'bot',
          timestamp: new Date(),
          n8nResponse: n8nResponse
        };
        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
      }, 1500);
    } catch (error) {
      setTimeout(() => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: generateBotResponse(userMessage.text),
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
      }, 1500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const visibleProjects = n8nProjects.slice(0, visibleCount);

  useEffect(() => {
    fetchSavedProjects();
  }, [profile]);

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#f8fafc' }}>
      <Card className="flex-1 flex flex-col shadow-lg border-0">
        <CardHeader className="border-b bg-white">
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white border-2 border-gray-200">
              <img 
                src="/lovable-uploads/7e28c900-197f-45d8-a236-1cbc40857bb4.png" 
                alt="EkarBot" 
                className="w-6 h-6 object-contain"
              />
            </div>
            <span className="text-xl font-semibold" style={{ color: '#455560' }}>EkarBot</span>
            <span className="text-sm text-gray-500 ml-auto">AI Property Development Assistant</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <div
                  className={`flex items-start gap-3 ${
                    message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === 'user'
                        ? 'text-white'
                        : 'bg-white border-2 border-gray-200'
                    }`}
                    style={message.sender === 'user' ? { backgroundColor: '#455560' } : {}}
                  >
                    {message.sender === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <img 
                        src="/lovable-uploads/7e28c900-197f-45d8-a236-1cbc40857bb4.png" 
                        alt="EkarBot" 
                        className="w-5 h-5 object-contain"
                      />
                    )}
                  </div>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'text-white ml-auto'
                        : 'bg-white border shadow-sm'
                    }`}
                    style={message.sender === 'user' ? { backgroundColor: '#455560' } : {}}
                  >
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === 'user'
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/lovable-uploads/7e28c900-197f-45d8-a236-1cbc40857bb4.png" 
                    alt="EkarBot" 
                    className="w-5 h-5 object-contain"
                  />
                </div>
                <div className="bg-white border shadow-sm px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Projects Animation */}
            {isLoadingProjects && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">Your projects are loading...</span>
              </div>
            )}

            {/* Project Cards Display */}
            {n8nProjects.length > 0 && !isLoadingProjects && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleProjects.map((project) => {
                    const isSaved = savedProjectIds.includes(project.project_id);
                    return (
                      <Card key={project.project_id} className="relative border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        {project.cover_image_url ? (
                          <img src={project.cover_image_url} alt={project.project_title} className="w-full h-40 object-cover" />
                        ) : (
                          <div className="w-full h-40 flex items-center justify-center bg-gray-200">
                            <Building className="h-8 w-8 text-gray-500" />
                          </div>
                        )}

                        <CardHeader className="p-3 pb-2">
                          <div className="flex justify-between items-start mb-2">
                            <CardTitle className="text-sm font-semibold line-clamp-2">{project.project_title}</CardTitle>
                            <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                              {project.source || 'app data'}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>{project.developer_name}</span>
                            <span className="text-gray-400">|</span>
                            <span>{project.project_type}</span>
                          </div>
                          {project.similarity_percentage && (
                            <Badge variant="outline" className="text-xs w-fit">
                              {project.similarity_percentage}% match
                            </Badge>
                          )}
                        </CardHeader>

                        <CardContent className="space-y-2 text-xs text-gray-700 px-3 pb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span>{project.city || project.emirate || 'Unknown'}</span>
                          </div>
                          {project.starting_price_aed && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-3 w-3" />
                              <span>AED {project.starting_price_aed.toLocaleString()}</span>
                            </div>
                          )}

                          <p className="text-xs text-gray-600 line-clamp-2">{project.content || project.description}</p>

                          <div className="flex gap-2 pt-2 items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedProject(project)}
                              className="border-neutral-400 text-neutral-700 text-xs h-7"
                            >
                              <Eye className="h-3 w-3 mr-1" /> View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSaveToggle(project.project_id)}
                              className="h-7 w-7 p-0"
                            >
                              {isSaved ? (
                                <BookmarkCheck className="h-4 w-4 text-pink-600" />
                              ) : (
                                <Bookmark className="h-4 w-4 text-pink-600" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {visibleCount < n8nProjects.length && (
                  <div className="text-center">
                    <Button onClick={() => setVisibleCount(prev => prev + 3)} variant="outline">
                      View More
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Input Area */}
          <div className="border-t bg-white p-4">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about projects, market trends, RERA approvals, analytics..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                style={{ backgroundColor: '#455560' }}
                className="text-white hover:opacity-90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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

export default EkarBot;
