import { toast } from 'sonner';
import { logger } from './logger';
import { reportError, ErrorSeverity } from './errorReporting';
import { UI_TIMINGS } from './constants';

export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  businessId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Unified error handling function that logs, reports, and optionally shows errors to users
 */
export function handleError(
  error: Error | unknown,
  level: ErrorLevel = ErrorLevel.ERROR,
  context?: ErrorContext,
  showToUser = true
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Create context string for logging
  const contextStr = context
    ? `[${context.component || 'Unknown'}${context.action ? ` - ${context.action}` : ''}]`
    : '';

  // Log based on level
  switch (level) {
    case ErrorLevel.INFO:
      logger.info(`${contextStr} ${errorMessage}`, error);
      break;
    case ErrorLevel.WARNING:
      logger.warn(`${contextStr} ${errorMessage}`, error);
      break;
    case ErrorLevel.ERROR:
      logger.error(`${contextStr} ${errorMessage}`, error);
      break;
    case ErrorLevel.CRITICAL:
      logger.error(`${contextStr} CRITICAL: ${errorMessage}`, error);
      break;
  }

  // Report to backend for ERROR and CRITICAL levels
  if (level === ErrorLevel.ERROR || level === ErrorLevel.CRITICAL) {
    const severity: ErrorSeverity = level === ErrorLevel.CRITICAL ? 'critical' : 'high';

    reportError({
      error_type: context?.component || 'UnknownError',
      error_message: errorMessage,
      stack_trace: errorStack,
      severity,
      metadata: {
        ...context?.metadata,
        action: context?.action,
        level,
      },
    }).catch((reportingError) => {
      // Don't let error reporting failures crash the app
      console.error('Failed to report error:', reportingError);
    });
  }

  // Show user-friendly message to user
  if (showToUser) {
    const userMessage = getUserFriendlyMessage(error, context);

    switch (level) {
      case ErrorLevel.INFO:
        toast.info(userMessage);
        break;
      case ErrorLevel.WARNING:
        toast.warning(userMessage);
        break;
      case ErrorLevel.ERROR:
        toast.error(userMessage);
        break;
      case ErrorLevel.CRITICAL:
        toast.error(userMessage, {
          duration: UI_TIMINGS.TOAST_CRITICAL_DURATION,
        });
        break;
    }
  }
}

/**
 * Convert technical errors to user-friendly messages
 */
export function getUserFriendlyMessage(
  error: Error | unknown,
  context?: ErrorContext
): string {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Map common error patterns to friendly messages
  if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
    return 'Authentication error. Please try logging in again.';
  }

  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
    return "You don't have permission to perform this action.";
  }

  if (errorMessage.includes('not found')) {
    return context?.action
      ? `Could not find the requested ${context.action.toLowerCase()}.`
      : 'The requested resource was not found.';
  }

  if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
    return 'This item already exists. Please use a different name.';
  }

  if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return 'Invalid input. Please check your data and try again.';
  }

  // Return the original message if no pattern matches, but make it more friendly
  if (errorMessage.length > 100) {
    return 'An error occurred. Please try again or contact support if the problem persists.';
  }

  return errorMessage;
}

/**
 * Wrapper for async functions to handle errors consistently
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: ErrorContext,
  level: ErrorLevel = ErrorLevel.ERROR,
  showToUser = true
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, level, context, showToUser);
    return null;
  }
}

/**
 * Higher-order function to wrap event handlers with error handling
 */
export function withErrorBoundary<TArgs extends unknown[]>(
  fn: (...args: TArgs) => Promise<void> | void,
  context: ErrorContext
): (...args: TArgs) => Promise<void> {
  return async (...args: TArgs) => {
    try {
      await fn(...args);
    } catch (error) {
      handleError(error, ErrorLevel.ERROR, context, true);
    }
  };
}
