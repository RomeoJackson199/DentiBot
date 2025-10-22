import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { DentistAppShell, DentistSection } from "@/components/layout/DentistAppShell";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

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
import DentistAppointmentsManagement from "./DentistAppointmentsManagement";

interface DentistPortalProps {
  user?: User | null;
}

export function DentistPortal({ user: userProp }: DentistPortalProps) {
  const [activeSection, setActiveSection] = useState<DentistSection>('dashboard');
  const [dentistId, setDentistId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(userProp || null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [badges, setBadges] = useState<Partial<Record<DentistSection, number>>>({});
  const location = useLocation();

  // Handle URL-based section navigation
  useEffect(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2) {
      const sectionFromUrl = pathParts[1]; // Gets 'patients' from '/dentist/patients'
      
      const validSections: DentistSection[] = [
        'dashboard', 'patients', 'appointments', 'employees', 'clinical',
        'schedule', 'payments', 'analytics', 'reports', 'inventory',
        'imports', 'users', 'branding', 'security'
      ];
      
      if (validSections.includes(sectionFromUrl as DentistSection)) {
        setActiveSection(sectionFromUrl as DentistSection);
      }
    }
  }, [location.pathname]);

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
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Profile not found');

      const { data: dentist, error: dentistError } = await supabase
        .from('dentists')
        .select('id, is_active')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (dentistError) throw dentistError;
      if (!dentist) throw new Error('You are not registered as a dentist');
      if (!dentist.is_active) throw new Error('Your dentist account is not active');

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
      case 'dashboard':
        return <ClinicalToday dentistId={dentistId} user={user} onOpenPatientsTab={() => setActiveSection('patients')} onOpenAppointmentsTab={() => setActiveSection('appointments')} />;
      case 'patients':
        return <ModernPatientManagement dentistId={dentistId} />;
      case 'appointments':
        return <DentistAppointmentsManagement />;
      case 'employees':
        return <DentistAdminUsers />;
      case 'clinical':
        return <ClinicalToday dentistId={dentistId} user={user} onOpenPatientsTab={() => setActiveSection('patients')} onOpenAppointmentsTab={() => setActiveSection('appointments')} />;
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
        {renderContent()}
      </div>
    </DentistAppShell>
  );
}

export default DentistPortal;