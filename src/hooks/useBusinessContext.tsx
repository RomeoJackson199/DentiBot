import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface BusinessInfo {
  businessId: string;
  providerId: string;
  name: string;
  tagline?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  businessHours: any;
  specialtyType: string;
  providerName: string;
  specialization?: string;
  address?: string;
  businessSlug: string;
}

export const useBusinessContext = () => {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      if (!businessSlug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch business info (using type assertion until types regenerate)
        const { data: business, error: businessError } = await supabase
          .from('businesses' as any)
          .select(`
            id,
            name,
            slug,
            tagline,
            logo_url,
            primary_color,
            secondary_color,
            business_hours,
            specialty_type,
            owner_profile_id
          `)
          .eq('slug', businessSlug)
          .maybeSingle();

        if (businessError) throw businessError;
        if (!business) throw new Error('Business not found');

        // Get provider info from owner profile (using type assertion until types regenerate)
        const { data: provider, error: providerError } = await supabase
          .from('providers' as any)
          .select(`
            id,
            specialization,
            profiles:profile_id (
              first_name,
              last_name
            )
          `)
          .eq('profile_id', (business as any).owner_profile_id)
          .maybeSingle();

        if (providerError) throw providerError;

        const profile = (provider as any)?.profiles as any;
        const providerName = profile ? `${profile.first_name} ${profile.last_name}` : '';

        setBusinessInfo({
          businessId: (business as any).id,
          providerId: (provider as any)?.id || '',
          name: (business as any).name,
          tagline: (business as any).tagline,
          logoUrl: (business as any).logo_url,
          primaryColor: (business as any).primary_color,
          secondaryColor: (business as any).secondary_color,
          businessHours: (business as any).business_hours,
          specialtyType: (business as any).specialty_type,
          providerName,
          specialization: (provider as any)?.specialization,
          businessSlug: (business as any).slug
        });
      } catch (err: any) {
        console.error('Error fetching business info:', err);
        setError(err.message || 'Failed to load business information');
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessInfo();
  }, [businessSlug]);

  return { businessInfo, loading, error, businessSlug };
};
