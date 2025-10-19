import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClinicBranding {
  logoUrl: string | null;
  clinicName: string | null;
  primaryColor: string;
  secondaryColor: string;
}

export function useClinicBranding(dentistId?: string | null) {
  const [branding, setBranding] = useState<ClinicBranding>({
    logoUrl: null,
    clinicName: null,
    primaryColor: "#0F3D91",
    secondaryColor: "#66D2D6",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        let query = supabase
          .from('businesses')
          .select('logo_url, name, primary_color, secondary_color, owner_profile_id');

        // If dentistId is provided, use it; otherwise get the first business
        if (dentistId) {
          query = query.eq('owner_profile_id', dentistId);
        } else {
          query = query.limit(1);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;

        if (data) {
          setBranding({
            logoUrl: data.logo_url,
            clinicName: data.name,
            primaryColor: data.primary_color || "#0F3D91",
            secondaryColor: data.secondary_color || "#66D2D6",
          });
        }
      } catch (error) {
        console.error('Error loading branding:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBranding();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('businesses_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'businesses',
          ...(dentistId && { filter: `owner_profile_id=eq.${dentistId}` }),
        },
        (payload) => {
          if (payload.new) {
            const newData = payload.new as any;
            // Only update if it matches our dentistId or if we don't have a specific dentist
            if (!dentistId || newData.owner_profile_id === dentistId) {
              setBranding({
                logoUrl: newData.logo_url,
                clinicName: newData.name,
                primaryColor: newData.primary_color || "#0F3D91",
                secondaryColor: newData.secondary_color || "#66D2D6",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dentistId]);

  return { branding, loading };
}
