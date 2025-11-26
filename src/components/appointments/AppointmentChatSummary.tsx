import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Bot, User, MessageSquare, Calendar } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  message: string;
  is_bot: boolean;
  created_at: string;
}

interface AppointmentChatSummaryProps {
  appointmentId: string;
}

export function AppointmentChatSummary({ appointmentId }: AppointmentChatSummaryProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChatMessages();
  }, [appointmentId]);

  const fetchChatMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, message, is_bot, created_at')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (messages.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Patient AI Conversation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Conversation from {format(new Date(messages[0].created_at), 'PPP')}</span>
          </div>
          
          <ScrollArea className="h-[400px] pr-4 bg-gradient-to-b from-background to-muted/20">
            <div className="space-y-4 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                    message.is_bot ? "justify-start" : "justify-end"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-start gap-3 max-w-[85%]",
                      !message.is_bot && "flex-row-reverse"
                    )}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 mt-1">
                      {message.is_bot ? (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 shadow-sm">
                          <Bot className="w-5 h-5 text-primary" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary/80 to-secondary flex items-center justify-center shadow-sm">
                          <User className="w-5 h-5 text-secondary-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Message Bubble */}
                    <Card
                      className={cn(
                        "border-none shadow-md",
                        message.is_bot
                          ? "bg-card/80 backdrop-blur-sm"
                          : "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground"
                      )}
                    >
                      <CardContent className="p-4">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>
                        <p className={cn(
                          "text-xs mt-2",
                          message.is_bot ? "text-muted-foreground" : "text-primary-foreground/70"
                        )}>
                          {format(new Date(message.created_at), 'p')}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="pt-3 border-t">
            <Badge variant="secondary" className="text-xs">
              {messages.length} messages in conversation
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}