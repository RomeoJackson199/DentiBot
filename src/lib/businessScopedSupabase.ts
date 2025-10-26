import { supabase } from '@/integrations/supabase/client';

/**
 * Wrapper utilities for business-scoped Supabase queries
 * Automatically adds business_id filtering for multi-tenant security
 */

type TableName = 
  | 'appointments'
  | 'medical_records'
  | 'treatment_plans'
  | 'payment_requests'
  | 'dentist_availability'
  | 'dentist_vacation_days'
  | 'appointment_slots'
  | 'payment_items'
  | 'payment_reminders';

const BUSINESS_SCOPED_TABLES: TableName[] = [
  'appointments',
  'medical_records',
  'treatment_plans',
  'payment_requests',
  'dentist_availability',
  'dentist_vacation_days',
  'appointment_slots',
];

/**
 * Get current business ID from session
 */
export async function getCurrentBusinessId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated - cannot get business context');
  }

  const { data: sessionBusiness, error } = await supabase
    .from('session_business')
    .select('business_id')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !sessionBusiness?.business_id) {
    throw new Error('No business context set. Please select a business first.');
  }

  return sessionBusiness.business_id;
}

/**
 * Helper to add business_id to insert/update operations
 */
export async function addBusinessContext<T extends Record<string, any>>(
  data: T
): Promise<T & { business_id: string }> {
  const businessId = await getCurrentBusinessId();
  
  return {
    ...data,
    business_id: businessId,
  };
}

/**
 * Check if a table requires business scoping
 */
export function isBusinessScopedTable(tableName: string): boolean {
  return BUSINESS_SCOPED_TABLES.includes(tableName as TableName);
}

/**
 * Create a business-scoped query builder
 * Usage: 
 *   const query = await createBusinessScopedQuery('appointments');
 *   const { data } = await query.select('*').eq('status', 'pending');
 */
export async function createBusinessScopedQuery(tableName: TableName) {
  const businessId = await getCurrentBusinessId();
  
  return supabase
    .from(tableName)
    .select()
    .eq('business_id', businessId);
}
