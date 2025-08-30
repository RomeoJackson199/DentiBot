import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertTriangle,
  DollarSign,
  FileText,
  Pill,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { formatClinicTime, utcToClinicTime } from "@/lib/timezone";

interface AppointmentData {
  id: string;
  patient_id: string;
  dentist_id: string;
  appointment_date: string;
  duration_minutes: number | null;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no_show';
  reason?: string | null;
  consultation_notes?: string | null;
  urgency?: string;
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    date_of_birth?: string | null;
  } | null;
}

interface EnhancedClinicalAppointmentsProps {
  dentistId: string;
  onOpenPatientProfile?: (patientId: string) => void;
}

export function EnhancedClinicalAppointments({ 
  dentistId, 
  onOpenPatientProfile
}: EnhancedClinicalAppointmentsProps) {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [completionStatus, setCompletionStatus] = useState<'completed' | 'no_show' | 'cancelled'>('completed');
  const { toast } = useToast();

  // Get next appointment (earliest upcoming)
  const nextAppointment = useMemo(() => {
    const now = new Date();
    const upcoming = appointments
      .filter(a => ['confirmed', 'pending'].includes(a.status))
      .filter(a => new Date(a.appointment_date) >= now)
      .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());
    return upcoming[0] || null;
  }, [appointments]);

  // Get today's appointments - incomplete first, then completed
  const todayAppointments = useMemo(() => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    const filtered = appointments
      .filter(a => {
        const aptDate = new Date(a.appointment_date);
        return aptDate >= startOfDay && aptDate < endOfDay;
      })
      .filter(a => a.status !== 'cancelled');

    // Sort incomplete appointments first, then completed ones
    return filtered.sort((a, b) => {
      const aCompleted = ['completed', 'no_show'].includes(a.status);
      const bCompleted = ['completed', 'no_show'].includes(b.status);
      
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
      
      // Within same group, sort by time
      return new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime();
    });
  }, [appointments]);

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:profiles!appointments_patient_id_fkey (
            id,
            first_name,
            last_name,
            email,
            phone,
            date_of_birth
          )
        `)
        .eq('dentist_id', dentistId)
        .order('appointment_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [dentistId, toast]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCompleteAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      const updateData: any = {
        status: completionStatus,
        consultation_notes: completionNotes,
        treatment_completed_at: completionStatus === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === selectedAppointment.id 
            ? { ...apt, status: completionStatus, consultation_notes: completionNotes }
            : apt
        )
      );

      // Send completion email to patient
      if (selectedAppointment.patient?.email && completionStatus === 'completed') {
        try {
          const appointmentDate = utcToClinicTime(new Date(selectedAppointment.appointment_date));
          const emailSubject = `Appointment Completed - ${formatClinicTime(appointmentDate, 'PPP')}`;
          const emailMessage = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2D5D7B; margin-bottom: 24px;">Your Appointment is Complete!</h2>
              
              <div style="background: #f8fafc; padding: 24px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1e293b; margin: 0 0 16px 0;">Appointment Summary:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #475569;">Date:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${formatClinicTime(appointmentDate, 'EEEE, MMMM d, yyyy')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #475569;">Time:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${formatClinicTime(appointmentDate, 'HH:mm')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #475569;">Reason:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${selectedAppointment.reason || 'General consultation'}</td>
                  </tr>
                  ${completionNotes ? `
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #475569;">Notes:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${completionNotes}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #1e40af; margin: 0 0 12px 0;">📋 What's Next:</h4>
                <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
                  <li>Your treatment is complete</li>
                  <li>Follow any care instructions provided</li>
                  <li>Schedule your next checkup if recommended</li>
                  <li>Contact us if you have any questions</li>
                </ul>
              </div>

              <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                Thank you for choosing our dental practice. We hope you have a speedy recovery!
              </p>
            </div>
          `;

          await supabase.functions.invoke('send-email-notification', {
            body: {
              to: selectedAppointment.patient.email,
              subject: emailSubject,
              message: emailMessage,
              messageType: 'appointment_completed',
              patientId: selectedAppointment.patient_id,
              dentistId: selectedAppointment.dentist_id,
              isSystemNotification: true
            }
          });
        } catch (emailError) {
          console.error('Failed to send completion email:', emailError);
        }
      }

      setShowCompleteDialog(false);
      setSelectedAppointment(null);
      setCompletionNotes("");
      setCompletionStatus('completed');

      toast({
        title: "Success",
        description: `Appointment marked as ${completionStatus}`,
      });

    } catch (error) {
      console.error('Error completing appointment:', error);
      toast({
        title: "Error",
        description: "Failed to complete appointment",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Next Appointment Card */}
      {nextAppointment ? (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Next Appointment</CardTitle>
            </div>
            <div className="flex items-center space-x-1">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Alerts</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">
                {formatClinicTime(utcToClinicTime(new Date(nextAppointment.appointment_date)), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
              </span>
            </div>

            {/* Patient Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <Label className="text-xs text-muted-foreground">Treatment Plan Phase</Label>
                <div className="text-sm font-medium">—</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Balance</Label>
                <div className="text-sm font-medium">—</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Latest Document</Label>
                <div className="text-sm font-medium">—</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Recommended Follow-up</Label>
                <div className="text-sm font-medium">—</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedAppointment(nextAppointment);
                  setShowCompleteDialog(true);
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Complete Appointment
              </Button>
              <Button variant="outline" size="sm">
                <DollarSign className="h-4 w-4 mr-2" />
                Create Payment Request
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Add Note
              </Button>
              <Button variant="outline" size="sm">
                <Pill className="h-4 w-4 mr-2" />
                Print/Send Prescription
              </Button>
            </div>

            {/* Patient Info */}
            {nextAppointment.patient && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">
                      {nextAppointment.patient.first_name} {nextAppointment.patient.last_name}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                      {nextAppointment.patient.email && (
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {nextAppointment.patient.email}
                        </div>
                      )}
                      {nextAppointment.patient.phone && (
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {nextAppointment.patient.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={nextAppointment.urgency === 'high' ? 'destructive' : 'secondary'}>
                    {nextAppointment.reason || 'General consultation'}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No upcoming appointments</p>
          </CardContent>
        </Card>
      )}

      {/* Today's Appointments */}
      {todayAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Today's Schedule ({todayAppointments.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm">
                      <div className="font-medium">
                        {formatClinicTime(utcToClinicTime(new Date(appointment.appointment_date)), 'HH:mm')}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">
                        {appointment.patient?.first_name} {appointment.patient?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {appointment.reason || 'General consultation'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={appointment.status === 'completed' ? 'default' : 'secondary'}>
                      {appointment.status}
                    </Badge>
                    {!['completed', 'no_show'].includes(appointment.status) ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setCompletionNotes("");
                          setCompletionStatus('completed');
                          setShowCompleteDialog(true);
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setCompletionNotes(appointment.consultation_notes || "");
                          setCompletionStatus(appointment.status as 'completed' | 'no_show' | 'cancelled');
                          setShowCompleteDialog(true);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Appointment Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedAppointment && ['completed', 'no_show'].includes(selectedAppointment.status) 
                ? 'Edit Appointment' 
                : 'Complete Appointment'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedAppointment && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="font-medium">
                  {selectedAppointment.patient?.first_name} {selectedAppointment.patient?.last_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatClinicTime(utcToClinicTime(new Date(selectedAppointment.appointment_date)), 'PPP \'at\' p')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedAppointment.reason || 'General consultation'}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="completion-status">Status</Label>
              <Select value={completionStatus} onValueChange={(value: 'completed' | 'no_show' | 'cancelled') => setCompletionStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed Successfully</SelectItem>
                  <SelectItem value="no_show">Patient No-Show</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="completion-notes">Consultation Notes (Optional)</Label>
              <Textarea
                id="completion-notes"
                placeholder="Add any notes about the consultation..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCompleteDialog(false);
                  setSelectedAppointment(null);
                  setCompletionNotes("");
                  setCompletionStatus('completed');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCompleteAppointment}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {selectedAppointment && ['completed', 'no_show'].includes(selectedAppointment.status) 
                  ? 'Update Appointment' 
                  : 'Complete Appointment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}