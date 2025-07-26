
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectPricingDetailsProps {
  formData: any;
  handleInputChange: (field: string, value: string | number | boolean | string[] | any[]) => void;
}

const ProjectPricingDetails = ({ formData, handleInputChange }: ProjectPricingDetailsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Pricing & Financial Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="starting_price_aed">Starting Price (AED) *</Label>
            <Input
              id="starting_price_aed"
              type="number"
              value={formData.starting_price_aed || ''}
              onChange={(e) => handleInputChange('starting_price_aed', parseInt(e.target.value) || 0)}
              placeholder="850000"
              required
            />
          </div>
          <div>
            <Label htmlFor="price_per_sqft">Price per Sq Ft (AED)</Label>
            <Input
              id="price_per_sqft"
              type="number"
              step="0.01"
              value={formData.price_per_sqft || ''}
              onChange={(e) => handleInputChange('price_per_sqft', parseFloat(e.target.value) || 0)}
              placeholder="1200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="service_charges">Service Charges (AED per sq ft)</Label>
            <Input
              id="service_charges"
              type="number"
              step="0.01"
              value={formData.service_charges || ''}
              onChange={(e) => handleInputChange('service_charges', parseFloat(e.target.value) || 0)}
              placeholder="15"
            />
          </div>
          <div>
            <Label htmlFor="ownership_type">Ownership Type</Label>
            <Input
              id="ownership_type"
              value={formData.ownership_type || ''}
              onChange={(e) => handleInputChange('ownership_type', e.target.value)}
              placeholder="Freehold"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="payment_plan">Payment Plan</Label>
          <Textarea
            id="payment_plan"
            value={formData.payment_plan || ''}
            onChange={(e) => handleInputChange('payment_plan', e.target.value)}
            placeholder="10% on booking, 50% during construction, 40% on handover..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="rera_approval_id">RERA Approval ID</Label>
          <Input
            id="rera_approval_id"
            value={formData.rera_approval_id || ''}
            onChange={(e) => handleInputChange('rera_approval_id', e.target.value)}
            placeholder="RERA-123456"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectPricingDetails;
