-- Create dentist invitations table
CREATE TABLE IF NOT EXISTS public.dentist_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  inviter_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  invitee_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.dentist_invitations ENABLE ROW LEVEL SECURITY;

-- Business owners can create invitations
CREATE POLICY "Business owners can create invitations"
ON public.dentist_invitations
FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT b.id FROM public.businesses b
    JOIN public.profiles p ON p.id = b.owner_profile_id
    WHERE p.user_id = auth.uid()
  )
);

-- Business owners can view their invitations
CREATE POLICY "Business owners can view their invitations"
ON public.dentist_invitations
FOR SELECT
USING (
  business_id IN (
    SELECT b.id FROM public.businesses b
    JOIN public.profiles p ON p.id = b.owner_profile_id
    WHERE p.user_id = auth.uid()
  )
);

-- Invitees can view their invitations by email
CREATE POLICY "Invitees can view their invitations"
ON public.dentist_invitations
FOR SELECT
USING (
  invitee_email IN (
    SELECT email FROM public.profiles
    WHERE user_id = auth.uid()
  )
);

-- Invitees can update their invitations (accept/reject)
CREATE POLICY "Invitees can respond to invitations"
ON public.dentist_invitations
FOR UPDATE
USING (
  invitee_email IN (
    SELECT email FROM public.profiles
    WHERE user_id = auth.uid()
  )
  AND status = 'pending'
)
WITH CHECK (
  status IN ('accepted', 'rejected')
);

-- Create index for faster lookups
CREATE INDEX idx_dentist_invitations_email ON public.dentist_invitations(invitee_email);
CREATE INDEX idx_dentist_invitations_status ON public.dentist_invitations(status);
CREATE INDEX idx_dentist_invitations_business ON public.dentist_invitations(business_id);