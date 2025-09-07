
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';

interface Contact {
  id: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  is_read: boolean;
  created_at: string;
  attachment_url?: string;
  attachment_type?: string;
  attachment_name?: string;
  attachment_size?: number;
  sender?: {
    username: string;
    user_type: string;
  };
}

export const useSalesAgentRealtimeMessages = (
  selectedContact: Contact | null,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
) => {
  const { user } = useSalesAgentAuth();

  useEffect(() => {
    if (!selectedContact || !user || !user.user_id) return;

    const currentUserId = user.user_id;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${currentUserId}))`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          // Only add if not already in messages (prevent duplicates)
          setMessages(prev => {
            const messageExists = prev.some(msg => msg.id === newMessage.id);
            if (messageExists) return prev;
            
            // Add sender info if not present
            const messageWithSender = {
              ...newMessage,
              sender: newMessage.sender || { username: 'Unknown', user_type: 'unknown' }
            };
            
            return [...prev, messageWithSender];
          });

          // Mark as read if it's from the selected contact
          if (newMessage.sender_id === selectedContact.id) {
            setTimeout(() => {
              supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', newMessage.id);
            }, 0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedContact, user, setMessages]);
};
