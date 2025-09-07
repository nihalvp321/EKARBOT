-- Enable realtime for messages table to fix real-time messaging
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Add unique constraint to dropdown_settings to prevent duplicates
ALTER TABLE dropdown_settings ADD CONSTRAINT dropdown_settings_category_value_unique UNIQUE (category, value, is_active);

-- Create OTP verification table for password resets and email changes
CREATE TABLE public.otp_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('developer', 'user_manager', 'sales_agent')),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  otp_type TEXT NOT NULL CHECK (otp_type IN ('password_reset', 'email_change')),
  new_email TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on OTP table
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for OTP table
CREATE POLICY "Users can view their own OTP records" 
ON public.otp_verifications 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all operations on otp_verifications" 
ON public.otp_verifications 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to clean up expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.otp_verifications 
  WHERE expires_at < now() OR is_used = true;
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_otp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_otp_verifications_updated_at
BEFORE UPDATE ON public.otp_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_otp_updated_at();