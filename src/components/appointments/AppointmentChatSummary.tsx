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
          
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.is_bot ? "justify-start" : "justify-end"
                  )}
                >
                  {message.is_bot && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      message.is_bot
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    <p className={cn(
                      "text-xs mt-1",
                      message.is_bot ? "text-muted-foreground" : "text-primary-foreground/70"
                    )}>
                      {format(new Date(message.created_at), 'p')}
                    </p>
                  </div>
                  
                  {!message.is_bot && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-4 h-4 text-secondary-foreground" />
                      </div>
                    </div>
                  )}
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