
-- Add description column to dropdown_settings table
ALTER TABLE public.dropdown_settings 
ADD COLUMN description text DEFAULT '';
