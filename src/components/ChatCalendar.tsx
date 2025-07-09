import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatCalendarProps {
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  selectedDate?: Date;
  selectedTime?: string;
  onConfirm?: () => void;
}

export const ChatCalendar = ({ 
  onDateSelect, 
  onTimeSelect, 
  selectedDate, 
  selectedTime,
  onConfirm 
}: ChatCalendarProps) => {
  const [step, setStep] = useState<'date' | 'time'>('date');

  const [availableTimes, setAvailableTimes] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date.getDay() === 0 || date.getDay() === 6;
  };

  const fetchAvailability = async (date: Date) => {
    setLoadingTimes(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-integration', {
        body: {
          action: 'getAvailability',
          date: date.toISOString(),
        },
      });

      if (error) throw error;

      const availableSlots = data.availability || [];
      const timeSlots = availableSlots.map((time: string) => ({
        time,
        available: true,
      }));

      setAvailableTimes(timeSlots);
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      // Fallback to some default times if API fails
      setAvailableTimes([
        { time: "09:00", available: true },
        { time: "10:00", available: true },
        { time: "11:00", available: true },
        { time: "14:00", available: true },
        { time: "15:00", available: true },
        { time: "16:00", available: true },
      ]);
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
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center text-lg">
          <CalendarDays className="h-5 w-5 mr-2" />
          {step === 'date' ? 'Choose a date' : 'Choose a time slot'}
        </CardTitle>
        {selectedDate && (
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                day: 'numeric',
                month: 'long'
              })}
            </Badge>
            {selectedTime && (
              <>
                <ArrowRight className="w-4 h-4 text-white/70" />
                <Badge variant="secondary" className="bg-green-500/90 text-white border-white/30">
                  {selectedTime}
                </Badge>
              </>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-4">
        {step === 'date' ? (
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={isDateDisabled}
            className={cn("rounded-md border pointer-events-auto w-full")}
            classNames={{
              months: "flex w-full flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 flex-1",
              month: "space-y-4 w-full flex flex-col",
              table: "w-full h-full border-collapse space-y-1",
              head_row: "",
              head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
              row: "w-full mt-2",
              cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-middle)]:rounded-none first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
              day: "h-8 w-full p-0 font-normal hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground aria-selected:opacity-100",
              day_range_start: "day-range-start",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_range_end: "day-range-end",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
              day_disabled: "text-muted-foreground opacity-50",
              day_hidden: "invisible",
            }}
          />
        ) : (
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setStep('date')}
              className="mb-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              ← Change date
            </Button>
            
            {loadingTimes ? (
              <div className="text-center py-4 text-gray-500">
                Loading available times...
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableTimes.map(({ time, available }) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  size="sm"
                  disabled={!available}
                  onClick={() => handleTimeSelect(time)}
                  className={cn(
                    "justify-center py-3 font-medium transition-all",
                    !available && "opacity-50 cursor-not-allowed bg-gray-100",
                    selectedTime === time && "bg-blue-600 text-white shadow-md",
                    available && selectedTime !== time && "hover:bg-blue-50 hover:border-blue-300"
                  )}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {time}
                  {!available && (
                    <span className="ml-1 text-xs text-red-500">Busy</span>
                  )}
                </Button>
                ))}
              </div>
            )}

            {selectedTime && (
              <Button 
                onClick={handleConfirm}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-3 shadow-md"
              >
                ✓ Confirm appointment
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};