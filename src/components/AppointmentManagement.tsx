import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AIWritingAssistant } from "@/components/AIWritingAssistant";
import { PrescriptionManager } from "@/components/PrescriptionManager";
import { TreatmentPlanManager } from "@/components/TreatmentPlanManager";
import { AppointmentConfirmationWidget } from "@/components/AppointmentConfirmationWidget";
import { 
  Search, 
  Calendar, 
  Clock, 
  Plus,
  Edit,
  Save,
  X,
  CheckCircle,
  Stethoscope,
  Pill,
  FileText,
  AlertTriangle,
  User,
  BookOpen,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { generateSymptomSummary } from "@/lib/symptoms";
import { AIConversationDialog } from "@/components/AIConversationDialog";

interface Appointment {
  id: string;
  patient_id: string;
  patient_name?: string;
  appointment_date: string;
  duration_minutes: number;
  status: string;
  urgency: string;
  reason?: string;
  notes?: string;
  consultation_notes?: string;
  patient_age?: number;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

interface AppointmentManagementProps {
  dentistId: string;
}

export function AppointmentManagement({ dentistId }: AppointmentManagementProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [consultationNotes, setConsultationNotes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, [dentistId]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          appointment_date,
          duration_minutes,
          status,
          urgency,
          reason,
          notes,
          consultation_notes,
          patient_age,
          patient_name
        `)
        .eq('dentist_id', dentistId)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      // Get all patients who have any relationship with this dentist
      const patientIds = new Set<string>();
      
      const { data: appointmentPatients } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('dentist_id', dentistId);
      
      appointmentPatients?.forEach(apt => patientIds.add(apt.patient_id));

      if (patientIds.size > 0) {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone')
          .in('id', Array.from(patientIds));

        if (error) throw error;
        setPatients(profiles || []);
      }
    } catch (error: unknown) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleEditNotes = (appointmentId: string, currentNotes: string) => {
    setEditingNotes(appointmentId);
    setConsultationNotes(currentNotes || "");
  };

  const handleSaveNotes = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ consultation_notes: consultationNotes })
        .eq('id', appointmentId);

      if (error) throw error;

      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, consultation_notes: consultationNotes }
            : apt
        )
      );

      setEditingNotes(null);
      toast({
        title: "Success",
        description: "Consultation notes saved successfully",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);

      if (error) throw error;

      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: 'completed' }
            : apt
        )
      );

      toast({
        title: "Success",
        description: "Appointment marked as completed",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const todayAppointments = appointments
    .filter(apt => {
      const date = new Date(apt.appointment_date);
      return date >= startOfDay && date < endOfDay;
    })
    .sort((a, b) =>
      new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
    );

  const filteredAppointments = searchTerm
    ? appointments
        .filter(appointment =>
          appointment.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          appointment.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          format(new Date(appointment.appointment_date), 'PPP p')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
        .sort(
          (a, b) =>
            new Date(a.appointment_date).getTime() -
            new Date(b.appointment_date).getTime()
        )
    : todayAppointments;

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Loading appointments...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-dental-primary" />
              <span>Appointment Management</span>
            </CardTitle>
            <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Appointment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Appointment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    New appointment creation feature coming soon. 
                    For now, patients can book appointments through the main booking system.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNewAppointment(false)}
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search appointments by patient name or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-dental-primary">{appointments.length}</div>
                <div className="text-sm text-muted-foreground">Total Appointments</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {appointments.filter(a => a.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {appointments.filter(a => new Date(a.appointment_date) > new Date() && a.status !== 'cancelled').length}
                </div>
                <div className="text-sm text-muted-foreground">Upcoming</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {appointments.filter(a => a.urgency === 'high').length}
                </div>
                <div className="text-sm text-muted-foreground">High Priority</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          {searchTerm ? "Search Results" : "Today's Appointments"}
        </h3>
        {filteredAppointments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchTerm ? "No appointments found matching your search." : "No appointments for today."}
            </CardContent>
          </Card>
        ) : (
          filteredAppointments.map((appointment) => (
            <AppointmentConfirmationWidget
              key={appointment.id}
              appointment={{
                id: appointment.id,
                patient_name: appointment.patient_name || 'Unknown Patient',
                appointment_date: appointment.appointment_date,
                duration_minutes: appointment.duration_minutes,
                status: appointment.status,
                urgency: appointment.urgency,
                reason: appointment.reason,
                 consultation_notes: appointment.consultation_notes
              }}
              isDentistView={true}
              onConfirm={async () => {
                try {
                  const { error } = await supabase
                    .from('appointments')
                    .update({ status: 'confirmed' })
                    .eq('id', appointment.id);
                  if (error) throw error;
                  fetchAppointments();
                } catch (error: unknown) {
                  throw new Error(error instanceof Error ? error.message : "Unknown error");
                }
              }}
              onCancel={async () => {
                try {
                  const { error } = await supabase
                    .from('appointments')
                    .update({ status: 'cancelled' })
                    .eq('id', appointment.id);
                  if (error) throw error;
                  fetchAppointments();
                } catch (error: unknown) {
                  throw new Error(error instanceof Error ? error.message : "Unknown error");
                }
              }}
              onDelete={async () => {
                try {
                  const { error } = await supabase
                    .from('appointments')
                    .delete()
                    .eq('id', appointment.id);
                  if (error) throw error;
                  fetchAppointments();
                } catch (error: unknown) {
                  throw new Error(error instanceof Error ? error.message : "Unknown error");
                }
              }}
              onViewDetails={() => {
                setSelectedAppointment(appointment);
              }}
              className="mb-4"
            />
          ))
        )}
      </div>
    </div>
  );
}