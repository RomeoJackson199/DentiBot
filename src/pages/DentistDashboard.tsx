import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

import { AvailabilitySettings } from "@/components/AvailabilitySettings";
import { DentistUrgencyGrid } from "@/components/DentistUrgencyGrid";
import { DentistManagement } from "@/components/DentistManagement";
import { NewPatientManagement } from "@/components/NewPatientManagement";
import { AppointmentManagement } from "@/components/AppointmentManagement";
import { DentistAnalytics } from "@/components/analytics/DentistAnalytics";
import { AdvancedDentistDashboard } from "@/components/dashboard/AdvancedDentistDashboard";
import { Calendar, Clock, Settings as SettingsIcon, AlertTriangle, BarChart3, UserPlus, LogOut, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface DentistDashboardProps {
  user: User;
}

export function DentistDashboard({ user }: DentistDashboardProps) {
  const [activeTab, setActiveTab] = useState<'advanced' | 'urgency' | 'availability' | 'appointments' | 'patients' | 'analytics' | 'manage'>('advanced');
  const [dentistId, setDentistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [useAdvancedDashboard, setUseAdvancedDashboard] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDentistProfile();
  }, [user]);

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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load dentist profile",
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
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

  // If advanced dashboard is enabled, render it
  if (useAdvancedDashboard) {
    return <AdvancedDentistDashboard dentistId={dentistId} />;
  }

  return (
    <div className="min-h-screen mesh-bg">
      <header className="glass-card sticky top-0 z-50 border-0 border-b border-border/20">
        <div className="container mx-auto px-4 py-4 sm:py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative">
              <div className="pulse-ring w-16 h-16 -top-4 -left-4 sm:w-20 sm:h-20 sm:-top-5 sm:-left-5"></div>
              <div className="relative p-2 sm:p-3 rounded-2xl shadow-glow animate-glow bg-white">
                <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8 text-dental-primary" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-secondary rounded-full animate-pulse shadow-float"></div>
            </div>
            <div className="hidden sm:block">
              <h2 className="text-2xl font-bold gradient-text">Denti Bot Unified</h2>
              <p className="text-sm text-dental-muted-foreground">Dentist Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Advanced Dashboard Toggle */}
            <div className="flex items-center space-x-2 glass-card p-2 rounded-lg">
              <Zap className="h-4 w-4 text-dental-primary" />
              <span className="text-sm font-medium">Advanced</span>
              <Switch
                checked={useAdvancedDashboard}
                onCheckedChange={setUseAdvancedDashboard}
                className="data-[state=checked]:bg-dental-primary"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="glass-card border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 lg:py-10">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="glass-card rounded-2xl p-2 sm:p-3 animate-fade-in w-full max-w-4xl">
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-1 sm:gap-2">
              <Button
                variant={activeTab === 'advanced' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('advanced')}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
                  activeTab === 'advanced' 
                    ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                }`}
              >
                <Zap className="h-4 w-4" />
                <span className="font-medium">Advanced</span>
              </Button>
              
              <Button
                variant={activeTab === 'urgency' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('urgency')}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
                  activeTab === 'urgency' 
                    ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Urgency</span>
              </Button>
              
              <Button
                variant={activeTab === 'availability' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('availability')}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
                  activeTab === 'availability' 
                    ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span className="font-medium">Availability</span>
              </Button>

              <Button
                variant={activeTab === 'appointments' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('appointments')}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
                  activeTab === 'appointments' 
                    ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Appointments</span>
              </Button>

              <Button
                variant={activeTab === 'patients' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('patients')}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
                  activeTab === 'patients' 
                    ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                }`}
              >
                <Users className="h-4 w-4" />
                <span className="font-medium">Patients</span>
              </Button>

              <Button
                variant={activeTab === 'analytics' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
                  activeTab === 'analytics' 
                    ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="font-medium">Analytics</span>
              </Button>

              <Button
                variant={activeTab === 'manage' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('manage')}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm ${
                  activeTab === 'manage' 
                    ? 'bg-gradient-primary text-white shadow-elegant scale-105' 
                    : 'text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 hover:scale-105'
                }`}
              >
                <UserPlus className="h-4 w-4" />
                <span className="font-medium">Manage</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="animate-fade-in">
          {activeTab === 'advanced' && (
            <AdvancedDentistDashboard dentistId={dentistId} />
          )}
          
          {activeTab === 'urgency' && (
            <DentistUrgencyGrid dentistId={dentistId} />
          )}
          
          {activeTab === 'availability' && (
            <AvailabilitySettings dentistId={dentistId} />
          )}

          {activeTab === 'appointments' && (
            <AppointmentManagement dentistId={dentistId} />
          )}

          {activeTab === 'patients' && (
            <NewPatientManagement dentistId={dentistId} />
          )}
          
          {activeTab === 'analytics' && (
            <DentistAnalytics dentistId={dentistId} />
          )}

          {activeTab === 'manage' && (
            <DentistManagement currentDentistId={dentistId} />
          )}
        </div>
      </main>
    </div>
  );
}