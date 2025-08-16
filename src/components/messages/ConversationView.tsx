import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Check, CheckCheck } from 'lucide-react';
import { QuickReplies } from './QuickReplies';
import { ComposeAttachment } from './ComposeAttachment';
import { markConversationSeen } from '@/hooks/useMessages';

interface ConversationViewProps {
  conversationId: string;
  onBack?: () => void;
}

type MessageRow = {
  id: string;
  content: string | null;
  created_at: string;
  sender_id: string | null;
};

type Participant = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export function ConversationView({ conversationId }: ConversationViewProps) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const [{ data: msgs }, { data: parts }] = await Promise.all([
        supabase
          .from('messages')
          .select('id, content, created_at, sender_id')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true }),
        supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversationId),
      ]);

      const userIds = Array.from(new Set((parts ?? []).map(p => p.user_id)));
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .in('user_id', userIds);

      setParticipants((profiles ?? []) as any);
      setMessages((msgs ?? []) as any);

      // Fetch seen receipts from other participants
      const { data: seenReceipts } = await supabase
        .from('message_receipts')
        .select('message_id, user_id, status')
        .in('message_id', (msgs ?? []).map(m => m.id))
        .eq('status', 'seen');
      const otherSeen = new Set((seenReceipts ?? []).filter(r => r.user_id !== user.id).map(r => r.message_id));
      setSeenIds(otherSeen);

      // Mark all as seen for current user
      await markConversationSeen(conversationId);
    };
    load();
  }, [conversationId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, async (payload) => {
        setMessages(prev => [...prev, payload.new as MessageRow]);
        // Update seen receipts set when others see
        await markConversationSeen(conversationId);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_receipts' }, (payload) => {
        if ((payload.new as any).status === 'seen' && (payload.new as any).user_id !== currentUserId) {
          setSeenIds(prev => new Set(prev).add((payload.new as any).message_id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, currentUserId]);

  const groupByDate = useMemo(() => {
    const groups: Record<string, MessageRow[]> = {};
    for (const m of messages) {
      const d = new Date(m.created_at).toDateString();
      if (!groups[d]) groups[d] = [];
      groups[d].push(m);
    }
    return groups;
  }, [messages]);

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text) return;
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setNewMessage('');
      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: user.id, type: 'text', content: text })
        .select('*')
        .single();
      if (!error && data) {
        // Mark sender delivery
        await supabase.from('message_receipts').insert({ message_id: data.id, user_id: user.id, status: 'delivered' });
      }
    } finally {
      setSending(false);
    }
  };

  const handleUploaded = async (storage_path: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: user.id, type: 'attachment', content: storage_path, metadata: { storage_path } })
      .select('*')
      .single();
    if (!error && data) {
      await supabase.from('message_attachments').insert({ message_id: data.id, storage_path, file_name: storage_path.split('/').pop() || null });
      await supabase.from('message_receipts').insert({ message_id: data.id, user_id: user.id, status: 'delivered' });
    }
  };

  return (
    <Card className="flex flex-col h-[70vh]">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <div>
            <div className="font-semibold">Conversation</div>
            <div className="text-xs text-muted-foreground">{participants.length} participants</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full p-4">
          <div className="space-y-6">
            {Object.entries(groupByDate).map(([date, msgs]) => (
              <div key={date}>
                <div className="text-center text-xs text-muted-foreground mb-2">{date}</div>
                <div className="space-y-2">
                  {msgs.map(m => {
                    const isMe = m.sender_id && currentUserId ? m.sender_id === currentUserId : false;
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-2xl ${isMe ? 'bg-emerald-100 text-emerald-900' : 'bg-muted'}`}>
                          <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                          <div className={`mt-1 flex items-center gap-1 text-xs ${isMe ? 'justify-end text-emerald-700' : 'justify-start text-muted-foreground'}`}>
                            <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && (
                              <>
                                <Check className="h-3 w-3" />
                                <CheckCheck className={`h-3 w-3 ${seenIds.has(m.id) ? 'text-emerald-700' : 'opacity-50'}`} />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <QuickReplies onSelect={(text) => setNewMessage(prev => (prev ? prev + ' ' + text : text))} />
      <div className="p-3 border-t flex items-center gap-2">
        <ComposeAttachment conversationId={conversationId} onUploaded={handleUploaded} />
        <Input placeholder="Type your message…" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
        <Button onClick={handleSend} disabled={sending || !newMessage.trim()} className="gap-1"><Send className="h-4 w-4" /> Send</Button>
      </div>
    </Card>
  );
}