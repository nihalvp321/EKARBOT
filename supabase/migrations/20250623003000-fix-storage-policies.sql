
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated uploads to message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from message-attachments" ON storage.objects;

-- Create more permissive policies that work with custom auth
CREATE POLICY "Allow all uploads to message-attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "Allow all access to message-attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'message-attachments');

CREATE POLICY "Allow all updates to message-attachments" ON storage.objects
  FOR UPDATE USING (bucket_id = 'message-attachments');

CREATE POLICY "Allow all deletes from message-attachments" ON storage.objects
  FOR DELETE USING (bucket_id = 'message-attachments');
