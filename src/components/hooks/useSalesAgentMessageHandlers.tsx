
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';

interface Contact {
  id: string;
  username: string;
  user_type: string;
  email: string;
}

export const useSalesAgentMessageHandlers = (selectedContact: Contact | null, setMessages?: React.Dispatch<React.SetStateAction<any[]>>) => {
  const [uploading, setUploading] = useState(false);
  const { user } = useSalesAgentAuth();

  const handleSendMessage = async (messageText: string) => {
    if (!selectedContact || !user || !user.user_id || !messageText.trim()) return;

    const currentUserId = user.user_id;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: selectedContact.id,
          message_text: messageText.trim(),
          is_read: false
        })
        .select('*, sender:app_users!messages_sender_id_fkey(username, user_type)')
        .single();

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
        return;
      }

      // Immediately add to local messages for instant feedback
      if (setMessages && data) {
        setMessages(prev => [...prev, data]);
      }

      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleSendFiles = async (files: File[], caption?: string) => {
    if (!selectedContact || !user || !user.user_id || files.length === 0) return;

    const currentUserId = user.user_id;
    setUploading(true);

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `message-attachments/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('message-attachments')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data } = supabase.storage
          .from('message-attachments')
          .getPublicUrl(filePath);

        const messageText = caption || `Sent an attachment: ${file.name}`;

        const { data: messageData, error: messageError } = await supabase
          .from('messages')
          .insert({
            sender_id: currentUserId,
            receiver_id: selectedContact.id,
            message_text: messageText,
            attachment_url: data.publicUrl,
            attachment_type: file.type,
            attachment_name: file.name,
            attachment_size: file.size,
            is_read: false
          })
          .select('*, sender:app_users!messages_sender_id_fkey(username, user_type)')
          .single();

        if (messageError) {
          console.error('Error sending message with attachment:', messageError);
          toast.error(`Failed to send message with ${file.name}`);
        } else {
          // Immediately add to local messages for instant feedback
          if (setMessages && messageData) {
            setMessages(prev => [...prev, messageData]);
          }
          toast.success(`File ${file.name} sent successfully`);
        }
      }
    } catch (error) {
      console.error('Error in file upload process:', error);
      toast.error('Failed to send files');
    } finally {
      setUploading(false);
    }
  };

  const handleSendVoice = async (audioBlob: Blob) => {
    if (!selectedContact || !user || !user.user_id) return;

    const currentUserId = user.user_id;
    setUploading(true);

    try {
      const fileName = `voice-${Date.now()}.webm`;
      const filePath = `message-attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(filePath, audioBlob);

      if (uploadError) {
        console.error('Error uploading voice message:', uploadError);
        toast.error('Failed to upload voice message');
        return;
      }

      const { data } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(filePath);

      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: selectedContact.id,
          message_text: 'Sent a voice message',
          attachment_url: data.publicUrl,
          attachment_type: 'audio/webm',
          attachment_name: 'Voice Message',
          attachment_size: audioBlob.size,
          is_read: false
        })
        .select('*, sender:app_users!messages_sender_id_fkey(username, user_type)')
        .single();

      if (messageError) {
        console.error('Error sending voice message:', messageError);
        toast.error('Failed to send voice message');
      } else {
        // Immediately add to local messages for instant feedback
        if (setMessages && messageData) {
          setMessages(prev => [...prev, messageData]);
        }
        toast.success('Voice message sent successfully');
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
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
