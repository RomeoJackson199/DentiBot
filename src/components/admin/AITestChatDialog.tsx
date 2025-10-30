import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AITestChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  greeting: string;
  systemBehavior: string;
  personalityTraits: string[];
  businessName: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AITestChatDialog({
  open,
  onOpenChange,
  greeting,
  systemBehavior,
  personalityTraits,
  businessName,
}: AITestChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: greeting || 'Hello! How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    // Simulate AI response with more realistic typing effect
    setTimeout(() => {
      const response = generateMockResponse(userMessage, systemBehavior, personalityTraits, businessName);
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
  };

  const handleReset = () => {
    setMessages([
      { role: 'assistant', content: greeting || 'Hello! How can I help you today?' },
    ]);
    setInput('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[700px] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                AI Chat Preview
              </DialogTitle>
              <DialogDescription className="text-sm">
                Test your AI assistant with real-time simulation
              </DialogDescription>
            </div>
            <Button onClick={handleReset} variant="ghost" size="sm" className="gap-2">
              <RefreshCw className="h-3 w-3" />
              Reset
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-gradient-to-b from-background to-muted/20">
          <ScrollArea className="h-full px-6 py-4" ref={scrollRef}>
            <div className="space-y-4 pb-4">
              <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'flex gap-3 items-end',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-lg">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        'rounded-2xl px-4 py-3 max-w-[75%] shadow-sm',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-card border rounded-bl-sm'
                      )}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </motion.div>
                    {message.role === 'user' && (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center shrink-0 shadow-lg">
                        <User className="h-4 w-4 text-secondary-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 items-end"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-lg">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="bg-card border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <motion.span
                        className="w-2 h-2 bg-primary/60 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <motion.span
                        className="w-2 h-2 bg-primary/60 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                      />
                      <motion.span
                        className="w-2 h-2 bg-primary/60 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="px-6 py-4 border-t bg-background/95 backdrop-blur">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isTyping}
              className="h-11 text-base"
            />
            <Button 
              onClick={handleSend} 
              size="icon" 
              disabled={!input.trim() || isTyping}
              className="h-11 w-11 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            This is a simulated preview. Responses are generated based on your AI settings.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function generateMockResponse(
  userMessage: string,
  systemBehavior: string,
  personalityTraits: string[],
  businessName: string
): string {
  const lowerMessage = userMessage.toLowerCase();
  
  // Extract tone guidance from traits
  const isFriendly = personalityTraits.some((t) =>
    ['friendly', 'warm', 'casual', 'enthusiastic'].includes(t.toLowerCase())
  );
  const isProfessional = personalityTraits.some((t) =>
    ['professional', 'formal'].includes(t.toLowerCase())
  );
  const isEmpathetic = personalityTraits.some((t) =>
    ['empathetic', 'caring', 'patient', 'compassionate'].includes(t.toLowerCase())
  );
  const isConcise = personalityTraits.some((t) =>
    ['concise', 'direct', 'clear'].includes(t.toLowerCase())
  );

  // Parse system behavior for specific instructions
  const mentionsEmergency = systemBehavior.toLowerCase().includes('emergency') || 
                           systemBehavior.toLowerCase().includes('urgent');
  const mentionsPricing = systemBehavior.toLowerCase().includes('price') || 
                         systemBehavior.toLowerCase().includes('insurance');
  const mentionsName = systemBehavior.toLowerCase().includes('name');

  // Appointment-related queries
  if (lowerMessage.includes('appointment') || lowerMessage.includes('book') || lowerMessage.includes('schedule')) {
    let response = '';
    if (isFriendly) {
      response = "I'd absolutely love to help you schedule an appointment! 🗓️ ";
    } else if (isProfessional) {
      response = 'I can certainly assist you with scheduling an appointment. ';
    } else {
      response = 'Let me help you book an appointment. ';
    }
    
    if (mentionsName) {
      response += "First, may I have your name? Then we'll find the perfect time slot for you.";
    } else if (isConcise) {
      response += "What date and time work for you?";
    } else {
      response += "What date and time would work best for your schedule? I have several options available.";
    }
    return response;
  }

  // Pricing questions
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
    let response = '';
    if (isFriendly) {
      response = "Great question about our pricing! ";
    } else if (isProfessional) {
      response = 'Our pricing structure varies based on the specific service. ';
    } else {
      response = 'Let me help you with pricing information. ';
    }
    
    if (mentionsPricing) {
      response += `We offer competitive rates and accept most major insurance plans. `;
    }
    response += `Which specific service are you interested in?`;
    return response;
  }

  // Emergency/urgent queries
  if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || 
      lowerMessage.includes('pain') || lowerMessage.includes('hurt')) {
    let response = '';
    if (isEmpathetic) {
      response = "I'm truly sorry you're experiencing discomfort. Your well-being is our top priority. ";
    } else if (isProfessional) {
      response = 'I understand this is an urgent matter. ';
    } else {
      response = 'I can help with urgent situations. ';
    }
    
    if (mentionsEmergency) {
      response += 'We have emergency slots available today. Can you describe what you\'re experiencing so I can prioritize your care?';
    } else {
      response += 'Please call our emergency line immediately for urgent matters, or I can help you book the soonest available appointment.';
    }
    return response;
  }

  // Hours/availability
  if (lowerMessage.includes('hours') || lowerMessage.includes('open') || lowerMessage.includes('available')) {
    if (isFriendly) {
      return `We're here when you need us! Which day were you hoping to visit ${businessName}?`;
    } else if (isProfessional) {
      return `${businessName} maintains regular business hours. Would you like to know our availability for a specific day?`;
    }
    return `I can share our hours with you. What day are you interested in?`;
  }

  // Services question
  if (lowerMessage.includes('service') || lowerMessage.includes('offer') || lowerMessage.includes('do you')) {
    let response = '';
    if (isFriendly) {
      response = `We offer a wide range of services at ${businessName}! `;
    } else {
      response = `${businessName} provides comprehensive services. `;
    }
    response += 'What specific service or treatment are you interested in learning about?';
    return response;
  }

  // Location/address
  if (lowerMessage.includes('where') || lowerMessage.includes('location') || lowerMessage.includes('address')) {
    if (isFriendly) {
      return `We'd love to see you at ${businessName}! I can provide directions and parking information. Are you looking for our main location?`;
    }
    return `${businessName} is conveniently located. Would you like the address and directions?`;
  }

  // Default response incorporating behavior
  let response = '';
  if (isFriendly) {
    response = "That's a wonderful question! ";
  } else if (isProfessional) {
    response = 'Thank you for your inquiry. ';
  } else {
    response = 'I appreciate you asking. ';
  }
  
  if (isEmpathetic) {
    response += `I'm here to make sure you get exactly the information you need about ${businessName}. `;
  }
  
  if (isConcise) {
    response += `How can I help you today?`;
  } else {
    response += `Could you tell me a bit more about what you're looking for? I want to make sure I provide you with the most relevant information.`;
  }
  
  return response;
}
