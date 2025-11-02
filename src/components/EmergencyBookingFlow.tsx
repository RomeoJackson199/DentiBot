// @ts-nocheck
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguageDetection } from "@/hooks/useLanguageDetection";
import { EmergencyTriageWizard } from "./EmergencyTriageWizard";
import { DentistRecommendations } from "./DentistRecommendations";
import { SimpleCalendar } from "./SimpleCalendar";
import { 
  AlertTriangle, 
  Clock, 
  Calendar as CalendarIcon, 
  CheckCircle, 
  Users,
  Zap
} from "lucide-react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { logger } from '@/lib/logger';
import { clinicTimeToUtc, createAppointmentDateTimeFromStrings } from "@/lib/timezone";

interface EmergencyBookingFlowProps {
  user: { id: string; email?: string };
  onComplete: (appointmentData?: any) => void;
  onCancel: () => void;
}

interface TriageData {
  painLevel: number;
  symptoms: string[];
  duration: string;
  medicalHistory: string[];
  problemType: string;
  previousTreatment: string;
  allergies: string[];
  urgencyIndicators: string[];
  painDescription: string;
  triggeredBy: string[];
}

interface Dentist {
  id: string;
  profile_id: string;
  specialization: string;
  specialty?: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
  emergency_only: boolean;
}

export const EmergencyBookingFlow = ({ user, onComplete, onCancel }: EmergencyBookingFlowProps) => {
  const { t } = useLanguageDetection();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<'triage' | 'booking' | 'confirmation'>('triage');
  const [urgencyLevel, setUrgencyLevel] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [triageData, setTriageData] = useState<TriageData | null>(null);
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  useEffect(() => {
    fetchDentists();
  }, []);

  const fetchDentists = async () => {
    try {
      const { data, error } = await supabase
        .from('dentists')
        .select(`
          id,
          profile_id,
          specialization,
          profiles (
            first_name,
            last_name
          )
        `)
        .eq('is_active', true);

      if (error) throw error;
      setDentists(data || []);
      if (data && data.length > 0) {
        setSelectedDentist(data[0]); // Auto-select first available dentist
      }
    } catch (error) {
      console.error('Error fetching dentists:', error);
      toast({
        title: "Error",
        description: "Failed to load available dentists",
        variant: "destructive"
      });
    }
  };

  const fetchAvailableSlots = async (dentistId: string, date: Date) => {
    try {
      setLoading(true);
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // First, try to generate slots for the date
      await supabase.functions.invoke('generate-slots', {
        body: { dentist_id: dentistId, date: formattedDate }
      });

      const { data, error } = await supabase
        .from('appointment_slots')
        .select('slot_time, is_available, emergency_only')
        .eq('dentist_id', dentistId)
        .eq('slot_date', formattedDate)
        .order('slot_time');

      if (error) throw error;

      const slots: TimeSlot[] = (data || []).map(slot => ({
        time: slot.slot_time,
        available: slot.is_available,
        emergency_only: slot.emergency_only
      }));

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyConfig = (level: 1 | 2 | 3 | 4 | 5) => {
    const configs = {
      5: { 
        label: t('triage.result.emergency'), 
        color: 'bg-red-500 text-white', 
        icon: Zap,
        priority: 'emergency',
        suggestToday: true
      },
      4: { 
        label: t('triage.result.high'), 
        color: 'bg-orange-500 text-white', 
        icon: AlertTriangle,
        priority: 'high',
        suggestToday: true
      },
      3: { 
        label: t('triage.result.medium'), 
        color: 'bg-yellow-500 text-black', 
        icon: Clock,
        priority: 'medium',
        suggestToday: false
      },
      2: { 
        label: t('triage.result.low'), 
        color: 'bg-blue-500 text-white', 
        icon: CalendarIcon,
        priority: 'low',
        suggestToday: false
      },
      1: { 
        label: t('triage.result.low'), 
        color: 'bg-green-500 text-white', 
        icon: CalendarIcon,
        priority: 'low',
        suggestToday: false
      }
    };
    return configs[level];
  };

  const getSuggestedDates = (urgency: 1 | 2 | 3 | 4 | 5) => {
    const today = new Date();
    const dates = [];
    
    if (urgency >= 4) {
      // Emergency/High urgency - suggest today and next 2 days
      dates.push(today);
      dates.push(addDays(today, 1));
      dates.push(addDays(today, 2));
    } else if (urgency === 3) {
      // Medium urgency - next 3-5 days
      for (let i = 1; i <= 5; i++) {
        dates.push(addDays(today, i));
      }
    } else {
      // Low urgency - next week onwards
      for (let i = 7; i <= 14; i++) {
        dates.push(addDays(today, i));
      }
    }
    
    return dates.filter(date => {
      const dayOfWeek = date.getDay();
      return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude weekends
    });
  };

  const handleTriageComplete = (urgency: 1 | 2 | 3 | 4 | 5, data: TriageData) => {
    setUrgencyLevel(urgency);
    setTriageData(data);
    setCurrentStep('booking');
    
    // Auto-suggest first available date based on urgency
    const suggestedDates = getSuggestedDates(urgency);
    if (suggestedDates.length > 0 && selectedDentist) {
      setSelectedDate(suggestedDates[0]);
      fetchAvailableSlots(selectedDentist.id, suggestedDates[0]);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime("");
    if (selectedDentist) {
      fetchAvailableSlots(selectedDentist.id, date);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const bookAppointment = async () => {
    if (!selectedDentist || !selectedDate || !selectedTime || !triageData) {
      toast({
        title: "Error",
        description: "Please select a dentist, date, and time",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Get or create patient profile
      let profileData;
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (existingProfile) {
        profileData = existingProfile;
      } else {
        // Create profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            email: user.email || '',
            first_name: '',
            last_name: '',
            role: 'patient'
          })
          .select('id')
          .single();

        if (createError) throw createError;
        profileData = newProfile;
      }

      if (!profileData) {
        throw new Error('Unable to create or find user profile');
      }

      // Create appointment with proper timezone handling
      // Use format to preserve Brussels date without UTC conversion
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      // Parse date and time strings as Brussels timezone and convert to UTC
      const appointmentDateTime = createAppointmentDateTimeFromStrings(dateStr, selectedTime);

      const urgencyConfig = getUrgencyConfig(urgencyLevel);
      const urgencyValue = urgencyConfig.priority as 'low' | 'medium' | 'high' | 'emergency';

      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_id: profileData.id,
          dentist_id: selectedDentist.id,
          appointment_date: appointmentDateTime.toISOString(),
          status: 'confirmed',
          urgency: urgencyValue,
          reason: `Emergency triage - Pain level: ${triageData.painLevel}/10, Symptoms: ${triageData.symptoms.join(', ')}`
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Book the slot
      const { error: slotError } = await supabase.rpc('book_appointment_slot', {
        p_dentist_id: selectedDentist.id,
        p_slot_date: format(selectedDate, 'yyyy-MM-dd'),
        p_slot_time: selectedTime,
        p_appointment_id: appointmentData.id
      });

      if (slotError) throw slotError;

      // Create urgency assessment record
      await supabase
        .from('urgency_assessments')
        .insert({
          appointment_id: appointmentData.id,
          pain_level: triageData.painLevel,
          has_bleeding: triageData.symptoms.includes('bleeding'),
          has_swelling: triageData.symptoms.includes('swelling'),
          duration_symptoms: triageData.duration,
          assessment_score: urgencyLevel * 2,
          calculated_urgency: urgencyValue
        });

      setAppointmentId(appointmentData.id);
      setCurrentStep('confirmation');

      toast({
        title: t('booking.success'),
        description: `Your ${urgencyConfig.priority} appointment has been scheduled`,
      });

    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Error",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSlots = availableSlots.filter(slot => {
    if (urgencyLevel >= 4) {
      // High urgency can access all slots including emergency-only
      return slot.available;
    } else {
      // Regular urgency only gets non-emergency slots
      return slot.available && !slot.emergency_only;
    }
  });

  if (currentStep === 'triage') {
    return (
      <EmergencyTriageWizard
        onComplete={handleTriageComplete}
        onCancel={onCancel}
      />
    );
  }

  if (currentStep === 'confirmation') {
    const urgencyConfig = getUrgencyConfig(urgencyLevel);
    const UrgencyIcon = urgencyConfig.icon;
    
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">{t('booking.success')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-4">
            <Badge className={urgencyConfig.color} variant="secondary">
              <UrgencyIcon className="h-4 w-4 mr-2" />
              {urgencyConfig.label}
            </Badge>
            
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">{t('booking.detailsTitle')}</h3>
              <p><strong>{t('booking.dentist')}:</strong> Dr. {selectedDentist?.profiles.first_name} {selectedDentist?.profiles.last_name}</p>
              <p><strong>{t('booking.date')}:</strong> {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
              <p><strong>{t('booking.time')}:</strong> {selectedTime}</p>
              <p><strong>{t('booking.urgency')}:</strong> {urgencyConfig.label}</p>
            </div>

            {urgencyLevel >= 4 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {t('booking.urgentArrivalNotice')}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Button onClick={() => onComplete(appointmentId)} className="w-full">
            {t('booking.continue')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Booking step
  const urgencyConfig = getUrgencyConfig(urgencyLevel);
  const UrgencyIcon = urgencyConfig.icon;
  const suggestedDates = getSuggestedDates(urgencyLevel);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('booking.title')}</span>
            <Badge className={urgencyConfig.color} variant="secondary">
              <UrgencyIcon className="h-4 w-4 mr-2" />
              {urgencyConfig.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Dentist Recommendations */}
          <DentistRecommendations
            urgencyLevel={urgencyLevel}
            symptoms={triageData?.symptoms}
            triageData={{
              problemType: triageData?.problemType,
              allergies: triageData?.allergies,
              urgencyIndicators: triageData?.urgencyIndicators,
              painDescription: triageData?.painDescription,
              triggeredBy: triageData?.triggeredBy,
              medicalHistory: triageData?.medicalHistory
            }}
            onSelectDentist={(dentist) => {
              setSelectedDentist(dentist as unknown as Dentist);
              // Auto-suggest first available date when dentist is selected
              const suggestedDates = getSuggestedDates(urgencyLevel);
              if (suggestedDates.length > 0) {
                setSelectedDate(suggestedDates[0]);
                fetchAvailableSlots(dentist.id, suggestedDates[0]);
              }
            }}
          />

          {/* Selected Dentist Display */}
          {selectedDentist && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    ✅ {t('booking.selectedDentist')}: Dr. {selectedDentist.profiles.first_name} {selectedDentist.profiles.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedDentist.specialization}</p>
                </div>
                <Badge variant="default">{t('booking.selectedBadge')}</Badge>
              </div>
            </Card>
          )}

          {/* Suggested Dates for High Urgency */}
          {urgencyLevel >= 4 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center text-orange-600">
                <Zap className="h-4 w-4 mr-2" />
                {t('booking.earliest')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {suggestedDates.slice(0, 3).map((date) => (
                  <Button
                    key={date.toISOString()}
                    variant={selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') ? "default" : "outline"}
                    onClick={() => handleDateSelect(date)}
                    className="text-sm"
                  >
                    {format(date, 'EEE, MMM d')}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Calendar and Time Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">{t('booking.selectDate')}</h3>
              <Calendar
                mode="single"
                selected={selectedDate || undefined}
                onSelect={(date) => date && handleDateSelect(date)}
                disabled={(date) => {
                  const dayOfWeek = date.getDay();
                  return dayOfWeek === 0 || dayOfWeek === 6 || isBefore(date, startOfDay(new Date()));
                }}
                className="rounded-md border"
              />
            </div>

            <div>
              <h3 className="font-semibold mb-3">{t('booking.availableTimes')}</h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
                </div>
              ) : filteredSlots.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {filteredSlots.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={selectedTime === slot.time ? "default" : "outline"}
                      onClick={() => handleTimeSelect(slot.time)}
                      className={`text-sm ${slot.emergency_only ? 'border-orange-300 bg-orange-50' : ''}`}
                    >
                      {slot.time}
                      {slot.emergency_only && (
                        <Zap className="h-3 w-3 ml-1 text-orange-500" />
                      )}
                    </Button>
                  ))}
                </div>
              ) : selectedDate ? (
                <p className="text-center py-8 text-muted-foreground">
                  {t('booking.noSlots')}
                </p>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  {t('booking.selectDatePrompt')}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={bookAppointment}
              disabled={!selectedDate || !selectedTime || loading}
              className="flex-1"
            >
              {loading ? t('common.loading') : t('booking.confirm')}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};