
-- Remove unwanted columns from projects table that are causing issues
ALTER TABLE public.projects 
DROP COLUMN IF EXISTS units,
DROP COLUMN IF EXISTS contact_persons,
DROP COLUMN IF EXISTS legal_documents;

-- Ensure we have all the necessary columns for proper project display
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS total_units integer,
ADD COLUMN IF NOT EXISTS bedrooms_range text,
ADD COLUMN IF NOT EXISTS bathrooms_range text,
ADD COLUMN IF NOT EXISTS unit_sizes_range text,
ADD COLUMN IF NOT EXISTS ownership_type text,
ADD COLUMN IF NOT EXISTS furnishing_status text,
ADD COLUMN IF NOT EXISTS has_balcony boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS price_per_sqft numeric(10,2),
ADD COLUMN IF NOT EXISTS service_charges numeric(10,2),
ADD COLUMN IF NOT EXISTS payment_plan text,
ADD COLUMN IF NOT EXISTS nearby_landmarks text,
ADD COLUMN IF NOT EXISTS sales_contact_name text,
ADD COLUMN IF NOT EXISTS sales_phone text,
ADD COLUMN IF NOT EXISTS sales_email text;
