import { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User as UserIcon } from "lucide-react";
import { ChatMessage } from "@/types/chat";
// import {
//   PrivacyConsentWidget,
//   QuickActionsWidget,
// } from "./InteractiveChatWidgets"; // DISABLED - component deleted due to type errors

interface NewInteractiveDentalChatProps {
  user: User | null;
}

export const NewInteractiveDentalChat = ({ user }: NewInteractiveDentalChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId] = useState(() => crypto.randomUUID());
  const [showConsent, setShowConsent] = useState(!user);
  const [activeWidget, setActiveWidget] = useState<string | null>(null);
  
  const { t } = useLanguage();
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
      setTimeout(() => setActiveWidget('quick-actions'), 1000);
    }
  }, [user, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeWidget]);

  const addBotMessage = (message: string) => {
    const botMessage: ChatMessage = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      message,
      is_bot: true,
      message_type: "text",
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, botMessage]);
  };

  const handleConsent = (accepted: boolean) => {
    if (accepted) {
      setShowConsent(false);
      addBotMessage("Welcome to First Smile AI! 🎉 Please log in to access all features.");
    } else {
      addBotMessage("Please log in to use First Smile AI.");
    }
  };

  const handleQuickAction = (action: string) => {
    setActiveWidget(null);
    
    if (!user) {
      addBotMessage("Please log in to access this feature. You can find the login button at the top right.");
      return;
    }

    switch (action) {
      case 'appointments':
        addBotMessage("I'll show your appointments here when the backend is connected.");
        break;
      case 'earliest':
        addBotMessage("I'll help you find the earliest available slot when the booking system is connected.");
        break;
      case 'emergency':
        addBotMessage("For emergencies, please call the clinic directly or visit the emergency room.");
        break;
      case 'help':
        addBotMessage(`Here's what I can help with:\n\n🗓️ Book appointments\n📱 Manage your bookings\n❓ Answer questions\n⚙️ Update settings\n\nJust type what you need!`);
        break;
    }
    
    setTimeout(() => setActiveWidget('quick-actions'), 2000);
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

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setActiveWidget(null);

    setTimeout(() => {
      addBotMessage("I'm here to help! Here are some quick actions:");
      setTimeout(() => setActiveWidget('quick-actions'), 1000);
    }, 500);
  };

  if (showConsent && !user) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-4 flex items-center justify-center">
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-4">Privacy Notice</h3>
              <p className="text-sm text-muted-foreground mb-4">
                By continuing, you agree to our privacy policy and terms of service.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => handleConsent(true)}>Accept</Button>
                <Button variant="outline" onClick={() => handleConsent(false)}>Decline</Button>
              </div>
            </CardContent>
          </Card>
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
              <div className={`flex items-start space-x-2 max-w-md ${
                message.is_bot ? "" : "flex-row-reverse space-x-reverse"
              }`}>
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
          
          {activeWidget === 'quick-actions' && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleQuickAction('appointments')}>
                    My Appointments
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleQuickAction('earliest')}>
                    Book Earliest
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleQuickAction('emergency')}>
                    Emergency
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleQuickAction('help')}>
                    Help
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex space-x-2 max-w-4xl mx-auto">
          <Input
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!inputMessage.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};