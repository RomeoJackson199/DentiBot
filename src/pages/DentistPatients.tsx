import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  Calendar,
  FileText,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DentistPatientsProps {
  user: User;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  medical_history?: string;
  appointments: {
    id: string;
    appointment_date: string;
    status: string;
    reason?: string;
  }[];
  medical_records: {
    id: string;
    title: string;
    visit_date: string;
    record_type: string;
  }[];
}

export function DentistPatients({ user }: DentistPatientsProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [dentistId, setDentistId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDentistProfile();
  }, [user]);

  useEffect(() => {
    if (dentistId) {
      fetchPatients();
    }
  }, [dentistId]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = patients.filter(patient =>
        `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchTerm, patients]);

  const fetchDentistProfile = async () => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const { data: dentist, error: dentistError } = await supabase
        .from('dentists')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (dentistError) {
        throw new Error('You are not registered as a dentist');
      }

      setDentistId(dentist.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load dentist profile",
        variant: "destructive",
      });
    }
  };

  const fetchPatients = async () => {
    if (!dentistId) return;

    try {
      // Get unique patients who have appointments with this dentist
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          patient_id,
          patient:patient_id (
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

      if (appointmentError) throw appointmentError;

      // Get unique patients
      const uniquePatients = new Map();
      appointmentData?.forEach(appointment => {
        if (appointment.patient && !uniquePatients.has(appointment.patient.id)) {
          uniquePatients.set(appointment.patient.id, appointment.patient);
        }
      });

      const patientIds = Array.from(uniquePatients.keys());

      // Fetch appointments for each patient
      const patientsWithData = await Promise.all(
        patientIds.map(async (patientId) => {
          const patient = uniquePatients.get(patientId);
          
          // Get appointments
          const { data: appointments } = await supabase
            .from('appointments')
            .select('id, appointment_date, status, reason')
            .eq('patient_id', patientId)
            .eq('dentist_id', dentistId)
            .order('appointment_date', { ascending: false });

          // Get medical records
          const { data: medicalRecords } = await supabase
            .from('medical_records')
            .select('id, title, visit_date, record_type')
            .eq('patient_id', patientId)
            .eq('dentist_id', dentistId)
            .order('visit_date', { ascending: false });

          return {
            ...patient,
            appointments: appointments || [],
            medical_records: medicalRecords || []
          };
        })
      );

      setPatients(patientsWithData);
      setFilteredPatients(patientsWithData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
    return <div className="flex justify-center p-8">Loading patients...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Patient Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {filteredPatients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {patients.length === 0 ? 'No patients found' : 'No matching patients'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {patients.length === 0 
                ? 'Patients will appear here when they book appointments with you.'
                : 'Try adjusting your search terms.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {patient.first_name} {patient.last_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Contact Information */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{patient.email}</span>
                    </div>
                    {patient.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{patient.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Appointments Summary */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Appointments ({patient.appointments.length})
                      </span>
                    </div>
                    {patient.appointments.length > 0 ? (
                      <div className="space-y-1">
                        {patient.appointments.slice(0, 2).map((appointment) => (
                          <div key={appointment.id} className="flex items-center gap-2">
                            <Badge className={`text-xs ${getStatusColor(appointment.status)}`}>
                              {appointment.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(appointment.appointment_date).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                        {patient.appointments.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{patient.appointments.length - 2} more
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No appointments</p>
                    )}
                  </div>

                  {/* Medical Records Summary */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Records ({patient.medical_records.length})
                      </span>
                    </div>
                    {patient.medical_records.length > 0 ? (
                      <div className="space-y-1">
                        {patient.medical_records.slice(0, 2).map((record) => (
                          <div key={record.id} className="text-xs text-muted-foreground">
                            {record.title} - {new Date(record.visit_date).toLocaleDateString()}
                          </div>
                        ))}
                        {patient.medical_records.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{patient.medical_records.length - 2} more
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No records</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Activity className="h-4 w-4 mr-1" />
                      View History
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      Book Appointment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}