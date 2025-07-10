import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Clock, CalendarDays, CheckCircle, XCircle, Sparkles, Users, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleCalendarProps {
  selectedDentist: string;
  onDateTimeSelect: (date: Date, time: string) => void;
  isEmergency?: boolean;
}

export const SimpleCalendar = ({ selectedDentist, onDateTimeSelect, isEmergency = false }: SimpleCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [availableSlots, setAvailableSlots] = useState<{time: string, available: boolean}[]>([]);
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

      // Fetch ALL slots for the date to show both available and booked
      const { data: slots, error } = await supabase
        .from('appointment_slots')
        .select('slot_time, is_available, emergency_only')
        .eq('dentist_id', selectedDentist)
        .eq('slot_date', date.toISOString().split('T')[0])
        .order('slot_time');

      if (error) throw error;

      // Filter slots based on emergency status and create slot objects with availability info
      const filteredSlots = slots?.filter(slot => 
        isEmergency ? slot.emergency_only : !slot.emergency_only
      ) || [];
      
      const slotData = filteredSlots.map(slot => ({
        time: slot.slot_time.substring(0, 5),
        available: slot.is_available
      }));
      
      setAvailableSlots(slotData);
      
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les créneaux disponibles",
        variant: "destructive",
      });
      setAvailableSlots([]);
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

  const handleTimeSelect = (time: string, available: boolean) => {
    if (!available) return; // Don't allow selection of booked slots
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

  const getTimeOfDay = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const getTimeIcon = (time: string) => {
    const timeOfDay = getTimeOfDay(time);
    if (timeOfDay === 'morning') return '🌅';
    if (timeOfDay === 'afternoon') return '☀️';
    return '🌙';
  };

  const getTimeColor = (time: string) => {
    const timeOfDay = getTimeOfDay(time);
    if (timeOfDay === 'morning') return 'from-orange-100 to-yellow-100 border-orange-200 text-orange-800';
    if (timeOfDay === 'afternoon') return 'from-blue-100 to-sky-100 border-blue-200 text-blue-800';
    return 'from-purple-100 to-indigo-100 border-purple-200 text-purple-800';
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-blue-50 via-white to-indigo-50 border border-blue-200/50 shadow-lg">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-3 text-2xl">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
              <CalendarDays className="h-6 w-6" />
            </div>
            Choisissez votre date et heure
            {isEmergency && (
              <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse">
                <Sparkles className="h-3 w-3 mr-1" />
                URGENCE
              </Badge>
            )}
          </CardTitle>
          <p className="text-muted-foreground">
            Sélectionnez la date et l'heure qui vous conviennent le mieux
          </p>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Date Selection - Bigger Calendar */}
        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg text-white">
                <CalendarDays className="h-4 w-4" />
              </div>
              Sélectionnez une date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={isDateDisabled}
                className={cn(
                  "rounded-xl border-2 border-gray-200/50 shadow-lg bg-white/90 backdrop-blur-sm p-6 pointer-events-auto text-lg",
                  "[&_table]:w-full [&_td]:h-14 [&_td]:w-14 [&_th]:h-12 [&_th]:text-base [&_button]:h-12 [&_button]:w-12 [&_button]:text-base",
                  selectedDate && "border-blue-300 shadow-blue-100"
                )}
              />
            </div>
            {selectedDate && (
              <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {selectedDate.toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time Selection */}
        <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg text-white">
                <Clock className="h-4 w-4" />
              </div>
              Choisissez un créneau
              {selectedDate && (
                <Badge variant="outline" className="ml-auto">
                  {isEmergency ? (
                    <>
                      <Sparkles className="h-3 w-3 mr-1 text-red-500" />
                      Urgence
                    </>
                  ) : (
                    <>
                      <Timer className="h-3 w-3 mr-1 text-blue-500" />
                      Standard
                    </>
                  )}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <div className="text-center py-12 text-gray-400">
                <CalendarDays className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Sélectionnez d'abord une date</p>
                <p className="text-sm">Puis choisissez votre créneau horaire</p>
              </div>
            ) : loadingTimes ? (
              <div className="flex flex-col justify-center items-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 absolute top-0"></div>
                </div>
                <span className="mt-4 text-gray-600 font-medium">Recherche des créneaux...</span>
                <span className="text-sm text-gray-500">Veuillez patienter</span>
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {availableSlots.filter(slot => slot.available).length} créneaux disponibles
                  <div className="flex items-center gap-1 ml-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs">Disponible</span>
                    <div className="w-3 h-3 bg-red-500 rounded-full ml-2"></div>
                    <span className="text-xs">Réservé</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={selectedTime === slot.time ? "default" : "outline"}
                      onClick={() => handleTimeSelect(slot.time, slot.available)}
                      disabled={!slot.available}
                      className={cn(
                        "h-14 flex flex-col items-center justify-center transition-all duration-200",
                        selectedTime === slot.time 
                          ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg border-0" 
                          : slot.available
                            ? "bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-2 border-green-300 text-green-800 hover:scale-105 hover:shadow-md"
                            : "bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 text-red-600 cursor-not-allowed opacity-75"
                      )}
                    >
                      <span className="text-xs opacity-75">{getTimeIcon(slot.time)}</span>
                      <span className="font-semibold">{slot.time}</span>
                      {!slot.available && <span className="text-xs">Réservé</span>}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <XCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Aucun créneau disponible</p>
                <p className="text-sm">Essayez une autre date</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selection Summary */}
      {selectedDate && selectedTime && (
        <Card className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-2 border-green-300 shadow-xl animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">Rendez-vous sélectionné</h3>
                  <p className="text-green-700">
                    {selectedDate.toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })} à {selectedTime}
                  </p>
                </div>
              </div>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <Sparkles className="h-3 w-3 mr-1" />
                Confirmé
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};