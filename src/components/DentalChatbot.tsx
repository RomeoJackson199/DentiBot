import { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User as UserIcon, Calendar, Camera, AlertTriangle } from "lucide-react";
import { ChatMessage } from "@/types/chat";
import { UrgencyAssessment } from "@/components/UrgencyAssessment";
import { AppointmentBooking } from "@/components/AppointmentBooking";
import { PhotoUpload } from "@/components/PhotoUpload";

interface DentalChatbotProps {
  user: User;
}

export const DentalChatbot = ({ user }: DentalChatbotProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [currentFlow, setCurrentFlow] = useState<'chat' | 'urgency' | 'booking' | 'photo'>('chat');
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Welcome message
    const welcomeMessage: ChatMessage = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      message: "Bonjour ! Je suis DentiBot, votre assistant dentaire virtuel. Je peux vous aider à prendre rendez-vous, évaluer l'urgence de votre situation, ou répondre à vos questions. Comment puis-je vous aider aujourd'hui ?",
      is_bot: true,
      message_type: "text",
      created_at: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const saveMessage = async (message: ChatMessage) => {
    try {
      await supabase.from("chat_messages").insert({
        session_id: message.session_id,
        user_id: user.id,
        message: message.message,
        is_bot: message.is_bot,
        message_type: message.message_type,
        metadata: message.metadata,
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const generateBotResponse = (userMessage: string): ChatMessage => {
    const lowerMessage = userMessage.toLowerCase();
    let response = "";
    let nextFlow: typeof currentFlow = 'chat';

    if (lowerMessage.includes("rendez-vous") || lowerMessage.includes("rdv") || lowerMessage.includes("appointment")) {
      response = "Je vais vous aider à prendre rendez-vous. Voulez-vous d'abord que j'évalue l'urgence de votre situation ?";
      nextFlow = 'urgency';
    } else if (lowerMessage.includes("douleur") || lowerMessage.includes("mal") || lowerMessage.includes("urgent")) {
      response = "Je comprends que vous avez une douleur. Laissez-moi évaluer l'urgence de votre situation pour vous proposer le bon créneau.";
      nextFlow = 'urgency';
    } else if (lowerMessage.includes("photo") || lowerMessage.includes("image")) {
      response = "Vous pouvez effectivement joindre une photo de la zone concernée pour aider le dentiste. Voulez-vous télécharger une photo ?";
      nextFlow = 'photo';
    } else if (lowerMessage.includes("urgence") || lowerMessage.includes("emergency")) {
      response = "Je vais évaluer l'urgence de votre situation avec quelques questions rapides.";
      nextFlow = 'urgency';
    } else {
      response = `Je peux vous aider avec :
      
🗓️ Prendre un rendez-vous
⚡ Évaluer l'urgence de votre situation  
📸 Télécharger une photo de la zone concernée
❓ Répondre à vos questions sur les soins dentaires

Que souhaitez-vous faire ?`;
    }

    setTimeout(() => setCurrentFlow(nextFlow), 1000);

    return {
      id: crypto.randomUUID(),
      session_id: sessionId,
      message: response,
      is_bot: true,
      message_type: "text",
      created_at: new Date().toISOString(),
    };
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

    // Save user message
    await saveMessage(userMessage);

    // Generate bot response
    setTimeout(async () => {
      const botResponse = generateBotResponse(userMessage.message);
      setMessages(prev => [...prev, botResponse]);
      await saveMessage(botResponse);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addSystemMessage = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const systemMessage: ChatMessage = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      message,
      is_bot: true,
      message_type: type,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardTitle className="flex items-center">
            <Bot className="h-6 w-6 mr-2" />
            DentiBot - Assistant Dentaire
            <Badge variant="secondary" className="ml-auto">
              En ligne
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.is_bot ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.is_bot
                        ? "bg-gray-100 text-gray-900"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.is_bot ? (
                        <Bot className="h-4 w-4 mt-1 flex-shrink-0" />
                      ) : (
                        <UserIcon className="h-4 w-4 mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap">{message.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Action Panels */}
          {currentFlow === 'urgency' && (
            <div className="border-t p-4 bg-orange-50">
              <UrgencyAssessment 
                onComplete={(urgency) => {
                  addSystemMessage(`Évaluation d'urgence terminée. Niveau: ${urgency}`, 'success');
                  setCurrentFlow('booking');
                }}
                onCancel={() => setCurrentFlow('chat')}
              />
            </div>
          )}

          {currentFlow === 'booking' && (
            <div className="border-t p-4 bg-green-50">
              <AppointmentBooking 
                user={user}
                onComplete={() => {
                  addSystemMessage("Rendez-vous confirmé ! Vous recevrez un rappel 24h avant.", 'success');
                  setCurrentFlow('chat');
                }}
                onCancel={() => setCurrentFlow('chat')}
              />
            </div>
          )}

          {currentFlow === 'photo' && (
            <div className="border-t p-4 bg-blue-50">
              <PhotoUpload 
                onComplete={(url) => {
                  addSystemMessage("Photo téléchargée avec succès. Elle sera transmise au dentiste.", 'success');
                  setCurrentFlow('chat');
                }}
                onCancel={() => setCurrentFlow('chat')}
              />
            </div>
          )}

          {/* Chat Input */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={isLoading || !inputMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-center space-x-2 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentFlow('urgency')}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Urgence
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentFlow('booking')}
              >
                <Calendar className="h-4 w-4 mr-1" />
                RDV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentFlow('photo')}
              >
                <Camera className="h-4 w-4 mr-1" />
                Photo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};