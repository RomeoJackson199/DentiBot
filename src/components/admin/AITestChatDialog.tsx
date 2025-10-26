import { useState } from 'react';
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
import { Bot, User, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    // Simulate AI response based on settings
    setTimeout(() => {
      const response = generateMockResponse(userMessage, systemBehavior, personalityTraits, businessName);
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleReset = () => {
    setMessages([
      { role: 'assistant', content: greeting || 'Hello! How can I help you today?' },
    ]);
    setInput('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>AI Chat Preview</DialogTitle>
          <DialogDescription>
            Test how your AI assistant will interact with customers based on your current settings
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    'rounded-lg px-4 py-2 max-w-[80%]',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" />
                    <span
                      className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                    <span
                      className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button onClick={handleSend} size="icon">
            <Send className="h-4 w-4" />
          </Button>
          <Button onClick={handleReset} variant="outline">
            Reset
          </Button>
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

  // Determine tone from personality traits
  const isFriendly = personalityTraits.some((t) =>
    ['friendly', 'warm', 'casual'].includes(t.toLowerCase())
  );
  const isProfessional = personalityTraits.some((t) =>
    ['professional', 'formal'].includes(t.toLowerCase())
  );
  const isEmpathetic = personalityTraits.some((t) =>
    ['empathetic', 'caring'].includes(t.toLowerCase())
  );

  // Mock responses based on common questions
  if (lowerMessage.includes('appointment') || lowerMessage.includes('book')) {
    let response = isFriendly
      ? "I'd love to help you book an appointment! "
      : 'I can assist you with scheduling an appointment. ';
    response += `What date and time works best for you?`;
    return response;
  }

  if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    let response = isProfessional
      ? 'Our pricing depends on the specific service you need. '
      : "Great question about pricing! ";
    response += `Could you tell me which service you're interested in?`;
    return response;
  }

  if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('pain')) {
    let response = isEmpathetic
      ? "I'm sorry you're experiencing this. "
      : 'I understand this is urgent. ';
    response += systemBehavior.toLowerCase().includes('emergency')
      ? 'We prioritize emergency cases. Let me help you get immediate assistance.'
      : `Please call us immediately at our emergency line for urgent care.`;
    return response;
  }

  if (lowerMessage.includes('hours') || lowerMessage.includes('open')) {
    return isProfessional
      ? `${businessName} operates according to our posted schedule. Would you like to know our hours for a specific day?`
      : `We're here to serve you! What day were you thinking of visiting?`;
  }

  // Default response
  const greeting = isFriendly ? "That's a great question! " : 'Thank you for asking. ';
  return greeting + `I'm here to help you with any questions about ${businessName}. Could you provide more details so I can assist you better?`;
}
