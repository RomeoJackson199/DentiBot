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

        let userRoles: AppRole[] = [];
        if (data && Array.isArray(data)) {
          userRoles = data.map((r: any) => r.role as AppRole);
        }

        // Fallback: infer provider role if user owns or belongs to a business
        if (!userRoles.includes('provider')) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (profile) {
            const [{ data: owned }, { data: member }] = await Promise.all([
              supabase.from('businesses' as any).select('id').eq('owner_profile_id', profile.id),
              supabase.from('provider_business_map' as any).select('id').eq('provider_id', profile.id)
            ]);

            if ((owned && owned.length > 0) || (member && member.length > 0)) {
              userRoles.push('provider');
            }
          }
        }

        setRoles(userRoles);
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

