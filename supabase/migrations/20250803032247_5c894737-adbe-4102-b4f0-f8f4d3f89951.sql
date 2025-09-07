-- Add missing dropdown categories for bedroom range, bathroom range, and amenities

-- Bedroom Range options
INSERT INTO dropdown_settings (category, code, value, description, display_order) VALUES
('bedroom_range', 'BED001', 'Studio', 'Studio apartment', 1),
('bedroom_range', 'BED002', '1 Bedroom', 'One bedroom unit', 2),
('bedroom_range', 'BED003', '2 Bedrooms', 'Two bedroom unit', 3),
('bedroom_range', 'BED004', '3 Bedrooms', 'Three bedroom unit', 4),
('bedroom_range', 'BED005', '4 Bedrooms', 'Four bedroom unit', 5),
('bedroom_range', 'BED006', '5+ Bedrooms', 'Five or more bedrooms', 6),

-- Bathroom Range options
('bathroom_range', 'BAT001', '1 Bathroom', 'One bathroom', 1),
('bathroom_range', 'BAT002', '2 Bathrooms', 'Two bathrooms', 2),
('bathroom_range', 'BAT003', '3 Bathrooms', 'Three bathrooms', 3),
('bathroom_range', 'BAT004', '4 Bathrooms', 'Four bathrooms', 4),
('bathroom_range', 'BAT005', '5+ Bathrooms', 'Five or more bathrooms', 5),

-- Common Amenities
('amenities', 'AME001', 'Swimming Pool', 'Swimming pool facility', 1),
('amenities', 'AME002', 'Gymnasium', 'Fitness center/gym', 2),
('amenities', 'AME003', 'Parking', 'Parking spaces', 3),
('amenities', 'AME004', 'Security', '24/7 security', 4),
('amenities', 'AME005', 'Elevator', 'Elevator access', 5),
('amenities', 'AME006', 'Balcony', 'Private balcony', 6),
('amenities', 'AME007', 'Garden', 'Garden/landscaping', 7),
('amenities', 'AME008', 'Playground', 'Children playground', 8),
('amenities', 'AME009', 'Concierge', 'Concierge service', 9),
('amenities', 'AME010', 'Spa', 'Spa facilities', 10),
('amenities', 'AME011', 'Tennis Court', 'Tennis court', 11),
('amenities', 'AME012', 'Basketball Court', 'Basketball court', 12),
('amenities', 'AME013', 'BBQ Area', 'Barbecue area', 13),
('amenities', 'AME014', 'Laundry', 'Laundry facilities', 14),
('amenities', 'AME015', 'Storage', 'Storage space', 15)

ON CONFLICT (category, code) DO NOTHING;

-- Add contacts column to projects table to store multiple contacts as JSON
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contacts jsonb DEFAULT '[]'::jsonb;