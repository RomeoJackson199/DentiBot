import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, User as UserIcon, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay } from "date-fns";

interface DentistAgendaProps {
  user: User;
}

interface Appointment {
  id: string;
  appointment_date: string;
  patient_name: string;
  reason: string;
  status: string;
  duration_minutes: number;
  patient: {
    first_name: string;
    last_name: string;
    phone?: string;
  };
}

export function DentistAgenda({ user }: DentistAgendaProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dentistId, setDentistId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDentistProfile();
  }, [user]);

  useEffect(() => {
    if (dentistId) {
      fetchAppointments();
    }
  }, [dentistId]);

  useEffect(() => {
    if (selectedDate && allAppointments.length > 0) {
      filterAppointmentsByDate(selectedDate);
    }
  }, [selectedDate, allAppointments]);

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
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    if (!dentistId) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          patient_name,
          reason,
          status,
          duration_minutes,
          patient:patient_id (
            first_name,
            last_name,
            phone
          )
        `)
        .eq('dentist_id', dentistId)
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      setAllAppointments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    }
  };

  const filterAppointmentsByDate = (date: Date) => {
    const dayAppointments = allAppointments.filter(appointment => 
      isSameDay(new Date(appointment.appointment_date), date)
    );
    setAppointments(dayAppointments);
  };

  const hasAppointmentsOnDate = (date: Date) => {
    return allAppointments.some(appointment => 
      isSameDay(new Date(appointment.appointment_date), date)
    );
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
    return <div className="flex justify-center p-8">Loading agenda...</div>;
  }

  if (!dentistId) {
    return (
      <div className="flex justify-center p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You are not registered as a dentist. Please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Agenda</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
                modifiers={{
                  hasAppointments: (date) => hasAppointmentsOnDate(date)
                }}
                modifiersStyles={{
                  hasAppointments: { 
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'white',
                    fontWeight: 'bold'
                  }
                }}
              />
              <div className="mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span>Days with appointments</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointments List Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">
                Appointments for {format(selectedDate, 'EEEE, MMMM do, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    No appointments for this date
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Select another date or create a new appointment.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <Card key={appointment.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(new Date(appointment.appointment_date), 'HH:mm')}
                              </span>
                              <span className="text-muted-foreground">
                                ({appointment.duration_minutes} min)
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {appointment.patient_name || 
                                 `${appointment.patient?.first_name} ${appointment.patient?.last_name}`}
                              </span>
                              {appointment.patient?.phone && (
                                <span className="text-sm text-muted-foreground">
                                  • {appointment.patient.phone}
                                </span>
                              )}
                            </div>

                            {appointment.reason && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {appointment.reason}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                            
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}