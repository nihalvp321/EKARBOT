
-- Update dropdown_settings table to support auto-generation of unique codes
-- and add a display_order column for better organization

-- Add display_order column to control the order of dropdown items
ALTER TABLE public.dropdown_settings 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create a function to generate unique codes automatically
CREATE OR REPLACE FUNCTION generate_dropdown_code(category_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_code TEXT;
    counter INTEGER := 1;
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Generate code as first 3 letters of category + zero-padded number
        new_code := UPPER(SUBSTRING(category_name FROM 1 FOR 3)) || LPAD(counter::TEXT, 3, '0');
        
        -- Check if this code already exists for this category
        SELECT EXISTS(
            SELECT 1 FROM public.dropdown_settings 
            WHERE category = category_name AND code = new_code
        ) INTO exists_check;
        
        -- If code doesn't exist, we can use it
        IF NOT exists_check THEN
            EXIT;
        END IF;
        
        -- Increment counter and try again
        counter := counter + 1;
        
        -- Safety check to prevent infinite loop
        IF counter > 999 THEN
            RAISE EXCEPTION 'Unable to generate unique code for category %', category_name;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$;

-- Create a trigger function to auto-generate codes when inserting new dropdown items
CREATE OR REPLACE FUNCTION auto_generate_dropdown_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only generate code if it's not provided or is empty
    IF NEW.code IS NULL OR NEW.code = '' THEN
        NEW.code := generate_dropdown_code(NEW.category);
    END IF;
    
    -- Auto-set display_order if not provided
    IF NEW.display_order IS NULL OR NEW.display_order = 0 THEN
        SELECT COALESCE(MAX(display_order), 0) + 1 
        INTO NEW.display_order 
        FROM public.dropdown_settings 
        WHERE category = NEW.category;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_dropdown_code ON public.dropdown_settings;
CREATE TRIGGER trigger_auto_generate_dropdown_code
    BEFORE INSERT ON public.dropdown_settings
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_dropdown_code();

-- Update existing records to have proper display_order
UPDATE public.dropdown_settings 
SET display_order = 
    CASE 
        WHEN category = 'property_type' AND code = 'APT' THEN 1
        WHEN category = 'property_type' AND code = 'VIL' THEN 2
        WHEN category = 'property_type' AND code = 'TWH' THEN 3
        WHEN category = 'property_type' AND code = 'STU' THEN 4
        WHEN category = 'property_type' AND code = 'PEN' THEN 5
        WHEN category = 'property_status' AND code = 'PLN' THEN 1
        WHEN category = 'property_status' AND code = 'UCN' THEN 2
        WHEN category = 'property_status' AND code = 'RDY' THEN 3
        WHEN category = 'property_status' AND code = 'CMP' THEN 4
        WHEN category = 'listing_type' AND code = 'SAL' THEN 1
        WHEN category = 'listing_type' AND code = 'RNT' THEN 2
        WHEN category = 'total_bhk' AND code = '1BHK' THEN 1
        WHEN category = 'total_bhk' AND code = '2BHK' THEN 2
        WHEN category = 'total_bhk' AND code = '3BHK' THEN 3
        WHEN category = 'total_bhk' AND code = '4BHK' THEN 4
        WHEN category = 'total_bhk' AND code = '5BHK' THEN 5
        WHEN category = 'total_bhk' AND code = 'STU' THEN 6
        WHEN category = 'total_bhk' AND code = 'PEN' THEN 7
        WHEN category = 'unit_status' AND code = 'AVL' THEN 1
        WHEN category = 'unit_status' AND code = 'BKD' THEN 2
        WHEN category = 'unit_status' AND code = 'SLD' THEN 3
        WHEN category = 'ownership_type' AND code = 'FRH' THEN 1
        WHEN category = 'ownership_type' AND code = 'LSH' THEN 2
        WHEN category = 'availability_status' AND code = 'AVL' THEN 1
        WHEN category = 'availability_status' AND code = 'NAV' THEN 2
        WHEN category = 'furnishing_status' AND code = 'FUR' THEN 1
        WHEN category = 'furnishing_status' AND code = 'UFR' THEN 2
        WHEN category = 'furnishing_status' AND code = 'SFR' THEN 3
        ELSE 1
    END
WHERE display_order = 0 OR display_order IS NULL;
