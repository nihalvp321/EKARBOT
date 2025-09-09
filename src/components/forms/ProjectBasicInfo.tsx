
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useDropdownOptions } from '@/components/hooks/useDropdownOptions';

interface ProjectBasicInfoProps {
  formData: any;
  handleInputChange: (field: string, value: string | Date) => void;
}

const ProjectBasicInfo = ({ formData, handleInputChange }: ProjectBasicInfoProps) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const { options: projectTypeOptions } = useDropdownOptions('project_type');
  const { options: listingTypeOptions } = useDropdownOptions('listing_type');
  const { options: projectStatusOptions } = useDropdownOptions('project_status');

  // Debug dropdown options
  console.log('ProjectBasicInfo - Dropdown options:', {
    projectTypeOptions: projectTypeOptions.length,
    listingTypeOptions: listingTypeOptions.length,
    projectStatusOptions: projectStatusOptions.length,
    formData: {
      project_title: formData.project_title,
      project_type: formData.project_type,
      listing_type: formData.listing_type
    }
  });

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      handleInputChange('handover_date', date.toISOString().split('T')[0]);
      setIsDatePickerOpen(false);
    }
  };

  const getDateFromString = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    // Check if the date is valid
    if (isNaN(date.getTime())) return undefined;
    return date;
  };

  const formatDate = (dateString: string): string => {
    const date = getDateFromString(dateString);
    if (!date) return "Select handover date";
    try {
      return format(date, "PPP");
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Select handover date";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Project Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="project_title">Project Name *</Label>
            <Input
              id="project_title"
              value={formData.project_title || ''}
              onChange={(e) => handleInputChange('project_title', e.target.value)}
              placeholder="Marina Vista"
              required
            />
          </div>
          <div>
            <Label htmlFor="developer_name">Developer Name *</Label>
            <Input
              id="developer_name"
              value={formData.developer_name || ''}
              readOnly
              className="bg-gray-100 cursor-not-allowed"
              placeholder="Developer name"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Project Description</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="A luxury development with sea views..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="project_type">Project Type *</Label>
            <Select value={formData.project_type || ''} onValueChange={(value) => handleInputChange('project_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {projectTypeOptions.map((option) => (
                  <SelectItem key={option.id} value={option.value}>
                    {option.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="listing_type">Listing Type *</Label>
            <Select value={formData.listing_type || ''} onValueChange={(value) => handleInputChange('listing_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select listing type" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {listingTypeOptions.map((option) => (
                  <SelectItem key={option.id} value={option.value}>
                    {option.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="project_status">Completion Status *</Label>
            <Select value={formData.project_status || ''} onValueChange={(value) => handleInputChange('project_status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {projectStatusOptions.map((option) => (
                  <SelectItem key={option.id} value={option.value}>
                    {option.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="handover_date">Expected Handover Date</Label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.handover_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDate(formData.handover_date || '')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white" align="start">
                <Calendar
                  mode="single"
                  selected={getDateFromString(formData.handover_date)}
                  onSelect={handleDateSelect}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectBasicInfo;
