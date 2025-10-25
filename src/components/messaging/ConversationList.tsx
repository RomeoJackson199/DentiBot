import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { getCurrentBusinessId } from '@/lib/businessUtils';

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
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [availableContacts, setAvailableContacts] = useState<{ id: string; name: string; businessId: string }[]>([]);
  const [isDentist, setIsDentist] = useState(false);
  const [roleDetected, setRoleDetected] = useState(false);
  const [businessError, setBusinessError] = useState<string | null>(null);

  useEffect(() => {
    detectRoleAndLoad();
  }, [currentUserId]);

  const detectRoleAndLoad = async () => {
    setLoading(true);
    setBusinessError(null);
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', currentUserId)
        .single();

      if (!profile) {
        console.debug('[ConversationList] No profile found');
        setLoading(false);
        return;
      }

      console.debug('[ConversationList] Profile loaded:', profile.id);

      const { data: dentistData } = await supabase
        .from('dentists')
        .select('id, is_active')
        .eq('profile_id', profile.id)
        .maybeSingle();

      const isDentistUser = !!dentistData && dentistData.is_active;
      setIsDentist(isDentistUser);
      setRoleDetected(true);

      console.debug('[ConversationList] Role detected:', isDentistUser ? 'dentist' : 'patient');

      await Promise.all([
        loadConversations(profile.id),
        loadAvailableContacts(profile.id, isDentistUser)
      ]);

      setupRealtimeSubscription(profile.id);
    } catch (error) {
      console.error('[ConversationList] Error in detectRoleAndLoad:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async (profileId: string) => {
    try {
      console.debug('[ConversationList] Loading conversations for profile:', profileId);

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('sender_profile_id, recipient_profile_id, message_text, created_at, is_read, business_id')
        .or(`sender_profile_id.eq.${profileId},recipient_profile_id.eq.${profileId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.debug('[ConversationList] Messages loaded:', messagesData?.length || 0);

      const conversationMap = new Map<string, any>();
      
      messagesData?.forEach(msg => {
        const partnerId = msg.sender_profile_id === profileId 
          ? msg.recipient_profile_id 
          : msg.sender_profile_id;
        
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            profileId: partnerId,
            lastMessage: msg.message_text,
            lastMessageTime: msg.created_at,
            businessId: msg.business_id,
            unreadCount: 0
          });
        }

        if (msg.recipient_profile_id === profileId && !msg.is_read) {
          conversationMap.get(partnerId).unreadCount++;
        }
      });

      const partnerIds = Array.from(conversationMap.keys());
      if (partnerIds.length === 0) {
        setConversations([]);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', partnerIds);

      const convos = profiles?.map(p => {
        const conv = conversationMap.get(p.id);
        return {
          profileId: p.id,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'User',
          lastMessage: conv.lastMessage,
          lastMessageTime: conv.lastMessageTime,
          unreadCount: conv.unreadCount,
          businessId: conv.businessId
        };
      }) || [];

      setConversations(convos);
      console.debug('[ConversationList] Conversations set:', convos.length);
    } catch (error) {
      console.error('[ConversationList] Error loading conversations:', error);
    }
  };

  const loadAvailableContacts = async (profileId: string, isDentistUser: boolean) => {
    try {
      console.debug('[ConversationList] Loading contacts for role:', isDentistUser ? 'dentist' : 'patient');
      setAvailableContacts([]);
      setBusinessError(null);

      if (!isDentistUser) {
        // PATIENT: Load dentists from appointments
        const { data: appointments, error: apptErr } = await supabase
          .from('appointments')
          .select('dentist_id, business_id')
          .eq('patient_id', profileId);

        if (apptErr) throw apptErr;

        console.debug('[ConversationList] Patient appointments:', appointments?.length || 0);

        if (!appointments || appointments.length === 0) {
          console.debug('[ConversationList] No appointments found for patient');
          return;
        }

        const dentistIds = Array.from(new Set(appointments.map(a => a.dentist_id).filter(Boolean)));
        if (dentistIds.length === 0) return;

        const dentistBusinessMap = new Map<string, string>();
        appointments.forEach(a => {
          if (a.dentist_id && a.business_id && !dentistBusinessMap.has(a.dentist_id)) {
            dentistBusinessMap.set(a.dentist_id, a.business_id);
          }
        });

        const { data: dentists, error: dentErr } = await supabase
          .from('dentists')
          .select('id, profile_id')
          .in('id', dentistIds);

        if (dentErr) throw dentErr;
        if (!dentists || dentists.length === 0) return;

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

        const contacts = dentists
          .map(d => ({
            id: d.profile_id,
            name: profileNameMap.get(d.profile_id) || 'Dentist',
            businessId: dentistBusinessMap.get(d.id) || ''
          }))
          .filter(c => !!c.id && !!c.businessId);

        console.debug('[ConversationList] Patient contacts loaded:', contacts.length);
        setAvailableContacts(contacts);

      } else {
        // DENTIST: Load patients from appointments
        const { data: dentistData, error: dentistErr } = await supabase
          .from('dentists')
          .select('id')
          .eq('profile_id', profileId)
          .single();

        if (dentistErr) throw dentistErr;
        if (!dentistData) return;

        const { data: appointments, error: apptErr } = await supabase
          .from('appointments')
          .select('patient_id, business_id')
          .eq('dentist_id', dentistData.id);

        if (apptErr) throw apptErr;

        console.debug('[ConversationList] Dentist appointments:', appointments?.length || 0);

        if (!appointments || appointments.length === 0) {
          // Fallback: Try to get current business and load all accessible patients
          try {
            const businessId = await getCurrentBusinessId();
            console.debug('[ConversationList] Using business fallback:', businessId);

            const { data: profilesData, error: profErr } = await supabase
              .from('profiles')
              .select('id, first_name, last_name')
              .limit(50);

            if (profErr) throw profErr;

            const contacts = (profilesData || [])
              .filter(p => p.id !== profileId)
              .map(p => ({
                id: p.id,
                name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Patient',
                businessId: businessId
              }));

            console.debug('[ConversationList] Dentist contacts (fallback):', contacts.length);
            setAvailableContacts(contacts);
          } catch (bizErr: any) {
            console.warn('[ConversationList] Business fallback failed:', bizErr);
            setBusinessError('Please select a clinic to view patients');
          }
          return;
        }

        const patientIds = Array.from(new Set(appointments.map(a => a.patient_id).filter(Boolean)));
        if (patientIds.length === 0) return;

        const patientBusinessMap = new Map<string, string>();
        appointments.forEach(a => {
          if (a.patient_id && a.business_id && !patientBusinessMap.has(a.patient_id)) {
            patientBusinessMap.set(a.patient_id, a.business_id);
          }
        });

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

        console.debug('[ConversationList] Dentist contacts loaded:', contacts.length);
        setAvailableContacts(contacts);
      }
    } catch (error) {
      console.error('[ConversationList] Error loading available contacts:', error);
    }
  };

  const setupRealtimeSubscription = (profileId: string) => {
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
          detectRoleAndLoad();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h2 className="font-semibold">Messages</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={detectRoleAndLoad}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
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
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : businessError ? (
          <div className="p-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{businessError}</AlertDescription>
            </Alert>
          </div>
        ) : showNewConversation ? (
          <div className="p-2">
            <div className="mb-3 px-2 flex justify-between items-center">
              <span className="text-sm font-medium">New conversation</span>
              <Button variant="ghost" size="sm" onClick={() => setShowNewConversation(false)}>
                Cancel
              </Button>
            </div>
            <div className="space-y-1">
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
          </div>
        ) : conversations.length > 0 ? (
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
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium mb-2">No conversations yet</p>
            <p className="text-xs mb-4">
              {roleDetected ? (
                isDentist 
                  ? 'Your patients will appear here once you have appointments' 
                  : 'Your dentists will appear here once you book appointments'
              ) : 'Loading...'}
            </p>
            {availableContacts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewConversation(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Start New Conversation
              </Button>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
