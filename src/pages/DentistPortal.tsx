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
      // Use RPC to safely get dentist ID
      const { data: dentistIdData, error: dentistError } = await supabase
        .rpc('get_current_dentist_id');

      if (dentistError) throw dentistError;

      if (!dentistIdData) {
        console.warn('No dentist record found for user');
        setDentistId(null);
        setLoading(false);
        return;
      }

      // Check if user selected a specific clinic and verify access
      const selectedClinicDentistId = sessionStorage.getItem('selectedClinicDentistId');
      if (selectedClinicDentistId) {
        // User came from clinic selector - verify they own this clinic
        if (dentistIdData !== selectedClinicDentistId) {
          console.error('Access denied: User is not the dentist for selected clinic');
          toast({
            title: 'Access Denied',
            description: 'You do not have access to this clinic.',
            variant: 'destructive',
          });
          setDentistId(null);
          setLoading(false);
          return;
        }
        // Clear the selection after verification
        sessionStorage.removeItem('selectedClinicDentistId');
      }

      setDentistId(dentistIdData);
      
      // Fetch badge counts
      const { data: payments } = await supabase
        .from('payment_requests')
        .select('id')
        .eq('dentist_id', dentistIdData)
        .eq('status', 'overdue');

      const { data: inventory } = await supabase
        .from('inventory_items')
        .select('quantity, min_threshold')
        .eq('dentist_id', dentistIdData);

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

  const handleFixAccess = async () => {
    try {
      setLoading(true);
      const { data: dentistIdData, error } = await supabase.rpc('ensure_current_user_is_dentist');
      if (error) throw error;
      setDentistId(dentistIdData);
      toast({
        title: 'Success',
        description: 'Access fixed! Reloading...',
      });
      window.location.reload();
    } catch (error: any) {
      console.error('Error fixing access:', error);
      toast({
        title: 'Error',
        description: 'Failed to fix access: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!dentistId && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg border">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-destructive">Access Denied</h2>
            <p className="text-muted-foreground">
              You are not registered as a dentist. Click below to fix your access.
            </p>
            <button
              onClick={handleFixAccess}
              disabled={loading}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Fixing...' : 'Fix Access'}
            </button>
          </div>
        </div>
      </div>
    );
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