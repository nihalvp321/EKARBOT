import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  SelectGroup, SelectLabel
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, Building } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';
import { useProjectDropdown } from './hooks/useProjectDropdown';
import { AdvancedDatePicker } from '@/components/ui/advanaced-date-picker';

interface FormData {
  projectId: string;
  projectTitle: string;
  developerName: string;
  buyerName: string;
  visitDate: string;
  visitTime: string;
  notes: string;
}

const SalesAgentScheduleVisit = () => {
  const [formData, setFormData] = useState<FormData>({
    projectId: '',
    projectTitle: '',
    developerName: '',
    buyerName: '',
    visitDate: '',
    visitTime: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [savedProjectIds, setSavedProjectIds] = useState<string[]>([]);
  const { profile } = useSalesAgentAuth();
  const { projects, loading: projectsLoading } = useProjectDropdown();

  useEffect(() => {
    const fetchSavedProjects = async () => {
      if (!profile?.sales_agent_id) return;
      const { data, error } = await supabase
        .from('saved_projects')
        .select('project_id')
        .eq('sales_agent_id', profile.sales_agent_id);

      if (error) {
        toast.error('Failed to fetch saved projects');
        return;
      }

      setSavedProjectIds(data?.map((d) => d.project_id) || []);
    };

    fetchSavedProjects();
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProjectSelect = (projectId: string) => {
    const selectedProject = projects.find(p => p.project_id === projectId);
    if (selectedProject) {
      setFormData(prev => ({
        ...prev,
        projectId: selectedProject.project_id,
        projectTitle: selectedProject.project_title || '',
        developerName: selectedProject.developer_name || ''
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      projectId: '',
      projectTitle: '',
      developerName: '',
      buyerName: '',
      visitDate: '',
      visitTime: '',
      notes: ''
    });
  };

  const validateForm = (): boolean => {
    if (!formData.projectId || !formData.buyerName || !formData.visitDate || !formData.visitTime) {
      toast.error('Please fill in all required fields');
      return false;
    }
    return true;
  };

  const submitVisit = async (): Promise<boolean> => {
    if (!profile) {
      toast.error('Profile not loaded');
      return false;
    }

    try {
      const { error } = await supabase
        .from('site_visits')
        .insert({
          project_id: formData.projectId,
          project_title: formData.projectTitle,
          developer_name: formData.developerName,
          buyer_name: formData.buyerName,
          sales_agent_id: profile.sales_agent_id,
          visit_date: formData.visitDate,
          visit_time: formData.visitTime,
          notes: formData.notes,
          status: 'scheduled'
        });

      if (error) {
        console.error('Error scheduling site visit:', error);
        toast.error('Failed to schedule site visit');
        return false;
      }

      toast.success('Site visit scheduled successfully!');
      return true;
    } catch (error) {
      console.error('Error scheduling site visit:', error);
      toast.error('Failed to schedule site visit');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const success = await submitVisit();

    if (success) {
      resetForm();
    }

    setLoading(false);
  };

  return (
    <div className="p-6 space-y-6" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: '#455560' }}>
          <Calendar className="h-8 w-8" />
          Schedule Site Visit
        </h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg border-0" style={{ backgroundColor: 'white' }}>
          <CardHeader className="border-b" style={{ borderColor: '#e2e8f0' }}>
            <CardTitle className="text-xl flex items-center gap-2" style={{ color: '#455560' }}>
              <Building className="h-5 w-5" />
              Site Visit Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="projectSelect" className="text-sm font-medium" style={{ color: '#455560' }}>
                    Select Project *
                  </Label>
                  <Select onValueChange={handleProjectSelect} disabled={projectsLoading}>
                    <SelectTrigger className="border-2" style={{ borderColor: '#e2e8f0' }}>
                      <SelectValue placeholder={projectsLoading ? "Loading projects..." : "Choose a project"} />
                    </SelectTrigger>
                    <SelectContent>
                      {savedProjectIds.length > 0 && (
                        <SelectGroup>
                          <SelectLabel>Saved Projects</SelectLabel>
                          {projects
                            .filter(p => savedProjectIds.includes(p.project_id))
                            .map(project => (
                              <SelectItem key={`saved-${project.project_id}`} value={project.project_id}>
                                {project.project_title} - {project.developer_name}
                              </SelectItem>
                            ))}
                        </SelectGroup>
                      )}
                      <SelectGroup>
                        <SelectLabel>All Projects</SelectLabel>
                        {projects
                          .filter(p => !savedProjectIds.includes(p.project_id))
                          .map(project => (
                            <SelectItem key={project.project_id} value={project.project_id}>
                              {project.project_title} - {project.developer_name}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectId" className="text-sm font-medium" style={{ color: '#455560' }}>
                    Project ID
                  </Label>
                  <Input
                    id="projectId"
                    name="projectId"
                    value={formData.projectId}
                    readOnly
                    placeholder="Will auto-fill when project is selected"
                    className="border-2 bg-gray-50"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectTitle" className="text-sm font-medium" style={{ color: '#455560' }}>
                    Project Title
                  </Label>
                  <Input
                    id="projectTitle"
                    name="projectTitle"
                    value={formData.projectTitle}
                    readOnly
                    placeholder="Will auto-fill when project is selected"
                    className="border-2 bg-gray-50"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="developerName" className="text-sm font-medium" style={{ color: '#455560' }}>
                    Developer Name
                  </Label>
                  <Input
                    id="developerName"
                    name="developerName"
                    value={formData.developerName}
                    readOnly
                    placeholder="Will auto-fill when project is selected"
                    className="border-2 bg-gray-50"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buyerName" className="text-sm font-medium" style={{ color: '#455560' }}>
                    Buyer Name *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="buyerName"
                      name="buyerName"
                      value={formData.buyerName}
                      onChange={handleInputChange}
                      placeholder="Enter buyer name"
                      required
                      className="pl-10 border-2"
                      style={{ borderColor: '#e2e8f0' }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visitDate" className="text-sm font-medium" style={{ color: '#455560' }}>
                    Visit Date *
                  </Label>
                  <AdvancedDatePicker
                    value={formData.visitDate}
                    onChange={(date) => setFormData(prev => ({ ...prev, visitDate: date }))}
                    placeholder="Select visit date"
                    minDate={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visitTime" className="text-sm font-medium" style={{ color: '#455560' }}>
                    Visit Time *
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="visitTime"
                      name="visitTime"
                      type="time"
                      value={formData.visitTime}
                      onChange={handleInputChange}
                      required
                      className="pl-10 border-2"
                      style={{ borderColor: '#e2e8f0' }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium" style={{ color: '#455560' }}>
                  Additional Notes
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Enter any additional notes or requirements"
                  rows={4}
                  className="border-2"
                  style={{ borderColor: '#e2e8f0' }}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={loading || projectsLoading}
                  className="px-8 py-2 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  style={{ backgroundColor: '#455560' }}
                >
                  {loading ? 'Scheduling...' : 'Schedule Visit'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesAgentScheduleVisit;
