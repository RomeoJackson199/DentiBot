import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, User as UserIcon, MapPin, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay } from "date-fns";

interface CalendarViewProps {
  user: User;
}

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  urgency: string;
  reason: string;
  dentists: {
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

export const CalendarView = ({ user }: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState<Date>();
  const [newTime, setNewTime] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    loadAppointments();
  }, [user.id]);

  const loadAppointments = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          dentists (
            profiles (first_name, last_name)
          )
        `)
        .eq("patient_id", profile.id)
        .order("appointment_date", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error loading appointments:", error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.appointment_date), date)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleReschedule = async () => {
    if (!selectedAppointment || !newDate || !newTime) {
      toast({
        title: "Missing Information",
        description: "Please select a new date and time",
        variant: "destructive",
      });
      return;
    }

    try {
      const appointmentDateTime = new Date(newDate);
      const [hours, minutes] = newTime.split(":");
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

      const { error } = await supabase
        .from("appointments")
        .update({ 
          appointment_date: appointmentDateTime.toISOString(),
          status: 'pending'
        })
        .eq("id", selectedAppointment.id);

      if (error) throw error;

      toast({
        title: "Appointment Rescheduled",
        description: `Your appointment has been moved to ${format(appointmentDateTime, 'PPP')} at ${newTime}`,
      });

      setRescheduleDialogOpen(false);
      setSelectedAppointment(null);
      setNewDate(undefined);
      setNewTime("");
      loadAppointments();
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      toast({
        title: "Error",
        description: "Failed to reschedule appointment",
        variant: "destructive",
      });
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: 'cancelled' })
        .eq("id", appointmentId);

      if (error) throw error;

      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled",
      });

      loadAppointments();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive",
      });
    }
  };

  const availableTimes = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

  const selectedDateAppointments = getAppointmentsForDate(selectedDate);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="lg:col-span-2 h-96 bg-muted rounded-lg"></div>
        <div className="h-96 bg-muted rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">Manage your appointments</p>
        </div>
        <Button>
          <CalendarIcon className="h-4 w-4 mr-2" />
          Book New Appointment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border w-full"
              modifiers={{
                hasAppointment: (date) => getAppointmentsForDate(date).length > 0
              }}
              modifiersStyles={{
                hasAppointment: { 
                  background: 'hsl(var(--primary))', 
                  color: 'hsl(var(--primary-foreground))',
                  fontWeight: 'bold'
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Day View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              {format(selectedDate, 'EEEE, MMMM d')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateAppointments.length === 0 ? (
              <div className="text-center py-6">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No appointments this day</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Book Appointment
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateAppointments.map((appointment) => (
                  <div key={appointment.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {format(new Date(appointment.appointment_date), 'HH:mm')}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center">
                            <UserIcon className="h-3 w-3 mr-1" />
                            Dr {appointment.dentists?.profiles?.first_name} {appointment.dentists?.profiles?.last_name}
                          </p>
                          {appointment.reason && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {appointment.reason}
                            </p>
                          )}
                          <div className="flex space-x-2 mt-2">
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                            <Badge className={getUrgencyColor(appointment.urgency)}>
                              {appointment.urgency}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedAppointment(appointment)}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Appointment Actions</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="font-medium">
                                Dr {appointment.dentists?.profiles?.first_name} {appointment.dentists?.profiles?.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(appointment.appointment_date), 'PPP')} at{' '}
                                {format(new Date(appointment.appointment_date), 'HH:mm')}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => setRescheduleDialogOpen(true)}
                                disabled={appointment.status === 'completed' || appointment.status === 'cancelled'}
                              >
                                Reschedule
                              </Button>
                              <Button 
                                variant="destructive" 
                                className="flex-1"
                                onClick={() => handleCancelAppointment(appointment.id)}
                                disabled={appointment.status === 'completed' || appointment.status === 'cancelled'}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Date</label>
              <Calendar
                mode="single"
                selected={newDate}
                onSelect={setNewDate}
                disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                className="rounded-md border mt-2"
              />
            </div>
            {newDate && (
              <div>
                <label className="text-sm font-medium">New Time</label>
                <Select value={newTime} onValueChange={setNewTime}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimes.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex space-x-2">
              <Button onClick={handleReschedule} disabled={!newDate || !newTime}>
                Confirm Reschedule
              </Button>
              <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};