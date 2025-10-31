import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { useBusinessContext } from "@/hooks/useBusinessContext";
import { cn } from "@/lib/utils";
import { BusinessSelectionForPatients } from "@/components/BusinessSelectionForPatients";
import { AppointmentSuccessDialog } from "@/components/AppointmentSuccessDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  CalendarDays,
  CheckCircle,
  Bot
} from "lucide-react";
import { format, startOfDay } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import ClinicMap from "@/components/Map";
import { ServiceSelector } from "@/components/booking/ServiceSelector";
import { logger } from '@/lib/logger';
import { AnimatedBackground, EmptyState, GradientCard } from "@/components/ui/polished-components";

interface Dentist {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialization: string;
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
}

export default function BookAppointment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { businessId, loading: businessLoading, switchBusiness } = useBusinessContext();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingStep, setBookingStep] = useState<'dentist' | 'datetime' | 'confirm'>('dentist');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successDetails, setSuccessDetails] = useState<any>(null);

  // Fetch user and profile
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setProfile(profileData);
    };

    fetchUserData();
  }, [navigate]);

  // Fetch dentists
  useEffect(() => {
    if (!businessLoading && businessId) {
      fetchDentists();
    }
  }, [businessId, businessLoading]);

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
            address,
            bio
          )
        `)
        .eq("business_id", businessId);

      if (memberError) throw memberError;

      const profileIds = memberData?.map(m => m.profile_id) || [];
      
      if (profileIds.length === 0) {
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

  const fetchAvailableSlots = async (date: Date, dentistId: string) => {
    if (!businessId) return;

    try {
      // First, sync with Google Calendar to block any busy times
      const dateStr = date.toISOString().split('T')[0];
      const startDate = new Date(dateStr + 'T00:00:00Z');
      const endDate = new Date(dateStr + 'T23:59:59Z');

      try {
        await supabase.functions.invoke('google-calendar-sync', {
          body: {
            dentistId: dentistId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          }
        });
      } catch (syncError) {
        // Log but don't fail - dentist might not have Google Calendar connected
        logger.error("Google Calendar sync failed (might not be connected):", syncError);
      }

      // Generate daily slots
      await supabase.rpc('generate_daily_slots', {
        p_dentist_id: dentistId,
        p_date: dateStr
      });

      // Fetch available slots
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
    } catch (error) {
      logger.error("Error fetching slots:", error);
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
    if (!selectedDate || !selectedTime || !selectedDentist || !businessId) return;

    try {
      const requiredFields = ['first_name', 'last_name', 'phone', 'email'];
      const missingFields = requiredFields.filter(field => !profile?.[field]);
      
      if (missingFields.length > 0) {
        toast({
          title: t.incompleteProfile,
          description: t.pleaseCompleteProfileFirst,
          variant: "destructive",
        });
        navigate('/dashboard?tab=settings');
        return;
      }

      const appointmentDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":");
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

      const dateStr = selectedDate.toISOString().split('T')[0];

      const { data: appointmentData, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: profile.id,
          dentist_id: selectedDentist.id,
          business_id: businessId,
          appointment_date: appointmentDateTime.toISOString(),
          reason: selectedService?.name || 'General consultation',
          status: 'confirmed',
          booking_source: 'manual',
          urgency: 'medium',
          service_id: selectedService?.id || null,
          duration_minutes: selectedService?.duration_minutes || 60
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.rpc('book_appointment_slot', {
        p_dentist_id: selectedDentist.id,
        p_slot_date: dateStr,
        p_slot_time: selectedTime + ':00',
        p_appointment_id: appointmentData.id
      });

      setSuccessDetails({
        date: format(selectedDate, 'MMMM dd, yyyy'),
        time: selectedTime,
        dentist: `Dr ${selectedDentist.first_name} ${selectedDentist.last_name}`,
        reason: 'General consultation'
      });
      setShowSuccessDialog(true);
    } catch (error) {
      logger.error('Error booking appointment:', error);
      toast({
        title: t.error,
        description: t.unableToBookAppointment,
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

  if (businessLoading || loading) {
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
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 rounded-2xl p-6 mb-6">
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
                  Back
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/chat')}
                  className="gap-2 text-muted-foreground hover:text-primary hover:bg-white/50"
                >
                  <Bot className="h-4 w-4" />
                  <span className="hidden sm:inline">Switch to AI Assistant</span>
                </Button>
              </div>

              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
                    <CalendarDays className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Book an Appointment
                  </h1>
                </div>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Choose your preferred dentist and schedule a convenient time for your visit
                </p>
              </div>
            </div>
          </div>

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
              icon={CalendarDays}
              title="No Dentists Available"
              description="This clinic doesn't have any dentists available for booking at the moment. Please try again later or contact the clinic directly."
              action={{
                label: "Go Back",
                onClick: () => navigate(-1)
              }}
            />
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {dentists.map((dentist) => {
                const displayName = `${dentist.first_name || dentist.profiles?.first_name} ${dentist.last_name || dentist.profiles?.last_name}`;

                return (
                  <Card
                    key={dentist.id}
                    className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/40 hover:-translate-y-1"
                    onClick={() => handleDentistSelect(dentist)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-14 w-14 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 text-primary text-base font-bold">
                            {getDentistInitials(dentist)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate group-hover:text-blue-600 transition-colors">
                            Dr. {displayName}
                          </h3>
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
            className="gap-2 mb-6 hover:bg-white/50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to list
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column - Dentist Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Dentist Card - Enhanced */}
              <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="h-20 w-20 ring-4 ring-primary/10">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xl font-bold">
                          {getDentistInitials(selectedDentist)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-4 border-white"></div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Dr. {selectedDentist.first_name} {selectedDentist.last_name}
                      </h2>
                      <p className="text-sm text-muted-foreground capitalize mb-2">
                        {selectedDentist.specialization || 'General Dentistry'}
                      </p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 opacity-50" />
                        <span className="text-sm font-semibold ml-1 text-gray-700">4.87</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      In person & Online
                    </Badge>
                    <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                      Consultation - $80
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Bio Card - Enhanced */}
              <Card className="border-2 shadow-md">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3 text-lg">Bio</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedDentist.profiles?.bio && selectedDentist.profiles.bio.trim().length > 0
                      ? selectedDentist.profiles.bio
                      : `A specialist in ${selectedDentist.specialization || 'general dentistry'}, with extensive training and experience.`}
                  </p>
                </CardContent>
              </Card>

              {/* Location Card - Enhanced */}
              {selectedDentist.clinic_address && (
                <Card className="border-2 shadow-md">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Location
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {selectedDentist.clinic_address}
                    </p>
                    <div className="w-full h-40 rounded-lg overflow-hidden border-2">
                      <ClinicMap address={selectedDentist.clinic_address} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Date & Time Picker */}
            <div className="lg:col-span-3">
              <Card className="sticky top-4 border-2 shadow-xl">
                <CardContent className="p-6 space-y-6">
                  {/* Header */}
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {selectedDate ? format(selectedDate, "EEEE, MMMM d") : "Select a date"}
                    </h3>
                    <p className="text-sm text-muted-foreground">Choose your preferred date and time</p>
                  </div>

                  {/* Enhanced Date Picker */}
                  <div className="grid grid-cols-7 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                      const date = new Date();
                      date.setDate(date.getDate() + index);
                      const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                      const isDisabled = date.getDay() === 0 || date.getDay() === 6;
                      const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                      return (
                        <button
                          key={day}
                          onClick={() => !isDisabled && handleDateSelect(date)}
                          disabled={isDisabled}
                          className={cn(
                            "flex flex-col items-center p-3 rounded-2xl transition-all duration-200 relative",
                            isSelected
                              ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                              : isDisabled
                              ? 'opacity-30 cursor-not-allowed bg-gray-100'
                              : 'hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 border-2 border-transparent hover:border-blue-200 hover:scale-105'
                          )}
                        >
                          <span className="text-xs mb-1 font-medium">{day}</span>
                          <span className="text-lg font-bold">{date.getDate()}</span>
                          {isToday && !isSelected && (
                            <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Enhanced Time Slots */}
                  {selectedDate && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg">Available Times</h4>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {availableSlots.filter(slot => slot.available).length} slots
                        </Badge>
                      </div>

                      <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2">
                        {availableSlots.length === 0 ? (
                          <div className="text-center py-12">
                            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3 animate-pulse" />
                            <p className="text-muted-foreground">Loading available times...</p>
                          </div>
                        ) : availableSlots.filter(slot => slot.available).length === 0 ? (
                          <div className="text-center py-12">
                            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground font-medium">No available slots for this date</p>
                            <p className="text-sm text-muted-foreground mt-2">Please try another day</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {availableSlots.filter(slot => slot.available).map((slot) => (
                              <button
                                key={slot.time}
                                onClick={() => handleTimeSelect(slot.time)}
                                className={cn(
                                  "p-4 rounded-xl font-medium transition-all duration-200 border-2",
                                  selectedTime === slot.time
                                    ? 'bg-gradient-to-br from-blue-500 to-purple-500 border-transparent text-white shadow-lg scale-105'
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:scale-105 shadow-sm'
                                )}
                              >
                                <Clock className={cn("h-4 w-4 mx-auto mb-1", selectedTime === slot.time ? "text-white" : "text-blue-500")} />
                                <div className={cn("text-base font-bold", selectedTime === slot.time ? "text-white" : "text-gray-700")}>
                                  {slot.time}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Book Button */}
                  <Button
                    className={cn(
                      "w-full h-14 text-lg font-semibold transition-all duration-300 shadow-lg",
                      !selectedDate || !selectedTime
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-2xl hover:scale-105"
                    )}
                    size="lg"
                    disabled={!selectedDate || !selectedTime}
                    onClick={() => setBookingStep('confirm')}
                  >
                    <CalendarDays className="h-6 w-6 mr-2" />
                    {!selectedDate || !selectedTime ? "Select Date & Time" : "Continue to Confirm"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {bookingStep === 'confirm' && selectedDentist && selectedDate && selectedTime && (
        <div className="max-w-6xl mx-auto p-4 py-8">
          <Card className="max-w-2xl mx-auto border-2 shadow-2xl">
            <CardContent className="p-8 space-y-8">
              {/* Header with Icon */}
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-xl opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-blue-500 to-purple-500 rounded-full p-4">
                    <CheckCircle className="h-12 w-12 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Confirm Your Appointment
                  </h2>
                  <p className="text-muted-foreground mt-2">Please review your appointment details</p>
                </div>
              </div>

              {/* Appointment Details Card */}
              <div className="space-y-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 rounded-2xl p-6 border-2 border-blue-100">
                {/* Dentist Info */}
                <div className="flex items-start gap-4 pb-4 border-b border-blue-200">
                  <Avatar className="h-16 w-16 ring-4 ring-white shadow-lg">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-lg font-bold">
                      {getDentistInitials(selectedDentist)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-gray-900">
                      Dr. {selectedDentist.first_name} {selectedDentist.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {selectedDentist.specialization || 'General Dentistry'}
                    </p>
                    {selectedService && (
                      <Badge className="mt-2 bg-blue-100 text-blue-700 border-blue-200">
                        {selectedService.name}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Date & Time Details */}
                <div className="grid gap-4">
                  <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <CalendarDays className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Date</p>
                      <p className="font-semibold text-gray-900">{format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Time</p>
                      <p className="font-semibold text-gray-900">{selectedTime}</p>
                    </div>
                  </div>

                  {selectedDentist.clinic_address && (
                    <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Location</p>
                        <p className="font-medium text-gray-900 text-sm">{selectedDentist.clinic_address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1 h-12 border-2 hover:bg-gray-50"
                  onClick={() => setBookingStep('datetime')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Button
                  className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={confirmBooking}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
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
