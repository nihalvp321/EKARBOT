import { useState } from 'react';
import ContactsList from './ContactsList';
import ChatArea from './ChatArea';
import { useSalesAgentInboxData } from './hooks/useSalesAgentInboxData';
import { useSalesAgentMessageHandlers } from './hooks/useSalesAgentMessageHandlers';
import { useSalesAgentRealtimeMessages } from './hooks/useSalesAgentRealtimeMessages';
import { useSalesAgentAuth } from '@/hooks/useSalesAgentAuth';

const SalesAgentInbox = () => {
  const [newMessage, setNewMessage] = useState('');
  const { user } = useSalesAgentAuth();

  const {
    contacts,
    messages,
    setMessages,
    selectedContact,
    setSelectedContact,
    loading
  } = useSalesAgentInboxData();

  const {
    uploading,
    handleSendMessage,
    handleSendFiles,
    handleSendVoice
  } = useSalesAgentMessageHandlers(selectedContact, setMessages);

  useSalesAgentRealtimeMessages(selectedContact, setMessages);

  const onSendMessage = async (messageText: string) => {
    await handleSendMessage(messageText);
    setNewMessage('');
  };

  const onSendFiles = (files: File[], caption?: string) => {
    handleSendFiles(files, caption);
  };

  const currentUserId = user?.user_id;

  return (
    <div className="h-[calc(100vh-140px)] bg-gray-50">
      <div className="h-full flex">
        {/* Contacts Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Messages
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <ContactsList
              contacts={contacts}
              selectedContact={selectedContact}
              onSelectContact={setSelectedContact}
              loading={loading}
              filterOptions={['All', 'Developers', 'User Manager']}
            />
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <ChatArea
              selectedContact={selectedContact}
              messages={messages}
              currentUserId={currentUserId}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              onSendMessage={onSendMessage}
              onSendFiles={onSendFiles}
              onSendVoice={handleSendVoice}
              uploading={uploading}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
                <p className="text-gray-500">Choose someone from your contacts to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesAgentInbox;
