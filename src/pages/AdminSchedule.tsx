import React, { useEffect, useState } from "react";
import { EnhancedAvailabilitySettings } from "@/components/enhanced/EnhancedAvailabilitySettings";
import { supabase } from "@/integrations/supabase/client";

export default function AdminSchedule() {
  const [dentistId, setDentistId] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!profile?.id) return;
        const { data: dentist } = await (supabase as any)
          .from('dentists')
          .select('id')
          .eq('profile_id', profile.id)
          .maybeSingle();
        if (dentist?.id) setDentistId(dentist.id);
      } catch { /* noop */ }
    })();
  }, []);
  if (!dentistId) return null;
  return <EnhancedAvailabilitySettings dentistId={dentistId} />;
}

