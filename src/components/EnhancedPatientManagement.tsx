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
  Calendar as CalendarIcon
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
}

export function EnhancedPatientManagement({ dentistId }: EnhancedPatientManagementProps) {
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

  const fetchPatients = async () => {
    try {
      setLoading(true);
      
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('dentist_id', dentistId);

      if (appointmentsError) throw appointmentsError;

      if (!appointmentsData || appointmentsData.length === 0) {
        setPatients([]);
        setFilteredPatients([]);
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
      
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: `Failed to load patients: ${error.message}`,
        variant: "destructive",
      });
      setPatients([]);
      setFilteredPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientData = async (patientId: string) => {
    try {
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

      if (appointmentsError) throw appointmentsError;
      setAppointments(appointmentsData || []);

      // Fetch prescriptions
      const { data: prescriptionsData, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('prescribed_date', { ascending: false });

      if (prescriptionsError) throw prescriptionsError;
      setPrescriptions(prescriptionsData || []);

      // Fetch treatment plans
      const { data: treatmentPlansData, error: treatmentPlansError } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('created_at', { ascending: false });

      if (treatmentPlansError) throw treatmentPlansError;
      setTreatmentPlans(treatmentPlansData || []);

      // Fetch medical records
      const { data: medicalRecordsData, error: medicalRecordsError } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('record_date', { ascending: false });

      if (medicalRecordsError) throw medicalRecordsError;
      setMedicalRecords(medicalRecordsData || []);

      // Fetch patient notes
      const { data: patientNotesData, error: patientNotesError } = await supabase
        .from('patient_notes')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('created_at', { ascending: false });

      if (patientNotesError) throw patientNotesError;
      setPatientNotes(patientNotesData || []);

      // Fetch follow-ups
      const { data: followUpsData, error: followUpsError } = await supabase
        .from('appointment_follow_ups')
        .select('*')
        .in('appointment_id', appointmentsData?.map(a => a.id) || [])
        .order('scheduled_date', { ascending: false });

      if (followUpsError) throw followUpsError;
      setFollowUps(followUpsData || []);

    } catch (error) {
      console.error('Error fetching patient data:', error);
      toast({
        title: "Error",
        description: "Failed to load patient data",
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
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Loading patients...</div>
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
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search patients by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{patients.length}</div>
                  <div className="text-sm text-muted-foreground">Total Patients</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {patients.reduce((sum, p) => sum + p.upcoming_appointments, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Upcoming Appointments</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {patients.reduce((sum, p) => sum + p.total_appointments, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Appointments</div>
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
                  <Card key={patient.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div 
                        className="flex items-center justify-between"
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              {patient.first_name} {patient.last_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">{patient.email}</p>
                            {patient.phone && (
                              <p className="text-sm text-muted-foreground">{patient.phone}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            {patient.upcoming_appointments > 0 && (
                              <Badge variant="default" className="mb-1">
                                {patient.upcoming_appointments} upcoming
                              </Badge>
                            )}
                            <div className="text-sm text-muted-foreground">
                              {patient.total_appointments} total appointments
                            </div>
                            {patient.last_appointment && (
                              <div className="text-xs text-muted-foreground">
                                Last: {new Date(patient.last_appointment).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <Button variant="outline" size="sm">
                            View Patient
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
              <Button variant="outline" size="sm" onClick={handleBackToList}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Patients
              </Button>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </h2>
                <p className="text-muted-foreground">{selectedPatient.email}</p>
                {selectedPatient.phone && (
                  <p className="text-sm text-muted-foreground">{selectedPatient.phone}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {selectedPatient.upcoming_appointments > 0 && (
                <Badge variant="default">
                  <Clock className="h-3 w-3 mr-1" />
                  {selectedPatient.upcoming_appointments} upcoming
                </Badge>
              )}
              <Badge variant="outline">
                {selectedPatient.total_appointments} total appointments
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Patient Management Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="treatment-plans">Treatment Plans</TabsTrigger>
          <TabsTrigger value="medical-records">Medical Records</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="profile">Dentist Profile</TabsTrigger>
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