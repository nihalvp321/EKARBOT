
-- Create the message-attachments bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Drop all existing policies for message-attachments bucket
DROP POLICY IF EXISTS "Allow all uploads to message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow all access to message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow all updates to message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow all deletes from message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from message-attachments" ON storage.objects;

-- Create completely open policies for message-attachments bucket
CREATE POLICY "Public upload access" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'message-attachments');

CREATE POLICY "Public update access" ON storage.objects
  FOR UPDATE USING (bucket_id = 'message-attachments');

CREATE POLICY "Public delete access" ON storage.objects
  FOR DELETE USING (bucket_id = 'message-attachments');
