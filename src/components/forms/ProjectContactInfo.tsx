
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { validateEmail, validatePhoneNumber } from '@/utils/inputValidation';
import { toast } from 'sonner';

interface ContactInfo {
  name: string;
  phone: string;
  email: string;
}

interface ProjectContactInfoProps {
  formData: any;
  handleInputChange: (field: string, value: ContactInfo[]) => void;
}

const ProjectContactInfo = ({ formData, handleInputChange }: ProjectContactInfoProps) => {
  // Ensure contacts is always an array
  const contacts = Array.isArray(formData.contacts) 
    ? formData.contacts 
    : [{ name: '', phone: '', email: '' }];

  const updateContact = (index: number, field: keyof ContactInfo, value: string) => {
    const updatedContacts = [...contacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    
    // Validate email and phone in real-time
    if (field === 'email' && value && !validateEmail(value)) {
      toast.error('Please enter a valid email address');
    }
    if (field === 'phone' && value && !validatePhoneNumber(value)) {
      toast.error('Please enter a valid phone number');
    }
    
    handleInputChange('contacts', updatedContacts);
  };

  const addContact = () => {
    const updatedContacts = [...contacts, { name: '', phone: '', email: '' }];
    handleInputChange('contacts', updatedContacts);
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      const updatedContacts = contacts.filter((_: ContactInfo, i: number) => i !== index);
      handleInputChange('contacts', updatedContacts);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-800"><h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-5 flex items-center">
        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
      Sales Contact Details</h4></CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addContact}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {contacts.map((contact: ContactInfo, index: number) => (
          <div key={index} className="space-y-4 p-4 border rounded-lg relative">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-700">Contact {index + 1}</h4>
              {contacts.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeContact(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div>
              <Label htmlFor={`contact_name_${index}`}>Contact Name <span className="text-red-500">*</span></Label>
              <Input
                id={`contact_name_${index}`}
                value={contact.name}
                onChange={(e) => updateContact(index, 'name', e.target.value)}
                placeholder="John Smith"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`contact_phone_${index}`}>Phone Number <span className="text-red-500">*</span></Label>
                <Input
                  id={`contact_phone_${index}`}
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => updateContact(index, 'phone', e.target.value)}
                  placeholder="+971 50 123 4567"
                  required
                />
              </div>
              <div>
                <Label htmlFor={`contact_email_${index}`}>Email <span className="text-red-500">*</span></Label>
                <Input
                  id={`contact_email_${index}`}
                  type="email"
                  value={contact.email}
                  onChange={(e) => updateContact(index, 'email', e.target.value)}
                  placeholder="sales@developer.com"
                  required
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ProjectContactInfo;
