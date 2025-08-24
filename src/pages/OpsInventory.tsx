import React, { useEffect, useState } from "react";
import { InventoryManager } from "@/components/inventory/InventoryManager";
import { supabase } from "@/integrations/supabase/client";

export default function OpsInventory() {
  const [dentistId, setDentistId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);
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

  if (!dentistId || !userId) return null;
  return <InventoryManager dentistId={dentistId} userId={userId} />;
}

