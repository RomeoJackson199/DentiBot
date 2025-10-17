import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getTerminology, IndustryTerminology, IndustryType } from '@/lib/industryTerminology';

export const useIndustryTerminology = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['industry_terminology'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return getTerminology('other');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile) return getTerminology('other');

      const { data: membership } = await supabase
        .from('organization_members')
        .select('*, organizations(*)')
        .eq('profile_id', profile.id)
        .single();

      const industry = membership?.organizations?.industry_type as IndustryType;
      return getTerminology(industry);
    },
    staleTime: Infinity, // Cache indefinitely unless manually invalidated
  });

  return {
    terminology: data || getTerminology('other'),
    isLoading,
  };
};
