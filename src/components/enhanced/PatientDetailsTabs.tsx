import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Calendar,
  ClipboardList,
  Pill,
  CreditCard,
  User,
  Plus,
  CheckCircle,
  X,
  Eye,
  AlertCircle
} from "lucide-react";
import { SimpleAppointmentBooking } from "@/components/SimpleAppointmentBooking";
import { PatientPaymentHistory } from "@/components/PatientPaymentHistory";
import { PrescriptionManager } from "@/components/PrescriptionManager";
import { TreatmentPlanManager } from "@/components/TreatmentPlanManager";
import { AppointmentCompletionDialog } from "@/components/appointment/AppointmentCompletionDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Appointment {
  id: string;
  appointment_date: string;
  duration_minutes: number;
  status: string;
  urgency: string;
  reason?: string;
  consultation_notes?: string;
  patient_id: string;
  dentist_id: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  medical_history?: string;
  emergency_contact?: string;
}

interface PatientDetailsTabsProps {
  selectedPatient: Patient;
  dentistId: string;
  appointments: Appointment[];
  onRefresh: () => void;
}

export function PatientDetailsTabs({ selectedPatient, dentistId, appointments, onRefresh }: PatientDetailsTabsProps) {
  const { toast } = useToast();
  const [completingAppointment, setCompletingAppointment] = useState<Appointment | null>(null);
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCancelAppointment = async () => {
    if (!cancellingAppointment) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', cancellingAppointment.id);

      if (error) throw error;

      toast({
        title: "Appointment cancelled",
        description: "The appointment has been cancelled successfully.",
      });

      onRefresh();
      setCancellingAppointment(null);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const upcomingAppointments = appointments
    .filter(a => new Date(a.appointment_date) >= new Date() && a.status !== 'cancelled' && a.status !== 'completed')
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());

  const pastAppointments = appointments
    .filter(a => a.status === 'completed' || new Date(a.appointment_date) < new Date())
    .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());

  return (
    <>
      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="appointments" className="text-xs sm:text-sm">
            <Calendar className="h-4 w-4 mr-1" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="treatments" className="text-xs sm:text-sm">
            <ClipboardList className="h-4 w-4 mr-1" />
            Treatments
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="text-xs sm:text-sm">
            <Pill className="h-4 w-4 mr-1" />
            Prescriptions
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-xs sm:text-sm">
            <CreditCard className="h-4 w-4 mr-1" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="info" className="text-xs sm:text-sm">
            <User className="h-4 w-4 mr-1" />
            Info
          </TabsTrigger>
        </TabsList>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-6">
          {/* Upcoming Appointments */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Appointments
                <Badge variant="secondary" className="rounded-full">{upcomingAppointments.length}</Badge>
              </h3>
              <SimpleAppointmentBooking 
                dentistId={dentistId}
                patientId={selectedPatient.id}
                patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
                onSuccess={onRefresh}
              />
            </div>
            
            {upcomingAppointments.length === 0 ? (
              <Card className="p-8 text-center bg-muted/30">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No upcoming appointments</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Schedule a new appointment above</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <Card key={apt.id} className="p-4 hover:shadow-elegant transition-all duration-200 border-l-4 border-l-primary">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge className="bg-blue-500 text-white">
                            {apt.status}
                          </Badge>
                          <Badge variant="outline" className={
                            apt.urgency === 'high' ? 'border-red-500 text-red-500' :
                            apt.urgency === 'medium' ? 'border-yellow-500 text-yellow-500' :
                            'border-green-500 text-green-500'
                          }>
                            {apt.urgency} urgency
                          </Badge>
                          <span className="text-base font-semibold">
                            {format(new Date(apt.appointment_date), 'EEEE, MMM d')}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            at {format(new Date(apt.appointment_date), 'h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{apt.reason || 'General consultation'}</p>
                        {apt.consultation_notes && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-2 p-2 bg-muted/50 rounded">
                            {apt.consultation_notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="gap-2"
                          onClick={() => setCompletingAppointment(apt)}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Complete
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setCancellingAppointment(apt)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Past Appointments */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              Past Appointments
              <Badge variant="secondary" className="rounded-full">{pastAppointments.length}</Badge>
            </h3>
            
            {pastAppointments.length === 0 ? (
              <Card className="p-8 text-center bg-muted/30">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No past appointments</p>
              </Card>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {pastAppointments.map((apt) => (
                  <Card key={apt.id} className="p-4 hover:shadow-md transition-shadow bg-muted/30">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge className={
                            apt.status === 'completed' ? 'bg-green-500 text-white' :
                            apt.status === 'cancelled' ? 'bg-red-500 text-white' :
                            'bg-gray-500 text-white'
                          }>
                            {apt.status}
                          </Badge>
                          <span className="text-sm font-medium">
                            {format(new Date(apt.appointment_date), 'MMM d, yyyy')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(apt.appointment_date), 'h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm">{apt.reason || 'General consultation'}</p>
                        {apt.consultation_notes && (
                          <p className="text-xs text-muted-foreground line-clamp-2 p-2 bg-background/50 rounded">
                            {apt.consultation_notes}
                          </p>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Treatment Plans Tab */}
        <TabsContent value="treatments" className="space-y-4">
          <TreatmentPlanManager 
            patientId={selectedPatient.id}
            dentistId={dentistId}
          />
        </TabsContent>

        {/* Prescriptions Tab */}
        <TabsContent value="prescriptions" className="space-y-4">
          <PrescriptionManager 
            dentistId={dentistId}
          />
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <PatientPaymentHistory 
            patientId={selectedPatient.id}
          />
        </TabsContent>

        {/* Patient Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Patient Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-base mt-1">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-base mt-1">{selectedPatient.email}</p>
                </div>
                {selectedPatient.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-base mt-1">{selectedPatient.phone}</p>
                  </div>
                )}
                {selectedPatient.date_of_birth && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                    <p className="text-base mt-1">{format(new Date(selectedPatient.date_of_birth), 'PPP')}</p>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {selectedPatient.address && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <p className="text-base mt-1">{selectedPatient.address}</p>
                  </div>
                )}
                {selectedPatient.emergency_contact && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Emergency Contact</label>
                    <p className="text-base mt-1">{selectedPatient.emergency_contact}</p>
                  </div>
                )}
                {selectedPatient.medical_history && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Medical History</label>
                    <p className="text-base mt-1 whitespace-pre-wrap">{selectedPatient.medical_history}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Completion Dialog */}
      {completingAppointment && (
        <AppointmentCompletionDialog
          open={!!completingAppointment}
          onOpenChange={(open) => !open && setCompletingAppointment(null)}
          appointment={{
            ...completingAppointment,
            patient: {
              first_name: selectedPatient.first_name,
              last_name: selectedPatient.last_name,
              email: selectedPatient.email,
            }
          }}
          onCompleted={() => {
            onRefresh();
            setCompletingAppointment(null);
          }}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancellingAppointment} onOpenChange={(open) => !open && setCancellingAppointment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Cancel Appointment?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment for{' '}
              <span className="font-semibold">
                {format(new Date(cancellingAppointment?.appointment_date || new Date()), 'PPP p')}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelAppointment}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? 'Cancelling...' : 'Yes, Cancel Appointment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
