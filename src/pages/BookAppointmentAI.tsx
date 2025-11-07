import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBusinessContext } from "@/hooks/useBusinessContext";
import { BusinessSelectionForPatients } from "@/components/BusinessSelectionForPatients";
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
import { ServiceSelector } from "@/components/booking/ServiceSelector";
import { logger } from '@/lib/logger';
import { AnimatedBackground, EmptyState } from "@/components/ui/polished-components";
import { clinicTimeToUtc, createAppointmentDateTimeFromStrings } from "@/lib/timezone";
import { useBusinessTemplate } from '@/hooks/useBusinessTemplate';

interface Dentist {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialization: string;
  license_number?: string;
  profile_id: string;
  clinic_address?: string;
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
  isRecommended?: boolean;
  aiScore?: number;
  aiReason?: string;
}

export default function BookAppointmentAI() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { businessId, loading: businessLoading, switchBusiness } = useBusinessContext();
  const { hasFeature, loading: templateLoading } = useBusinessTemplate();
  const hasAIChat = hasFeature('aiChat');
  const [bookingData, setBookingData] = useState<any>(null);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [recommendedDentists, setRecommendedDentists] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
  const [expandedDentist, setExpandedDentist] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [aiSlotCode, setAiSlotCode] = useState<{showSlots: string[], slotDetails: Record<string, {score: number, reason: string}>}>({ showSlots: [], slotDetails: {} });
const [bookingStep, setBookingStep] = useState<'dentist' | 'datetime' | 'confirm'>('dentist');
const [showSuccessDialog, setShowSuccessDialog] = useState(false);
const [successDetails, setSuccessDetails] = useState<{ date: string; time: string; dentist?: string; reason?: string } | undefined>(undefined);

  useEffect(() => {
    loadBookingData();
  }, []);

  useEffect(() => {
    if (!businessLoading && businessId) {
      fetchDentists();
    }
  }, [businessId, businessLoading]);

  const loadBookingData = () => {
    const data = sessionStorage.getItem('aiBookingData');
    if (data) {
      setBookingData(JSON.parse(data));
    }
  };

  const fetchDentists = async () => {
    if (!businessId) return;
    
    setLoading(true);
    try {
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
        .eq("business_id", businessId);

      if (memberError) throw memberError;

      const profileIds = memberData?.map(m => m.profile_id) || [];
      
      if (profileIds.length === 0) {
        toast({
          title: "No Dentists Available",
          description: "This clinic doesn't have any dentists registered yet.",
          variant: "destructive",
        });
        setDentists([]);
        setLoading(false);
        return;
      }
      
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

      if (dentistResult.error) throw dentistResult.error;
      
      const transformedData = (dentistResult.data || []).map((d: any) => ({
        ...d,
        profiles: Array.isArray(d.profiles) ? d.profiles[0] : (d.profiles || null),
      }));

      const dentistIds = transformedData.map(d => d.id);
      if (dentistIds.length > 0) {
        const { data: clinicSettings } = await supabase
          .from('clinic_settings')
          .select('dentist_id, address')
          .in('dentist_id', dentistIds);

        const settingsMap = new Map(clinicSettings?.map(s => [s.dentist_id, s.address]) || []);
        transformedData.forEach(d => {
          d.clinic_address = settingsMap.get(d.id) || d.profiles?.address || '';
        });
      }
      
      setDentists(transformedData);

      if (bookingData) {
        await getAIRecommendations(transformedData);
      }
    } catch (error) {
      logger.error("Error fetching dentists:", error);
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
    if (!businessId) return;

    try {
      // Use format to preserve Brussels date without UTC conversion
      const dateStr = format(date, 'yyyy-MM-dd');

      // Check schedule first; if closed, skip generation/fetch
      try {
        const dayOfWeek = date.getDay();
        const { data: availability } = await supabase
          .from('dentist_availability')
          .select('is_available')
          .eq('dentist_id', dentistId)
          .eq('business_id', businessId)
          .eq('day_of_week', dayOfWeek)
          .maybeSingle();

        if (availability && availability.is_available === false) {
          setAvailableSlots([]);
          return;
        }
      } catch (e) {
        console.warn('Availability check failed:', e);
      }

      await supabase.rpc('generate_daily_slots', {
        p_dentist_id: dentistId,
        p_date: dateStr
      });

      const { data, error } = await supabase
        .from('appointment_slots')
        .select('slot_time, is_available, emergency_only')
        .eq('dentist_id', dentistId)
        .eq('slot_date', dateStr)
        .eq('business_id', businessId)
        .order('slot_time');

      if (error) throw error;

      const slots: TimeSlot[] = (data || []).map(slot => ({
        time: slot.slot_time.substring(0, 5),
        available: slot.is_available && !slot.emergency_only,
      }));

      setAvailableSlots(slots);

      // Get AI recommendations
      const availableSlotsList = slots.filter(s => s.available);
      if (availableSlotsList.length > 0) {
        fetchAIRecommendations(date, dentistId, availableSlotsList);
      }
    } catch (error) {
      logger.error("Error fetching slots:", error);
      toast({
        title: "Error",
        description: "Failed to load available times",
        variant: "destructive",
      });
    }
  };

  const fetchAIRecommendations = async (date: Date, dentistId: string, slots: TimeSlot[]) => {
    setLoadingAI(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const dateStr = format(date, 'yyyy-MM-dd');

      const { data, error } = await supabase.functions.invoke('ai-slot-recommendations', {
        body: {
          dentistId,
          patientId: profile.id,
          date: dateStr,
          availableSlots: slots
        }
      });

      if (error) {
        console.warn('AI recommendations failed:', error);
      } else if (data?.showSlots) {
        // AI returned a code with slots to show
        console.log('AI Code received - show these slots:', data.showSlots);
        setAiSlotCode({
          showSlots: data.showSlots,
          slotDetails: data.slotDetails || {}
        });
        setShowAllSlots(false); // Reset to show only AI-selected slots
      }
    } catch (error) {
      console.warn('AI recommendations error:', error);
    } finally {
      setLoadingAI(false);
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
    if (!selectedDate || !selectedTime || !selectedDentist || !businessId) return;

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

      // Use format to preserve Brussels date without UTC conversion
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      // Create appointment with proper timezone handling
      // Parse date and time strings as Brussels timezone and convert to UTC
      const appointmentDateTime = createAppointmentDateTimeFromStrings(dateStr, selectedTime);

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
          logger.error('Failed to generate AI reason:', err);
        }
      }

      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          patient_id: profile.id,
          dentist_id: selectedDentist.id,
          business_id: businessId,
          appointment_date: appointmentDateTime.toISOString(),
          reason: selectedService?.name || appointmentReason,
          status: "confirmed",
          booking_source: "ai",
          urgency: bookingData?.urgency >= 5 ? "emergency" :
                   bookingData?.urgency === 4 ? "high" : 
                   bookingData?.urgency === 3 ? "medium" : "low",
          service_id: selectedService?.id || null,
          duration_minutes: selectedService?.duration_minutes || 60
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
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        dentist: `Dr. ${selectedDentist.first_name} ${selectedDentist.last_name}`,
        reason: appointmentReason
      });
      setShowSuccessDialog(true);

      sessionStorage.removeItem('aiBookingData');
      // Do not navigate immediately; let user choose next action in the success dialog
    } catch (error) {
      logger.error("Error booking appointment:", error);
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

  if (businessLoading || loading || templateLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 p-4">
        <div className="max-w-6xl mx-auto space-y-6 py-8">
          <Skeleton className="h-12 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If AI chat is disabled, redirect to manual booking
  if (!hasAIChat) {
    // Redirect to integrated booking inside dashboard
    try { localStorage.setItem('pd_section', 'assistant'); } catch {}
    return <Navigate to="/dashboard" replace />;
  }

  if (!businessId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 p-4">
        <div className="max-w-4xl mx-auto py-8">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Select a Clinic</h2>
              <p className="text-muted-foreground mb-6">Please select a clinic to view available dentists and book an appointment.</p>
              <BusinessSelectionForPatients 
                onSelectBusiness={(id, name) => switchBusiness(id)}
              />
            </CardContent>
          </Card>
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
          {/* Enhanced Header with Animated Background */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-cyan-950/20 rounded-2xl p-6 mb-6">
            <AnimatedBackground />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="gap-2 hover:bg-white/50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to chat
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { 
                    try { localStorage.setItem('pd_section', 'assistant'); } catch {}; 
                    window.dispatchEvent(new CustomEvent('dashboard:changeSection', { detail: { section: 'assistant' } }));
                    if (window.location.pathname !== '/dashboard') {
                      navigate('/dashboard');
                    }
                  }}
                  className="gap-2 text-muted-foreground hover:text-primary hover:bg-white/50"
                >
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden sm:inline">Switch to Classic Booking</span>
                </Button>
              </div>

              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl shadow-lg animate-pulse">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                    AI-Powered Booking
                  </h1>
                </div>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  {recommendedDentists.length > 0
                    ? "We've selected the best dentists based on your conversation"
                    : "Choose your preferred dentist and schedule a convenient time"}
                </p>
              </div>
            </div>
          </div>

          {recommendedDentists.length > 0 && (
            <Card className="border-blue-500/30 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/30 dark:to-cyan-950/30 shadow-md">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">AI Recommendations</p>
                  <p className="text-xs text-muted-foreground">These dentists best match your needs based on our conversation</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Service Selection */}
          {businessId && (
            <ServiceSelector
              businessId={businessId}
              selectedServiceId={selectedService?.id || null}
              onSelectService={setSelectedService}
            />
          )}

          {dentists.length === 0 ? (
            <EmptyState
              icon={Bot}
              title="No Dentists Available"
              description="This clinic doesn't have any dentists available for booking at the moment. Please try again later or contact the clinic directly."
              action={{
                label: "Back to Chat",
                onClick: () => navigate(-1)
              }}
            />
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {dentists.map((dentist) => {
                const isRecommended = recommendedDentists.includes(dentist.id);
                const displayName = `${dentist.first_name || dentist.profiles?.first_name} ${dentist.last_name || dentist.profiles?.last_name}`;

                return (
                  <Card
                    key={dentist.id}
                    className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                      isRecommended
                        ? 'border-yellow-400/50 ring-2 ring-yellow-400/20 bg-gradient-to-br from-yellow-50/50 to-amber-50/50 dark:from-yellow-950/20 dark:to-amber-950/20 hover:shadow-yellow-500/20'
                        : 'hover:shadow-blue-500/10 hover:border-blue-500/40'
                    }`}
                    onClick={() => handleDentistSelect(dentist)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Avatar className={`h-14 w-14 ring-2 transition-all ${
                          isRecommended
                            ? 'ring-yellow-400/30 group-hover:ring-yellow-400/50'
                            : 'ring-primary/10 group-hover:ring-primary/30'
                        }`}>
                          <AvatarImage src="" />
                          <AvatarFallback className={`text-base font-bold ${
                            isRecommended
                              ? 'bg-gradient-to-br from-yellow-400/20 to-amber-400/20 text-yellow-700'
                              : 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 text-primary'
                          }`}>
                            {getDentistInitials(dentist)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-1">
                            <h3 className={`font-semibold truncate transition-colors ${
                              isRecommended
                                ? 'group-hover:text-yellow-700'
                                : 'group-hover:text-blue-600'
                            }`}>
                              Dr. {displayName}
                            </h3>
                            {isRecommended && (
                              <Badge className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-300 text-xs shrink-0 shadow-sm">
                                ⭐ Best pick
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
          )}
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
                    {selectedDentist.clinic_address || 'Address not available'}
                  </p>
                  <div className="w-full h-40 rounded-lg overflow-hidden">
                    <ClinicMap address={selectedDentist.clinic_address || ''} />
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
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-muted-foreground">
                          {showAllSlots 
                            ? `All Available Time Slots (${availableSlots.filter(slot => slot.available).length})`
                            : aiSlotCode.showSlots.length > 0
                            ? `✨ AI Recommended Slots (${aiSlotCode.showSlots.length})`
                            : `Available Time Slots (${availableSlots.filter(slot => slot.available).length})`
                          }
                        </span>
                      </div>
                      
                      <div className="max-h-[400px] overflow-y-auto space-y-2">
                        {availableSlots.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">Loading time slots...</p>
                        ) : availableSlots.filter(slot => slot.available).length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No available slots for this date</p>
                        ) : (
                          availableSlots
                            .filter(slot => slot.available)
                            .filter(slot => {
                              // If AI code exists and not showing all, only show AI-selected slots
                              if (!showAllSlots && aiSlotCode.showSlots.length > 0) {
                                return aiSlotCode.showSlots.includes(slot.time);
                              }
                              return true;
                            })
                            .map((slot) => {
                              const aiDetail = aiSlotCode.slotDetails[slot.time];
                              const isAISelected = aiSlotCode.showSlots.includes(slot.time);
                              return (
                              <button
                                key={slot.time}
                                onClick={() => handleTimeSelect(slot.time)}
                                className={`relative w-full p-4 rounded-xl border-2 text-left font-medium transition-all ${
                                  selectedTime === slot.time
                                    ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                                    : isAISelected
                                    ? 'bg-purple-50 border-purple-300 hover:border-purple-400 hover:bg-purple-100 ring-2 ring-purple-200'
                                    : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                                }`}
                              >
                                {isAISelected && (
                                  <span className="absolute top-2 right-2 bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    ✨ AI Pick
                                  </span>
                                )}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    <span className="text-lg">{slot.time}</span>
                                  </div>
                                  {aiDetail?.score && (
                                    <span className="text-sm text-purple-600 font-semibold">
                                      Score: {aiDetail.score}
                                    </span>
                                  )}
                                </div>
                                {isAISelected && aiDetail?.reason && (
                                  <p className="text-xs text-muted-foreground mt-2 pl-7">
                                    {aiDetail.reason}
                                  </p>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                      
                      {/* Show All Slots Button */}
                      {!showAllSlots && aiSlotCode.showSlots.length > 0 && availableSlots.filter(slot => slot.available).length > aiSlotCode.showSlots.length && (
                        <Button
                          variant="outline"
                          className="w-full mt-2"
                          onClick={() => setShowAllSlots(true)}
                        >
                          Show rest of available times ({availableSlots.filter(slot => slot.available).length - aiSlotCode.showSlots.length} more)
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Book Button */}
                  <Button
                    className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                    disabled={!selectedDate || !selectedTime}
                    onClick={() => setBookingStep('confirm')}
                  >
                    <Bot className="h-5 w-5 mr-2" />
                    Book with AI Assistant
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
