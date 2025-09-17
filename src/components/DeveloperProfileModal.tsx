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
import { motion, AnimatePresence } from 'framer-motion';

interface DeveloperProfileModalProps {
  open: boolean;
  onClose: () => void;
}

const DeveloperProfileModal = ({ open, onClose }: DeveloperProfileModalProps) => {
  const { user, profile, refreshProfile } = useDeveloperAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
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

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

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

      const { data: { publicUrl } } = supabase.storage
        .from('developer-files')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('developers')
        .update({ profile_image_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw updateError;
      }

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
      const { error: updateError } = await supabase
        .from('developers')
        .update({ profile_image_url: null })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error removing profile image:', updateError);
        throw updateError;
      }

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
      <DialogContent className="max-w-lg p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              Profile Settings
            </motion.div>
          </DialogTitle>
        </DialogHeader>

        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Profile Image Section */}
          <div className="flex flex-col items-center space-y-4">
            <motion.div
              className="relative group"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Avatar className="h-28 w-28 border-4 border-white shadow-lg">
                <AvatarImage 
                  src={profile?.profile_image_url} 
                  alt={formData.developer_name || user?.username}
                  className="object-cover"
                />
                <AvatarFallback 
                  style={{ backgroundColor: '#455560' }} 
                  className="text-white text-2xl font-semibold"
                >
                  {getInitials(formData.developer_name || user?.username)}
                </AvatarFallback>
              </Avatar>
              <label 
                htmlFor="profile-image-upload" 
                className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border-2 border-gray-200 cursor-pointer hover:bg-gray-100 transition-all duration-300"
              >
                {uploading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full"
                  ></motion.div>
                ) : (
                  <Camera className="h-5 w-5 text-gray-600" />
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
            </motion.div>
            <AnimatePresence>
              {uploading && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-gray-500"
                >
                  Uploading image...
                </motion.p>
              )}
            </AnimatePresence>
            {profile?.profile_image_url && (
              <Button
                onClick={handleRemoveImage}
                variant="outline"
                size="sm"
                disabled={uploading}
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 transition-all duration-300"
              >
                Remove Image
              </Button>
            )}
          </div>

          {/* Form Fields in Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { id: 'developer_name', label: 'Developer Name', placeholder: 'Enter developer name' },
              { id: 'contact_person_name', label: 'Contact Person Name', placeholder: 'Enter contact person name' },
              { id: 'email_address', label: 'Email Address', type: 'email', placeholder: 'Enter email address' },
              { id: 'contact_number', label: 'Contact Number', placeholder: 'Enter contact number' },
              { id: 'office_address', label: 'Office Address', placeholder: 'Enter office address' },
            ].map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
                className={field.id === 'office_address' ? 'md:col-span-2' : ''}
              >
                <Label htmlFor={field.id} className="text-gray-700 font-medium">{field.label}</Label>
                <Input
                  id={field.id}
                  type={field.type || 'text'}
                  value={formData[field.id as keyof typeof formData]}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300"
                />
              </motion.div>
            ))}
          </div>

          {/* Action Buttons */}
         <motion.div
  className="flex gap-3 pt-6"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5 }}
>
  <Button
    onClick={handleSave}
    disabled={loading || uploading}
    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
  >
    {loading ? (
      <div className="flex items-center justify-center gap-2">
        <motion.div
          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
        <span>Saving...</span>
      </div>
    ) : (
      <>
        <Save className="h-4 w-4 mr-2" />
        <span>Save Changes</span>
      </>
    )}
  </Button>
</motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default DeveloperProfileModal;