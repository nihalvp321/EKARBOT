
-- Add new columns to projects table to match property finder requirements
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS community TEXT,
ADD COLUMN IF NOT EXISTS sub_community TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS nearby_landmarks TEXT,
ADD COLUMN IF NOT EXISTS starting_price_aed BIGINT,
ADD COLUMN IF NOT EXISTS price_per_sqft DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_plan TEXT,
ADD COLUMN IF NOT EXISTS service_charges DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS unit_sizes_range TEXT,
ADD COLUMN IF NOT EXISTS bedrooms_range TEXT,
ADD COLUMN IF NOT EXISTS bathrooms_range TEXT,
ADD COLUMN IF NOT EXISTS has_balcony BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS furnishing_status TEXT,
ADD COLUMN IF NOT EXISTS parking_spaces INTEGER,
ADD COLUMN IF NOT EXISTS has_security BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS security_details TEXT,
ADD COLUMN IF NOT EXISTS has_elevators BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS total_units INTEGER,
ADD COLUMN IF NOT EXISTS video_tour_url TEXT,
ADD COLUMN IF NOT EXISTS sales_contact_name TEXT,
ADD COLUMN IF NOT EXISTS sales_phone TEXT,
ADD COLUMN IF NOT EXISTS sales_email TEXT;

-- Update existing projects to have default values where needed
UPDATE public.projects 
SET city = emirate 
WHERE city IS NULL AND emirate IS NOT NULL;

UPDATE public.projects 
SET community = region_area 
WHERE community IS NULL AND region_area IS NOT NULL;
