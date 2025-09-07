-- Remove OTP verification system and password change functionality to address security issues

-- Drop OTP-related table and functions
DROP TABLE IF EXISTS public.otp_verifications CASCADE;

-- Drop OTP-related functions
DROP FUNCTION IF EXISTS public.cleanup_expired_otps() CASCADE;
DROP FUNCTION IF EXISTS public.update_otp_updated_at() CASCADE;

-- Remove any triggers related to OTP
DROP TRIGGER IF EXISTS update_otp_verifications_updated_at ON public.otp_verifications;

-- Clean up any sequences related to OTP if they exist
DROP SEQUENCE IF EXISTS otp_verifications_id_seq CASCADE;