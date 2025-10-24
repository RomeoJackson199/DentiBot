import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BusinessMembership {
  id: string;
  business_id: string;
  role: string;
  business?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface BusinessContextValue {
  businessId: string | null;
  businessSlug: string | null;
  businessName: string | null;
  membershipRole: string | null;
  memberships: BusinessMembership[];
  loading: boolean;
  switchBusiness: (businessIdOrSlug: string) => Promise<void>;
  refreshMemberships: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextValue | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [membershipRole, setMembershipRole] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<BusinessMembership[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMemberships = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMemberships([]);
        setLoading(false);
        return;
      }

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        setMemberships([]);
        setLoading(false);
        return;
      }

      // Get all business memberships
      const { data: membershipData, error } = await supabase
        .from('business_members')
        .select(`
          id,
          business_id,
          role,
          businesses:business_id (
            id,
            name,
            slug
          )
        `)
        .eq('profile_id', profile.id);

      if (error) throw error;

      const formattedMemberships = (membershipData || []).map((m: any) => ({
        id: m.id,
        business_id: m.business_id,
        role: m.role,
        business: m.businesses,
      }));

      setMemberships(formattedMemberships);

      // Get current session business or auto-select (only if not already set)
      const currentBusinessId = businessId;
      if (formattedMemberships.length > 0 && !currentBusinessId) {
        const { data: sessionBusiness } = await supabase
          .from('session_business')
          .select('business_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (sessionBusiness?.business_id) {
          // Restore session business
          const membership = formattedMemberships.find(m => m.business_id === sessionBusiness.business_id);
          if (membership?.business) {
            setBusinessId(membership.business_id);
            setBusinessSlug(membership.business.slug);
            setBusinessName(membership.business.name);
            setMembershipRole(membership.role);
          }
        } else if (formattedMemberships.length === 1) {
          // Auto-select if only one business
          await switchBusiness(formattedMemberships[0].business_id);
        }
      }
    } catch (error: any) {
      console.error('Error loading memberships:', error);
      toast.error('Failed to load business memberships');
    } finally {
      setLoading(false);
    }
  }, []); // Empty deps - we capture businessId value at call time

  const switchBusiness = useCallback(async (businessIdOrSlug: string) => {
    try {
      setLoading(true);

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessIdOrSlug);

      const { data, error } = await supabase.functions.invoke('set-current-business', {
        body: isUuid 
          ? { businessId: businessIdOrSlug }
          : { businessSlug: businessIdOrSlug },
      });

      if (error) throw error;

      if (data?.success) {
        setBusinessId(data.businessId);
        setMembershipRole(data.role);

        // Update local state with business details
        const membership = memberships.find(m => m.business_id === data.businessId);
        if (membership?.business) {
          setBusinessSlug(membership.business.slug);
          setBusinessName(membership.business.name);
        }

        toast.success(`Switched to ${membership?.business?.name || 'business'}`);
      }
    } catch (error: any) {
      console.error('Error switching business:', error);
      toast.error(error.message || 'Failed to switch business');
    } finally {
      setLoading(false);
    }
  }, [memberships]);

  useEffect(() => {
    loadMemberships();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        loadMemberships();
      } else if (event === 'SIGNED_OUT') {
        setBusinessId(null);
        setBusinessSlug(null);
        setBusinessName(null);
        setMembershipRole(null);
        setMemberships([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadMemberships]);

  return (
    <BusinessContext.Provider
      value={{
        businessId,
        businessSlug,
        businessName,
        membershipRole,
        memberships,
        loading,
        switchBusiness,
        refreshMemberships: loadMemberships,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusinessContext() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusinessContext must be used within BusinessProvider');
  }
  return context;
}

// Utility hook to ensure business is selected
export function useRequireBusinessContext() {
  const context = useBusinessContext();
  
  useEffect(() => {
    if (!context.loading && !context.businessId) {
      toast.error('Please select a business first');
    }
  }, [context.loading, context.businessId]);

  return context;
}
