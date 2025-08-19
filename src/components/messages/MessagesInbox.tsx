import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Search } from 'lucide-react';

type ConversationListItem = {
  id: string;
  title: string | null;
  lastMessage: string | null;
  lastTimestamp: string | null;
  unreadCount: number;
  otherUserName: string;
  otherUserAvatar?: string | null;
  archived?: boolean;
};

interface MessagesInboxProps {
  onOpenConversation: (conversationId: string) => void;
}

type Filter = 'all' | 'unread' | 'archived';

export function MessagesInbox({ onOpenConversation }: MessagesInboxProps) {
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setCurrentUserId(user.id);

        // Fetch conversations where the user is a participant
        const { data: conversations } = await supabase
          .from('conversation_participants')
          .select('conversation_id, archived, last_read_at')
          .eq('user_id', user.id);

        const conversationIds = (conversations ?? []).map(c => c.conversation_id);
        if (conversationIds.length === 0) {
          setItems([]);
          return;
        }

        // Fetch recent messages across conversations
        const { data: messages } = await supabase
          .from('messages')
          .select('id, conversation_id, content, created_at, sender_id')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false });

        // Fetch participants for just these conversations
        const { data: allParticipants } = await supabase
          .from('conversation_participants')
          .select('conversation_id, user_id')
          .in('conversation_id', conversationIds);

        // Fetch profiles for name/avatar resolution
        const uniqueUserIds = Array.from(new Set((allParticipants ?? []).map(p => p.user_id)));
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, avatar_url')
          .in('user_id', uniqueUserIds);

        // Seen receipts by current user
        const { data: receipts } = await supabase
          .from('message_receipts')
          .select('message_id')
          .in('message_id', (messages ?? []).map(m => m.id))
          .eq('user_id', user.id)
          .eq('status', 'seen');

        const latestByConv = new Map<string, { msg: any }>();
        (messages ?? []).forEach(m => {
          if (!latestByConv.has(m.conversation_id)) latestByConv.set(m.conversation_id, { msg: m });
        });

        const archivedMap = new Map((conversations ?? []).map(c => [c.conversation_id, c.archived] as const));
        const lastReadMap = new Map((conversations ?? []).map(c => [c.conversation_id, (c as any).last_read_at as string | null] as const));
        const seenSet = new Set((receipts ?? []).map(r => r.message_id));

        const list: ConversationListItem[] = (conversationIds).map(cid => {
          const latest = latestByConv.get(cid)?.msg;
          const convParticipants = (allParticipants ?? []).filter(p => p.conversation_id === cid);
          const otherUserId = convParticipants.find(p => p.user_id !== user.id)?.user_id;
          const prof = (profiles ?? []).find(p => p.user_id === otherUserId);
          const name = prof ? `${prof.first_name ?? ''} ${prof.last_name ?? ''}`.trim() || 'Conversation' : 'Conversation';
          const lastReadAt = lastReadMap.get(cid);
          const convMessages = (messages ?? []).filter(m => m.conversation_id === cid);
          const unreadCount = convMessages.filter(m => {
            const isOwn = m.sender_id === user.id;
            if (isOwn) return false;
            if (lastReadAt && new Date(m.created_at) <= new Date(lastReadAt)) return false;
            return !seenSet.has(m.id);
          }).length;
          return {
            id: cid,
            title: null,
            lastMessage: latest?.content ?? null,
            lastTimestamp: latest?.created_at ?? null,
            unreadCount,
            otherUserName: name,
            otherUserAvatar: prof?.avatar_url ?? null,
            archived: archivedMap.get(cid) || false,
          };
        });

        setItems(list);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let arr = items;
    if (filter === 'unread') arr = arr.filter(i => i.unreadCount > 0);
    if (filter === 'archived') arr = arr.filter(i => i.archived);
    if (filter === 'all') arr = arr.filter(i => !i.archived);
    if (!s) return arr;
    return arr.filter(i =>
      i.otherUserName.toLowerCase().includes(s) ||
      (i.lastMessage ?? '').toLowerCase().includes(s)
    );
  }, [items, search, filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search conversations"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All</Button>
        <Button variant={filter === 'unread' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('unread')}>Unread</Button>
        <Button variant={filter === 'archived' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('archived')}>Archived</Button>
      </div>

      <Card>
        <CardContent className="p-0 divide-y">
          {loading && (
            <div className="p-4 text-sm text-muted-foreground">Loading…</div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">No conversations found</div>
          )}
          {filtered.map(item => (
            <button
              key={item.id}
              className="w-full text-left p-4 hover:bg-muted/50 flex items-center gap-3"
              onClick={() => onOpenConversation(item.id)}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={item.otherUserAvatar || undefined} />
                <AvatarFallback>
                  <MessageSquare className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium truncate">{item.otherUserName}</div>
                  {item.unreadCount > 0 && (
                    <Badge variant="secondary">{item.unreadCount}</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {item.lastMessage || 'No messages yet'}
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                {item.lastTimestamp ? new Date(item.lastTimestamp).toLocaleString() : ''}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}