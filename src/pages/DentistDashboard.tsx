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
import { useToast } from "@/hooks/use-toast";
import { ClinicalToday } from "@/components/ClinicalToday";
// Messaging functionality removed
import { NotificationButton } from "@/components/NotificationButton";
import { ModernNotificationCenter } from "@/components/notifications/ModernNotificationCenter";
import { RecallsQueue } from "@/components/RecallsQueue";
import DataImportManager from "@/components/DataImportManager";
 

interface DentistDashboardProps {
  user: User;
}

export function DentistDashboard({ user }: DentistDashboardProps) {
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
      
      <header className="hidden lg:block sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="p-3 rounded-xl bg-gradient-primary shadow-lg">
                <SettingsIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold">Denti Dashboard</h1>
              <p className="text-sm text-muted-foreground">Dentist Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ModernNotificationCenter userId={user.id} />
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="border-destructive/20 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile-optimized header */}
      <header className="lg:hidden sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="p-2 rounded-xl bg-gradient-primary shadow-lg">
                <SettingsIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">Denti Dashboard</h1>
              <p className="text-xs text-muted-foreground">Dentist Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ModernNotificationCenter userId={user.id} className="h-8 w-8" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-destructive/20 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

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
              <div className="px-4 md:px-6 py-4 w-full">
                <DataImportManager />
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