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
  } = useSalesAgentMessageHandlers(selectedContact);

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
    <div className="h-screen w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b shadow-sm">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">
          Inbox - Connect with Developers & User Managers
        </h1>
        <p className="text-gray-600 text-sm">
          Communicate directly with project developers and user managers
        </p>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Contacts Panel */}
        <div className="w-full md:w-1/3 lg:w-1/4 border-r bg-white overflow-y-auto max-h-[50vh] md:max-h-full">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-lg text-gray-800 mb-2">
              Contacts ({contacts.length})
            </h2>
          </div>
          <ContactsList
            contacts={contacts}
            selectedContact={selectedContact}
            onSelectContact={setSelectedContact}
            loading={loading}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 min-w-0 flex flex-col bg-white h-[50vh] md:h-full">
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
            <div className="flex-1 flex items-center justify-center text-center text-gray-600 px-4">
              <div>
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700">Select a Contact</h3>
                <p className="text-sm mt-1">Choose someone to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesAgentInbox;
