-- Create messages table for patient-dentist communication
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sender_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages they sent or received
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
USING (
  sender_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR recipient_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Policy: Users can send messages
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND (
    -- Business members can message anyone in their business
    is_business_member(sender_profile_id, business_id)
    OR
    -- Patients can message dentists who have appointments with them
    (
      sender_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      AND recipient_profile_id IN (
        SELECT d.profile_id FROM dentists d
        JOIN appointments a ON a.dentist_id = d.id
        WHERE a.patient_id = sender_profile_id
      )
    )
  )
);

-- Policy: Users can mark their received messages as read
CREATE POLICY "Users can update their received messages"
ON public.messages
FOR UPDATE
USING (recipient_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (recipient_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;