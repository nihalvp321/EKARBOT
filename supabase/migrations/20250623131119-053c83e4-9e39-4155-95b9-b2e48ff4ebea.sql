
-- Create a table for managing dropdown settings
CREATE TABLE public.dropdown_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  code TEXT NOT NULL,
  value TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category, code)
);

-- Insert default dropdown options
INSERT INTO public.dropdown_settings (category, code, value) VALUES
-- Property Type
('property_type', 'APT', 'Apartment'),
('property_type', 'VIL', 'Villa'),
('property_type', 'TWH', 'Townhouse'),
('property_type', 'STU', 'Studio'),
('property_type', 'PEN', 'Penthouse'),

-- Property Status
('property_status', 'PLN', 'Planning'),
('property_status', 'UCN', 'Under Construction'),
('property_status', 'RDY', 'Ready'),
('property_status', 'CMP', 'Completed'),

-- Listing Type
('listing_type', 'SAL', 'Sale'),
('listing_type', 'RNT', 'Rent'),

-- Total BHK
('total_bhk', '1BHK', '1 BHK'),
('total_bhk', '2BHK', '2 BHK'),
('total_bhk', '3BHK', '3 BHK'),
('total_bhk', '4BHK', '4 BHK'),
('total_bhk', '5BHK', '5 BHK'),
('total_bhk', 'STU', 'Studio'),
('total_bhk', 'PEN', 'Penthouse'),

-- Unit Status
('unit_status', 'AVL', 'Available'),
('unit_status', 'BKD', 'Booked'),
('unit_status', 'SLD', 'Sold'),

-- Ownership Type
('ownership_type', 'FRH', 'Freehold'),
('ownership_type', 'LSH', 'Leasehold'),

-- Availability Status
('availability_status', 'AVL', 'Available'),
('availability_status', 'NAV', 'Not Available'),

-- Furnishing Status
('furnishing_status', 'FUR', 'Furnished'),
('furnishing_status', 'UFR', 'Unfurnished'),
('furnishing_status', 'SFR', 'Semi-Furnished');

-- Enable Row Level Security
ALTER TABLE public.dropdown_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for reading dropdown settings (accessible to all authenticated users)
CREATE POLICY "All authenticated users can view dropdown settings" 
  ON public.dropdown_settings 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Create policy for managing dropdown settings (only developers can modify)
CREATE POLICY "Only developers can manage dropdown settings" 
  ON public.dropdown_settings 
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE id = auth.uid() AND user_type = 'developer'
    )
  );
