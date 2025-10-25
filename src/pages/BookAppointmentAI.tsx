import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getCurrentBusinessId } from "@/lib/businessScopedSupabase";
import { Button } from "@/components/ui/button";
import { AppointmentSuccessDialog } from "@/components/AppointmentSuccessDialog";
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
import ClinicMap from "@/components/Map";

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
    bio?: string;
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
const [showSuccessDialog, setShowSuccessDialog] = useState(false);
const [successDetails, setSuccessDetails] = useState<{ date: string; time: string; dentist?: string; reason?: string } | undefined>(undefined);

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
      // Get selected business from localStorage
      const selectedBusinessId = localStorage.getItem("selected_business_id");
      
      console.log("Fetching dentists, selected business:", selectedBusinessId);

      let data, error;

      if (selectedBusinessId) {
        // Get dentists for this specific business through business_members
        const { data: memberData, error: memberError } = await supabase
          .from("business_members")
          .select(`
            profile_id,
            profiles:profile_id (
              id,
              first_name,
              last_name,
              email,
              phone,
              address
            )
          `)
          .eq("business_id", selectedBusinessId);

        if (memberError) {
          console.error("Error fetching business members:", memberError);
          throw memberError;
        }

        console.log("Business members found:", memberData?.length || 0);

        // Get dentist records for these profiles
        const profileIds = memberData?.map(m => m.profile_id) || [];
        
        if (profileIds.length === 0) {
          console.warn("No business members found for this clinic");
          toast({
            title: "No Dentists Available",
            description: "This clinic doesn't have any dentists registered yet.",
            variant: "destructive",
          });
          setDentists([]);
          setLoading(false);
          return;
        }

        console.log("Fetching dentists for profile IDs:", profileIds);
        
        const dentistResult = await supabase
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
              address,
              bio
            )
          `)
          .eq("is_active", true)
          .in("profile_id", profileIds);

        data = dentistResult.data;
        error = dentistResult.error;
      } else {
        // No business selected - show all active dentists
        console.log("No business selected, showing all dentists");
        
        const dentistResult = await supabase
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
              address,
              bio
            )
          `)
          .eq("is_active", true);

        data = dentistResult.data;
        error = dentistResult.error;
      }

      if (error) {
        console.error("Error fetching dentists:", error);
        throw error;
      }

      console.log("Dentists found:", data?.length || 0);
      
      // Normalize nested profile
      const transformedData = (data || []).map((d: any) => ({
        ...d,
        profiles: Array.isArray(d.profiles) ? d.profiles[0] : (d.profiles || null),
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

      // Determine business_id: prefer the slot's business, fallback to provider mapping, then session
      const dateStr = selectedDate.toISOString().split('T')[0];

      let businessId: string | null = null;

      // 1) Try from the selected slot
      const { data: slotRow, error: slotErr } = await supabase
        .from('appointment_slots')
        .select('business_id')
        .eq('dentist_id', selectedDentist.id)
        .eq('slot_date', dateStr)
        .eq('slot_time', selectedTime)
        .maybeSingle();
      if (!slotErr && slotRow?.business_id) {
        businessId = slotRow.business_id as string;
      }

      // 2) Fallback to provider -> business mapping
      if (!businessId) {
        const { data: pbm, error: pbmError } = await supabase
          .from('provider_business_map')
          .select('business_id')
          .eq('provider_id', selectedDentist.profile_id)
          .maybeSingle();
        if (!pbmError && pbm?.business_id) {
          businessId = pbm.business_id as string;
        }
      }

      // 3) Final fallback to current session business
      if (!businessId) {
        try {
          businessId = await getCurrentBusinessId();
        } catch (_) {
          // ignore
        }
      }

      if (!businessId) {
        throw new Error('Clinic not configured for this dentist');
      }

      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          patient_id: profile.id,
          dentist_id: selectedDentist.id,
          business_id: businessId,
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
        p_slot_date: dateStr,
        p_slot_time: selectedTime,
        p_appointment_id: appointmentData.id
      });

      if (slotError) {
        await supabase.from("appointments").delete().eq("id", appointmentData.id);
        throw new Error("This time slot is no longer available");
      }

      // Show success dialog with Google Calendar option
      setSuccessDetails({
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        dentist: `Dr. ${selectedDentist.first_name} ${selectedDentist.last_name}`,
        reason: appointmentReason
      });
      setShowSuccessDialog(true);

      sessionStorage.removeItem('aiBookingData');
      // Do not navigate immediately; let user choose next action in the success dialog
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
      <AppointmentSuccessDialog 
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        appointmentDetails={successDetails}
      />
      {bookingStep === 'dentist' && (
        <div className="max-w-6xl mx-auto p-4 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to chat
            </Button>
          </div>

          {recommendedDentists.length > 0 && (
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardContent className="p-3 flex items-center gap-3">
                <Bot className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">AI recommended dentists based on your needs</p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {dentists.map((dentist) => {
              const isRecommended = recommendedDentists.includes(dentist.id);
              const displayName = `${dentist.first_name || dentist.profiles?.first_name} ${dentist.last_name || dentist.profiles?.last_name}`;

              return (
                <Card
                  key={dentist.id}
                  className={`cursor-pointer transition-all hover:shadow-lg hover:border-primary/40 ${
                    isRecommended ? 'border-primary/40 ring-2 ring-primary/10' : ''
                  }`}
                  onClick={() => handleDentistSelect(dentist)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary/10 text-primary text-base">
                          {getDentistInitials(dentist)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <h3 className="font-semibold truncate">Dr. {displayName}</h3>
                          {isRecommended && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs shrink-0">
                              Best pick
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">
                          {dentist.specialization || 'General Dentistry'}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4].map((i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 opacity-50" />
                          <span className="text-xs text-muted-foreground ml-1">4.87</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {bookingStep === 'datetime' && selectedDentist && (
        <div className="max-w-7xl mx-auto p-4 py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBookingStep('dentist')}
            className="gap-2 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to list
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left side - Dentist Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary/10 text-primary text-xl">
                          {getDentistInitials(selectedDentist)}
                        </AvatarFallback>
                      </Avatar>
                      {recommendedDentists.includes(selectedDentist.id) && (
                        <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-100 text-yellow-800 border-yellow-200 text-xs px-2">
                          Best pick
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold">
                          Dr. {selectedDentist.first_name} {selectedDentist.last_name}
                        </h2>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Star className="h-4 w-4 text-blue-500" />
                      </div>
                      <p className="text-sm text-muted-foreground capitalize mb-2">
                        {selectedDentist.specialization || 'General Dentistry'}
                      </p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 opacity-50" />
                        <span className="text-sm font-medium ml-1">4.87</span>
                        <span className="text-sm text-muted-foreground ml-1">Reviews</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">In person & Online</Badge>
                    <Badge variant="secondary" className="text-xs">Consultation - $80</Badge>
                    <Badge variant="secondary" className="text-xs">Additional services</Badge>
                    <Badge variant="secondary" className="text-xs">Payment methods: Card</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Bio Section */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">Bio</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedDentist.profiles?.bio && selectedDentist.profiles.bio.trim().length > 0
                      ? selectedDentist.profiles.bio
                      : `A specialist in ${selectedDentist.specialization || 'general dentistry'}, with extensive training and experience.`}
                  </p>
                </CardContent>
              </Card>

              {/* Last Review */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Last review</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-muted">JH</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <p className="font-medium text-sm">Jessica H.</p>
                            <p className="text-xs text-muted-foreground">Warsaw | Verified</p>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star key={i} className="h-3 w-3 fill-cyan-500 text-cyan-500" />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Dr. {selectedDentist.last_name} is very kind, professional, and attentive. Other doctors often dismiss my concerns, 
                          but they took them seriously and came up with a brilliant diagnosis.
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>17 Oct, 2022</span>
                          <button className="text-primary">Report</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold">Dental Clinic</h3>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <Star key={i} className="h-3 w-3 fill-cyan-500 text-cyan-500" />
                      ))}
                      <Star className="h-3 w-3 fill-cyan-500 text-cyan-500 opacity-50" />
                      <span className="text-sm font-medium ml-1">4.87</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {selectedDentist.profiles?.address || 'Dental Street 12, Brussels, Belgium'}
                  </p>
                  <div className="w-full h-40 rounded-lg overflow-hidden">
                    <ClinicMap address={selectedDentist.profiles?.address || ''} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right side - Calendar & Time Slots */}
            <div className="lg:col-span-3">
              <Card className="sticky top-4">
                <CardContent className="p-6 space-y-6">
                  {/* Date Navigation */}
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => {}}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="font-semibold">
                      {selectedDate ? format(selectedDate, "EEE, dd MMMM") : "Select a date"}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={() => {}}>
                      <ArrowLeft className="h-4 w-4 rotate-180" />
                    </Button>
                  </div>

                  {/* Week Days */}
                  <div className="grid grid-cols-7 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                      const date = new Date();
                      date.setDate(date.getDate() + index);
                      const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                      const isDisabled = date.getDay() === 0 || date.getDay() === 6;
                      
                      return (
                        <button
                          key={day}
                          onClick={() => !isDisabled && handleDateSelect(date)}
                          disabled={isDisabled}
                          className={`flex flex-col items-center p-3 rounded-full transition-all ${
                            isSelected 
                              ? 'bg-primary text-primary-foreground' 
                              : isDisabled
                              ? 'opacity-40 cursor-not-allowed'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <span className="text-xs mb-1">{day}</span>
                          <span className="text-lg font-medium">{date.getDate()}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {availableSlots.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">Loading time slots...</p>
                      ) : availableSlots.filter(slot => slot.available).length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No available slots for this date</p>
                      ) : (
                        availableSlots.filter(slot => slot.available).map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => handleTimeSelect(slot.time)}
                            className={`w-full p-4 rounded-xl border-2 text-center font-medium transition-all ${
                              selectedTime === slot.time
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* Book Button */}
                  <Button
                    className="w-full h-12 text-base"
                    size="lg"
                    disabled={!selectedDate || !selectedTime}
                    onClick={() => setBookingStep('confirm')}
                  >
                    Book an appointment
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {bookingStep === 'confirm' && selectedDentist && selectedDate && selectedTime && (
        <div className="max-w-6xl mx-auto p-4 py-8">
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
        </div>
      )}
    </div>
  );
}
