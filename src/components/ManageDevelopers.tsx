import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ManageDevelopersProps {
  onNavigateToList: () => void;
}

const ManageDevelopers = ({ onNavigateToList }: ManageDevelopersProps) => {
  const [formData, setFormData] = useState({
    developerId: '',
    developerName: '',
    contactPersonName: '',
    contactNumber: '',
    emailAddress: '',
    officeAddress: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const generateDeveloperId = async () => {
    try {
      // Get the highest existing developer ID
      const { data, error } = await supabase
        .from('developers')
        .select('developer_id')
        .order('developer_id', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching developer IDs:', error);
        return;
      }

      let nextId = 'Dev1001'; // Default starting ID
      
      if (data && data.length > 0) {
        const lastId = data[0].developer_id;
        // Extract number from ID like "Dev1001"
        const match = lastId.match(/Dev(\d+)/);
        if (match) {
          const number = parseInt(match[1]) + 1;
          nextId = `Dev${number}`;
        }
      }

      setFormData(prev => ({ ...prev, developerId: nextId }));
    } catch (error) {
      console.error('Error generating developer ID:', error);
    }
  };

  // Auto-generate developer ID when component mounts
  useEffect(() => {
    generateDeveloperId();
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
      console.log('Creating developer with data:', formData);

      // Create user account first
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .insert({
          username: formData.developerId,
          email: formData.emailAddress,
          password_hash: formData.password,
          user_type: 'developer'
        })
        .select()
        .single();

      console.log('User creation result:', userData, userError);

      if (userError) {
        console.error('User creation error:', userError);
        if (userError.code === '23505' && userError.message.includes('email')) {
          toast.error('Email address already exists. Please use a different email.');
        } else if (userError.code === '23505' && userError.message.includes('username')) {
          toast.error('Developer ID already exists. Please generate a new ID.');
        } else if (userError.code === '42501') {
          toast.error('Permission denied. Please ensure you are logged in as a user manager.');
        } else {
          toast.error('Failed to create user account: ' + userError.message);
        }
        setLoading(false);
        return;
      }

      // Create developer record
      const { data: devData, error: devError } = await supabase
        .from('developers')
        .insert({
          developer_id: formData.developerId,
          developer_name: formData.developerName,
          contact_person_name: formData.contactPersonName,
          contact_number: formData.contactNumber,
          email_address: formData.emailAddress,
          office_address: formData.officeAddress,
          user_id: userData.id
        })
        .select()
        .single();

      console.log('Developer creation result:', devData, devError);

      if (devError) {
        console.error('Developer creation error:', devError);
        // Clean up user account if developer creation fails
        await supabase.from('app_users').delete().eq('id', userData.id);
        toast.error('Failed to create developer record: ' + devError.message);
        setLoading(false);
        return;
      }

      setShowCredentials(true);
      toast.success('Developer added successfully!');
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred while adding developer');
    }

    setLoading(false);
  };

  const copyCredentials = () => {
    const credentials = `Developer ID: ${formData.developerId}\nPassword: ${formData.password}`;
    navigator.clipboard.writeText(credentials);
    toast.success('Credentials copied to clipboard!');
  };

  const resetForm = () => {
    setFormData({
      developerId: '',
      developerName: '',
      contactPersonName: '',
      contactNumber: '',
      emailAddress: '',
      officeAddress: '',
      password: ''
    });
    setShowCredentials(false);
    // Auto-generate new ID when resetting
    generateDeveloperId();
  };

  if (showCredentials) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center space-y-4">
          <h2 className="text-xl font-semibold text-green-600">Developer Added Successfully!</h2>
          <Alert>
            <AlertDescription>
              <strong>Login Credentials:</strong><br />
              Developer ID: {formData.developerId}<br />
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
          Add Developers
        </Button>
        <Button 
          onClick={onNavigateToList}
          variant="outline" 
          className="px-8 py-2 rounded-r-lg rounded-l-none border-l-0"
        >
          Developers List
        </Button>
      </div>

      <Card className="bg-white">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Developer ID</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.developerId}
                    placeholder="Dev1001"
                    className="h-10 bg-gray-50"
                    readOnly
                    required
                  />
                  <Button
                    type="button"
                    onClick={generateDeveloperId}
                    variant="outline"
                    className="px-3"
                  >
                    Auto
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Developer Name</label>
                <Input
                  value={formData.developerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, developerName: e.target.value }))}
                  className="h-10"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Contact Person Name</label>
                <Input
                  value={formData.contactPersonName}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPersonName: e.target.value }))}
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
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Office Address</label>
              <Textarea
                value={formData.officeAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, officeAddress: e.target.value }))}
                rows={4}
                className="resize-none"
              />
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
                {loading ? 'Adding...' : 'Add Developer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageDevelopers;
