
import { useState } from 'react';
import ContactsList from './ContactsList';
import ChatArea from './ChatArea';
import { useUserManagerInboxData } from './hooks/useUserManagerInboxData';
import { useSecureMessageHandlers } from './hooks/useSecureMessageHandlers';
import { useUserManagerRealtimeMessages } from './hooks/useUserManagerRealtimeMessages';
import { useSecureAuth } from '@/hooks/useSecureAuth';

const UserManagerInbox = () => {
  const [newMessage, setNewMessage] = useState('');
  const { user } = useSecureAuth();
  
  const {
    contacts,
    messages,
    setMessages,
    selectedContact,
    setSelectedContact,
    loading
  } = useUserManagerInboxData();

  const {
    uploading,
    handleSendMessage,
    handleSendFiles,
    handleSendVoice
  } = useSecureMessageHandlers(selectedContact);

  useUserManagerRealtimeMessages(selectedContact, setMessages);

  const onSendMessage = async (messageText: string) => {
    await handleSendMessage(messageText);
    setNewMessage('');
  };

  return (
    <div className="h-[calc(100vh-120px)] w-full bg-gray-50">
      <div className="h-full max-w-full mx-auto">
        <div className="flex h-full">
          {/* Contacts List - Fixed width on desktop, full width on mobile */}
          <div className="w-full lg:w-80 lg:flex-shrink-0 lg:border-r border-gray-200">
            <ContactsList
              contacts={contacts}
              selectedContact={selectedContact}
              onSelectContact={setSelectedContact}
              loading={loading}
            />
          </div>
          
          {/* Chat Area - Takes remaining space */}
          <div className="hidden lg:flex lg:flex-1 lg:min-w-0">
            <ChatArea
              selectedContact={selectedContact}
              messages={messages}
              currentUserId={user?.id}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              onSendMessage={onSendMessage}
              onSendFiles={handleSendFiles}
              onSendVoice={handleSendVoice}
              uploading={uploading}
            />
          </div>
          
          {/* Mobile Chat Overlay */}
          {selectedContact && (
            <div className="fixed inset-0 z-50 bg-white lg:hidden">
              <ChatArea
                selectedContact={selectedContact}
                messages={messages}
                currentUserId={user?.id}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                onSendMessage={onSendMessage}
                onSendFiles={handleSendFiles}
                onSendVoice={handleSendVoice}
                uploading={uploading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagerInbox;
