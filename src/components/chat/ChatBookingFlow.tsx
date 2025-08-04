import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, CheckCircle, User as UserIcon } from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";

interface ChatBookingFlowProps {
  user: User;
  selectedDentist?: any;
  onComplete: (appointmentData: any) => void;
  onCancel: () => void;
  onResponse: (message: string) => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
  emergency_only?: boolean;
}

export const ChatBookingFlow = ({ 
  user, 
  selectedDentist, 
  onComplete, 
  onCancel, 
  onResponse 
}: ChatBookingFlowProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [dentists, setDentists] = useState<any[]>([]);
  const [currentDentist, setCurrentDentist] = useState(selectedDentist);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'dentist' | 'date' | 'time' | 'confirm'>('dentist');

  useEffect(() => {
    fetchDentists();
    if (selectedDentist) {
      setStep('date');
      onResponse(`Great! I'll help you book an appointment with Dr. ${selectedDentist.profiles?.first_name} ${selectedDentist.profiles?.last_name}. Please select your preferred date:`);
    }
  }, []);

  const fetchDentists = async () => {
    try {
      const { data, error } = await supabase
        .from("dentists")
        .select(`
          id,
          specialty,
          profiles:profile_id (
            first_name,
            last_name
          )
        `)
        .eq("is_active", true);

      if (error) throw error;
      setDentists(data || []);
    } catch (error) {
      console.error("Error fetching dentists:", error);
    }
  };

  const fetchAvailableSlots = async (date: Date, dentistId: string) => {
    setLoading(true);
    try {
      // Generate slots for the date
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
        emergency_only: slot.emergency_only
      }));

      setAvailableSlots(slots);
      
      const availableCount = slots.filter(s => s.available).length;
      if (availableCount === 0) {
        onResponse(`No available slots for ${format(date, "EEEE, MMMM d")}. Please try a different date.`);
      } else {
        onResponse(`Available times for ${format(date, "EEEE, MMMM d")} with Dr. ${currentDentist.profiles?.first_name} ${currentDentist.profiles?.last_name}:`);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      onResponse("Sorry, I couldn't load the available times. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date || !currentDentist) return;
    
    setSelectedDate(date);
    setSelectedTime(undefined);
    setStep('time');
    fetchAvailableSlots(date, currentDentist.id);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('confirm');
    onResponse(`Perfect! You've selected ${format(selectedDate!, "EEEE, MMMM d")} at ${time} with Dr. ${currentDentist.profiles?.first_name} ${currentDentist.profiles?.last_name}. Would you like to confirm this appointment?`);
  };

  const confirmBooking = async () => {
    if (!selectedDate || !selectedTime || !currentDentist) return;

    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, phone, email")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      // Check required fields
      const requiredFields = ['first_name', 'last_name', 'phone', 'email'];
      const missingFields = requiredFields.filter(field => !profile[field]);
      
      if (missingFields.length > 0) {
        onResponse("I need some additional information to complete your booking. Please update your profile with your name, phone, and email address in the settings first.");
        onCancel();
        return;
      }

      const appointmentDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":");
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          patient_id: profile.id,
          dentist_id: currentDentist.id,
          appointment_date: appointmentDateTime.toISOString(),
          reason: "General consultation",
          status: "pending",
          urgency: "medium"
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      const { error: slotError } = await supabase.rpc('book_appointment_slot', {
        p_dentist_id: currentDentist.id,
        p_slot_date: selectedDate.toISOString().split('T')[0],
        p_slot_time: selectedTime + ':00',
        p_appointment_id: appointmentData.id
      });

      if (slotError) {
        await supabase.from("appointments").delete().eq("id", appointmentData.id);
        throw new Error("This time slot is no longer available");
      }

      toast({
        title: "Appointment Confirmed!",
        description: `Your appointment is scheduled for ${format(selectedDate, "EEEE, MMMM d")} at ${selectedTime}`
      });


      const confirmationMessage = `🎉 **Appointment Confirmed!**

📅 **Date:** ${format(selectedDate, "EEEE, MMMM d, yyyy")}
🕒 **Time:** ${selectedTime}
👨‍⚕️ **Dentist:** Dr. ${currentDentist.profiles?.first_name} ${currentDentist.profiles?.last_name}
📝 **Type:** General consultation

You'll receive a confirmation email shortly. If you need to reschedule or cancel, just ask me!`;

      onComplete({
        appointmentId: appointmentData.id,
        date: selectedDate,
        time: selectedTime,
        dentist: currentDentist,
        message: confirmationMessage
      });

    } catch (error) {
      console.error("Error booking appointment:", error);
      onResponse("I'm sorry, I couldn't complete your booking. Please try again or contact the clinic directly.");
    } finally {
      setLoading(false);
    }
  };

  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date());
    return date < today || date.getDay() === 0 || date.getDay() === 6;
  };

  if (step === 'date' || step === 'time') {
    return (
      <Card className="max-w-md mx-auto my-4 border-primary/20 shadow-lg">
        <CardContent className="p-6">
          {step === 'date' && (
            <div className="space-y-4">
              <div className="text-center">
                <CalendarDays className="h-8 w-8 mx-auto text-primary mb-2" />
                <h3 className="font-semibold">Select Date</h3>
                <p className="text-sm text-muted-foreground">
                  Dr. {currentDentist?.profiles?.first_name} {currentDentist?.profiles?.last_name}
                </p>
              </div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={isDateDisabled}
                className="rounded-lg border"
              />
            </div>
          )}

          {step === 'time' && selectedDate && (
            <div className="space-y-4">
              <div className="text-center">
                <Clock className="h-8 w-8 mx-auto text-primary mb-2" />
                <h3 className="font-semibold">Select Time</h3>
                <p className="text-sm text-muted-foreground">
                  {format(selectedDate, "EEEE, MMMM d")}
                </p>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading times...</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.filter(slot => slot.available).map((slot) => (
                    <Button
                      key={slot.time}
                      variant={selectedTime === slot.time ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTimeSelect(slot.time)}
                      className="text-sm"
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            {step === 'date' && (
              <Button 
                onClick={() => setStep('time')} 
                disabled={!selectedDate}
                className="flex-1"
              >
                Continue
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'confirm') {
    return (
      <Card className="max-w-md mx-auto my-4 border-primary/20 shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <h3 className="font-semibold">Confirm Appointment</h3>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span>Dr. {currentDentist?.profiles?.first_name} {currentDentist?.profiles?.last_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span>{format(selectedDate!, "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{selectedTime}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={confirmBooking} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Booking..." : "Confirm"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};