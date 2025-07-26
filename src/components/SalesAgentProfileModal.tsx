import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Save, Camera, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';

interface ProfileModalProps {
  children: React.ReactNode;
}

const SalesAgentProfileModal = ({ children }: ProfileModalProps) => {
  const { user: profile, refreshProfile } = useSalesAgentAuth();
  const [formData, setFormData] = useState({
    sales_agent_name: '',
    contact_number: '',
    email_address: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile && open) {
      setFormData({
        sales_agent_name: profile.sales_agent_name || '',
        contact_number: profile.contact_number || '',
        email_address: profile.email_address || ''
      });
      setProfileImage(profile.profile_image_url || null);
    }
  }, [profile, open]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;

      console.log('Uploading file to sales-agent-profiles bucket:', fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('sales-agent-profiles')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload image: ' + uploadError.message);
        return;
      }

      console.log('Upload successful:', uploadData);

      const { data } = supabase.storage
        .from('sales-agent-profiles')
        .getPublicUrl(fileName);

      const imageUrl = data.publicUrl;
      console.log('Image URL:', imageUrl);

      const { error: updateError } = await supabase
        .from('sales_agents')
        .update({ profile_image_url: imageUrl })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Update error:', updateError);
        toast.error('Failed to update profile image: ' + updateError.message);
        return;
      }

      setProfileImage(imageUrl);
      await refreshProfile();
      toast.success('Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('sales_agents')
        .update({
          sales_agent_name: formData.sales_agent_name,
          contact_number: formData.contact_number,
          email_address: formData.email_address
        })
        .eq('id', profile.id);

      if (error) {
        console.error('Update error:', error);
        toast.error('Failed to update profile: ' + error.message);
        return;
      }

      await refreshProfile();
      toast.success('Profile updated successfully');
      setOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Avatar Section with Upload */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-gray-200">
                <AvatarImage src={profileImage || profile?.profile_image_url || undefined} />
                <AvatarFallback className="bg-slate-600 text-white text-xl font-semibold">
                  {getInitials(formData.sales_agent_name)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-900">{profile?.sales_agent_id}</p>
              <p className="text-sm text-gray-500">Sales Agent ID</p>
            </div>
          </div>

          {/* Upload Instructions */}
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Upload className="h-5 w-5 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">Click the camera icon to upload a profile image</p>
            <p className="text-xs text-gray-500 mt-1">Supported formats: JPG, PNG, GIF (Max 5MB)</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.sales_agent_name}
                onChange={(e) => setFormData(prev => ({ ...prev, sales_agent_name: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email_address}
                onChange={(e) => setFormData(prev => ({ ...prev, email_address: e.target.value }))}
                placeholder="Enter your email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number</Label>
              <Input
                id="contact"
                value={formData.contact_number}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_number: e.target.value }))}
                placeholder="Enter your contact number"
              />
            </div>
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSave}
            disabled={loading || uploading}
            className="w-full bg-slate-600 hover:bg-slate-700"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SalesAgentProfileModal;
