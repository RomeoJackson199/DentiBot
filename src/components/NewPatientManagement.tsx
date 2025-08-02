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
  Stethoscope
} from "lucide-react";
import { AIConversationDialog } from "@/components/AIConversationDialog";
import { generateSymptomSummary } from "@/lib/symptoms";

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

interface AppointmentWithSummary {
  id: string;
  appointment_date: string;
  status: string;
  reason?: string;
  consultation_notes?: string;
  ai_summary?: string;
  urgency?: string;
  patient_name?: string;
}

interface PatientManagementProps {
  dentistId: string;
}

export function NewPatientManagement({ dentistId }: PatientManagementProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'profile'>('list');
  const [appointments, setAppointments] = useState<AppointmentWithSummary[]>([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [appointmentSummary, setAppointmentSummary] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [generatingAISummary, setGeneratingAISummary] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPatients();
  }, [dentistId]);

  useEffect(() => {
    filterPatients();
  }, [searchTerm, patients]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          patient_id,
          profiles!appointments_patient_id_fkey (
            id,
            first_name,
            last_name,
            email,
            phone,
            date_of_birth,
            medical_history
          )
        `)
        .eq('dentist_id', dentistId);

      if (error) throw error;

      if (!appointments || appointments.length === 0) {
        setPatients([]);
        setFilteredPatients([]);
        return;
      }

      const patientMap = new Map();
      
      for (const appointment of appointments) {
        const profile = appointment.profiles;
        if (!profile) continue;
        
        if (!patientMap.has(profile.id)) {
          patientMap.set(profile.id, {
            ...profile,
            total_appointments: 0,
            upcoming_appointments: 0,
            last_appointment: null
          });
        }
        
        const patient = patientMap.get(profile.id);
        patient.total_appointments++;
      }

      const patientsArray = Array.from(patientMap.values());
      
      for (const patient of patientsArray) {
        const { data: upcomingAppts } = await supabase
          .from('appointments')
          .select('id')
          .eq('patient_id', patient.id)
          .eq('dentist_id', dentistId)
          .gt('appointment_date', new Date().toISOString())
          .neq('status', 'cancelled');
        
        patient.upcoming_appointments = upcomingAppts?.length || 0;
        
        const { data: lastAppt } = await supabase
          .from('appointments')
          .select('appointment_date')
          .eq('patient_id', patient.id)
          .eq('dentist_id', dentistId)
          .eq('status', 'completed')
          .order('appointment_date', { ascending: false })
          .limit(1);
        
        if (lastAppt && lastAppt.length > 0) {
          patient.last_appointment = lastAppt[0].appointment_date;
        }
      }

      setPatients(patientsArray);
      setFilteredPatients(patientsArray);
      
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientAppointments = async (patientId: string) => {
    try {
      const { data, error } = await supabase
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

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load patient appointments",
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
    fetchPatientAppointments(patient.id);
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
    setActiveView('list');
    setAppointments([]);
  };

  const handlePaymentRequest = async () => {
    if (!selectedPatient || !paymentAmount || !paymentDescription) {
      toast({
        title: "Error",
        description: "Please fill in all payment fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessingPayment(true);
      
      const { data, error } = await supabase.functions.invoke('create-payment-request', {
        body: {
          patient_id: selectedPatient.id,
          dentist_id: dentistId,
          amount: parseFloat(paymentAmount) * 100,
          description: paymentDescription,
          patient_email: selectedPatient.email,
          patient_name: `${selectedPatient.first_name} ${selectedPatient.last_name}`
        }
      });

      if (error) throw error;

      toast({
        title: "Payment Request Sent",
        description: `Payment request for €${paymentAmount} sent to ${selectedPatient.first_name}`,
      });

      setPaymentAmount("");
      setPaymentDescription("");
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send payment request",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleAppointmentSummary = async (appointmentId: string) => {
    if (!appointmentSummary.trim()) {
      toast({
        title: "Error",
        description: "Please enter a summary",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ consultation_notes: appointmentSummary })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment summary saved",
      });

      setAppointmentSummary("");
      setSelectedAppointmentId(null);
      fetchPatientAppointments(selectedPatient!.id);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save summary",
        variant: "destructive",
      });
    }
  };

  const generateAISummary = async (appointmentId: string) => {
    if (!selectedPatient) return;
    
    try {
      setGeneratingAISummary(appointmentId);
      
      // Get chat messages related to this patient if any
      const { data: chatMessages } = await supabase
        .from('chat_messages')
        .select('message, is_bot, created_at, metadata')
        .eq('user_id', selectedPatient.id)
        .order('created_at', { ascending: true });

      const messages = (chatMessages || []).map(msg => ({
        id: msg.message,
        session_id: '',
        message: msg.message,
        is_bot: msg.is_bot,
        user_id: selectedPatient.id,
        created_at: msg.created_at,
        message_type: 'text',
        metadata: msg.metadata
      }));

      const userProfile = {
        name: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
        medical_history: selectedPatient.medical_history
      };

      const summary = await generateSymptomSummary(messages, userProfile);
      
      if (summary) {
        // Update appointment with AI summary
        const { error } = await supabase
          .from('appointments')
          .update({ consultation_notes: summary })
          .eq('id', appointmentId);

        if (error) throw error;

        toast({
          title: "AI Summary Generated",
          description: "Appointment summary has been created and saved",
        });

        fetchPatientAppointments(selectedPatient.id);
      }
    } catch (error) {
      console.error('Error generating AI summary:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI summary",
        variant: "destructive",
      });
    } finally {
      setGeneratingAISummary(null);
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

      {/* Patient Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Chat */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span>AI Consultation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Chat with AI about {selectedPatient.first_name}'s care, get treatment suggestions, and clinical insights.
            </p>
            <AIConversationDialog
              patientId={selectedPatient.id}
              dentistId={dentistId}
              patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
              contextType="patient"
              onUpdate={fetchPatients}
            />
          </CardContent>
        </Card>

        {/* Payment Request */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <span>Payment Request</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Amount (€)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="e.g., Dental cleaning, Root canal treatment"
                value={paymentDescription}
                onChange={(e) => setPaymentDescription(e.target.value)}
              />
            </div>
            <Button 
              onClick={handlePaymentRequest}
              disabled={isProcessingPayment}
              className="w-full"
            >
              {isProcessingPayment ? "Processing..." : "Send Payment Request"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Appointment History with AI Summary */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Appointment History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No appointments found.</p>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                  <Card key={appointment.id} className="border">
                   <CardContent className="p-4">
                     <div className="flex items-center justify-between mb-3">
                       <div className="flex items-center space-x-3">
                         <div>
                           <p className="font-semibold">
                             {new Date(appointment.appointment_date).toLocaleDateString()}
                           </p>
                           <div className="flex items-center space-x-2">
                             <Badge variant={appointment.status === 'completed' ? 'default' : 'secondary'}>
                               {appointment.status}
                             </Badge>
                             {appointment.urgency && (
                               <Badge variant={
                                 appointment.urgency === 'high' ? 'destructive' : 
                                 appointment.urgency === 'medium' ? 'default' : 'secondary'
                               }>
                                 {appointment.urgency}
                               </Badge>
                             )}
                           </div>
                         </div>
                         <div className="flex items-center space-x-2">
                           <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                             <MessageSquare className="h-4 w-4 text-white" />
                           </div>
                         </div>
                       </div>
                       <div className="flex space-x-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => generateAISummary(appointment.id)}
                           disabled={generatingAISummary === appointment.id}
                         >
                           {generatingAISummary === appointment.id ? (
                             <>
                               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                               Generating...
                             </>
                           ) : (
                             <>
                               <MessageSquare className="h-4 w-4 mr-2" />
                               AI Summary
                             </>
                           )}
                         </Button>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => {
                             setSelectedAppointmentId(appointment.id);
                             setAppointmentSummary(appointment.consultation_notes || "");
                           }}
                         >
                           <Stethoscope className="h-4 w-4 mr-2" />
                           Add Notes
                         </Button>
                       </div>
                     </div>
                    
                    {appointment.reason && (
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Reason:</strong> {appointment.reason}
                      </p>
                    )}
                    
                     {appointment.consultation_notes && (
                       <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                         <p className="text-sm text-blue-800">
                           <strong>Clinical Notes:</strong> {appointment.consultation_notes}
                         </p>
                       </div>
                     )}
                    
                    {selectedAppointmentId === appointment.id && (
                      <div className="mt-4 space-y-3">
                        <Textarea
                          placeholder="Enter consultation notes and summary..."
                          value={appointmentSummary}
                          onChange={(e) => setAppointmentSummary(e.target.value)}
                          className="min-h-[100px]"
                        />
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleAppointmentSummary(appointment.id)}
                            size="sm"
                          >
                            Save Summary
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedAppointmentId(null);
                              setAppointmentSummary("");
                            }}
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}