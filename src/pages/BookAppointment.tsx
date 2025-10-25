// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { BusinessSelectionForPatients } from "@/components/BusinessSelectionForPatients";
import { AppointmentSuccessDialog } from "@/components/AppointmentSuccessDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarDays, Clock, User as UserIcon, ArrowLeft, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Dentist {
  id: string;
  profile_id: string;
  specialization?: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

interface TimeSlot {
  slot_time: string;
  is_available: boolean;
  emergency_only?: boolean;
}

const APPOINTMENT_TYPES = [
  { value: 'consultation', labelKey: 'generalConsultation' },
  { value: 'cleaning', labelKey: 'cleaning' },
  { value: 'checkup', labelKey: 'checkup' },
  { value: 'emergency', labelKey: 'emergency' },
  { value: 'followup', labelKey: 'followUp' },
];

export default function BookAppointment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<{id: string, name: string} | null>(null);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [selectedDentist, setSelectedDentist] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [appointmentType, setAppointmentType] = useState("");
  const [reason, setReason] = useState("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successDetails, setSuccessDetails] = useState<any>(null);
  const hasDentists = dentists.length > 0;

  useEffect(() => {
    setSelectedTime("");
  }, [selectedBusiness, selectedDentist, selectedDate]);

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

  // Fetch dentists for selected business
  useEffect(() => {
    if (!selectedBusiness) {
      setDentists([]);
      return;
    }

    const fetchDentists = async () => {
      // Get providers for this business
      const { data: providerMap, error: mapError } = await supabase
        .from('provider_business_map')
        .select('provider_id')
        .eq('business_id', selectedBusiness.id);

      if (mapError) {
        console.error('Error fetching provider map:', mapError);
        return;
      }

      if (!providerMap || providerMap.length === 0) {
        setDentists([]);
        return;
      }

      const providerIds = providerMap.map(m => m.provider_id);

      // Get dentists for these providers
      const { data, error } = await supabase
        .from('dentists')
        .select(`
          id,
          profile_id,
          specialization,
          profiles:profile_id (
            first_name,
            last_name
          )
        `)
        .eq('is_active', true)
        .in('profile_id', providerIds);

      if (error) {
        console.error('Error fetching dentists:', error);
        return;
      }
      setDentists(data || []);
    };

    fetchDentists();
  }, [selectedBusiness]);

  useEffect(() => {
    if (!hasDentists) {
      setSelectedDentist("");
      setSelectedDate(undefined);
      setSelectedTime("");
    }
  }, [hasDentists]);

  // Fetch available slots when date and dentist are selected
  useEffect(() => {
    if (!selectedDate || !selectedDentist) {
      setAvailableSlots([]);
      setSelectedTime("");
      return;
    }

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedTime("");
      try {
        // Generate slots
        await supabase.rpc('generate_daily_slots', {
          p_dentist_id: selectedDentist,
          p_date: format(selectedDate, 'yyyy-MM-dd')
        });

        // Fetch slots
        const { data, error } = await supabase
          .from('appointment_slots')
          .select('slot_time, is_available, emergency_only')
          .eq('dentist_id', selectedDentist)
          .eq('slot_date', format(selectedDate, 'yyyy-MM-dd'))
          .order('slot_time');

        if (error) throw error;
        setAvailableSlots(data || []);
      } catch (error) {
        console.error('Error fetching slots:', error);
        toast({
          title: t.error,
          description: t.unableToLoadSlots,
          variant: "destructive",
        });
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate, selectedDentist, toast, t]);

  const handleSubmit = async () => {
    if (!selectedDentist || !selectedDate || !selectedTime || !appointmentType) {
      toast({
        title: t.missingInformation,
        description: t.pleaseCompleteAllFields,
        variant: "destructive",
      });
      return;
    }

    // Check profile completeness
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

    setIsSubmitting(true);

    try {
      const appointmentDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":");
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

      // Create appointment with business_id
      const { data: appointmentData, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: profile.id,
          dentist_id: selectedDentist,
          business_id: selectedBusiness!.id,
          appointment_date: appointmentDateTime.toISOString(),
          reason: reason || appointmentType,
          status: 'confirmed',
          urgency: 'medium'
        })
        .select()
        .single();

      if (error) throw error;

      // Book the slot
      await supabase.rpc('book_appointment_slot', {
        p_dentist_id: selectedDentist,
        p_slot_date: format(selectedDate, 'yyyy-MM-dd'),
        p_slot_time: selectedTime + ':00',
        p_appointment_id: appointmentData.id
      });

      const selectedDentistData = dentists.find(d => d.id === selectedDentist);
      setSuccessDetails({
        date: format(selectedDate, 'MMMM dd, yyyy'),
        time: selectedTime,
        dentist: `Dr ${selectedDentistData?.profiles.first_name} ${selectedDentistData?.profiles.last_name}`,
        reason: reason || appointmentType
      });
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: t.error,
        description: t.unableToBookAppointment,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <>
      <AppointmentSuccessDialog 
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        appointmentDetails={successDetails}
      />
      
      <div className="min-h-screen bg-gradient-subtle p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.back}
        </Button>

        <Card className="shadow-elegant border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="flex items-center justify-center text-2xl font-heading">
              <CalendarDays className="h-6 w-6 mr-3 text-primary" />
              {t.bookAppointment}
            </CardTitle>
            <p className="text-muted-foreground mt-2">{t.bookAppointmentDescription}</p>
          </CardHeader>
          
          <CardContent className="space-y-6 p-6 md:p-8">
            {/* Business Selection */}
            {!selectedBusiness && (
              <BusinessSelectionForPatients
                onSelectBusiness={(id, name) => setSelectedBusiness({ id, name })}
                selectedBusinessId={selectedBusiness?.id}
              />
            )}

            {selectedBusiness && (
              <>
                {/* Selected Clinic Info */}
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Booking at</p>
                      <p className="text-lg font-semibold">{selectedBusiness.name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedBusiness(null);
                        setSelectedDentist("");
                        setSelectedDate(undefined);
                        setSelectedTime("");
                      }}
                    >
                      Change Clinic
                    </Button>
                  </div>
                </div>

                {/* Dentist Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center">
                    <UserIcon className="h-4 w-4 mr-2 text-primary" />
                    {t.selectDentist}
                  </Label>
                  {hasDentists ? (
                    <Select value={selectedDentist} onValueChange={setSelectedDentist}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder={t.chooseDentist} />
                      </SelectTrigger>
                      <SelectContent>
                        {dentists.map((dentist) => (
                          <SelectItem key={dentist.id} value={dentist.id}>
                            <div className="flex items-center py-1">
                              <UserIcon className="h-4 w-4 mr-3 text-primary" />
                              <div>
                                <div className="font-medium">
                                  Dr {dentist.profiles.first_name} {dentist.profiles.last_name}
                                </div>
                                {dentist.specialization && (
                                  <div className="text-sm text-muted-foreground">
                                    {dentist.specialization}
                                  </div>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground italic bg-muted/50 border border-dashed border-muted rounded-md p-3">
                      No dentists currently available for this clinic.
                    </p>
                  )}
                </div>

            {/* Appointment Type */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                {t.appointmentType}
              </Label>
              <Select
                value={appointmentType}
                onValueChange={setAppointmentType}
                disabled={!hasDentists}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={t.selectAppointmentType} />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {t[type.labelKey] || type.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            {selectedDentist && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  {t.selectDate}
                </Label>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={isDateDisabled}
                    className={cn(
                      "rounded-xl border-2 shadow-lg bg-card pointer-events-auto p-4",
                      selectedDate && "border-primary"
                    )}
                  />
                </div>
              </div>
            )}

            {/* Time Selection */}
            {selectedDate && (
              <div className="space-y-4">
                <Label className="text-base font-semibold flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-primary" />
                  {t.selectTime}
                </Label>
                
                {loadingSlots ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-3 text-muted-foreground">{t.loading}</span>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {availableSlots
                      .filter(slot => slot.is_available && !slot.emergency_only)
                      .map((slot) => (
                        <Button
                          key={slot.slot_time}
                          variant={selectedTime === slot.slot_time.substring(0, 5) ? "default" : "outline"}
                          onClick={() => setSelectedTime(slot.slot_time.substring(0, 5))}
                          className="h-12"
                        >
                          {slot.slot_time.substring(0, 5)}
                        </Button>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    {t.noSlotsAvailable}
                  </p>
                )}
              </div>
            )}

            {/* Reason/Notes */}
            {selectedTime && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  {t.additionalNotes}
                </Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t.describeSymptoms}
                  rows={4}
                  className="resize-none"
                />
              </div>
            )}

                {/* Submit Button */}
                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    disabled={isSubmitting}
                  >
                    {t.cancel}
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!selectedBusiness || !selectedDentist || !selectedDate || !selectedTime || !appointmentType || isSubmitting}
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {t.booking}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        {t.confirmBooking}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
