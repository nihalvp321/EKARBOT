import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AdvancedDatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  minDate?: string; // Minimum allowed date (YYYY-MM-DD format)
}

export const AdvancedDatePicker = ({ value, onChange, placeholder = "Select date", className, minDate }: AdvancedDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('');

  // Initialize dropdowns when opening with existing value
  React.useEffect(() => {
    if (value && isOpen) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedYear(date.getFullYear().toString());
        setSelectedMonth((date.getMonth() + 1).toString().padStart(2, '0'));
        setSelectedDay(date.getDate().toString().padStart(2, '0'));
      }
    } else if (isOpen && !value) {
      // Set current year as default
      setSelectedYear(new Date().getFullYear().toString());
      setSelectedMonth('');
      setSelectedDay('');
    }
  }, [value, isOpen]);

  // Generate years (current year to 15 years in the future for handover dates)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 16 }, (_, i) => currentYear + i);

  // Generate months
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Generate days based on selected month and year with date validation
  const getDaysInMonth = (year: string, month: string) => {
    if (!year || !month) return [];
    const daysCount = new Date(parseInt(year), parseInt(month), 0).getDate();
    const allDays = Array.from({ length: daysCount }, (_, i) => (i + 1).toString().padStart(2, '0'));
    
    // Filter out past dates if minDate is provided
    if (minDate) {
      const minDateObj = new Date(minDate);
      const selectedYear = parseInt(year);
      const selectedMonth = parseInt(month);
      
      return allDays.filter(day => {
        const currentDate = new Date(selectedYear, selectedMonth - 1, parseInt(day));
        return currentDate >= minDateObj;
      });
    }
    
    return allDays;
  };

  const days = getDaysInMonth(selectedYear, selectedMonth);

  const handleApply = () => {
    if (selectedYear && selectedMonth && selectedDay) {
      const dateString = `${selectedYear}-${selectedMonth}-${selectedDay}`;
      
      // Validate the date is not in the past if minDate is provided
      if (minDate) {
        const selectedDate = new Date(dateString);
        const minDateObj = new Date(minDate);
        if (selectedDate < minDateObj) {
          toast.error('Cannot select a date in the past');
          return;
        }
      }
      
      onChange(dateString);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setSelectedYear('');
    setSelectedMonth('');
    setSelectedDay('');
    setIsOpen(false);
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return placeholder;
    try {
      const date = new Date(dateString);
      return format(date, "PPP");
    } catch {
      return placeholder;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDisplayDate(value || '')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 bg-white" align="start">
        <div className="space-y-4">
          <div className="text-sm font-medium text-gray-700">Select Date</div>
          
          <div className="grid grid-cols-3 gap-2">
            {/* Year Selection */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-[200] max-h-48">
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()} className="bg-white hover:bg-gray-100">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Selection */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-[200] max-h-48">
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value} className="bg-white hover:bg-gray-100">
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Day Selection */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Day</label>
              <Select value={selectedDay} onValueChange={setSelectedDay} disabled={!selectedYear || !selectedMonth}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-[200] max-h-48">
                  {days.map(day => (
                    <SelectItem key={day} value={day} className="bg-white hover:bg-gray-100">
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              size="sm" 
              onClick={handleApply}
              disabled={!selectedYear || !selectedMonth || !selectedDay}
              className="flex-1"
            >
              Apply
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleClear}
              className="flex-1"
            >
              Clear
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
export default AdvancedDatePicker;