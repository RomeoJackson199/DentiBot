import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBusinessContext } from "@/hooks/useBusinessContext";
import { BusinessSelectionForPatients } from "@/components/BusinessSelectionForPatients";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Clock, CheckCircle2, ArrowLeft, ArrowRight, Calendar as CalendarIcon, User } from "lucide-react";
import { ModernLoadingSpinner } from "@/components/enhanced/ModernLoadingSpinner";
import { ServiceSelector } from "@/components/booking/ServiceSelector";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createAppointmentDateTimeFromStrings } from "@/lib/timezone";

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
  const { businessId: contextBusinessId, loading: businessLoading, switchBusiness } = useBusinessContext();
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
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

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
        setAvailableTimes(data.map(s => (s.slot_time.length === 8 ? s.slot_time.slice(0,5) : s.slot_time)));
      } else {
        setAvailableTimes([]);
      }
      setLoadingTimes(false);
    };
    fetchTimes();
  }, [selectedDentist, selectedDate, effectiveBusinessId]);

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
      <div className="flex items-center justify-center h-screen">
        <ModernLoadingSpinner variant="overlay" message="Loading..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
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

  if (!effectiveBusinessId) {
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

  const selectedDentistData = dentists.find(d => d.id === selectedDentist);

  if (currentStep === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Appointment Confirmed!</h2>
            <p className="text-muted-foreground">Your appointment has been successfully booked.</p>
            
            <Separator />
            
            <div className="space-y-2">
              <Button onClick={() => navigate('/dashboard')} className="w-full" size="lg">
                Back to Dashboard
              </Button>
              <Button 
                onClick={handleAddToGoogleCalendar} 
                variant="outline" 
                className="w-full"
                size="lg"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Add to Google Calendar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Book an Appointment</CardTitle>
          <CardDescription>
            Step {currentStep === 'service' ? '1' : currentStep === 'provider' ? '2' : currentStep === 'datetime' ? '3' : '4'} of 4
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 'service' && effectiveBusinessId && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Select Service (Optional)</Label>
                <ServiceSelector
                  businessId={effectiveBusinessId}
                  onSelectService={setSelectedService}
                  selectedServiceId={selectedService?.id || null}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Reason for Visit (Optional)</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe your symptoms or reason for visit..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNext} size="lg">
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'provider' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label>Select Your Provider</Label>
                {dentists.map((dentist) => (
                  <Card 
                    key={dentist.id}
                    className={`cursor-pointer transition-all ${
                      selectedDentist === dentist.id 
                        ? 'ring-2 ring-primary' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedDentist(dentist.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg">
                            {dentist.profiles?.first_name} {dentist.profiles?.last_name}
                          </h3>
                          {dentist.specialization && (
                            <Badge variant="secondary" className="mb-2">
                              {dentist.specialization}
                            </Badge>
                          )}
                          {dentist.profiles?.bio && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {dentist.profiles.bio}
                            </p>
                          )}
                        </div>
                        {selectedDentist === dentist.id && (
                          <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleBack} variant="outline" size="lg">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleNext} size="lg" className="flex-1">
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'datetime' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || !selectedDentist}
                  className="rounded-md border"
                />
              </div>

              {selectedDate && (
                <div className="space-y-2">
                  <Label>Select Time</Label>
                  {loadingTimes ? (
                    <div className="flex items-center justify-center py-4">
                      <ModernLoadingSpinner />
                    </div>
                  ) : availableTimes.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {availableTimes.map((time) => (
                        <Button
                          key={time}
                          type="button"
                          variant={selectedTime === time ? "default" : "outline"}
                          onClick={() => setSelectedTime(time)}
                          className="w-full"
                        >
                          <Clock className="mr-1 h-4 w-4" />
                          {time}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No available times for this date</p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleBack} variant="outline" size="lg">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  onClick={handleNext} 
                  size="lg" 
                  className="flex-1"
                  disabled={!selectedDate || !selectedTime}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'confirm' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Confirm Your Appointment</h3>
                
                <Card>
                  <CardContent className="p-4 space-y-3">
                    {selectedService && (
                      <div>
                        <p className="text-sm text-muted-foreground">Service</p>
                        <p className="font-medium">{selectedService.name}</p>
                      </div>
                    )}
                    
                    {selectedService && <Separator />}
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Provider</p>
                      <p className="font-medium">
                        {selectedDentistData?.profiles?.first_name} {selectedDentistData?.profiles?.last_name}
                      </p>
                      {selectedDentistData?.specialization && (
                        <Badge variant="secondary" className="mt-1">
                          {selectedDentistData.specialization}
                        </Badge>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Date & Time</p>
                      <p className="font-medium">
                        {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime}
                      </p>
                    </div>
                    
                    {reason && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm text-muted-foreground">Reason for Visit</p>
                          <p className="font-medium">{reason}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleBack} variant="outline" size="lg">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  onClick={handleConfirm} 
                  size="lg" 
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? "Booking..." : "Confirm Appointment"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
