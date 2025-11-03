import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessContext } from './useBusinessContext';

export function useRestaurantRole() {
  const { businessId } = useBusinessContext();

  const { data: role, isLoading } = useQuery({
    queryKey: ['restaurant-role', businessId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile || !businessId) return null;

      // Check if user is business owner
      const { data: business } = await supabase
        .from('businesses')
        .select('owner_profile_id')
        .eq('id', businessId)
        .single();

      if (business?.owner_profile_id === profile.id) {
        return 'owner';
      }

      // Check restaurant staff roles
      const { data: staffRole } = await supabase
        .from('restaurant_staff_roles')
        .select('role, is_active')
        .eq('business_id', businessId)
        .eq('profile_id', profile.id)
        .eq('is_active', true)
        .maybeSingle();

      return staffRole?.role || null;
    },
    enabled: !!businessId,
  });

  return {
    role,
    isOwner: role === 'owner',
    isWaiter: role === 'waiter',
    isCook: role === 'cook',
    isHost: role === 'host',
    isManager: role === 'manager',
    loading: isLoading,
  };
}
