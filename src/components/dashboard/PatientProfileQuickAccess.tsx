import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { 
  User, Search, Calendar, FileText, DollarSign,
  Phone, Mail, MapPin, AlertTriangle, Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PatientProfileQuickAccessProps {
  dentistId: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  date_of_birth: string;
  medical_history: string;
  emergency_contact: string;
}

interface PatientStats {
  total_appointments: number;
  upcoming_appointments: number;
  completed_appointments: number;
  last_appointment_date: string;
  total_notes: number;
  active_treatment_plans: number;
}

interface PatientWithStats extends Patient {
  stats: PatientStats;
  lastVisit: string;
  outstandingBalance: number;
  flaggedNotes: string[];
  preferences: {
    preferred_time: string;
    communication_method: string;
    special_needs: string[];
  };
}

export const PatientProfileQuickAccess = ({ dentistId }: PatientProfileQuickAccessProps) => {
  const [patients, setPatients] = useState<PatientWithStats[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPatients();
  }, [dentistId]);

  useEffect(() => {
    const filtered = patients.filter(patient =>
      `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm)
    );
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  const fetchPatients = async () => {
    try {
      // First get all patients who have appointments with this dentist
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('dentist_id', dentistId)
        .not('patient_id', 'is', null);

      if (appointmentError) throw appointmentError;

      const patientIds = [...new Set(appointmentData?.map(a => a.patient_id) || [])];

      if (patientIds.length === 0) {
        setLoading(false);
        return;
      }

      // Get patient profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', patientIds);

      if (profileError) throw profileError;

      // Get stats for each patient
      const patientsWithStats = await Promise.all(
        (profileData || []).map(async (patient) => {
          try {
            const { data: stats, error: statsError } = await supabase
              .rpc('get_patient_stats_for_dentist', {
                p_dentist_id: dentistId,
                p_patient_id: patient.id
              });

            if (statsError) {
              console.error('Error fetching patient stats:', statsError);
              // Provide default stats if function fails
              return {
                ...patient,
                stats: {
                  total_appointments: 0,
                  upcoming_appointments: 0,
                  completed_appointments: 0,
                  last_appointment_date: null,
                  total_notes: 0,
                  active_treatment_plans: 0
                },
                lastVisit: 'Never',
                outstandingBalance: Math.floor(Math.random() * 500), // Mock data
                flaggedNotes: [],
                preferences: {
                  preferred_time: 'Morning',
                  communication_method: 'Email',
                  special_needs: []
                }
              };
            }

            const patientStats = stats[0] || {
              total_appointments: 0,
              upcoming_appointments: 0,
              completed_appointments: 0,
              last_appointment_date: null,
              total_notes: 0,
              active_treatment_plans: 0
            };

            return {
              ...patient,
              stats: patientStats,
              lastVisit: patientStats.last_appointment_date 
                ? new Date(patientStats.last_appointment_date).toLocaleDateString()
                : 'Never',
              outstandingBalance: Math.floor(Math.random() * 500), // Mock data - replace with actual balance calculation
              flaggedNotes: patient.medical_history?.includes('allergy') ? ['Allergy Alert'] : [],
              preferences: {
                preferred_time: 'Morning',
                communication_method: 'Email',
                special_needs: patient.medical_history?.includes('anxiety') ? ['Dental Anxiety'] : []
              }
            };
          } catch (error) {
            console.error('Error processing patient:', error);
            return {
              ...patient,
              stats: {
                total_appointments: 0,
                upcoming_appointments: 0,
                completed_appointments: 0,
                last_appointment_date: null,
                total_notes: 0,
                active_treatment_plans: 0
              },
              lastVisit: 'Never',
              outstandingBalance: 0,
              flaggedNotes: [],
              preferences: {
                preferred_time: 'Morning',
                communication_method: 'Email',
                special_needs: []
              }
            };
          }
        })
      );

      setPatients(patientsWithStats);
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patient profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const PatientHoverCard = ({ patient }: { patient: PatientWithStats }) => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50 hover:bg-background/70 transition-all duration-200 cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold">
              {patient.first_name[0]}{patient.last_name[0]}
            </div>
            <div>
              <h4 className="font-semibold">{patient.first_name} {patient.last_name}</h4>
              <p className="text-sm text-dental-muted-foreground">Last visit: {patient.lastVisit}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {patient.stats.upcoming_appointments > 0 && (
              <Badge variant="secondary">
                {patient.stats.upcoming_appointments} upcoming
              </Badge>
            )}
            {patient.outstandingBalance > 0 && (
              <Badge variant="destructive">
                ${patient.outstandingBalance}
              </Badge>
            )}
            {patient.flaggedNotes.length > 0 && (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-96" side="right">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">
              {patient.first_name[0]}{patient.last_name[0]}
            </div>
            <div>
              <h3 className="font-bold">{patient.first_name} {patient.last_name}</h3>
              <p className="text-sm text-dental-muted-foreground">Patient ID: {patient.id.slice(0, 8)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-dental-muted-foreground" />
                <span className="text-sm">{patient.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-dental-muted-foreground" />
                <span className="text-sm truncate">{patient.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-dental-muted-foreground" />
                <span className="text-sm">{patient.address || 'No address'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Visits:</span>
                <span className="text-sm">{patient.stats.completed_appointments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Upcoming:</span>
                <span className="text-sm">{patient.stats.upcoming_appointments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Notes:</span>
                <span className="text-sm">{patient.stats.total_notes}</span>
              </div>
            </div>
          </div>

          {patient.outstandingBalance > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-800">Outstanding Balance:</span>
                <span className="text-sm font-bold text-red-800">${patient.outstandingBalance}</span>
              </div>
            </div>
          )}

          {patient.flaggedNotes.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Health Alerts:</h4>
              {patient.flaggedNotes.map((note, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <AlertTriangle className="h-3 w-3 text-yellow-600" />
                  <span className="text-sm text-yellow-800">{note}</span>
                </div>
              ))}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Preferences:</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Preferred Time:</span>
                <span className="text-sm text-blue-800">{patient.preferences.preferred_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Communication:</span>
                <span className="text-sm text-blue-800">{patient.preferences.communication_method}</span>
              </div>
              {patient.preferences.special_needs.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Special Needs:</span>
                  <span className="text-sm text-blue-800">{patient.preferences.special_needs.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" className="flex-1">
              <Calendar className="h-3 w-3 mr-1" />
              Schedule
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <FileText className="h-3 w-3 mr-1" />
              Records
            </Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Patient Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-dental-primary" />
          Patient Profile Quick Access
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dental-muted-foreground" />
          <Input
            placeholder="Search patients by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredPatients.length === 0 ? (
          <p className="text-center text-dental-muted-foreground py-8">
            {searchTerm ? 'No patients found matching your search' : 'No patients found'}
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredPatients.map((patient) => (
              <PatientHoverCard key={patient.id} patient={patient} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};