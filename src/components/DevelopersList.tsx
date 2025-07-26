
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

interface Developer {
  id: string;
  developer_id: string;
  developer_name: string;
  contact_person_name: string;
  contact_number: string;
  email_address: string;
  office_address: string;
  is_active: boolean;
  created_at: string;
}

interface DevelopersListProps {
  onNavigateToAdd: () => void;
}

const DevelopersList = ({ onNavigateToAdd }: DevelopersListProps) => {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const fetchDevelopers = async () => {
    try {
      const { data, error } = await supabase
        .from('developers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to fetch developers');
        return;
      }

      setDevelopers(data || []);
    } catch (error) {
      toast.error('An error occurred while fetching developers');
    } finally {
      setLoading(false);
    }
  };

  const toggleDeveloperStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('developers')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) {
        toast.error('Failed to update developer status');
        return;
      }

      setDevelopers(prev =>
        prev.map(dev =>
          dev.id === id ? { ...dev, is_active: !currentStatus } : dev
        )
      );

      toast.success(`Developer ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error('An error occurred while updating developer status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading developers...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Tab Headers */}
      <div className="flex space-x-0 mb-6">
        <Button 
          onClick={onNavigateToAdd}
          variant="outline" 
          className="px-8 py-2 rounded-l-lg rounded-r-none"
        >
          Add Developers
        </Button>
        <Button className="bg-slate-600 hover:bg-slate-700 text-white px-8 py-2 rounded-r-lg rounded-l-none border-l-0">
          Developers List
        </Button>
      </div>

      <Card className="bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Developer ID</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Developer Name</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {developers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-gray-500">
                      No developers found
                    </td>
                  </tr>
                ) : (
                  developers.map((developer) => (
                    <tr key={developer.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{developer.developer_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{developer.developer_name}</td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() => toggleDeveloperStatus(developer.id, developer.is_active)}
                          variant="ghost"
                          size="sm"
                          className="p-2"
                        >
                          {developer.is_active ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevelopersList;
