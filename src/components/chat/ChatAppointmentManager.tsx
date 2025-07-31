import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, User as UserIcon, MapPin, Phone } from "lucide-react";
import { format } from "date-fns";

interface ChatAppointmentManagerProps {
  user: User;
  onResponse: (message: string, actionButtons?: any[]) => void;
}

export const ChatAppointmentManager = ({ user, onResponse }: ChatAppointmentManagerProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const showAppointments = async () => {
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        onResponse("I couldn't find your profile. Please complete your profile first.");
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
        onResponse("You don't have any appointments scheduled yet. Would you like to book one?", [
          {
            label: "Book Appointment",
            action: "book_appointment"
          }
        ]);
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

        // Add action buttons for the next appointment
        if (upcoming.length > 0) {
          const nextApt = upcoming[0];
          const actionButtons = [
            {
              label: "Reschedule",
              action: "reschedule_appointment",
              data: { appointmentId: nextApt.id }
            },
            {
              label: "Cancel",
              action: "cancel_appointment", 
              data: { appointmentId: nextApt.id }
            }
          ];
          
          onResponse(responseMessage, actionButtons);
          return;
        }
      }

      if (past.length > 0 && upcoming.length === 0) {
        responseMessage += `📋 **Your past appointments:**\n\n`;
        past.slice(-3).forEach((apt, index) => {
          const date = new Date(apt.appointment_date);
          const dentistName = apt.dentists?.profiles 
            ? `Dr. ${apt.dentists.profiles.first_name} ${apt.dentists.profiles.last_name}`
            : "Unknown dentist";
          
          responseMessage += `${index + 1}. **${format(date, "EEEE, MMMM d")}** at **${format(date, "h:mm a")}**\n`;
          responseMessage += `   👨‍⚕️ ${dentistName}\n`;
          responseMessage += `   📝 ${apt.reason}\n\n`;
        });

        onResponse(responseMessage + "\nYou don't have any upcoming appointments. Would you like to book one?", [
          {
            label: "Book New Appointment",
            action: "book_appointment"
          }
        ]);
        return;
      }

      onResponse(responseMessage);

    } catch (error) {
      console.error("Error fetching appointments:", error);
      onResponse("I'm sorry, I couldn't retrieve your appointments right now. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointmentId);

      if (error) throw error;

      toast({
        title: t.success,
        description: "Appointment cancelled successfully"
      });

      onResponse("✅ Your appointment has been cancelled successfully. If you need to book a new one, just let me know!");

    } catch (error) {
      console.error("Error cancelling appointment:", error);
      onResponse("I'm sorry, I couldn't cancel your appointment right now. Please try again or contact the clinic directly.");
    }
  };

  const rescheduleAppointment = async (appointmentId: string) => {
    onResponse("I'll help you reschedule your appointment. Let me show you the available times...", [
      {
        label: "Choose New Date & Time",
        action: "book_appointment",
        data: { rescheduleId: appointmentId }
      }
    ]);
  };

  return {
    showAppointments,
    cancelAppointment,
    rescheduleAppointment,
    loading
  };
};
