import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Sparkles, Bot, User as UserIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface BusinessCreationAIGuideProps {
  currentStep: number;
  businessData: any;
  onSuggestedData?: (data: any) => void;
}

const STEP_INTROS = {
  1: "Hi! 👋 I'm here to help you create your healthcare business. Let's start by getting you signed up!",
  2: "Great! Now let's find the perfect template for your practice. What type of healthcare business are you setting up? 🏥",
  3: "Awesome choice! Let's make your business stand out. Tell me about your practice - what makes it special? ✨",
  4: "Now let's add your services. What treatments or procedures do you offer? I can suggest some based on your practice type! 💉",
  5: "Almost done! Let's pick the right subscription plan for your needs. What's most important to you - features, price, or scalability? 📊",
};

export function BusinessCreationAIGuide({ 
  currentStep, 
  businessData, 
  onSuggestedData 
}: BusinessCreationAIGuideProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize with step intro
  useEffect(() => {
    const intro = STEP_INTROS[currentStep as keyof typeof STEP_INTROS];
    if (intro && messages.length === 0) {
      setMessages([{ role: 'assistant', content: intro }]);
    }
  }, [currentStep]);

  // Add step transition message
  useEffect(() => {
    if (messages.length > 0) {
      const intro = STEP_INTROS[currentStep as keyof typeof STEP_INTROS];
      if (intro) {
        setMessages(prev => [...prev, { role: 'assistant', content: intro }]);
      }
    }
  }, [currentStep]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('business-creation-ai', {
        body: {
          message: userMessage,
          conversation_history: messages,
          current_step: currentStep,
          business_data: businessData,
        },
      });

      if (error) throw error;

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.message },
      ]);

      // If AI suggested form data, pass it up
      if (data.suggested_data && onSuggestedData) {
        onSuggestedData(data.suggested_data);
      }
    } catch (error: any) {
      console.error('AI chat error:', error);
      toast.error(error.message || 'Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-[500px] flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-background dark:to-primary/5 border-2 border-primary/20">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold">AI Setup Guide</h3>
        </div>
        <p className="text-xs text-white/80 mt-1">Ask me anything about setting up your business!</p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-background to-muted/20" ref={scrollRef}>
        <div className="space-y-4 pb-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`flex items-start gap-3 max-w-[85%] ${
                  msg.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 mt-1">
                  {msg.role === 'assistant' ? (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 shadow-sm">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary/80 to-secondary flex items-center justify-center shadow-sm">
                      <UserIcon className="w-5 h-5 text-secondary-foreground" />
                    </div>
                  )}
                </div>
                {/* Message Bubble */}
                <Card className={`border-none shadow-md ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground'
                    : 'bg-card/80 backdrop-blur-sm'
                }`}>
                  <CardContent className="p-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start gap-3 max-w-[85%]">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 shadow-sm">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <Card className="bg-card/80 backdrop-blur-sm border-none shadow-md">
                  <CardContent className="p-4">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-card/50 backdrop-blur-sm p-4">
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your business..."
            disabled={isLoading}
            className="flex-1 bg-background/50 border-input/50 focus:border-primary transition-colors"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-10 w-10 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
