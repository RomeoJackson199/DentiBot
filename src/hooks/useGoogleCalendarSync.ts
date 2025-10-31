import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useGoogleCalendarSync() {
  const { toast } = useToast();

  const syncAppointmentToGoogleCalendar = async (
    appointmentId: string,
    action: 'create' | 'update' | 'delete'
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-create-event', {
        body: { appointmentId, action }
      });

      if (error) {
        console.error('Failed to sync to Google Calendar:', error);
        return { success: false };
      }

      if (data?.success) {
        console.log(`Successfully ${action}d appointment in Google Calendar`);
        return { success: true };
      }

      return { success: false };
    } catch (error) {
      console.error('Error syncing to Google Calendar:', error);
      return { success: false };
    }
  };

  return { syncAppointmentToGoogleCalendar };
}
