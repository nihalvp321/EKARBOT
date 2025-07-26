import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ContactInfo {
  name: string;
  phone: string;
  email: string;
}

interface ProjectContactInfoProps {
  formData: { contacts: ContactInfo[] };
  handleInputChange: (field: string, value: ContactInfo[]) => void;
}

const ProjectContactInfo = ({ formData, handleInputChange }: ProjectContactInfoProps) => {
  const contact: ContactInfo = formData.contacts?.[0] || { name: '', phone: '', email: '' };

  const updateContact = (field: keyof ContactInfo, value: string) => {
    const updatedContact = { ...contact, [field]: value };
    handleInputChange('contacts', [updatedContact]); // Always update as array with single object
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Sales Contact Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 p-4 border rounded-lg">
          <div>
            <Label htmlFor="contact_name">Contact Name *</Label>
            <Input
              id="contact_name"
              value={contact.name}
              onChange={(e) => updateContact('name', e.target.value)}
              placeholder="John Smith"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_phone">Phone Number *</Label>
              <Input
                id="contact_phone"
                type="tel"
                value={contact.phone}
                onChange={(e) => updateContact('phone', e.target.value)}
                placeholder="+971 50 123 4567"
                required
              />
            </div>
            <div>
              <Label htmlFor="contact_email">Email *</Label>
              <Input
                id="contact_email"
                type="email"
                value={contact.email}
                onChange={(e) => updateContact('email', e.target.value)}
                placeholder="sales@developer.com"
                required
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectContactInfo;
