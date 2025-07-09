import { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User as UserIcon, Calendar, Camera, Mail, ImageIcon } from "lucide-react";
import { ChatMessage } from "@/types/chat";
import { AppointmentBooking } from "@/components/AppointmentBooking";
import { PhotoUpload } from "@/components/PhotoUpload";
import { DentistSelection } from "@/components/DentistSelection";
import { ChatCalendar } from "@/components/ChatCalendar";
import { QuickPhotoUpload } from "@/components/QuickPhotoUpload";
import { PatientSelection } from "@/components/PatientSelection";

interface DentalChatbotProps {
  user: User;
}

export const DentalChatbot = ({ user }: DentalChatbotProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [currentFlow, setCurrentFlow] = useState<'chat' | 'booking' | 'photo' | 'dentist-selection' | 'calendar' | 'quick-photo' | 'patient-selection'>('chat');
  const [lastPhotoUrl, setLastPhotoUrl] = useState<string | null>(null);
  const [selectedDentist, setSelectedDentist] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [problemDescription, setProblemDescription] = useState<string>("");
  const [questionsAsked, setQuestionsAsked] = useState<number>(0);
  const [recommendedDentist, setRecommendedDentist] = useState<string | null>(null);
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [isForUser, setIsForUser] = useState<boolean>(true);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load user profile and welcome message
    loadUserProfile();
    const welcomeMessage: ChatMessage = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      message: "Hello! I'm DentiBot. How can I help you today? 🦷",
      is_bot: true,
      message_type: "text",
      created_at: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
  }, [sessionId]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

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

  const generateBotResponse = async (userMessage: string): Promise<ChatMessage> => {
    try {
      // Call the AI edge function
      const { data, error } = await supabase.functions.invoke('dental-ai-chat', {
        body: {
          message: userMessage,
          conversation_history: messages.slice(-10), // Last 10 messages for context
          user_profile: userProfile || {
            name: user.email?.split('@')[0] || 'Patient',
            email: user.email
          }
        }
      });

      if (error) throw error;

      const response = data.response || "I'm sorry, I couldn't process your request.";
      const suggestions = data.suggestions || [];
      const urgencyDetected = data.urgency_detected || false;
      const aiRecommendedDentist = data.recommended_dentist || null;

      if (aiRecommendedDentist) {
        setRecommendedDentist(aiRecommendedDentist);
      }

      // Auto-suggest next actions based on AI analysis
      if (suggestions.includes('booking') && currentFlow === 'chat') {
        setTimeout(() => setCurrentFlow('patient-selection'), 2000);
      }

      // Show urgency warning if detected
      if (urgencyDetected) {
        toast({
          title: "Urgent situation detected",
          description: "I recommend an appointment quickly.",
          variant: "destructive",
        });
      }

      return {
        id: crypto.randomUUID(),
        session_id: sessionId,
        message: response,
        is_bot: true,
        message_type: "text",
        metadata: { 
          ai_generated: true, 
          suggestions,
          urgency_detected: urgencyDetected 
        },
        created_at: new Date().toISOString(),
      };

    } catch (error) {
      console.error('Error calling AI:', error);
      
      // Fallback to simple responses
      const lowerMessage = userMessage.toLowerCase();
      let response = "";

      if (lowerMessage.includes("appointment") || lowerMessage.includes("booking") || 
          lowerMessage.includes("pain") || lowerMessage.includes("hurt") || 
          lowerMessage.includes("problem") || lowerMessage.includes("issue")) {
        response = "What's the exact problem? I'll help you find the right dentist and book an appointment that typically takes 30-60 minutes.";
        setTimeout(() => setCurrentFlow('patient-selection'), 1000);
      } else {
        response = `What can I do for you?

🗓️ Book an appointment
❓ Answer your questions

Type your request...`;
      }

      return {
        id: crypto.randomUUID(),
        session_id: sessionId,
        message: response,
        is_bot: true,
        message_type: "text",
        created_at: new Date().toISOString(),
      };
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

    // Save user message
    await saveMessage(userMessage);

    // Generate bot response
    setTimeout(async () => {
      const botResponse = await generateBotResponse(userMessage.message);
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

  const sendEmailSummary = async (appointmentData?: any, urgencyLevel?: string) => {
    try {
      // Create summary from recent messages
      const recentMessages = messages.slice(-10);
      const chatSummary = recentMessages
        .map(msg => `${msg.is_bot ? 'DentiBot' : 'Patient'}: ${msg.message}`)
        .join('\n\n');

      const { data, error } = await supabase.functions.invoke('send-patient-email', {
        body: {
          userId: user.id,
          chatSummary,
          photoUrl: lastPhotoUrl,
          appointmentData,
          urgencyLevel
        }
      });

      if (error) throw error;

      addSystemMessage(`📧 Summary sent to dentist (Patient ID: ${data.patientId})`, 'success');
      
      toast({
        title: "Email sent",
        description: `Your summary has been sent to the dentist with Patient ID: ${data.patientId}`,
      });

    } catch (error) {
      console.error('Error sending email:', error);
      addSystemMessage("❌ Error sending email", 'warning');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-0">
      <Card className="h-[85vh] sm:h-[700px] flex flex-col floating-card animate-scale-in">
        <CardHeader className="bg-gradient-primary text-white rounded-t-xl border-0 p-3 sm:p-6">
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <div className="relative">
              <Bot className="h-6 w-6 sm:h-7 sm:w-7 mr-2 sm:mr-3" />
              <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="truncate">DentiBot</span>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full mr-1 sm:mr-2 animate-pulse"></div>
                  Online
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-white/80 font-normal truncate">Your AI Dental Assistant</p>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 bg-gradient-hero">
          <ScrollArea className="flex-1 p-3 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.is_bot ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 shadow-float animate-slide-in ${
                      message.is_bot
                        ? "bg-white/90 backdrop-blur-sm text-gray-900 border border-dental-primary/10"
                        : "bg-gradient-primary text-white shadow-glow"
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
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 sm:p-4 max-w-[80%] shadow-float border border-dental-primary/10 animate-scale-in">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-dental-primary" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-dental-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-dental-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-dental-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                      <span className="text-xs sm:text-sm text-dental-muted-foreground">DentiBot is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Action Panels */}

          {currentFlow === 'patient-selection' && (
            <div className="border-t border-dental-primary/20 p-6 glass-card rounded-t-none animate-fade-in">
              <PatientSelection 
                onSelectPatient={(isForUserSelected, patientInfoSelected) => {
                  setIsForUser(isForUserSelected);
                  setPatientInfo(patientInfoSelected);
                  addSystemMessage(
                    isForUserSelected 
                      ? "Appointment will be booked for you" 
                      : `Appointment will be booked for ${patientInfoSelected?.name}`, 
                    'success'
                  );
                  setCurrentFlow('dentist-selection');
                }}
                onCancel={() => setCurrentFlow('chat')}
              />
            </div>
          )}

          {currentFlow === 'dentist-selection' && (
            <div className="border-t border-dental-primary/20 p-6 glass-card rounded-t-none animate-fade-in">
              <DentistSelection
                onSelectDentist={(dentist) => {
                  setSelectedDentist(dentist);
                  addSystemMessage(`Dentist selected: Dr ${dentist.profiles.first_name} ${dentist.profiles.last_name}`, 'success');
                  setCurrentFlow('calendar');
                }}
                selectedDentistId={selectedDentist?.id}
                recommendedDentist={recommendedDentist}
              />
            </div>
          )}

          {currentFlow === 'calendar' && (
            <div className="border-t border-dental-secondary/20 p-6 glass-card rounded-t-none animate-fade-in">
              <ChatCalendar
                onDateSelect={(date) => {
                  setSelectedDate(date);
                  addSystemMessage(`Date selected: ${date.toLocaleDateString('en-US')}`, 'info');
                }}
                onTimeSelect={(time) => {
                  setSelectedTime(time);
                  addSystemMessage(`Time selected: ${time}`, 'info');
                }}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onConfirm={async () => {
                  if (selectedDentist && selectedDate && selectedTime) {
                    // Create appointment
                    try {
                      const { data: profile } = await supabase
                        .from("profiles")
                        .select("id")
                        .eq("user_id", user.id)
                        .single();

                      const appointmentDateTime = new Date(selectedDate);
                      const [hours, minutes] = selectedTime.split(":");
                      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));
                      
                      const endTime = new Date(appointmentDateTime.getTime() + 60 * 60000); // 1 hour duration

                      await supabase
                        .from("appointments")
                        .insert({
                          patient_id: profile?.id,
                          dentist_id: selectedDentist.id,
                          appointment_date: appointmentDateTime.toISOString(),
                          reason: "Consultation via DentiBot",
                          status: "pending",
                          urgency: "medium",
                          duration_minutes: 60,
                          patient_name: !isForUser ? patientInfo?.name : null,
                          patient_age: !isForUser ? patientInfo?.age : null,
                          patient_relationship: !isForUser ? patientInfo?.relationship : null,
                          is_for_user: isForUser
                        });

                      // Create Google Calendar event
                      try {
                        const endDateTime = new Date(appointmentDateTime.getTime() + 60 * 60000); // 1 hour
                        
                        await supabase.functions.invoke('google-calendar-integration', {
                          body: {
                            action: 'createEvent',
                            eventDetails: {
                              summary: `Dental Appointment - ${!isForUser ? patientInfo?.name : (user.user_metadata?.first_name || 'Patient')} ${!isForUser ? '' : (user.user_metadata?.last_name || '')}`,
                              description: `${!isForUser ? `Patient: ${patientInfo?.name} (${patientInfo?.relationship})\n` : ''}Patient consultation via DentiBot\nDentist: Dr ${selectedDentist.profiles.first_name} ${selectedDentist.profiles.last_name}\nDuration: 60 minutes`,
                              startTime: appointmentDateTime.toISOString(),
                              endTime: endDateTime.toISOString(),
                              attendeeEmail: user.email || '',
                              attendeeName: `${user.user_metadata?.first_name || 'Patient'} ${user.user_metadata?.last_name || ''}`,
                            },
                          },
                        });
                      } catch (calendarError) {
                        console.error('Failed to create calendar event:', calendarError);
                      }

                      const appointmentData = {
                        date: selectedDate.toLocaleDateString('en-US'),
                        time: selectedTime,
                        endTime: endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                        dentist: `Dr ${selectedDentist.profiles.first_name} ${selectedDentist.profiles.last_name}`,
                        reason: "Consultation via DentiBot",
                        patient: !isForUser ? `${patientInfo?.name} (${patientInfo?.relationship})` : "You",
                        duration: "60 minutes"
                      };

                      addSystemMessage(`✅ Appointment confirmed! ${!isForUser ? `For ${patientInfo?.name}` : 'For you'} from ${selectedTime} to ${endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} (60 minutes). You'll receive a reminder 24 hours before.`, 'success');
                      sendEmailSummary(appointmentData);
                      setCurrentFlow('chat');
                      
                      // Reset selections
                      setSelectedDentist(null);
                      setSelectedDate(undefined);
                      setSelectedTime(undefined);
                    } catch (error) {
                      console.error("Error creating appointment:", error);
                      addSystemMessage("❌ Error creating appointment", 'warning');
                    }
                  }
                }}
              />
            </div>
          )}

          {currentFlow === 'booking' && (
            <div className="border-t border-dental-secondary/20 p-6 glass-card rounded-t-none animate-fade-in">
              <AppointmentBooking
                user={user}
                onComplete={(appointmentData) => {
                  addSystemMessage("Appointment confirmed! You'll receive a reminder 24 hours before.", 'success');
                  sendEmailSummary(appointmentData);
                  setCurrentFlow('chat');
                }}
                onCancel={() => setCurrentFlow('chat')}
              />
            </div>
          )}

          {currentFlow === 'quick-photo' && (
            <div className="border-t border-dental-accent/20 p-6 glass-card rounded-t-none animate-fade-in">
              <QuickPhotoUpload
                onPhotoUploaded={(url) => {
                  setLastPhotoUrl(url);
                  addSystemMessage("📸 Photo added successfully", 'success');
                  setCurrentFlow('chat');
                }}
                onCancel={() => setCurrentFlow('chat')}
              />
            </div>
          )}

          {currentFlow === 'photo' && (
            <div className="border-t border-dental-accent/20 p-6 glass-card rounded-t-none animate-fade-in">
              <PhotoUpload
                onComplete={(url) => {
                  setLastPhotoUrl(url);
                  addSystemMessage("Photo uploaded successfully. It will be sent to the dentist.", 'success');
                  setCurrentFlow('chat');
                }}
                onCancel={() => setCurrentFlow('chat')}
              />
            </div>
          )}

          {/* Chat Input */}
          <div className="border-t border-dental-primary/20 p-3 sm:p-6 glass-card rounded-t-none">
            <div className="flex space-x-2 sm:space-x-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 border-dental-primary/20 focus:border-dental-primary focus:ring-dental-primary/20 bg-white/90 backdrop-blur-sm text-sm sm:text-base"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setCurrentFlow('quick-photo')}
                className="shrink-0 floating-card border-dental-accent/30 text-dental-accent hover:bg-dental-accent/10 w-10 h-10 sm:w-11 sm:h-11"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || !inputMessage.trim()}
                className="shrink-0 bg-gradient-primary hover:shadow-glow text-white px-4 sm:px-6 rounded-xl transition-all duration-300 hover:scale-105 h-10 sm:h-11"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentFlow('patient-selection')}
                className="flex items-center gap-1 sm:gap-2 floating-card border-dental-primary/30 text-dental-primary hover:bg-dental-primary/10 hover:scale-105 transition-all duration-300 text-xs sm:text-sm px-3 sm:px-4 py-2"
              >
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Book Appointment</span>
                <span className="xs:hidden">Book</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};