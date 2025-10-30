import type { FC } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { chatApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { ChatResponse } from '../types';

interface ChatPanelProps {
  professionalId?: string;
  serviceId?: string;
  date?: string;
  onSuggestedSlots?: (slots: ChatResponse['suggestedSlots']) => void;
}

export const ChatPanel: FC<ChatPanelProps> = ({ professionalId, serviceId, date, onSuggestedSlots }) => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: "I'm Caberu's AI assistant. How can I help you streamline your bookings today?",
    },
  ]);

  const sendMessage = async () => {
    if (!input.trim() || !token) return;
    const userMessage = input.trim();
    setInput('');
    setConversation((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      setLoading(true);
      const response = await chatApi.converse(token, {
        message: userMessage,
        professionalId,
        serviceId,
        date,
      });
      setConversation((prev) => [...prev, { role: 'assistant', content: response.reply }]);
      onSuggestedSlots?.(response.suggestedSlots);
    } catch (error: any) {
      toast({
        title: 'Unable to reach Caberu assistant',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border bg-white shadow-sm">
      <div className="border-b p-4">
        <h3 className="text-lg font-semibold text-slate-800">AI Assistant</h3>
        <p className="text-sm text-slate-500">Ask Caberu to manage bookings, cancellations, or FAQs.</p>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {conversation.map((message, index) => (
          <div
            key={index}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
              message.role === 'assistant'
                ? 'bg-slate-100 text-slate-700'
                : 'ml-auto bg-teal-500 text-white'
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>
      <div className="border-t p-4">
        <div className="space-y-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Request availability, reschedule a session, ask about pricing..."
            className="resize-none"
            rows={3}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-full bg-teal-500 hover:bg-teal-600"
          >
            {loading ? 'Thinking...' : 'Send to Caberu AI'}
          </Button>
        </div>
      </div>
    </div>
  );
};
