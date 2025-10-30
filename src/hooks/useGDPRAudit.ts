import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

type AuditAction = 'create' | 'view_phi' | 'update' | 'delete' | 'export' | 'consent_change' | 'login' | 'logout';

interface AuditLogData {
  action: AuditAction;
  entity_type?: string;
  entity_id?: string;
  before_data?: any;
  after_data?: any;
  purpose_code?: string;
  patient_id?: string;
}

export function useGDPRAudit() {
  const logAuditEvent = useCallback(async (data: AuditLogData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's role and profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Create audit log entry
      await supabase
        .from('gdpr_audit_log')
        .insert({
          actor_id: user.id,
          actor_role: profile.role,
          action: data.action,
          entity_type: data.entity_type,
          entity_id: data.entity_id,
          before_data: data.before_data ? JSON.stringify(data.before_data) : null,
          after_data: data.after_data ? JSON.stringify(data.after_data) : null,
          purpose_code: data.purpose_code,
          patient_id: data.patient_id,
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent,
          session_id: getSessionId()
        });

    } catch (error) {
      logger.error('Failed to log audit event:', error);
      // Don't throw - audit logging shouldn't break the main flow
    }
  }, []);

  // Helper to log PHI access specifically
  const logPHIAccess = useCallback(async (patientId: string, entityType: string, entityId: string, purpose: string) => {
    await logAuditEvent({
      action: 'view_phi',
      entity_type: entityType,
      entity_id: entityId,
      patient_id: patientId,
      purpose_code: purpose
    });
  }, [logAuditEvent]);

  // Helper to log data changes
  const logDataChange = useCallback(async (action: AuditAction, entityType: string, entityId: string, beforeData?: any, afterData?: any) => {
    await logAuditEvent({
      action,
      entity_type: entityType,
      entity_id: entityId,
      before_data: beforeData,
      after_data: afterData
    });
  }, [logAuditEvent]);

  // Helper to log consent changes
  const logConsentChange = useCallback(async (patientId: string, consentScope: string, granted: boolean) => {
    await logAuditEvent({
      action: 'consent_change',
      entity_type: 'consent',
      patient_id: patientId,
      after_data: { scope: consentScope, granted }
    });
  }, [logAuditEvent]);

  return {
    logAuditEvent,
    logPHIAccess,
    logDataChange,
    logConsentChange
  };
}

// Helper functions
async function getClientIP(): Promise<string> {
  try {
    // In production, you might want to use a service to get the real IP
    // For now, return a placeholder
    return '0.0.0.0';
  } catch {
    return '0.0.0.0';
  }
}

function getSessionId(): string {
  // Generate or retrieve session ID
  let sessionId = sessionStorage.getItem('gdpr_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('gdpr_session_id', sessionId);
  }
  return sessionId;
}