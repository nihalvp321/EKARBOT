
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DropdownOption {
  id: string;
  code: string;
  value: string;
  category: string;
  display_order: number;
}

export const useDropdownOptions = (category: string) => {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOptions = async () => {
    if (!category) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dropdown_settings')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('display_order');

      if (error) {
        console.error('Error fetching dropdown options:', error);
        toast.error(`Failed to fetch ${category} options`);
        return;
      }

      setOptions(data || []);
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
      toast.error(`An error occurred while fetching ${category} options`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, [category]);

  return {
    options,
    loading,
    refetch: fetchOptions
  };
};
