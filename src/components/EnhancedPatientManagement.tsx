import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  User, 
  Calendar, 
  ArrowLeft,
  Clock,
  Users,
  CreditCard,
  MessageSquare,
  FileText,
  Stethoscope,
  Pill,
  ClipboardList,
  FileImage,
  Edit,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Award,
  Clock as ClockIcon,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
  RefreshCw
} from "lucide-react";
import { AIConversationDialog } from "@/components/AIConversationDialog";
import { generateSymptomSummary } from "@/lib/symptoms";
import { EnhancedPatientOverview } from "@/components/enhanced/EnhancedPatientOverview";
import { PrescriptionsTab } from "@/components/enhanced/PrescriptionsTab";
import { TreatmentPlansTab } from "@/components/enhanced/TreatmentPlansTab";
import { MedicalRecordsTab } from "@/components/enhanced/MedicalRecordsTab";
import { PatientNotesTab } from "@/components/enhanced/PatientNotesTab";
import { AppointmentsTab } from "@/components/enhanced/AppointmentsTab";
import { DentistProfileTab } from "@/components/enhanced/DentistProfileTab";
import { 
  Patient, 
  Prescription, 
  TreatmentPlan, 
  MedicalRecord, 
  PatientNote, 
  AppointmentFollowUp,
  NewPrescriptionForm,
  NewTreatmentPlanForm,
  NewMedicalRecordForm,
  NewPatientNoteForm,
  NewFollowUpForm,
  DentistProfile
} from "@/types/dental";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface EnhancedPatientManagementProps {
  dentistId: string;
  user?: User | null;
}

export function EnhancedPatientManagement({ dentistId, user }: EnhancedPatientManagementProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'profile'>('list');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [appointmentSummary, setAppointmentSummary] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [generatingAISummary, setGeneratingAISummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // New state for enhanced features
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
  const [followUps, setFollowUps] = useState<AppointmentFollowUp[]>([]);
  const [dentistProfile, setDentistProfile] = useState<DentistProfile | null>(null);
  
  // Form states
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [showTreatmentPlanDialog, setShowTreatmentPlanDialog] = useState(false);
  const [showMedicalRecordDialog, setShowMedicalRecordDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchPatients();
    fetchDentistProfile();
  }, [dentistId]);

  // Clear error when component unmounts or dentistId changes
  useEffect(() => {
    setError(null);
    setRetryCount(0);
  }, [dentistId]);

  useEffect(() => {
    filterPatients();
  }, [searchTerm, patients]);

  const fetchDentistProfile = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (error) throw error;

      const { data: dentist, error: dentistError } = await supabase
        .from('dentists')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (dentistError) throw dentistError;

      setDentistProfile({ ...profile, ...dentist });
    } catch (error) {
      console.error('Error fetching dentist profile:', error);
    }
  };

  const fetchPatients = async (retryAttempt = 0) => {
    try {
      setLoading(true);
      setError(null);
      setIsRetrying(retryAttempt > 0);
      
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('dentist_id', dentistId);

      if (appointmentsError) throw appointmentsError;

      if (!appointmentsData || appointmentsData.length === 0) {
        setPatients([]);
        setFilteredPatients([]);
        setRetryCount(0);
        return;
      }

      const uniquePatientIds = [...new Set(appointmentsData.map(a => a.patient_id))];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          date_of_birth,
          medical_history
        `)
        .in('id', uniquePatientIds);

      if (profilesError) throw profilesError;

      if (!profilesData || profilesData.length === 0) {
        setPatients([]);
        setFilteredPatients([]);
        setRetryCount(0);
        return;
      }

      const patientsWithStats = await Promise.all(
        profilesData.map(async (profile) => {
          try {
            const { data: totalAppts, error: totalError } = await supabase
              .from('appointments')
              .select('id', { count: 'exact', head: true })
              .eq('patient_id', profile.id)
              .eq('dentist_id', dentistId);

            if (totalError) console.error('Error getting total appointments:', totalError);

            const { data: upcomingAppts, error: upcomingError } = await supabase
              .from('appointments')
              .select('id', { count: 'exact', head: true })
              .eq('patient_id', profile.id)
              .eq('dentist_id', dentistId)
              .gt('appointment_date', new Date().toISOString())
              .neq('status', 'cancelled');

            if (upcomingError) console.error('Error getting upcoming appointments:', upcomingError);

            const { data: lastAppt, error: lastError } = await supabase
              .from('appointments')
              .select('appointment_date')
              .eq('patient_id', profile.id)
              .eq('dentist_id', dentistId)
              .eq('status', 'completed')
              .order('appointment_date', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (lastError) console.error('Error getting last appointment:', lastError);

            return {
              ...profile,
              total_appointments: totalAppts?.length || 0,
              upcoming_appointments: upcomingAppts?.length || 0,
              last_appointment: lastAppt?.appointment_date || null
            };
          } catch (err) {
            console.error('Error processing patient stats for:', profile.id, err);
            return {
              ...profile,
              total_appointments: 0,
              upcoming_appointments: 0,
              last_appointment: null
            };
          }
        })
      );

      setPatients(patientsWithStats);
      setFilteredPatients(patientsWithStats);
      setRetryCount(0);
      
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      const errorMessage = error.message || 'Failed to load patients';
      setError(errorMessage);
      
      // Auto-retry logic for network errors
      if (retryAttempt < 3 && (error.message?.includes('network') || error.message?.includes('timeout'))) {
        setTimeout(() => {
          fetchPatients(retryAttempt + 1);
        }, 1000 * (retryAttempt + 1)); // Exponential backoff
        return;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setPatients([]);
      setFilteredPatients([]);
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  };

  const fetchPatientData = async (patientId: string, retryAttempt = 0) => {
    try {
      setError(null);
      
      // Fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id, 
          appointment_date, 
          status, 
          reason, 
          consultation_notes,
          urgency,
          patient_name
        `)
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('appointment_date', { ascending: false });

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
        // Don't throw, just log and continue with empty array
      }
      setAppointments(appointmentsData || []);

      // Fetch prescriptions
      const { data: prescriptionsData, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('prescribed_date', { ascending: false });

      if (prescriptionsError) {
        console.error('Error fetching prescriptions:', prescriptionsError);
      }
      setPrescriptions(prescriptionsData || []);

      // Fetch treatment plans
      const { data: treatmentPlansData, error: treatmentPlansError } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('created_at', { ascending: false });

      if (treatmentPlansError) {
        console.error('Error fetching treatment plans:', treatmentPlansError);
      }
      setTreatmentPlans(treatmentPlansData || []);

      // Fetch medical records
      const { data: medicalRecordsData, error: medicalRecordsError } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('record_date', { ascending: false });

      if (medicalRecordsError) {
        console.error('Error fetching medical records:', medicalRecordsError);
      }
      setMedicalRecords(medicalRecordsData || []);

      // Fetch patient notes
      const { data: patientNotesData, error: patientNotesError } = await supabase
        .from('patient_notes')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('created_at', { ascending: false });

      if (patientNotesError) {
        console.error('Error fetching patient notes:', patientNotesError);
      }
      setPatientNotes(patientNotesData || []);

      // Fetch follow-ups
      const { data: followUpsData, error: followUpsError } = await supabase
        .from('appointment_follow_ups')
        .select('*')
        .in('appointment_id', appointmentsData?.map(a => a.id) || [])
        .order('scheduled_date', { ascending: false });

      if (followUpsError) {
        console.error('Error fetching follow-ups:', followUpsError);
      }
      setFollowUps(followUpsData || []);

    } catch (error: any) {
      console.error('Error fetching patient data:', error);
      const errorMessage = error.message || 'Failed to load patient data';
      setError(errorMessage);
      
      // Auto-retry logic for network errors
      if (retryAttempt < 2 && (error.message?.includes('network') || error.message?.includes('timeout'))) {
        setTimeout(() => {
          fetchPatientData(patientId, retryAttempt + 1);
        }, 1000 * (retryAttempt + 1));
        return;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const filterPatients = () => {
    if (!searchTerm.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const filtered = patients.filter(patient =>
      `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPatients(filtered);
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveView('profile');
    fetchPatientData(patient.id);
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
    setActiveView('list');
    setAppointments([]);
    setPrescriptions([]);
    setTreatmentPlans([]);
    setMedicalRecords([]);
    setPatientNotes([]);
    setFollowUps([]);
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dental-primary mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-semibold">
              {isRetrying ? `Retrying... (${retryCount + 1}/3)` : 'Loading patients...'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isRetrying ? 'Please wait while we reconnect to the server' : 'Fetching patient data from the database'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeView === 'list') {
    return (
      <div className="space-y-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-primary" />
              <span>Patient Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-800">Error Loading Patients</h4>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchPatients()}
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            )}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search patients by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="glass-card border-blue-200 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-6 w-6 text-blue-600 mr-2" />
                    <div className="text-2xl font-bold text-blue-600">{patients.length}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">Total Patients</div>
                </CardContent>
              </Card>
              <Card className="glass-card border-green-200 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="h-6 w-6 text-green-600 mr-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {patients.reduce((sum, p) => sum + p.upcoming_appointments, 0)}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">Upcoming Appointments</div>
                </CardContent>
              </Card>
              <Card className="glass-card border-purple-200 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-6 w-6 text-purple-600 mr-2" />
                    <div className="text-2xl font-bold text-purple-600">
                      {patients.reduce((sum, p) => sum + p.total_appointments, 0)}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">Total Appointments</div>
                </CardContent>
              </Card>
              <Card className="glass-card border-orange-200 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="h-6 w-6 text-orange-600 mr-2" />
                    <div className="text-2xl font-bold text-orange-600">
                      {patients.filter(p => p.total_appointments > 0).length}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">Active Patients</div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              {filteredPatients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No patients found matching your search." : "No patients found."}
                </div>
              ) : (
                filteredPatients.map((patient) => (
                  <Card 
                    key={patient.id} 
                    className="glass-card hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-l-transparent hover:border-l-dental-primary"
                    onClick={() => handlePatientSelect(patient)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                              {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                            </div>
                            {patient.upcoming_appointments > 0 && (
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">{patient.upcoming_appointments}</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-semibold text-lg">
                              {patient.first_name} {patient.last_name}
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <span>{patient.email}</span>
                            </div>
                            {patient.phone && (
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span>{patient.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right space-y-2">
                            <div className="flex items-center justify-end space-x-2">
                              {patient.upcoming_appointments > 0 && (
                                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {patient.upcoming_appointments} upcoming
                                </Badge>
                              )}
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                <Clock className="h-3 w-3 mr-1" />
                                {patient.total_appointments} total
                              </Badge>
                            </div>
                            {patient.last_appointment && (
                              <div className="text-xs text-muted-foreground flex items-center justify-end">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                Last: {new Date(patient.last_appointment).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 hover:from-blue-600 hover:to-purple-700"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedPatient) {
    return <div>No patient selected</div>;
  }

  return (
    <div className="space-y-6">
      {/* Patient Header */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBackToList}
                className="border-dental-primary text-dental-primary hover:bg-dental-primary hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Patients
              </Button>
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {selectedPatient.first_name.charAt(0)}{selectedPatient.last_name.charAt(0)}
                </div>
                {selectedPatient.upcoming_appointments > 0 && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{selectedPatient.upcoming_appointments}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold gradient-text">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </h2>
                <div className="flex items-center space-x-4 text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{selectedPatient.email}</span>
                  </div>
                  {selectedPatient.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>{selectedPatient.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {selectedPatient.upcoming_appointments > 0 && (
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  <Calendar className="h-4 w-4 mr-2" />
                  {selectedPatient.upcoming_appointments} upcoming
                </Badge>
              )}
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Clock className="h-4 w-4 mr-2" />
                {selectedPatient.total_appointments} total appointments
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Patient Management Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7 bg-white/50 backdrop-blur-sm border border-white/20">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
            <User className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
            <Pill className="h-4 w-4 mr-2" />
            Prescriptions
          </TabsTrigger>
          <TabsTrigger value="treatment-plans" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white">
            <Stethoscope className="h-4 w-4 mr-2" />
            Treatment Plans
          </TabsTrigger>
          <TabsTrigger value="medical-records" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white">
            <FileText className="h-4 w-4 mr-2" />
            Medical Records
          </TabsTrigger>
          <TabsTrigger value="notes" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            <ClipboardList className="h-4 w-4 mr-2" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="appointments" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
            <Calendar className="h-4 w-4 mr-2" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white">
            <GraduationCap className="h-4 w-4 mr-2" />
            Dentist Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <EnhancedPatientOverview 
            patient={selectedPatient}
            prescriptions={prescriptions}
            treatmentPlans={treatmentPlans}
            medicalRecords={medicalRecords}
            patientNotes={patientNotes}
            appointments={appointments}
            dentistId={dentistId}
            onRefresh={() => fetchPatientData(selectedPatient.id)}
          />
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-6">
          <PrescriptionsTab 
            prescriptions={prescriptions}
            patient={selectedPatient}
            dentistId={dentistId}
            onRefresh={() => fetchPatientData(selectedPatient.id)}
          />
        </TabsContent>

        <TabsContent value="treatment-plans" className="space-y-6">
          <TreatmentPlansTab 
            treatmentPlans={treatmentPlans}
            patient={selectedPatient}
            dentistId={dentistId}
            onRefresh={() => fetchPatientData(selectedPatient.id)}
          />
        </TabsContent>

        <TabsContent value="medical-records" className="space-y-6">
          <MedicalRecordsTab 
            medicalRecords={medicalRecords}
            patient={selectedPatient}
            dentistId={dentistId}
            onRefresh={() => fetchPatientData(selectedPatient.id)}
          />
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <PatientNotesTab 
            patientNotes={patientNotes}
            patient={selectedPatient}
            dentistId={dentistId}
            onRefresh={() => fetchPatientData(selectedPatient.id)}
          />
        </TabsContent>

        <TabsContent value="appointments" className="space-y-6">
          <AppointmentsTab 
            appointments={appointments}
            followUps={followUps}
            patient={selectedPatient}
            dentistId={dentistId}
            onRefresh={() => fetchPatientData(selectedPatient.id)}
          />
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <DentistProfileTab 
            dentistProfile={dentistProfile}
            onRefresh={fetchDentistProfile}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}