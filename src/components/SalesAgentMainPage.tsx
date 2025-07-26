import { useEffect, useState } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Bookmark, BookmarkCheck, MapPin, Building, DollarSign, Eye, Loader2
} from 'lucide-react';
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

const SalesAgentMainPage = ({
  projects,
  setProjects,
  n8nResponse,
  setN8nResponse
}: SalesAgentMainPageProps) => {
  const [chatPrompt, setChatPrompt] = useState('');
  const [lastPrompt, setLastPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [savedProjectIds, setSavedProjectIds] = useState<string[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const { profile } = useSalesAgentAuth();

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
    if (!chatPrompt.trim() || !profile?.sales_agent_id) return;
    if (chatPrompt.length > 1000) return toast.error('Message too long');
    const rateLimitKey = `chat_${profile.sales_agent_id}`;
    if (!checkRateLimit(rateLimitKey, 10, 60000)) return toast.error('Too many messages. Wait.');

    const sanitizedPrompt = sanitizeInput(chatPrompt);
    setIsSending(true);
    setLoadingProjects(true);
    try {
      setLastPrompt(chatPrompt);

      await supabase.from('chat_prompts').insert({
        sales_agent_id: profile.sales_agent_id,
        prompt_text: sanitizedPrompt
      });

      const res = await fetch('https://shafil.app.n8n.cloud/webhook/recommend-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: sanitizedPrompt,
          prompt: sanitizedPrompt,
          sales_agent_id: profile.sales_agent_id,
          timestamp: new Date().toISOString(),
          source: 'sales_agent_main_page'
        })
      });

      const text = await res.text();
      const parsed = text.startsWith('{') ? JSON.parse(text) : { type: 'single', content: text };
      setN8nResponse(parsed);

      if (parsed.type === 'multiple' && parsed.projects?.length > 0) {
        const ids = parsed.projects.map((p: any) => p.source_id);
        await fetchProjects(ids);
      }

      setChatPrompt('');
    } catch {
      toast.error('Error contacting EkarBot');
    } finally {
      setIsSending(false);
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (profile?.sales_agent_id) {
      fetchSavedProjects();
    }
  }, [profile]);

  const sortedProjects = projects
    .map((p) => {
      const match = n8nResponse?.projects?.find((m: any) => m.source_id === p.project_id);
      const percentage = match?.similarity_percentage
        ? parseFloat(match.similarity_percentage.replace('%', ''))
        : 0;
      return { ...p, match: { ...match, similarity_percentage: percentage } };
    })
    .sort((a, b) => b.match.similarity_percentage - a.match.similarity_percentage);

  const visibleProjects = sortedProjects.slice(0, visibleCount);

  return (
    <div className="space-y-6 px-4 md:px-8 pb-10">
      {/* Ask EkarBot Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img src="/lovable-uploads/00baa288-f375-4798-aa52-0272029ed647.png" alt="EkarBot" className="h-6 w-auto" />
            <span>Ask EkarBot</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
              placeholder="Ask about properties, prices..."
              className="flex-1"
            />
            <Button onClick={handleChatSubmit} disabled={!chatPrompt.trim() || isSending}>
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Single Response */}
      {n8nResponse?.type === 'single' && n8nResponse.content && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">EkarBot Reply</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lastPrompt && (
              <div className="bg-gray-100 text-gray-700 p-3 rounded-md">
                <strong>Question:</strong> {lastPrompt}
              </div>
            )}
            <p className="text-sm text-gray-700 whitespace-pre-line break-words">{n8nResponse.content}</p>
          </CardContent>
        </Card>
      )}

      {/* Multiple Project Suggestions */}
      {!loadingProjects && n8nResponse?.type === 'multiple' && n8nResponse.projects?.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">EkarBot Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              {lastPrompt && (
                <div className="bg-gray-100 text-gray-700 p-3 rounded-md">
                  <strong>Question:</strong> {lastPrompt}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {visibleProjects.map((project) => {
              const isSaved = savedProjectIds.includes(project.project_id);
              return (
                <Card key={project.project_id} className="relative border rounded-xl overflow-hidden">
                  {project.cover_image_url ? (
                    <img src={project.cover_image_url} alt={project.project_title} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center bg-gray-200">
                      <Building className="h-10 w-10 text-gray-500" />
                    </div>
                  )}

                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-semibold">{project.project_title}</CardTitle>
                    <span>{project.developer_name}</span>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <Badge className="text-xs px-2 py-1 bg-gray-700 text-white capitalize">{project.source}</Badge>
                      <span className="text-gray-400">|</span>
                      <span>{project.project_type}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2 text-sm text-gray-700 px-4 pb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{project.city || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>AED {project.starting_price_aed?.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-600">{project.match?.content || 'No description available'}</p>
                    <p className="text-xs text-gray-400">Similarity: {project.match?.similarity_percentage || 0}%</p>

                    <div className="flex gap-2 pt-2 items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProject(project)}
                        className="border-neutral-400 text-neutral-700"
                      >
                        <Eye className="h-4 w-4 mr-1" /> View Details
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSaveToggle(project.project_id)}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="h-5 w-5 text-pink-600" />
                        ) : (
                          <Bookmark className="h-5 w-5 text-pink-600" />
                        )}
                      </Button>
                    </div>

                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 underline pt-1 block"
                    >
                      Full Details ↗
                    </a>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {visibleCount < sortedProjects.length && (
            <div className="text-center mt-6">
              <Button onClick={() => setVisibleCount((prev) => prev + 3)}>View More</Button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
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
