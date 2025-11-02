import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBusinessContext } from "@/hooks/useBusinessContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Clock, CheckCircle2, ArrowLeft } from "lucide-react";
import { ModernLoadingSpinner } from "@/components/enhanced/ModernLoadingSpinner";
import { ServiceSelector } from "@/components/booking/ServiceSelector";
import { clinicTimeToUtc, createAppointmentDateTimeFromStrings } from "@/lib/timezone";

interface Dentist {
  id: string;
  profiles: any; // Supabase returns array from join
  specialization?: string;
}

export default function BookAppointment() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { businessId: contextBusinessId, loading: businessLoading } = useBusinessContext();
  const [effectiveBusinessId, setEffectiveBusinessId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Form state
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDentist, setSelectedDentist] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [success, setSuccess] = useState(false);

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

  // Fetch dentists
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
        .select('id, specialization, profiles!dentists_profile_id_fkey(first_name, last_name)')
        .eq('is_active', true)
        .in('profile_id', members.map(m => m.profile_id));

      if (!error && data) {
        setDentists(data as any);
      }
    };
    fetchDentists();
  }, [effectiveBusinessId]);

  // Fetch available times
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
        console.error('Error fetching slots:', error);
        setAvailableTimes([]);
      }
      setLoadingTimes(false);
    };
    fetchTimes();
  }, [selectedDentist, selectedDate, effectiveBusinessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile || !selectedDentist || !selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Please complete all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const appointmentDateTime = createAppointmentDateTimeFromStrings(dateStr, selectedTime);

      const { error: appointmentError } = await supabase
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
        });

      if (appointmentError) throw appointmentError;

      setSuccess(true);
      toast({
        title: "Success",
        description: "Your appointment has been booked!",
      });

      setTimeout(() => navigate('/dashboard'), 2000);
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Appointment Confirmed!</h2>
            <p className="text-muted-foreground">Your appointment has been successfully booked.</p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
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
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Select Service */}
            {effectiveBusinessId && (
              <div className="space-y-2">
                <Label>Select Service (Optional)</Label>
                <ServiceSelector
                  businessId={effectiveBusinessId}
                  onSelectService={setSelectedService}
                  selectedServiceId={selectedService?.id || null}
                />
              </div>
            )}

            {/* Step 2: Select Dentist */}
            <div className="space-y-2">
              <Label>Select Provider *</Label>
              <Select value={selectedDentist} onValueChange={setSelectedDentist}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a provider" />
                </SelectTrigger>
                <SelectContent>
                  {dentists.map((dentist) => (
                    <SelectItem key={dentist.id} value={dentist.id}>
                      {dentist.profiles?.first_name} {dentist.profiles?.last_name}
                      {dentist.specialization && ` - ${dentist.specialization}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 3: Select Date */}
            <div className="space-y-2">
              <Label>Select Date *</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || !selectedDentist}
                className="rounded-md border"
              />
            </div>

            {/* Step 4: Select Time */}
            {selectedDate && (
              <div className="space-y-2">
                <Label>Select Time *</Label>
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

            {/* Reason */}
            <div className="space-y-2">
              <Label>Reason for Visit</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe your symptoms or reason for visit..."
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedDentist || !selectedDate || !selectedTime || loading}
                className="flex-1"
              >
                {loading ? "Booking..." : "Confirm Appointment"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
