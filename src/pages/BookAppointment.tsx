// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { useBusinessContext } from "@/hooks/useBusinessContext";
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
  CheckCircle
} from "lucide-react";
import { format, startOfDay } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import ClinicMap from "@/components/Map";
import { ServiceSelector } from "@/components/booking/ServiceSelector";

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

  const fetchAvailableSlots = async (date: Date, dentistId: string) => {
    if (!businessId) return;
    
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
        .eq('business_id', businessId)
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
          reason: 'General consultation',
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
      console.error('Error booking appointment:', error);
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
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/chat')}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              ← Switch to AI Assistant
            </Button>
          </div>

          {/* Service Selection */}
          {businessId && (
            <ServiceSelector
              businessId={businessId}
              selectedServiceId={selectedService?.id || null}
              onSelectService={setSelectedService}
            />
          )}

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {dentists.map((dentist) => {
              const displayName = `${dentist.first_name || dentist.profiles?.first_name} ${dentist.last_name || dentist.profiles?.last_name}`;

              return (
                <Card
                  key={dentist.id}
                  className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/40"
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
                        <h3 className="font-semibold truncate">Dr. {displayName}</h3>
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
            <div className="lg:col-span-2 space-y-6">
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
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold">
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
                        <span className="text-sm font-medium ml-1">4.87</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">In person & Online</Badge>
                    <Badge variant="secondary" className="text-xs">Consultation - $80</Badge>
                  </div>
                </CardContent>
              </Card>

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

              {selectedDentist.clinic_address && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-3">Location</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {selectedDentist.clinic_address}
                    </p>
                    <div className="w-full h-40 rounded-lg overflow-hidden">
                      <ClinicMap address={selectedDentist.clinic_address} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-3">
              <Card className="sticky top-4">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                      {selectedDate ? format(selectedDate, "EEE, dd MMMM") : "Select a date"}
                    </h3>
                  </div>

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
