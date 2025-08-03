import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, User as UserIcon, MapPin, Phone, AlertCircle, Calendar, X, Users, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatedCard } from "@/components/ui/animated-card";
import { toast } from "sonner";
import useEmblaCarousel from 'embla-carousel-react';
import { useLanguage } from "@/hooks/useLanguage";
import { ReviewDialog } from "@/components/ReviewDialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

interface Appointment {
  id: string;
  appointment_date: string;
  reason: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  notes?: string;
  dentist: {
    id: string;
    specialty?: string;
    profile: {
      id: string;
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
  const { t, language } = useLanguage();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [reviewedAppointments, setReviewedAppointments] = useState<Set<string>>(new Set());

  // Move carousel hook to top to avoid conditional hook calls
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start', 
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 2 }
    }
  });

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

      setProfileId(profile.id);

      // Fetch existing reviews for this patient
      const { data: reviewData } = await supabase
        .from("reviews")
        .select("appointment_id")
        .eq("patient_id", profile.id);
      if (reviewData) {
        setReviewedAppointments(new Set(reviewData.map(r => r.appointment_id)));
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
            specialty,
            profiles:profile_id (
              id,
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
          specialty: apt.dentists.specialty,
          profile: {
            id: apt.dentists.profiles.id,
            first_name: apt.dentists.profiles.first_name,
            last_name: apt.dentists.profiles.last_name,
            phone: apt.dentists.profiles.phone
          }
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

  const cancelAppointment = async (appointmentId: string) => {
    try {
      // First release the appointment slot
      const { error: slotError } = await supabase.rpc('release_appointment_slot', {
        p_appointment_id: appointmentId
      });

      if (slotError) {
        console.error("Error releasing slot:", slotError);
        // Continue with cancellation even if slot release fails
      }

      // Cancel the appointment
      const { data, error } = await supabase.rpc('cancel_appointment', {
        appointment_id: appointmentId,
        user_id: user.id
      });

      if (error) throw error;

      if (data) {
        toast.success(t.appointmentCancelled);
        fetchAppointments(); // Refresh the list
      } else {
        toast.error(t.failedToCancelAppointment);
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error(t.failedToCancelAppointment);
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
    const locale = language === 'en' ? 'en-US' : language === 'fr' ? 'fr-FR' : 'nl-NL';
    return {
      date: date.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: language === 'en'
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
        <CardHeader className="bg-gradient-primary text-white rounded-t-xl p-4 sm:p-6">
          <CardTitle className="flex items-center justify-between text-xl sm:text-2xl font-bold">
            <div className="flex items-center">
              <CalendarDays className="h-6 w-6 sm:h-7 sm:w-7 mr-2 sm:mr-3" />
              <span>{t.myAppointments}</span>
            </div>
            <Button
              size="sm"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-8 sm:h-9"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t.newAppointment}</span>
              <span className="sm:hidden">+</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-dental-primary/30 border-t-dental-primary"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-dental-primary animate-pulse" />
              </div>
            </div>
            <span className="ml-3 sm:ml-4 text-dental-muted-foreground text-base sm:text-lg">{t.loading}</span>
          </div>
        </CardContent>
      </div>
    );
  }

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

  return (
    <div className="space-y-6 sm:space-y-8 px-2 sm:px-0">
      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div className="w-full max-w-5xl mx-auto floating-card animate-fade-in">
          <CardHeader className="bg-gradient-primary text-white rounded-t-xl p-4 sm:p-6">
            <CardTitle className="flex items-center justify-between text-xl sm:text-2xl font-bold">
              <div className="flex items-center">
                <CalendarDays className="h-6 w-6 sm:h-7 sm:w-7 mr-2 sm:mr-3" />
                <span className="text-base sm:text-2xl">{t.upcomingAppointments} ({upcomingAppointments.length})</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-8">
            <div className="relative">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex gap-4 sm:gap-6">
                  {upcomingAppointments.map((appointment, index) => {
                    const { date, time } = formatDateTime(appointment.appointment_date);
                    return (
                      <div key={appointment.id} className="flex-none w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
                        <Card className="border-l-4 border-l-dental-primary floating-card animate-slide-in h-full" style={{ animationDelay: `${index * 0.1}s` }}>
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex justify-between items-start mb-3 sm:mb-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                  <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-dental-primary flex-shrink-0" />
                                  <span className="font-semibold text-sm sm:text-lg truncate">{date}</span>
                                  <Badge className={`${getStatusColor(appointment.status)} text-xs flex-shrink-0`}>
                                    {appointment.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-dental-secondary flex-shrink-0" />
                                  <span className="text-dental-secondary font-medium text-sm sm:text-base">{time}</span>
                                  <Badge variant="outline" className={`${getUrgencyColor(appointment.urgency)} text-xs flex-shrink-0`}>
                                    {appointment.urgency}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-3 sm:space-y-4">
                              <div>
                                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                  <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-dental-muted-foreground flex-shrink-0" />
                                  <span className="font-semibold text-sm sm:text-lg truncate">
                                    Dr. {appointment.dentist.profile.first_name} {appointment.dentist.profile.last_name}
                                  </span>
                                </div>
                                  {appointment.dentist.specialty && (
                                    <div className="flex items-center gap-2 mb-2">
                                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-dental-muted-foreground flex-shrink-0" />
                                      <span className="text-xs sm:text-sm text-dental-muted-foreground truncate">
                                        {appointment.dentist.specialty}
                                      </span>
                                    </div>
                                  )}
                                {appointment.dentist.profile.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-dental-muted-foreground flex-shrink-0" />
                                    <span className="text-xs sm:text-sm text-dental-muted-foreground">
                                      {appointment.dentist.profile.phone}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div>
                                <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-lg">{t.appointmentDetails}</h4>
                                <div className="space-y-2 sm:space-y-3">
                                  <div>
                                    <h5 className="font-medium text-dental-primary mb-1 text-xs sm:text-sm">Patient</h5>
                                    <p className="text-dental-muted-foreground flex items-center gap-2 text-xs sm:text-sm">
                                      {(appointment as any).patient_name ? (
                                        <>
                                          <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                          <span className="truncate">
                                            {(appointment as any).patient_name} 
                                            {(appointment as any).patient_age && ` (${(appointment as any).patient_age} years old)`}
                                            {(appointment as any).patient_relationship && ` - ${(appointment as any).patient_relationship}`}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                          <span>You</span>
                                        </>
                                      )}
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <h5 className="font-medium text-dental-primary mb-1 text-xs sm:text-sm">{t.consultationReason}</h5>
                                    <p className="text-dental-muted-foreground text-xs sm:text-sm line-clamp-2">
                                      {appointment.reason || t.generalConsultation}
                                    </p>
                                  </div>
                                  
                                  {appointment.notes && (
                                    <div>
                                      <h5 className="font-medium text-dental-primary mb-1 text-xs sm:text-sm">Notes</h5>
                                      <p className="text-xs text-dental-muted-foreground line-clamp-2">{appointment.notes}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            {appointment.status === 'pending' && (
                              <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-dental-primary/10">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="flex items-center gap-1 sm:gap-2 border-red-300 text-red-600 hover:bg-red-50 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-9"
                                    >
                                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                      <span className="hidden sm:inline">{t.cancelAppointment}</span>
                                      <span className="sm:hidden">{t.cancelAppointment}</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="mx-4">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{t.confirmCancellation}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {t.confirmCancellationMessage}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{t.keepAppointment}</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => cancelAppointment(appointment.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        {t.yesCancelAppointment}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Navigation Buttons */}
              {upcomingAppointments.length > 1 && (
                <div className="flex justify-center gap-2 mt-4 sm:mt-6">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={scrollPrev}
                    className="w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-full border-dental-primary/30 text-dental-primary hover:bg-dental-primary/10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={scrollNext}
                    className="w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-full border-dental-primary/30 text-dental-primary hover:bg-dental-primary/10"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </div>
      )}

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div className="w-full max-w-5xl mx-auto floating-card animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <CardHeader className="bg-gradient-card text-dental-muted-foreground rounded-t-xl">
            <CardTitle className="flex items-center text-2xl font-bold">
              <CalendarDays className="h-7 w-7 mr-3" />
              {t.appointmentHistory} ({pastAppointments.length})
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
                          {appointment.reason || t.generalConsultation}
                        </p>
                        {appointment.status === 'completed' && profileId && (
                          reviewedAppointments.has(appointment.id) ? (
                            <p className="text-xs text-dental-muted-foreground mt-2">Feedback submitted</p>
                          ) : (
                            <div className="mt-2">
                              <ReviewDialog
                                appointmentId={appointment.id}
                                dentistId={appointment.dentist.profile.id}
                                patientId={profileId}
                                onSubmitted={() =>
                                  setReviewedAppointments(prev => new Set(prev).add(appointment.id))
                                }
                              />
                            </div>
                          )
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

      {/* No Appointments */}
      {appointments.length === 0 && (
        <div className="w-full max-w-5xl mx-auto floating-card animate-scale-in">
          <CardContent className="text-center py-16">
            <div className="relative mb-8">
              <div className="pulse-ring w-32 h-32 -top-8 -left-8 mx-auto"></div>
              <CalendarDays className="h-20 w-20 text-dental-muted-foreground mx-auto animate-float" />
            </div>
            <h3 className="text-3xl font-bold gradient-text mb-4">
              {t.noUpcomingAppointments}
            </h3>
            <p className="text-dental-muted-foreground mb-8 text-lg max-w-md mx-auto">
              {t.noPastAppointments}
            </p>
            <Button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-gradient-primary text-white px-8 py-3 text-lg rounded-xl shadow-glow hover:shadow-elegant hover:scale-105 transition-all duration-300"
            >
              <Calendar className="h-5 w-5 mr-2" />
              {t.bookAppointment}
            </Button>
          </CardContent>
        </div>
      )}
    </div>
  );
};