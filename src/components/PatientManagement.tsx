import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  User, 
  Calendar, 
  FileText, 
  ArrowLeft,
  Clock,
  Stethoscope,
  Pill,
  Users,
  CreditCard,
  MessageSquare
} from "lucide-react";
import { AIConversationDialog } from "@/components/AIConversationDialog";

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

interface PatientStats {
  total_appointments: number;
  upcoming_appointments: number;
  completed_appointments: number;
  last_appointment_date?: string;
  total_notes: number;
  active_treatment_plans: number;
}

interface PatientManagementProps {
  dentistId: string;
}

export function PatientManagement({ dentistId }: PatientManagementProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'profile'>('list');
  const [patientStats, setPatientStats] = useState<PatientStats | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
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
      
      // Get all appointments for this dentist to find patients
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

      // Group by patient and calculate stats
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

      // Convert to array and get additional stats
      const patientsArray = Array.from(patientMap.values());
      
      // Get upcoming appointments count for each patient
      for (const patient of patientsArray) {
        const { data: upcomingAppts } = await supabase
          .from('appointments')
          .select('id')
          .eq('patient_id', patient.id)
          .eq('dentist_id', dentistId)
          .gt('appointment_date', new Date().toISOString())
          .neq('status', 'cancelled');
        
        patient.upcoming_appointments = upcomingAppts?.length || 0;
        
        // Get last appointment
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

  const fetchPatientStats = async (patientId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_patient_stats_for_dentist', {
        p_dentist_id: dentistId,
        p_patient_id: patientId
      });

      if (error) throw error;
      if (data && data.length > 0) {
        setPatientStats(data[0]);
      }
    } catch (error) {
      console.error('Error fetching patient stats:', error);
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
    fetchPatientStats(patient.id);
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
    setActiveView('list');
    setPatientStats(null);
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
          amount: parseFloat(paymentAmount) * 100, // Convert to cents
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
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search patients by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Statistics */}
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

            {/* Patient List */}
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

      {/* Patient Stats */}
      {patientStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{patientStats.total_appointments}</div>
              <div className="text-sm text-muted-foreground">Total Appointments</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{patientStats.upcoming_appointments}</div>
              <div className="text-sm text-muted-foreground">Upcoming</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{patientStats.total_notes}</div>
              <div className="text-sm text-muted-foreground">Clinical Notes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{patientStats.active_treatment_plans}</div>
              <div className="text-sm text-muted-foreground">Treatment Plans</div>
            </CardContent>
          </Card>
        </div>
      )}

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
              disabled={!paymentAmount || !paymentDescription || isProcessingPayment}
              className="w-full"
            >
              {isProcessingPayment ? "Sending..." : "Send Payment Request"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Patient will receive an email with secure payment link
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Medical Information */}
      {selectedPatient.medical_history && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>Medical History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{selectedPatient.medical_history}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}