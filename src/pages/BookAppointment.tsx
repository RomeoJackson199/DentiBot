import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBusinessContext } from "@/hooks/useBusinessContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Clock, CheckCircle2, ArrowLeft, ArrowRight, Calendar as CalendarIcon, User, Sparkles, TrendingUp } from "lucide-react";
import { ModernLoadingSpinner } from "@/components/enhanced/ModernLoadingSpinner";
import { ServiceSelector } from "@/components/booking/ServiceSelector";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createAppointmentDateTimeFromStrings } from "@/lib/timezone";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { getRecommendedSlots, updateSlotStatisticsAfterBooking } from "@/lib/smartScheduling";
import { getPatientPreferences } from "@/lib/smartScheduling";
import type { RecommendedSlot } from "@/lib/smartScheduling";
import { BusinessSelectionForPatients } from "@/components/BusinessSelectionForPatients";
interface Dentist {
  id: string;
  profiles: any;
  specialization?: string;
  bio?: string;
}

type BookingStep = 'service' | 'provider' | 'datetime' | 'confirm' | 'success';

export default function BookAppointment() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { businessId: contextBusinessId, loading: businessLoading } = useBusinessContext();
  const [effectiveBusinessId, setEffectiveBusinessId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [currentStep, setCurrentStep] = useState<BookingStep>('service');
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDentist, setSelectedDentist] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [recommendedSlots, setRecommendedSlots] = useState<RecommendedSlot[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAllTimes, setShowAllTimes] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  
  const hasFormData = selectedService !== null || reason !== '' || selectedDentist !== '' || selectedDate !== undefined;

  const { ConfirmationDialog } = useUnsavedChanges({
    hasUnsavedChanges: hasFormData && currentStep !== 'success',
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setProfile(profileData);
      }
      setLoading(false);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!businessLoading) {
      const stored = localStorage.getItem('selected_business_id');
      setEffectiveBusinessId(contextBusinessId || stored);
    }
  }, [contextBusinessId, businessLoading]);

  useEffect(() => {
    setSelectedTime("");
    setRecommendedSlots([]);
    setAiSummary("");
    setShowAllTimes(false);
  }, [selectedDentist, selectedDate]);

  useEffect(() => {
    if (!effectiveBusinessId) return;
    
    const fetchDentists = async () => {
      const { data: members } = await supabase
        .from('business_members')
        .select('profile_id')
        .eq('business_id', effectiveBusinessId);

      if (!members || members.length === 0) {
        setDentists([]);
        return;
      }

      const { data, error } = await supabase
        .from('dentists')
        .select(`
          id, 
          specialization,
          profiles!dentists_profile_id_fkey(first_name, last_name, bio)
        `)
        .eq('is_active', true)
        .in('profile_id', members.map(m => m.profile_id));

      if (!error && data) {
        setDentists(data as any);
      }
    };
    fetchDentists();
  }, [effectiveBusinessId]);

  useEffect(() => {
    if (!selectedDentist || !selectedDate) {
      setAvailableTimes([]);
      setSelectedTime("");
      return;
    }

    const fetchTimes = async () => {
      setLoadingTimes(true);
      setSelectedTime("");
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      // 0) Check dentist schedule for this day before generating/fetching slots
      try {
        const dayOfWeek = selectedDate.getDay();
        const { data: availability } = await supabase
          .from('dentist_availability')
          .select('is_available')
          .eq('dentist_id', selectedDentist)
          .eq('business_id', effectiveBusinessId)
          .eq('day_of_week', dayOfWeek)
          .maybeSingle();

        if (availability && availability.is_available === false) {
          setAvailableTimes([]);
          setLoadingTimes(false);
          return;
        }
      } catch (e) {
        console.warn('Availability check failed:', e);
      }
      
      try {
        await supabase.rpc('ensure_daily_slots', {
          p_dentist_id: selectedDentist,
          p_date: dateStr,
        });
      } catch (e) {
        console.warn('ensure_daily_slots failed:', e);
      }

      try {
        await supabase.functions.invoke('google-calendar-sync', {
          body: {
            dentistId: selectedDentist,
            startDate: startOfDay(selectedDate).toISOString(),
            endDate: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59).toISOString(),
          }
        });
      } catch (syncError) {
        console.warn('Google Calendar sync failed:', syncError);
      }

      const { data, error } = await supabase
        .from('appointment_slots')
        .select('slot_time, is_available')
        .eq('dentist_id', selectedDentist)
        .eq('slot_date', dateStr)
        .eq('business_id', effectiveBusinessId)
        .eq('is_available', true)
        .order('slot_time');

      if (!error && data) {
        const times = data.map(s => (s.slot_time.length === 8 ? s.slot_time.slice(0,5) : s.slot_time));
        setAvailableTimes(times);

        // Get AI-powered recommendations
        if (profile?.id && times.length > 0) {
          setLoadingAI(true);
          try {
            const timeSlots = times.map(time => ({
              time,
              available: true,
              dentist_id: selectedDentist
            }));

            console.log('📊 Fetching AI recommendations for', times.length, 'slots');
            const recommendations = await getRecommendedSlots(
              selectedDentist,
              profile.id,
              selectedDate,
              timeSlots,
              selectedService?.id
            );

            console.log('✅ Received', recommendations.length, 'recommendations');
            const promoted = recommendations.filter(r => r.shouldPromote);
            console.log('⭐ AI is promoting', promoted.length, 'slots:', promoted.map(r => r.time).join(', '));

            setRecommendedSlots(recommendations);

            // Show AI summary if available
            const topRec = recommendations.find(r => r.shouldPromote);
            if (topRec?.aiReasoning) {
              setAiSummary(topRec.aiReasoning);
              console.log('💡 AI Summary:', topRec.aiReasoning);
            } else {
              // If no AI reasoning but we have recommendations, create a summary
              const topSlots = recommendations
                .filter(r => r.score >= 70)
                .slice(0, 3)
                .map(r => r.time);

              if (topSlots.length > 0) {
                setAiSummary(`Based on scheduling patterns, these times work well: ${topSlots.join(', ')}`);
              }
            }
          } catch (aiError) {
            console.error('❌ AI recommendations failed:', aiError);
            // Even if AI fails, create basic recommendations
            const fallbackRecs = times.map(time => ({
              time,
              available: true,
              dentist_id: selectedDentist,
              score: 50,
              reasons: ['Available slot'],
              isRecommended: false,
              shouldPromote: false
            }));
            setRecommendedSlots(fallbackRecs);
          } finally {
            setLoadingAI(false);
          }
        }
      } else {
        setAvailableTimes([]);
        setRecommendedSlots([]);
      }
      setLoadingTimes(false);
    };
    fetchTimes();
  }, [selectedDentist, selectedDate, effectiveBusinessId, profile, selectedService]);

  const handleNext = () => {
    if (currentStep === 'service') {
      setCurrentStep('provider');
    } else if (currentStep === 'provider') {
      if (!selectedDentist) {
        toast({
          title: "Error",
          description: "Please select a provider",
          variant: "destructive"
        });
        return;
      }
      setCurrentStep('datetime');
    } else if (currentStep === 'datetime') {
      if (!selectedDate || !selectedTime) {
        toast({
          title: "Error",
          description: "Please select date and time",
          variant: "destructive"
        });
        return;
      }
      setCurrentStep('confirm');
    }
  };

  const handleBack = () => {
    if (currentStep === 'provider') {
      setCurrentStep('service');
    } else if (currentStep === 'datetime') {
      setCurrentStep('provider');
    } else if (currentStep === 'confirm') {
      setCurrentStep('datetime');
    }
  };

  const handleConfirm = async () => {
    if (!profile || !selectedDentist || !selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Missing required information",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const appointmentDateTime = createAppointmentDateTimeFromStrings(dateStr, selectedTime);

      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_id: profile.id,
          dentist_id: selectedDentist,
          business_id: effectiveBusinessId,
          appointment_date: appointmentDateTime.toISOString(),
          reason: selectedService?.name || reason || 'General Consultation',
          status: 'pending',
          service_id: selectedService?.id || null,
          duration_minutes: selectedService?.duration_minutes || 60
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Update slot usage statistics for AI learning
      try {
        await updateSlotStatisticsAfterBooking(
          selectedDentist,
          new Date(appointmentDateTime)
        );
      } catch (statsError) {
        console.warn('Failed to update slot statistics:', statsError);
      }

      setBookingId(appointment.id);
      setCurrentStep('success');
      toast({
        title: "Success",
        description: "Your appointment has been booked!",
      });
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Error",
        description: "Unable to book appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToGoogleCalendar = () => {
    if (!selectedDate || !selectedTime || !selectedDentist) return;

    const dentist = dentists.find(d => d.id === selectedDentist);
    const startDate = createAppointmentDateTimeFromStrings(format(selectedDate, 'yyyy-MM-dd'), selectedTime);
    const endDate = new Date(startDate.getTime() + (selectedService?.duration_minutes || 60) * 60000);
    
    const title = encodeURIComponent(`Appointment with ${dentist?.profiles?.first_name || ''} ${dentist?.profiles?.last_name || ''}`);
    const details = encodeURIComponent(selectedService?.name || reason || 'General Consultation');
    const dates = `${format(startDate, "yyyyMMdd'T'HHmmss")}/${format(endDate, "yyyyMMdd'T'HHmmss")}`;
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;
    window.open(googleCalendarUrl, '_blank');
  };

  if (loading || businessLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ModernLoadingSpinner variant="overlay" message="Loading..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p>Please log in to book an appointment.</p>
            <Button onClick={() => navigate('/login')} className="mt-4">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedDentistData = dentists.find(d => d.id === selectedDentist);

  // Require business selection before booking flow
  if (!effectiveBusinessId) {
    return (
      <>
        <ConfirmationDialog />
        <div className="p-4 md:p-6">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Select Clinic to Continue</CardTitle>
              <CardDescription>Choose where you want to book your appointment.</CardDescription>
            </CardHeader>
            <CardContent>
              <BusinessSelectionForPatients
                selectedBusinessId={effectiveBusinessId || undefined}
                onSelectBusiness={(id, name) => {
                  localStorage.setItem('selected_business_id', id);
                  setEffectiveBusinessId(id);
                  toast({ title: 'Clinic selected', description: name });
                }}
              />
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (currentStep === 'success') {
    return (
      <>
        <ConfirmationDialog />
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4 py-12">
          <Card className="max-w-lg w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm animate-in zoom-in duration-500">
            <CardContent className="pt-10 pb-8 text-center space-y-6">
              {/* Success Icon with Animation */}
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-bounce">
                  <CheckCircle2 className="w-14 h-14 text-white" />
                </div>
                <div className="absolute inset-0 w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-emerald-400 rounded-full animate-ping opacity-20"></div>
              </div>

              {/* Success Message */}
              <div className="space-y-3">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  All Set! 🎉
                </h2>
                <p className="text-xl font-semibold text-gray-700">
                  Your appointment is confirmed!
                </p>
                <p className="text-gray-600">
                  We've sent a confirmation email with all the details.
                </p>
              </div>

              <Separator className="my-6" />

              {/* Appointment Summary */}
              {selectedDate && selectedTime && (
                <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <CalendarIcon className="w-4 h-4" />
                      <span className="font-semibold">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="font-bold text-2xl text-blue-600">{selectedTime}</span>
                    </div>
                    {selectedDentistData && (
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>with {selectedDentistData.profiles?.first_name} {selectedDentistData.profiles?.last_name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  Back to Dashboard
                </Button>
                <Button
                  onClick={handleAddToGoogleCalendar}
                  variant="outline"
                  className="w-full border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition-colors"
                  size="lg"
                >
                  <CalendarIcon className="mr-2 h-5 w-5 text-blue-600" />
                  Add to Google Calendar
                </Button>
              </div>

              {/* Additional Info */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-amber-800 font-medium">
                  💡 <strong>Reminder:</strong> Please arrive 10 minutes early for check-in.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <ConfirmationDialog />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-6">
      <Card className="max-w-4xl mx-auto shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 border-b">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <CalendarIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            Book Your Appointment
          </CardTitle>
          <CardDescription className="text-center text-base mt-2">
            Step {currentStep === 'service' ? '1' : currentStep === 'provider' ? '2' : currentStep === 'datetime' ? '3' : '4'} of 4 - {
              currentStep === 'service' ? 'Choose Service' :
              currentStep === 'provider' ? 'Select Provider' :
              currentStep === 'datetime' ? 'Pick Date & Time' :
              'Confirm Details'
            }
          </CardDescription>
          {/* Step Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {['service', 'provider', 'datetime', 'confirm'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  currentStep === step
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-110'
                    : (index < ['service', 'provider', 'datetime', 'confirm'].indexOf(currentStep))
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {index < ['service', 'provider', 'datetime', 'confirm'].indexOf(currentStep) ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 3 && (
                  <div className={`w-12 h-1 mx-1 rounded ${
                    index < ['service', 'provider', 'datetime', 'confirm'].indexOf(currentStep)
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          {currentStep === 'service' && effectiveBusinessId && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="space-y-4">
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-600">✨</span>
                  </div>
                  Select Service (Optional)
                </Label>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200">
                  <ServiceSelector
                    businessId={effectiveBusinessId}
                    onSelectService={setSelectedService}
                    selectedServiceId={selectedService?.id || null}
                  />
                </div>
                {selectedService && (
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        <div>
                          <p className="font-semibold text-green-900">{selectedService.name}</p>
                          <p className="text-sm text-green-700">{selectedService.duration_minutes} minutes</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600">📝</span>
                  </div>
                  Reason for Visit (Optional)
                </Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Tell us what brings you in today..."
                  rows={4}
                  className="border-2 border-blue-200 focus:border-blue-400 bg-blue-50/30 transition-colors"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleNext} size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'provider' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="space-y-4">
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-pink-600" />
                  </div>
                  Select Your Provider
                </Label>
                <div className="grid gap-4">
                  {dentists.map((dentist) => (
                    <Card
                      key={dentist.id}
                      className={`cursor-pointer transition-all hover:shadow-xl ${
                        selectedDentist === dentist.id
                          ? 'ring-4 ring-purple-400 shadow-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300'
                          : 'hover:border-purple-300 border-2 hover:scale-[1.02]'
                      }`}
                      onClick={() => setSelectedDentist(dentist.id)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className={`w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xl shadow-lg ${
                            selectedDentist === dentist.id
                              ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                              : 'bg-gradient-to-br from-purple-200 to-pink-200 text-purple-700'
                          }`}>
                            {dentist.profiles?.first_name?.[0]}{dentist.profiles?.last_name?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold text-xl text-gray-900">
                                {dentist.profiles?.first_name} {dentist.profiles?.last_name}
                              </h3>
                              {selectedDentist === dentist.id && (
                                <div className="bg-green-500 rounded-full p-1">
                                  <CheckCircle2 className="w-6 h-6 text-white" />
                                </div>
                              )}
                            </div>
                            {dentist.specialization && (
                              <Badge variant="secondary" className="mt-2 bg-purple-100 text-purple-700 border-purple-300">
                                {dentist.specialization}
                              </Badge>
                            )}
                            {dentist.profiles?.bio && (
                              <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                                {dentist.profiles.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleBack} variant="outline" size="lg" className="border-2">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleNext} size="lg" className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'datetime' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="space-y-4">
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  Select Date
                </Label>
                <div className="flex justify-center">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl border-2 border-blue-200 shadow-lg">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date() || !selectedDentist}
                      className="rounded-xl bg-white shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {selectedDate && (
                <div className="space-y-4">
                  <Label className="text-lg font-semibold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-pink-600" />
                    </div>
                    Select Time
                  </Label>

                  {/* AI Summary and Recommended Times */}
                  {!loadingAI && recommendedSlots.length > 0 && (
                    <>
                      {aiSummary && (
                        <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-300 shadow-lg">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-md">
                                <Sparkles className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-blue-900 mb-1 flex items-center gap-2">
                                  💡 Recommendation
                                </p>
                                <p className="text-sm text-blue-800 leading-relaxed">
                                  {aiSummary}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Show recommended times prominently */}
                      {(() => {
                        const recommendedPicks = recommendedSlots.filter(r => r.shouldPromote);
                        if (recommendedPicks.length > 0) {
                          return (
                            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 shadow-lg">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-md animate-pulse">
                                    <TrendingUp className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-purple-900 mb-2">
                                      ✨ Best Times for You
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {recommendedPicks.slice(0, 5).map((pick) => (
                                        <Button
                                          key={pick.time}
                                          type="button"
                                          size="sm"
                                          variant={selectedTime === pick.time ? "default" : "outline"}
                                          onClick={() => setSelectedTime(pick.time)}
                                          className={`font-semibold ${
                                            selectedTime === pick.time
                                              ? 'bg-gradient-to-r from-purple-500 to-blue-500'
                                              : 'bg-white border-purple-400 text-purple-700 hover:bg-purple-50'
                                          }`}
                                        >
                                          <Clock className="w-4 h-4 mr-1" />
                                          {pick.time}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        }
                        return null;
                      })()}
                    </>
                  )}

                  {loadingTimes ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                      <ModernLoadingSpinner />
                      <p className="mt-4 text-purple-600 font-medium">
                        {loadingAI ? 'Analyzing the best time options...' : 'Loading available times...'}
                      </p>
                    </div>
                  ) : availableTimes.length > 0 ? (
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          Available Time Slots ({availableTimes.length})
                        </CardTitle>
                        {loadingAI && (
                          <p className="text-sm text-blue-600 flex items-center gap-2 mt-2">
                            <Sparkles className="w-4 h-4 animate-pulse" />
                            Analyzing the best time options...
                          </p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {availableTimes
                            .filter((time) => {
                              // If showing all times, show everything
                              if (showAllTimes) return true;

                              // If we have recommendations, only show recommended times
                              const recommendation = recommendedSlots.find(r => r.time === time);
                              const isRecommended = recommendation?.shouldPromote || false;

                              // Show recommended times, or if no recommendations exist, show all
                              return isRecommended || recommendedSlots.filter(r => r.shouldPromote).length === 0;
                            })
                            .map((time) => {
                            const recommendation = recommendedSlots.find(r => r.time === time);
                            const isRecommended = recommendation?.shouldPromote || false;
                            const isUnderutilized = recommendation?.isUnderutilized || false;
                            const score = recommendation?.score || 0;

                            return (
                              <div key={time} className="relative">
                                <Button
                                  type="button"
                                  variant={selectedTime === time ? "default" : "outline"}
                                  onClick={() => setSelectedTime(time)}
                                  className={`h-14 w-full text-base font-semibold transition-all ${
                                    selectedTime === time
                                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-105 border-0'
                                      : isRecommended
                                        ? 'bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-2 border-blue-400 hover:border-blue-600 hover:scale-105 shadow-md'
                                        : 'bg-white hover:bg-green-100 border-2 border-green-300 hover:border-green-500 hover:scale-105'
                                  }`}
                                >
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      <span>{time}</span>
                                    </div>
                                    {isRecommended && selectedTime !== time && (
                                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-blue-500 text-white border-0">
                                        Top
                                      </Badge>
                                    )}
                                  </div>
                                </Button>
                                {isRecommended && selectedTime !== time && (
                                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg animate-pulse">
                                    <Sparkles className="w-3 h-3 text-white" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Show More Button */}
                        {!showAllTimes && recommendedSlots.filter(r => r.shouldPromote).length > 0 && availableTimes.length > recommendedSlots.filter(r => r.shouldPromote).length && (
                          <div className="mt-4 text-center">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowAllTimes(true)}
                              className="w-full border-2 border-purple-300 hover:border-purple-400 hover:bg-purple-50"
                            >
                              Show all {availableTimes.length} available times
                            </Button>
                          </div>
                        )}

                        {/* Show reasoning for selected time */}
                        {selectedTime && recommendedSlots.find(r => r.time === selectedTime) && (
                          <Card className="mt-4 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                {recommendedSlots.find(r => r.time === selectedTime)?.shouldPromote && (
                                  <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-semibold text-blue-900">
                                      Helps Balance Schedule
                                    </span>
                                  </div>
                                )}
                                {recommendedSlots.find(r => r.time === selectedTime)?.aiReasoning && (
                                  <p className="text-xs text-blue-800 leading-relaxed">
                                    {recommendedSlots.find(r => r.time === selectedTime)?.aiReasoning}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {recommendedSlots.find(r => r.time === selectedTime)?.reasons.map((reason, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-[10px] bg-blue-100 text-blue-700">
                                      {reason}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300">
                      <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Clock className="w-8 h-8 text-red-600" />
                        </div>
                        <p className="text-lg font-semibold text-red-900">No Available Times</p>
                        <p className="text-red-700 mt-2">Please select a different date</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={handleBack} variant="outline" size="lg" className="border-2">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all"
                  disabled={!selectedDate || !selectedTime}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'confirm' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Review Your Appointment
                  </h3>
                  <p className="text-muted-foreground mt-2">Please confirm the details below</p>
                </div>

                <Card className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 border-2 border-purple-300 shadow-xl">
                  <CardContent className="p-6 space-y-5">
                    {selectedService && (
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-xl">✨</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Service</p>
                        </div>
                        <p className="font-bold text-xl text-gray-900 ml-13">{selectedService.name}</p>
                        <p className="text-sm text-purple-600 ml-13">{selectedService.duration_minutes} minutes</p>
                      </div>
                    )}

                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                          <User className="w-6 h-6 text-pink-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Provider</p>
                      </div>
                      <p className="font-bold text-xl text-gray-900 ml-13">
                        {selectedDentistData?.profiles?.first_name} {selectedDentistData?.profiles?.last_name}
                      </p>
                      {selectedDentistData?.specialization && (
                        <Badge variant="secondary" className="mt-2 ml-13 bg-pink-100 text-pink-700 border-pink-300">
                          {selectedDentistData.specialization}
                        </Badge>
                      )}
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <CalendarIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Date & Time</p>
                      </div>
                      <p className="font-bold text-xl text-gray-900 ml-13">
                        {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                      </p>
                      <div className="flex items-center gap-2 ml-13 mt-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <p className="font-semibold text-lg text-blue-600">{selectedTime}</p>
                      </div>
                    </div>

                    {reason && (
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-xl">📝</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Reason for Visit</p>
                        </div>
                        <p className="text-gray-700 ml-13 leading-relaxed">{reason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleBack} variant="outline" size="lg" className="border-2">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleConfirm}
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all text-lg font-bold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <ModernLoadingSpinner variant="minimal" />
                      <span className="ml-2">Booking...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Confirm Appointment
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
