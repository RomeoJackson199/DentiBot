import { toast } from '@/hooks/use-toast';

export interface ErrorInfo {
  message: string;
  code?: string;
  details?: any;
  userFriendly?: string;
}

export class DashboardError extends Error {
  public code: string;
  public details: any;
  public userFriendly: string;

  constructor(message: string, code?: string, details?: any, userFriendly?: string) {
    super(message);
    this.name = 'DashboardError';
    this.code = code || 'UNKNOWN_ERROR';
    this.details = details;
    this.userFriendly = userFriendly || message;
  }
}

export const handleDatabaseError = (error: any, context: string): ErrorInfo => {
  console.error(`Database error in ${context}:`, error);

  // Handle specific Supabase errors
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116':
        return {
          message: 'No rows returned',
          code: 'NO_DATA',
          details: error,
          userFriendly: 'No data found. Please try again later.'
        };
      case '23505':
        return {
          message: 'Duplicate key violation',
          code: 'DUPLICATE_KEY',
          details: error,
          userFriendly: 'This record already exists.'
        };
      case '23503':
        return {
          message: 'Foreign key violation',
          code: 'FOREIGN_KEY',
          details: error,
          userFriendly: 'Invalid reference. Please contact support.'
        };
      case '42P01':
        return {
          message: 'Table does not exist',
          code: 'TABLE_NOT_FOUND',
          details: error,
          userFriendly: 'System configuration error. Please contact support.'
        };
      case '42501':
        return {
          message: 'Insufficient privileges',
          code: 'PERMISSION_DENIED',
          details: error,
          userFriendly: 'You don\'t have permission to perform this action.'
        };
      default:
        return {
          message: error.message || 'Unknown database error',
          code: error.code || 'UNKNOWN_DB_ERROR',
          details: error,
          userFriendly: 'A database error occurred. Please try again.'
        };
    }
  }

  // Handle network errors
  if (error?.message?.includes('fetch')) {
    return {
      message: 'Network error',
      code: 'NETWORK_ERROR',
      details: error,
      userFriendly: 'Network connection error. Please check your internet connection.'
    };
  }

  // Handle authentication errors
  if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
    return {
      message: 'Authentication error',
      code: 'AUTH_ERROR',
      details: error,
      userFriendly: 'Authentication failed. Please log in again.'
    };
  }

  // Default error handling
  return {
    message: error?.message || 'Unknown error occurred',
    code: 'UNKNOWN_ERROR',
    details: error,
    userFriendly: 'An unexpected error occurred. Please try again.'
  };
};

export const showErrorToast = (errorInfo: ErrorInfo, context?: string) => {
  toast({
    title: "Error",
    description: errorInfo.userFriendly,
    variant: "destructive",
  });

  // Log detailed error for debugging
  console.error(`Error in ${context || 'unknown context'}:`, {
    message: errorInfo.message,
    code: errorInfo.code,
    details: errorInfo.details
  });
};

export const showSuccessToast = (message: string, title?: string) => {
  toast({
    title: title || "Success",
    description: message,
    variant: "default",
  });
};

export const validateProfileData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.first_name?.trim()) {
    errors.push('First name is required');
  }

  if (!data.last_name?.trim()) {
    errors.push('Last name is required');
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  if (data.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(data.phone.replace(/\s/g, ''))) {
    errors.push('Invalid phone number format');
  }

  if (data.date_of_birth) {
    const birthDate = new Date(data.date_of_birth);
    const today = new Date();
    if (birthDate > today) {
      errors.push('Date of birth cannot be in the future');
    }
    if (today.getFullYear() - birthDate.getFullYear() > 120) {
      errors.push('Invalid date of birth');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateAppointmentData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.reason?.trim()) {
    errors.push('Appointment reason is required');
  }

  if (!data.appointment_date) {
    errors.push('Appointment date is required');
  } else {
    const appointmentDate = new Date(data.appointment_date);
    const now = new Date();
    if (appointmentDate < now) {
      errors.push('Appointment date cannot be in the past');
    }
  }

  if (!data.dentist_id) {
    errors.push('Dentist selection is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const formatErrorForUser = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.userFriendly) {
    return error.userFriendly;
  }

  if (error?.message) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

export const isNetworkError = (error: any): boolean => {
  return error?.message?.includes('fetch') || 
         error?.message?.includes('network') ||
         error?.code === 'NETWORK_ERROR';
};

export const isAuthError = (error: any): boolean => {
  return error?.message?.includes('JWT') || 
         error?.message?.includes('auth') ||
         error?.code === 'AUTH_ERROR';
};

export const shouldRetry = (error: any): boolean => {
  // Don't retry auth errors or validation errors
  if (isAuthError(error) || error?.code?.includes('VALIDATION')) {
    return false;
  }

  // Retry network errors and temporary database errors
  return isNetworkError(error) || 
         error?.code?.includes('TEMPORARY') ||
         error?.code?.includes('TIMEOUT');
};