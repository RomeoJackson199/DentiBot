import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CurrentProviderState = {
  userId: string | null;
  profileId: string | null;
  providerId: string | null;
  loading: boolean;
  error: string | null;
};

export function useCurrentProvider(): CurrentProviderState {
  const [state, setState] = useState<CurrentProviderState>({
    userId: null,
    profileId: null,
    providerId: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id ?? null;
      if (!userId) {
        setState({ userId: null, profileId: null, providerId: null, loading: false, error: null });
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
        setState({ userId, profileId: null, providerId: null, loading: false, error: null });
        return;
      }

      // Using type assertion until Supabase types regenerate
      const { data: providerRow, error: providerErr } = await supabase
        .from('providers' as any)
        .select('id')
        .eq('profile_id', profileId)
        .maybeSingle();
      if (providerErr) throw providerErr;

      setState({
        userId,
        profileId,
        providerId: (providerRow as any)?.id ?? null,
        loading: false,
        error: null,
      });
    } catch (e: any) {
      setState(prev => ({ ...prev, loading: false, error: e?.message || 'Failed to load provider context' }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return state;
}
