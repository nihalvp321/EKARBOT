
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { toast } from 'sonner';

interface Contact {
  id: string;
  username: string;
  user_type: string;
  email: string;
  unreadCount?: number;
}

const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
  'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mpeg',
  'application/pdf',
  'text/plain'
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const useSecureMessageHandlers = (selectedContact: Contact | null) => {
  const [uploading, setUploading] = useState(false);
  const { user, session } = useSecureAuth();

  const validateFile = (file: File): boolean => {
    // Extract base MIME type for audio files with codecs
    const baseMimeType = file.type.split(';')[0];
    const isAllowed = ALLOWED_FILE_TYPES.includes(file.type) || ALLOWED_FILE_TYPES.includes(baseMimeType);
    
    if (!isAllowed) {
      console.error(`File type not allowed: ${file.type}, base type: ${baseMimeType}`);
      toast.error(`File type ${file.type} is not allowed`);
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size must be less than 50MB`);
      return false;
    }

    return true;
  };

  const sanitizeInput = (input: string): string => {
    return input.trim().substring(0, 5000);
  };

  const uploadFile = async (file: File): Promise<string> => {
    if (!user?.id) {
      console.error('Authentication required for file upload');
      throw new Error('User not authenticated');
    }

    if (!validateFile(file)) {
      throw new Error('File validation failed');
    }

    const fileExt = file.name.split('.').pop() || 'unknown';
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${sanitizedFileName}`;
    const filePath = `${user.id}/${fileName}`;

    console.log('Uploading file:', { 
      fileName, 
      filePath, 
      fileSize: file.size, 
      fileType: file.type,
      userId: user.id
    });

    try {
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
    if (!selectedContact || !user) {
      console.log('Missing required data for sending message:', {
        hasContact: !!selectedContact,
        hasUser: !!user
      });
      return;
    }

    const sanitizedText = sanitizeInput(messageText);
    if (!sanitizedText) {
      console.log('Empty message after sanitization');
      return;
    }

    try {
      console.log('Sending message:', { 
        sender: user.id, 
        receiver: selectedContact.id, 
        text: sanitizedText
      });
      
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedContact.id,
          message_text: sanitizedText
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
      console.log('Missing required data for file upload:', {
        filesCount: files.length,
        hasContact: !!selectedContact,
        hasUser: !!user
      });
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
          
          const sanitizedCaption = caption ? sanitizeInput(caption) : '';
          
          const { error } = await supabase
            .from('messages')
            .insert({
              sender_id: user.id,
              receiver_id: selectedContact.id,
              message_text: sanitizedCaption,
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
      console.log('Missing required data for voice upload:', {
        hasContact: !!selectedContact,
        hasUser: !!user
      });
      return;
    }

    if (audioBlob.size === 0) {
      console.log('Audio blob is empty, skipping upload');
      toast.error('No audio recorded');
      return;
    }

    if (audioBlob.size > MAX_FILE_SIZE) {
      toast.error('Voice message is too large');
      return;
    }

    setUploading(true);
    
    try {
      console.log('Starting voice upload process:', {
        blobSize: audioBlob.size,
        blobType: audioBlob.type,
        userId: user.id
      });
      
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
