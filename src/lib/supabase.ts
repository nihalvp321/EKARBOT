// lib/supabase.ts (Plain React usage)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjfiqnaskbalqcktmpbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZmlxbmFza2JhbHFja3RtcGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MDg2NjksImV4cCI6MjA2NTE4NDY2OX0.7r6NY_H6v7EjU-E0Mr4TCHwxdOzQiAJ8ZyuZ_BA_UU0';

export const supabase = createClient(supabaseUrl, supabaseKey);
