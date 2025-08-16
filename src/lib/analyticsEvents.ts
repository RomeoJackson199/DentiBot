import { supabase } from "@/integrations/supabase/client";

export async function emitAnalyticsEvent(eventType: string, dentistId: string, payload: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event_name: eventType,
        event_data: { dentistId, ...payload }
      });
    }
  } catch (e) {
    // Fallback to console for debugging
    console.debug('[AnalyticsEvent]', eventType, { dentistId, payload });
  }
}