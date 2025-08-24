import React from "react";
import { Settings } from "@/components/Settings";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export default function AdminBranding() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    })();
  }, []);
  if (!user) return null;
  return <Settings user={user} />;
}

