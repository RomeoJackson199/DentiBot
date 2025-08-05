import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { InteractiveDentalChat } from "@/components/chat/InteractiveDentalChat";
import { Settings } from "@/components/Settings";
import RealAppointmentsList from "@/components/RealAppointmentsList";
import { AppointmentDebug } from "@/components/AppointmentDebug";
import { SimpleAppointmentTest } from "@/components/SimpleAppointmentTest";
import { HealthData } from "@/components/HealthData";
import { PatientPaymentHistory } from "@/components/PatientPaymentHistory";
import { EmergencyTriageForm } from "@/components/EmergencyTriageForm";
import { PatientAnalytics } from "@/components/analytics/PatientAnalytics";
import { DatabaseTest } from "@/components/DatabaseTest";
import { NotificationButton } from "@/components/NotificationButton";
import { NotificationTest } from "@/components/NotificationTest";
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
  ClipboardList
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  type Tab = 'chat' | 'appointments' | 'prescriptions' | 'treatment' | 'records' | 'notes' | 'payments' | 'analytics' | 'emergency' | 'test';
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

      setRecentAppointments((appointmentsData || []).map(apt => ({
        ...apt,
        duration: apt.duration_minutes || 60,
        urgency_level: apt.urgency === 'emergency' ? 'urgent' : apt.urgency || 'normal',
        status: apt.status === 'pending' ? 'scheduled' : apt.status
      })));
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {getWelcomeMessage()}, {userProfile?.first_name || 'Patient'}!
          </h1>
          <p className="text-gray-600">Welcome to your dental health dashboard</p>
        </div>
        <div className="flex items-center space-x-2">
          <NotificationButton user={user} />
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Book Appointment
          </Button>
          <Settings user={user} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-xl font-bold">{patientStats.upcomingAppointments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-xl font-bold">{patientStats.completedAppointments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Pill className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Active Rx</p>
                <p className="text-xl font-bold">{patientStats.activePrescriptions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ClipboardList className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Treatment Plans</p>
                <p className="text-xl font-bold">{patientStats.activeTreatmentPlans}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value: Tab) => setActiveTab(value)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="treatment">Treatment</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <InteractiveDentalChat 
            user={user} 
            triggerBooking={triggerBooking}
          />
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <RealAppointmentsList user={user} />
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Your Prescriptions</h3>
          </div>
          <div className="space-y-2">
            {prescriptions.map((prescription) => (
              <Card key={prescription.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Pill className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">{prescription.medication_name}</p>
                        <p className="text-sm text-gray-600">
                          {prescription.dosage} - {prescription.frequency}
                        </p>
                        <p className="text-xs text-gray-500">
                          Prescribed: {formatDate(prescription.prescribed_date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={prescription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {prescription.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {prescriptions.length === 0 && (
              <div className="text-center py-8">
                <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions</h3>
                <p className="text-gray-600">You don't have any prescriptions yet.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="treatment" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Your Treatment Plans</h3>
          </div>
          <div className="space-y-2">
            {treatmentPlans.map((plan) => (
              <Card key={plan.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <ClipboardList className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium">{plan.title}</p>
                        <p className="text-sm text-gray-600">{plan.description}</p>
                        <p className="text-xs text-gray-500">
                          Started: {formatDate(plan.start_date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={plan.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {plan.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {treatmentPlans.length === 0 && (
              <div className="text-center py-8">
                <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No treatment plans</h3>
                <p className="text-gray-600">You don't have any treatment plans yet.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Your Medical Records</h3>
          </div>
          <div className="space-y-2">
            {medicalRecords.map((record) => (
              <Card key={record.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{record.title}</p>
                        <p className="text-sm text-gray-600">{record.record_type}</p>
                        <p className="text-xs text-gray-500">
                          Date: {formatDate(record.record_date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {medicalRecords.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No medical records</h3>
                <p className="text-gray-600">You don't have any medical records yet.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Your Notes</h3>
          </div>
          <div className="space-y-2">
            {patientNotes.map((note) => (
              <Card key={note.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">{note.title}</p>
                        <p className="text-sm text-gray-600">{note.note_type}</p>
                        <p className="text-xs text-gray-500">
                          Created: {formatDate(note.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {patientNotes.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notes</h3>
                <p className="text-gray-600">You don't have any notes yet.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {userProfile?.id && (
            <PatientPaymentHistory patientId={userProfile.id} />
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <PatientAnalytics userId={user.id} />
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4">
          <EmergencyTriageForm onCancel={() => setActiveTab('chat')} onComplete={handleEmergencyComplete} />
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <div className="space-y-6">
            <NotificationTest user={user} />
            <DatabaseTest />
            <SimpleAppointmentTest user={user} />
            <AppointmentDebug user={user} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};