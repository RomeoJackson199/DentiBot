import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  profileId: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  businessId: string;
}

interface ConversationListProps {
  currentUserId: string;
  onSelectRecipient: (recipient: { id: string; name: string; businessId: string }) => void;
}

export function ConversationList({ currentUserId, onSelectRecipient }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
    setupRealtimeSubscription();
  }, [currentUserId]);

  const loadConversations = async () => {
    try {
      // Get current user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', currentUserId)
        .single();

      if (!profile) return;
      setCurrentProfileId(profile.id);

      // Get all messages involving this user
      const { data: messages } = await supabase
        .from('messages')
        .select(`
          id,
          sender_profile_id,
          recipient_profile_id,
          message_text,
          created_at,
          is_read,
          business_id
        `)
        .or(`sender_profile_id.eq.${profile.id},recipient_profile_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (!messages) return;

      // Group by conversation partner
      const conversationMap = new Map<string, Conversation>();

      for (const msg of messages) {
        const partnerId = msg.sender_profile_id === profile.id 
          ? msg.recipient_profile_id 
          : msg.sender_profile_id;

        if (!conversationMap.has(partnerId)) {
          // Get partner profile info
          const { data: partnerProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', partnerId)
            .single();

          const partnerName = partnerProfile 
            ? `${partnerProfile.first_name || ''} ${partnerProfile.last_name || ''}`.trim() || 'Unknown'
            : 'Unknown';

          // Count unread messages from this partner
          const unreadCount = messages.filter(
            m => m.sender_profile_id === partnerId && 
                 m.recipient_profile_id === profile.id && 
                 !m.is_read
          ).length;

          conversationMap.set(partnerId, {
            profileId: partnerId,
            name: partnerName,
            lastMessage: msg.message_text,
            lastMessageTime: msg.created_at,
            unreadCount,
            businessId: msg.business_id
          });
        }
      }

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return <div className="p-4">Loading conversations...</div>;
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No conversations yet</p>
        <p className="text-sm mt-2">Start a conversation with your dentist or patients</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {conversations.map((conv) => (
          <button
            key={conv.profileId}
            onClick={() => onSelectRecipient({ 
              id: conv.profileId, 
              name: conv.name,
              businessId: conv.businessId
            })}
            className="w-full p-3 rounded-lg hover:bg-accent transition-colors text-left"
          >
            <div className="flex items-start gap-3">
              <Avatar>
                <AvatarFallback>
                  {conv.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold truncate">{conv.name}</span>
                  {conv.unreadCount > 0 && (
                    <Badge variant="default" className="rounded-full px-2 py-0.5 text-xs">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: true })}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
