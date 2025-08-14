import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

import { EnhancedAvailabilitySettings } from "@/components/enhanced/EnhancedAvailabilitySettings";
import { EnhancedUrgencyDashboard } from "@/components/enhanced/EnhancedUrgencyDashboard";
import { DentistManagement } from "@/components/DentistManagement";
import { PatientManagement } from "@/components/PatientManagement";
import { AppointmentManagement } from "@/components/AppointmentManagement";
import { PaymentRequestManager } from "@/components/PaymentRequestManager";
import { DentistAnalytics } from "@/components/analytics/DentistAnalytics";
import { ChangelogPopup } from "@/components/ChangelogPopup";
import { DebugDatabaseConnection } from "@/components/DebugDatabaseConnection";
import { MobileDentistTabs } from "@/components/MobileDentistTabs";
import { MobileOptimizations } from "@/components/mobile/MobileOptimizations";
import { LogOut, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface DentistDashboardProps {
  user: User;
}

export function DentistDashboard({ user }: DentistDashboardProps) {
  const [activeTab, setActiveTab] = useState<'urgency' | 'appointments' | 'patients' | 'payments' | 'analytics' | 'availability' | 'manage' | 'debug'>('appointments');
  const [dentistId, setDentistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChangelog, setShowChangelog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDentistProfile();
  }, [user]);

  useEffect(() => {
    // Show changelog popup when dentist dashboard loads
    if (dentistId && !loading) {
      setShowChangelog(true);
    }
  }, [dentistId, loading]);

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
      
      {/* Mobile-optimized header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b">
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
      </header>

      <MobileDentistTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dentistId={dentistId || ''}
      >
        {dentistId && (
          <>
            {activeTab === 'urgency' && (
              <EnhancedUrgencyDashboard dentistId={dentistId} />
            )}
            
            {activeTab === 'availability' && (
              <EnhancedAvailabilitySettings dentistId={dentistId} />
            )}

            {activeTab === 'appointments' && (
              <AppointmentManagement dentistId={dentistId} />
            )}

            {activeTab === 'patients' && (
              <PatientManagement dentistId={dentistId} />
            )}

            {activeTab === 'payments' && (
              <PaymentRequestManager dentistId={dentistId} />
            )}
            
            {activeTab === 'analytics' && (
              <DentistAnalytics dentistId={dentistId} />
            )}

            {activeTab === 'manage' && (
              <DentistManagement currentDentistId={dentistId} />
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