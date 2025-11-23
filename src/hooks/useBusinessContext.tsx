import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

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

  // Use ref to track current businessId without causing re-renders or stale closures
  const businessIdRef = useRef<string | null>(null);
  useEffect(() => {
    businessIdRef.current = businessId;
  }, [businessId]);

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

      // Get all business memberships (no joins to avoid missing FK issues)
      const { data: membershipData, error: membershipError } = await supabase
        .from('business_members')
        .select('id, business_id, role')
        .eq('profile_id', profile.id);

      if (membershipError) throw membershipError;

      const businessIds = (membershipData || []).map((m: any) => m.business_id);
      let businessMap: Record<string, any> = {};
      if (businessIds.length > 0) {
        const { data: businessesData, error: businessesError } = await supabase
          .from('businesses')
          .select('id, name, slug, template_type')
          .in('id', businessIds)
          .in('template_type', ['healthcare', 'dentist']);

        if (businessesError) throw businessesError;
        businessMap = Object.fromEntries((businessesData || []).map((b: any) => [b.id, b]));
      }

      const formattedMemberships = (membershipData || []).map((m: any) => ({
        id: m.id,
        business_id: m.business_id,
        role: m.role,
        business: businessMap[m.business_id] || null,
      }));

      setMemberships(formattedMemberships);

      // Get current session business or auto-select (only if not already set)
      const currentBusinessId = businessIdRef.current;
      if (!currentBusinessId) {
        const { data: sessionBusiness } = await supabase
          .from('session_business')
          .select('business_id')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sessionBusiness?.business_id) {
          // For business members: restore from membership
          if (formattedMemberships.length > 0) {
            const membership = formattedMemberships.find(m => m.business_id === sessionBusiness.business_id);
            if (membership?.business) {
              setBusinessId(membership.business_id);
              setBusinessSlug(membership.business.slug);
              setBusinessName(membership.business.name);
              setMembershipRole(membership.role);
            }
          } else {
            // For patients (non-members): fetch business details directly
            const { data: business } = await supabase
              .from('businesses')
              .select('id, name, slug')
              .eq('id', sessionBusiness.business_id)
              .single();

            if (business) {
              setBusinessId(business.id);
              setBusinessSlug(business.slug);
              setBusinessName(business.name);
              setMembershipRole('guest');
            }
          }
        } else if (formattedMemberships.length === 1) {
          // Auto-select if only one business membership - set directly without calling switchBusiness
          const membership = formattedMemberships[0];
          if (membership?.business) {
            setBusinessId(membership.business_id);
            setBusinessSlug(membership.business.slug);
            setBusinessName(membership.business.name);
            setMembershipRole(membership.role);
          }
        }
      }
    } catch (error: any) {
      logger.error('Error loading memberships:', error);
      toast.error('Failed to load business memberships');
    } finally {
      setLoading(false);
    }
  }, []); // Empty deps is now safe - uses ref for businessId

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
          toast.success(`Switched to ${membership.business.name}`);
        } else {
          // For patients (non-members): fetch business details
          const { data: business } = await supabase
            .from('businesses')
            .select('name, slug')
            .eq('id', data.businessId)
            .single();

          if (business) {
            setBusinessSlug(business.slug);
            setBusinessName(business.name);
            toast.success(`Switched to ${business.name}`);
          }
        }
      }
    } catch (error: any) {
      logger.error('Error switching business:', error);
      toast.error(error.message || 'Failed to switch business');
    } finally {
      setLoading(false);
    }
  }, [memberships]); // Remove loadMemberships dependency to break circular dependency

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
