import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, ArrowRight, Sparkles, CheckCircle, LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCard } from "@/components/ui/animated-card";
import { toast } from "sonner";

interface ChatCalendarProps {
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  selectedDate?: Date;
  selectedTime?: string;
  onConfirm?: () => void;
  isEmergency?: boolean;
}

export const ChatCalendar = ({ 
  onDateSelect, 
  onTimeSelect, 
  selectedDate, 
  selectedTime,
  onConfirm,
  isEmergency = false
}: ChatCalendarProps) => {
  const [step, setStep] = useState<'date' | 'time'>('date');
  const [availableTimes, setAvailableTimes] = useState<{ time: string; available: boolean; emergency?: boolean }[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);


  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date.getDay() === 0 || date.getDay() === 6;
  };

  const fetchAvailability = async (date: Date) => {
    setLoadingTimes(true);
    try {
      console.log('Fetching availability for date:', date.toISOString().split('T')[0]);
      
      // Get the first available dentist to check slots for
      const { data: dentists } = await supabase
        .from("dentists")
        .select("id")
        .eq("is_active", true)
        .limit(1);

      if (!dentists || dentists.length === 0) {
        throw new Error('No dentists available');
      }

      const dentistId = dentists[0].id;

      // Generate slots for this date and dentist if they don't exist
      try {
        await supabase.rpc('generate_daily_slots', {
          p_dentist_id: dentistId,
          p_date: date.toISOString().split('T')[0]
        });
      } catch (slotError) {
        console.warn('Could not generate slots:', slotError);
      }

      // Fetch available slots from database for this specific dentist
      const { data: slots, error } = await supabase
        .from('appointment_slots')
        .select('slot_time, is_available, emergency_only')
        .eq('dentist_id', dentistId)
        .eq('slot_date', date.toISOString().split('T')[0])
        .eq('is_available', true)
        .order('slot_time');

      if (error) {
        console.error('Database error:', error);
        throw new Error('Failed to fetch database availability');
      }

      console.log('Database slots for dentist', dentistId, ':', slots);

      if (slots && slots.length > 0) {
        // Filter slots based on emergency status
        const filteredSlots = slots.filter(slot => {
          if (isEmergency) {
            // Emergency cases can book any available slot
            return true;
          } else {
            // Non-emergency cases can only book non-emergency slots
            return !slot.emergency_only;
          }
        });

        const timeSlots = filteredSlots.map(slot => ({
          time: slot.slot_time.substring(0, 5), // Format HH:MM
          available: true,
          emergency: slot.emergency_only
        }));
        setAvailableTimes(timeSlots);
        console.log('Using filtered database slots:', timeSlots);
      } else {
        console.log('No available database slots found');
        
        // Provide fallback times when no database slots are available
        const fallbackTimes = [
          { time: "09:00", available: true, emergency: false },
          { time: "09:30", available: true, emergency: false },
          { time: "10:00", available: true, emergency: false },
          { time: "10:30", available: true, emergency: false },
          { time: "11:00", available: true, emergency: false },
        ];
        
        // Add emergency slots if this is an emergency case
        if (isEmergency) {
          fallbackTimes.push(
            { time: "11:30", available: true, emergency: true },
            { time: "12:00", available: true, emergency: true },
            { time: "14:00", available: true, emergency: true },
            { time: "14:30", available: true, emergency: true },
            { time: "15:00", available: true, emergency: true },
            { time: "15:30", available: true, emergency: true },
            { time: "16:00", available: true, emergency: true }
          );
        }
        
        setAvailableTimes(fallbackTimes);
      }
      
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      
      toast.error('Failed to load available times from database');
      
      // Provide fallback times when database fails
      const fallbackTimes = [
        { time: "09:00", available: true, emergency: false },
        { time: "09:30", available: true, emergency: false },
        { time: "10:00", available: true, emergency: false },
        { time: "10:30", available: true, emergency: false },
        { time: "11:00", available: true, emergency: false },
      ];
      
      // Add emergency slots if this is an emergency case
      if (isEmergency) {
        fallbackTimes.push(
          { time: "11:30", available: true, emergency: true },
          { time: "12:00", available: true, emergency: true },
          { time: "14:00", available: true, emergency: true },
          { time: "14:30", available: true, emergency: true },
          { time: "15:00", available: true, emergency: true },
          { time: "15:30", available: true, emergency: true },
          { time: "16:00", available: true, emergency: true }
        );
      }
      
      setAvailableTimes(fallbackTimes);
    } finally {
      setLoadingTimes(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect(date);
      setStep('time');
      fetchAvailability(date);
    }
  };

  const handleTimeSelect = (time: string) => {
    onTimeSelect(time);
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  return (
    <AnimatedCard className="w-full max-w-2xl mx-auto" gradient glow>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-10 rounded-t-lg" />
        <CardHeader className="pb-6 relative z-10">
          <CardTitle className="flex items-center text-2xl text-dental-primary font-bold">
            <div className="p-3 bg-dental-primary/10 rounded-xl mr-4">
              <CalendarDays className="h-7 w-7 text-dental-primary" />
            </div>
            {step === 'date' ? 'Choose Your Perfect Date' : 'Select Your Ideal Time'}
          </CardTitle>
          {selectedDate && (
            <div className="flex items-center space-x-4 mt-6">
              <Badge className="bg-dental-primary text-dental-primary-foreground border-0 px-6 py-3 text-base font-semibold rounded-full shadow-elegant">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  day: 'numeric',
                  month: 'long'
                })}
              </Badge>
              {selectedTime && (
                <>
                  <ArrowRight className="w-6 h-6 text-dental-secondary animate-pulse" />
                  <Badge className="bg-dental-secondary text-dental-secondary-foreground border-0 px-6 py-3 text-base font-semibold rounded-full shadow-elegant">
                    <Clock className="w-5 h-5 mr-2" />
                    {selectedTime}
                  </Badge>
                </>
              )}
            </div>
          )}
        </CardHeader>
      </div>
      
      <CardContent className="p-8">
        {step === 'date' ? (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-dental-muted-foreground text-lg">
                Select your preferred appointment date
              </p>
              <p className="text-sm text-dental-muted-foreground/70 mt-2">
                • Weekend appointments are not available
                • Dates in the past are disabled
                {isEmergency && (
                  <>
                    <br />• Emergency case: Priority slots (11:30+ AM) available
                  </>
                )}
              </p>
            </div>
            
            <div className="bg-gradient-card rounded-2xl p-6 shadow-subtle">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={isDateDisabled}
                className="rounded-xl border-0 pointer-events-auto w-full"
                classNames={{
                  months: "flex w-full flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 flex-1",
                  month: "space-y-6 w-full flex flex-col",
                  caption: "flex justify-center pt-2 pb-4 relative items-center",
                  caption_label: "text-lg font-bold text-dental-primary",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-10 w-10 bg-dental-primary/10 hover:bg-dental-primary/20 rounded-xl transition-all duration-200 hover:scale-105",
                  nav_button_previous: "absolute left-2",
                  nav_button_next: "absolute right-2",
                  table: "w-full border-collapse space-y-2",
                  head_row: "flex justify-between w-full mb-2",
                  head_cell: "text-dental-muted-foreground rounded-lg w-12 h-12 font-semibold text-sm flex items-center justify-center",
                  row: "flex w-full mt-3 justify-between",
                  cell: "relative p-0 text-center text-base focus-within:relative focus-within:z-20 w-12 h-12",
                  day: "h-12 w-12 p-0 font-semibold hover:bg-dental-primary/10 hover:text-dental-primary rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg flex items-center justify-center",
                  day_selected: "bg-dental-primary text-dental-primary-foreground hover:bg-dental-primary hover:text-dental-primary-foreground shadow-elegant scale-110",
                  day_today: "bg-dental-accent/20 text-dental-accent font-bold ring-2 ring-dental-accent/30",
                  day_outside: "text-dental-muted-foreground/40 opacity-40 hover:opacity-60",
                  day_disabled: "text-dental-muted-foreground/20 opacity-20 cursor-not-allowed hover:bg-transparent hover:scale-100",
                  day_hidden: "invisible",
                }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setStep('date')}
                className="text-dental-primary hover:text-dental-primary hover:bg-dental-primary/10 transition-all duration-200 font-medium"
              >
                ← Back to date selection
              </Button>
              <div className="text-sm text-dental-muted-foreground">
                Step 2 of 2
              </div>
            </div>
            
            {loadingTimes ? (
              <div className="text-center py-12">
                <div className="inline-flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-dental-primary/10 rounded-full flex items-center justify-center">
                      <Sparkles className="w-8 h-8 animate-spin text-dental-primary" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-dental-primary">Finding perfect times</h3>
                    <p className="text-dental-muted-foreground mt-1">Checking dentist's availability...</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-dental-primary flex items-center justify-center">
                    <Clock className="w-6 h-6 mr-2" />
                    Available Time Slots
                  </h3>
                  <p className="text-dental-muted-foreground mt-2">
                    Choose the time that works best for you
                  </p>
                </div>
                
                <div className="bg-gradient-card rounded-2xl p-6 shadow-subtle">
                  <div className="grid grid-cols-2 gap-4">
                    {availableTimes.map(({ time, available, emergency }) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        disabled={!available}
                        onClick={() => handleTimeSelect(time)}
                        className={cn(
                          "py-6 px-6 font-bold transition-all duration-300 rounded-xl text-base relative overflow-hidden",
                          !available && "opacity-30 cursor-not-allowed bg-muted/50 text-muted-foreground",
                          selectedTime === time && "bg-dental-primary text-dental-primary-foreground shadow-elegant scale-105 ring-2 ring-dental-primary/20",
                          available && selectedTime !== time && "hover:bg-dental-primary/10 hover:border-dental-primary hover:text-dental-primary hover:scale-105 hover:shadow-lg border-2",
                          emergency && "border-red-300 bg-red-50/50"
                        )}
                      >
                        <div className="flex items-center justify-center space-x-3">
                          <div className={cn(
                            "p-2 rounded-lg transition-all duration-200",
                            selectedTime === time ? "bg-white/20" : emergency ? "bg-red-100" : "bg-dental-primary/10"
                          )}>
                            <Clock className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-lg">{time}</span>
                            {emergency && (
                              <span className="text-xs text-red-600 font-medium">Emergency Only</span>
                            )}
                          </div>
                          {selectedTime === time && (
                            <CheckCircle className="w-5 h-5 animate-pulse" />
                          )}
                        </div>
                        {!available && (
                          <div className="absolute inset-0 bg-muted/80 rounded-xl flex items-center justify-center">
                            <span className="text-xs font-semibold text-muted-foreground">Unavailable</span>
                          </div>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedTime && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-dental-primary/5 to-dental-secondary/5 border border-dental-primary/20 rounded-xl p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-dental-primary/10 rounded-xl">
                      <CheckCircle className="w-6 h-6 text-dental-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-dental-primary">Perfect! You're all set</h4>
                      <p className="text-dental-muted-foreground">
                        Ready to confirm your appointment for {selectedDate?.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        })} at {selectedTime}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleConfirm}
                  className="w-full bg-gradient-primary text-white font-bold py-6 shadow-elegant hover:shadow-glow transition-all duration-300 rounded-xl text-lg hover:scale-105"
                >
                  <CheckCircle className="w-6 h-6 mr-3" />
                  Confirm My Appointment
                  <Sparkles className="w-5 h-5 ml-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </AnimatedCard>
  );
};