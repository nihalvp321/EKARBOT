
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Contact {
  id: string;
  username: string;
  user_type: string;
  email: string;
  unreadCount?: number;
  profile_image_url?: string;
}

interface ContactsListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  loading: boolean;
  filterOptions?: string[];
}

const ContactsList = ({ contacts, selectedContact, onSelectContact, loading, filterOptions = ['All', 'Developers', 'User Manager'] }: ContactsListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = contact.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'All' || 
      (filterType === 'Developers' && contact.user_type === 'developer') ||
      (filterType === 'User Manager' && contact.user_type === 'user_manager') ||
      (filterType === 'Sales Agent' && contact.user_type === 'sales_agent');
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="h-full bg-white border-r border-gray-200">
        <div className="flex items-center justify-center h-full">
          <div className="text-lg">Loading contacts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          {selectedContact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectContact(null)}
              className="lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h2 className="text-lg font-semibold text-gray-800">Chats</h2>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-1">
          {filterOptions.map((filter) => (
            <Button
              key={filter}
              variant={filterType === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(filter)}
              className={`text-xs ${filterType === filter ? "bg-slate-600 hover:bg-slate-700" : ""}`}
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-gray-100">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedContact?.id === contact.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={contact.profile_image_url} />
                  <AvatarFallback className="bg-gray-300">
                    <Users className="h-5 w-5 text-gray-600" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{contact.username}</p>
                  <p className="text-sm text-gray-500 capitalize truncate">
                    {contact.user_type.replace('_', ' ')}
                  </p>
                </div>
                {contact.unreadCount && contact.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">{contact.unreadCount}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {filteredContacts.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No contacts found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ContactsList;
