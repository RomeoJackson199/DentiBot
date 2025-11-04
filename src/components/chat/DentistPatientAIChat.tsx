import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User as UserIcon, Info } from "lucide-react";
import { ChatMessage } from "@/types/chat";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DentistPatientAIChatProps {
  patientId: string;
  dentistId: string;
  patientName: string;
}

export const DentistPatientAIChat = ({
  patientId,
  dentistId,
  patientName
}: DentistPatientAIChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    initializeChat();
  }, [patientId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const initializeChat = () => {
    const welcomeMessage: ChatMessage = {
      id: crypto.randomUUID(),
      session_id: sessionId as any,
      message: `Hello! I'm here to help you understand ${patientName}'s medical history, appointments, and treatment plans. What would you like to know?`,
      is_bot: true,
      message_type: "text",
      created_at: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
  };

  const addBotMessage = (message: string, type: 'text' | 'success' | 'info' | 'warning' = 'text') => {
    const botMessage: ChatMessage = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      message,
      is_bot: true,
      message_type: type,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, botMessage]);
  };

  const generateBotResponse = async (
    userMessage: string,
    history: ChatMessage[]
  ): Promise<ChatMessage> => {
    try {
      // Call the AI backend with patient and dentist context
      const aiResponse = await supabase.functions.invoke('dental-ai-chat', {
        body: {
          message: userMessage,
          conversation_history: history,
          patient_id: patientId,
          dentist_id: dentistId,
          context_type: 'dentist_patient_query',
          patient_name: patientName
        }
      });

      if (aiResponse.error) {
        console.error('AI function error:', aiResponse.error);
        if (!aiResponse.data) {
          throw aiResponse.error;
        }
      }

      const serverData = (aiResponse as any).data || {};
      const responseText = serverData.response || serverData.fallback_response || "";

      if (!responseText) {
        throw new Error('Empty AI response');
      }

      return {
        id: crypto.randomUUID(),
        session_id: sessionId as any,
        message: responseText,
        is_bot: true,
        message_type: 'text',
        created_at: new Date().toISOString(),
      } as ChatMessage;
    } catch (error) {
      console.error('Error generating AI response:', error);
      return {
        id: crypto.randomUUID(),
        session_id: sessionId as any,
        message: "I'm sorry, I couldn't process your request. Please try again or check the patient's records directly.",
        is_bot: true,
        message_type: 'text',
        created_at: new Date().toISOString(),
      } as ChatMessage;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      message: inputMessage,
      is_bot: false,
      message_type: "text",
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    const history = [...messages, userMessage].slice(-10);
    const botResponse = await generateBotResponse(userMessage.message, history);

    setMessages(prev => [...prev, botResponse]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-base">AI Patient Assistant</h3>
        </div>
        <span className="text-xs text-muted-foreground">Analyzing: {patientName}</span>
      </div>

      {/* Info Banner */}
      <Alert className="m-3 mb-0">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Ask me about this patient's appointments, treatment plans, medical history, prescriptions, or payment status. I have access to all their records.
        </AlertDescription>
      </Alert>

      {/* Quick Questions */}
      <div className="p-3 border-b bg-muted/30">
        <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => handleQuickQuestion("Show me all upcoming appointments")}
          >
            Upcoming appointments
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => handleQuickQuestion("What are the active treatment plans?")}
          >
            Treatment plans
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => handleQuickQuestion("What's the medical history?")}
          >
            Medical history
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => handleQuickQuestion("Any outstanding payments?")}
          >
            Payment status
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-background to-muted/20">
        <div className="space-y-4 pb-4">
          {messages.map((message) => {
            const timestamp = message.created_at ? new Date(message.created_at) : null;
            const timestampAlignment = message.is_bot
              ? "self-start text-left"
              : "self-end text-right";

            return (
              <div
                key={message.id}
                className={`flex ${message.is_bot ? "justify-start" : "justify-end"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`flex items-start gap-3 max-w-[85%] ${
                    message.is_bot ? "" : "flex-row-reverse"
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {message.is_bot ? (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 shadow-sm">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary/80 to-secondary flex items-center justify-center shadow-sm">
                        <UserIcon className="w-4 h-4 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                  <Card className={`border-none shadow-md ${
                    message.is_bot
                      ? "bg-card/80 backdrop-blur-sm"
                      : "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground"
                  }`}>
                    <CardContent className="p-3 flex flex-col gap-2">
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</div>
                      {timestamp && (
                        <time
                          dateTime={timestamp.toISOString()}
                          title={format(timestamp, "PPpp")}
                          className={`text-xs opacity-70 ${timestampAlignment}`}
                        >
                          {format(timestamp, "p")}
                        </time>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 shadow-sm">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <Card className="bg-card/80 backdrop-blur-sm border-none shadow-md">
                  <CardContent className="p-3">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-card/50 backdrop-blur-sm p-3">
        <div className="flex gap-2">
          <Input
            placeholder="Ask about this patient..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-background/50 border-input/50 focus:border-primary transition-colors text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="icon"
            className="h-9 w-9 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
