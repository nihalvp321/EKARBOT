
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDeveloperAuth } from '@/hooks/useDeveloperAuth';
// Removed password change functionality for security

interface DeveloperProfileModalProps {
  open: boolean;
  onClose: () => void;
}

const DeveloperProfileModal = ({ open, onClose }: DeveloperProfileModalProps) => {
  const { user, profile, refreshProfile } = useDeveloperAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Removed password change state for security
  const [formData, setFormData] = useState({
    developer_name: '',
    contact_number: '',
    email_address: '',
    office_address: '',
    contact_person_name: '',
  });

  useEffect(() => {
    if (profile && open) {
      setFormData({
        developer_name: profile.developer_name || '',
        contact_number: profile.contact_number || '',
        email_address: profile.email_address || '',
        office_address: profile.office_address || '',
        contact_person_name: profile.contact_person_name || '',
      });
    }
  }, [profile, open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !profile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      console.log('Uploading file to developer-files bucket:', filePath);

      // Upload the file to the developer-files bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('developer-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('developer-files')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      // Update the developer profile with the new image URL
      const { error: updateError } = await supabase
        .from('developers')
        .update({ profile_image_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw updateError;
      }

      // Refresh the profile data
      await refreshProfile();
      toast.success('Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!user || !profile) return;

    setUploading(true);
    try {
      // Update the developer profile to remove the image URL
      const { error: updateError } = await supabase
        .from('developers')
        .update({ profile_image_url: null })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error removing profile image:', updateError);
        throw updateError;
      }

      // Refresh the profile data
      await refreshProfile();
      toast.success('Profile image removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('developers')
        .update(formData)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile');
        return;
      }

      await refreshProfile();
      toast.success('Profile updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'D';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Profile Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-gray-200">
                <AvatarImage 
                  src={profile?.profile_image_url} 
                  alt={formData.developer_name || user?.username}
                />
                <AvatarFallback 
                  style={{ backgroundColor: '#455560' }} 
                  className="text-white text-xl font-semibold"
                >
                  {getInitials(formData.developer_name || user?.username)}
                </AvatarFallback>
              </Avatar>
              <label 
                htmlFor="profile-image-upload" 
                className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border-2 border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="h-4 w-4 text-gray-600" />
                )}
              </label>
              <input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </div>
            {uploading && (
              <p className="text-sm text-gray-500">Uploading image...</p>
            )}
            {profile?.profile_image_url && (
              <Button
                onClick={handleRemoveImage}
                variant="outline"
                size="sm"
                disabled={uploading}
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                Remove Image
              </Button>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="developer_name">Developer Name</Label>
              <Input
                id="developer_name"
                value={formData.developer_name}
                onChange={(e) => handleInputChange('developer_name', e.target.value)}
                placeholder="Enter developer name"
              />
            </div>

            <div>
              <Label htmlFor="contact_person_name">Contact Person Name</Label>
              <Input
                id="contact_person_name"
                value={formData.contact_person_name}
                onChange={(e) => handleInputChange('contact_person_name', e.target.value)}
                placeholder="Enter contact person name"
              />
            </div>

            <div>
              <Label htmlFor="email_address">Email Address</Label>
              <Input
                id="email_address"
                type="email"
                value={formData.email_address}
                onChange={(e) => handleInputChange('email_address', e.target.value)}
                placeholder="Enter email address"
              />
            </div>

            <div>
              <Label htmlFor="contact_number">Contact Number</Label>
              <Input
                id="contact_number"
                value={formData.contact_number}
                onChange={(e) => handleInputChange('contact_number', e.target.value)}
                placeholder="Enter contact number"
              />
            </div>

            <div>
              <Label htmlFor="office_address">Office Address</Label>
              <Input
                id="office_address"
                value={formData.office_address}
                onChange={(e) => handleInputChange('office_address', e.target.value)}
                placeholder="Enter office address"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={loading || uploading}
              style={{ backgroundColor: '#455560' }}
              className="flex-1 text-white hover:opacity-90"
            >
              {loading ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            {/* Password change removed for security */}
            <Button
              onClick={onClose}
              variant="outline"
              disabled={loading || uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Password change modal removed for security */}
    </Dialog>
  );
};

export default DeveloperProfileModal;
