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
  BookOpen
} from "lucide-react";
import { format } from "date-fns";

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
        .order('appointment_date', { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load appointments",
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
    } catch (error: any) {
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save notes",
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete appointment",
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

  const filteredAppointments = appointments.filter(appointment =>
    appointment.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        {filteredAppointments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchTerm ? "No appointments found matching your search." : "No appointments found."}
            </CardContent>
          </Card>
        ) : (
          filteredAppointments.map((appointment) => (
            <Card key={appointment.id} className="glass-card">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-dental-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-dental-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {appointment.patient_name || 'Unknown Patient'}
                      </h3>
                      <p className="text-muted-foreground flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(appointment.appointment_date), 'PPP')}</span>
                        <Clock className="h-4 w-4 ml-2" />
                        <span>{format(new Date(appointment.appointment_date), 'p')}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                    <Badge className={getUrgencyColor(appointment.urgency)}>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {appointment.urgency}
                    </Badge>
                  </div>
                </div>

                {/* Appointment Details */}
                {appointment.reason && (
                  <div className="mb-4">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Reason for Visit</h4>
                    <p className="text-sm bg-muted p-3 rounded-md">{appointment.reason}</p>
                  </div>
                )}

                {/* Consultation Notes */}
                <div className="border-t pt-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium flex items-center space-x-2">
                      <Stethoscope className="h-4 w-4" />
                      <span>Consultation Notes</span>
                    </h4>
                    
                    <div className="flex items-center space-x-2">
                      {editingNotes === appointment.id ? (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => handleSaveNotes(appointment.id)}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setEditingNotes(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditNotes(appointment.id, appointment.consultation_notes || "")}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            {appointment.consultation_notes ? 'Edit' : 'Add'} Notes
                          </Button>
                          {appointment.status !== 'completed' && (
                            <Button 
                              size="sm"
                              onClick={() => handleCompleteAppointment(appointment.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {editingNotes === appointment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={consultationNotes}
                        onChange={(e) => setConsultationNotes(e.target.value)}
                        placeholder="Enter consultation notes, findings, recommendations..."
                        className="min-h-[120px]"
                      />
                      <AIWritingAssistant 
                        onImprove={(improvedText) => setConsultationNotes(improvedText)}
                        currentText={consultationNotes}
                        placeholder="consultation notes"
                      />
                    </div>
                  ) : appointment.consultation_notes ? (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-md">
                      <p className="text-sm whitespace-pre-wrap">{appointment.consultation_notes}</p>
                    </div>
                  ) : (
                    <div className="bg-muted p-4 rounded-md text-center">
                      <p className="text-sm text-muted-foreground">
                        No consultation notes recorded yet.
                      </p>
                    </div>
                  )}
                </div>

                {/* AI Conversation Button */}
                <div className="pt-4 border-t">
                  <AIConversationDialog
                    patientId={appointment.patient_id}
                    dentistId={dentistId}
                    patientName={appointment.patient_name || 'Patient'}
                    contextType="appointment"
                    contextId={appointment.id}
                    onUpdate={fetchAppointments}
                  />
                </div>

                {/* Action Buttons for Completed Appointments */}
                {appointment.status === 'completed' && (
                  <div className="flex items-center space-x-2 pt-4 border-t">
                    <PrescriptionManager 
                      appointmentId={appointment.id}
                      patientId={appointment.patient_id}
                      dentistId={dentistId}
                    />
                    <TreatmentPlanManager 
                      appointmentId={appointment.id}
                      patientId={appointment.patient_id}
                      dentistId={dentistId}
                    />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          Medical Record
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add to Medical Record</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Medical record integration coming soon.
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}