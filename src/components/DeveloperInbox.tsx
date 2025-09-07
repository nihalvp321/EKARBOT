import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  Search, 
  User, 
  Shield, 
  CheckCircle2,
  Paperclip,
  Mic,
  MicOff,
  Image,
  FileText
} from 'lucide-react';
import { useDeveloperInboxData } from './hooks/useDeveloperInboxData';
import { useDeveloperRealtimeMessages } from './hooks/useDeveloperRealtimeMessages';
import { supabase } from '@/integrations/supabase/client';
import { useDeveloperAuth } from '@/hooks/useDeveloperAuth';
import { toast } from 'sonner';

const DeveloperInbox = () => {
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const { user } = useDeveloperAuth();
  
  const {
    contacts,
    messages,
    setMessages,
    selectedContact,
    setSelectedContact,
    loading
  } = useDeveloperInboxData();

  // Set up real-time message updates
  useDeveloperRealtimeMessages(selectedContact, setMessages);

  const filteredContacts = contacts.filter(contact =>
    contact.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getContactIcon = (type: string) => {
    return type === 'user_manager' ? Shield : User;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedContact.id,
          message_text: newMessage,
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
      if (data) {
        setMessages(prev => [...prev, data]);
      }

      setNewMessage('');
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('An error occurred while sending the message');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedContact || !user) return;

    setUploading(true);
    try {
      // Upload file to Supabase storage
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('developer-files')
        .upload(`messages/${fileName}`, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload file');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('developer-files')
        .getPublicUrl(`messages/${fileName}`);

      // Send message with attachment
      const { data: messageData, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedContact.id,
          message_text: `Shared a file: ${file.name}`,
          attachment_url: publicUrl,
          attachment_type: file.type,
          attachment_name: file.name,
          attachment_size: file.size,
          is_read: false
        })
        .select('*, sender:app_users!messages_sender_id_fkey(username, user_type)')
        .single();

      if (error) {
        console.error('Error sending message with attachment:', error);
        toast.error('Failed to send message with attachment');
        return;
      }

      // Immediately add to local messages for instant feedback
      if (messageData) {
        setMessages(prev => [...prev, messageData]);
      }

      toast.success('File uploaded and message sent successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('An error occurred while uploading the file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/wav' });
        await uploadVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadVoiceMessage = async (audioBlob: Blob) => {
    if (!selectedContact || !user) return;

    setUploading(true);
    try {
      const fileName = `voice-${Date.now()}.wav`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('developer-files')
        .upload(`voice-messages/${fileName}`, audioBlob);

      if (uploadError) {
        console.error('Voice upload error:', uploadError);
        toast.error('Failed to upload voice message');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('developer-files')
        .getPublicUrl(`voice-messages/${fileName}`);

      // Send message with voice attachment
      const { data: voiceMessageData, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedContact.id,
          message_text: 'Sent a voice message',
          attachment_url: publicUrl,
          attachment_type: 'audio/wav',
          attachment_name: fileName,
          attachment_size: audioBlob.size,
          is_read: false
        })
        .select('*, sender:app_users!messages_sender_id_fkey(username, user_type)')
        .single();

      if (error) {
        console.error('Error sending voice message:', error);
        toast.error('Failed to send voice message');
        return;
      }

      // Immediately add to local messages for instant feedback
      if (voiceMessageData) {
        setMessages(prev => [...prev, voiceMessageData]);
      }

      toast.success('Voice message sent successfully');
    } catch (error) {
      console.error('Error uploading voice message:', error);
      toast.error('An error occurred while uploading the voice message');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-140px)] bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] bg-gray-50">
      <div className="h-full flex">
        {/* Contacts Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              Messages
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No contacts found
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const ContactIcon = getContactIcon(contact.user_type);
                return (
                  <div
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedContact?.id === contact.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {contact.profile_image_url ? (
                            <img 
                              src={contact.profile_image_url} 
                              alt={contact.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ContactIcon className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 truncate">{contact.username}</h4>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              contact.user_type === 'user_manager' 
                                ? 'border-blue-200 text-blue-700' 
                                : 'border-green-200 text-green-700'
                            }`}
                          >
                            {contact.user_type === 'user_manager' ? 'Manager' : 'Sales Agent'}
                          </Badge>
                          {contact.unreadCount && contact.unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white text-xs">
                              {contact.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {selectedContact.profile_image_url ? (
                        <img 
                          src={selectedContact.profile_image_url} 
                          alt={selectedContact.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (() => {
                          const ContactIcon = getContactIcon(selectedContact.user_type);
                          return <ContactIcon className="h-5 w-5 text-gray-600" />;
                        })()
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedContact.username}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedContact.user_type === 'user_manager' ? 'User Manager' : 'Sales Agent'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No messages yet. Start a conversation!
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === user?.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border shadow-sm'
                        }`}
                      >
                        {message.attachment_url ? (
                          <div className="space-y-2">
                            {message.attachment_type?.startsWith('image/') ? (
                              <img 
                                src={message.attachment_url} 
                                alt={message.attachment_name}
                                className="max-w-full h-auto rounded"
                              />
                            ) : message.attachment_type?.startsWith('audio/') ? (
                              <audio controls className="w-full">
                                <source src={message.attachment_url} type={message.attachment_type} />
                                Your browser does not support the audio element.
                              </audio>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4" />
                                <a 
                                  href={message.attachment_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="underline"
                                >
                                  {message.attachment_name}
                                </a>
                              </div>
                            )}
                            <p className="text-sm">{message.message_text}</p>
                          </div>
                        ) : (
                          <p className="text-sm">{message.message_text}</p>
                        )}
                        <div className={`flex items-center justify-between mt-1 ${
                          message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">{formatTime(message.created_at)}</span>
                          {message.sender_id === user?.id && (
                            <CheckCircle2 className={`h-3 w-3 ml-2 ${
                              message.is_read ? 'text-blue-200' : 'text-blue-300'
                            }`} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx,.txt"
                  />
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    variant="outline"
                    size="sm"
                    style={{ borderColor: '#455560', color: '#455560' }}
                    className="hover:bg-gray-50"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={uploading}
                    variant="outline"
                    size="sm"
                    style={{ borderColor: '#455560', color: isRecording ? '#ef4444' : '#455560' }}
                    className={`hover:bg-gray-50 ${isRecording ? 'animate-pulse' : ''}`}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>

                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                    disabled={uploading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || uploading}
                    style={{ backgroundColor: '#455560' }}
                    className="text-white hover:opacity-90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {uploading && (
                  <div className="text-sm text-gray-500 mt-2">
                    Uploading...
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
                <p className="text-gray-500">Choose a contact to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperInbox;
