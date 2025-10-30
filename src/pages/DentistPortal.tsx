import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { DentistAppShell, DentistSection } from "@/components/layout/DentistAppShell";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useBusinessTemplate } from "@/hooks/useBusinessTemplate";

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
import DentistTeamManagement from "./DentistTeamManagement";
import DentistSettings from "./DentistSettings";
import { ModernLoadingSpinner } from "@/components/enhanced/ModernLoadingSpinner";
import DentistAppointmentsManagement from "./DentistAppointmentsManagement";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { InviteDentistDialog } from "@/components/InviteDentistDialog";
import { useBusinessContext } from "@/hooks/useBusinessContext";
import Messages from "./Messages";
import { ServiceManager } from "@/components/services/ServiceManager";
import { UserTour, useUserTour } from "@/components/UserTour";

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
  const [businessInfo, setBusinessInfo] = useState<{ id: string; name: string } | null>(null);
  const { hasFeature, loading: templateLoading } = useBusinessTemplate();
  const { showTour, closeTour } = useUserTour("dentist");

  // Handle URL-based section navigation
  useEffect(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2) {
      const sectionFromUrl = pathParts[1]; // Gets 'patients' from '/dentist/patients'
      
      const validSections: DentistSection[] = [
        'dashboard', 'patients', 'appointments', 'employees', 'messages', 'clinical',
        'schedule', 'payments', 'analytics', 'reports', 'inventory',
        'imports', 'users', 'team', 'branding', 'security', 'settings', 'services'
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
      fetchBusinessInfo();
    }
  }, [user]);

  const fetchBusinessInfo = async () => {
    const businessId = localStorage.getItem('selected_business_id');
    if (!businessId) return;
    
    const { data } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('id', businessId)
      .single();
    
    if (data) setBusinessInfo(data);
  };

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

      if (profileError) {
        console.error('❌ Profile error:', profileError);
        throw profileError;
      }
      if (!profile) {
        console.error('❌ No profile found for user:', user.id);
        throw new Error('Profile not found');
      }

      const { data: dentist, error: dentistError } = await supabase
        .from('dentists')
        .select('id, is_active')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (dentistError) {
        console.error('❌ Dentist error:', dentistError);
        throw dentistError;
      }
      if (!dentist) {
        console.error('❌ No dentist record found for profile:', profile.id);
        throw new Error('You are not registered as a dentist');
      }
      if (!dentist.is_active) {
        console.error('❌ Dentist account is inactive');
        throw new Error('Your dentist account is not active');
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

  if (loading || templateLoading) {
    return <ModernLoadingSpinner variant="overlay" message="Loading portal..." />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!dentistId) {
    return <ModernLoadingSpinner variant="card" message="Access Denied" description="You are not registered as a dentist. Please contact support." />;
  }

  const renderContent = () => {
    // If trying to access clinical section without medical features, redirect to dashboard
    if (activeSection === 'clinical' && !hasFeature('medicalRecords') && !hasFeature('prescriptions') && !hasFeature('treatmentPlans')) {
      setActiveSection('dashboard');
      return <ModernLoadingSpinner variant="card" message="Loading..." />;
    }

    switch (activeSection) {
      case 'dashboard':
        return <ClinicalToday dentistId={dentistId} user={user} onOpenPatientsTab={() => setActiveSection('patients')} onOpenAppointmentsTab={() => setActiveSection('appointments')} />;
      case 'patients':
        return <ModernPatientManagement dentistId={dentistId} />;
      case 'appointments':
        return <DentistAppointmentsManagement />;
      case 'employees':
        return <DentistAdminUsers />;
      case 'messages':
        return <Messages />;
      case 'clinical':
        // Only render clinical if medical features are enabled
        if (hasFeature('medicalRecords') || hasFeature('prescriptions') || hasFeature('treatmentPlans')) {
          return <ClinicalToday dentistId={dentistId} user={user} onOpenPatientsTab={() => setActiveSection('patients')} onOpenAppointmentsTab={() => setActiveSection('appointments')} />;
        }
        return <div className="p-4">Clinical features not available for this business type</div>;
      case 'schedule':
        return <EnhancedAvailabilitySettings dentistId={dentistId} />;
      case 'payments':
        return hasFeature('paymentRequests') ? <PaymentRequestManager dentistId={dentistId} /> : <div className="p-4">Payment features not available</div>;
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
      case 'team':
        return <DentistTeamManagement />;
      case 'branding':
        return <DentistAdminBranding />;
      case 'security':
        return <DentistAdminSecurity />;
      case 'settings':
        return <DentistSettings />;
      case 'services':
        return <ServiceManager />;
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
        <SubscriptionBanner dentistId={dentistId} />
        {activeSection === 'users' && businessInfo && (
          <div className="flex justify-end mb-4">
            <InviteDentistDialog 
              businessId={businessInfo.id} 
              businessName={businessInfo.name}
            />
          </div>
        )}
        {activeSection === 'team' && businessInfo && (
          <div className="flex justify-end mb-4">
            <InviteDentistDialog 
              businessId={businessInfo.id} 
              businessName={businessInfo.name}
            />
          </div>
        )}
        {renderContent()}
      </div>

      {/* User Tour */}
      <UserTour isOpen={showTour} onClose={closeTour} userRole="dentist" />
    </DentistAppShell>
  );
}

export default DentistPortal;