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
  AppointmentReasonWidget,
  InlineCalendarWidget,
  TimeSlotsWidget,
  DentistSelectionWidget,
  AppointmentConfirmationWidget,
  PersonalInfoFormWidget,
  QuickSettingsWidget,
  ImageUploadWidget,
  QuickActionsWidget,
  UrgencySliderWidget
} from "./InteractiveChatWidgets";

interface InteractiveDentalChatProps {
  user: User | null;
  triggerBooking?: boolean;
  onBookingTriggered?: () => void;
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
  const [widgetData, setWidgetData] = useState<any>({});
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Booking flow state
  const [bookingFlow, setBookingFlow] = useState({
    reason: '',
    selectedDentist: null,
    selectedDate: null as Date | null,
    selectedTime: '',
    urgency: 1,
    step: 'dentist' // dentist -> date -> time -> confirm
  });

  // Track how many triage questions have been asked before booking
  const [preBookingQuestions, setPreBookingQuestions] = useState(0);
  const [bookingBlocked, setBookingBlocked] = useState(false);

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
    } else {
      setShowConsentWidget(true);
    }
  }, [user]);

  useEffect(() => {
    if (triggerBooking && hasConsented) {
      handleQuickAction('book_appointment');
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
        session_id: sessionId,
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
        metadata: message.metadata,
      });
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
      const { data, error } = await supabase.functions.invoke('dental-ai-chat', {
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

      if (error) throw error;

      const responseText = data.response || data.fallback_response || "I'm sorry, I couldn't process your request.";
      const result = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        message: responseText,
        is_bot: true,
        message_type: 'text',
        created_at: new Date().toISOString(),
      };
      return {
        message: result,
        fallback: Boolean(data.fallback_response && !data.response),
        suggestions: data.suggestions || [],
        recommendedDentists: data.recommended_dentist || []
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      return {
        message: {
          id: crypto.randomUUID(),
          session_id: sessionId,
          message: "I'm sorry, I couldn't process your request.",
          is_bot: true,
          message_type: 'text',
          created_at: new Date().toISOString(),
        },
        fallback: true,
        suggestions: [],
        recommendedDentists: []
      };
    }
  };

  const handleSuggestions = (suggestions?: string[], recommendedDentists?: string[]) => {
    if (!suggestions || suggestions.length === 0) return;

    if (suggestions.includes('appointments-list')) {
      showAppointments();
      return;
    }


    if (suggestions.includes('recommend-dentist')) {
      loadDentistsForBooking(false, recommendedDentists);
      return;
    }

    if (
      suggestions.includes('booking') ||
      suggestions.includes('skip-patient-selection')
    ) {
      if (preBookingQuestions < 2) {
        addBotMessage(
          "I just need to ask a couple more quick questions so your dentist can focus on what's important and not the admin details."
        );
        setBookingBlocked(true);
        return;
      }
      startBookingFlow();
      setBookingBlocked(false);
      return;
    }

    // Count questions before booking (cap at 5)
    if (preBookingQuestions < 5) {
      setPreBookingQuestions(prev => prev + 1);
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

  const handleQuickAction = (action: string) => {
    setActiveWidget(null);
    
    switch (action) {
      case 'appointments':
        showAppointments();
        break;
      case 'book_appointment':
      case 'earliest':
        if (preBookingQuestions < 2) {
          addBotMessage(
            "I just need to ask a couple more quick questions so your dentist can focus on what's important and not the admin details."
          );
          setBookingBlocked(true);
        } else {
          startBookingFlow();
          setBookingBlocked(false);
        }
        break;
      case 'emergency':
        startEmergencyBooking();
        break;
      case 'help':
        showHelp();
        break;
    }
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
    setTimeout(() => setActiveWidget('quick-actions'), 1000);
  }
};

  const startBookingFlow = async () => {
    if (!user) {
      addBotMessage("Please log in to book an appointment. You can find the login button at the top right of the page.");
      return;
    }

    addBotMessage("I'll help you book an appointment! Please choose a dentist to continue.");

    await loadDentistsForBooking(false);
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

Just type what you need or use the quick action buttons! 😊
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
        setWidgetData({ dentists: data || [], recommendedDentists });
        setActiveWidget('dentist-selection');
        addBotMessage("Please choose your preferred dentist:");
      }
      
    } catch (error) {
      console.error("Error fetching dentists:", error);
      addBotMessage("I couldn't load the dentist list. Please try again.");
      setTimeout(() => setActiveWidget('quick-actions'), 1000);
    }
  };

  const handleAppointmentReason = (reason: string) => {
    const reasonLabels = {
      routine: 'Routine check-up',
      braces: 'Braces tightening', 
      emergency: 'Pain/Emergency',
      cleaning: 'Cleaning'
    };

    setBookingFlow({ ...bookingFlow, reason, step: 'dentist' });
    setActiveWidget(null);
    
    addBotMessage(`Great! You selected: **${reasonLabels[reason as keyof typeof reasonLabels]}** 🦷`);
    
    setTimeout(() => {
      loadDentistsForBooking();
    }, 1000);
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
    
    addBotMessage(`Date selected: **${format(date, "EEEE, MMMM d, yyyy")}** 📅`);
    addBotMessage("Loading available times... ⏳");
    
    try {
      // Generate slots for the date
      await supabase.rpc('generate_daily_slots', {
        p_dentist_id: bookingFlow.selectedDentist.id,
        p_date: date.toISOString().split('T')[0]
      });

      const { data, error } = await supabase
        .from('appointment_slots')
        .select('slot_time, is_available, emergency_only')
        .eq('dentist_id', bookingFlow.selectedDentist.id)
        .eq('slot_date', date.toISOString().split('T')[0])
        .order('slot_time');

      if (error) throw error;

      const slots = (data || []).map(slot => ({
        time: slot.slot_time.substring(0, 5),
        available: slot.is_available && !slot.emergency_only
      }));

      setWidgetData({ slots });
      
      const availableCount = slots.filter(s => s.available).length;
      if (availableCount === 0) {
        addBotMessage(`No available slots for ${format(date, "EEEE, MMMM d")}. Please select a different date.`);
        setTimeout(() => setActiveWidget('calendar'), 1000);
      } else {
        setActiveWidget('time-slots');
        addBotMessage("Please choose your preferred time:");
      }
      
  } catch (error) {
    console.error("Error fetching slots:", error);
    addBotMessage("I couldn't load the available times. Please try a different date.");
    setTimeout(() => setActiveWidget('calendar'), 1000);
    setTimeout(() => setActiveWidget('quick-actions'), 1500);
  }
};

  const handleTimeSelection = (time: string) => {
    setBookingFlow({ ...bookingFlow, selectedTime: time, step: 'confirm' });
    setActiveWidget(null);
    
    addBotMessage(`Time selected: **${time}** 🕐`);
    
    setTimeout(() => {
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
          urgency: bookingFlow.urgency === 3 ? "high" : "medium"
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
      setPreBookingQuestions(0);
      setBookingBlocked(false);


  } catch (error) {
    console.error("Error booking appointment:", error);
    addBotMessage("I'm sorry, I couldn't complete your booking. Please try again or contact the clinic directly.");
    setTimeout(() => setActiveWidget('quick-actions'), 1000);
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
    setActiveWidget(null);

    await saveMessage(userMessage);

    if (bookingBlocked && currentInput.includes('why')) {
      addBotMessage(
        "Because gathering a bit more info first lets the dentist focus on what's important and not administrative details."
      );
      setIsLoading(false);
      return;
    }

    if (currentInput.includes('language')) {
      if (currentInput.includes('english')) {
        handleLanguageChange('en');
      } else if (currentInput.includes('french') || currentInput.includes('français')) {
        handleLanguageChange('fr');
      } else if (currentInput.includes('dutch') || currentInput.includes('nederlands')) {
        handleLanguageChange('nl');
      } else {
        setActiveWidget('quick-settings');
        addBotMessage('I can help you change the language. Please select from the options below:');
      }
      setIsLoading(false);
      return;
    }

    if (currentInput.includes('dark') || currentInput.includes('light') || currentInput.includes('theme')) {
      if (currentInput.includes('dark')) {
        setTheme('dark');
        addBotMessage('Theme changed to dark mode! 🌙');
      } else if (currentInput.includes('light')) {
        setTheme('light');
        addBotMessage('Theme changed to light mode! ☀️');
      } else {
        setActiveWidget('quick-settings');
        addBotMessage('I can help you change the theme. Please select from the options below:');
      }
      setIsLoading(false);
      return;
    }

    if (currentInput.includes('help')) {
      showHelp();
      setIsLoading(false);
      return;
    }

    if (currentInput.includes('emergency') || currentInput.includes('urgent') || currentInput.includes('pain')) {
      startEmergencyBooking();
      setIsLoading(false);
      return;
    }

    const history = [...messages, userMessage].slice(-10);
    const { message: botResponse, fallback, suggestions, recommendedDentists } = await generateBotResponse(userMessage.message, history);
    setMessages(prev => [...prev, botResponse]);
    await saveMessage(botResponse);

    handleSuggestions(suggestions, recommendedDentists);

    if (fallback) {
      setTimeout(() => setActiveWidget('quick-actions'), 1000);
    }

    setIsLoading(false);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderWidget = () => {
    if (!activeWidget) return null;

    switch (activeWidget) {
      case 'appointment-reason':
        return <AppointmentReasonWidget onSelect={handleAppointmentReason} />;
      
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
      
      case 'quick-actions':
        return <QuickActionsWidget onAction={handleQuickAction} />;
      
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

      {hasConsented && (
        <div className="border-t p-4">
          <div className="flex space-x-2 max-w-4xl mx-auto">
            <Input
              placeholder={t.typeMessage || "Type your message..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputMessage.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};