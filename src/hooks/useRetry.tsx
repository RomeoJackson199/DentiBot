import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface UseRetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: boolean;
}

export const useRetry = (options: UseRetryOptions = {}) => {
  const { maxRetries = 3, delay = 1000, backoff = true } = options;
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(async <T,>(
    fn: () => Promise<T>,
    onError?: (error: Error, attempt: number) => void
  ): Promise<T> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setRetryCount(attempt);
        setIsRetrying(attempt > 0);
        
        if (attempt > 0) {
          const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        const result = await fn();
        setRetryCount(0);
        setIsRetrying(false);
        return result;
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Attempt ${attempt + 1} failed:`, error);
        
        if (onError) {
          onError(lastError, attempt);
        }
        
        if (attempt === maxRetries) {
          setIsRetrying(false);
          throw lastError;
        }
      }
    }
    
    throw lastError;
  }, [maxRetries, delay, backoff]);

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    retry,
    retryCount,
    isRetrying,
    reset
  };
};