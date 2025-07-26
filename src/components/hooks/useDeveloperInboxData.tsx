
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDeveloperAuth } from '@/hooks/useDeveloperAuth';
import { toast } from 'sonner';

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

export const useDeveloperInboxData = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useDeveloperAuth();

  const fetchContacts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, username, user_type, email')
        .neq('user_type', 'developer')
        .eq('is_active', true);

      if (error) {
        console.error('Failed to fetch contacts:', error);
        toast.error('Failed to fetch contacts');
        return;
      }

      // Fetch unread counts for each contact
      const contactsWithUnread = await Promise.all(
        (data || []).map(async (contact) => {
          const { data: unreadData } = await supabase
            .from('messages')
            .select('id')
            .eq('sender_id', contact.id)
            .eq('receiver_id', user.id)
            .eq('is_read', false);

          return {
            ...contact,
            unreadCount: unreadData?.length || 0
          };
        })
      );

      setContacts(contactsWithUnread);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('An error occurred while fetching contacts');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (contactId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:app_users!messages_sender_id_fkey(username, user_type)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch messages:', error);
        toast.error('Failed to fetch messages');
        return;
      }

      setMessages(data || []);
      
      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', contactId)
        .eq('receiver_id', user.id);

      // Update unread count for this contact
      setContacts(prev => 
        prev.map(contact => 
          contact.id === contactId 
            ? { ...contact, unreadCount: 0 }
            : contact
        )
      );
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('An error occurred while fetching messages');
    }
  };

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  useEffect(() => {
    if (selectedContact && user) {
      fetchMessages(selectedContact.id);
    }
  }, [selectedContact, user]);

  return {
    contacts,
    setContacts,
    messages,
    setMessages,
    selectedContact,
    setSelectedContact,
    loading,
    fetchContacts,
    fetchMessages
  };
};
