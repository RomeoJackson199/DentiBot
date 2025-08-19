-- GDPR Compliance Core Database Schema

-- Consent management
CREATE TYPE consent_scope AS ENUM ('health_data_processing', 'ai_intake', 'notifications', 'marketing', 'analytics');
CREATE TYPE consent_status AS ENUM ('granted', 'withdrawn', 'expired');

CREATE TABLE public.consent_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  scope consent_scope NOT NULL,
  status consent_status NOT NULL DEFAULT 'granted',
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT,
  legal_basis TEXT DEFAULT 'consent',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- GDPR data subject requests
CREATE TYPE gdpr_request_type AS ENUM ('access', 'rectification', 'erasure', 'restriction', 'portability', 'objection');
CREATE TYPE gdpr_request_status AS ENUM ('submitted', 'in_progress', 'approved', 'rejected', 'completed', 'expired');

CREATE TABLE public.gdpr_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  type gdpr_request_type NOT NULL,
  status gdpr_request_status NOT NULL DEFAULT 'submitted',
  description TEXT,
  legal_basis TEXT,
  urgency_level TEXT DEFAULT 'normal',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  resolved_at TIMESTAMP WITH TIME ZONE,
  actor_id UUID, -- who processed the request
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Data export bundles
CREATE TYPE export_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'expired');

CREATE TABLE public.gdpr_export_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  request_id UUID REFERENCES public.gdpr_requests(id),
  status export_status NOT NULL DEFAULT 'pending',
  bundle_type TEXT DEFAULT 'full_export',
  file_path TEXT,
  signed_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Audit logging for GDPR compliance
CREATE TYPE audit_action AS ENUM ('login', 'logout', 'view_phi', 'create', 'update', 'delete', 'export', 'consent_change', 'gdpr_request', 'price_override', 'backup', 'restore');

CREATE TABLE public.gdpr_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID,
  actor_role TEXT,
  action audit_action NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  patient_id UUID, -- for PHI access tracking
  purpose_code TEXT, -- 'care', 'billing', 'support', 'admin'
  before_data JSONB,
  after_data JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Retention policies
CREATE TABLE public.retention_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL UNIQUE,
  retention_period_months INTEGER NOT NULL,
  legal_basis TEXT NOT NULL,
  is_locked BOOLEAN DEFAULT false, -- regulatory requirements
  grace_period_days INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vendor/subprocessor registry
CREATE TABLE public.vendor_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  data_categories TEXT[] DEFAULT '{}',
  region TEXT NOT NULL,
  has_dpa BOOLEAN DEFAULT false,
  has_scc BOOLEAN DEFAULT false,
  dpa_signed_at TIMESTAMP WITH TIME ZONE,
  dpa_expires_at TIMESTAMP WITH TIME ZONE,
  scc_signed_at TIMESTAMP WITH TIME ZONE,
  contact_email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Legal documents (DPA, DPIA, RoPA)
CREATE TYPE document_type AS ENUM ('dpa', 'dpia', 'ropa', 'scc', 'breach_report', 'gdpr_monthly');

CREATE TABLE public.legal_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type document_type NOT NULL,
  title TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  file_path TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  entity_id UUID, -- clinic/vendor this applies to
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Breach incidents
CREATE TYPE breach_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE breach_status AS ENUM ('reported', 'investigating', 'contained', 'resolved', 'closed');

CREATE TABLE public.breach_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  severity breach_severity NOT NULL,
  status breach_status NOT NULL DEFAULT 'reported',
  affected_records_count INTEGER DEFAULT 0,
  data_categories TEXT[] DEFAULT '{}',
  root_cause TEXT,
  mitigation_steps TEXT,
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL,
  contained_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  authority_notified_at TIMESTAMP WITH TIME ZONE,
  patients_notified_at TIMESTAMP WITH TIME ZONE,
  reporter_id UUID,
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Backup logs
CREATE TYPE backup_status AS ENUM ('running', 'completed', 'failed');

CREATE TABLE public.backup_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_type TEXT NOT NULL, -- 'daily', 'weekly', 'restore_test'
  status backup_status NOT NULL,
  file_path TEXT,
  size_bytes BIGINT,
  checksum TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Data minimization settings
CREATE TABLE public.data_minimization_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL UNIQUE,
  auto_delete_old_messages BOOLEAN DEFAULT false,
  auto_delete_old_images BOOLEAN DEFAULT false,
  minimal_logging BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdpr_export_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdpr_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breach_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_minimization_settings ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_consent_records_patient_id ON public.consent_records(patient_id);
CREATE INDEX idx_consent_records_scope_status ON public.consent_records(scope, status);
CREATE INDEX idx_gdpr_requests_patient_id ON public.gdpr_requests(patient_id);
CREATE INDEX idx_gdpr_requests_status_due ON public.gdpr_requests(status, due_at);
CREATE INDEX idx_gdpr_audit_log_patient_id ON public.gdpr_audit_log(patient_id);
CREATE INDEX idx_gdpr_audit_log_created_at ON public.gdpr_audit_log(created_at);
CREATE INDEX idx_breach_incidents_status ON public.breach_incidents(status);
CREATE INDEX idx_backup_logs_backup_type_status ON public.backup_logs(backup_type, status);

-- Triggers for updated_at
CREATE TRIGGER update_consent_records_updated_at
BEFORE UPDATE ON public.consent_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gdpr_requests_updated_at
BEFORE UPDATE ON public.gdpr_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_retention_policies_updated_at
BEFORE UPDATE ON public.retention_policies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_registry_updated_at
BEFORE UPDATE ON public.vendor_registry
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_breach_incidents_updated_at
BEFORE UPDATE ON public.breach_incidents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_minimization_settings_updated_at
BEFORE UPDATE ON public.data_minimization_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();