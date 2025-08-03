import { toast } from "@/hooks/use-toast";

export interface ErrorInfo {
  message: string;
  code?: string;
  details?: string;
  retryable?: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class AppError extends Error {
  public code?: string;
  public details?: string;
  public retryable: boolean;
  public severity: 'low' | 'medium' | 'high' | 'critical';

  constructor(message: string, options: {
    code?: string;
    details?: string;
    retryable?: boolean;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  } = {}) {
    super(message);
    this.name = 'AppError';
    this.code = options.code;
    this.details = options.details;
    this.retryable = options.retryable ?? false;
    this.severity = options.severity ?? 'medium';
  }
}

export const handleError = (error: unknown, context: string = 'Unknown'): ErrorInfo => {
  console.error(`Error in ${context}:`, error);

  // Handle different types of errors
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      details: error.details,
      retryable: error.retryable,
      severity: error.severity,
    };
  }

  // Handle network errors
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return {
      message: 'Network connection error. Please check your internet connection.',
      code: 'NETWORK_ERROR',
      details: error.message,
      retryable: true,
      severity: 'high',
    };
  }

  // Handle timeout errors
  if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
    return {
      message: 'Request timed out. Please try again.',
      code: 'TIMEOUT_ERROR',
      details: error.message,
      retryable: true,
      severity: 'medium',
    };
  }

  // Handle database errors
  if (error.message?.includes('database') || error.message?.includes('supabase')) {
    return {
      message: 'Database connection error. Please try again.',
      code: 'DATABASE_ERROR',
      details: error.message,
      retryable: true,
      severity: 'high',
    };
  }

  // Handle authentication errors
  if (error.message?.includes('auth') || error.message?.includes('unauthorized')) {
    return {
      message: 'Authentication error. Please log in again.',
      code: 'AUTH_ERROR',
      details: error.message,
      retryable: false,
      severity: 'critical',
    };
  }

  // Handle validation errors
  if (error.message?.includes('validation') || error.message?.includes('invalid')) {
    return {
      message: 'Invalid data provided. Please check your input.',
      code: 'VALIDATION_ERROR',
      details: error.message,
      retryable: false,
      severity: 'low',
    };
  }

  // Default error
  return {
    message: error instanceof Error ? error.message : "Unknown error",
    code: 'UNKNOWN_ERROR',
    details: error.message,
    retryable: false,
    severity: 'medium',
  };
};

export const showErrorToast = (errorInfo: ErrorInfo, context: string = '') => {
  const title = context ? `Error in ${context}` : 'Error';
  
  toast({
    title,
    description: errorInfo.message,
    variant: errorInfo.severity === 'critical' ? 'destructive' : 'default',
  });
};

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  context: string = 'Operation'
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorInfo = handleError(error, context);
      
      if (!errorInfo.retryable || attempt === maxRetries) {
        throw new AppError(errorInfo.message, {
          code: errorInfo.code,
          details: errorInfo.details,
          retryable: errorInfo.retryable,
          severity: errorInfo.severity,
        });
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
    }
  }

  throw lastError;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
};

export const validateRequired = (value: unknown, fieldName: string): string | null => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateLength = (value: string, min: number, max: number, fieldName: string): string | null => {
  if (value.length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  if (value.length > max) {
    return `${fieldName} must be no more than ${max} characters`;
  }
  return null;
};

export const validateDate = (date: string, fieldName: string): string | null => {
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return `${fieldName} must be a valid date`;
  }
  return null;
};

export const validateFutureDate = (date: string, fieldName: string): string | null => {
  const dateObj = new Date(date);
  const now = new Date();
  if (dateObj <= now) {
    return `${fieldName} must be in the future`;
  }
  return null;
};

export const validatePastDate = (date: string, fieldName: string): string | null => {
  const dateObj = new Date(date);
  const now = new Date();
  if (dateObj >= now) {
    return `${fieldName} must be in the past`;
  }
  return null;
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const formatErrorForUser = (error: unknown): string => {
  const errorInfo = handleError(error);
  return errorInfo.message;
};

export const isRetryableError = (error: unknown): boolean => {
  const errorInfo = handleError(error);
  return errorInfo.retryable ?? false;
};

export const getErrorSeverity = (error: unknown): 'low' | 'medium' | 'high' | 'critical' => {
  const errorInfo = handleError(error);
  return errorInfo.severity;
};