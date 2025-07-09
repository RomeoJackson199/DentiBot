import { useState } from "react";
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

  const availableTimes = [
    { time: "08:00", available: true },
    { time: "08:30", available: true },
    { time: "09:00", available: false },
    { time: "09:30", available: true },
    { time: "10:00", available: true },
    { time: "10:30", available: false },
    { time: "11:00", available: true },
    { time: "11:30", available: true },
    { time: "14:00", available: true },
    { time: "14:30", available: true },
    { time: "15:00", available: false },
    { time: "15:30", available: true },
    { time: "16:00", available: true },
    { time: "16:30", available: true },
    { time: "17:00", available: true },
    { time: "17:30", available: false }
  ];

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date.getDay() === 0 || date.getDay() === 6;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect(date);
      setStep('time');
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <CalendarDays className="h-5 w-5 mr-2 text-blue-500" />
          {step === 'date' ? 'Choisissez une date' : 'Choisissez un créneau'}
        </CardTitle>
        {selectedDate && (
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-blue-600">
              {selectedDate.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Badge>
            {selectedTime && (
              <>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <Badge variant="outline" className="text-green-600">
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
              className="mb-2 text-blue-600"
            >
              ← Changer la date
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              {availableTimes.map(({ time, available }) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  size="sm"
                  disabled={!available}
                  onClick={() => handleTimeSelect(time)}
                  className={cn(
                    "justify-center",
                    !available && "opacity-50 cursor-not-allowed",
                    selectedTime === time && "bg-blue-600 text-white"
                  )}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {time}
                  {!available && (
                    <span className="ml-1 text-xs text-red-500">Occupé</span>
                  )}
                </Button>
              ))}
            </div>

            {selectedTime && (
              <Button 
                onClick={handleConfirm}
                className="w-full mt-4 bg-green-600 hover:bg-green-700"
              >
                Confirmer le rendez-vous
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};