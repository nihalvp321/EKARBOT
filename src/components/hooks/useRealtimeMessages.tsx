
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecureAuth } from '@/hooks/useSecureAuth';

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

interface Contact {
  id: string;
  username: string;
  user_type: string;
  email: string;
  unreadCount?: number;
}

export const useRealtimeMessages = (
  selectedContact: Contact | null,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
) => {
  const { user } = useSecureAuth();

  useEffect(() => {
    if (!selectedContact || !user) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${selectedContact.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${selectedContact.id}))`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          // Only add if not already in messages (prevent duplicates)
          setMessages(prev => {
            const messageExists = prev.some(msg => msg.id === newMessage.id);
            if (messageExists) return prev;
            return [...prev, newMessage];
          });
          
          // Mark as read if we're the receiver
          if (newMessage.receiver_id === user.id) {
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
