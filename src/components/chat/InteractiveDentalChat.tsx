// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, changeLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User as UserIcon, Mic, MicOff } from "lucide-react";
import { ChatMessage } from "@/types/chat";
import { format } from "date-fns";
import { 
  PrivacyConsentWidget,
  InlineCalendarWidget,
  TimeSlotsWidget,
  DentistSelectionWidget,
  AppointmentConfirmationWidget,
  PersonalInfoFormWidget,
  QuickSettingsWidget,
  ImageUploadWidget,
  UrgencySliderWidget,
  PayNowWidget,
  RescheduleWidget,
  CancelAppointmentWidget,
  PrescriptionRefillWidget
} from "./InteractiveChatWidgets";
import { AIChatOnboardingDialog } from "./AIChatOnboardingDialog";

interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

interface DentistWithProfile {
  id: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface AppointmentData {
  id?: string;
  date?: Date;
  time?: string;
  dentist?: DentistWithProfile;
  reason?: string;
  [key: string]: unknown;
}

interface PrescriptionData {
  id: string;
  [key: string]: unknown;
}

interface InteractiveDentalChatProps {
  user: User | null;
  triggerBooking?: 'low' | 'medium' | 'high' | 'emergency' | false;
  onBookingTriggered?: () => void;
}

interface WidgetData {
  dentists?: DentistWithProfile[];
  recommendedDentists?: string[];
  availableTimeSlots?: TimeSlot[];
  slots?: TimeSlot[];
  selectedDentist?: DentistWithProfile;
  urgency?: number;
  outstandingAmount?: number;
  appointment?: AppointmentData;
  prescriptions?: PrescriptionData[];
  [key: string]: unknown;
}

interface BookingFlowState {
  reason: string;
  selectedDentist: DentistWithProfile | null;
  selectedDate: Date | null;
  selectedTime: string;
  urgency: number;
  step: string;
}

export const InteractiveDentalChat = ({ 
  user, 
  triggerBooking, 
  onBookingTriggered 
}: InteractiveDentalChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [hasConsented, setHasConsented] = useState(true);
  const [showConsentWidget, setShowConsentWidget] = useState(!user);
  const [activeWidget, setActiveWidget] = useState<string | null>(null);
  const [widgetData, setWidgetData] = useState<WidgetData>({});
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Booking flow state
  const [bookingFlow, setBookingFlow] = useState<BookingFlowState>({
    reason: '',
    selectedDentist: null,
    selectedDate: null,
    selectedTime: '',
    urgency: 1,
    step: 'dentist'
  });

  const { t } = useLanguage();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeWidget]);

  useEffect(() => {
    if (user) {
      setHasConsented(true);
      setShowConsentWidget(false);
      loadUserProfile();
      initializeChat();
      
      // Check if onboarding has been seen
      const hasSeenOnboarding = localStorage.getItem('ai-chat-onboarding-seen');
      if (!hasSeenOnboarding) {
        // Show onboarding after a short delay
        setTimeout(() => setShowOnboarding(true), 500);
      }
    } else {
      setShowConsentWidget(true);
    }
  }, [user]);

  useEffect(() => {
    if (triggerBooking && hasConsented) {
      if (triggerBooking === 'high' || triggerBooking === 'emergency') {
        startEmergencyBookingWithUrgency(triggerBooking);
      } else {
        startBookingFlow();
      }
      onBookingTriggered?.();
    }
  }, [triggerBooking, hasConsented, onBookingTriggered]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

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

  const initializeChat = () => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: crypto.randomUUID(),
        session_id: sessionId as any,
        message: user && userProfile ? 
          `Hello ${userProfile.first_name}! 👋 I'm your dental assistant. How can I help you today?` : 
          `Hello! 👋 Welcome to First Smile AI. I'm your dental assistant. How can I help you today?`,
        is_bot: true,
        message_type: "text",
        created_at: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    }
  };

  const saveMessage = async (message: ChatMessage) => {
    if (!user) return;
    
    try {
      await supabase.from("chat_messages").insert({
        session_id: message.session_id,
        user_id: user.id,
        message: message.message,
        is_bot: message.is_bot,
        message_type: message.message_type,
        metadata: message.metadata as any,
      } as any);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const addBotMessage = (message: string, type: 'text' | 'success' | 'info' | 'warning' = 'text') => {
    const botMessage: ChatMessage = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      message,
      is_bot: true,
      message_type: type,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, botMessage]);
    saveMessage(botMessage);
  };

  const generateBotResponse = async (
    userMessage: string,
    history: ChatMessage[]
  ): Promise<{ message: ChatMessage; fallback: boolean; suggestions: string[]; recommendedDentists: string[] }> => {
    try {
      const aiResponse = await supabase.functions.invoke('dental-ai-chat', {
        body: {
          message: userMessage,
          conversation_history: history,
          user_profile: userProfile || (user ? {
            name: user.email?.split('@')[0] || 'Patient',
            email: user.email
          } : {
            name: 'Guest',
            email: null
          })
        }
      });

      console.log('🔧 AI Response received:', aiResponse);

      if (aiResponse.error) {
        console.error('AI function error:', aiResponse.error);
        throw aiResponse.error;
      }

      const responseText = aiResponse.data?.response || aiResponse.data?.fallback_response || "I'm sorry, I couldn't process your request.";
      const result = {
        id: crypto.randomUUID(),
        session_id: sessionId as any,
        message: responseText,
        is_bot: true,
        message_type: 'text',
        created_at: new Date().toISOString(),
      } as ChatMessage;
      return {
        message: result,
        fallback: Boolean(aiResponse.data?.fallback_response && !aiResponse.data?.response),
        suggestions: aiResponse.data?.suggestions || [],
        recommendedDentists: aiResponse.data?.recommended_dentist || []
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      return {
        message: {
          id: crypto.randomUUID(),
          session_id: sessionId as any,
          message: "I'm sorry, I couldn't process your request.",
          is_bot: true,
          message_type: 'text',
          created_at: new Date().toISOString(),
        } as ChatMessage,
        fallback: true,
        suggestions: [],
        recommendedDentists: []
      };
    }
  };

  const handleSuggestions = (suggestions: string[], recommendedDentists?: string[]) => {
    console.log('🔧 handleSuggestions called with:', { suggestions, recommendedDentists });
    
    if (!suggestions || suggestions.length === 0) return;
    
    if (suggestions.includes('appointments-list')) {
      showAppointments();
      return;
    }
    
    if (suggestions.includes('show-appointments')) {
      showAppointments();
      return;
    }
    
    if (suggestions.includes('appointments')) {
      showAppointments();
      return;
    }
    
    if (suggestions.includes('pay-now')) {
      console.log('🔧 Triggering pay-now widget');
      showPayNowWidget();
      return;
    }
    
    if (suggestions.includes('reschedule')) {
      console.log('🔧 Triggering reschedule widget');
      showRescheduleWidget();
      return;
    }
    
    if (suggestions.includes('cancel-appointment')) {
      console.log('🔧 Triggering cancel-appointment widget');
      showCancelAppointmentWidget();
      return;
    }
    
    if (suggestions.includes('prescription-refill')) {
      console.log('🔧 Triggering prescription-refill widget');
      showPrescriptionRefillWidget();
      return;
    }

    if (suggestions.includes('recommend-dentist')) {
      loadDentistsForBooking(false, recommendedDentists);
      return;
    }

    if (suggestions.includes('theme-dark')) {
      setTheme('dark');
      addBotMessage('Theme changed to dark mode! 🌙');
      return;
    }

    if (suggestions.includes('theme-light')) {
      setTheme('light');
      addBotMessage('Theme changed to light mode! ☀️');
      return;
    }

    if (suggestions.includes('language-en')) {
      handleLanguageChange('en');
      return;
    }

    if (suggestions.includes('language-fr')) {
      handleLanguageChange('fr');
      return;
    }

    if (suggestions.includes('language-nl')) {
      handleLanguageChange('nl');
      return;
    }

    if (suggestions.includes('language-options')) {
      setActiveWidget('quick-settings');
      addBotMessage('Please choose your preferred language:');
      return;
    }

    if (suggestions.includes('theme-options')) {
      setActiveWidget('quick-settings');
      addBotMessage('Please select a theme:');
      return;
    }

    if (
      suggestions.includes('booking') ||
      suggestions.includes('skip-patient-selection')
    ) {
      startBookingFlow();
    }
  };

  const handleConsent = (accepted: boolean) => {
    if (!accepted) {
      addBotMessage("Please log in to continue using First Smile AI.");
      setShowConsentWidget(false);
      return;
    }

    setHasConsented(true);
    setShowConsentWidget(false);
    addBotMessage("Welcome to First Smile AI! 🎉 Please log in to book appointments and access all features.");
  };


  const showAppointments = async () => {
    if (!user) {
      addBotMessage("Please log in to view your appointments.");
      return;
    }

    addBotMessage("Let me check your appointments... 🔍");
    
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        addBotMessage("I couldn't find your profile. Please complete your profile first.");
        return;
      }

      const { data: appointments, error } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          reason,
          status,
          notes,
          dentists:dentist_id (
            profiles:profile_id (
              first_name,
              last_name
            )
          )
        `)
        .eq("patient_id", profile.id)
        .order("appointment_date", { ascending: true });

      if (error) throw error;

      if (!appointments || appointments.length === 0) {
        addBotMessage("You don't have any appointments scheduled yet. Would you like to book one? 📅");
        return;
      }

      const now = new Date();
      const upcoming = appointments.filter(apt => new Date(apt.appointment_date) >= now);
      const past = appointments.filter(apt => new Date(apt.appointment_date) < now);

      let responseMessage = "";

      if (upcoming.length > 0) {
        responseMessage += `📅 **Your upcoming appointments:**\n\n`;
        upcoming.forEach((apt, index) => {
          const date = new Date(apt.appointment_date);
          const dentistName = apt.dentists?.profiles 
            ? `Dr. ${apt.dentists.profiles.first_name} ${apt.dentists.profiles.last_name}`
            : "Unknown dentist";
          
          responseMessage += `${index + 1}. **${format(date, "EEEE, MMMM d")}** at **${format(date, "h:mm a")}**\n`;
          responseMessage += `   👨‍⚕️ ${dentistName}\n`;
          responseMessage += `   📝 ${apt.reason}\n`;
          responseMessage += `   🔸 Status: ${apt.status}\n\n`;
        });
      }

      if (past.length > 0 && upcoming.length === 0) {
        responseMessage += `📋 **Your recent appointments:**\n\n`;
        past.slice(-3).forEach((apt, index) => {
          const date = new Date(apt.appointment_date);
          const dentistName = apt.dentists?.profiles 
            ? `Dr. ${apt.dentists.profiles.first_name} ${apt.dentists.profiles.last_name}`
            : "Unknown dentist";
          
          responseMessage += `${index + 1}. **${format(date, "EEEE, MMMM d")}** at **${format(date, "h:mm a")}**\n`;
          responseMessage += `   👨‍⚕️ ${dentistName}\n`;
          responseMessage += `   📝 ${apt.reason}\n\n`;
        });
        responseMessage += "\nNo upcoming appointments. Would you like to book one? 📅";
      }

      addBotMessage(responseMessage);
      


  } catch (error) {
    console.error("Error fetching appointments:", error);
    addBotMessage("I'm sorry, I couldn't retrieve your appointments right now. Please try again later.");
  }
};

  const startBookingFlow = () => {
    if (!user) {
      addBotMessage(
        "Please log in to book an appointment. You can find the login button at the top right of the page."
      );
      return;
    }

    setBookingFlow({
      ...bookingFlow,
      reason: '',
      selectedDentist: null,
      selectedDate: null,
      selectedTime: '',
      step: 'reason'
    });

  };

  const startEmergencyBooking = () => {
    if (!user) {
      addBotMessage("Please log in to book an emergency appointment.");
      return;
    }

    setBookingFlow({ ...bookingFlow, reason: 'emergency', urgency: 3, step: 'dentist' });
    addBotMessage("🚨 **Emergency Booking** - I'll find you the earliest available slot with any dentist.");
    loadDentistsForBooking(true);
  };

  const startEmergencyBookingWithUrgency = (urgencyLevel: 'low' | 'medium' | 'high' | 'emergency') => {
    if (!user) {
      addBotMessage("Please log in to book an emergency appointment.");
      return;
    }

    const urgencyScore = urgencyLevel === 'emergency' ? 5 : 
                        urgencyLevel === 'high' ? 4 : 
                        urgencyLevel === 'medium' ? 3 : 2;

    setBookingFlow({ 
      ...bookingFlow, 
      reason: `${urgencyLevel} priority appointment`, 
      urgency: urgencyScore, 
      step: 'dentist' 
    });
    
    const urgencyMessage = urgencyLevel === 'emergency' ? 
      "🚨 **EMERGENCY** - Finding immediate care with available dentist..." :
      `⚡ **${urgencyLevel.toUpperCase()} PRIORITY** - Finding urgent appointment with available dentist...`;
    
    addBotMessage(urgencyMessage);
    loadDentistsForBooking(true); // Auto-select first available dentist for urgent cases
  };

  const showHelp = () => {
    const helpMessage = `
**Here's what I can help you with:** ❓

🗓️ **Appointments**
- "Show my appointments"
- "Book an appointment"
- "Find earliest slot"

⚙️ **Settings**
- "Change language to English/French/Dutch"
- "Switch to dark/light mode"
- "Update my personal information"

📷 **Upload Images**
- "Upload a photo"
- Share X-rays or dental images

🚨 **Emergency**
- "Emergency booking" for urgent care

Just type what you need! 😊
    `;
    
    addBotMessage(helpMessage);
  };

  const loadDentistsForBooking = async (autoSelect = false, recommendedDentists?: string[]) => {
    try {
      const { data, error } = await supabase
        .from("dentists")
        .select(`
          id,
          specialization,
          profiles:profile_id (
            first_name,
            last_name
          )
        `)
        .eq("is_active", true);

      if (error) throw error;
      
      if (autoSelect && data && data.length > 0) {
        handleDentistSelection(data[0]);
      } else {
        setBookingFlow(prev => ({ ...prev, step: 'dentist' }));
        setWidgetData({ dentists: data || [], recommendedDentists });
        setActiveWidget('dentist-selection');
        addBotMessage("Please choose your preferred dentist:");
      }
      
    } catch (error) {
      console.error("Error fetching dentists:", error);
      addBotMessage("I couldn't load the dentist list. Please try again.");
    }
  };


  const handleDentistSelection = (dentist: any) => {
    setBookingFlow({ ...bookingFlow, selectedDentist: dentist, step: 'date' });
    setActiveWidget(null);
    
    addBotMessage(`Perfect! You selected **Dr. ${dentist.profiles?.first_name} ${dentist.profiles?.last_name}** 👨‍⚕️`);
    
    setTimeout(() => {
      setActiveWidget('calendar');
      addBotMessage("Now, please select your preferred date:");
    }, 1000);
  };

  const handleDateSelection = async (date: Date) => {
    setBookingFlow({ ...bookingFlow, selectedDate: date, step: 'time' });
    setActiveWidget(null);
    
    const dateStr = date.toISOString().split('T')[0];
    console.log('handleDateSelection called with date:', dateStr, 'dentist:', bookingFlow.selectedDentist);
    
    addBotMessage(`Date selected: **${format(date, "EEEE, MMMM d, yyyy")}** 📅`);
    addBotMessage("Loading available times... ⏳");
    
    try {
      // Import the availability function
      const { fetchDentistAvailability } = await import('@/lib/appointmentAvailability');
      
      // Get real availability data including appointments, vacation, and working hours
      const availabilitySlots = await fetchDentistAvailability(
        bookingFlow.selectedDentist.id,
        date
      );
      
      console.log('Raw availability slots:', availabilitySlots);

      // Map to the widget format
      const slots = availabilitySlots.map(slot => ({
        time: slot.time.substring(0, 5), // Format: "HH:mm"
        available: slot.available && (bookingFlow.urgency >= 4 ? true : slot.reason !== 'emergency_only'),
        reason: slot.reason
      }));

      setWidgetData({ slots });
      
      const availableCount = slots.filter(s => s.available).length;
      
      if (availableCount === 0) {
        // Check if dentist is on vacation
        const vacationSlot = slots.find(s => s.reason === 'vacation');
        if (vacationSlot) {
          addBotMessage(`⚠️ Dr. ${bookingFlow.selectedDentist.profiles?.first_name} is on vacation on ${format(date, "EEEE, MMMM d")}. Please select a different date.`);
        } else {
          addBotMessage(`No available slots for ${format(date, "EEEE, MMMM d")}. Please select a different date.`);
        }
        setTimeout(() => setActiveWidget('calendar'), 1000);
      } else {
        setActiveWidget('time-slots');
        addBotMessage("Please choose your preferred time:");
      }
      
  } catch (error) {
    console.error("Error fetching slots:", error);
    addBotMessage("I couldn't load the available times. Please try a different date.");
    setTimeout(() => setActiveWidget('calendar'), 1000);
  }
};

  const handleTimeSelection = (time: string) => {
    setBookingFlow({ ...bookingFlow, selectedTime: time, step: 'confirm' });
    setActiveWidget(null);

    addBotMessage(`Time selected: **${time}** 🕐`);

    setTimeout(async () => {
      const appointmentData = {
        date: bookingFlow.selectedDate,
        time: time,
        dentist: bookingFlow.selectedDentist,
        reason: bookingFlow.reason
      };
      setWidgetData({ appointment: appointmentData });
      setActiveWidget('appointment-confirmation');
      addBotMessage("Please review and confirm your appointment:");
    }, 1000);
  };

  const handleAppointmentConfirmation = async () => {
    if (!user || !bookingFlow.selectedDate || !bookingFlow.selectedTime || !bookingFlow.selectedDentist) {
      addBotMessage("Missing information. Please start the booking process again.");
      return;
    }

    setActiveWidget(null);
    addBotMessage("Booking your appointment... ⏳");

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, phone, email")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const requiredFields = ['first_name', 'last_name', 'phone', 'email'];
      const missingFields = requiredFields.filter(field => !profile[field]);
      
      if (missingFields.length > 0) {
        addBotMessage("I need some additional information to complete your booking. Please update your profile first.");
        setTimeout(() => setActiveWidget('personal-info'), 1000);
        return;
      }

      const appointmentDateTime = new Date(bookingFlow.selectedDate);
      const [hours, minutes] = bookingFlow.selectedTime.split(":");
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          patient_id: profile.id,
          dentist_id: bookingFlow.selectedDentist.id,
          appointment_date: appointmentDateTime.toISOString(),
          reason: bookingFlow.reason || "General consultation",
          status: "pending",
           urgency: bookingFlow.urgency >= 5 ? "emergency" : 
                   bookingFlow.urgency === 4 ? "high" : 
                   bookingFlow.urgency === 3 ? "medium" : "low"
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      const { error: slotError } = await supabase.rpc('book_appointment_slot', {
        p_dentist_id: bookingFlow.selectedDentist.id,
        p_slot_date: bookingFlow.selectedDate.toISOString().split('T')[0],
        p_slot_time: bookingFlow.selectedTime + ':00',
        p_appointment_id: appointmentData.id
      });

      if (slotError) {
        await supabase.from("appointments").delete().eq("id", appointmentData.id);
        throw new Error("This time slot is no longer available");
      }

      toast({
        title: "Appointment Confirmed! 🎉",
        description: `${format(bookingFlow.selectedDate, "EEEE, MMMM d")} at ${bookingFlow.selectedTime}`
      });

      const confirmationMessage = `🎉 **Appointment Confirmed!**

📅 **Date:** ${format(bookingFlow.selectedDate, "EEEE, MMMM d, yyyy")}
🕒 **Time:** ${bookingFlow.selectedTime}
👨‍⚕️ **Dentist:** Dr. ${bookingFlow.selectedDentist.profiles?.first_name} ${bookingFlow.selectedDentist.profiles?.last_name}
📝 **Type:** ${bookingFlow.reason || "General consultation"}

You'll receive a confirmation email shortly. If you need to reschedule or cancel, just ask me! 😊`;

      addBotMessage(confirmationMessage, 'success');

      // Reset booking flow
      setBookingFlow({
        reason: '',
        selectedDentist: null,
        selectedDate: null,
        selectedTime: '',
        urgency: 1,
        step: 'dentist'
      });



  } catch (error) {
    console.error("Error booking appointment:", error);
    addBotMessage("I'm sorry, I couldn't complete your booking. Please try again or contact the clinic directly.");
  }
};

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !hasConsented) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      message: inputMessage,
      is_bot: false,
      message_type: "text",
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage.toLowerCase();
    setInputMessage("");
    setIsLoading(true);

  await saveMessage(userMessage);

  if (bookingFlow.step === 'reason') {
    if (!bookingFlow.reason) {
      setBookingFlow({
        ...bookingFlow,
        reason: userMessage.message
      });
    }
    // Wait for AI suggestions before continuing the booking flow
  }


    if (currentInput.includes('help')) {
      showHelp();
      setIsLoading(false);
      return;
    }

    if (currentInput.includes('emergency') || currentInput.includes('urgent')) {
      startEmergencyBooking();
      setIsLoading(false);
      return;
    }

    const history = [...messages, userMessage].slice(-10);
    const { message: botResponse, fallback, suggestions, recommendedDentists } = await generateBotResponse(userMessage.message, history);
    setMessages(prev => [...prev, botResponse]);
    await saveMessage(botResponse);

    setIsLoading(false);

    handleSuggestions(suggestions, recommendedDentists);
  };

  const handleLanguageChange = (lang: string) => {
    changeLanguage(lang as 'en' | 'fr' | 'nl');
    localStorage.setItem('preferred-language', lang);
    
    const langNames = {
      en: 'English',
      fr: 'French', 
      nl: 'Dutch'
    };
    
    addBotMessage(`✅ Language changed to ${langNames[lang as keyof typeof langNames]} successfully!`);
    
    toast({
      title: "Success",
      description: `Language changed to ${langNames[lang as keyof typeof langNames]}`
    });
  };

  const handlePayNow = async () => {
    if (!user) return;
    
    try {
      setActiveWidget(null);
      addBotMessage("Opening secure payment page... 💳");
      
      // Get user's profile and outstanding payments
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      // Get outstanding payment requests
      const { data: paymentRequests } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('patient_id', profile.id)
        .eq('status', 'pending')
        .limit(1);

      if (paymentRequests && paymentRequests.length > 0) {
        const paymentRequest = paymentRequests[0];
        
        const { data } = await supabase.functions.invoke('create-payment-request', {
          body: {
            payment_request_id: paymentRequest.id
          }
        });

        if (data?.payment_url) {
          window.open(data.payment_url, '_blank');
          addBotMessage("✅ Payment page opened in a new tab. Complete your payment there and I'll update your status!");
        }
      } else {
        addBotMessage("No outstanding payments found. Your account appears to be up to date! ✅");
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      addBotMessage("Sorry, I couldn't open the payment page. Please try again or contact your dentist.");
    }
  };

  const handleReschedule = () => {
    setActiveWidget(null);
    addBotMessage("Let me help you reschedule your appointment. I'll start the booking process to find you a new slot!");
    
    // Start booking flow for rescheduling
    setTimeout(() => {
      startBookingFlow();
    }, 1000);
  };

  const handleCancelAppointment = async () => {
    if (!user || !widgetData?.appointment) return;
    
    try {
      setActiveWidget(null);
      addBotMessage("Cancelling your appointment... 🗓️");
      
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', widgetData.appointment.id);

      if (error) throw error;

      addBotMessage("✅ Your appointment has been cancelled successfully. If you need to book a new appointment, just let me know!");
      
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      addBotMessage("Sorry, I couldn't cancel your appointment. Please contact your dentist directly.");
    }
  };

  const handlePrescriptionRefill = async (prescriptionId: string) => {
    if (!user) return;
    
    try {
      setActiveWidget(null);
      addBotMessage("Sending refill request to your dentist... 💊");
      
      // Get prescription details
      const { data: prescription } = await supabase
        .from('prescriptions')
        .select('*, dentist_id')
        .eq('id', prescriptionId)
        .single();

      if (!prescription) throw new Error("Prescription not found");

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      // Create notification for dentist
      const { data: dentistProfile } = await supabase
        .from('dentists')
        .select('profile_id')
        .eq('id', prescription.dentist_id)
        .single();

      if (dentistProfile) {
        const { data: dentistUserProfile } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .eq('id', dentistProfile.profile_id)
          .single();

        if (dentistUserProfile) {
          await supabase
            .from('notifications')
            .insert({
              user_id: dentistUserProfile.user_id,
              patient_id: profile.id,
              dentist_id: prescription.dentist_id,
              type: 'prescription_refill',
              title: 'Prescription Refill Request',
              message: `Refill request for ${prescription.medication_name}`,
              priority: 'medium',
              metadata: { prescription_id: prescriptionId }
            });
        }
      }

      addBotMessage(`✅ Refill request sent for ${prescription.medication_name}! Your dentist will review and contact you soon.`);
      
    } catch (error) {
      console.error('Error requesting refill:', error);
      addBotMessage("Sorry, I couldn't send the refill request. Please contact your dentist directly.");
    }
  };

  const showPayNowWidget = async () => {
    if (!user) {
      addBotMessage("Please log in to view your payment information.");
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        addBotMessage("Profile not found. Please complete your profile first.");
        return;
      }

      // Get outstanding payment requests
      const { data: paymentRequests, error } = await supabase
        .from('payment_requests')
        .select('amount')
        .eq('patient_id', profile.id)
        .eq('status', 'pending');

      if (error) throw error;

      const totalOutstanding = paymentRequests?.reduce((sum, req) => sum + req.amount, 0) || 0;

      if (totalOutstanding === 0) {
        addBotMessage("Great news! You don't have any outstanding payments. Your account is up to date! ✅");
        return;
      }

      setWidgetData({ outstandingAmount: totalOutstanding });
      setActiveWidget('pay-now');
      addBotMessage("I found outstanding payments on your account. You can pay securely online:");

    } catch (error) {
      console.error("Error fetching payment info:", error);
      addBotMessage("I couldn't retrieve your payment information. Please try again.");
    }
  };

  const showRescheduleWidget = async () => {
    if (!user) {
      addBotMessage("Please log in to reschedule your appointment.");
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        addBotMessage("Profile not found. Please complete your profile first.");
        return;
      }

      // Get next upcoming appointment
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          reason,
          dentists (
            profiles:profile_id (
              first_name,
              last_name
            )
          )
        `)
        .eq("patient_id", profile.id)
        .gte("appointment_date", new Date().toISOString())
        .eq("status", "confirmed")
        .order("appointment_date", { ascending: true })
        .limit(1);

      if (error) throw error;

      if (!appointments || appointments.length === 0) {
        addBotMessage("You don't have any upcoming appointments to reschedule. Would you like to book a new appointment?");
        return;
      }

      const appointment = appointments[0];
      const dentistName = appointment.dentists?.profiles ? 
        `${appointment.dentists.profiles.first_name} ${appointment.dentists.profiles.last_name}` : 
        "Your dentist";

      setWidgetData({ 
        appointment: { 
          ...appointment, 
          dentist_name: dentistName 
        } 
      });
      setActiveWidget('reschedule');
      addBotMessage("I found your next appointment. Would you like to reschedule it?");

    } catch (error) {
      console.error("Error fetching appointment:", error);
      addBotMessage("I couldn't retrieve your appointment information. Please try again.");
    }
  };

  const showCancelAppointmentWidget = async () => {
    if (!user) {
      addBotMessage("Please log in to cancel your appointment.");
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        addBotMessage("Profile not found. Please complete your profile first.");
        return;
      }

      // Get next upcoming appointment
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          reason,
          dentists (
            profiles:profile_id (
              first_name,
              last_name
            )
          )
        `)
        .eq("patient_id", profile.id)
        .gte("appointment_date", new Date().toISOString())
        .eq("status", "confirmed")
        .order("appointment_date", { ascending: true })
        .limit(1);

      if (error) throw error;

      if (!appointments || appointments.length === 0) {
        addBotMessage("You don't have any upcoming appointments to cancel.");
        return;
      }

      const appointment = appointments[0];
      const dentistName = appointment.dentists?.profiles ? 
        `${appointment.dentists.profiles.first_name} ${appointment.dentists.profiles.last_name}` : 
        "Your dentist";

      setWidgetData({ 
        appointment: { 
          ...appointment, 
          dentist_name: dentistName 
        } 
      });
      setActiveWidget('cancel-appointment');
      addBotMessage("I found your next appointment. Are you sure you want to cancel it?");

    } catch (error) {
      console.error("Error fetching appointment:", error);
      addBotMessage("I couldn't retrieve your appointment information. Please try again.");
    }
  };

  const showPrescriptionRefillWidget = async () => {
    if (!user) {
      addBotMessage("Please log in to request prescription refills.");
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        addBotMessage("Profile not found. Please complete your profile first.");
        return;
      }

      // Get recent prescriptions (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: prescriptions, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', profile.id)
        .gte('created_at', sixMonthsAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setWidgetData({ prescriptions: prescriptions || [] });
      setActiveWidget('prescription-refill');
      
      if (!prescriptions || prescriptions.length === 0) {
        addBotMessage("I couldn't find any recent prescriptions. You can still request a refill - I'll help you contact your dentist.");
      } else {
        addBotMessage("I found your recent prescriptions. Which one would you like to refill?");
      }

    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      addBotMessage("I couldn't retrieve your prescription information. Please try again.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderWidget = () => {
    if (!activeWidget) return null;

    switch (activeWidget) {
      
      case 'dentist-selection':
        return (
          <DentistSelectionWidget
            dentists={widgetData.dentists || []}
            onSelect={handleDentistSelection}
            recommendedDentists={widgetData.recommendedDentists}
          />
        );
      
      case 'calendar':
        return (
          <InlineCalendarWidget
            selectedDate={bookingFlow.selectedDate || undefined}
            onDateSelect={handleDateSelection}
            dentistId={bookingFlow.selectedDentist?.id}
            dentistName={bookingFlow.selectedDentist ? 
              `Dr. ${bookingFlow.selectedDentist.profiles?.first_name} ${bookingFlow.selectedDentist.profiles?.last_name}` : 
              undefined
            }
          />
        );
      
      case 'time-slots':
        return (
          <TimeSlotsWidget
            slots={widgetData.slots || []}
            selectedTime={bookingFlow.selectedTime}
            onTimeSelect={handleTimeSelection}
          />
        );
      
      case 'appointment-confirmation':
        return (
          <AppointmentConfirmationWidget
            appointment={widgetData.appointment}
            onConfirm={handleAppointmentConfirmation}
            onCancel={() => {
              setActiveWidget(null);
              addBotMessage("Appointment cancelled. Would you like to try a different time?");
            }}
          />
        );
      
      case 'personal-info':
        return user ? (
          <PersonalInfoFormWidget
            user={user}
            onSave={(data) => {
              setActiveWidget(null);
              addBotMessage("✅ Your information has been updated successfully!");
              toast({
                title: "Success",
                description: "Personal information saved"
              });
            }}
            onCancel={() => {
              setActiveWidget(null);
              addBotMessage("Information update cancelled.");
            }}
          />
        ) : null;
      
      case 'quick-settings':
        return (
          <QuickSettingsWidget
            onLanguageChange={handleLanguageChange}
            onThemeChange={(theme) => {
              setTheme(theme);
              addBotMessage(`✅ Theme changed to ${theme} mode!`);
            }}
          />
        );
      
      case 'image-upload':
        return (
          <ImageUploadWidget
            onUpload={(file) => {
              setActiveWidget(null);
              addBotMessage(`✅ Image "${file.name}" uploaded successfully! I'll analyze it and get back to you.`);
            }}
            onCancel={() => {
              setActiveWidget(null);
              addBotMessage("Image upload cancelled.");
            }}
          />
        );

      case 'pay-now':
        return widgetData?.outstandingAmount > 0 ? (
          <PayNowWidget
            outstandingAmount={widgetData.outstandingAmount}
            onPay={handlePayNow}
            onCancel={() => {
              setActiveWidget(null);
              addBotMessage("Payment cancelled. You can pay your balance anytime from your dashboard.");
            }}
          />
        ) : null;

      case 'reschedule':
        return widgetData?.appointment ? (
          <RescheduleWidget
            appointment={widgetData.appointment}
            onReschedule={handleReschedule}
            onCancel={() => {
              setActiveWidget(null);
              addBotMessage("Keeping your current appointment. If you need to reschedule later, just let me know!");
            }}
          />
        ) : null;

      case 'cancel-appointment':
        return widgetData?.appointment ? (
          <CancelAppointmentWidget
            appointment={widgetData.appointment}
            onConfirm={handleCancelAppointment}
            onCancel={() => {
              setActiveWidget(null);
              addBotMessage("Your appointment is still scheduled. If you need to cancel later, just let me know!");
            }}
          />
        ) : null;

      case 'prescription-refill':
        return (
          <PrescriptionRefillWidget
            prescriptions={widgetData?.prescriptions || []}
            onRequestRefill={handlePrescriptionRefill}
            onCancel={() => {
              setActiveWidget(null);
              addBotMessage("Prescription refill request cancelled. You can request refills anytime!");
            }}
          />
        );

      case 'urgency-slider':
        return (
          <UrgencySliderWidget
            value={bookingFlow.urgency}
            onChange={(value) => {
              setBookingFlow({ ...bookingFlow, urgency: value });
              setActiveWidget(null);
              addBotMessage(`Urgency level set to ${value}/5. Let me help you with your appointment.`);
              loadDentistsForBooking(false);
            }}
          />
        );
      

      default:
        return null;
    }
  };

  if (showConsentWidget) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-4 flex items-center justify-center">
          <PrivacyConsentWidget
            onAccept={() => handleConsent(true)}
            onDecline={() => handleConsent(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* AI Chat Onboarding Dialog */}
      <AIChatOnboardingDialog 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      />
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.is_bot ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`flex items-start space-x-2 max-w-md ${
                  message.is_bot ? "" : "flex-row-reverse space-x-reverse"
                }`}
              >
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
                    {message.message_type === 'success' && (
                      <Badge variant="secondary" className="mt-2">
                        Success
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2 max-w-md">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          {renderWidget()}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex space-x-2 max-w-4xl mx-auto">
          <Input
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
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