import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseOptimizedQueryProps<T> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  staleTime?: number;
  gcTime?: number;
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
}

export function useOptimizedQuery<T>({
  queryKey,
  queryFn,
  staleTime = 5 * 60 * 1000, // 5 minutes
  gcTime = 10 * 60 * 1000, // 10 minutes (was cacheTime)
  enabled = true,
  refetchOnWindowFocus = false,
}: UseOptimizedQueryProps<T>) {
  const memoizedQueryFn = useCallback(queryFn, []);
  
  const memoizedOptions = useMemo((): UseQueryOptions<T> => ({
    queryKey,
    queryFn: memoizedQueryFn,
    staleTime,
    gcTime,
    enabled,
    refetchOnWindowFocus,
    retry: (failureCount, error) => {
      // Don't retry if it's an auth error
      if (error && typeof error === 'object' && 'code' in error) {
        const supabaseError = error as { code?: string };
        if (supabaseError.code === 'PGRST301' || supabaseError.code === 'PGRST116') {
          return false;
        }
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  }), [queryKey, memoizedQueryFn, staleTime, gcTime, enabled, refetchOnWindowFocus]);

  return useQuery(memoizedOptions);
}

// Pre-configured hooks for common queries
export function useUserProfile(userId: string) {
  return useOptimizedQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useAppointments(patientId: string) {
  return useOptimizedQuery({
    queryKey: ['appointments', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000, // 2 minutes for appointments
  });
}

export function useDentists() {
  return useOptimizedQuery({
    queryKey: ['dentists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dentists')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            email
          )
        `)
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes for dentist list
  });
}