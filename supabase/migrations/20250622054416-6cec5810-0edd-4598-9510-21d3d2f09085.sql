
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Create more permissive policies for the message-attachments bucket
CREATE POLICY "Allow authenticated uploads to message-attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public access to message-attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'message-attachments');

CREATE POLICY "Allow authenticated updates to message-attachments" ON storage.objects
  FOR UPDATE USING (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated deletes from message-attachments" ON storage.objects
  FOR DELETE USING (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');
