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
import { Calendar, Clock, User, Building, CheckCircle, Star, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';
import { useProjectDropdown } from './hooks/useProjectDropdown';

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
  const [isVisible, setIsVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const { profile } = useSalesAgentAuth();
  const { projects, loading: projectsLoading } = useProjectDropdown();

  useEffect(() => {
    setIsVisible(true);
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
      setSelectedProject(selectedProject);
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
    setSelectedProject(null);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className={`transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur opacity-75"></div>
                <div className="relative bg-gradient-to-r from-gray-600 to-gray-500 p-3 rounded-2xl shadow-xl">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">
                  Schedule Site Visit
                </h1>
                <p className="text-gray-600 mt-2">Book a property viewing for your clients</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className={`transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {/* Selected Project Preview */}
          {selectedProject && (
            <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500 animate-fade-in">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">Selected Project</p>
                    <p className="text-sm text-green-700">
                      {selectedProject.project_title} by {selectedProject.developer_name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
              <CardTitle className="text-2xl flex items-center gap-3 text-gray-800">
                <Building className="h-6 w-6 text-blue-600" />
                Visit Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Project Selection */}
                <div className={`space-y-3 transition-all duration-500 delay-500 transform ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
                  <Label htmlFor="projectSelect" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Select Project *
                  </Label>
                  <Select onValueChange={handleProjectSelect} disabled={projectsLoading}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-300 transition-colors duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                      <SelectValue placeholder={projectsLoading ? "Loading visits list..." : "Choose a project"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {savedProjectIds.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="text-green-600 font-semibold">⭐ Saved Projects</SelectLabel>
                          {projects
                            .filter(p => savedProjectIds.includes(p.project_id))
                            .map(project => (
                              <SelectItem 
                                key={`saved-${project.project_id}`} 
                                value={project.project_id}
                                className="hover:bg-green-50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  {project.project_title} - {project.developer_name}
                                </div>
                              </SelectItem>
                            ))}
                        </SelectGroup>
                      )}
                      <SelectGroup>
                        <SelectLabel className="text-gray-600 font-semibold">All Projects</SelectLabel>
                        {projects.map(project => (
                          <SelectItem 
                            key={project.project_id} 
                            value={project.project_id}
                            className="hover:bg-blue-50 transition-colors"
                          >
                            {project.project_title} - {project.developer_name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Auto-filled Project Details */}
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-700 delay-700 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
                  <div className="space-y-2">
                    <Label htmlFor="projectId" className="text-sm font-medium text-gray-700">
                      Project ID
                    </Label>
                    <Input
                      id="projectId"
                      name="projectId"
                      value={formData.projectId}
                      readOnly
                      placeholder="Auto-filled"
                      className="bg-gray-50 border-gray-200 text-gray-600 h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectTitle" className="text-sm font-medium text-gray-700">
                      Project Title
                    </Label>
                    <Input
                      id="projectTitle"
                      name="projectTitle"
                      value={formData.projectTitle}
                      readOnly
                      placeholder="Auto-filled"
                      className="bg-gray-50 border-gray-200 text-gray-600 h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="developerName" className="text-sm font-medium text-gray-700">
                      Developer Name
                    </Label>
                    <Input
                      id="developerName"
                      name="developerName"
                      value={formData.developerName}
                      readOnly
                      placeholder="Auto-filled"
                      className="bg-gray-50 border-gray-200 text-gray-600 h-11"
                    />
                  </div>
                </div>

                {/* Visit Details */}
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-700 delay-900 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                  <div className="space-y-2">
                    <Label htmlFor="buyerName" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-500" />
                      Buyer Name *
                    </Label>
                    <Input
                      id="buyerName"
                      name="buyerName"
                      value={formData.buyerName}
                      onChange={handleInputChange}
                      placeholder="Enter buyer's full name"
                      required
                      className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visitDate" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-500" />
                      Visit Date *
                    </Label>
                    <Input
                      id="visitDate"
                      name="visitDate"
                      type="date"
                      value={formData.visitDate}
                      onChange={handleInputChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="h-12 border-2 border-gray-200 hover:border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visitTime" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-500" />
                      Visit Time *
                    </Label>
                    <Input
                      id="visitTime"
                      name="visitTime"
                      type="time"
                      value={formData.visitTime}
                      onChange={handleInputChange}
                      required
                      className="h-12 border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Additional Notes */}
                <div className={`space-y-3 transition-all duration-700 delay-1100 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                  <Label htmlFor="notes" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    Additional Notes
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Special requirements, preferences, or any additional information..."
                    rows={4}
                    className="border-2 border-gray-200 hover:border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-300 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className={`flex justify-center pt-6 transition-all duration-700 delay-1300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                  <Button
                    type="submit"
                    disabled={loading || projectsLoading}
                    className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Scheduling Visit...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5" />
                        Schedule Visit
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalesAgentScheduleVisit;