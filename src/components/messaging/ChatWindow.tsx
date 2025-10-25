import { useState, useEffect, useRef } from 'react';
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Paperclip, Send, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
interface Message {
  id: string;
  sender_profile_id: string;
  recipient_profile_id: string;
  message_text: string;
  created_at: string;
  is_read: boolean;
}
interface ChatWindowProps {
  currentUserId: string;
  recipient: {
    id: string;
    name: string;
    businessId: string;
  };
  onBack: (() => void) | null;
}
export function ChatWindow({
  currentUserId,
  recipient,
  onBack
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    loadCurrentProfile();
  }, [currentUserId]);
  useEffect(() => {
    if (currentProfileId) {
      loadMessages();
      setupRealtimeSubscription();
      markMessagesAsRead();
    }
  }, [currentProfileId, recipient.id]);
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const loadCurrentProfile = async () => {
    const {
      data: profile
    } = await supabase.from('profiles').select('id').eq('user_id', currentUserId).single();
    if (profile) {
      setCurrentProfileId(profile.id);
    }
  };
  const loadMessages = async () => {
    if (!currentProfileId) return;
    const {
      data,
      error
    } = await supabase.from('messages').select('*').or(`and(sender_profile_id.eq.${currentProfileId},recipient_profile_id.eq.${recipient.id}),and(sender_profile_id.eq.${recipient.id},recipient_profile_id.eq.${currentProfileId})`).order('created_at', {
      ascending: true
    });
    if (error) {
      console.error('Error loading messages:', error);
      return;
    }
    setMessages(data || []);
  };
  const setupRealtimeSubscription = () => {
    const channel = supabase.channel(`chat-${currentProfileId}-${recipient.id}`).on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `recipient_profile_id=eq.${currentProfileId}`
    }, payload => {
      if (payload.new.sender_profile_id === recipient.id) {
        setMessages(prev => [...prev, payload.new as Message]);
        markMessagesAsRead();
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  };
  const markMessagesAsRead = async () => {
    if (!currentProfileId) return;
    await supabase.from('messages').update({
      is_read: true
    }).eq('recipient_profile_id', currentProfileId).eq('sender_profile_id', recipient.id).eq('is_read', false);
  };
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentProfileId || sending) return;
    setSending(true);
    try {
      const {
        error
      } = await supabase.from('messages').insert({
        business_id: recipient.businessId,
        sender_profile_id: currentProfileId,
        recipient_profile_id: recipient.id,
        message_text: newMessage.trim()
      });
      if (error) throw error;
      setNewMessage('');
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };
  const handleKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  const handleTextareaInput = (event: FormEvent<HTMLTextAreaElement>) => {
    const target = event.currentTarget;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
  };
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [newMessage]);
  return <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center gap-3">
        {onBack && <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>}
        <Avatar>
          <AvatarFallback>
            {recipient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{recipient.name}</h3>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map(msg => {
          const isOwnMessage = msg.sender_profile_id === currentProfileId;
          return <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-lg p-3 ${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message_text}</p>
                  <p className={`text-xs mt-1 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {formatDistanceToNow(new Date(msg.created_at), {
                  addSuffix: true
                })}
                  </p>
                </div>
              </div>;
        })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border bg-muted/30 backdrop-blur-sm p-4">
        <div className="mx-auto w-full max-w-3xl">
          <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3 shadow-sm backdrop-blur">
            <div className="flex items-end gap-3">
              <div className="flex-1 min-w-0">
                <Textarea ref={textareaRef} value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={handleKeyDown} onInput={handleTextareaInput} placeholder="Type your message..." className="min-h-[44px] max-h-40 resize-none overflow-y-auto border-0 bg-transparent px-0 py-0 text-sm leading-relaxed shadow-none focus-visible:ring-0 focus-visible:ring-offset-0" rows={1} />
              </div>
              <Button onClick={sendMessage} disabled={!newMessage.trim() || sending} size="icon" aria-label="Send message" className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
          </div>
        </div>
      </div>
    </div>;
}