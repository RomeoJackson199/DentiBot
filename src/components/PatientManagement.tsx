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
  Plus,
  ArrowLeft,
  Clock,
  AlertTriangle,
  Stethoscope,
  Pill,
  Users
} from "lucide-react";
import { PatientDossier } from "@/components/PatientDossier";
import { PatientAppointments } from "@/components/PatientAppointments";
import { PatientNotes } from "@/components/PatientNotes";
import { PatientTreatmentPlans } from "@/components/PatientTreatmentPlans";

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

interface PatientManagementProps {
  dentistId: string;
}

export function PatientManagement({ dentistId }: PatientManagementProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'dossier' | 'appointments' | 'notes' | 'treatment'>('list');
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
      
      // Get all patients who have appointments with this dentist
      const { data: appointments, error: appointmentsError } = await supabase
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
            medical_history
          )
        `)
        .eq('dentist_id', dentistId);

      if (appointmentsError) throw appointmentsError;

      // Group by patient and get statistics
      const patientMap = new Map();
      
      for (const appointment of appointments || []) {
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
      }

      // Get appointment statistics for each patient
      const patientIds = Array.from(patientMap.keys());
      
      for (const patientId of patientIds) {
        const { data: appointmentStats } = await supabase
          .from('appointments')
          .select('appointment_date, status')
          .eq('patient_id', patientId)
          .eq('dentist_id', dentistId)
          .order('appointment_date', { ascending: false });

        if (appointmentStats) {
          const patient = patientMap.get(patientId);
          patient.total_appointments = appointmentStats.length;
          patient.upcoming_appointments = appointmentStats.filter(
            a => new Date(a.appointment_date) > new Date() && a.status !== 'cancelled'
          ).length;
          
          const lastAppointment = appointmentStats.find(
            a => new Date(a.appointment_date) <= new Date() && a.status === 'completed'
          );
          if (lastAppointment) {
            patient.last_appointment = lastAppointment.appointment_date;
          }
        }
      }

      const patientsArray = Array.from(patientMap.values());
      setPatients(patientsArray);
      setFilteredPatients(patientsArray);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load patients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
    setActiveView('dossier');
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
    setActiveView('list');
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
              <Users className="h-6 w-6 text-dental-primary" />
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
                  <div className="text-2xl font-bold text-dental-primary">{patients.length}</div>
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
                          <div className="w-12 h-12 bg-dental-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-dental-primary" />
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
                            View Dossier
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
              <div className="w-16 h-16 bg-dental-primary/10 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-dental-primary" />
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

      {/* Patient Navigation */}
      <Tabs value={activeView} onValueChange={(value: any) => setActiveView(value)}>
        <Card className="glass-card">
          <CardContent className="p-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dossier" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Medical Dossier</span>
              </TabsTrigger>
              <TabsTrigger value="appointments" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Appointments</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center space-x-2">
                <Stethoscope className="h-4 w-4" />
                <span>Clinical Notes</span>
              </TabsTrigger>
              <TabsTrigger value="treatment" className="flex items-center space-x-2">
                <Pill className="h-4 w-4" />
                <span>Treatment Plans</span>
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        <TabsContent value="dossier">
          <PatientDossier 
            user={{ id: selectedPatient.id } as any}
            onBack={handleBackToList}
          />
        </TabsContent>

        <TabsContent value="appointments">
          <PatientAppointments 
            patientId={selectedPatient.id}
            dentistId={dentistId}
          />
        </TabsContent>

        <TabsContent value="notes">
          <PatientNotes 
            patientId={selectedPatient.id}
            dentistId={dentistId}
          />
        </TabsContent>

        <TabsContent value="treatment">
          <PatientTreatmentPlans 
            patientId={selectedPatient.id}
            dentistId={dentistId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}