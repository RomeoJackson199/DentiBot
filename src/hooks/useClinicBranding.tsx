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
    let channel: any;

    const loadBranding = async () => {
      try {
        // 1) Try to find a business owned by this provider (dentistId is a profiles.id)
        let business: any = null;
        if (dentistId) {
          const { data: owned, error: ownedErr } = await supabase
            .from('businesses')
            .select('id, logo_url, name, primary_color, secondary_color')
            .eq('owner_profile_id', dentistId)
            .limit(1)
            .maybeSingle();
          if (ownedErr) console.warn('Branding: owned business lookup warning', ownedErr.message);
          if (owned) business = owned;

          // 2) If not owner, see if provider is a member of any business
          if (!business) {
            const { data: memberships, error: memErr } = await supabase
              .from('provider_business_map')
              .select('business_id')
              .eq('provider_id', dentistId);
            if (memErr) console.warn('Branding: membership lookup warning', memErr.message);
            const ids = (memberships || []).map((m: any) => m.business_id);
            if (ids.length) {
              const { data: memberBiz } = await supabase
                .from('businesses')
                .select('id, logo_url, name, primary_color, secondary_color')
                .in('id', ids)
                .limit(1);
              if (memberBiz && memberBiz.length) business = memberBiz[0];
            }
          }
        }

        // 3) Fallback: pick any business (publicly selectable due to RLS policy)
        if (!business) {
          const { data: anyBiz } = await supabase
            .from('businesses')
            .select('id, logo_url, name, primary_color, secondary_color')
            .limit(1);
          if (anyBiz && anyBiz.length) business = anyBiz[0];
        }

        if (business) {
          setBranding({
            logoUrl: business.logo_url,
            clinicName: business.name,
            primaryColor: business.primary_color || '#0F3D91',
            secondaryColor: business.secondary_color || '#66D2D6',
          });

          // Real-time updates for this business only
          channel = supabase
            .channel('businesses_changes')
            .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'businesses', filter: `id=eq.${business.id}` },
              (payload) => {
                const newData = payload.new as any;
                setBranding({
                  logoUrl: newData.logo_url,
                  clinicName: newData.name,
                  primaryColor: newData.primary_color || '#0F3D91',
                  secondaryColor: newData.secondary_color || '#66D2D6',
                });
              }
            )
            .subscribe();
        }
      } catch (error) {
        console.error('Error loading branding:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBranding();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [dentistId]);

  return { branding, loading };
}
