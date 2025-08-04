import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { InteractiveDentalChat } from "@/components/chat/InteractiveDentalChat";
import { Settings } from "@/components/Settings";
import RealAppointmentsList from "@/components/RealAppointmentsList";
import { HealthData } from "@/components/HealthData";
import { EmergencyTriageForm } from "@/components/EmergencyTriageForm";
import { PatientAnalytics } from "@/components/analytics/PatientAnalytics";
import { DatabaseTest } from "@/components/DatabaseTest";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Calendar, 
  Activity, 
  AlertTriangle,
  Stethoscope,
  Clock,
  BarChart3,
  User as UserIcon,
  Shield,
  Heart,
  Bell,
  FileText,
  Pill,
  Target,
  TrendingUp,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Plus,
  Eye,
  FileImage,
  ClipboardList,
  Settings as SettingsIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Prescription, 
  TreatmentPlan, 
  MedicalRecord, 
  PatientNote 
} from "@/types/dental";
import { Appointment, UserProfile } from "@/types/common";

interface PatientDashboardProps {
  user: User;
}

interface PatientStats {
  upcomingAppointments: number;
  completedAppointments: number;
  lastVisit: string | null;
  totalNotes: number;
  activeTreatmentPlans: number;
  totalPrescriptions: number;
  activePrescriptions: number;
}

export const PatientDashboard = ({ user }: PatientDashboardProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  type Tab = 'chat' | 'appointments' | 'prescriptions' | 'treatment' | 'records' | 'notes' | 'analytics' | 'emergency' | 'test';
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    try {
      return (localStorage.getItem('pd_tab') as Tab) || 'chat';
    } catch {
      return 'chat';
    }
  });
  const [triggerBooking, setTriggerBooking] = useState<'low' | 'medium' | 'high' | 'emergency' | false>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [patientStats, setPatientStats] = useState<PatientStats>({
    upcomingAppointments: 0,
    completedAppointments: 0,
    lastVisit: null,
    totalNotes: 0,
    activeTreatmentPlans: 0,
    totalPrescriptions: 0,
    activePrescriptions: 0
  });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);

  const handleEmergencyComplete = (urgency: 'low' | 'medium' | 'high' | 'emergency') => {
    setActiveTab('chat');
    setTriggerBooking(urgency);
  };

  useEffect(() => {
    try {
      localStorage.setItem('pd_tab', activeTab);
      localStorage.setItem('session_token', user.id);
    } catch {
      // Handle localStorage errors silently
    }
  }, [activeTab, user.id]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setError('Failed to load user profile');
        return;
      }

      setUserProfile(profile);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientStats = async (profileId: string) => {
    try {
      // Fetch appointments
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', profileId);

      const upcomingAppointments = appointmentsData?.filter(apt => 
        new Date(apt.appointment_date) > new Date() && apt.status === 'confirmed'
      ).length || 0;

      const completedAppointments = appointmentsData?.filter(apt => 
        apt.status === 'completed'
      ).length || 0;

      const lastVisit = appointmentsData?.filter(apt => 
        apt.status === 'completed'
      ).sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())[0]?.appointment_date || null;

      // Fetch prescriptions
      const { data: prescriptionsData } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', profileId);

      const activePrescriptions = prescriptionsData?.filter(p => p.status === 'active').length || 0;

      // Fetch treatment plans
      const { data: treatmentPlansData } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', profileId);

      const activeTreatmentPlans = treatmentPlansData?.filter(tp => tp.status === 'active').length || 0;

      // Fetch patient notes
      const { data: notesData } = await supabase
        .from('patient_notes')
        .select('*')
        .eq('patient_id', profileId);

      setPatientStats({
        upcomingAppointments,
        completedAppointments,
        lastVisit,
        totalNotes: notesData?.length || 0,
        activeTreatmentPlans,
        totalPrescriptions: prescriptionsData?.length || 0,
        activePrescriptions
      });
    } catch (error) {
      console.error('Error fetching patient stats:', error);
    }
  };

  const fetchRecentAppointments = async (profileId: string) => {
    try {
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(`
          *,
          dentists:dentist_id(first_name, last_name, specialization)
        `)
        .eq('patient_id', profileId)
        .order('appointment_date', { ascending: false })
        .limit(5);

      setRecentAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Error fetching recent appointments:', error);
    }
  };

  const fetchPatientData = async (profileId: string) => {
    try {
      // Fetch prescriptions
      const { data: prescriptionsData } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', profileId)
        .order('prescribed_date', { ascending: false });

       setPrescriptions((prescriptionsData || []).map(prescription => ({
         ...prescription,
         duration: prescription.duration_days?.toString() || "7 days"
       })));

      // Fetch treatment plans
      const { data: treatmentPlansData } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', profileId)
        .order('created_at', { ascending: false });

       setTreatmentPlans((treatmentPlansData || []).map(plan => ({
         ...plan,
         title: plan.title || "Treatment Plan",
         estimated_duration: plan.estimated_duration_weeks ? `${plan.estimated_duration_weeks} weeks` : "2 weeks"
       })));

      // Fetch medical records
      const { data: medicalRecordsData } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', profileId)
        .order('record_date', { ascending: false });

       setMedicalRecords((medicalRecordsData || []).map(record => ({
         ...record,
         visit_date: record.record_date
       })));

      // Fetch patient notes
      const { data: notesData } = await supabase
        .from('patient_notes')
        .select('*')
        .eq('patient_id', profileId)
        .order('created_at', { ascending: false });

      setPatientNotes(notesData || []);
    } catch (error) {
      console.error('Error fetching patient data:', error);
    }
  };

  // Use useCallback to memoize functions to prevent infinite re-renders
  const fetchUserProfileCallback = useCallback(fetchUserProfile, [user.id]);
  const fetchPatientStatsCallback = useCallback(fetchPatientStats, []);
  const fetchRecentAppointmentsCallback = useCallback(fetchRecentAppointments, []);
  const fetchPatientDataCallback = useCallback(fetchPatientData, []);

  useEffect(() => {
    fetchUserProfileCallback();
  }, [fetchUserProfileCallback]);

  useEffect(() => {
    if (userProfile?.id) {
      fetchPatientStatsCallback(userProfile.id);
      fetchRecentAppointmentsCallback(userProfile.id);
      fetchPatientDataCallback(userProfile.id);
    }
  }, [userProfile?.id, fetchPatientStatsCallback, fetchRecentAppointmentsCallback, fetchPatientDataCallback]);

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchUserProfile}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {getWelcomeMessage()}, {userProfile?.first_name || 'Patient'}!
                </h1>
                <p className="text-gray-600 text-lg">Welcome to your dental health dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Settings</DialogTitle>
                  </DialogHeader>
                  <Settings user={user} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Upcoming</p>
                  <p className="text-3xl font-bold">{patientStats.upcomingAppointments}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold">{patientStats.completedAppointments}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Active Rx</p>
                  <p className="text-3xl font-bold">{patientStats.activePrescriptions}</p>
                </div>
                <Pill className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Treatment Plans</p>
                  <p className="text-3xl font-bold">{patientStats.activeTreatmentPlans}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Main Content Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value: Tab) => setActiveTab(value)} className="w-full">
            <div className="border-b border-gray-200 bg-gray-50">
              <TabsList className="grid w-full grid-cols-9 h-16 bg-transparent border-0">
                <TabsTrigger value="chat" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-none h-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="appointments" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-none h-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Appointments
                </TabsTrigger>
                <TabsTrigger value="prescriptions" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-none h-full">
                  <Pill className="h-4 w-4 mr-2" />
                  Prescriptions
                </TabsTrigger>
                <TabsTrigger value="treatment" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-none h-full">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Treatment
                </TabsTrigger>
                <TabsTrigger value="records" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-none h-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Records
                </TabsTrigger>
                <TabsTrigger value="notes" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-none h-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Notes
                </TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-none h-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="emergency" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-none h-full">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Emergency
                </TabsTrigger>
                <TabsTrigger value="test" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-none h-full">
                  <Activity className="h-4 w-4 mr-2" />
                  Test
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="chat" className="space-y-4">
                <InteractiveDentalChat 
                  user={user} 
                  triggerBooking={triggerBooking}
                  onEmergencyComplete={handleEmergencyComplete}
                />
              </TabsContent>

              <TabsContent value="appointments" className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Your Appointments</h3>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Book New Appointment
                  </Button>
                </div>
                <RealAppointmentsList user={user} />
              </TabsContent>

              <TabsContent value="prescriptions" className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Your Prescriptions</h3>
                </div>
                <div className="space-y-4">
                  {prescriptions.map((prescription) => (
                    <Card key={prescription.id} className="hover:shadow-md transition-shadow duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-purple-100 p-3 rounded-full">
                              <Pill className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg">{prescription.medication_name}</p>
                              <p className="text-gray-600">
                                {prescription.dosage} - {prescription.frequency}
                              </p>
                              <p className="text-sm text-gray-500">
                                Prescribed: {formatDate(prescription.prescribed_date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge className={prescription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {prescription.status}
                            </Badge>
                            <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {prescriptions.length === 0 && (
                    <div className="text-center py-12">
                      <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Pill className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions</h3>
                      <p className="text-gray-600">You don't have any prescriptions yet.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="treatment" className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Your Treatment Plans</h3>
                </div>
                <div className="space-y-4">
                  {treatmentPlans.map((plan) => (
                    <Card key={plan.id} className="hover:shadow-md transition-shadow duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-orange-100 p-3 rounded-full">
                              <ClipboardList className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg">{plan.title}</p>
                              <p className="text-gray-600">{plan.description}</p>
                              <p className="text-sm text-gray-500">
                                Started: {formatDate(plan.start_date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge className={plan.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {plan.status}
                            </Badge>
                            <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {treatmentPlans.length === 0 && (
                    <div className="text-center py-12">
                      <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <ClipboardList className="h-8 w-8 text-orange-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No treatment plans</h3>
                      <p className="text-gray-600">You don't have any treatment plans yet.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="records" className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Your Medical Records</h3>
                </div>
                <div className="space-y-4">
                  {medicalRecords.map((record) => (
                    <Card key={record.id} className="hover:shadow-md transition-shadow duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 p-3 rounded-full">
                              <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg">{record.title}</p>
                              <p className="text-gray-600">{record.record_type}</p>
                              <p className="text-sm text-gray-500">
                                Date: {formatDate(record.record_date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {medicalRecords.length === 0 && (
                    <div className="text-center py-12">
                      <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <FileText className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No medical records</h3>
                      <p className="text-gray-600">You don't have any medical records yet.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Your Notes</h3>
                </div>
                <div className="space-y-4">
                  {patientNotes.map((note) => (
                    <Card key={note.id} className="hover:shadow-md transition-shadow duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-green-100 p-3 rounded-full">
                              <FileText className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg">{note.title}</p>
                              <p className="text-gray-600">{note.note_type}</p>
                              <p className="text-sm text-gray-500">
                                Created: {formatDate(note.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {patientNotes.length === 0 && (
                    <div className="text-center py-12">
                      <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <FileText className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No notes</h3>
                      <p className="text-gray-600">You don't have any notes yet.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <PatientAnalytics user={user} />
              </TabsContent>

              <TabsContent value="emergency" className="space-y-4">
                <EmergencyTriageForm onComplete={handleEmergencyComplete} />
              </TabsContent>

              <TabsContent value="test" className="space-y-4">
                <DatabaseTest />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};