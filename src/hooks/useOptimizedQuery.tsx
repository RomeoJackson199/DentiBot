import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface QueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  cacheTime?: number;
}

interface QueryResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
  isStale: boolean;
}

// Simple cache implementation with size limit
const MAX_CACHE_SIZE = 100; // Prevent unbounded memory growth

const queryCache = new Map<string, {
  data: any;
  timestamp: number;
  staleTime: number;
  cacheTime: number;
}>();

// Cleanup expired cache entries - called on-demand instead of globally
function cleanupExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of queryCache.entries()) {
    if (now - entry.timestamp > entry.cacheTime) {
      queryCache.delete(key);
    }
  }

  // If cache is still too large, remove oldest entries
  if (queryCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(queryCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = entries.slice(0, queryCache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => queryCache.delete(key));
  }
}

export function useOptimizedQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options: QueryOptions = {}
): QueryResult<T> {
  const {
    enabled = true,
    refetchInterval,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000 // 10 minutes
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStale, setIsStale] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const executeQuery = useCallback(async (useCache = true) => {
    if (!enabled) return;

    // Cleanup expired entries on each query (more efficient than global interval)
    cleanupExpiredCache();

    // Check cache first
    if (useCache) {
      const cached = queryCache.get(queryKey);
      if (cached && Date.now() - cached.timestamp < cached.staleTime) {
        setData(cached.data);
        setIsStale(false);
        return;
      }
      if (cached && Date.now() - cached.timestamp < cached.cacheTime) {
        setData(cached.data);
        setIsStale(true);
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setData(result);
      setError(null);
      setIsStale(false);

      // Update cache
      queryCache.set(queryKey, {
        data: result,
        timestamp: Date.now(),
        staleTime,
        cacheTime
      });
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      const error = err instanceof Error ? err : new Error('Query failed');
      setError(error);
      logger.error(`Query failed for key: ${queryKey}`, error);
    } finally {
      setIsLoading(false);
    }
  }, [queryKey, queryFn, enabled, staleTime, cacheTime]);

  const refetch = useCallback(async () => {
    await executeQuery(false);
  }, [executeQuery]);

  useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(() => {
        executeQuery();
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, executeQuery]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    error,
    isLoading,
    isError: !!error,
    refetch,
    isStale
  };
}

// Specialized hooks for common queries
export function useOptimizedUserProfile(userId: string) {
  return useOptimizedQuery(
    `user-profile-${userId}`,
    async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    { staleTime: 10 * 60 * 1000 } // User profiles change less frequently
  );
}

export function useOptimizedAppointments(patientId: string) {
  return useOptimizedQuery(
    `appointments-${patientId}`,
    async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          dentist:dentist_id(
            specialization,
            profile:profile_id(first_name, last_name)
          )
        `)
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    { staleTime: 2 * 60 * 1000 } // Appointments change more frequently
  );
}