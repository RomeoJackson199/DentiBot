import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, User as UserIcon, Calendar, FileText, Pill } from 'lucide-react';
import { toast } from 'sonner';
import { Patient, Prescription, TreatmentPlan, MedicalRecord, Appointment } from '@/types/dental';

interface PatientManagementProps {
  user: User;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  role: string;
}

const PatientManagement: React.FC<PatientManagementProps> = ({ user }) => {
  const [patients, setPatients] = useState<Profile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);

  // Dialog states
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);

  // Form states
  const [prescriptionForm, setPrescriptionForm] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    duration_days: 7,
    instructions: ''
  });

  const [treatmentForm, setTreatmentForm] = useState({
    title: '',
    description: '',
    diagnosis: '',
    estimated_cost: 0,
    estimated_duration: '',
    priority: 'medium',
    status: 'draft'
  });

  const [recordForm, setRecordForm] = useState({
    record_type: 'consultation',
    title: '',
    description: '',
    findings: '',
    recommendations: ''
  });

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      loadPatientData(selectedPatient.id);
    }
  }, [selectedPatient]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'patient')
        .order('first_name');

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const loadPatientData = async (patientId: string) => {
    try {
      // Get dentist profile first
      const { data: dentistProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'dentist')
        .single();

      if (!dentistProfile) return;

      const { data: dentistData } = await supabase
        .from('dentists')
        .select('id')
        .eq('profile_id', dentistProfile.id)
        .single();

      if (!dentistData) return;

      const dentistId = dentistData.id;

      // Load appointments
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('appointment_date', { ascending: false });

      if (appointmentsData) {
        const formattedAppointments = appointmentsData.map(apt => ({
          ...apt,
          duration: apt.duration_minutes,
          urgency_level: apt.urgency || 'medium'
        }));
        setAppointments(formattedAppointments as Appointment[]);
      }

      // Load prescriptions
      const { data: prescriptionsData } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('created_at', { ascending: false });

      if (prescriptionsData) {
        setPrescriptions(prescriptionsData as Prescription[]);
      }

      // Load treatment plans
      const { data: treatmentData } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('created_at', { ascending: false });

      if (treatmentData) {
        const formattedTreatment = treatmentData.map(plan => ({
          ...plan,
          estimated_duration: plan.estimated_duration_weeks ? `${plan.estimated_duration_weeks} weeks` : '1 week'
        }));
        setTreatmentPlans(formattedTreatment as TreatmentPlan[]);
      }

      // Load medical records
      const { data: recordsData } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('record_date', { ascending: false });

      if (recordsData) {
        const formattedRecords = recordsData.map(record => ({
          ...record,
          visit_date: record.record_date
        }));
        setMedicalRecords(formattedRecords as MedicalRecord[]);
      }

    } catch (error) {
      console.error('Error loading patient data:', error);
      toast.error('Failed to load patient data');
    }
  };

  const createPrescription = async () => {
    if (!selectedPatient) return;

    try {
      // Get dentist ID
      const { data: dentistProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'dentist')
        .single();

      if (!dentistProfile) throw new Error('Dentist profile not found');

      const { data: dentistData } = await supabase
        .from('dentists')
        .select('id')
        .eq('profile_id', dentistProfile.id)
        .single();

      if (!dentistData) throw new Error('Dentist data not found');

      const { error } = await supabase
        .from('prescriptions')
        .insert({
          patient_id: selectedPatient.id,
          dentist_id: dentistData.id,
          ...prescriptionForm,
          status: 'active'
        });

      if (error) throw error;

      toast.success('Prescription created successfully');
      setPrescriptionDialogOpen(false);
      setPrescriptionForm({
        medication_name: '',
        dosage: '',
        frequency: '',
        duration_days: 7,
        instructions: ''
      });
      loadPatientData(selectedPatient.id);
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error('Failed to create prescription');
    }
  };

  const createTreatmentPlan = async () => {
    if (!selectedPatient) return;

    try {
      // Get dentist ID
      const { data: dentistProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'dentist')
        .single();

      if (!dentistProfile) throw new Error('Dentist profile not found');

      const { data: dentistData } = await supabase
        .from('dentists')
        .select('id')
        .eq('profile_id', dentistProfile.id)
        .single();

      if (!dentistData) throw new Error('Dentist data not found');

      const { error } = await supabase
        .from('treatment_plans')
        .insert({
          patient_id: selectedPatient.id,
          dentist_id: dentistData.id,
          start_date: new Date().toISOString().split('T')[0],
          ...treatmentForm
        });

      if (error) throw error;

      toast.success('Treatment plan created successfully');
      setTreatmentDialogOpen(false);
      setTreatmentForm({
        title: '',
        description: '',
        diagnosis: '',
        estimated_cost: 0,
        estimated_duration: '',
        priority: 'medium',
        status: 'draft'
      });
      loadPatientData(selectedPatient.id);
    } catch (error) {
      console.error('Error creating treatment plan:', error);
      toast.error('Failed to create treatment plan');
    }
  };

  const createMedicalRecord = async () => {
    if (!selectedPatient) return;

    try {
      // Get dentist ID
      const { data: dentistProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'dentist')
        .single();

      if (!dentistProfile) throw new Error('Dentist profile not found');

      const { data: dentistData } = await supabase
        .from('dentists')
        .select('id')
        .eq('profile_id', dentistProfile.id)
        .single();

      if (!dentistData) throw new Error('Dentist data not found');

      const { error } = await supabase
        .from('medical_records')
        .insert({
          patient_id: selectedPatient.id,
          dentist_id: dentistData.id,
          record_date: new Date().toISOString().split('T')[0],
          ...recordForm
        });

      if (error) throw error;

      toast.success('Medical record created successfully');
      setRecordDialogOpen(false);
      setRecordForm({
        record_type: 'consultation',
        title: '',
        description: '',
        findings: '',
        recommendations: ''
      });
      loadPatientData(selectedPatient.id);
    } catch (error) {
      console.error('Error creating medical record:', error);
      toast.error('Failed to create medical record');
    }
  };

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name} ${patient.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-6">Loading patients...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Patient Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patients List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Patients
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedPatient?.id === patient.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedPatient(patient)}
                >
                  <div className="font-medium">
                    {patient.first_name} {patient.last_name}
                  </div>
                  <div className="text-sm opacity-70">{patient.email}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Patient Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedPatient ? (
            <>
              {/* Patient Info */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Email:</strong> {selectedPatient.email}</p>
                  {selectedPatient.phone && <p><strong>Phone:</strong> {selectedPatient.phone}</p>}
                  {selectedPatient.date_of_birth && <p><strong>DOB:</strong> {selectedPatient.date_of_birth}</p>}
                  {selectedPatient.address && <p><strong>Address:</strong> {selectedPatient.address}</p>}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-4 flex-wrap">
                <Dialog open={prescriptionDialogOpen} onOpenChange={setPrescriptionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Pill className="h-4 w-4" />
                      Add Prescription
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>New Prescription</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="medication">Medication Name</Label>
                        <Input
                          id="medication"
                          value={prescriptionForm.medication_name}
                          onChange={(e) => setPrescriptionForm(prev => ({
                            ...prev,
                            medication_name: e.target.value
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dosage">Dosage</Label>
                        <Input
                          id="dosage"
                          value={prescriptionForm.dosage}
                          onChange={(e) => setPrescriptionForm(prev => ({
                            ...prev,
                            dosage: e.target.value
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="frequency">Frequency</Label>
                        <Input
                          id="frequency"
                          value={prescriptionForm.frequency}
                          onChange={(e) => setPrescriptionForm(prev => ({
                            ...prev,
                            frequency: e.target.value
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="duration">Duration (days)</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={prescriptionForm.duration_days}
                          onChange={(e) => setPrescriptionForm(prev => ({
                            ...prev,
                            duration_days: parseInt(e.target.value) || 7
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="instructions">Instructions</Label>
                        <Textarea
                          id="instructions"
                          value={prescriptionForm.instructions}
                          onChange={(e) => setPrescriptionForm(prev => ({
                            ...prev,
                            instructions: e.target.value
                          }))}
                        />
                      </div>
                      <Button onClick={createPrescription} className="w-full">
                        Create Prescription
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={treatmentDialogOpen} onOpenChange={setTreatmentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Add Treatment Plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>New Treatment Plan</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={treatmentForm.title}
                          onChange={(e) => setTreatmentForm(prev => ({
                            ...prev,
                            title: e.target.value
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={treatmentForm.description}
                          onChange={(e) => setTreatmentForm(prev => ({
                            ...prev,
                            description: e.target.value
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="diagnosis">Diagnosis</Label>
                        <Input
                          id="diagnosis"
                          value={treatmentForm.diagnosis}
                          onChange={(e) => setTreatmentForm(prev => ({
                            ...prev,
                            diagnosis: e.target.value
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cost">Estimated Cost</Label>
                        <Input
                          id="cost"
                          type="number"
                          value={treatmentForm.estimated_cost}
                          onChange={(e) => setTreatmentForm(prev => ({
                            ...prev,
                            estimated_cost: parseFloat(e.target.value) || 0
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="duration">Estimated Duration</Label>
                        <Input
                          id="duration"
                          value={treatmentForm.estimated_duration}
                          onChange={(e) => setTreatmentForm(prev => ({
                            ...prev,
                            estimated_duration: e.target.value
                          }))}
                          placeholder="e.g., 2 weeks"
                        />
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select 
                          value={treatmentForm.priority} 
                          onValueChange={(value) => setTreatmentForm(prev => ({
                            ...prev,
                            priority: value
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={createTreatmentPlan} className="w-full">
                        Create Treatment Plan
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Add Medical Record
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>New Medical Record</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="record_type">Record Type</Label>
                        <Select 
                          value={recordForm.record_type} 
                          onValueChange={(value) => setRecordForm(prev => ({
                            ...prev,
                            record_type: value
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="consultation">Consultation</SelectItem>
                            <SelectItem value="examination">Examination</SelectItem>
                            <SelectItem value="xray">X-Ray</SelectItem>
                            <SelectItem value="lab_result">Lab Result</SelectItem>
                            <SelectItem value="surgery">Surgery</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="record_title">Title</Label>
                        <Input
                          id="record_title"
                          value={recordForm.title}
                          onChange={(e) => setRecordForm(prev => ({
                            ...prev,
                            title: e.target.value
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="record_description">Description</Label>
                        <Textarea
                          id="record_description"
                          value={recordForm.description}
                          onChange={(e) => setRecordForm(prev => ({
                            ...prev,
                            description: e.target.value
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="findings">Findings</Label>
                        <Textarea
                          id="findings"
                          value={recordForm.findings}
                          onChange={(e) => setRecordForm(prev => ({
                            ...prev,
                            findings: e.target.value
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="recommendations">Recommendations</Label>
                        <Textarea
                          id="recommendations"
                          value={recordForm.recommendations}
                          onChange={(e) => setRecordForm(prev => ({
                            ...prev,
                            recommendations: e.target.value
                          }))}
                        />
                      </div>
                      <Button onClick={createMedicalRecord} className="w-full">
                        Create Medical Record
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Patient Data Tables */}
              <div className="grid grid-cols-1 gap-6">
                {/* Appointments */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Appointments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {appointments.length > 0 ? (
                      <div className="space-y-2">
                        {appointments.slice(0, 5).map((appointment) => (
                          <div key={appointment.id} className="p-3 border rounded">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{appointment.reason || 'Consultation'}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(appointment.appointment_date).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs ${
                                appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {appointment.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No appointments found</p>
                    )}
                  </CardContent>
                </Card>

                {/* Prescriptions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Prescriptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {prescriptions.length > 0 ? (
                      <div className="space-y-2">
                        {prescriptions.slice(0, 5).map((prescription) => (
                          <div key={prescription.id} className="p-3 border rounded">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{prescription.medication_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {prescription.dosage} - {prescription.frequency}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {prescription.duration_days} days
                                </p>
                              </div>
                              <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                {prescription.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No prescriptions found</p>
                    )}
                  </CardContent>
                </Card>

                {/* Treatment Plans */}
                <Card>
                  <CardHeader>
                    <CardTitle>Treatment Plans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {treatmentPlans.length > 0 ? (
                      <div className="space-y-2">
                        {treatmentPlans.slice(0, 5).map((plan) => (
                          <div key={plan.id} className="p-3 border rounded">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{plan.title}</p>
                                <p className="text-sm text-muted-foreground">{plan.description}</p>
                                <p className="text-sm text-muted-foreground">
                                  Duration: {plan.estimated_duration}
                                </p>
                                {plan.estimated_cost && (
                                  <p className="text-sm text-muted-foreground">
                                    Cost: €{plan.estimated_cost}
                                  </p>
                                )}
                              </div>
                              <span className={`px-2 py-1 rounded text-xs ${
                                plan.status === 'active' ? 'bg-green-100 text-green-800' :
                                plan.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {plan.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No treatment plans found</p>
                    )}
                  </CardContent>
                </Card>

                {/* Medical Records */}
                <Card>
                  <CardHeader>
                    <CardTitle>Medical Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {medicalRecords.length > 0 ? (
                      <div className="space-y-2">
                        {medicalRecords.slice(0, 5).map((record) => (
                          <div key={record.id} className="p-3 border rounded">
                            <div>
                              <p className="font-medium">{record.title}</p>
                              <p className="text-sm text-muted-foreground">
                                Type: {record.record_type}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Date: {new Date(record.record_date).toLocaleDateString()}
                              </p>
                              {record.description && (
                                <p className="text-sm mt-1">{record.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No medical records found</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a patient to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientManagement;