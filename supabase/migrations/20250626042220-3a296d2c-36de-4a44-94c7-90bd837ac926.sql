
-- Insert dropdown options for ownership type
INSERT INTO public.dropdown_settings (category, value, description, display_order) VALUES
('ownership_type', 'Freehold', 'Full ownership including land', 1),
('ownership_type', 'Leasehold', 'Long-term lease ownership', 2),
('ownership_type', 'Usufruct', 'Right to use and occupy', 3);

-- Insert dropdown options for number of bedrooms
INSERT INTO public.dropdown_settings (category, value, description, display_order) VALUES
('bedrooms', 'Studio', 'Studio apartment', 1),
('bedrooms', '1', '1 Bedroom', 2),
('bedrooms', '2', '2 Bedrooms', 3),
('bedrooms', '3', '3 Bedrooms', 4),
('bedrooms', '4', '4 Bedrooms', 5),
('bedrooms', '5', '5 Bedrooms', 6),
('bedrooms', '6+', '6 or more Bedrooms', 7);

-- Insert dropdown options for number of bathrooms
INSERT INTO public.dropdown_settings (category, value, description, display_order) VALUES
('bathrooms', '1', '1 Bathroom', 1),
('bathrooms', '2', '2 Bathrooms', 2),
('bathrooms', '3', '3 Bathrooms', 3),
('bathrooms', '4', '4 Bathrooms', 4),
('bathrooms', '5', '5 Bathrooms', 5),
('bathrooms', '6+', '6 or more Bathrooms', 6);
