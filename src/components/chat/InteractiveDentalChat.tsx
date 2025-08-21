import { useEffect, useRef, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User as UserIcon } from "lucide-react";
import { ChatMessage } from "@/types/chat";
import { PrivacyConsentWidget } from "./InteractiveChatWidgets";

interface InteractiveDentalChatProps {
  user: User | null;
  triggerBooking?: "low" | "medium" | "high" | "emergency" | false;
  onBookingTriggered?: () => void;
}

export const InteractiveDentalChat = ({ user }: InteractiveDentalChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId] = useState(() => crypto.randomUUID());
  const [showConsent, setShowConsent] = useState(!user);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        message: `Hello! 👋 I'm your dental assistant. How can I help you today?`,
        is_bot: true,
        message_type: "text",
        created_at: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    }
  }, [user, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addBotMessage = (message: string) => {
    const botMessage: ChatMessage = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      message,
      is_bot: true,
      message_type: "text",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, botMessage]);
  };

  const handleConsent = (accepted: boolean) => {
    if (accepted) {
      setShowConsent(false);
      addBotMessage(
        "Welcome to First Smile AI! 🎉 Please log in to access all features."
      );
    } else {
      addBotMessage("Please log in to use First Smile AI.");
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      message: inputMessage,
      is_bot: false,
      message_type: "text",
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    // Very simple echo-style reply to keep UX functional without widgets
    setTimeout(() => {
      addBotMessage(
        "Thanks for your message. Describe your symptoms and I’ll guide you."
      );
    }, 300);
  };

  if (showConsent && !user) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-4 flex items-center justify-center">
          <PrivacyConsentWidget
            onAccept={() => handleConsent(true)}
            onDecline={() => handleConsent(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.is_bot ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`flex items-start space-x-2 max-w-md ${
                  message.is_bot ? "" : "flex-row-reverse space-x-reverse"
                }`}
              >
                <div className="flex-shrink-0">
                  {message.is_bot ? (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
                <Card className={`${message.is_bot ? "bg-muted/50" : "bg-primary text-primary-foreground"}`}>
                  <CardContent className="p-3">
                    <div className="text-sm whitespace-pre-wrap">{message.message}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex space-x-2 max-w-4xl mx-auto">
          <Input
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!inputMessage.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}