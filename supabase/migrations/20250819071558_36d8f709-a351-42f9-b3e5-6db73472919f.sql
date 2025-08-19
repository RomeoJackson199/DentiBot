-- Create invitation tokens table for email invitations
CREATE TABLE public.invitation_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  token UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invitation_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view invitations for their email" 
ON public.invitation_tokens 
FOR SELECT 
USING (true); -- Public read for invitation validation

CREATE POLICY "System can create invitation tokens" 
ON public.invitation_tokens 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update invitation tokens" 
ON public.invitation_tokens 
FOR UPDATE 
USING (true);

-- Create index for performance
CREATE INDEX idx_invitation_tokens_token ON public.invitation_tokens(token);
CREATE INDEX idx_invitation_tokens_email ON public.invitation_tokens(email);

-- Add trigger for updated_at
CREATE TRIGGER update_invitation_tokens_updated_at
BEFORE UPDATE ON public.invitation_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();