import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Calendar, Palette, Shield, User, LogOut } from "lucide-react";
import { EnhancedAvailabilitySettings } from "@/components/enhanced/EnhancedAvailabilitySettings";
import DentistAdminBranding from "./DentistAdminBranding";
import DentistAdminSecurity from "./DentistAdminSecurity";
import DentistAdminProfile from "./DentistAdminProfile";
import { useCurrentDentist } from "@/hooks/useCurrentDentist";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getCurrentBusinessId } from "@/lib/businessUtils";

export default function DentistSettings() {
  const { dentistId } = useCurrentDentist();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("schedule");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'schedule', 'branding', 'security'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleLeaveClinic = async () => {
    try {
      const businessId = await getCurrentBusinessId();
      const { data, error } = await supabase.rpc('leave_clinic', { p_business_id: businessId });
      if (error) throw error;

      const remaining = (data as any)?.remaining_businesses ?? null;
      toast({
        title: "Left clinic",
        description: remaining === 0
          ? "You left the clinic and your provider role was removed."
          : "You left the clinic. You still belong to other clinics.",
      });

      // Force reload to update role and UI
      window.location.href = '/';
    } catch (error) {
      console.error('Error leaving clinic:', error);
      toast({
        title: "Error",
        description: "Failed to leave clinic. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!dentistId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <SettingsIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your practice settings and preferences</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <DentistAdminProfile />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule & Availability</CardTitle>
              <CardDescription>
                Manage your working hours, breaks, and time off
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedAvailabilitySettings dentistId={dentistId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <DentistAdminBranding />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <DentistAdminSecurity />
          
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions that affect your clinic membership
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                onClick={handleLeaveClinic}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Leave Clinic
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                You will lose access to all clinic data and appointments.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
