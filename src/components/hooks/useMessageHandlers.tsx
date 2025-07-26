
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Contact {
  id: string;
  username: string;
  user_type: string;
  email: string;
  unreadCount?: number;
}

export const useMessageHandlers = (selectedContact: Contact | null) => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const uploadFile = async (file: File): Promise<string> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    console.log('Uploading file:', { fileName, filePath, fileSize: file.size, fileType: file.type });

    try {
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(filePath);

      console.log('File uploaded successfully:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || !selectedContact || !user) {
      console.log('Missing required data:', { messageText: messageText.trim(), selectedContact, user });
      return;
    }

    try {
      console.log('Sending message:', { sender: user.id, receiver: selectedContact.id, text: messageText });
      
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedContact.id,
          message_text: messageText.trim()
        });

      if (error) {
        console.error('Send message error:', error);
        throw error;
      }
      
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    }
  };

  const handleSendFiles = async (files: File[], caption?: string) => {
    if (!files.length || !selectedContact || !user) {
      console.log('Missing required data for file upload');
      return;
    }

    setUploading(true);
    let successCount = 0;
    
    try {
      console.log('Starting file upload process for', files.length, 'files');
      
      for (const file of files) {
        console.log('Processing file:', file.name, file.type, file.size);
        
        try {
          const fileUrl = await uploadFile(file);
          
          const { error } = await supabase
            .from('messages')
            .insert({
              sender_id: user.id,
              receiver_id: selectedContact.id,
              message_text: caption || '',
              attachment_url: fileUrl,
              attachment_type: file.type,
              attachment_name: file.name,
              attachment_size: file.size
            });

          if (error) {
            console.error('Insert message error:', error);
            throw error;
          }
          
          console.log('File message inserted successfully');
          successCount++;
        } catch (fileError) {
          console.error('Error processing file:', file.name, fileError);
          toast.error(`Failed to send ${file.name}`);
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} file(s) sent successfully!`);
      }
    } catch (error) {
      console.error('Send files error:', error);
      toast.error('Failed to send files');
    } finally {
      setUploading(false);
    }
  };

  const handleSendVoice = async (audioBlob: Blob) => {
    if (!selectedContact || !user) {
      console.log('Missing required data for voice upload');
      return;
    }

    if (audioBlob.size === 0) {
      console.log('Audio blob is empty, skipping upload');
      toast.error('No audio recorded');
      return;
    }

    setUploading(true);
    
    try {
      console.log('Starting voice upload process, blob size:', audioBlob.size);
      
      // Create file from blob with proper MIME type
      const file = new File([audioBlob], `voice-${Date.now()}.webm`, { 
        type: audioBlob.type || 'audio/webm' 
      });
      
      console.log('Created voice file:', { name: file.name, size: file.size, type: file.type });
      
      const fileUrl = await uploadFile(file);
      
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedContact.id,
          message_text: '🎤 Voice message',
          attachment_url: fileUrl,
          attachment_type: file.type,
          attachment_name: file.name,
          attachment_size: file.size
        });

      if (error) {
        console.error('Insert voice message error:', error);
        throw error;
      }
      
      console.log('Voice message sent successfully');
      toast.success('Voice message sent!');
    } catch (error) {
      console.error('Send voice error:', error);
      toast.error('Failed to send voice message');
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    handleSendMessage,
    handleSendFiles,
    handleSendVoice
  };
};
