-- Create table for storing 2FA verification codes
CREATE TABLE IF NOT EXISTS public.verification_codes (
  email text PRIMARY KEY,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "System can manage verification codes"
ON public.verification_codes
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_codes_email_expires ON public.verification_codes(email, expires_at);

-- Add trigger for updated_at
CREATE TRIGGER update_verification_codes_updated_at
BEFORE UPDATE ON public.verification_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();