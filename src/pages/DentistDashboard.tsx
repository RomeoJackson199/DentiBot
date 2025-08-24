import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

import { EnhancedAvailabilitySettings } from "@/components/enhanced/EnhancedAvailabilitySettings";
import { DentistManagement } from "@/components/DentistManagement";
import { PatientManagement } from "@/components/PatientManagement";
import { PaymentRequestManager } from "@/components/PaymentRequestManager";
import { DentistAnalytics } from "@/components/analytics/DentistAnalytics";
import { ChangelogPopup } from "@/components/ChangelogPopup";
import { DebugDatabaseConnection } from "@/components/DebugDatabaseConnection";
import { MobileDentistTabs } from "@/components/MobileDentistTabs";
import { MobileOptimizations } from "@/components/mobile/MobileOptimizations";
import { InventoryManager } from "@/components/inventory/InventoryManager";
import { LogOut, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { ClinicalToday } from "@/components/ClinicalToday";
// Messaging functionality removed
import { NotificationButton } from "@/components/NotificationButton";
import { ModernNotificationCenter } from "@/components/notifications/ModernNotificationCenter";
import { RecallsQueue } from "@/components/RecallsQueue";
import DataImportManager from "@/components/DataImportManager";
import NotificationCenter from "@/components/NotificationCenter";
 

interface DentistDashboardProps {
  user: User;
}

export function DentistDashboard({ user, asPage }: DentistDashboardProps & { asPage?: boolean }) {
  const [activeTab, setActiveTab] = useState<'clinical' | 'patients' | 'payments' | 'analytics' | 'availability' | 'manage' | 'debug' | 'inventory' | 'recalls' | 'import'>('clinical');
  const [dentistId, setDentistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChangelog, setShowChangelog] = useState(false);
  const { toast } = useToast();
  const [inventoryLowCount, setInventoryLowCount] = useState<number>(0);

  useEffect(() => {
    fetchDentistProfile();
  }, [user]);

  useEffect(() => {
    // Show changelog popup when dentist dashboard loads
    if (dentistId && !loading) {
      setShowChangelog(true);
    }
  }, [dentistId, loading]);

  useEffect(() => {
    if (window?.location?.hash === '#inventory') {
      setActiveTab('inventory');
    }
  }, []);

  const fetchDentistProfile = async () => {
    try {
      // Get the dentist profile for this user
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
      // Fetch low stock count for badge
      const { data: items } = await (supabase as any)
        .from('inventory_items')
        .select('quantity, min_threshold')
        .eq('dentist_id', dentist.id);
      const low = (items || []).filter((i: any) => i.quantity < i.min_threshold).length;
      setInventoryLowCount(low);
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

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading dentist dashboard...</div>;
  }

  if (!dentistId) {
    return (
      <div className="flex justify-center p-8">
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

  return (
    <>
      <MobileOptimizations />
      <ChangelogPopup isOpen={showChangelog} onClose={() => setShowChangelog(false)} />
      {asPage && (
        <div className="p-3 md:p-4">
          <PageHeader
            title="Denti Dashboard"
            subtitle="Dentist Portal"
            breadcrumbs={[{ label: "Clinical", href: "/dashboard" }, { label: "Dashboard" }]}
          />
        </div>
      )}

      <MobileDentistTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dentistId={dentistId || ''}
        inventoryBadgeCount={inventoryLowCount}
      >
        {dentistId && (
          <>
            {activeTab === 'clinical' && (
              <ClinicalToday dentistId={dentistId} user={user} onOpenPatientsTab={() => setActiveTab('patients')} />
            )}
            
            {activeTab === 'inventory' && (
              <div className="px-4 md:px-6 py-4 w-full">
                <InventoryManager dentistId={dentistId} userId={user.id} />
              </div>
            )}
            
            {activeTab === 'availability' && (
              <EnhancedAvailabilitySettings dentistId={dentistId} />
            )}

            {activeTab === 'patients' && (
              <PatientManagement dentistId={dentistId} />
            )}

            {/* Messages functionality removed */}

            {activeTab === 'payments' && (
              <PaymentRequestManager dentistId={dentistId} />
            )}
            
            {activeTab === 'analytics' && (
              <DentistAnalytics
                dentistId={dentistId}
                onOpenPatientsTab={() => setActiveTab('patients')}
                onOpenClinicalTab={() => setActiveTab('clinical')}
                onOpenPaymentsTab={() => setActiveTab('payments')}
              />
            )}

            {activeTab === 'manage' && (
              <DentistManagement currentDentistId={dentistId} />
            )}

            {activeTab === 'recalls' && (
              <div className="px-4 md:px-6 py-4 w-full">
                <RecallsQueue dentistId={dentistId} />
              </div>
            )}


            {activeTab === 'import' && (
              <div className="px-4 md:px-6 py-4 w-full space-y-6">
                <DataImportManager />
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Import Notifications</h3>
                  <NotificationCenter />
                </div>
              </div>
            )}

            {activeTab === 'debug' && (
              <DebugDatabaseConnection />
            )}

            
          </>
        )}

        {!dentistId && !loading && (
          <Card className="mx-4 mt-8">
            <CardContent className="text-center p-8">
              <p className="text-muted-foreground">
                You are not registered as a dentist. Please contact support.
              </p>
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="flex justify-center items-center h-96">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Loading dentist profile...</p>
            </div>
          </div>
        )}
      </MobileDentistTabs>
    </>
  );
}