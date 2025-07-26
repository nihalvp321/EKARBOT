
-- Create the message-attachments storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments', 
  true,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
    'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mpeg',
    'application/pdf', 'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit;

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow all uploads to message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow all access to message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow all updates to message-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow all deletes from message-attachments" ON storage.objects;

-- Create permissive policies for the message-attachments bucket
CREATE POLICY "Public upload to message-attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "Public read from message-attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'message-attachments');

CREATE POLICY "Public update in message-attachments" ON storage.objects
  FOR UPDATE USING (bucket_id = 'message-attachments');

CREATE POLICY "Public delete from message-attachments" ON storage.objects
  FOR DELETE USING (bucket_id = 'message-attachments');
