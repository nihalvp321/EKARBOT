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
import { Calendar, Clock, User, Building, CheckCircle, Star, MapPin, BookmarkX } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';
import { useProjectDropdown } from './hooks/useProjectDropdown';
import { AdvancedDatePicker } from '@/components/ui/advanaced-date-picker';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';

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

  const handleUnselectProject = () => {
    setSelectedProject(null);
    setFormData(prev => ({
      ...prev,
      projectId: '',
      projectTitle: '',
      developerName: ''
    }));
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
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="space-y-3 px-4 py-6">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col items-start gap-2 border-b border-slate-200 pb-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">
                Schedule Site Visit
              </h1>
              <Badge
                variant="secondary"
                className="rounded-full px-3 py-1 text-xs font-medium bg-slate-100 text-slate-700"
              >
                Book a property viewing
              </Badge>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Selected Project Preview */}
            {selectedProject && (
              <Card className="mb-4 sm:mb-6 border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500">
                <CardContent className="p-3 sm:p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800 text-sm sm:text-base">Selected Project</p>
                      <p className="text-xs sm:text-sm text-green-700">
                        {selectedProject.project_title || 'Unspecified'} by {selectedProject.developer_name || 'Unspecified'}
                      </p>
                    </div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleUnselectProject}
                      className="h-8 w-8 sm:h-9 sm:w-9 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full transition-all duration-200"
                      title="Unselect project"
                    >
                      <BookmarkX className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-lg sm:shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50 p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-2xl flex items-center gap-2 sm:gap-3 text-gray-800">
                  <Building className="h-5 w-5 sm:h-6 sm:w-6 text-[#455560]" />
                  Visit Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                  {/* Project Selection */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="space-y-2 sm:space-y-3"
                  >
                    <Label htmlFor="projectSelect" className="text-sm sm:text-base font-semibold text-gray-700 flex items-center gap-2">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 text-[#455560]" />
                      Select Project<span className='text-red-600'>*</span>
                    </Label>
                    <Select onValueChange={handleProjectSelect} disabled={projectsLoading}>
                      <SelectTrigger className="h-10 sm:h-12 border-2 border-gray-200 hover:border-blue-300 transition-colors duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-xs sm:text-sm">
                        <SelectValue placeholder={projectsLoading ? "Loading projects..." : "Choose a project"} />
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
                                  className="hover:bg-green-50 transition-colors text-xs sm:text-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    {project.project_title || 'Unspecified'} - {project.developer_name || 'Unspecified'}
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
                              className="hover:bg-blue-50 transition-colors text-xs sm:text-sm"
                            >
                              {project.project_title || 'Unspecified'} - {project.developer_name || 'Unspecified'}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  {/* Auto-filled Project Details */}
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="projectId" className="text-xs sm:text-sm font-medium text-gray-700">
                        Project ID
                      </Label>
                      <Input
                        id="projectId"
                        name="projectId"
                        value={formData.projectId || 'Unspecified'}
                        readOnly
                        placeholder="Auto-filled"
                        className="bg-gray-50 border-gray-200 text-gray-600 h-10 sm:h-11 text-xs sm:text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="projectTitle" className="text-xs sm:text-sm font-medium text-gray-700">
                        Project Title
                      </Label>
                      <Input
                        id="projectTitle"
                        name="projectTitle"
                        value={formData.projectTitle || 'Unspecified'}
                        readOnly
                        placeholder="Auto-filled"
                        className="bg-gray-50 border-gray-200 text-gray-600 h-10 sm:h-11 text-xs sm:text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="developerName" className="text-xs sm:text-sm font-medium text-gray-700">
                        Developer Name
                      </Label>
                      <Input
                        id="developerName"
                        name="developerName"
                        value={formData.developerName || 'Unspecified'}
                        readOnly
                        placeholder="Auto-filled"
                        className="bg-gray-50 border-gray-200 text-gray-600 h-10 sm:h-11 text-xs sm:text-sm"
                      />
                    </div>
                  </motion.div>

                  {/* Visit Details */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="buyerName" className="text-sm sm:text-base font-semibold text-gray-700 flex items-center gap-2">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-[#455560]" />
                        Buyer Name <span className='text-red-600'>*</span>
                      </Label>
                      <Input
                        id="buyerName"
                        name="buyerName"
                        value={formData.buyerName}
                        onChange={handleInputChange}
                        placeholder="Enter buyer's full name"
                        required
                        className="h-10 sm:h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 text-xs sm:text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="visitDate" className="text-sm sm:text-base font-semibold text-gray-700 flex items-center gap-2">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-[#455560]" />
                        Visit Date<span className='text-red-600'>*</span>
                      </Label>
                      <AdvancedDatePicker
                        value={formData.visitDate}
                        onChange={(date) => setFormData(prev => ({ ...prev, visitDate: date }))}
                        placeholder="Select visit date"
                        minDate={new Date().toISOString().split('T')[0]}
                        className="h-10 sm:h-12 text-xs sm:text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="visitTime" className="text-sm sm:text-base font-semibold text-gray-700 flex items-center gap-2">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-[#455560]" />
                        Visit Time<span className='text-red-600'>*</span>
                      </Label>
                      <Input
                        id="visitTime"
                        name="visitTime"
                        type="time"
                        value={formData.visitTime}
                        onChange={handleInputChange}
                        required
                        className="h-10 sm:h-12 border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 text-xs sm:text-sm"
                      />
                    </div>
                  </motion.div>

                  {/* Additional Notes */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1.1 }}
                    className="space-y-2 sm:space-y-3"
                  >
                    <Label htmlFor="notes" className="text-sm sm:text-base font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                      Additional Notes
                    </Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Special requirements, preferences, or any additional information..."
                      rows={3}
                      className="border-2 border-gray-200 hover:border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-300 resize-none text-xs sm:text-sm"
                    />
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 1.3 }}
  className="flex justify-center pt-4 sm:pt-6"
>
  <Button
    type="submit"
    disabled={loading || projectsLoading}
    className="px-8 sm:px-12 py-3 sm:py-4 text-sm sm:text-lg font-semibold bg-[#455560] hover:bg-[#3a464f] text-white shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl transform hover:scale-105 transition-all duration-300 rounded-lg sm:rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
  >
    {loading ? (
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        Scheduling Visit...
      </div>
    ) : (
      <div className="flex items-center gap-2 sm:gap-3">
        <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
        Schedule Visit
      </div>
    )}
  </Button>
</motion.div>

                </form>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SalesAgentScheduleVisit;