import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Developer {
  id: string;
  developer_name: string;
  developer_id: string;
}

interface DeveloperNameDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

const DeveloperNameDropdown: React.FC<DeveloperNameDropdownProps> = ({ 
  value, 
  onValueChange,
  className = "" 
}) => {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const fetchDevelopers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('developers')
        .select('id, developer_name, developer_id')
        .eq('is_active', true)
        .order('developer_name');

      if (error) {
        console.error('Error fetching developers:', error);
        toast.error('Failed to fetch developers');
        return;
      }

      setDevelopers(data || []);
    } catch (error) {
      console.error('Error fetching developers:', error);
      toast.error('An error occurred while fetching developers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <Label htmlFor="developer_name">Developer Name *</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Loading developers..." : "Select developer"} />
        </SelectTrigger>
        <SelectContent className="bg-background border shadow-md z-50">
          {loading ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading developers...</div>
          ) : developers.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">No developers available</div>
          ) : (
            developers.map((developer) => (
              <SelectItem key={developer.id} value={developer.developer_name}>
                {developer.developer_name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {developers.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground mt-1">
          No developers found. Please add developers in Developer Settings first.
        </p>
      )}
    </div>
  );
};

export default DeveloperNameDropdown;