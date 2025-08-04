import React, { useState, useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User as UserIcon,
  Loader2,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIChatProps {
  user: User;
  onBookingTrigger?: (urgency: 'low' | 'medium' | 'high' | 'emergency') => void;
}

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  urgency?: 'low' | 'medium' | 'high' | 'emergency';
}

export const AIChat = ({ user, onBookingTrigger }: AIChatProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hello! I'm your AI dental assistant. I'm here to help you with dental concerns, answer questions, and assist with appointments. How are you feeling today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const analyzeUrgency = (message: string): 'low' | 'medium' | 'high' | 'emergency' => {
    const emergencyKeywords = ['severe pain', 'bleeding', 'swollen', 'emergency', 'urgent', 'terrible pain'];
    const highKeywords = ['pain', 'hurt', 'ache', 'sensitive', 'uncomfortable'];
    const mediumKeywords = ['check', 'cleaning', 'appointment', 'routine'];
    
    const lowerMessage = message.toLowerCase();
    
    if (emergencyKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'emergency';
    } else if (highKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'high';
    } else if (mediumKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'medium';
    }
    return 'low';
  };

  const generateBotResponse = (userMessage: string, urgency: 'low' | 'medium' | 'high' | 'emergency'): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Pain-related responses
    if (lowerMessage.includes('pain') || lowerMessage.includes('hurt') || lowerMessage.includes('ache')) {
      if (urgency === 'emergency') {
        return "I understand you're experiencing severe pain. This sounds urgent and you should see a dentist as soon as possible. Would you like me to help you book an emergency appointment?";
      } else if (urgency === 'high') {
        return "I'm sorry to hear you're experiencing dental pain. Pain can indicate various issues that should be addressed promptly. I'd recommend scheduling an appointment soon. Would you like me to help you book one?";
      }
    }
    
    // Routine care responses
    if (lowerMessage.includes('cleaning') || lowerMessage.includes('checkup') || lowerMessage.includes('routine')) {
      return "Regular dental checkups and cleanings are important for maintaining good oral health. I'd be happy to help you schedule a routine appointment. How has it been since your last visit?";
    }
    
    // Appointment requests
    if (lowerMessage.includes('appointment') || lowerMessage.includes('book') || lowerMessage.includes('schedule')) {
      return "I'd be happy to help you schedule an appointment. Based on what you've told me, I can connect you with the right type of appointment. Would you like to proceed with booking?";
    }
    
    // General responses
    const responses = [
      "Thank you for sharing that with me. Can you tell me more about any specific concerns or symptoms you're experiencing?",
      "I'm here to help. Could you describe any dental issues or concerns you have?",
      "Based on what you've told me, I can provide some guidance. Are you experiencing any pain or discomfort?",
      "I understand. Let me know if you have any specific dental concerns or if you'd like to schedule an appointment."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Analyze urgency
    const urgency = analyzeUrgency(inputValue);

    // Simulate AI processing delay
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(inputValue, urgency),
        isBot: true,
        timestamp: new Date(),
        urgency
      };

      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const handleBookAppointment = (urgency: 'low' | 'medium' | 'high' | 'emergency') => {
    if (onBookingTrigger) {
      onBookingTrigger(urgency);
    }
    
    const confirmMessage: ChatMessage = {
      id: Date.now().toString(),
      text: "Perfect! I'll help you book an appointment. Let me connect you with our booking system.",
      isBot: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, confirmMessage]);
  };

  const getUrgencyBadge = (urgency?: 'low' | 'medium' | 'high' | 'emergency') => {
    if (!urgency) return null;
    
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      emergency: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={`ml-2 ${colors[urgency]}`}>
        {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
          AI Dental Assistant
          <Badge variant="outline" className="ml-2">
            <Bot className="h-3 w-3 mr-1" />
            Online
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.isBot
                      ? 'bg-gray-100 text-gray-900'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.isBot ? (
                      <Bot className="h-4 w-4 mt-0.5 text-blue-600" />
                    ) : (
                      <UserIcon className="h-4 w-4 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{message.text}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {message.urgency && getUrgencyBadge(message.urgency)}
                      </div>
                      
                      {message.isBot && message.text.includes('book') && (
                        <div className="mt-3 space-y-2">
                          <Button 
                            size="sm" 
                            className="mr-2"
                            onClick={() => handleBookAppointment(message.urgency || 'medium')}
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            Book Appointment
                          </Button>
                          {message.urgency === 'emergency' && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleBookAppointment('emergency')}
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Emergency Booking
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4 text-blue-600" />
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe your dental concerns or ask a question..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};