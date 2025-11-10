// Super Admin Dashboard Types

export interface BusinessMetrics {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  owner_name: string;
  created_at: string;
  total_members: number;
  total_appointments: number;
  active_appointments: number;
  total_patients: number;
  custom_config: Record<string, unknown> | null;
  is_active: boolean;
}

export interface UserWithBusinesses {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  created_at: string;
  businesses: BusinessMembership[];
  roles: string[];
}

export interface BusinessMembership {
  business_id: string;
  business_name: string;
  role: string;
}

export interface SystemStats {
  total_businesses: number;
  active_businesses: number;
  total_users: number;
  total_appointments: number;
  appointments_today: number;
  total_errors: number;
  unresolved_errors: number;
  critical_errors: number;
  users_joined_this_month: number;
  businesses_created_this_month: number;
}

export interface SystemError {
  id: string;
  error_type: string;
  error_message: string;
  stack_trace: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id: string | null;
  business_id: string | null;
  url: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_user_id: string | null;
  admin_email: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface CreateBusinessRequest {
  business_name: string;
  owner_email: string;
  owner_first_name: string;
  owner_last_name: string;
  business_type?: string;
  template_type?: string;
}
