import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

import { AvailabilitySettings } from "@/components/AvailabilitySettings";
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  Activity,
  Settings as SettingsIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface DentistDashboardProps {
  user: User;
}

export function DentistDashboard({ user }: DentistDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'availability'>('overview');
  const [dentistId, setDentistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    pendingAppointments: 0
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDentistProfile();
  }, [user]);

  useEffect(() => {
    if (dentistId) {
      fetchDashboardStats();
    }
  }, [dentistId]);

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

  const fetchDashboardStats = async () => {
    if (!dentistId) return;

    try {
      // Get today's appointments
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const { data: todayAppts, error: todayError } = await supabase
        .from('appointments')
        .select('id')
        .eq('dentist_id', dentistId)
        .gte('appointment_date', startOfDay.toISOString())
        .lte('appointment_date', endOfDay.toISOString());

      if (todayError) throw todayError;

      // Get total unique patients
      const { data: allAppts, error: allError } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('dentist_id', dentistId);

      if (allError) throw allError;

      const uniquePatients = new Set(allAppts?.map(apt => apt.patient_id) || []);

      // Get pending appointments
      const { data: pendingAppts, error: pendingError } = await supabase
        .from('appointments')
        .select('id')
        .eq('dentist_id', dentistId)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      setStats({
        todayAppointments: todayAppts?.length || 0,
        totalPatients: uniquePatients.size,
        pendingAppointments: pendingAppts?.length || 0
      });
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dentist Dashboard</h1>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'outline'}
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'availability' ? 'default' : 'outline'}
              onClick={() => setActiveTab('availability')}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Availability
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {activeTab === 'overview' ? (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayAppointments}</div>
                  <p className="text-xs text-muted-foreground">
                    appointments scheduled for today
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPatients}</div>
                  <p className="text-xs text-muted-foreground">
                    unique patients you've treated
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Appointments</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingAppointments}</div>
                  <p className="text-xs text-muted-foreground">
                    awaiting confirmation
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    onClick={() => navigate('/agenda')}
                    className="h-20 flex flex-col items-center justify-center gap-2"
                    variant="outline"
                  >
                    <Calendar className="h-6 w-6" />
                    <span>View Agenda</span>
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/patients')}
                    className="h-20 flex flex-col items-center justify-center gap-2"
                    variant="outline"
                  >
                    <Users className="h-6 w-6" />
                    <span>Manage Patients</span>
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/appointments/create')}
                    className="h-20 flex flex-col items-center justify-center gap-2"
                    variant="outline"
                  >
                    <Plus className="h-6 w-6" />
                    <span>Create Appointment</span>
                  </Button>
                  
                  <Button
                    onClick={() => setActiveTab('availability')}
                    className="h-20 flex flex-col items-center justify-center gap-2"
                    variant="outline"
                  >
                    <Clock className="h-6 w-6" />
                    <span>Set Availability</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <AvailabilitySettings dentistId={dentistId} />
        )}
      </main>
    </div>
  );
}