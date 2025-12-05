-- Add type column to verification_codes to distinguish between login 2FA and password recovery
ALTER TABLE public.verification_codes 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT '2fa';

-- Create index for performance
CREATE INDEX IF NOT EXISTS verification_codes_type_idx ON public.verification_codes(type);
