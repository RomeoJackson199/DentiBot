import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ClinicInfo {
  clinicId: string;
  dentistId: string;
  name: string;
  tagline?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  businessHours: any;
  specialtyType: string;
  doctorName: string;
  specialization?: string;
  address?: string;
  businessSlug: string;
}

export const useClinicContext = () => {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClinicInfo = async () => {
      if (!businessSlug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: funcError } = await supabase.functions.invoke(
          'get-public-clinic-info',
          {
            body: { businessSlug }
          }
        );

        if (funcError) throw funcError;
        if (data.error) throw new Error(data.error);

        setClinicInfo(data);
      } catch (err: any) {
        console.error('Error fetching clinic info:', err);
        setError(err.message || 'Failed to load clinic information');
      } finally {
        setLoading(false);
      }
    };

    fetchClinicInfo();
  }, [businessSlug]);

  return { clinicInfo, loading, error, businessSlug };
};