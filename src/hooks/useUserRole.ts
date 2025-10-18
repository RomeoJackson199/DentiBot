import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = 'admin' | 'provider' | 'customer' | 'staff';

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
          console.error('Error fetching roles:', roleError);
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
        console.error('Error in useUserRole:', e);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = hasRole('admin');
  const isProvider = hasRole('provider');
  const isCustomer = hasRole('customer');
  const isStaff = hasRole('staff');

  return {
    roles,
    hasRole,
    isAdmin,
    isProvider,
    isCustomer,
    isStaff,
    loading,
    error
  };
}
