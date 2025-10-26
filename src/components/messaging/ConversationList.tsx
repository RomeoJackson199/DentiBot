import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Plus, RefreshCw, AlertCircle, Search } from 'lucide-react';
import { getCurrentBusinessId } from '@/lib/businessUtils';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  const [searchQuery, setSearchQuery] = useState('');

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

      const { data: dentistData } = await supabase
        .from('dentists')
        .select('id, is_active')
        .eq('profile_id', profile.id)
        .maybeSingle();

      const isDentistUser = !!dentistData && dentistData.is_active;
      setIsDentist(isDentistUser);
      setRoleDetected(true);

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
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('sender_profile_id, recipient_profile_id, message_text, created_at, is_read, business_id')
        .or(`sender_profile_id.eq.${profileId},recipient_profile_id.eq.${profileId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

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
    } catch (error) {
      console.error('[ConversationList] Error loading conversations:', error);
    }
  };

  const loadAvailableContacts = async (profileId: string, isDentistUser: boolean) => {
    try {
      setAvailableContacts([]);
      setBusinessError(null);

      if (!isDentistUser) {
        const { data: appointments } = await supabase
          .from('appointments')
          .select('dentist_id, business_id')
          .eq('patient_id', profileId);

        if (!appointments || appointments.length === 0) return;

        const dentistIds = Array.from(new Set(appointments.map(a => a.dentist_id).filter(Boolean)));
        if (dentistIds.length === 0) return;

        const dentistBusinessMap = new Map<string, string>();
        appointments.forEach(a => {
          if (a.dentist_id && a.business_id && !dentistBusinessMap.has(a.dentist_id)) {
            dentistBusinessMap.set(a.dentist_id, a.business_id);
          }
        });

        const { data: dentists } = await supabase
          .from('dentists')
          .select('id, profile_id')
          .in('id', dentistIds);

        if (!dentists || dentists.length === 0) return;

        const profileIds = dentists.map(d => d.profile_id).filter(Boolean);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', profileIds);

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

        setAvailableContacts(contacts);

      } else {
        const { data: dentistData } = await supabase
          .from('dentists')
          .select('id')
          .eq('profile_id', profileId)
          .single();

        if (!dentistData) return;

        const { data: appointments } = await supabase
          .from('appointments')
          .select('patient_id, business_id')
          .eq('dentist_id', dentistData.id);

        if (!appointments || appointments.length === 0) {
          try {
            const businessId = await getCurrentBusinessId();
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('id, first_name, last_name')
              .limit(50);

            const contacts = (profilesData || [])
              .filter(p => p.id !== profileId)
              .map(p => ({
                id: p.id,
                name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Patient',
                businessId: businessId
              }));

            setAvailableContacts(contacts);
          } catch (bizErr: any) {
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

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', patientIds);

        const contacts = (profilesData || []).map(p => ({
          id: p.id,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Patient',
          businessId: patientBusinessMap.get(p.id) || ''
        })).filter(c => !!c.businessId);

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

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = availableContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-background to-muted/10">
      {/* Header */}
      <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold">Messages</h2>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={detectRoleAndLoad}
              disabled={loading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            {availableContacts.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNewConversation(!showNewConversation)}
                className="h-8 w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-muted/50"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
            </div>
          </div>
        ) : businessError ? (
          <div className="p-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{businessError}</AlertDescription>
            </Alert>
          </div>
        ) : showNewConversation ? (
          <div className="p-3">
            <div className="mb-3 flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">New conversation</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewConversation(false)}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
            </div>
            <div className="space-y-1">
              <AnimatePresence>
                {filteredContacts.map((contact) => (
                  <motion.button
                    key={contact.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={() => {
                      onSelectRecipient(contact);
                      setShowNewConversation(false);
                    }}
                    className="w-full p-3 rounded-xl hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-primary/10">
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                          {contact.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <span className="font-medium group-hover:text-primary transition-colors">
                          {contact.name}
                        </span>
                        <p className="text-xs text-muted-foreground">Start conversation</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ) : filteredConversations.length > 0 ? (
          <div className="p-2 space-y-1">
            <AnimatePresence>
              {filteredConversations.map((conv) => (
                <motion.button
                  key={conv.profileId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() =>
                    onSelectRecipient({
                      id: conv.profileId,
                      name: conv.name,
                      businessId: conv.businessId
                    })
                  }
                  className="w-full p-3 rounded-xl hover:bg-primary/5 transition-all text-left group relative"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-primary/10">
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                          {conv.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {conv.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1">
                          <Badge
                            variant="default"
                            className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold animate-pulse"
                          >
                            {conv.unreadCount}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="font-semibold truncate group-hover:text-primary transition-colors">
                          {conv.name}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: true })}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-sm truncate",
                          conv.unreadCount > 0
                            ? "text-foreground font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm font-medium mb-2">No conversations yet</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-[250px] mx-auto">
              {roleDetected
                ? isDentist
                  ? 'Your patients will appear here once you have appointments'
                  : 'Your dentists will appear here once you book appointments'
                : 'Loading...'}
            </p>
            {availableContacts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewConversation(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Start New Conversation
              </Button>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
