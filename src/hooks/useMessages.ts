import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useMessagesBadge() {
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setUnread(0);

    // Count messages without a 'seen' receipt by current user
    const { data: convs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);
    const ids = (convs ?? []).map(c => c.conversation_id);
    if (ids.length === 0) { setUnread(0); return; }

    const { data: msgs } = await supabase
      .from('messages')
      .select('id')
      .in('conversation_id', ids)
      .order('created_at', { ascending: false })
      .limit(200);

    const messageIds = (msgs ?? []).map(m => m.id);
    if (messageIds.length === 0) { setUnread(0); return; }

    const { data: receipts } = await supabase
      .from('message_receipts')
      .select('message_id')
      .in('message_id', messageIds)
      .eq('user_id', user.id)
      .eq('status', 'seen');

    const seenSet = new Set((receipts ?? []).map(r => r.message_id));
    const unseenCount = messageIds.filter(id => !seenSet.has(id)).length;
    setUnread(unseenCount);
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel('messages_badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => refresh())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_receipts' }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  return unread;
}

export async function markConversationSeen(conversationId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: msgs } = await supabase
    .from('messages')
    .select('id')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(200);
  const ids = (msgs ?? []).map(m => m.id);
  if (ids.length > 0) {
    const upserts = ids.map(id => ({ message_id: id, user_id: user.id, status: 'seen' as const }));
    await supabase.from('message_receipts').upsert(upserts, { onConflict: 'message_id,user_id,status' }).select('id');
  }
  // Update last_read_at for participant row
  await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id);
}