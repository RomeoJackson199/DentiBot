import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { DentistAppShell, DentistSection } from "@/components/layout/DentistAppShell";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { KeyboardShortcuts } from "@/components/layout/KeyboardShortcuts";

// Import components
import { ClinicalToday } from "@/components/ClinicalToday";
import { ModernPatientManagement } from "@/components/enhanced/ModernPatientManagement";
import { EnhancedAvailabilitySettings } from "@/components/enhanced/EnhancedAvailabilitySettings";
import { PaymentRequestManager } from "@/components/PaymentRequestManager";
import { DentistAnalytics } from "@/components/analytics/DentistAnalytics";
import { InventoryManager } from "@/components/inventory/InventoryManager";
import DataImportManager from "@/components/DataImportManager";
import DentistAdminBranding from "./DentistAdminBranding";
import DentistAdminSecurity from "./DentistAdminSecurity";
import DentistAdminUsers from "./DentistAdminUsers";
import { ModernLoadingSpinner } from "@/components/enhanced/ModernLoadingSpinner";
import { UnifiedAppointments } from "@/components/UnifiedAppointments";
import MarketingTools from "./dentist/MarketingTools";

interface DentistPortalProps {
  user?: User | null;
}

export function DentistPortal({ user: userProp }: DentistPortalProps) {
  const [activeSection, setActiveSection] = useState<DentistSection>('clinical');
  const [dentistId, setDentistId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(userProp || null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [badges, setBadges] = useState<Partial<Record<DentistSection, number>>>({});

  useEffect(() => {
    const getUser = async () => {
      if (userProp) {
        setUser(userProp);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [userProp]);

  useEffect(() => {
    if (user) {
      fetchDentistProfile();
    }
  }, [user]);

  const fetchDentistProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      // Get current user's profile id via security-definer function to avoid RLS edge cases
      const { data: profId, error: profErr } = await supabase.rpc('get_current_user_profile_id');
      if (profErr || !profId) throw new Error('Could not load your profile');

      // Find dentist record for this profile
      const { data: dentist, error: dentistError } = await supabase
        .from('dentists')
        .select('id')
        .eq('profile_id', profId as string)
        .maybeSingle();

      if (!dentist || dentistError) {
        // Guide user to onboarding if no dentist record
        toast({
          title: 'Complete setup',
          description: 'Create your clinic to access the dentist portal.',
        });
        // Optionally redirect to onboarding
        // const nav = useNavigate(); // navigate not used here to avoid hooks in function
        // navigate('/start');
        setDentistId(null);
        return;
      }

      setDentistId(dentist.id);
      
      // Fetch badge counts
      const { data: payments } = await supabase
        .from('payment_requests')
        .select('id')
        .eq('dentist_id', dentist.id)
        .eq('status', 'overdue');

      const { data: inventory } = await supabase
        .from('inventory_items')
        .select('quantity, min_threshold')
        .eq('dentist_id', dentist.id);

      const lowStockCount = (inventory || []).filter(
        (item: any) => item.quantity <= item.min_threshold
      ).length;

      setBadges({
        payments: (payments || []).length,
        inventory: lowStockCount,
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ModernLoadingSpinner variant="overlay" message="Loading dentist portal..." />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!dentistId) {
    return <ModernLoadingSpinner variant="card" message="Access Denied" description="You are not registered as a dentist. Please contact support." />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'clinical':
        return <ClinicalToday dentistId={dentistId} user={user} onOpenPatientsTab={() => setActiveSection('patients')} onOpenAppointmentsTab={() => setActiveSection('appointments')} />;
      case 'patients':
        return <ModernPatientManagement dentistId={dentistId} />;
      case 'appointments':
        return (
          <div className="p-6">
            <UnifiedAppointments 
              dentistId={dentistId}
              onOpenPatientProfile={(patientId) => {
                sessionStorage.setItem('requestedPatientId', patientId);
                setActiveSection('patients');
              }}
              viewMode="clinical"
            />
          </div>
        );
      case 'schedule':
        return <EnhancedAvailabilitySettings dentistId={dentistId} />;
      case 'payments':
        return <PaymentRequestManager dentistId={dentistId} />;
      case 'analytics':
        return (
          <DentistAnalytics
            dentistId={dentistId}
            onOpenPatientsTab={() => setActiveSection('patients')}
            onOpenClinicalTab={() => setActiveSection('clinical')}
            onOpenPaymentsTab={() => setActiveSection('payments')}
          />
        );
      case 'reports':
        return <div className="p-4">Reports (Coming Soon)</div>;
      case 'inventory':
        return <InventoryManager dentistId={dentistId} userId={user.id} />;
      case 'imports':
        return <DataImportManager />;
      case 'users':
        return <DentistAdminUsers />;
      case 'branding':
        return <DentistAdminBranding />;
      case 'security':
        return <DentistAdminSecurity />;
      case 'marketing':
        return <MarketingTools />;
      default:
        return <div className="p-4">Section not found</div>;
    }
  };

  return (
    <DentistAppShell
      activeSection={activeSection}
      onChangeSection={setActiveSection}
      badges={badges}
      dentistId={dentistId}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Breadcrumbs />
          <KeyboardShortcuts />
        </div>
        {renderContent()}
      </div>
    </DentistAppShell>
  );
}

export default DentistPortal;