import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CurrentDentistState = {
  userId: string | null;
  profileId: string | null;
  dentistId: string | null;
  loading: boolean;
  error: string | null;
};

export function useCurrentDentist(): CurrentDentistState {
  const [state, setState] = useState<CurrentDentistState>({
    userId: null,
    profileId: null,
    dentistId: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id ?? null;
      if (!userId) {
        setState({ userId: null, profileId: null, dentistId: null, loading: false, error: null });
        return;
      }

      const { data: profileRow, error: profileErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      if (profileErr) throw profileErr;

      const profileId = profileRow?.id ?? null;
      if (!profileId) {
        setState({ userId, profileId: null, dentistId: null, loading: false, error: null });
        return;
      }

      const { data: dentistRow, error: dentistErr } = await supabase
        .from('dentists')
        .select('id')
        .eq('profile_id', profileId)
        .eq('is_active', true)
        .maybeSingle();
      if (dentistErr) throw dentistErr;

      setState({
        userId,
        profileId,
        dentistId: dentistRow?.id ?? null,
        loading: false,
        error: null,
      });
    } catch (e: any) {
      setState(prev => ({ ...prev, loading: false, error: e?.message || 'Failed to load dentist context' }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return state;
}

