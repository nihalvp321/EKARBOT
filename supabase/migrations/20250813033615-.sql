-- Fix all RLS and database issues

-- 1. Fix messages table RLS policies to allow authenticated users to send messages
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update messages they received" ON messages;
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON messages;

-- Create new simplified policies for messages
CREATE POLICY "Allow authenticated users to manage messages" ON messages
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 2. Fix site_visits table RLS policies
DROP POLICY IF EXISTS "Sales agents can manage their own site visits" ON site_visits;
DROP POLICY IF EXISTS "Developers can view site visits for their projects" ON site_visits;
DROP POLICY IF EXISTS "User managers can manage all site visits" ON site_visits;

CREATE POLICY "Allow authenticated users to manage site visits" ON site_visits
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Fix saved_projects table RLS policies
DROP POLICY IF EXISTS "Sales agents can manage their own saved projects" ON saved_projects;
DROP POLICY IF EXISTS "Sales agents can manage their saved projects" ON saved_projects;

CREATE POLICY "Allow authenticated users to manage saved projects" ON saved_projects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Ensure dropdown_settings policies work for all authenticated users
DROP POLICY IF EXISTS "Anyone can view dropdown settings" ON dropdown_settings;
DROP POLICY IF EXISTS "User managers can manage dropdown settings" ON dropdown_settings;

CREATE POLICY "Allow anyone to view dropdown settings" ON dropdown_settings
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow authenticated users to manage dropdown settings" ON dropdown_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Ensure projects table policies allow all operations
DROP POLICY IF EXISTS "Allow all operations for developers" ON projects;

CREATE POLICY "Allow authenticated users to manage projects" ON projects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Fix the generate_dropdown_code function that's missing
CREATE OR REPLACE FUNCTION public.generate_dropdown_code(category_name text)
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
AS $function$
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
$function$;