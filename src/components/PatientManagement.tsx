import { useState, useEffect, useCallback } from "react";
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
  RefreshCw,
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
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
import { Appointment } from "@/types/common";

interface PatientManagementProps {
  dentistId: string;
}

interface PatientStats {
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  activePrescriptions: number;
  activeTreatmentPlans: number;
  totalNotes: number;
  lastVisit: string | null;
}

export function PatientManagement({ dentistId }: PatientManagementProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'profile'>('list');
  const [patientStats, setPatientStats] = useState<PatientStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'lastVisit' | 'appointments'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false);
  const [showAddAppointmentDialog, setShowAddAppointmentDialog] = useState(false);
  const [showAddPrescriptionDialog, setShowAddPrescriptionDialog] = useState(false);
  const [showAddTreatmentPlanDialog, setShowAddTreatmentPlanDialog] = useState(false);
  const [showAddMedicalRecordDialog, setShowAddMedicalRecordDialog] = useState(false);
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const { toast } = useToast();

  // Form states for dialogs
  const [addPatientForm, setAddPatientForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    medical_history: "",
    address: ""
  });

  const [addPrescriptionForm, setAddPrescriptionForm] = useState({
    medication_name: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: ""
  });

  const [addTreatmentPlanForm, setAddTreatmentPlanForm] = useState({
    title: "",
    description: "",
    diagnosis: "",
    priority: "normal" as const,
    estimated_cost: "",
    estimated_duration: ""
  });

  const [addMedicalRecordForm, setAddMedicalRecordForm] = useState({
    record_type: "examination" as const,
    title: "",
    description: "",
    record_date: new Date().toISOString().split('T')[0]
  });

  const [addNoteForm, setAddNoteForm] = useState({
    note_type: "general" as const,
    title: "",
    content: "",
    is_private: false
  });

  const [addAppointmentForm, setAddAppointmentForm] = useState({
    appointment_date: "",
    reason: "",
    notes: ""
  });

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
  }, [dentistId]);

  // Filter patients when search term or sort options change
  useEffect(() => {
    filterAndSortPatients();
  }, [searchTerm, patients, sortBy, sortOrder, filterStatus]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      console.log('Fetching patients for dentist:', dentistId);
      
      // Get all unique patients who have appointments with this dentist
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('dentist_id', dentistId);

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
        throw appointmentsError;
      }

      if (!appointmentsData || appointmentsData.length === 0) {
        console.log('No appointments found for this dentist');
        setPatients([]);
        setFilteredPatients([]);
        setLoading(false);
        return;
      }

      // Get unique patient IDs
      const uniquePatientIds = [...new Set(appointmentsData.map(apt => apt.patient_id))];
      console.log('Unique patient IDs:', uniquePatientIds);

      // Fetch patient profiles
      const { data: patientsData, error: patientsError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', uniquePatientIds);

      if (patientsError) {
        console.error('Error fetching patients:', patientsError);
        throw patientsError;
      }

      console.log('Fetched patients:', patientsData);

      // Fetch appointment counts for each patient
      const patientsWithStats = await Promise.all(
        (patientsData || []).map(async (patient) => {
          const { count: totalAppointments } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', patient.id)
            .eq('dentist_id', dentistId);

          const { count: upcomingAppointments } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', patient.id)
            .eq('dentist_id', dentistId)
            .gte('appointment_date', new Date().toISOString())
            .eq('status', 'confirmed');

          const { data: lastAppointment } = await supabase
            .from('appointments')
            .select('appointment_date')
            .eq('patient_id', patient.id)
            .eq('dentist_id', dentistId)
            .lt('appointment_date', new Date().toISOString())
            .order('appointment_date', { ascending: false })
            .limit(1)
            .single();

          return {
            ...patient,
            total_appointments: totalAppointments || 0,
            upcoming_appointments: upcomingAppointments || 0,
            last_appointment: lastAppointment?.appointment_date || null
          };
        })
      );

      setPatients(patientsWithStats);
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchPatients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch patients. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const filterAndSortPatients = () => {
    let filtered = [...patients];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(patient =>
        `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone?.includes(searchTerm)
      );
    }

    // Apply status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter(patient => patient.upcoming_appointments > 0);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(patient => patient.upcoming_appointments === 0);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
          break;
        case 'lastVisit': {
          const aDate = a.last_appointment ? new Date(a.last_appointment).getTime() : 0;
          const bDate = b.last_appointment ? new Date(b.last_appointment).getTime() : 0;
          comparison = aDate - bDate;
          break;
        }
        case 'appointments':
          comparison = a.total_appointments - b.total_appointments;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredPatients(filtered);
  };

  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveView('profile');
    await fetchPatientData(patient.id);
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
    setActiveView('list');
    setPatientStats(null);
  };

  const fetchPatientData = async (patientId: string) => {
    try {
      // Fetch appointments
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(`
          *,
          dentists:dentist_id(first_name, last_name, specialization)
        `)
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('appointment_date', { ascending: false });

      setAppointments(appointmentsData || []);

      // Fetch prescriptions
      const { data: prescriptionsData } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('prescribed_date', { ascending: false });

      setPrescriptions(prescriptionsData || []);

      // Fetch treatment plans
      const { data: treatmentPlansData } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('created_at', { ascending: false });

      setTreatmentPlans(treatmentPlansData || []);

      // Fetch medical records
      const { data: medicalRecordsData } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('record_date', { ascending: false });

      setMedicalRecords(medicalRecordsData || []);

      // Fetch patient notes
      const { data: notesData } = await supabase
        .from('patient_notes')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('created_at', { ascending: false });

      setPatientNotes(notesData || []);

      // Calculate patient stats
      const stats: PatientStats = {
        totalAppointments: appointmentsData?.length || 0,
        upcomingAppointments: appointmentsData?.filter(apt => 
          new Date(apt.appointment_date) > new Date() && apt.status === 'confirmed'
        ).length || 0,
        completedAppointments: appointmentsData?.filter(apt => 
          apt.status === 'completed'
        ).length || 0,
        activePrescriptions: prescriptionsData?.filter(p => p.status === 'active').length || 0,
        activeTreatmentPlans: treatmentPlansData?.filter(tp => tp.status === 'active').length || 0,
        totalNotes: notesData?.length || 0,
        lastVisit: appointmentsData?.[0]?.appointment_date || null
      };

      setPatientStats(stats);
    } catch (error) {
      console.error('Error fetching patient data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch patient data. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Form handlers
  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: addPatientForm.email,
        password: "temporary123",
        options: {
          data: {
            first_name: addPatientForm.first_name,
            last_name: addPatientForm.last_name,
            role: "patient"
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            first_name: addPatientForm.first_name,
            last_name: addPatientForm.last_name,
            email: addPatientForm.email,
            phone: addPatientForm.phone,
            date_of_birth: addPatientForm.date_of_birth,
            medical_history: addPatientForm.medical_history,
            address: addPatientForm.address,
            role: "patient"
          });

        if (profileError) throw profileError;

        toast({
          title: "Success",
          description: "Patient added successfully",
        });
        setShowAddPatientDialog(false);
        fetchPatients();
      }
    } catch (error) {
      console.error('Error adding patient:', error);
      toast({
        title: "Error",
        description: "Failed to add patient. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      const { error } = await supabase
        .from('prescriptions')
        .insert({
          patient_id: selectedPatient.id,
          dentist_id: dentistId,
          medication_name: addPrescriptionForm.medication_name,
          dosage: addPrescriptionForm.dosage,
          frequency: addPrescriptionForm.frequency,
          duration_days: parseInt(addPrescriptionForm.duration),
          instructions: addPrescriptionForm.instructions,
          prescribed_date: new Date().toISOString(),
          status: "active"
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Prescription added successfully",
      });
      setShowAddPrescriptionDialog(false);
      fetchPatientData(selectedPatient.id);
    } catch (error) {
      console.error('Error adding prescription:', error);
      toast({
        title: "Error",
        description: "Failed to add prescription. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddTreatmentPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting treatment plan form');
    if (!selectedPatient) {
      console.log('No selected patient');
      return;
    }

    // Check authentication state
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Current user:', user);
    console.log('Auth error:', authError);

    try {
      const treatmentPlanData = {
        patient_id: selectedPatient.id,
        dentist_id: dentistId,
        title: addTreatmentPlanForm.title,
        description: addTreatmentPlanForm.description,
        diagnosis: addTreatmentPlanForm.diagnosis,
        priority: addTreatmentPlanForm.priority,
        estimated_cost: parseFloat(addTreatmentPlanForm.estimated_cost) || 0,
        estimated_duration: addTreatmentPlanForm.estimated_duration,
        start_date: new Date().toISOString(),
        status: "active"
      };
      
      console.log('Inserting treatment plan data:', treatmentPlanData);
      
      const { data, error } = await supabase
        .from('treatment_plans')
        .insert(treatmentPlanData)
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Treatment plan added successfully",
      });
      setShowAddTreatmentPlanDialog(false);
      fetchPatientData(selectedPatient.id);
    } catch (error) {
      console.error('Error adding treatment plan:', error);
      toast({
        title: "Error",
        description: "Failed to add treatment plan. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddMedicalRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting medical record form');
    if (!selectedPatient) {
      console.log('No selected patient');
      return;
    }

    // Check authentication state
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Current user:', user);
    console.log('Auth error:', authError);

    try {
      const medicalRecordData = {
        patient_id: selectedPatient.id,
        dentist_id: dentistId,
        record_type: addMedicalRecordForm.record_type,
        title: addMedicalRecordForm.title,
        description: addMedicalRecordForm.description,
        record_date: addMedicalRecordForm.record_date
      };
      
      console.log('Inserting medical record data:', medicalRecordData);
      
      const { data, error } = await supabase
        .from('medical_records')
        .insert(medicalRecordData)
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Medical record added successfully",
      });
      setShowAddMedicalRecordDialog(false);
      fetchPatientData(selectedPatient.id);
    } catch (error) {
      console.error('Error adding medical record:', error);
      toast({
        title: "Error",
        description: "Failed to add medical record. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting note form');
    if (!selectedPatient) {
      console.log('No selected patient');
      return;
    }

    // Check authentication state
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Current user:', user);
    console.log('Auth error:', authError);

    try {
      const noteData = {
        patient_id: selectedPatient.id,
        dentist_id: dentistId,
        note_type: addNoteForm.note_type,
        title: addNoteForm.title,
        content: addNoteForm.content,
        is_private: addNoteForm.is_private
      };
      
      console.log('Inserting note data:', noteData);
      
      const { data, error } = await supabase
        .from('patient_notes')
        .insert(noteData)
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Note added successfully",
      });
      setShowAddNoteDialog(false);
      fetchPatientData(selectedPatient.id);
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: selectedPatient.id,
          dentist_id: dentistId,
          appointment_date: addAppointmentForm.appointment_date,
          reason: addAppointmentForm.reason,
          notes: addAppointmentForm.notes,
          status: 'confirmed'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment added successfully",
      });
      setShowAddAppointmentDialog(false);
      fetchPatientData(selectedPatient.id);
    } catch (error) {
      console.error('Error adding appointment:', error);
      toast({
        title: "Error",
        description: "Failed to add appointment. Please try again.",
        variant: "destructive"
      });
    }
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
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading patients...</span>
        </div>
      </div>
    );
  }

  if (activeView === 'profile' && selectedPatient) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToList}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Patients</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {selectedPatient.first_name} {selectedPatient.last_name}
              </h1>
              <p className="text-gray-600">{selectedPatient.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button size="sm" onClick={() => setShowAddAppointmentDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>

        {/* Patient Stats */}
        {patientStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Appointments</p>
                    <p className="text-xl font-bold">{patientStats.totalAppointments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-green-600" />
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
                  <Pill className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Active Prescriptions</p>
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
        )}

        {/* Patient Details Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="treatment">Treatment Plans</TabsTrigger>
            <TabsTrigger value="records">Medical Records</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Patient Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Name</Label>
                      <p className="text-sm">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p className="text-sm">{selectedPatient.email}</p>
                    </div>
                    {selectedPatient.phone && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Phone</Label>
                        <p className="text-sm">{selectedPatient.phone}</p>
                      </div>
                    )}
                    {selectedPatient.date_of_birth && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Date of Birth</Label>
                        <p className="text-sm">{formatDate(selectedPatient.date_of_birth)}</p>
                      </div>
                    )}
                  </div>
                  {selectedPatient.medical_history && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Medical History</Label>
                      <p className="text-sm mt-1">{selectedPatient.medical_history}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appointments.slice(0, 3).map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <p className="text-sm font-medium">{formatDate(appointment.appointment_date)}</p>
                        <p className="text-xs text-gray-600">{appointment.reason}</p>
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Appointments</h3>
              <Button size="sm" onClick={() => setShowAddAppointmentDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
            </div>
            <div className="space-y-2">
              {appointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{formatDate(appointment.appointment_date)}</p>
                          <p className="text-sm text-gray-600">{appointment.reason}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="prescriptions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Prescriptions</h3>
              <Button size="sm" onClick={() => setShowAddPrescriptionDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Prescription
              </Button>
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
            </div>
          </TabsContent>

          <TabsContent value="treatment" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Treatment Plans</h3>
              <Button size="sm" onClick={() => {
                console.log('Opening treatment plan dialog');
                setShowAddTreatmentPlanDialog(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                New Treatment Plan
              </Button>
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
            </div>
          </TabsContent>

          <TabsContent value="records" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Medical Records</h3>
              <Button size="sm" onClick={() => {
                console.log('Opening medical record dialog');
                setShowAddMedicalRecordDialog(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
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
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-600">{formatDate(record.record_date)}</p>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Patient Notes</h3>
              <Button size="sm" onClick={() => {
                console.log('Opening note dialog');
                setShowAddNoteDialog(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
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
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-600">{formatDate(note.created_at)}</p>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patient Management</h1>
          <p className="text-gray-600">Manage your patients and their records</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm" onClick={() => setShowAddPatientDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={sortBy} onValueChange={(value: 'name' | 'lastVisit' | 'appointments') => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="lastVisit">Last Visit</SelectItem>
              <SelectItem value="appointments">Appointments</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
          <Select value={filterStatus} onValueChange={(value: 'all' | 'active' | 'inactive') => setFilterStatus(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Patient List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map((patient) => (
          <Card 
            key={patient.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handlePatientSelect(patient)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">
                    {patient.first_name} {patient.last_name}
                  </h3>
                  <p className="text-sm text-gray-600">{patient.email}</p>
                  {patient.phone && (
                    <p className="text-sm text-gray-500">{patient.phone}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{patient.total_appointments}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{patient.upcoming_appointments}</span>
                  </div>
                </div>
                {patient.last_appointment && (
                  <p className="text-xs text-gray-500">
                    Last: {formatDate(patient.last_appointment)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPatients.length === 0 && !loading && (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms.' : 'No patients have been added yet.'}
          </p>
        </div>
      )}

      {/* Add Patient Dialog */}
      <Dialog open={showAddPatientDialog} onOpenChange={setShowAddPatientDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPatient} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={addPatientForm.first_name}
                  onChange={(e) => setAddPatientForm({...addPatientForm, first_name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={addPatientForm.last_name}
                  onChange={(e) => setAddPatientForm({...addPatientForm, last_name: e.target.value})}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={addPatientForm.email}
                onChange={(e) => setAddPatientForm({...addPatientForm, email: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={addPatientForm.phone}
                onChange={(e) => setAddPatientForm({...addPatientForm, phone: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={addPatientForm.date_of_birth}
                onChange={(e) => setAddPatientForm({...addPatientForm, date_of_birth: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="medical_history">Medical History</Label>
              <Textarea
                id="medical_history"
                value={addPatientForm.medical_history}
                onChange={(e) => setAddPatientForm({...addPatientForm, medical_history: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={addPatientForm.address}
                onChange={(e) => setAddPatientForm({...addPatientForm, address: e.target.value})}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddPatientDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Patient
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Prescription Dialog */}
      <Dialog open={showAddPrescriptionDialog} onOpenChange={setShowAddPrescriptionDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Prescription</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPrescription} className="space-y-4">
            <div>
              <Label htmlFor="medication_name">Medication Name</Label>
              <Input
                id="medication_name"
                value={addPrescriptionForm.medication_name}
                onChange={(e) => setAddPrescriptionForm({...addPrescriptionForm, medication_name: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  value={addPrescriptionForm.dosage}
                  onChange={(e) => setAddPrescriptionForm({...addPrescriptionForm, dosage: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Input
                  id="frequency"
                  value={addPrescriptionForm.frequency}
                  onChange={(e) => setAddPrescriptionForm({...addPrescriptionForm, frequency: e.target.value})}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="duration">Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                value={addPrescriptionForm.duration}
                onChange={(e) => setAddPrescriptionForm({...addPrescriptionForm, duration: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={addPrescriptionForm.instructions}
                onChange={(e) => setAddPrescriptionForm({...addPrescriptionForm, instructions: e.target.value})}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddPrescriptionDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Prescription
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Treatment Plan Dialog */}
      <Dialog open={showAddTreatmentPlanDialog} onOpenChange={setShowAddTreatmentPlanDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Treatment Plan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTreatmentPlan} className="space-y-4">
            <div>
              <Label htmlFor="title">Plan Name</Label>
              <Input
                id="title"
                value={addTreatmentPlanForm.title}
                onChange={(e) => setAddTreatmentPlanForm({...addTreatmentPlanForm, title: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={addTreatmentPlanForm.description}
                onChange={(e) => setAddTreatmentPlanForm({...addTreatmentPlanForm, description: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Textarea
                id="diagnosis"
                value={addTreatmentPlanForm.diagnosis}
                onChange={(e) => setAddTreatmentPlanForm({...addTreatmentPlanForm, diagnosis: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={addTreatmentPlanForm.priority} onValueChange={(value: any) => setAddTreatmentPlanForm({...addTreatmentPlanForm, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estimated_cost">Estimated Cost</Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  value={addTreatmentPlanForm.estimated_cost}
                  onChange={(e) => setAddTreatmentPlanForm({...addTreatmentPlanForm, estimated_cost: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="estimated_duration">Estimated Duration (weeks)</Label>
              <Input
                id="estimated_duration"
                type="number"
                value={addTreatmentPlanForm.estimated_duration}
                onChange={(e) => setAddTreatmentPlanForm({...addTreatmentPlanForm, estimated_duration: e.target.value})}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddTreatmentPlanDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Treatment Plan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Medical Record Dialog */}
      <Dialog open={showAddMedicalRecordDialog} onOpenChange={setShowAddMedicalRecordDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Medical Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMedicalRecord} className="space-y-4">
            <div>
              <Label htmlFor="record_type">Record Type</Label>
              <Select value={addMedicalRecordForm.record_type} onValueChange={(value: any) => setAddMedicalRecordForm({...addMedicalRecordForm, record_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="examination">Examination</SelectItem>
                  <SelectItem value="xray">X-Ray</SelectItem>
                  <SelectItem value="lab_result">Lab Result</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={addMedicalRecordForm.title}
                onChange={(e) => setAddMedicalRecordForm({...addMedicalRecordForm, title: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={addMedicalRecordForm.description}
                onChange={(e) => setAddMedicalRecordForm({...addMedicalRecordForm, description: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="record_date">Record Date</Label>
              <Input
                id="record_date"
                type="date"
                value={addMedicalRecordForm.record_date}
                onChange={(e) => setAddMedicalRecordForm({...addMedicalRecordForm, record_date: e.target.value})}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddMedicalRecordDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Appointment Dialog */}
      <Dialog open={showAddAppointmentDialog} onOpenChange={setShowAddAppointmentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Appointment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAppointment} className="space-y-4">
            <div>
              <Label htmlFor="appointment_date">Appointment Date</Label>
              <Input
                id="appointment_date"
                type="datetime-local"
                value={addAppointmentForm.appointment_date}
                onChange={(e) => setAddAppointmentForm({...addAppointmentForm, appointment_date: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={addAppointmentForm.reason}
                onChange={(e) => setAddAppointmentForm({...addAppointmentForm, reason: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={addAppointmentForm.notes}
                onChange={(e) => setAddAppointmentForm({...addAppointmentForm, notes: e.target.value})}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddAppointmentDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Appointment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={showAddNoteDialog} onOpenChange={setShowAddNoteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Patient Note</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddNote} className="space-y-4">
            <div>
              <Label htmlFor="note_type">Note Type</Label>
              <Select value={addNoteForm.note_type} onValueChange={(value: any) => setAddNoteForm({...addNoteForm, note_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="clinical">Clinical</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="note_title">Title</Label>
              <Input
                id="note_title"
                value={addNoteForm.title}
                onChange={(e) => setAddNoteForm({...addNoteForm, title: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={addNoteForm.content}
                onChange={(e) => setAddNoteForm({...addNoteForm, content: e.target.value})}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_private"
                checked={addNoteForm.is_private}
                onChange={(e) => setAddNoteForm({...addNoteForm, is_private: e.target.checked})}
              />
              <Label htmlFor="is_private">Private Note</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddNoteDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Note
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}