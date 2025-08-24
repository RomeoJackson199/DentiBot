import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { emitAnalyticsEvent } from "@/lib/analyticsEvents";

export type PatientBadgeCounts = {
  upcoming7d: number;
  unpaid: number;
};

export function usePatientBadgeCounts() {
  const [counts, setCounts] = useState<PatientBadgeCounts>({ upcoming7d: 0, unpaid: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (!userId) {
          if (isMounted) {
            setCounts({ upcoming7d: 0, unpaid: 0 });
            setLoading(false);
          }
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        const patientId = profile?.id;
        if (!patientId) {
          if (isMounted) {
            setCounts({ upcoming7d: 0, unpaid: 0 });
            setLoading(false);
          }
          return;
        }

        // Upcoming appointments in next 7 days (excluding cancelled/completed)
        const now = new Date();
        const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const { data: appts, error: apptErr } = await supabase
          .from('appointments')
          .select('id, status, appointment_date')
          .eq('patient_id', patientId)
          .gte('appointment_date', now.toISOString())
          .lte('appointment_date', in7.toISOString());
        if (apptErr) throw apptErr;
        const upcoming7d = (appts || []).filter(a => !['cancelled','completed'].includes(String(a.status || '').toLowerCase())).length;

        // Unpaid payments: payment_requests with pending/overdue
        const { data: payReqs, error: payErr } = await supabase
          .from('payment_requests')
          .select('id, status')
          .eq('patient_id', patientId)
          .in('status', ['pending','overdue']);
        if (payErr) throw payErr;
        const unpaid = (payReqs || []).length;

        if (isMounted) {
          setCounts({ upcoming7d, unpaid });
          setLoading(false);
        }

        try {
          if (upcoming7d > 0) {
            await emitAnalyticsEvent('pnav_badge_view', '', { item: 'appointments', count: upcoming7d });
          }
          if (unpaid > 0) {
            await emitAnalyticsEvent('pnav_badge_view', '', { item: 'billing', count: unpaid });
          }
        } catch {}
      } catch (e: any) {
        if (isMounted) {
          setError(e?.message || 'Failed to load badges');
          setLoading(false);
        }
      }
    })();
    return () => { isMounted = false; };
  }, []);

  return { counts, loading, error };
}

