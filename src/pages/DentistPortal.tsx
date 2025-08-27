import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { DentistAppShell, DentistSection } from "@/components/layout/DentistAppShell";

// Import components
import { ClinicalToday } from "@/components/ClinicalToday";
import { PatientManagement } from "@/components/PatientManagement";
import { EnhancedAvailabilitySettings } from "@/components/enhanced/EnhancedAvailabilitySettings";
import { PaymentRequestManager } from "@/components/PaymentRequestManager";
import { DentistAnalytics } from "@/components/analytics/DentistAnalytics";
import { InventoryManager } from "@/components/inventory/InventoryManager";
import DataImportManager from "@/components/DataImportManager";
import { Card, CardContent } from "@/components/ui/card";

interface DentistPortalProps {
  user: User;
}

export function DentistPortal({ user }: DentistPortalProps) {
  const [activeSection, setActiveSection] = useState<DentistSection>('clinical');
  const [dentistId, setDentistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [badges, setBadges] = useState<Partial<Record<DentistSection, number>>>({});

  useEffect(() => {
    fetchDentistProfile();
  }, [user]);

  const fetchDentistProfile = async () => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const { data: dentist, error: dentistError } = await supabase
        .from('dentists')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (dentistError) {
        throw new Error('You are not registered as a dentist');
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
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dentistId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You are not registered as a dentist. Please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'clinical':
        return <ClinicalToday dentistId={dentistId} user={user} onOpenPatientsTab={() => setActiveSection('patients')} />;
      case 'patients':
        return <PatientManagement dentistId={dentistId} />;
      case 'appointments':
        return <div className="p-4">Appointments Management (Coming Soon)</div>;
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
      case 'branding':
        return <div className="p-4">Branding Settings (Coming Soon)</div>;
      case 'security':
        return <div className="p-4">Security Settings (Coming Soon)</div>;
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
      {renderContent()}
    </DentistAppShell>
  );
}

export default DentistPortal;