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
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Award
} from "lucide-react";
import { AIConversationDialog } from "@/components/AIConversationDialog";
import { generateSymptomSummary } from "@/lib/symptoms";
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

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  medical_history?: string;
  last_appointment?: string;
  total_appointments: number;
  upcoming_appointments: number;
}

interface Prescription {
  id: string;
  patient_id: string;
  dentist_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  prescribed_date: string;
  expiry_date?: string;
  status: 'active' | 'completed' | 'discontinued';
  created_at: string;
  updated_at: string;
}

interface TreatmentPlan {
  id: string;
  patient_id: string;
  dentist_id: string;
  plan_name: string;
  description?: string;
  diagnosis?: string;
  treatment_goals: string[];
  procedures: string[];
  estimated_cost?: number;
  estimated_duration?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  start_date: string;
  target_completion_date?: string;
  actual_completion_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface MedicalRecord {
  id: string;
  patient_id: string;
  dentist_id: string;
  record_type: 'examination' | 'xray' | 'lab_result' | 'consultation' | 'surgery' | 'other';
  title: string;
  description?: string;
  file_url?: string;
  record_date: string;
  created_at: string;
  updated_at: string;
}

interface PatientNote {
  id: string;
  patient_id: string;
  dentist_id: string;
  note_type: 'general' | 'clinical' | 'billing' | 'follow_up' | 'emergency';
  title: string;
  content: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

interface DentistProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialty?: string;
  clinic_address?: string;
  languages?: string[];
  bio?: string;
  experience_years?: number;
  education?: string;
  certifications?: string[];
  created_at: string;
  updated_at: string;
}

interface PatientManagementProps {
  dentistId: string;
}

export function EnhancedPatientManagement({ dentistId }: PatientManagementProps) {
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
  const [dentistProfile, setDentistProfile] = useState<DentistProfile | null>(null);
  
  // Form states
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [showTreatmentPlanDialog, setShowTreatmentPlanDialog] = useState(false);
  const [showMedicalRecordDialog, setShowMedicalRecordDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
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

      // For now, we'll use mock data for the new features since the tables might not exist yet
      setPrescriptions([
        {
          id: '1',
          patient_id: patientId,
          dentist_id: dentistId,
          medication_name: 'Amoxicillin',
          dosage: '500mg',
          frequency: 'Twice daily',
          duration: '7 days',
          instructions: 'Take with food',
          prescribed_date: new Date().toISOString(),
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

      setTreatmentPlans([
        {
          id: '1',
          patient_id: patientId,
          dentist_id: dentistId,
          plan_name: 'Root Canal Treatment',
          description: 'Comprehensive root canal treatment for tooth #14',
          diagnosis: 'Pulpitis',
          treatment_goals: ['Relieve pain', 'Save the tooth', 'Prevent infection'],
          procedures: ['Root canal', 'Crown placement'],
          estimated_cost: 1200,
          estimated_duration: '2-3 weeks',
          priority: 'high',
          status: 'active',
          start_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

      setMedicalRecords([
        {
          id: '1',
          patient_id: patientId,
          dentist_id: dentistId,
          record_type: 'xray',
          title: 'Panoramic X-Ray',
          description: 'Full mouth panoramic X-ray',
          record_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

      setPatientNotes([
        {
          id: '1',
          patient_id: patientId,
          dentist_id: dentistId,
          note_type: 'clinical',
          title: 'Initial Consultation',
          content: 'Patient reports sensitivity to cold and hot foods. Recommended root canal treatment.',
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

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
              <span>Enhanced Patient Management</span>
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="treatment-plans">Treatment Plans</TabsTrigger>
          <TabsTrigger value="medical-records">Medical Records</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="profile">Dentist Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AIConversationDialog
                  patientId={selectedPatient.id}
                  dentistId={dentistId}
                  patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
                  contextType="patient"
                  onUpdate={() => fetchPatientData(selectedPatient.id)}
                />
                
                <Button variant="outline" className="h-full flex flex-col items-center justify-center space-y-2">
                  <Phone className="h-5 w-5" />
                  <span>Call Patient</span>
                </Button>
                
                <Button variant="outline" className="h-full flex flex-col items-center justify-center space-y-2">
                  <Mail className="h-5 w-5" />
                  <span>Send Email</span>
                </Button>
                
                <Button variant="outline" className="h-full flex flex-col items-center justify-center space-y-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Payment Request</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Pill className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">{prescriptions.filter(p => p.status === 'active').length}</div>
                    <div className="text-sm text-muted-foreground">Active Prescriptions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <ClipboardList className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">{treatmentPlans.filter(tp => tp.status === 'active').length}</div>
                    <div className="text-sm text-muted-foreground">Active Treatment Plans</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold">{appointments.filter(a => new Date(a.appointment_date) > new Date() && a.status !== 'cancelled').length}</div>
                    <div className="text-sm text-muted-foreground">Upcoming Appointments</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileImage className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold">{medicalRecords.length}</div>
                    <div className="text-sm text-muted-foreground">Medical Records</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Prescriptions</h2>
            <Button onClick={() => setShowPrescriptionDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Prescription
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prescriptions.map((prescription) => (
              <Card key={prescription.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Pill className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{prescription.medication_name}</CardTitle>
                    </div>
                    <Badge variant={
                      prescription.status === 'active' ? 'default' :
                      prescription.status === 'completed' ? 'secondary' : 'destructive'
                    }>
                      {prescription.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm font-medium">Dosage</div>
                    <div className="text-sm text-muted-foreground">{prescription.dosage}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Frequency</div>
                    <div className="text-sm text-muted-foreground">{prescription.frequency}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Duration</div>
                    <div className="text-sm text-muted-foreground">{prescription.duration}</div>
                  </div>
                  {prescription.instructions && (
                    <div>
                      <div className="text-sm font-medium">Instructions</div>
                      <div className="text-sm text-muted-foreground">{prescription.instructions}</div>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Prescribed: {new Date(prescription.prescribed_date).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {prescriptions.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No prescriptions found for this patient.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="treatment-plans" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Treatment Plans</h2>
            <Button onClick={() => setShowTreatmentPlanDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Treatment Plan
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {treatmentPlans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{plan.plan_name}</CardTitle>
                    </div>
                    <Badge variant={
                      plan.priority === 'urgent' ? 'destructive' :
                      plan.priority === 'high' ? 'default' : 'secondary'
                    }>
                      {plan.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {plan.description && (
                    <div>
                      <div className="text-sm font-medium">Description</div>
                      <div className="text-sm text-muted-foreground">{plan.description}</div>
                    </div>
                  )}
                  {plan.diagnosis && (
                    <div>
                      <div className="text-sm font-medium">Diagnosis</div>
                      <div className="text-sm text-muted-foreground">{plan.diagnosis}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium">Procedures</div>
                    <div className="text-sm text-muted-foreground">{plan.procedures.length} procedures</div>
                  </div>
                  {plan.estimated_cost && (
                    <div>
                      <div className="text-sm font-medium">Estimated Cost</div>
                      <div className="text-sm text-muted-foreground">€{plan.estimated_cost}</div>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(plan.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {treatmentPlans.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No treatment plans found for this patient.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="medical-records" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Medical Records</h2>
            <Button onClick={() => setShowMedicalRecordDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Medical Record
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {medicalRecords.map((record) => (
              <Card key={record.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{record.record_type}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(record.record_date).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-medium mb-1">{record.title}</h4>
                  {record.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {record.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {medicalRecords.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileImage className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No medical records found for this patient.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Patient Notes</h2>
            <Button onClick={() => setShowNoteDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
          
          <div className="space-y-4">
            {patientNotes.map((note) => (
              <Card key={note.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{note.note_type}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-medium mb-1">{note.title}</h4>
                  <p className="text-sm text-muted-foreground">{note.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {patientNotes.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notes found for this patient.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Dentist Profile</h2>
            <Button onClick={() => setShowProfileDialog(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
          
          {dentistProfile && (
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">
                      {dentistProfile.first_name} {dentistProfile.last_name}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{dentistProfile.email}</span>
                      </div>
                      {dentistProfile.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{dentistProfile.phone}</span>
                        </div>
                      )}
                      {dentistProfile.specialty && (
                        <div className="flex items-center space-x-2">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span>{dentistProfile.specialty}</span>
                        </div>
                      )}
                      {dentistProfile.clinic_address && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{dentistProfile.clinic_address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    {dentistProfile.bio && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Bio</h4>
                        <p className="text-sm text-muted-foreground">{dentistProfile.bio}</p>
                      </div>
                    )}
                    {dentistProfile.experience_years && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Experience</h4>
                        <p className="text-sm text-muted-foreground">{dentistProfile.experience_years} years</p>
                      </div>
                    )}
                    {dentistProfile.education && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Education</h4>
                        <p className="text-sm text-muted-foreground">{dentistProfile.education}</p>
                      </div>
                    )}
                    {dentistProfile.languages && dentistProfile.languages.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Languages</h4>
                        <div className="flex flex-wrap gap-1">
                          {dentistProfile.languages.map((language, index) => (
                            <Badge key={index} variant="outline">{language}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}