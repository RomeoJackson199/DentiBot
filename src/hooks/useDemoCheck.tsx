import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

export const useDemoCheck = () => {
  const { data: demoInfo, isLoading } = useQuery({
    queryKey: ['demo_check'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile) return null;

      const { data: membership } = await supabase
        .from('organization_members')
        .select('*, organizations(*)')
        .eq('profile_id', profile.id)
        .single();

      const org = membership?.organizations;
      if (!org?.is_demo) return { isDemo: false, daysLeft: null, isExpired: false };

      const daysLeft = org.demo_expires_at 
        ? differenceInDays(new Date(org.demo_expires_at), new Date())
        : 0;

      return {
        isDemo: true,
        daysLeft: Math.max(0, daysLeft),
        isExpired: daysLeft < 0,
        organization: org,
      };
    },
  });

  return {
    isDemo: demoInfo?.isDemo || false,
    daysLeft: demoInfo?.daysLeft || null,
    isExpired: demoInfo?.isExpired || false,
    organization: demoInfo?.organization,
    isLoading,
  };
};
