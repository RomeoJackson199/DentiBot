import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  AlertTriangle,
  MapPin,
  FileText,
  CheckCircle2,
  Eye
} from "lucide-react";
import { format } from "date-fns";

interface NextAppointment {
  id: string;
  patient_id: string;
  appointment_date: string;
  duration_minutes: number | null;
  status: string;
  reason: string | null;
  urgency: string | null;
  consultation_notes: string | null;
  patient_name: string | null;
  patient: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  } | null;
}

interface NextAppointmentWidgetProps {
  dentistId: string;
}

export function NextAppointmentWidget({ dentistId }: NextAppointmentWidgetProps) {
  const [nextAppointment, setNextAppointment] = useState<NextAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [consultationNotes, setConsultationNotes] = useState("");
  const [completing, setCompleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchNextAppointment = async () => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id,
            patient_id,
            appointment_date,
            duration_minutes,
            status,
            reason,
            urgency,
            consultation_notes,
            patient_name,
            patient:profiles!appointments_patient_id_fkey (
              first_name,
              last_name,
              email,
              phone
            )
          `)
          .eq('dentist_id', dentistId)
          .gte('appointment_date', new Date().toISOString())
          .neq('status', 'cancelled')
          .order('appointment_date', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching next appointment:', error);
          return;
        }

        setNextAppointment(data || null);
      } catch (error) {
        console.error('Error fetching next appointment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNextAppointment();
  }, [dentistId]);

  const handleCompleteAppointment = async () => {
    if (!nextAppointment) return;
    
    setCompleting(true);
    try {
      // Update appointment status to completed
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'completed',
          consultation_notes: consultationNotes || nextAppointment.consultation_notes,
          treatment_completed_at: new Date().toISOString()
        })
        .eq('id', nextAppointment.id);

      if (updateError) throw updateError;

      // Send completion email
      await supabase.functions.invoke('send-email-notification', {
        body: {
          eventType: 'appointment_completed',
          patientId: nextAppointment.patient_id,
          appointmentId: nextAppointment.id,
          metadata: {
            patient_name: nextAppointment.patient?.first_name && nextAppointment.patient?.last_name 
              ? `${nextAppointment.patient.first_name} ${nextAppointment.patient.last_name}`
              : nextAppointment.patient_name || 'Patient',
            appointment_date: format(new Date(nextAppointment.appointment_date), 'MMM dd, yyyy HH:mm'),
            reason: nextAppointment.reason || 'General consultation',
            consultation_notes: consultationNotes || 'Appointment completed successfully.'
          }
        }
      });

      toast({
        title: "Appointment Completed",
        description: "The appointment has been marked as completed and the patient has been notified.",
      });

      setShowCompleteDialog(false);
      setConsultationNotes("");
      
      // Refresh the appointment data
      const { data } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          appointment_date,
          duration_minutes,
          status,
          reason,
          urgency,
          consultation_notes,
          patient_name,
          patient:profiles!appointments_patient_id_fkey (
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('dentist_id', dentistId)
        .gte('appointment_date', new Date().toISOString())
        .neq('status', 'cancelled')
        .order('appointment_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      setNextAppointment(data);
      
    } catch (error) {
      console.error('Error completing appointment:', error);
      toast({
        title: "Error",
        description: "Failed to complete appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCompleting(false);
    }
  };

  const getUrgencyColor = (urgency: string | null) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-500/20 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-500/20 text-green-700 border-green-200';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-200';
      case 'completed':
        return 'bg-blue-500/20 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-dental-primary" />
            Next Appointment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!nextAppointment) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-dental-primary" />
            Next Appointment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No upcoming appointments</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const appointmentDate = new Date(nextAppointment.appointment_date);
  const patientName = nextAppointment.patient?.first_name && nextAppointment.patient?.last_name 
    ? `${nextAppointment.patient.first_name} ${nextAppointment.patient.last_name}`
    : nextAppointment.patient_name || 'Unknown Patient';

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-dental-primary" />
            Next Appointment
          </CardTitle>
          <div className="flex gap-2">
            <Badge className={getStatusColor(nextAppointment.status)}>
              {nextAppointment.status}
            </Badge>
            {nextAppointment.urgency && (
              <Badge className={getUrgencyColor(nextAppointment.urgency)}>
                <AlertTriangle className="h-3 w-3 mr-1" />
                {nextAppointment.urgency}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Patient Info */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-dental-primary/20 flex items-center justify-center">
              <User className="h-5 w-5 text-dental-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{patientName}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {nextAppointment.patient?.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {nextAppointment.patient.email}
                </div>
              )}
              {nextAppointment.patient?.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {nextAppointment.patient.phone}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {format(appointmentDate, 'MMM dd, yyyy')}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {format(appointmentDate, 'HH:mm')}
              {nextAppointment.duration_minutes && (
                <span className="text-muted-foreground">
                  {' '}({nextAppointment.duration_minutes} min)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Reason */}
        {nextAppointment.reason && (
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Reason</p>
              <p className="text-sm text-muted-foreground">{nextAppointment.reason}</p>
            </div>
          </div>
        )}

        {/* Notes */}
        {nextAppointment.consultation_notes && (
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Notes</p>
              <p className="text-sm text-muted-foreground">{nextAppointment.consultation_notes}</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button size="sm" className="flex-1" onClick={() => setShowDetailsDialog(true)}>
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
          {nextAppointment.status !== 'completed' && (
            <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowCompleteDialog(true)}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Complete
            </Button>
          )}
        </div>

        {/* Complete Appointment Dialog */}
        <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Appointment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Consultation Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add consultation notes..."
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleCompleteAppointment} 
                  disabled={completing}
                  className="flex-1"
                >
                  {completing ? "Completing..." : "Complete Appointment"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCompleteDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Patient Information */}
              <div>
                <h3 className="font-semibold mb-3">Patient Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{patientName}</span>
                  </div>
                  {nextAppointment.patient?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{nextAppointment.patient.email}</span>
                    </div>
                  )}
                  {nextAppointment.patient?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{nextAppointment.patient.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Appointment Information */}
              <div>
                <h3 className="font-semibold mb-3">Appointment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(appointmentDate, 'EEEE, MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(appointmentDate, 'HH:mm')}
                      {nextAppointment.duration_minutes && (
                        <span className="text-muted-foreground">
                          {' '}({nextAppointment.duration_minutes} minutes)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(nextAppointment.status)}>
                      {nextAppointment.status}
                    </Badge>
                  </div>
                  {nextAppointment.urgency && (
                    <div className="flex items-center gap-2">
                      <Badge className={getUrgencyColor(nextAppointment.urgency)}>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {nextAppointment.urgency} priority
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Reason and Notes */}
              {(nextAppointment.reason || nextAppointment.consultation_notes) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    {nextAppointment.reason && (
                      <div>
                        <h4 className="font-medium mb-2">Reason for Visit</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                          {nextAppointment.reason}
                        </p>
                      </div>
                    )}
                    {nextAppointment.consultation_notes && (
                      <div>
                        <h4 className="font-medium mb-2">Consultation Notes</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                          {nextAppointment.consultation_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}