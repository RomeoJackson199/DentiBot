import React, { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { format, isPast, isFuture, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { AppointmentBookingWidget } from "../components/AppointmentBookingWidget";
import { 
  Calendar,
  Clock,
  MapPin,
  User as UserIcon,
  CalendarPlus,
  CalendarX,
  CalendarCheck,
  Eye,
  AlertCircle,
  Loader2,
  ChevronRight,
  Video,
  Phone,
  MessageSquare,
  Navigation,
  RefreshCw
} from "lucide-react";

interface AppointmentsPageProps {
  user: User;
  onTabChange?: (tabId: string) => void;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  service_type?: string;
  reason?: string;
  dentist_id: string;
  notes?: string;
  is_video?: boolean;
  dentist?: {
    id: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    specialization?: string;
    phone?: string;
    email?: string;
  };
  location?: {
    name: string;
    address: string;
  };
}

interface IncompleteVisit {
  id: string;
  appointment_date: string;
  appointment_time?: string;
  service_type?: string;
  reason?: string;
  dentist_name?: string;
}

export const AppointmentsPage: React.FC<AppointmentsPageProps> = ({ user, onTabChange }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [incompleteVisits, setIncompleteVisits] = useState<IncompleteVisit[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 599px)");

  useEffect(() => {
    fetchAppointments();
  }, [user.id]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      // First, get the user's profile ID
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !userProfile) {
        console.error('Error fetching user profile:', profileError);
        toast({
          title: "Error",
          description: "Could not load user profile. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }

      const profileId = userProfile.id;

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          dentist:dentists(
            id,
            profiles:profile_id(first_name, last_name)
          )
        `)
        .eq('patient_id', profileId)
        .order('appointment_date', { ascending: false });

      if (error) throw error;

      if (data) {
        // Map data to add full_name and appointment_time
        const mappedData = data.map(apt => ({
          ...apt,
          appointment_time: new Date(apt.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          service_type: apt.reason || 'Consultation',
          dentist: apt.dentist ? {
            ...apt.dentist,
            full_name: apt.dentist.profiles ? `${apt.dentist.profiles.first_name} ${apt.dentist.profiles.last_name}` : 'Unknown'
          } : undefined
        }));

        // Separate upcoming and past appointments
        const upcoming = mappedData.filter(apt => 
          apt.status !== 'cancelled' && 
          apt.status !== 'completed' &&
          (apt.appointment_date > new Date().toISOString().split('T')[0] || 
           (apt.appointment_date === new Date().toISOString().split('T')[0] && !isPast(new Date(apt.appointment_date))))
        );
        
        const past = mappedData.filter(apt => 
          apt.status === 'completed' ||
          (apt.status !== 'cancelled' && 
           (apt.appointment_date < new Date().toISOString().split('T')[0] || 
            (apt.appointment_date === new Date().toISOString().split('T')[0] && isPast(new Date(apt.appointment_date)))))
        );

        // Check for incomplete visits (appointments marked as completed but missing notes)
        const incomplete = mappedData.filter(apt => 
          apt.status === 'completed' && !apt.notes
        ).map(apt => ({
          id: apt.id,
          appointment_date: apt.appointment_date,
          appointment_time: apt.appointment_time,
          service_type: apt.service_type,
          reason: apt.reason,
          dentist_name: apt.dentist?.full_name || 'Unknown'
        }));

        setUpcomingAppointments(upcoming.reverse()); // Show earliest first for upcoming
        setPastAppointments(past);
        setIncompleteVisits(incomplete);
      }

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
  };

  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowRescheduleDialog(true);
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      setCancellingId(appointmentId);
      
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully.",
      });

      // Refresh appointments
      fetchAppointments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive",
      });
    } finally {
      setCancellingId(null);
    }
  };

  const handleAddToCalendar = (appointment: Appointment) => {
    const appointmentDateTime = appointment.appointment_time ? 
      new Date(`${appointment.appointment_date}T${appointment.appointment_time}`) : 
      new Date(appointment.appointment_date);
    const endDate = new Date(appointmentDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration
    
    const event = {
      title: `Dental Appointment - ${appointment.service_type || appointment.reason || 'Consultation'}`,
      start: appointmentDateTime.toISOString(),
      end: endDate.toISOString(),
      description: `Appointment with Dr. ${appointment.dentist?.full_name || appointment.dentist?.first_name || 'Unknown'}\nService: ${appointment.service_type || appointment.reason || 'Consultation'}`,
      location: appointment.location?.address || 'Dental Clinic'
    };

    // Create .ics file for desktop
    if (!isMobile) {
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${appointmentDateTime.toISOString().replace(/[-:]/g, '').replace('.000', '')}
DTEND:${endDate.toISOString().replace(/[-:]/g, '').replace('.000', '')}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`;

      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'appointment.ics';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Calendar Event Downloaded",
        description: "Open the downloaded file to add to your calendar",
      });
    } else {
      // For mobile, use native calendar intent
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${appointmentDateTime.toISOString().replace(/[-:]/g, '').replace('.000', 'Z')}/${endDate.toISOString().replace(/[-:]/g, '').replace('.000', 'Z')}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
      window.open(googleCalendarUrl, '_blank');
    }
  };

  const handleGetDirections = (appointment: Appointment) => {
    if (appointment.location?.address) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appointment.location.address)}`;
      window.open(mapsUrl, '_blank');
    }
  };

  const AppointmentCard = ({ appointment, isPast = false }: { appointment: Appointment; isPast?: boolean }) => {
    const appointmentDateTime = appointment.appointment_time ? 
      new Date(`${appointment.appointment_date}T${appointment.appointment_time}`) : 
      new Date(appointment.appointment_date);
    const isUpcoming = isFuture(appointmentDateTime) || isToday(appointmentDateTime);
    
    return (
      <Card className={cn(
        "transition-all hover:shadow-md",
        appointment.status === 'cancelled' && "opacity-60"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-1">
              <p className="font-semibold">
                {format(new Date(appointment.appointment_date), 'EEEE, MMMM d, yyyy')}
              </p>
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                 <Clock className="h-3 w-3" />
                 <span>{appointment.appointment_time || new Date(appointment.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                {appointment.is_video && (
                  <>
                    <span>•</span>
                    <Video className="h-3 w-3" />
                    <span>Video Call</span>
                  </>
                )}
              </div>
            </div>
            <Badge variant={
              appointment.status === 'confirmed' ? 'default' :
              appointment.status === 'completed' ? 'secondary' :
              appointment.status === 'pending' ? 'outline' :
              'destructive'
            }>
              {appointment.status}
            </Badge>
          </div>

          <div className="space-y-2">
             <div className="flex items-center gap-2 text-sm">
               <UserIcon className="h-4 w-4 text-muted-foreground" />
               <span>Dr. {appointment.dentist?.full_name || appointment.dentist?.first_name || 'Unknown'}</span>
              {appointment.dentist?.specialization && (
                <span className="text-muted-foreground">• {appointment.dentist.specialization}</span>
              )}
            </div>
            
             <div className="flex items-center gap-2 text-sm">
               <CalendarCheck className="h-4 w-4 text-muted-foreground" />
               <span>{appointment.service_type || appointment.reason || 'Consultation'}</span>
             </div>

            {appointment.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{appointment.location.name}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {isUpcoming && appointment.status !== 'cancelled' && (
              <>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleReschedule(appointment)}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reschedule
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleCancel(appointment.id)}
                  disabled={cancellingId === appointment.id}
                >
                  {cancellingId === appointment.id ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <CalendarX className="h-4 w-4 mr-1" />
                  )}
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleAddToCalendar(appointment)}
                >
                  <CalendarPlus className="h-4 w-4 mr-1" />
                  Add to Calendar
                </Button>
                {!appointment.is_video && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleGetDirections(appointment)}
                  >
                    <Navigation className="h-4 w-4 mr-1" />
                    Directions
                  </Button>
                )}
                {appointment.is_video && (
                  <Button size="sm" variant="default">
                    <Video className="h-4 w-4 mr-1" />
                    Join Video
                  </Button>
                )}
              </>
            )}
            
            {isPast && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  // Navigate to Care page to view visit details
                  if (onTabChange) {
                    onTabChange('care');
                  }
                }}
              >
                <Eye className="h-4 w-4 mr-1" />
                View Visit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">Manage your dental appointments</p>
        </div>
        <Button onClick={() => setShowBookingDialog(true)}>
          <CalendarPlus className="h-4 w-4 mr-2" />
          Book New
        </Button>
      </div>

      {/* Incomplete Visits Alert */}
      {incompleteVisits.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <p className="font-medium mb-2">Awaiting Dentist Notes</p>
            <p className="text-sm">
              We're finalizing your visit summary for {incompleteVisits.length} recent appointment{incompleteVisits.length > 1 ? 's' : ''}.
              You'll be notified once the notes are ready.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Appointments */}
        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-4">No upcoming appointments</p>
                <Button onClick={() => setShowBookingDialog(true)}>
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Book Appointment
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Past Appointments */}
        <TabsContent value="past" className="space-y-4">
          {pastAppointments.length > 0 ? (
            pastAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} isPast />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No past appointments</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className={cn("max-w-4xl", isMobile && "w-full h-full max-w-none")}>
          <DialogHeader>
            <DialogTitle>Book New Appointment</DialogTitle>
            <DialogDescription>
              Select a date, time, and dentist for your appointment
            </DialogDescription>
          </DialogHeader>
          <AppointmentBookingWidget 
            user={user}
            onSuccess={() => {
              setShowBookingDialog(false);
              fetchAppointments();
              toast({
                title: "Appointment Booked",
                description: "Your appointment has been confirmed. We've sent you a confirmation email.",
              });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent className={cn("max-w-4xl", isMobile && "w-full h-full max-w-none")}>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Select a new date and time for your appointment
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <AppointmentBookingWidget 
              user={user}
              existingAppointment={selectedAppointment}
              onSuccess={() => {
                setShowRescheduleDialog(false);
                setSelectedAppointment(null);
                fetchAppointments();
                toast({
                  title: "Appointment Rescheduled",
                  description: "Your appointment has been rescheduled successfully.",
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};