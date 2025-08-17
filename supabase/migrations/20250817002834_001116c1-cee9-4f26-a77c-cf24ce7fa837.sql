-- Fix RLS policies for conversation creation

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create their own participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.messages;

-- Create more permissive policies for conversation creation
CREATE POLICY "Users can create conversation participants" ON public.conversation_participants
FOR INSERT WITH CHECK (
  -- User can add themselves to any conversation
  user_id = auth.uid() OR
  -- User can add others to conversations they're creating (during initial setup)
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_participants.conversation_id
    AND c.created_at > now() - interval '1 minute'
  )
);

-- Allow users to create messages in conversations they participate in
CREATE POLICY "Users can create messages in conversations" ON public.messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id 
    AND cp.user_id = auth.uid()
  )
);

-- Ensure users can update conversations they participate in
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
CREATE POLICY "Participants can update conversations" ON public.conversations
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conversations.id AND user_id = auth.uid()
  )
);

-- Add policy to allow reading profiles for conversation creation
CREATE POLICY IF NOT EXISTS "Users can view profiles for messaging" ON public.profiles
FOR SELECT USING (true);