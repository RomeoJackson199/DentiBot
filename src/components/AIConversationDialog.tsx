import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Send, Loader2, Check, X, MessageSquare, User } from "lucide-react";
import { AIWritingAssistant } from "@/components/AIWritingAssistant";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: {
    type: 'note' | 'prescription' | 'treatment_plan';
    data: any;
  }[];
}

interface AIConversationDialogProps {
  patientId: string;
  dentistId: string;
  patientName: string;
  contextType: 'patient' | 'appointment' | 'treatment';
  contextId?: string;
  onUpdate?: () => void;
  user?: User | null;
}

export function AIConversationDialog({ 
  patientId, 
  dentistId, 
  patientName, 
  contextType, 
  contextId,
  onUpdate,
  user
}: AIConversationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingSuggestions, setPendingSuggestions] = useState<any[]>([]);
  const { toast } = useToast();

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Check if user has opted out of AI features
      if (user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('ai_opt_out')
          .eq('user_id', user.id)
          .single();

        if (userProfile?.ai_opt_out) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "I'm sorry, but AI features are currently disabled for your account. You can re-enable them in your settings if you'd like to use AI-powered assistance.",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsLoading(false);
          return;
        }
      }

      // Get patient context
      const { data: patient } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .single();

      const { data: medicalHistory } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId);

      const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId);

      const { data: treatmentPlans } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId);

      // Call AI with context
      const { data, error } = await supabase.functions.invoke('dental-ai-chat', {
        body: {
          message: inputMessage,
          conversation_history: messages,
          patient_context: {
            patient,
            medical_history: medicalHistory,
            notes,
            treatment_plans: treatmentPlans,
            context_type: contextType,
            context_id: contextId
          },
          mode: 'dentist_consultation'
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.fallback_response || 'I apologize, but I cannot process your request at the moment.',
        timestamp: new Date(),
        suggestions: data.suggestions || []
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.suggestions && data.suggestions.length > 0) {
        setPendingSuggestions(data.suggestions);
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionApproval = async (suggestion: any, approved: boolean) => {
    if (!approved) {
      setPendingSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      return;
    }

    try {
      if (suggestion.type === 'note') {
        await supabase
          .from('notes')
          .insert({
            patient_id: patientId,
            dentist_id: dentistId,
            content: suggestion.data.content
          });
      } else if (suggestion.type === 'prescription') {
        await supabase
          .from('prescriptions')
          .insert({
            patient_id: patientId,
            dentist_id: dentistId,
            medication_name: suggestion.data.medication_name,
            dosage: suggestion.data.dosage,
            frequency: suggestion.data.frequency,
            duration_days: suggestion.data.duration_days,
            instructions: suggestion.data.instructions,
            prescribed_date: new Date().toISOString().split('T')[0]
          });
      } else if (suggestion.type === 'treatment_plan') {
        await supabase
          .from('treatment_plans')
          .insert({
            patient_id: patientId,
            dentist_id: dentistId,
            title: suggestion.data.title,
            description: suggestion.data.description,
            diagnosis: suggestion.data.diagnosis,
            treatment_steps: suggestion.data.treatment_steps,
            estimated_duration_weeks: suggestion.data.estimated_duration_weeks,
            estimated_cost: suggestion.data.estimated_cost,
            priority: suggestion.data.priority || 'medium'
          });
      }

      setPendingSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      onUpdate?.();
      
      toast({
        title: "Success",
        description: `${suggestion.type.replace('_', ' ')} has been added successfully`,
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to apply suggestion",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <MessageSquare className="h-4 w-4 mr-2" />
          Chat with AI about {patientName}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-dental-primary" />
            <span>AI Consultation - {patientName}</span>
            <Badge variant="outline">{contextType}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4">
          {/* Messages */}
          <ScrollArea className="flex-1 h-96 pr-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-dental-primary" />
                  <p>Start a conversation about {patientName}'s care</p>
                  <p className="text-sm">I can help with notes, prescriptions, and treatment plans</p>
                </div>
              )}
              
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-dental-primary text-white' 
                      : 'bg-muted'
                  }`}>
                    <div className="flex items-start space-x-2">
                      {message.role === 'assistant' && <Bot className="h-4 w-4 mt-1 text-dental-primary" />}
                      {message.role === 'user' && <User className="h-4 w-4 mt-1" />}
                      <div className="flex-1">
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4 text-dental-primary" />
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Pending Suggestions */}
          {pendingSuggestions.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-semibold mb-3 flex items-center">
                <Bot className="h-4 w-4 mr-2 text-dental-primary" />
                AI Suggestions (Pending Approval)
              </h4>
              <div className="space-y-3">
                {pendingSuggestions.map((suggestion, index) => (
                  <div key={index} className="border rounded p-3 bg-background">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge variant="outline" className="mb-2">
                          {suggestion.type.replace('_', ' ')}
                        </Badge>
                        <div className="text-sm">
                          {suggestion.type === 'note' && (
                            <p>{suggestion.data.content}</p>
                          )}
                          {suggestion.type === 'prescription' && (
                            <div>
                              <p><strong>{suggestion.data.medication_name}</strong> - {suggestion.data.dosage}</p>
                              <p>{suggestion.data.frequency} for {suggestion.data.duration_days} days</p>
                              <p className="text-muted-foreground">{suggestion.data.instructions}</p>
                            </div>
                          )}
                          {suggestion.type === 'treatment_plan' && (
                            <div>
                              <p><strong>{suggestion.data.title}</strong></p>
                              <p>{suggestion.data.description}</p>
                              <p className="text-muted-foreground">Priority: {suggestion.data.priority}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleSuggestionApproval(suggestion, true)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSuggestionApproval(suggestion, false)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about patient care, request notes, prescriptions, or treatment plans..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={sendMessage} 
                disabled={!inputMessage.trim() || isLoading}
                className="px-6"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <AIWritingAssistant
              currentText={inputMessage}
              onImprove={setInputMessage}
              placeholder="consultation message"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}