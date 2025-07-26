
-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'message-attachments', 
  'message-attachments', 
  true, 
  52428800, -- 50MB limit
  ARRAY['image/*', 'video/*', 'audio/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
);

-- Create RLS policies for the storage bucket
CREATE POLICY "Allow authenticated users to upload message attachments" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to view message attachments" ON storage.objects
FOR SELECT USING (bucket_id = 'message-attachments');

CREATE POLICY "Allow users to update their message attachments" ON storage.objects
FOR UPDATE USING (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to delete their message attachments" ON storage.objects
FOR DELETE USING (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

-- Add attachment columns to messages table
ALTER TABLE public.messages 
ADD COLUMN attachment_url TEXT,
ADD COLUMN attachment_type TEXT,
ADD COLUMN attachment_name TEXT,
ADD COLUMN attachment_size BIGINT;

-- Enable realtime for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
