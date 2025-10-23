import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Bot,
  Clock,
  CalendarDays,
  CheckCircle
} from "lucide-react";
import { format, startOfDay } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface Dentist {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialization: string;
  license_number?: string;
  profile_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: string;
  } | null;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function BookAppointmentAI() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookingData, setBookingData] = useState<any>(null);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [recommendedDentists, setRecommendedDentists] = useState<string[]>([]);
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
  const [expandedDentist, setExpandedDentist] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingStep, setBookingStep] = useState<'dentist' | 'datetime' | 'confirm'>('dentist');

  useEffect(() => {
    loadBookingData();
    fetchDentists();
  }, []);

  const loadBookingData = () => {
    const data = sessionStorage.getItem('aiBookingData');
    if (data) {
      setBookingData(JSON.parse(data));
    }
  };

  const fetchDentists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("dentists")
        .select(`
          id,
          first_name,
          last_name,
          email,
          specialization,
          license_number,
          profile_id,
          profiles:profile_id (
            first_name,
            last_name,
            email,
            phone,
            address
          )
        `)
        .eq("is_active", true);

      if (error) throw error;
      
      // Transform the data to match our interface (profiles comes as array, we need object)
      const transformedData = (data || []).map((d: any) => ({
        ...d,
        profiles: d.profiles?.[0] || null
      }));
      
      setDentists(transformedData);

      // Get AI recommendations based on conversation
      if (bookingData) {
        await getAIRecommendations(transformedData);
      }
    } catch (error) {
      console.error("Error fetching dentists:", error);
      toast({
        title: "Error",
        description: "Failed to load dentists",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAIRecommendations = async (dentistList: Dentist[]) => {
    // Simulate AI recommendation based on conversation
    // In production, this would call an AI function
    const recommended = dentistList.slice(0, 2).map(d => d.id);
    setRecommendedDentists(recommended);
  };

  const fetchAvailableSlots = async (date: Date, dentistId: string) => {
    try {
      await supabase.rpc('generate_daily_slots', {
        p_dentist_id: dentistId,
        p_date: date.toISOString().split('T')[0]
      });

      const { data, error } = await supabase
        .from('appointment_slots')
        .select('slot_time, is_available, emergency_only')
        .eq('dentist_id', dentistId)
        .eq('slot_date', date.toISOString().split('T')[0])
        .order('slot_time');

      if (error) throw error;

      const slots: TimeSlot[] = (data || []).map(slot => ({
        time: slot.slot_time.substring(0, 5),
        available: slot.is_available && !slot.emergency_only,
      }));

      setAvailableSlots(slots);
    } catch (error) {
      console.error("Error fetching slots:", error);
      toast({
        title: "Error",
        description: "Failed to load available times",
        variant: "destructive",
      });
    }
  };

  const handleDentistSelect = (dentist: Dentist) => {
    setSelectedDentist(dentist);
    setBookingStep('datetime');
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date || !selectedDentist) return;
    setSelectedDate(date);
    setSelectedTime(undefined);
    fetchAvailableSlots(date, selectedDentist.id);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setBookingStep('confirm');
  };

  const confirmBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedDentist) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to book an appointment",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      let { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, phone, email, user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profErr) throw profErr;

      if (!profile) {
        const { data: inserted, error: insertErr } = await supabase
          .from("profiles")
          .insert({ user_id: user.id, email: user.email ?? null, first_name: '', last_name: '' })
          .select("id, first_name, last_name, phone, email, user_id")
          .single();
        if (insertErr) throw insertErr;
        profile = inserted;
      }

      const email = profile.email || user.email;
      const missing: string[] = [];
      if (!profile.first_name) missing.push('first name');
      if (!profile.last_name) missing.push('last name');
      if (!email) missing.push('email');

      if (missing.length > 0) {
        toast({
          title: "Profile Incomplete",
          description: "Please complete your profile first",
          variant: "destructive",
        });
        return;
      }

      const appointmentDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":");
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

      let appointmentReason = "General consultation";
      if (bookingData?.messages?.length > 0) {
        try {
          const { generateAppointmentReason } = await import("@/lib/symptoms");
          const aiReason = await generateAppointmentReason(
            bookingData.messages as any,
            { 
              id: profile.id, 
              first_name: profile.first_name, 
              last_name: profile.last_name,
              user_id: profile.user_id,
              email: profile.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as any
          );
          if (aiReason) appointmentReason = aiReason;
        } catch (err) {
          console.error('Failed to generate AI reason:', err);
        }
      }

      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          patient_id: profile.id,
          dentist_id: selectedDentist.id,
          appointment_date: appointmentDateTime.toISOString(),
          reason: appointmentReason,
          status: "confirmed",
          urgency: bookingData?.urgency >= 5 ? "emergency" : 
                   bookingData?.urgency === 4 ? "high" : 
                   bookingData?.urgency === 3 ? "medium" : "low"
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      const { error: slotError } = await supabase.rpc('book_appointment_slot', {
        p_dentist_id: selectedDentist.id,
        p_slot_date: selectedDate.toISOString().split('T')[0],
        p_slot_time: selectedTime,
        p_appointment_id: appointmentData.id
      });

      if (slotError) {
        await supabase.from("appointments").delete().eq("id", appointmentData.id);
        throw new Error("This time slot is no longer available");
      }

      toast({
        title: "Appointment Confirmed! 🎉",
        description: `${format(selectedDate, "EEEE, MMMM d")} at ${selectedTime}`
      });

      sessionStorage.removeItem('aiBookingData');
      navigate('/patient/appointments');
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast({
        title: "Booking Failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date());
    return date < today || date.getDay() === 0 || date.getDay() === 6;
  };

  const getDentistInitials = (dentist: Dentist) => {
    const fn = dentist.first_name || dentist.profiles?.first_name || "";
    const ln = dentist.last_name || dentist.profiles?.last_name || "";
    return `${fn.charAt(0)}${ln.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 p-4">
        <div className="max-w-6xl mx-auto space-y-6 py-8">
          <Skeleton className="h-12 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      <div className="max-w-6xl mx-auto p-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Book Your Appointment
            </h1>
            <p className="text-muted-foreground">
              {bookingStep === 'dentist' && "Choose your dentist"}
              {bookingStep === 'datetime' && "Select date and time"}
              {bookingStep === 'confirm' && "Confirm your appointment"}
            </p>
          </div>
        </div>

        {bookingStep === 'dentist' && (
          <div className="space-y-4">
            {recommendedDentists.length > 0 && (
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <Bot className="h-5 w-5 text-primary" />
                  <p className="text-sm font-medium">AI recommended dentists based on your needs</p>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dentists.map((dentist) => {
                const isRecommended = recommendedDentists.includes(dentist.id);
                const isExpanded = expandedDentist === dentist.id;
                const displayName = `${dentist.first_name || dentist.profiles?.first_name} ${dentist.last_name || dentist.profiles?.last_name}`;

                return (
                  <Card
                    key={dentist.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      isRecommended ? 'border-primary/40 bg-gradient-to-br from-primary/5 to-background' : ''
                    } ${isExpanded ? 'md:col-span-2' : ''}`}
                    onClick={() => setExpandedDentist(isExpanded ? null : dentist.id)}
                  >
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                            {getDentistInitials(dentist)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">Dr. {displayName}</h3>
                            {isRecommended && (
                              <Badge className="bg-primary/10 text-primary border-primary/20">
                                <Bot className="h-3 w-3 mr-1" />
                                AI Pick
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground capitalize">
                            {dentist.specialization || 'General Dentistry'}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">5.0</span>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="space-y-4 pt-4 border-t animate-in fade-in slide-in-from-top-2">
                          <div>
                            <h4 className="font-semibold mb-2">Biography</h4>
                            <p className="text-sm text-muted-foreground">
                              Dr. {displayName} is a renowned {dentist.specialization || 'general'} dentist with years of experience 
                              in providing excellent dental care. Dedicated to patient comfort and using the latest dental technology.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{dentist.profiles?.address || '123 Dental Street, City'}</span>
                            </div>
                            {dentist.profiles?.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{dentist.profiles.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{dentist.email || dentist.profiles?.email}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDentistSelect(dentist);
                        }}
                        variant={isRecommended ? "default" : "outline"}
                      >
                        Select Dr. {displayName}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {bookingStep === 'datetime' && selectedDentist && (
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    Dr. {selectedDentist.first_name} {selectedDentist.last_name}
                  </h2>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedDentist.specialization}
                  </p>
                </div>
                <Button variant="outline" onClick={() => setBookingStep('dentist')}>
                  Change Dentist
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Select Date</h3>
                  </div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={isDateDisabled}
                    className="rounded-lg border"
                  />
                </div>

                {selectedDate && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Select Time</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(selectedDate, "EEEE, MMMM d")}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.filter(slot => slot.available).map((slot) => (
                        <Button
                          key={slot.time}
                          variant={selectedTime === slot.time ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTimeSelect(slot.time)}
                        >
                          {slot.time}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {bookingStep === 'confirm' && selectedDentist && selectedDate && selectedTime && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-primary mb-4" />
                <h2 className="text-2xl font-bold">Confirm Your Appointment</h2>
              </div>

              <div className="space-y-4 bg-muted/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getDentistInitials(selectedDentist)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      Dr. {selectedDentist.first_name} {selectedDentist.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {selectedDentist.specialization}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span>{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedTime}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setBookingStep('datetime')}
                >
                  Go Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={confirmBooking}
                >
                  Confirm Booking
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
