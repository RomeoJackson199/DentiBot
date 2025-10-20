// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, User, CheckCircle2, ArrowLeft } from "lucide-react";
import { ModernLoadingSpinner } from "@/components/enhanced/ModernLoadingSpinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Header } from "@/components/homepage/Header";
import { Footer } from "@/components/homepage/Footer";

interface Dentist {
  id: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
  specialization?: string;
}

export default function PublicBooking() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form state
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [selectedDentist, setSelectedDentist] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  
  // Patient info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch dentists
  useEffect(() => {
    const fetchDentists = async () => {
      const { data, error } = await supabase
        .from('dentists')
        .select('id, specialization, profiles(first_name, last_name)')
        .eq('is_active', true);

      if (!error && data) {
        setDentists(data);
      }
    };
    fetchDentists();
  }, []);

  // Fetch available times
  useEffect(() => {
    if (!selectedDentist || !selectedDate) return;

    const fetchTimes = async () => {
      setLoadingTimes(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      console.log('Fetching slots for dentist:', selectedDentist, 'date:', dateStr);
      
      const { data, error } = await supabase
        .from('appointment_slots')
        .select('slot_time, is_available')
        .eq('dentist_id', selectedDentist)
        .eq('slot_date', dateStr)
        .eq('is_available', true);

      console.log('Slots query result:', { data, error });
      if (!error && data) {
        setAvailableTimes(data.map(s => s.slot_time));
        console.log('Available times set:', data.map(s => s.slot_time));
      } else {
        console.error('Error fetching slots:', error);
        setAvailableTimes([]);
      }
      setLoadingTimes(false);
    };
    fetchTimes();
  }, [selectedDentist, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !email || !selectedDentist || !selectedDate || !selectedTime) {
      toast({
        title: t.error,
        description: t.pleaseCompleteAllFields,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create a temporary profile for the patient
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          role: 'patient'
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Create the appointment
      const appointmentDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_id: profile.id,
          dentist_id: selectedDentist,
          appointment_date: appointmentDateTime.toISOString(),
          reason: reason || 'General Consultation',
          status: 'pending',
          patient_name: `${firstName} ${lastName}`
        });

      if (appointmentError) throw appointmentError;

      setSuccess(true);
      toast({
        title: t.success,
        description: t.appointmentBooked,
      });

      setTimeout(() => navigate('/'), 3000);
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: t.error,
        description: t.unableToBookAppointment,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Header user={null} />
        <div className="min-h-screen flex items-center justify-center mesh-bg p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">{t.appointmentConfirmed}</h2>
              <p className="text-muted-foreground">{t.appointmentBooked}</p>
              <Button onClick={() => navigate('/')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.back}
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header user={null} />
      <div className="min-h-screen mesh-bg p-4">
        <div className="max-w-3xl mx-auto py-8">
          <TooltipProvider>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.back}
            </Button>

            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">{t.bookAppointment}</CardTitle>
                <CardDescription>{t.bookAppointmentDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Patient Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      {t.personalInformation}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">{t.firstName} *</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder={t.enterFirstName}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">{t.lastName} *</Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder={t.enterLastName}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">{t.email} *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t.enterEmail}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">{t.phone}</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input
                              id="phone"
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder={t.enterPhoneNumber}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t.optional}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>

                  {/* Dentist Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="dentist">{t.selectDentist} *</Label>
                    <Select value={selectedDentist} onValueChange={setSelectedDentist}>
                      <SelectTrigger id="dentist">
                        <SelectValue placeholder={t.chooseDentist} />
                      </SelectTrigger>
                      <SelectContent>
                        {dentists.map((dentist) => (
                          <SelectItem key={dentist.id} value={dentist.id}>
                            Dr. {dentist.profiles.first_name} {dentist.profiles.last_name}
                            {dentist.specialization && ` - ${dentist.specialization}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Selection */}
                  <div className="space-y-2">
                    <Label className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {t.selectDate} *
                    </Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      className="rounded-md border"
                    />
                  </div>

                  {/* Time Selection */}
                  {selectedDate && selectedDentist && (
                    <div className="space-y-2">
                      <Label className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        {t.selectTime} *
                      </Label>
                      {loadingTimes ? (
                        <ModernLoadingSpinner variant="minimal" size="sm" message={t.loading} />
                      ) : availableTimes.length > 0 ? (
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {availableTimes.map((time) => (
                            <Button
                              key={time}
                              type="button"
                              variant={selectedTime === time ? "default" : "outline"}
                              onClick={() => setSelectedTime(time)}
                              className="w-full"
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">{t.noSlotsAvailable}</p>
                      )}
                    </div>
                  )}

                  {/* Reason */}
                  <div className="space-y-2">
                    <Label htmlFor="reason">{t.reason}</Label>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={t.describeSymptoms}
                      rows={4}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || !firstName || !lastName || !email || !selectedDentist || !selectedDate || !selectedTime}
                  >
                    {loading ? t.booking : t.confirmBooking}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TooltipProvider>
        </div>
      </div>
      <Footer />
    </>
  );
}
