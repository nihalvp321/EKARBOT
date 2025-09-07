import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Save, Camera, Upload, X, Mail, Phone, Badge } from 'lucide-react';
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
  const [isVisible, setIsVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile && open) {
      setFormData({
        sales_agent_name: profile.sales_agent_name || '',
        contact_number: profile.contact_number || '',
        email_address: profile.email_address || ''
      });
      setProfileImage(profile.profile_image_url || null);
      setTimeout(() => setIsVisible(true), 100);
    } else {
      setIsVisible(false);
    }
  }, [profile, open]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith('image/')) return toast.error('Please select an image file');
    if (file.size > 5 * 1024 * 1024) return toast.error('Image size should be less than 5MB');

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('sales-agent-profiles')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('sales-agent-profiles').getPublicUrl(fileName);
      const imageUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from('sales_agents')
        .update({ profile_image_url: imageUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfileImage(imageUrl);
      await refreshProfile();
      toast.success('Profile image updated successfully');
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!profile) return;

    setUploading(true);
    try {
      const { error: updateError } = await supabase
        .from('sales_agents')
        .update({ profile_image_url: null })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfileImage(null);
      await refreshProfile();
      toast.success('Profile image removed successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove image');
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
        .update(formData)
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profile updated successfully');
      setOpen(false);
    } catch (error) {
      console.error(error);
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
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-xl shadow-xl p-4 border-0 bg-white overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 border-b border-gray-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg font-bold text-gray-800">
              <div className="p-2 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg shadow">
                <User className="h-4 w-4 text-white" />
              </div>
              Profile Settings
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-4 space-y-4">
          {/* Avatar Section */}
          <div className={`flex flex-col items-center space-y-3 transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
            <div className="relative group">
              <Avatar className="relative h-16 w-16 border-2 border-white shadow-md ring-2 ring-gray-100 transition-transform duration-300 group-hover:scale-105">
                <AvatarImage src={profileImage || profile?.profile_image_url || undefined} />
                <AvatarFallback className="bg-gray-500 text-white text-xl font-bold">
                  {getInitials(formData.sales_agent_name)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 p-0 bg-white border border-gray-200 shadow hover:shadow-lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="h-3 w-3 text-gray-600" />
                )}
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
            
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                <Badge className="h-3 w-3 text-gray-500" />
                <span className="font-semibold text-gray-700">{profile?.sales_agent_id}</span>
              </div>
              <p className="text-xs text-gray-500">Sales Agent ID</p>
            </div>
          </div>

          {/* Upload Instructions */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center space-y-2">
            <div className="inline-block p-1 bg-white rounded-md shadow-sm">
              <Upload className="h-4 w-4 text-gray-500" />
            </div>
            <p className="text-xs font-medium text-gray-700">Upload Profile Photo</p>
            <p className="text-[10px] text-gray-500">JPG, PNG, GIF up to 5MB</p>
            {(profileImage || profile?.profile_image_url) && (
              <Button
                onClick={handleRemoveImage}
                variant="outline"
                size="sm"
                disabled={uploading}
                className="text-red-500 hover:text-red-600 border-red-200 hover:border-red-300 hover:bg-red-50 text-[10px]"
              >
                <X className="h-3 w-3 mr-1" />
                Remove Image
              </Button>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <User className="h-3 w-3 text-gray-500" /> Full Name
              </Label>
              <Input
                id="name"
                value={formData.sales_agent_name}
                onChange={(e) => setFormData(prev => ({ ...prev, sales_agent_name: e.target.value }))}
                placeholder="Full Name"
                className="h-10 border-gray-200 rounded-lg text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <Mail className="h-3 w-3 text-gray-500" /> Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email_address}
                onChange={(e) => setFormData(prev => ({ ...prev, email_address: e.target.value }))}
                placeholder="Email Address"
                className="h-10 border-gray-200 rounded-lg text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="contact" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <Phone className="h-3 w-3 text-gray-500" /> Contact Number
              </Label>
              <Input
                id="contact"
                value={formData.contact_number}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_number: e.target.value }))}
                placeholder="Contact Number"
                className="h-10 border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleSave}
            disabled={loading || uploading}
            className="w-full h-10 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg text-sm"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
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
