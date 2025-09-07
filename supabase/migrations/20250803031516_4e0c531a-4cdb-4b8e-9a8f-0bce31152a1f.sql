-- Fix RLS policy for dropdown_settings to work with custom authentication
DROP POLICY IF EXISTS "Only developers can manage dropdown settings" ON dropdown_settings;
DROP POLICY IF EXISTS "All authenticated users can view dropdown settings" ON dropdown_settings;

-- Create new policies that work with custom authentication
CREATE POLICY "Allow all operations on dropdown_settings" 
ON dropdown_settings 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Insert default dropdown options for various categories
INSERT INTO dropdown_settings (category, code, value, description, display_order) VALUES
-- Project Types
('project_type', 'APT001', 'Apartment', 'Residential apartment units', 1),
('project_type', 'VIL001', 'Villa', 'Independent villa properties', 2),
('project_type', 'TOW001', 'Townhouse', 'Multi-level townhouse units', 3),
('project_type', 'PEN001', 'Penthouse', 'Luxury penthouse units', 4),
('project_type', 'STU001', 'Studio', 'Studio apartment units', 5),
('project_type', 'DUP001', 'Duplex', 'Two-level duplex units', 6),

-- Listing Types
('listing_type', 'SAL001', 'Sale', 'Property for sale', 1),
('listing_type', 'REN001', 'Rent', 'Property for rent', 2),
('listing_type', 'LEA001', 'Lease', 'Property for lease', 3),

-- Project Status
('project_status', 'PLN001', 'Planning', 'In planning phase', 1),
('project_status', 'UND001', 'Under Construction', 'Currently under construction', 2),
('project_status', 'NEA001', 'Nearing Completion', 'Almost completed', 3),
('project_status', 'COM001', 'Completed', 'Construction completed', 4),
('project_status', 'REA001', 'Ready to Move', 'Ready for occupancy', 5),

-- Emirates
('emirate', 'DUB001', 'Dubai', 'Dubai Emirate', 1),
('emirate', 'ABU001', 'Abu Dhabi', 'Abu Dhabi Emirate', 2),
('emirate', 'SHA001', 'Sharjah', 'Sharjah Emirate', 3),
('emirate', 'AJM001', 'Ajman', 'Ajman Emirate', 4),
('emirate', 'RAK001', 'Ras Al Khaimah', 'Ras Al Khaimah Emirate', 5),
('emirate', 'FUJ001', 'Fujairah', 'Fujairah Emirate', 6),
('emirate', 'UMM001', 'Umm Al Quwain', 'Umm Al Quwain Emirate', 7),

-- Ownership Types
('ownership_type', 'FRE001', 'Freehold', 'Freehold ownership', 1),
('ownership_type', 'LEA001', 'Leasehold', 'Leasehold ownership', 2),

-- Furnishing Status
('furnishing_status', 'FUR001', 'Furnished', 'Fully furnished', 1),
('furnishing_status', 'UNF001', 'Unfurnished', 'Unfurnished property', 2),
('furnishing_status', 'PAR001', 'Partially Furnished', 'Partially furnished', 3),

-- Availability
('availability', 'AVA001', 'Available', 'Available for sale/rent', 1),
('availability', 'SOL001', 'Sold', 'Property sold', 2),
('availability', 'REN001', 'Rented', 'Property rented', 3),
('availability', 'HOL001', 'On Hold', 'Temporarily on hold', 4)

ON CONFLICT (category, code) DO NOTHING;