import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CalendarDays, CheckCircle, XCircle } from "lucide-react";

interface SimpleCalendarProps {
  selectedDentist: string;
  onDateTimeSelect: (date: Date, time: string) => void;
  isEmergency?: boolean;
}

export const SimpleCalendar = ({ selectedDentist, onDateTimeSelect, isEmergency = false }: SimpleCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [loadingTimes, setLoadingTimes] = useState(false);
  const { toast } = useToast();

  const fetchAvailability = async (date: Date) => {
    if (!selectedDentist) return;
    
    setLoadingTimes(true);
    setSelectedTime("");
    
    try {
      // Generate slots for the selected date
      await supabase.rpc('generate_daily_slots', {
        p_dentist_id: selectedDentist,
        p_date: date.toISOString().split('T')[0]
      });

      // Fetch available slots
      const { data: slots, error } = await supabase
        .from('appointment_slots')
        .select('slot_time, is_available, emergency_only')
        .eq('dentist_id', selectedDentist)
        .eq('slot_date', date.toISOString().split('T')[0])
        .eq('is_available', true)
        .order('slot_time');

      if (error) throw error;

      // Filter slots based on emergency status
      const filteredSlots = slots?.filter(slot => 
        isEmergency ? slot.emergency_only : !slot.emergency_only
      ) || [];
      
      const timeSlots = filteredSlots.map(slot => slot.slot_time.substring(0, 5));
      setAvailableTimes(timeSlots);
      
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les créneaux disponibles",
        variant: "destructive",
      });
      setAvailableTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      fetchAvailability(date);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      onDateTimeSelect(selectedDate, time);
    }
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date.getDay() === 0 || date.getDay() === 6;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-blue-600" />
          Sélectionner une date et heure
          {isEmergency && (
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
              URGENCE
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Date Selection */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">Choisissez une date</h3>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              className="rounded-lg border shadow-sm"
            />
          </div>
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Créneaux disponibles {isEmergency ? "(Urgence)" : "(Standard)"}
            </h3>
            
            {loadingTimes ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Chargement...</span>
              </div>
            ) : availableTimes.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {availableTimes.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    onClick={() => handleTimeSelect(time)}
                    className="h-12 text-center"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <XCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Aucun créneau disponible pour cette date</p>
                <p className="text-sm">Essayez une autre date</p>
              </div>
            )}
          </div>
        )}

        {/* Selection Summary */}
        {selectedDate && selectedTime && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                Rendez-vous sélectionné: {selectedDate.toLocaleDateString('fr-FR')} à {selectedTime}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};