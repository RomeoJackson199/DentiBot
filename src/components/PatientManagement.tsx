import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Search, 
  User, 
  Calendar, 
  FileText, 
  Plus, 
  Pill,
  ClipboardList,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { format } from "date-fns";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  medical_history?: string;
  emergency_contact?: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  duration_minutes: number;
  status: string;
  urgency: string;
  reason?: string;
  consultation_notes?: string;
}

interface TreatmentPlan {
  id: string;
  title: string;
  description?: string;
  diagnosis?: string;
  status: string;
  priority: string;
  estimated_cost?: number;
  estimated_duration_weeks?: number;
  start_date?: string;
  end_date?: string;
  notes?: string;
  created_at: string;
}

interface Prescription {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days?: number;
  instructions?: string;
  status: string;
  prescribed_date: string;
  created_at: string;
}

interface PatientNote {
  id: string;
  title: string;
  content: string;
  note_type: string;
  is_private: boolean;
  created_at: string;
}

interface PatientManagementProps {
  dentistId: string;
}

export function PatientManagement({ dentistId }: PatientManagementProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [notes, setNotes] = useState<PatientNote[]>([]);
  
  // Dialog states
  const [showTreatmentDialog, setShowTreatmentDialog] = useState(false);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  
  // Form states
  const [treatmentForm, setTreatmentForm] = useState({
    title: "",
    description: "",
    diagnosis: "",
    priority: "medium",
    estimated_cost: "",
    estimated_duration_weeks: "",
  });
  
  const [prescriptionForm, setPrescriptionForm] = useState({
    medication_name: "",
    dosage: "",
    frequency: "",
    duration_days: "",
    instructions: "",
  });
  
  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    note_type: "general",
    is_private: false,
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchPatients();
  }, [dentistId]);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientData(selectedPatient.id);
    }
  }, [selectedPatient, dentistId]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      
      // Get patients who have appointments with this dentist
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          patient_id,
          profiles!inner(
            id,
            first_name,
            last_name,
            email,
            phone,
            date_of_birth,
            address,
            medical_history,
            emergency_contact
          )
        `)
        .eq('dentist_id', dentistId);

      if (appointmentError) throw appointmentError;

      // Extract unique patients
      const uniquePatients = appointmentData
        .map(apt => apt.profiles)
        .filter((patient, index, self) => 
          patient && self.findIndex(p => p?.id === patient.id) === index
        )
        .filter(Boolean) as Patient[];

      setPatients(uniquePatients);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch patients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientData = async (patientId: string) => {
    try {
      // Fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('appointment_date', { ascending: false });

      if (appointmentsError) throw appointmentsError;
      setAppointments(appointmentsData || []);

      // Fetch treatment plans
      const { data: treatmentData, error: treatmentError } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('created_at', { ascending: false });

      if (treatmentError) throw treatmentError;
      setTreatmentPlans(treatmentData || []);

      // Fetch prescriptions
      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('created_at', { ascending: false });

      if (prescriptionError) throw prescriptionError;
      setPrescriptions(prescriptionData || []);

      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from('patient_notes')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      setNotes(notesData || []);

    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch patient data",
        variant: "destructive",
      });
    }
  };

  const handleAddTreatmentPlan = async () => {
    if (!selectedPatient) return;

    try {
      const { error } = await supabase
        .from('treatment_plans')
        .insert({
          patient_id: selectedPatient.id,
          dentist_id: dentistId,
          title: treatmentForm.title,
          description: treatmentForm.description,
          diagnosis: treatmentForm.diagnosis,
          priority: treatmentForm.priority,
          estimated_cost: treatmentForm.estimated_cost ? Number(treatmentForm.estimated_cost) : null,
          estimated_duration_weeks: treatmentForm.estimated_duration_weeks ? Number(treatmentForm.estimated_duration_weeks) : null,
          status: 'draft'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Treatment plan added successfully",
      });

      setTreatmentForm({
        title: "",
        description: "",
        diagnosis: "",
        priority: "medium",
        estimated_cost: "",
        estimated_duration_weeks: "",
      });
      setShowTreatmentDialog(false);
      fetchPatientData(selectedPatient.id);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add treatment plan",
        variant: "destructive",
      });
    }
  };

  const handleAddPrescription = async () => {
    if (!selectedPatient) return;

    try {
      const { error } = await supabase
        .from('prescriptions')
        .insert({
          patient_id: selectedPatient.id,
          dentist_id: dentistId,
          medication_name: prescriptionForm.medication_name,
          dosage: prescriptionForm.dosage,
          frequency: prescriptionForm.frequency,
          duration_days: prescriptionForm.duration_days ? Number(prescriptionForm.duration_days) : null,
          instructions: prescriptionForm.instructions,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Prescription added successfully",
      });

      setPrescriptionForm({
        medication_name: "",
        dosage: "",
        frequency: "",
        duration_days: "",
        instructions: "",
      });
      setShowPrescriptionDialog(false);
      fetchPatientData(selectedPatient.id);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add prescription",
        variant: "destructive",
      });
    }
  };

  const handleAddNote = async () => {
    if (!selectedPatient) return;

    try {
      const { error } = await supabase
        .from('patient_notes')
        .insert({
          patient_id: selectedPatient.id,
          dentist_id: dentistId,
          title: noteForm.title,
          content: noteForm.content,
          note_type: noteForm.note_type,
          is_private: noteForm.is_private
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note added successfully",
      });

      setNoteForm({
        title: "",
        content: "",
        note_type: "general",
        is_private: false,
      });
      setShowNoteDialog(false);
      fetchPatientData(selectedPatient.id);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add note",
        variant: "destructive",
      });
    }
  };

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Patient List */}
      <Card className="glass-card lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-dental-primary" />
            <span>My Patients</span>
            <Badge variant="outline">{patients.length} total</Badge>
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedPatient?.id === patient.id ? 'bg-dental-primary/10 border-dental-primary' : ''
                }`}
                onClick={() => setSelectedPatient(patient)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-dental-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-dental-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {patient.email}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Patient Details */}
      <div className="lg:col-span-2 space-y-6">
        {selectedPatient ? (
          <>
            {/* Patient Info Card */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-6 w-6 text-dental-primary" />
                    <span>{selectedPatient.first_name} {selectedPatient.last_name}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Dialog open={showTreatmentDialog} onOpenChange={setShowTreatmentDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <ClipboardList className="h-4 w-4 mr-2" />
                          Add Treatment Plan
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Treatment Plan</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="title">Title *</Label>
                            <Input
                              id="title"
                              value={treatmentForm.title}
                              onChange={(e) => setTreatmentForm(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="e.g., Root Canal Treatment"
                            />
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={treatmentForm.description}
                              onChange={(e) => setTreatmentForm(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Treatment details..."
                            />
                          </div>
                          <div>
                            <Label htmlFor="diagnosis">Diagnosis</Label>
                            <Textarea
                              id="diagnosis"
                              value={treatmentForm.diagnosis}
                              onChange={(e) => setTreatmentForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                              placeholder="Clinical findings and diagnosis..."
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="priority">Priority</Label>
                              <Select
                                value={treatmentForm.priority}
                                onValueChange={(value) => setTreatmentForm(prev => ({ ...prev, priority: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="cost">Estimated Cost ($)</Label>
                              <Input
                                id="cost"
                                type="number"
                                value={treatmentForm.estimated_cost}
                                onChange={(e) => setTreatmentForm(prev => ({ ...prev, estimated_cost: e.target.value }))}
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="duration">Duration (weeks)</Label>
                            <Input
                              id="duration"
                              type="number"
                              value={treatmentForm.estimated_duration_weeks}
                              onChange={(e) => setTreatmentForm(prev => ({ ...prev, estimated_duration_weeks: e.target.value }))}
                              placeholder="e.g., 4"
                            />
                          </div>
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="outline" onClick={() => setShowTreatmentDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleAddTreatmentPlan} disabled={!treatmentForm.title}>
                              Add Treatment Plan
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={showPrescriptionDialog} onOpenChange={setShowPrescriptionDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Pill className="h-4 w-4 mr-2" />
                          Add Prescription
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Prescription</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="medication">Medication Name *</Label>
                            <Input
                              id="medication"
                              value={prescriptionForm.medication_name}
                              onChange={(e) => setPrescriptionForm(prev => ({ ...prev, medication_name: e.target.value }))}
                              placeholder="e.g., Amoxicillin"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="dosage">Dosage *</Label>
                              <Input
                                id="dosage"
                                value={prescriptionForm.dosage}
                                onChange={(e) => setPrescriptionForm(prev => ({ ...prev, dosage: e.target.value }))}
                                placeholder="e.g., 500mg"
                              />
                            </div>
                            <div>
                              <Label htmlFor="frequency">Frequency *</Label>
                              <Input
                                id="frequency"
                                value={prescriptionForm.frequency}
                                onChange={(e) => setPrescriptionForm(prev => ({ ...prev, frequency: e.target.value }))}
                                placeholder="e.g., 3 times daily"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="duration_days">Duration (days)</Label>
                            <Input
                              id="duration_days"
                              type="number"
                              value={prescriptionForm.duration_days}
                              onChange={(e) => setPrescriptionForm(prev => ({ ...prev, duration_days: e.target.value }))}
                              placeholder="e.g., 7"
                            />
                          </div>
                          <div>
                            <Label htmlFor="instructions">Instructions</Label>
                            <Textarea
                              id="instructions"
                              value={prescriptionForm.instructions}
                              onChange={(e) => setPrescriptionForm(prev => ({ ...prev, instructions: e.target.value }))}
                              placeholder="Take with food, avoid alcohol, etc..."
                            />
                          </div>
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="outline" onClick={() => setShowPrescriptionDialog(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleAddPrescription} 
                              disabled={!prescriptionForm.medication_name || !prescriptionForm.dosage || !prescriptionForm.frequency}
                            >
                              Add Prescription
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          Add Note
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Note</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="note_title">Title *</Label>
                            <Input
                              id="note_title"
                              value={noteForm.title}
                              onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="Note title..."
                            />
                          </div>
                          <div>
                            <Label htmlFor="note_content">Content *</Label>
                            <Textarea
                              id="note_content"
                              value={noteForm.content}
                              onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                              placeholder="Write your note here..."
                              className="min-h-[120px]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="note_type">Type</Label>
                              <Select
                                value={noteForm.note_type}
                                onValueChange={(value) => setNoteForm(prev => ({ ...prev, note_type: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="general">General</SelectItem>
                                  <SelectItem value="consultation">Consultation</SelectItem>
                                  <SelectItem value="follow_up">Follow-up</SelectItem>
                                  <SelectItem value="reminder">Reminder</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center space-x-2 pt-6">
                              <input
                                type="checkbox"
                                id="private"
                                checked={noteForm.is_private}
                                onChange={(e) => setNoteForm(prev => ({ ...prev, is_private: e.target.checked }))}
                                className="rounded border-muted-foreground"
                              />
                              <Label htmlFor="private" className="text-sm">Private note</Label>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleAddNote} 
                              disabled={!noteForm.title || !noteForm.content}
                            >
                              Add Note
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedPatient.email}</span>
                    </div>
                    {selectedPatient.phone && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedPatient.phone}</span>
                      </div>
                    )}
                    {selectedPatient.address && (
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedPatient.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {selectedPatient.date_of_birth && (
                      <div className="text-sm">
                        <span className="font-medium">Date of Birth:</span>
                        <p>{format(new Date(selectedPatient.date_of_birth), 'PPP')}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {selectedPatient.emergency_contact && (
                      <div className="text-sm">
                        <span className="font-medium">Emergency Contact:</span>
                        <p>{selectedPatient.emergency_contact}</p>
                      </div>
                    )}
                  </div>
                </div>
                {selectedPatient.medical_history && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium text-sm mb-2">Medical History</h4>
                    <p className="text-sm bg-muted p-3 rounded-md">{selectedPatient.medical_history}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Appointments */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-dental-primary" />
                  <span>Recent Appointments</span>
                  <Badge variant="outline">{appointments.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.length > 0 ? (
                  <div className="space-y-3">
                    {appointments.slice(0, 3).map((appointment) => (
                      <div key={appointment.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {format(new Date(appointment.appointment_date), 'PPP p')}
                            </p>
                            <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                            {appointment.consultation_notes && (
                              <p className="text-sm mt-2 bg-muted p-2 rounded">
                                {appointment.consultation_notes}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                            <Badge variant="outline">
                              {appointment.urgency}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No appointments found
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Treatment Plans */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ClipboardList className="h-5 w-5 text-dental-primary" />
                  <span>Treatment Plans</span>
                  <Badge variant="outline">{treatmentPlans.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {treatmentPlans.length > 0 ? (
                  <div className="space-y-3">
                    {treatmentPlans.map((plan) => (
                      <div key={plan.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{plan.title}</h4>
                            {plan.description && (
                              <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                            )}
                            {plan.diagnosis && (
                              <p className="text-sm mt-2 bg-muted p-2 rounded">
                                <span className="font-medium">Diagnosis:</span> {plan.diagnosis}
                              </p>
                            )}
                            <div className="flex space-x-4 mt-2 text-sm">
                              {plan.estimated_cost && (
                                <span>Cost: ${plan.estimated_cost}</span>
                              )}
                              {plan.estimated_duration_weeks && (
                                <span>Duration: {plan.estimated_duration_weeks} weeks</span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Badge className={getStatusColor(plan.status)}>
                              {plan.status}
                            </Badge>
                            <Badge variant="outline">
                              {plan.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No treatment plans found
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Prescriptions */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Pill className="h-5 w-5 text-dental-primary" />
                  <span>Prescriptions</span>
                  <Badge variant="outline">{prescriptions.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {prescriptions.length > 0 ? (
                  <div className="space-y-3">
                    {prescriptions.map((prescription) => (
                      <div key={prescription.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{prescription.medication_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {prescription.dosage} - {prescription.frequency}
                            </p>
                            {prescription.duration_days && (
                              <p className="text-sm">Duration: {prescription.duration_days} days</p>
                            )}
                            {prescription.instructions && (
                              <p className="text-sm mt-2 bg-muted p-2 rounded">
                                {prescription.instructions}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Prescribed: {format(new Date(prescription.prescribed_date), 'PPP')}
                            </p>
                          </div>
                          <Badge className={getStatusColor(prescription.status)}>
                            {prescription.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No prescriptions found
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-dental-primary" />
                  <span>Notes</span>
                  <Badge variant="outline">{notes.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notes.length > 0 ? (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div key={note.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{note.title}</h4>
                              {note.is_private && (
                                <Badge variant="secondary" className="text-xs">Private</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{note.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(note.created_at), 'PPP p')}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {note.note_type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No notes found
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="glass-card h-96">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Select a Patient</p>
                <p className="text-muted-foreground">
                  Choose a patient from the list to view their information and manage their care.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}