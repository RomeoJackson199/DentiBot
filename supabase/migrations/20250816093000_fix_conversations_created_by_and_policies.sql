-- Ensure conversations.created_by exists and policies allow creator to add participants

-- Add created_by column if missing
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create trigger to populate created_by with current auth uid if not provided
CREATE OR REPLACE FUNCTION public.set_conversation_created_by()
RETURNS trigger AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS conversations_set_created_by ON public.conversations;
CREATE TRIGGER conversations_set_created_by
BEFORE INSERT ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.set_conversation_created_by();

-- Conversations insert policy to allow any authenticated user to create
CREATE POLICY IF NOT EXISTS conversations_insert_any ON public.conversations
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow creator to add any participants to their conversation
CREATE POLICY IF NOT EXISTS participants_insert_creator ON public.conversation_participants
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.created_by = auth.uid()
  )
);

-- Ensure messages insert requires membership and correct sender
CREATE POLICY IF NOT EXISTS messages_insert_membership ON public.messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
  )
);