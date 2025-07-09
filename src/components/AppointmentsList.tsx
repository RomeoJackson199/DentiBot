import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, User as UserIcon, MapPin, Phone, AlertCircle, Calendar } from "lucide-react";
import { AnimatedCard } from "@/components/ui/animated-card";
import { toast } from "sonner";

interface Appointment {
  id: string;
  appointment_date: string;
  reason: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  notes?: string;
  dentist: {
    id: string;
    specialization?: string;
    profile: {
      first_name: string;
      last_name: string;
      phone?: string;
    };
  };
}

interface AppointmentsListProps {
  user: User;
}

export const AppointmentsList = ({ user }: AppointmentsListProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      // Get user profile first
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return;
      }

      // Fetch appointments with dentist information
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          reason,
          status,
          urgency,
          notes,
          dentists:dentist_id (
            id,
            specialization,
            profiles:profile_id (
              first_name,
              last_name,
              phone
            )
          )
        `)
        .eq("patient_id", profile.id)
        .order("appointment_date", { ascending: true });

      if (error) {
        console.error("Error fetching appointments:", error);
        toast.error("Failed to load appointments");
        return;
      }

      // Transform the data to match our interface
      const transformedAppointments = data?.map((apt: any) => ({
        id: apt.id,
        appointment_date: apt.appointment_date,
        reason: apt.reason,
        status: apt.status,
        urgency: apt.urgency,
        notes: apt.notes,
        dentist: {
          id: apt.dentists.id,
          specialization: apt.dentists.specialization,
          profile: apt.dentists.profiles
        }
      })) || [];

      setAppointments(transformedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  const upcomingAppointments = appointments.filter(apt => isUpcoming(apt.appointment_date));
  const pastAppointments = appointments.filter(apt => !isUpcoming(apt.appointment_date));

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto floating-card animate-scale-in">
        <CardHeader className="bg-gradient-primary text-white rounded-t-xl">
          <CardTitle className="flex items-center text-2xl font-bold">
            <CalendarDays className="h-7 w-7 mr-3" />
            Mes Rendez-vous
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex items-center justify-center py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-dental-primary/30 border-t-dental-primary"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-dental-primary animate-pulse" />
              </div>
            </div>
            <span className="ml-4 text-dental-muted-foreground text-lg">Chargement des rendez-vous...</span>
          </div>
        </CardContent>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div className="w-full max-w-5xl mx-auto floating-card animate-fade-in">
          <CardHeader className="bg-gradient-primary text-white rounded-t-xl">
            <CardTitle className="flex items-center text-2xl font-bold">
              <CalendarDays className="h-7 w-7 mr-3" />
              Rendez-vous à Venir ({upcomingAppointments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            {upcomingAppointments.map((appointment, index) => {
              const { date, time } = formatDateTime(appointment.appointment_date);
              return (
                <Card key={appointment.id} className="border-l-4 border-l-dental-primary floating-card animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CalendarDays className="h-5 w-5 text-dental-primary" />
                          <span className="font-semibold text-lg">{date}</span>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="h-4 w-4 text-dental-secondary" />
                          <span className="text-dental-secondary font-medium">{time}</span>
                          <Badge variant="outline" className={getUrgencyColor(appointment.urgency)}>
                            {appointment.urgency}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <UserIcon className="h-4 w-4 text-dental-muted-foreground" />
                          <span className="font-semibold">
                            Dr. {appointment.dentist.profile.first_name} {appointment.dentist.profile.last_name}
                          </span>
                        </div>
                        {appointment.dentist.specialization && (
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-dental-muted-foreground" />
                            <span className="text-sm text-dental-muted-foreground">
                              {appointment.dentist.specialization}
                            </span>
                          </div>
                        )}
                        {appointment.dentist.profile.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-dental-muted-foreground" />
                            <span className="text-sm text-dental-muted-foreground">
                              {appointment.dentist.profile.phone}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Motif de consultation</h4>
                        <p className="text-dental-muted-foreground">
                          {appointment.reason || "Consultation générale"}
                        </p>
                        {appointment.notes && (
                          <div className="mt-3">
                            <h5 className="font-semibold text-sm mb-1">Notes</h5>
                            <p className="text-sm text-dental-muted-foreground">{appointment.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </div>
      )}

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div className="w-full max-w-5xl mx-auto floating-card animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <CardHeader className="bg-gradient-card text-dental-muted-foreground rounded-t-xl">
            <CardTitle className="flex items-center text-2xl font-bold">
              <CalendarDays className="h-7 w-7 mr-3" />
              Historique des Rendez-vous ({pastAppointments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-8">
            {pastAppointments.map((appointment, index) => {
              const { date, time } = formatDateTime(appointment.appointment_date);
              return (
                <Card key={appointment.id} className="border-l-4 border-l-gray-300 opacity-80 floating-card animate-slide-in" style={{ animationDelay: `${(index + upcomingAppointments.length) * 0.1}s` }}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{date}</span>
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-dental-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{time}</span>
                            <span>•</span>
                            <span>Dr. {appointment.dentist.profile.first_name} {appointment.dentist.profile.last_name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-dental-muted-foreground">
                          {appointment.reason || "Consultation générale"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </div>
      )}

      {/* No Appointments */}
      {appointments.length === 0 && (
        <div className="w-full max-w-5xl mx-auto floating-card animate-scale-in">
          <CardContent className="text-center py-16">
            <div className="relative mb-8">
              <div className="pulse-ring w-32 h-32 -top-8 -left-8 mx-auto"></div>
              <CalendarDays className="h-20 w-20 text-dental-muted-foreground mx-auto animate-float" />
            </div>
            <h3 className="text-3xl font-bold gradient-text mb-4">
              Aucun rendez-vous trouvé
            </h3>
            <p className="text-dental-muted-foreground mb-8 text-lg max-w-md mx-auto">
              Vous n'avez pas encore de rendez-vous programmés. Commencez dès maintenant avec notre assistant IA.
            </p>
            <Button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-gradient-primary text-white px-8 py-3 text-lg rounded-xl shadow-glow hover:shadow-elegant hover:scale-105 transition-all duration-300"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Prendre un rendez-vous
            </Button>
          </CardContent>
        </div>
      )}
    </div>
  );
};