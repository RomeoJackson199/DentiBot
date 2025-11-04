import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessContext } from "./useBusinessContext";

export const useUsageLimits = () => {
  const { businessId } = useBusinessContext();

  const { data: customerLimit, refetch: refetchCustomerLimit } = useQuery({
    queryKey: ['usage-limit', 'customer', businessId],
    queryFn: async () => {
      if (!businessId) return null;
      
      const { data, error } = await supabase.rpc('check_business_usage_limit', {
        p_business_id: businessId,
        p_limit_type: 'customer',
      });

      if (error) throw error;
      return data as { allowed: boolean; reason?: string; current: number; limit: number };
    },
    enabled: !!businessId,
  });

  const { data: emailLimit, refetch: refetchEmailLimit } = useQuery({
    queryKey: ['usage-limit', 'email', businessId],
    queryFn: async () => {
      if (!businessId) return null;
      
      const { data, error } = await supabase.rpc('check_business_usage_limit', {
        p_business_id: businessId,
        p_limit_type: 'email',
      });

      if (error) throw error;
      return data as { allowed: boolean; reason?: string; current: number; limit: number | null };
    },
    enabled: !!businessId,
  });

  const checkCustomerLimit = () => {
    if (!customerLimit) return { allowed: true };
    return customerLimit;
  };

  const checkEmailLimit = () => {
    if (!emailLimit) return { allowed: true };
    return emailLimit;
  };

  return {
    customerLimit: checkCustomerLimit(),
    emailLimit: checkEmailLimit(),
    refetchCustomerLimit,
    refetchEmailLimit,
  };
};
