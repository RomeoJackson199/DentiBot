import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

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
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [availableContacts, setAvailableContacts] = useState<Array<{ id: string; name: string; businessId: string }>>([]);
  const { isDentist, isPatient } = useUserRole();

  useEffect(() => {
    loadConversations();
    loadAvailableContacts();
    setupRealtimeSubscription();
  }, [currentUserId, isDentist, isPatient]);

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

  const loadAvailableContacts = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', currentUserId)
        .single();

      if (!profile) return;

      // Reset before loading
      setAvailableContacts([]);

      if (isPatient) {
        // 1) Get patient's appointments -> dentist_ids + business_ids
        const { data: appointments, error: apptErr } = await supabase
          .from('appointments')
          .select('dentist_id, business_id')
          .eq('patient_id', profile.id);
        if (apptErr) throw apptErr;
        if (!appointments || appointments.length === 0) return;

        const dentistIds = Array.from(new Set(appointments.map(a => a.dentist_id).filter(Boolean)));
        if (dentistIds.length === 0) return;

        // 2) Map dentist_id -> business_id (first seen)
        const dentistBusinessMap = new Map<string, string>();
        appointments.forEach(a => {
          if (a.dentist_id && a.business_id && !dentistBusinessMap.has(a.dentist_id)) {
            dentistBusinessMap.set(a.dentist_id, a.business_id);
          }
        });

        // 3) Fetch dentists -> profile_id
        const { data: dentists, error: dentErr } = await supabase
          .from('dentists')
          .select('id, profile_id')
          .in('id', dentistIds);
        if (dentErr) throw dentErr;
        if (!dentists || dentists.length === 0) return;

        // 4) Fetch profiles for those profile_ids -> names
        const profileIds = dentists.map(d => d.profile_id).filter(Boolean);
        const { data: profilesData, error: profErr } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', profileIds);
        if (profErr) throw profErr;

        const profileNameMap = new Map<string, string>();
        profilesData?.forEach(p => {
          const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Dentist';
          profileNameMap.set(p.id, name);
        });

        // 5) Build contacts using dentist.profile_id as id and business from appointments
        const contacts = dentists
          .map(d => ({
            id: d.profile_id,
            name: profileNameMap.get(d.profile_id) || 'Dentist',
            businessId: dentistBusinessMap.get(d.id) || ''
          }))
          .filter(c => !!c.id && !!c.businessId);

        setAvailableContacts(contacts);
      } else if (isDentist) {
        // 1) Get current dentist id from profile
        const { data: dentistData, error: dentistErr } = await supabase
          .from('dentists')
          .select('id')
          .eq('profile_id', profile.id)
          .single();
        if (dentistErr) throw dentistErr;
        if (!dentistData) return;

        // 2) Get appointments for this dentist -> patient_ids + business_ids
        const { data: appointments, error: apptErr } = await supabase
          .from('appointments')
          .select('patient_id, business_id')
          .eq('dentist_id', dentistData.id);
        if (apptErr) throw apptErr;
        if (!appointments || appointments.length === 0) return;

        const patientIds = Array.from(new Set(appointments.map(a => a.patient_id).filter(Boolean)));
        if (patientIds.length === 0) return;

        // Map patient_id -> business_id (first seen)
        const patientBusinessMap = new Map<string, string>();
        appointments.forEach(a => {
          if (a.patient_id && a.business_id && !patientBusinessMap.has(a.patient_id)) {
            patientBusinessMap.set(a.patient_id, a.business_id);
          }
        });

        // 3) Fetch profiles for patients -> names
        const { data: profilesData, error: profErr } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', patientIds);
        if (profErr) throw profErr;

        const contacts = (profilesData || []).map(p => ({
          id: p.id,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Patient',
          businessId: patientBusinessMap.get(p.id) || ''
        })).filter(c => !!c.businessId);

        setAvailableContacts(contacts);
      }
    } catch (error) {
      console.error('Error loading available contacts:', error);
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
          loadAvailableContacts();
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

  if (conversations.length === 0 && !showNewConversation) {
    return (
      <div className="p-4">
        <div className="text-center text-muted-foreground mb-4">
          <p>No conversations yet</p>
          <p className="text-sm mt-2">Start a conversation with {isPatient ? 'your dentist' : 'your patients'}</p>
        </div>
        {availableContacts.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium px-2">Available contacts:</p>
            <ScrollArea className="h-[400px]">
              {availableContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => onSelectRecipient(contact)}
                  className="w-full p-3 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="font-medium">{contact.name}</span>
                      <p className="text-xs text-muted-foreground">Start conversation</p>
                    </div>
                  </div>
                </button>
              ))}
            </ScrollArea>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            No contacts available yet. {isPatient ? 'Book an appointment to message your dentist.' : 'You will see patients here once they book appointments.'}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="font-semibold">Messages</h3>
        {availableContacts.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNewConversation(!showNewConversation)}
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        )}
      </div>

      {showNewConversation ? (
        <div className="flex-1 overflow-hidden">
          <div className="p-3 border-b flex items-center justify-between">
            <span className="text-sm font-medium">New conversation</span>
            <Button variant="ghost" size="sm" onClick={() => setShowNewConversation(false)}>
              Cancel
            </Button>
          </div>
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {availableContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => {
                    onSelectRecipient(contact);
                    setShowNewConversation(false);
                  }}
                  className="w-full p-3 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="font-medium">{contact.name}</span>
                      <p className="text-xs text-muted-foreground">Start conversation</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <ScrollArea className="flex-1">
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
      )}
    </div>
  );
}
