import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { DentistPortal } from "@/pages/DentistPortal";
import { ModernLoadingSpinner } from "@/components/enhanced/ModernLoadingSpinner";

export function DentistRoutesWrapper() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <ModernLoadingSpinner variant="overlay" message="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <DentistPortal user={user} />;
}