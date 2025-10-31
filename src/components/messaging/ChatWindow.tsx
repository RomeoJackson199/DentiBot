import { useState, useEffect, useRef } from 'react';
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Check, CheckCheck, Clock } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

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
  const [isOnline] = useState(Math.random() > 0.5); // Mock online status

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
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', currentUserId)
      .single();

    if (profile) {
      setCurrentProfileId(profile.id);
    }
  };

  const loadMessages = async () => {
    if (!currentProfileId) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_profile_id.eq.${currentProfileId},recipient_profile_id.eq.${recipient.id}),and(sender_profile_id.eq.${recipient.id},recipient_profile_id.eq.${currentProfileId})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`chat-${currentProfileId}-${recipient.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_profile_id=eq.${currentProfileId}`
        },
        (payload) => {
          if (payload.new.sender_profile_id === recipient.id) {
            setMessages((prev) => [...prev, payload.new as Message]);
            markMessagesAsRead();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markMessagesAsRead = async () => {
    if (!currentProfileId) return;

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('recipient_profile_id', currentProfileId)
      .eq('sender_profile_id', recipient.id)
      .eq('is_read', false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentProfileId || sending) return;

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
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
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
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

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  const groupedMessages = messages.reduce((groups, message) => {
    const date = format(new Date(message.created_at), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4 flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Avatar className="h-10 w-10 border-2 border-primary/10">
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
              {recipient.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{recipient.name}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className={cn(
                "inline-block w-2 h-2 rounded-full",
                isOnline ? "bg-green-500" : "bg-gray-400"
              )} />
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date} className="space-y-4">
              {/* Date divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-medium px-3 py-1 rounded-full bg-muted/50">
                  {formatMessageDate(msgs[0].created_at)}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <AnimatePresence initial={false}>
                {msgs.map((msg, index) => {
                  const isOwnMessage = msg.sender_profile_id === currentProfileId;
                  const showAvatar = index === 0 || msgs[index - 1].sender_profile_id !== msg.sender_profile_id;
                  
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'flex gap-3 items-end',
                        isOwnMessage ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {!isOwnMessage && (
                        <div className="w-8 shrink-0">
                          {showAvatar && (
                            <Avatar className="h-8 w-8 border border-border">
                              <AvatarFallback className="bg-muted text-xs">
                                {recipient.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}
                      
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={cn(
                          'group relative max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm',
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-card border rounded-bl-sm'
                        )}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {msg.message_text}
                        </p>
                        <div className={cn(
                          "flex items-center gap-1 mt-1 text-xs",
                          isOwnMessage ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"
                        )}>
                          <span>{format(new Date(msg.created_at), 'HH:mm')}</span>
                          {isOwnMessage && (
                            msg.is_read ? (
                              <CheckCheck className="h-3 w-3" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )
                          )}
                        </div>
                      </motion.div>

                      {isOwnMessage && <div className="w-8" />}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border bg-background shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-end gap-3 p-3">
              <Textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={handleTextareaInput}
                placeholder="Type your message..."
                disabled={sending}
                className="min-h-[44px] max-h-40 resize-none border-0 bg-transparent px-3 py-2 text-sm leading-relaxed shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
                rows={1}
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                size="icon"
                className="shrink-0 h-10 w-10 rounded-xl"
              >
                {sending ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
