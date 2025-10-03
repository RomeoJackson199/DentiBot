import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { DentistRoutes } from "./DentistRoutes";

export function DentistRoutesWrapper() {
  const [user, setUser] = useState<User | null>(null);
  const [dentistId, setDentistId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Fetch dentist ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          const { data: dentist } = await supabase
            .from('dentists')
            .select('id')
            .eq('profile_id', profile.id)
            .single();
          
          if (dentist) {
            setDentistId(dentist.id);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setDentistId("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!user || !dentistId) {
    return <Navigate to="/login" replace />;
  }

  return <DentistRoutes user={user} dentistId={dentistId} />;
}