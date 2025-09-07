
import { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Users, ArrowLeft } from 'lucide-react';
import MessageAttachment from './MessageAttachment';
import WhatsAppMessageInput from './WhatsAppMessageInput';

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

interface ChatAreaProps {
  selectedContact: Contact | null;
  messages: Message[];
  currentUserId?: string;
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendMessage: (message: string) => void;
  onSendFiles: (files: File[], caption?: string) => void;
  onSendVoice: (audioBlob: Blob) => void;
  uploading: boolean;
}

const ChatArea = ({
  selectedContact,
  messages,
  currentUserId,
  newMessage,
  setNewMessage,
  onSendMessage,
  onSendFiles,
  onSendVoice,
  uploading
}: ChatAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-full bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {selectedContact ? (
        <>
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 bg-white shadow-sm flex-shrink-0">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="lg:hidden hover:bg-gray-100 rounded-full p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                {selectedContact.profile_image_url ? (
                  <img 
                    src={selectedContact.profile_image_url} 
                    alt={selectedContact.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">{selectedContact.username}</h3>
                <p className="text-sm text-gray-500 capitalize">
                  {selectedContact.user_type.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwnMessage = message.sender_id === currentUserId;
                const hasAttachment = message.attachment_url;
                const isVoiceMessage = message.attachment_type?.startsWith('audio/');
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`${
                        isOwnMessage
                          ? 'text-white rounded-2xl rounded-br-md shadow-lg'
                          : 'bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-md border border-gray-100'
                      } ${hasAttachment ? 'p-3' : 'px-4 py-3'} transition-all duration-200 hover:shadow-xl max-w-xs lg:max-w-md`}
                      style={isOwnMessage ? { backgroundColor: '#455560' } : {}}
                    >
                      {hasAttachment && (
                        <div className={`${message.message_text ? 'mb-3' : ''}`}>
                          <MessageAttachment
                            url={message.attachment_url}
                            type={message.attachment_type || ''}
                            name={message.attachment_name || 'File'}
                            size={message.attachment_size || 0}
                            isOwnMessage={isOwnMessage}
                          />
                        </div>
                      )}
                      {message.message_text && !isVoiceMessage && (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.message_text}
                        </p>
                      )}
                      <div className="flex items-center justify-end mt-2">
                        <p
                          className={`text-xs ${
                            isOwnMessage ? 'text-gray-300' : 'text-gray-500'
                          }`}
                        >
                          {new Date(message.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="flex-shrink-0 bg-white border-t border-gray-100">
            <WhatsAppMessageInput
              value={newMessage}
              onChange={setNewMessage}
              onSendMessage={onSendMessage}
              onSendFiles={onSendFiles}
              onSendVoice={onSendVoice}
              disabled={uploading}
            />
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center flex-1 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Users className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Welcome to Inbox</h3>
            <p className="text-gray-500">Select a contact to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatArea;
