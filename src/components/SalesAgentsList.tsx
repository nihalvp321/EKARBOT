
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

interface SalesAgent {
  id: string;
  sales_agent_id: string;
  sales_agent_name: string;
  contact_number: string;
  email_address: string;
  is_active: boolean;
  created_at: string;
}

interface SalesAgentsListProps {
  onNavigateToAdd: () => void;
}

const SalesAgentsList = ({ onNavigateToAdd }: SalesAgentsListProps) => {
  const [salesAgents, setSalesAgents] = useState<SalesAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesAgents();
  }, []);

  const fetchSalesAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to fetch sales agents');
        return;
      }

      setSalesAgents(data || []);
    } catch (error) {
      toast.error('An error occurred while fetching sales agents');
    } finally {
      setLoading(false);
    }
  };

  const toggleAgentStatus = async (id: string, currentStatus: boolean) => {
    try {
      // First get the sales agent to find the linked user_id
      const { data: agentData, error: fetchError } = await supabase
        .from('sales_agents')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError || !agentData?.user_id) {
        toast.error('Failed to find linked user account');
        return;
      }

      // Update both sales_agents and app_users tables
      const { error: agentError } = await supabase
        .from('sales_agents')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (agentError) {
        toast.error('Failed to update sales agent status');
        return;
      }

      // Update the app_users table as well
      const { error: userError } = await supabase
        .from('app_users')
        .update({ is_active: !currentStatus })
        .eq('id', agentData.user_id);

      if (userError) {
        toast.error('Failed to update user account status');
        return;
      }

      setSalesAgents(prev =>
        prev.map(agent =>
          agent.id === id ? { ...agent, is_active: !currentStatus } : agent
        )
      );

      toast.success(`Sales Agent ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error('An error occurred while updating sales agent status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading sales agents...</div>
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
          Add Sales Agent
        </Button>
        <Button className="bg-slate-600 hover:bg-slate-700 text-white px-8 py-2 rounded-r-lg rounded-l-none border-l-0">
          Sales Agent List
        </Button>
      </div>

      <Card className="bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Sales Agent ID</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Sales Agent Name</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {salesAgents.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-gray-500">
                      No sales agents found
                    </td>
                  </tr>
                ) : (
                  salesAgents.map((agent) => (
                    <tr key={agent.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{agent.sales_agent_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{agent.sales_agent_name}</td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() => toggleAgentStatus(agent.id, agent.is_active)}
                          variant="ghost"
                          size="sm"
                          className="p-2"
                        >
                          {agent.is_active ? (
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

export default SalesAgentsList;
