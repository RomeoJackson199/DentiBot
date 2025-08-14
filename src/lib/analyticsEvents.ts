import { supabase } from "@/integrations/supabase/client";

export async function emitAnalyticsEvent(eventType: string, dentistId: string, payload: any) {
  try {
    await supabase.from('analytics_events').insert({
      dentist_id: dentistId,
      event_type: eventType,
      payload,
      created_at: new Date().toISOString()
    });
  } catch (e) {
    // Table may not exist in all environments; fallback to console for now
    console.debug('[AnalyticsEvent]', eventType, { dentistId, payload });
  }
}