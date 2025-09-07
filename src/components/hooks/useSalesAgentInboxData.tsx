
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';
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
  profile_image_url?: string;
}

export const useSalesAgentInboxData = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'developer' | 'user_manager'>('all');
  const { user } = useSalesAgentAuth();

  const fetchContacts = async () => {
    if (!user || !user.user_id) {
      setLoading(false);
      return;
    }

    const currentUserId = user.user_id;

    try {
      // Only fetch developers and user managers, exclude sales agents
      const { data, error } = await supabase
        .from('app_users')
        .select(`
          id, 
          username, 
          user_type, 
          email
        `)
        .in('user_type', ['developer', 'user_manager'])
        .eq('is_active', true);

      if (error) {
        console.error('Failed to fetch contacts:', error);
        toast.error('Failed to fetch contacts');
        return;
      }

      // Fetch unread counts and profile images for each contact
      const contactsWithUnread = await Promise.all(
        (data || []).map(async (contact: any) => {
          const { data: unreadData } = await supabase
            .from('messages')
            .select('id')
            .eq('sender_id', contact.id)
            .eq('receiver_id', currentUserId)
            .eq('is_read', false);

          // Get profile image URL based on user type
          let profile_image_url = null;
          if (contact.user_type === 'developer') {
            const { data: devData } = await supabase
              .from('developers')
              .select('profile_image_url')
              .eq('user_id', contact.id)
              .single();
            profile_image_url = devData?.profile_image_url;
          }

          return {
            id: contact.id,
            username: contact.username,
            user_type: contact.user_type,
            email: contact.email,
            unreadCount: unreadData?.length || 0,
            profile_image_url
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
    if (!user || !user.user_id) return;

    const currentUserId = user.user_id;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:app_users!messages_sender_id_fkey(username, user_type)
        `)
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${currentUserId})`)
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
        .eq('receiver_id', currentUserId);

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

  const getFilteredContacts = () => {
    if (filterType === 'all') {
      return contacts;
    }
    return contacts.filter(contact => contact.user_type === filterType);
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
    contacts: getFilteredContacts(),
    setContacts,
    messages,
    setMessages,
    selectedContact,
    setSelectedContact,
    loading,
    filterType,
    setFilterType,
    fetchContacts,
    fetchMessages
  };
};
