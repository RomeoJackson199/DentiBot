import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/lib/logger';

export type AppRole = 'admin' | 'dentist' | 'provider' | 'patient' | 'staff';

export function useUserRole() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRoles([]);
          setLoading(false);
          return;
        }

        const { data, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (roleError) {
          logger.error('Error fetching roles:', roleError);
          throw roleError;
        }

        if (data && Array.isArray(data)) {
          const userRoles = data.map((r: any) => r.role as AppRole);
          setRoles(userRoles);
        } else {
          setRoles([]);
        }
      } catch (e: any) {
        setError(e.message);
        logger.error('Error in useUserRole:', e);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = hasRole('admin');
  const isDentist = hasRole('dentist') || hasRole('provider');
  // Handle legacy 'customer' role as 'patient' during transition
  const isPatient = hasRole('patient') || (roles as any).includes('customer');
  const isStaff = hasRole('staff');

  return {
    roles,
    hasRole,
    isAdmin,
    isDentist,
    isPatient,
    isStaff,
    loading,
    error
  };
}
