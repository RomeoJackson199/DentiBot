-- Add created_by column to conversations table for better access control
ALTER TABLE public.conversations ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Update RLS policies for conversations to be more specific
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;

-- Create new policies
CREATE POLICY "Users can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Participants can view conversations" 
ON public.conversations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversations.id 
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Participants can update conversations" 
ON public.conversations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversations.id 
    AND cp.user_id = auth.uid()
  )
);

-- Update conversation_participants policies to allow adding participants to new conversations
DROP POLICY IF EXISTS "Users can create conversation participants" ON public.conversation_participants;

CREATE POLICY "Users can create conversation participants" 
ON public.conversation_participants 
FOR INSERT 
WITH CHECK (
  -- User can add themselves to any conversation
  user_id = auth.uid() 
  OR 
  -- User can add others to conversations they created (within last 5 minutes)
  EXISTS (
    SELECT 1 FROM conversations c 
    WHERE c.id = conversation_participants.conversation_id 
    AND c.created_by = auth.uid()
    AND c.created_at > now() - interval '5 minutes'
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);