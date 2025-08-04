import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Users, 
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Activity,
  User as UserIcon,
  Settings as SettingsIcon,
  Bell,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DentistDashboardProps {
  user: User;
}

interface DentistStats {
  todayAppointments: number;
  totalPatients: number;
  monthlyRevenue: number;
  averageRating: number;
  pendingAppointments: number;
  completedToday: number;
}

export const DentistDashboard = ({ user }: DentistDashboardProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dentistProfile, setDentistProfile] = useState<any>(null);
  const [stats, setStats] = useState<DentistStats>({
    todayAppointments: 0,
    totalPatients: 0,
    monthlyRevenue: 0,
    averageRating: 0,
    pendingAppointments: 0,
    completedToday: 0
  });

  useEffect(() => {
    fetchDentistProfile();
  }, [user.id]);

  const fetchDentistProfile = async () => {
    try {
      setLoading(true);
      
      // Get dentist profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const { data: dentistData, error: dentistError } = await supabase
        .from('dentists')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (dentistError) {
        console.error('Dentist data error:', dentistError);
        // If no dentist record found, create one
        if (dentistError.code === 'PGRST116') {
          const { data: newDentist } = await supabase
            .from('dentists')
            .insert({ profile_id: profile.id, is_active: true })
            .select()
            .single();
          setDentistProfile({ ...profile, dentist: newDentist });
        }
      } else {
        setDentistProfile({ ...profile, dentist: dentistData });
      }

      // Fetch stats
      await fetchStats(dentistData.id);
      
    } catch (error) {
      console.error('Error fetching dentist profile:', error);
      toast({
        title: "Error",
        description: "Failed to load dentist profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (dentistId: string) => {
    try {
      // Get today's appointments
      const today = new Date().toISOString().split('T')[0];
      
      const { data: todayAppts } = await supabase
        .from('appointments')
        .select('*')
        .eq('dentist_id', dentistId)
        .gte('appointment_date', today)
        .lt('appointment_date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());

      // Get total unique patients
      const { data: appointments } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('dentist_id', dentistId);

      const uniquePatients = new Set(appointments?.map(a => a.patient_id) || []).size;

      // Get pending appointments
      const { data: pendingAppts } = await supabase
        .from('appointments')
        .select('*')
        .eq('dentist_id', dentistId)
        .eq('status', 'pending');

      // Get completed today
      const { data: completedToday } = await supabase
        .from('appointments')
        .select('*')
        .eq('dentist_id', dentistId)
        .eq('status', 'completed')
        .gte('appointment_date', today);

      setStats({
        todayAppointments: todayAppts?.length || 0,
        totalPatients: uniquePatients,
        monthlyRevenue: 15750, // Mock data for now
        averageRating: dentistProfile?.dentist?.average_rating || 4.8,
        pendingAppointments: pendingAppts?.length || 0,
        completedToday: completedToday?.length || 0
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span>Loading dentist dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {getWelcomeMessage()}, Dr. {dentistProfile?.first_name || 'Doctor'}!
                </h1>
                <p className="text-gray-600 text-lg">Your dental practice dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
              <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Today's Appointments</p>
                  <p className="text-3xl font-bold">{stats.todayAppointments}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Patients</p>
                  <p className="text-3xl font-bold">{stats.totalPatients}</p>
                </div>
                <Users className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Monthly Revenue</p>
                  <p className="text-3xl font-bold">${stats.monthlyRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Average Rating</p>
                  <p className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200 bg-gray-50">
              <TabsList className="grid w-full grid-cols-6 h-16 bg-transparent border-0">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 rounded-none h-full">
                  <Activity className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="appointments" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 rounded-none h-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Appointments
                </TabsTrigger>
                <TabsTrigger value="patients" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 rounded-none h-full">
                  <Users className="h-4 w-4 mr-2" />
                  Patients
                </TabsTrigger>
                <TabsTrigger value="schedule" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 rounded-none h-full">
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule
                </TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 rounded-none h-full">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 rounded-none h-full">
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="p-6">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Practice Overview</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                        Pending Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Pending Appointments</span>
                          <Badge variant="outline">{stats.pendingAppointments}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Completed Today</span>
                          <Badge variant="outline">{stats.completedToday}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Button className="w-full" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Patient
                        </Button>
                        <Button className="w-full" variant="outline">
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Appointment
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="appointments" className="p-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">Today's Appointments</h3>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Appointment
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-gray-600 text-center py-8">No appointments scheduled for today</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="patients" className="p-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">Patient Directory</h3>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Patient
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-gray-600 text-center py-8">No patients found</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="p-6">
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Schedule Management</h3>
                <p className="text-gray-600">Schedule management features will be implemented here.</p>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="p-6">
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics & Reports</h3>
                <p className="text-gray-600">Analytics and reporting features will be implemented here.</p>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="p-6">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Practice Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">Manage your professional profile</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Practice Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">Set your availability schedule</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};