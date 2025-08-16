import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

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

type UserOption = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string | null;
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
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

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
          .select('conversation_id, archived')
          .eq('user_id', user.id);

        const conversationIds = (conversations ?? []).map(c => c.conversation_id);
        if (conversationIds.length === 0) {
          setItems([]);
          return;
        }

        // Fetch last message per conversation
        const { data: messages } = await supabase
          .from('messages')
          .select('id, conversation_id, content, created_at')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false });

        // Fetch participants to resolve names
        const { data: allParticipants } = await supabase
          .from('conversation_participants')
          .select('conversation_id, user_id');

        // Fetch profiles for name resolution
        const uniqueUserIds = Array.from(new Set((allParticipants ?? []).map(p => p.user_id)));
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, avatar_url')
          .in('user_id', uniqueUserIds);

        // Compute unread counts using receipts/last_read_at
        const { data: receipts } = await supabase
          .from('message_receipts')
          .select('message_id, user_id, status, created_at')
          .in('message_id', (messages ?? []).map(m => m.id));

        const latestByConv = new Map<string, { msg: any }>();
        (messages ?? []).forEach(m => {
          if (!latestByConv.has(m.conversation_id)) latestByConv.set(m.conversation_id, { msg: m });
        });

        const archivedMap = new Map((conversations ?? []).map(c => [c.conversation_id, c.archived] as const));

        const list: ConversationListItem[] = (conversationIds).map(cid => {
          const latest = latestByConv.get(cid)?.msg;
          const convParticipants = (allParticipants ?? []).filter(p => p.conversation_id === cid);
          const otherUserId = convParticipants.find(p => p.user_id !== user.id)?.user_id;
          const prof = (profiles ?? []).find(p => p.user_id === otherUserId);
          const name = prof ? `${prof.first_name ?? ''} ${prof.last_name ?? ''}`.trim() || 'Conversation' : 'Conversation';
          const unreadCount = 0; // TODO: compute from receipts + last_read_at
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

  useEffect(() => {
    if (showNewConversation) {
      loadAvailableUsers();
    }
  }, [showNewConversation]);

  const loadAvailableUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current user's profile to determine their role
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      let query = supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, email, role, avatar_url')
        .neq('user_id', user.id);

      // If current user is a patient, show dentists
      // If current user is a dentist, show all users (patients and other dentists)
      if (currentProfile?.role === 'patient') {
        query = query.eq('role', 'dentist');
      }

      const { data: profiles } = await query;

      const users: UserOption[] = (profiles || []).map(p => ({
        id: p.user_id,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email,
        email: p.email,
        role: p.role,
        avatar_url: p.avatar_url
      }));

      setAvailableUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load available users",
        variant: "destructive"
      });
    }
  };

  const createConversation = async (otherUserId: string) => {
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          title: null
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add both participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: user.id },
          { conversation_id: conversation.id, user_id: otherUserId }
        ]);

      if (participantsError) throw participantsError;

      // Send initial message
      const otherUser = availableUsers.find(u => u.id === otherUserId);
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          content: `Hi ${otherUser?.name || 'there'}! 👋`,
          type: 'text'
        });

      if (messageError) throw messageError;

      toast({
        title: "Success",
        description: "Conversation started successfully!"
      });

      setShowNewConversation(false);
      onOpenConversation(conversation.id);
      
      // Refresh conversations list
      window.location.reload();
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return availableUsers;
    const search = userSearch.toLowerCase();
    return availableUsers.filter(user => 
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search)
    );
  }, [availableUsers, userSearch]);

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

  const toggleArchive = async (conversationId: string, archived: boolean) => {
    if (!currentUserId) return;
    await supabase
      .from('conversation_participants')
      .update({ archived: !archived })
      .eq('conversation_id', conversationId)
      .eq('user_id', currentUserId);
    setItems(prev => prev.map(i => i.id === conversationId ? { ...i, archived: !archived } : i));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h2 className="font-semibold text-lg">Messages</h2>
        </div>
        <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Start New Conversation</DialogTitle>
              <DialogDescription>
                Choose someone to start a conversation with.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredUsers.map((user) => (
                  <Card key={user.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                    <CardContent 
                      className="p-3 flex items-center gap-3"
                      onClick={() => createConversation(user.id)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {userSearch ? 'No users found' : 'No users available'}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Search conversations…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-1">
          <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All</Button>
          <Button variant={filter === 'unread' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('unread')}>Unread</Button>
          <Button variant={filter === 'archived' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('archived')}>Archived</Button>
        </div>
      </div>
      <div className="space-y-2">
        {loading && (
          <Card><CardContent className="p-4">Loading…</CardContent></Card>
        )}
        {!loading && filtered.map(item => (
          <Card key={item.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => onOpenConversation(item.id)}>
                <Avatar>
                  <AvatarImage src={item.otherUserAvatar ?? undefined} />
                  <AvatarFallback>{item.otherUserName.split(' ').map(p => p[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{item.otherUserName}</p>
                    {item.lastTimestamp && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.lastTimestamp).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{item.lastMessage ?? 'No messages yet'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.unreadCount > 0 && (
                  <Badge variant="destructive">{item.unreadCount}</Badge>
                )}
                <Button variant="ghost" size="sm" onClick={() => toggleArchive(item.id, item.archived || false)}>
                  {item.archived ? 'Unarchive' : 'Archive'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && filtered.length === 0 && (
          <Card><CardContent className="p-6 text-center text-muted-foreground">No conversations</CardContent></Card>
        )}
      </div>
    </div>
  );
}