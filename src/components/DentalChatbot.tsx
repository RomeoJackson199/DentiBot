import { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User as UserIcon, Calendar, Camera, Mail, ImageIcon, Mic, Square } from "lucide-react";
import { ChatMessage } from "@/types/chat";
import { AppointmentBookingWithAuth } from "@/components/AppointmentBookingWithAuth";
import { PhotoUpload } from "@/components/PhotoUpload";
import { DentistSelection } from "@/components/DentistSelection";
import { QuickPhotoUpload } from "@/components/QuickPhotoUpload";
import { PatientSelection } from "@/components/PatientSelection";
import { ChatAppointmentManager } from "@/components/chat/ChatAppointmentManager";
import { ChatBookingFlow } from "@/components/chat/ChatBookingFlow";
import { ChatSettingsManager } from "@/components/chat/ChatSettingsManager";

interface DentalChatbotProps {
  user: User | null;
  triggerBooking?: boolean;
  onBookingTriggered?: () => void;
  onScrollToDentists?: () => void;
}

export const DentalChatbot = ({ user, triggerBooking, onBookingTriggered, onScrollToDentists }: DentalChatbotProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [currentFlow, setCurrentFlow] = useState<'chat' | 'booking' | 'photo' | 'dentist-selection' | 'quick-photo' | 'patient-selection' | 'chat-booking'>('chat');
  const [lastPhotoUrl, setLastPhotoUrl] = useState<string | null>(null);
  const [selectedDentist, setSelectedDentist] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [problemDescription, setProblemDescription] = useState<string>("");
  const [questionsAsked, setQuestionsAsked] = useState<number>(0);
  const [recommendedDentist, setRecommendedDentist] = useState<string[] | null>(null);
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [isForUser, setIsForUser] = useState<boolean>(true);
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencyDetected, setEmergencyDetected] = useState(false);
  const [urgencyLevel, setUrgencyLevel] = useState<string>("medium");
  const [consultationReason, setConsultationReason] = useState<string>("");
  const [actionButtons, setActionButtons] = useState<any[]>([]);
  const [showChatBooking, setShowChatBooking] = useState(false);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  const { toast } = useToast();
  const { t } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Declare functions first
  const addChatResponse = (message: string, buttons?: any[]) => {
    const botMessage: ChatMessage = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      message,
      is_bot: true,
      message_type: "text",
      created_at: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, botMessage]);
    if (buttons) {
      setActionButtons(buttons);
    }
    saveMessage(botMessage);
  };

  // Initialize chat managers
  const appointmentManager = user ? ChatAppointmentManager({ user, onResponse: addChatResponse }) : null;
  const settingsManager = user ? ChatSettingsManager({ user, onResponse: addChatResponse }) : null;

  useEffect(() => {
    // Load user profile and set welcome message only once
    const initializeChat = async () => {
      if (user) {
        await loadUserProfile();
      }
      
      // Only add welcome message if no messages exist
      if (messages.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: crypto.randomUUID(),
          session_id: sessionId,
          message: user && userProfile ? 
            t.detailedWelcomeMessageWithName(userProfile.first_name) : 
            t.detailedWelcomeMessage,
          is_bot: true,
          message_type: "text",
          created_at: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
      }
    };

    initializeChat();
  }, [sessionId, user]); // Add user dependency
  
  // Effect to update welcome message when language changes
  useEffect(() => {
    if (messages.length > 0 && messages[0].is_bot && userProfile) {
      // Update the first message (welcome message) when language changes
      const updatedWelcomeMessage: ChatMessage = {
        ...messages[0],
        message: t.detailedWelcomeMessageWithName(userProfile.first_name),
      };
      
      setMessages(prev => [updatedWelcomeMessage, ...prev.slice(1)]);
    }
  }, [t]); // Only update when translation object changes

  const loadUserProfile = async () => {
    if (!user) return;
    
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

  const addSystemMessage = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const systemMessage: ChatMessage = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      message,
      is_bot: true,
      message_type: type,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, systemMessage]);
    saveMessage(systemMessage);
  };

  // Handle external booking trigger
  useEffect(() => {
    if (triggerBooking) {
      if (!user) {
        // Show login requirement message
        const loginMessage: ChatMessage = {
          id: crypto.randomUUID(),
          session_id: sessionId,
          message: "Vous devez vous connecter pour prendre un rendez-vous. Cliquez sur le bouton 'Se connecter' en haut à droite.",
          is_bot: true,
          message_type: "text",
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, loginMessage]);
      } else {
        setCurrentFlow('patient-selection');
      }
      onBookingTriggered?.();
    }
  }, [triggerBooking, onBookingTriggered, user, sessionId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const saveMessage = async (message: ChatMessage) => {
    if (!user) return; // Don't save messages for non-authenticated users
    
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
          user_profile: userProfile || (user ? {
            name: user.email?.split('@')[0] || 'Patient',
            email: user.email
          } : {
            name: 'Guest',
            email: null
          })
        }
      });

      if (error) throw error;

      const response = data.response || "I'm sorry, I couldn't process your request.";
      const suggestions = data.suggestions || [];
      const aiRecommendedDentist = data.recommended_dentist || null;

      if (aiRecommendedDentist) {
        // Handle both string and array formats for recommended dentists
        setRecommendedDentist(Array.isArray(aiRecommendedDentist) ? aiRecommendedDentist : [aiRecommendedDentist]);
        // Scroll to dentists section when recommendation is made
        setTimeout(() => {
          onScrollToDentists?.();
        }, 2000);
      }

      // Extract consultation reason from AI response
      const extractedReason = data.consultation_reason || "";
      if (extractedReason) {
        setConsultationReason(extractedReason);
      }

      // Handle different suggestion types
      if (suggestions.includes('appointments-list')) {
        addSystemMessage("🗓️ You can manage your appointments by clicking on the 'Appointments' tab above", 'info');
      } else if (suggestions.includes('skip-patient-selection')) {
        setTimeout(() => setCurrentFlow('dentist-selection'), 2000);
      } else if (suggestions.includes('booking') && currentFlow === 'chat') {
        if (!user) {
          // Show login requirement message
          setTimeout(() => {
            const loginMessage: ChatMessage = {
              id: crypto.randomUUID(),
              session_id: sessionId,
              message: "Vous devez vous connecter pour prendre un rendez-vous. Cliquez sur le bouton 'Se connecter' en haut à droite.",
              is_bot: true,
              message_type: "text",
              created_at: new Date().toISOString(),
            };
            setMessages(prev => [...prev, loginMessage]);
          }, 1000);
        } else {
          setTimeout(() => setCurrentFlow('patient-selection'), 2000);
        }
      } else if (suggestions.includes('recommend-dentist')) {
        if (!user) {
          // Show login requirement message
          setTimeout(() => {
            const loginMessage: ChatMessage = {
              id: crypto.randomUUID(),
              session_id: sessionId,
              message: "Vous devez vous connecter pour prendre un rendez-vous. Cliquez sur le bouton 'Se connecter' en haut à droite.",
              is_bot: true,
              message_type: "text",
              created_at: new Date().toISOString(),
            };
            setMessages(prev => [...prev, loginMessage]);
          }, 1000);
        } else {
          // For recommendations, ask the question in chat instead of showing UI
          setTimeout(() => {
            const questionMessage: ChatMessage = {
              id: crypto.randomUUID(),
              session_id: sessionId,
              message: "Pour qui souhaitez-vous prendre ce rendez-vous ? Tapez 'moi' si c'est pour vous, ou donnez-moi le nom et l'âge de la personne (ex: 'ma fille Sarah, 8 ans').",
              is_bot: true,
              message_type: "text",
              created_at: new Date().toISOString(),
            };
            setMessages(prev => [...prev, questionMessage]);
          }, 1000);
          // Scroll to dentists section when recommendation is requested
          setTimeout(() => {
            onScrollToDentists?.();
          }, 2000);
        }
      }

      // Handle patient selection from chat response
      if (suggestions.includes('skip-patient-selection')) {
        const lowerUserMessage = userMessage.toLowerCase();
        
        if (userMessage.includes('moi') || userMessage.includes('me') || 
            userMessage.includes('myself') || userMessage.includes('voor mij') ||
            userMessage.includes('for me')) {
          // User selected themselves
          setIsForUser(true);
          setPatientInfo(userProfile);
          addSystemMessage("Rendez-vous sera pris pour vous", 'success');
          setTimeout(() => setCurrentFlow('dentist-selection'), 1000);
        } else {
          // Try to parse patient info from message
          const parsePatientInfo = (message: string) => {
            const lowerMsg = message.toLowerCase();
            let name = '';
            let age = 0;
            let relationship = '';

            // Extract age
            const ageMatch = message.match(/\d+/);
            if (ageMatch) {
              age = parseInt(ageMatch[0]);
            }

            // Extract relationship and name
            if (lowerMsg.includes('ma fille') || lowerMsg.includes('my daughter') || lowerMsg.includes('mijn dochter')) {
              relationship = 'child';
              const nameMatch = message.match(/(?:ma fille|my daughter|mijn dochter)\s+([a-zA-ZÀ-ÿ\u0100-\u017F]+)/i);
              if (nameMatch) name = nameMatch[1];
            } else if (lowerMsg.includes('mon fils') || lowerMsg.includes('my son') || lowerMsg.includes('mijn zoon')) {
              relationship = 'child';
              const nameMatch = message.match(/(?:mon fils|my son|mijn zoon)\s+([a-zA-ZÀ-ÿ\u0100-\u017F]+)/i);
              if (nameMatch) name = nameMatch[1];
            } else if (lowerMsg.includes('ma femme') || lowerMsg.includes('my wife')) {
              relationship = 'spouse';
              const nameMatch = message.match(/(?:ma femme|my wife)\s+([a-zA-ZÀ-ÿ\u0100-\u017F]+)/i);
              if (nameMatch) name = nameMatch[1];
            } else if (lowerMsg.includes('mon mari') || lowerMsg.includes('my husband')) {
              relationship = 'spouse';
              const nameMatch = message.match(/(?:mon mari|my husband)\s+([a-zA-ZÀ-ÿ\u0100-\u017F]+)/i);
              if (nameMatch) name = nameMatch[1];
            }

            return { name: name || 'Patient', age: age || 25, relationship: relationship || 'other' };
          };

          const parsedInfo = parsePatientInfo(userMessage);
          setIsForUser(false);
          setPatientInfo(parsedInfo);
          addSystemMessage(`Rendez-vous sera pris pour ${parsedInfo.name}`, 'success');
          setTimeout(() => setCurrentFlow('dentist-selection'), 1000);
        }
      }

      return {
        id: crypto.randomUUID(),
        session_id: sessionId,
        message: response,
        is_bot: true,
        message_type: "text",
        metadata: { 
          ai_generated: true, 
          suggestions
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
        if (user) {
          setTimeout(() => setCurrentFlow('patient-selection'), 1000);
        }
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
    const currentInput = inputMessage;
    setInputMessage("");
    setIsLoading(true);
    setActionButtons([]); // Clear action buttons when new message is sent

    // Save user message
    await saveMessage(userMessage);

    // Check for chat commands first
    if (user && handleChatCommands(currentInput)) {
      setIsLoading(false);
      return;
    }

    // Generate bot response
    setTimeout(async () => {
      const botResponse = await generateBotResponse(userMessage.message);
      setMessages(prev => [...prev, botResponse]);
      await saveMessage(botResponse);
      
      setIsLoading(false);
    }, 1000);
  };

  const handleChatCommands = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();

    // Appointment management commands
    if (lowerMessage.includes('show') && (lowerMessage.includes('appointment') || lowerMessage.includes('rendez-vous'))) {
      appointmentManager?.showAppointments();
      return true;
    }
    
    if (lowerMessage.includes('next appointment') || lowerMessage.includes('prochain rendez-vous')) {
      appointmentManager?.showAppointments();
      return true;
    }

    if (lowerMessage.includes('book') && lowerMessage.includes('appointment')) {
      setShowChatBooking(true);
      return true;
    }

    // Settings commands
    if (settingsManager?.processSettingsCommand(message)) {
      return true;
    }

    return false;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleActionButton = (action: string, data?: any) => {
    setActionButtons([]);
    
    switch (action) {
      case 'book_appointment':
        setShowChatBooking(true);
        break;
      case 'cancel_appointment':
        if (data?.appointmentId) {
          appointmentManager?.cancelAppointment(data.appointmentId);
        }
        break;
      case 'reschedule_appointment':
        if (data?.appointmentId) {
          appointmentManager?.rescheduleAppointment(data.appointmentId);
        }
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await processVoiceMessage(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      recorder.start();
      setIsRecording(true);
      
      toast({
        title: "🎤 Enregistrement en cours",
        description: "Parlez maintenant...",
      });
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: t.error,
        description: t.microphoneAccessError,
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const processVoiceMessage = async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
      
      // Convert audio to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Send to voice-to-text edge function
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });
      
      if (error) throw error;
      
      const transcribedText = data.text;
      
      if (transcribedText && transcribedText.trim()) {
        // Create user message with transcribed text
        const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          session_id: sessionId,
          message: transcribedText,
          is_bot: false,
          message_type: "voice",
          created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        await saveMessage(userMessage);

        // Generate bot response
        setTimeout(async () => {
          const botResponse = await generateBotResponse(transcribedText);
          setMessages(prev => [...prev, botResponse]);
          await saveMessage(botResponse);
          setIsLoading(false);
        }, 1000);
        
        toast({
          title: "✅ Message vocal reçu",
          description: `"${transcribedText}"`,
        });
      } else {
        toast({
          title: "Aucun texte détecté",
          description: "Veuillez réessayer",
          variant: "destructive",
        });
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error('Error processing voice message:', error);
      toast({
        title: t.error,
        description: t.voiceProcessingError,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleVoiceOrSend = () => {
    if (inputMessage.trim()) {
      handleSendMessage();
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  };


  const sendEmailSummary = async (appointmentData?: any, urgencyLevel?: string) => {
    if (!user) return;
    
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

          {/* Chat Input - Always at bottom */}
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
                onClick={handleVoiceOrSend}
                disabled={isLoading}
                className={`shrink-0 hover:shadow-glow text-white px-4 sm:px-6 rounded-xl transition-all duration-300 hover:scale-105 h-10 sm:h-11 ${
                  inputMessage.trim() 
                    ? 'bg-gradient-primary' 
                    : isRecording 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-gradient-secondary'
                }`}
              >
                {inputMessage.trim() ? (
                  <Send className="h-4 w-4" />
                ) : isRecording ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Action Buttons - only show when in chat mode */}
            {currentFlow === 'chat' && (
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4">
                <Button
                  variant="outline"
                  size="sm"
                 onClick={() => {
                   if (!user) {
                     const loginMessage: ChatMessage = {
                       id: crypto.randomUUID(),
                       session_id: sessionId,
                       message: "Vous devez vous connecter pour prendre un rendez-vous. Cliquez sur le bouton 'Se connecter' en haut à droite.",
                       is_bot: true,
                       message_type: "text",
                       created_at: new Date().toISOString(),
                     };
                     setMessages(prev => [...prev, loginMessage]);
                   } else {
                     // Skip patient selection if it's for the user
                     setIsForUser(true);
                     setPatientInfo(userProfile);
                     setCurrentFlow('dentist-selection');
                   }
                 }}
                  className="flex items-center gap-1 sm:gap-2 floating-card border-dental-primary/30 text-dental-primary hover:bg-dental-primary/10 hover:scale-105 transition-all duration-300 text-xs sm:text-sm px-3 sm:px-4 py-2"
                >
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Book Appointment</span>
                  <span className="xs:hidden">Book</span>
                </Button>
              </div>
            )}
          </div>

          {/* Action Panels - Above chat input */}
          {currentFlow === 'patient-selection' && user && (
            <div className="border-t border-dental-primary/20 p-6 glass-card animate-fade-in">
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

          {currentFlow === 'dentist-selection' && user && (
            <div className="border-t border-dental-primary/20 p-6 glass-card animate-fade-in">
              <DentistSelection
                onSelectDentist={(dentist) => {
                  setSelectedDentist(dentist);
                  addSystemMessage(`Dentist selected: Dr ${dentist.profiles.first_name} ${dentist.profiles.last_name}`, 'success');
                  setCurrentFlow('booking');
                }}
                selectedDentistId={selectedDentist?.id}
                recommendedDentist={recommendedDentist}
              />
            </div>
          )}

          {currentFlow === 'booking' && user && (
            <div className="border-t border-dental-secondary/20 p-6 glass-card animate-fade-in">
              <AppointmentBookingWithAuth
                user={user}
                selectedDentist={selectedDentist}
                prefilledReason={consultationReason}
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
            <div className="border-t border-dental-accent/20 p-6 glass-card animate-fade-in">
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
            <div className="border-t border-dental-accent/20 p-6 glass-card animate-fade-in">
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
          
          {/* Chat Booking Flow */}
          {showChatBooking && user && (
            <div className="border-t border-dental-primary/20 p-6 glass-card animate-fade-in">
              <ChatBookingFlow
                user={user}
                selectedDentist={selectedDentist}
                onComplete={(appointmentData) => {
                  addChatResponse(appointmentData.message);
                  setShowChatBooking(false);
                }}
                onCancel={() => setShowChatBooking(false)}
                onResponse={addChatResponse}
              />
            </div>
          )}

          {/* Action Buttons for chat responses */}
          {actionButtons.length > 0 && currentFlow === 'chat' && (
            <div className="border-t border-dental-primary/20 p-4 glass-card">
              <div className="flex flex-wrap gap-2">
                {actionButtons.map((button, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleActionButton(button.action, button.data)}
                    className="text-dental-primary border-dental-primary/30 hover:bg-dental-primary/10"
                  >
                    {button.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Settings Form */}
          {settingsManager && <settingsManager.PersonalInfoForm />}
        </CardContent>
      </Card>
    </div>
  );
};