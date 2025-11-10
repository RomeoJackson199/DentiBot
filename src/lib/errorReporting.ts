import { supabase } from '@/integrations/supabase/client';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ReportErrorParams {
  error_type: string;
  error_message: string;
  stack_trace?: string;
  severity?: ErrorSeverity;
  metadata?: Record<string, unknown>;
  url?: string;
}

export async function reportError(params: ReportErrorParams) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const { data: businessData } = await supabase
      .from('session_business')
      .select('business_id')
      .eq('user_id', userData?.user?.id || '')
      .maybeSingle();

    await supabase.from('system_errors').insert({
      error_type: params.error_type,
      error_message: params.error_message,
      stack_trace: params.stack_trace || null,
      severity: params.severity || 'medium',
      user_id: userData?.user?.id || null,
      business_id: businessData?.business_id || null,
      url: params.url || window.location.href,
      user_agent: navigator.userAgent,
      metadata: params.metadata || null,
    });
  } catch (err) {
    // Silently fail - don't want error reporting to break the app
    console.error('Failed to report error:', err);
  }
}

// Initialize global error handlers
export function initializeErrorReporting() {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    reportError({
      error_type: 'UnhandledPromiseRejection',
      error_message: event.reason?.message || String(event.reason),
      stack_trace: event.reason?.stack,
      severity: 'high',
      metadata: {
        reason: event.reason,
      },
    });
  });

  // Catch global errors
  window.addEventListener('error', (event) => {
    reportError({
      error_type: event.error?.name || 'GlobalError',
      error_message: event.message,
      stack_trace: event.error?.stack,
      severity: 'high',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });
}
