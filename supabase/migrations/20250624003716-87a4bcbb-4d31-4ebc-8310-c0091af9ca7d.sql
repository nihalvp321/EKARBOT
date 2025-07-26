
-- Add profile_image_url column to developers table
ALTER TABLE public.developers 
ADD COLUMN profile_image_url text;
