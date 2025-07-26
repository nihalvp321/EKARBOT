
-- Create users table for authentication (user managers, developers, sales agents)
CREATE TABLE public.app_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('user_manager', 'developer', 'sales_agent')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create developers table
CREATE TABLE public.developers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  developer_id TEXT UNIQUE NOT NULL,
  developer_name TEXT NOT NULL,
  contact_person_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email_address TEXT NOT NULL,
  office_address TEXT,
  user_id UUID REFERENCES public.app_users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales_agents table
CREATE TABLE public.sales_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_agent_id TEXT UNIQUE NOT NULL,
  sales_agent_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  email_address TEXT NOT NULL,
  user_id UUID REFERENCES public.app_users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table for inbox functionality
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.app_users(id) NOT NULL,
  receiver_id UUID REFERENCES public.app_users(id) NOT NULL,
  message_text TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert the user manager
INSERT INTO public.app_users (username, email, password_hash, user_type)
VALUES ('vpnihal', 'vpnihal@mitesolutions.com', 'admin123', 'user_manager');

-- Enable Row Level Security
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for app_users (allow all operations for now since we have custom auth)
CREATE POLICY "Allow all operations on app_users" ON public.app_users FOR ALL USING (true);

-- Create RLS policies for developers
CREATE POLICY "Allow all operations on developers" ON public.developers FOR ALL USING (true);

-- Create RLS policies for sales_agents
CREATE POLICY "Allow all operations on sales_agents" ON public.sales_agents FOR ALL USING (true);

-- Create RLS policies for messages
CREATE POLICY "Allow all operations on messages" ON public.messages FOR ALL USING (true);
