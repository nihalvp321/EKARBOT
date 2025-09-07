import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ManageSalesAgentsProps {
  onNavigateToList: () => void;
}

const ManageSalesAgents = ({ onNavigateToList }: ManageSalesAgentsProps) => {
  const [formData, setFormData] = useState({
    salesAgentId: '',
    salesAgentName: '',
    contactNumber: '',
    emailAddress: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const generateSalesAgentId = async () => {
    try {
      // Get the highest existing sales agent ID
      const { data, error } = await supabase
        .from('sales_agents')
        .select('sales_agent_id')
        .order('sales_agent_id', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching sales agent IDs:', error);
        return;
      }

      let nextId = 'S101'; // Default starting ID
      
      if (data && data.length > 0) {
        const lastId = data[0].sales_agent_id;
        // Extract number from ID like "S101"
        const match = lastId.match(/S(\d+)/);
        if (match) {
          const number = parseInt(match[1]) + 1;
          nextId = `S${number}`;
        }
      }

      setFormData(prev => ({ ...prev, salesAgentId: nextId }));
    } catch (error) {
      console.error('Error generating sales agent ID:', error);
    }
  };

  // Auto-generate sales agent ID when component mounts
  useEffect(() => {
    generateSalesAgentId();
  }, []);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create user account
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .insert({
          username: formData.salesAgentId,
          email: formData.emailAddress,
          password_hash: formData.password,
          user_type: 'sales_agent'
        })
        .select()
        .single();

      if (userError) {
        console.error('User creation error:', userError);
        if (userError.code === '23505' && userError.message.includes('email')) {
          toast.error('Email address already exists. Please use a different email.');
        } else if (userError.code === '23505' && userError.message.includes('username')) {
          toast.error('Sales Agent ID already exists. Please generate a new ID.');
        } else if (userError.code === '42501') {
          toast.error('Permission denied. Please ensure you are logged in as a user manager.');
        } else {
          toast.error('Failed to create user account: ' + userError.message);
        }
        setLoading(false);
        return;
      }

      // Create sales agent record
      const { error: agentError } = await supabase
        .from('sales_agents')
        .insert({
          sales_agent_id: formData.salesAgentId,
          sales_agent_name: formData.salesAgentName,
          contact_number: formData.contactNumber,
          email_address: formData.emailAddress,
          user_id: userData.id
        });

      if (agentError) {
        console.error('Sales agent creation error:', agentError);
        // Clean up user account if sales agent creation fails
        await supabase.from('app_users').delete().eq('id', userData.id);
        toast.error('Failed to create sales agent record: ' + agentError.message);
        setLoading(false);
        return;
      }

      setShowCredentials(true);
      toast.success('Sales Agent added successfully!');
    } catch (error) {
      toast.error('An error occurred while adding sales agent');
    }

    setLoading(false);
  };

  const copyCredentials = () => {
    const credentials = `Sales Agent ID: ${formData.salesAgentId}\nPassword: ${formData.password}`;
    navigator.clipboard.writeText(credentials);
    toast.success('Credentials copied to clipboard!');
  };

  const resetForm = () => {
    setFormData({
      salesAgentId: '',
      salesAgentName: '',
      contactNumber: '',
      emailAddress: '',
      password: ''
    });
    setShowCredentials(false);
    // Auto-generate new ID when resetting
    generateSalesAgentId();
  };

  if (showCredentials) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center space-y-4">
          <h2 className="text-xl font-semibold text-green-600">Sales Agent Added Successfully!</h2>
          <Alert>
            <AlertDescription>
              <strong>Login Credentials:</strong><br />
              Sales Agent ID: {formData.salesAgentId}<br />
              Password: {formData.password}
            </AlertDescription>
          </Alert>
          <div className="flex space-x-2">
            <Button onClick={copyCredentials} className="flex-1 bg-slate-600 hover:bg-slate-700">
              Copy Credentials
            </Button>
            <Button onClick={resetForm} variant="outline" className="flex-1">
              Add Another
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tab Headers */}
      <div className="flex space-x-0 mb-6">
        <Button className="bg-slate-600 hover:bg-slate-700 text-white px-8 py-2 rounded-l-lg rounded-r-none">
          Add Sales Agent
        </Button>
        <Button 
          onClick={onNavigateToList}
          variant="outline" 
          className="px-8 py-2 rounded-r-lg rounded-l-none border-l-0"
        >
          Sales Agent List
        </Button>
      </div>

      <Card className="bg-white">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Sales Agent ID</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.salesAgentId}
                    placeholder="S101"
                    className="h-10 bg-gray-50"
                    readOnly
                    required
                  />
                  <Button
                    type="button"
                    onClick={generateSalesAgentId}
                    variant="outline"
                    className="px-3"
                  >
                    Auto
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Sales Agent Name</label>
                <Input
                  value={formData.salesAgentName}
                  onChange={(e) => setFormData(prev => ({ ...prev, salesAgentName: e.target.value }))}
                  className="h-10"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Contact Number</label>
                <Input
                  value={formData.contactNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                  className="h-10"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <Input
                  type="email"
                  value={formData.emailAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, emailAddress: e.target.value }))}
                  className="h-10"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                type="button" 
                onClick={generatePassword}
                className="bg-slate-600 hover:bg-slate-700 px-8"
              >
                Generate Password
              </Button>
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                className="bg-slate-600 hover:bg-slate-700 px-12"
                disabled={loading || !formData.password}
              >
                {loading ? 'Adding...' : 'Add Sales Agent'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageSalesAgents;
