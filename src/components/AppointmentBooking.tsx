
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarDays, Clock, User as UserIcon, CheckCircle, XCircle } from "lucide-react";

interface AppointmentBookingProps {
  user: User;
  onComplete: (appointmentData?: any) => void;
  onCancel: () => void;
}

interface Dentist {
  id: string;
  profile_id: string;
  specialization: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

export const AppointmentBooking = ({ user, onComplete, onCancel }: AppointmentBookingProps) => {
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [selectedDentist, setSelectedDentist] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [allSlots, setAllSlots] = useState<{slot_time: string, is_available: boolean, emergency_only?: boolean}[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDentists();
  }, []);

  const fetchAvailability = async (date: Date) => {
    if (!selectedDentist) return;
    
    setLoadingTimes(true);
    setSelectedTime("");
    
    try {
      console.log('Fetching availability for:', date.toISOString().split('T')[0]);
      
      await supabase.rpc('generate_daily_slots', {
        p_dentist_id: selectedDentist,
        p_date: date.toISOString().split('T')[0]
      });

      const { data: allSlots, error } = await supabase
        .from('appointment_slots')
        .select('slot_time, is_available, emergency_only')
        .eq('dentist_id', selectedDentist)
        .eq('slot_date', date.toISOString().split('T')[0])
        .order('slot_time');

      if (error) throw error;

      const availableSlots = allSlots?.filter(slot => slot.is_available && !slot.emergency_only)
        .map(slot => slot.slot_time.substring(0, 5)) || [];
      
      setAvailableTimes(availableSlots);
      setAllSlots(allSlots || []);
      
      console.log('Available slots:', availableSlots);
      
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les créneaux disponibles",
        variant: "destructive",
      });
      setAvailableTimes([]);
      setAllSlots([]);
    } finally {
      setLoadingTimes(false);
    }
  };

  const fetchDentists = async () => {
    try {
      const { data, error } = await supabase
        .from("dentists")
        .select(`
          id,
          profile_id,
          specialization,
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
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des dentistes",
        variant: "destructive",
      });
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDentist || !selectedDate || !selectedTime) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner un dentiste, une date et une heure",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      const appointmentDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":");
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          patient_id: profile.id,
          dentist_id: selectedDentist,
          appointment_date: appointmentDateTime.toISOString(),
          reason: reason || "Consultation générale",
          status: "pending",
          urgency: "medium"
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      const { error: slotError } = await supabase.rpc('book_appointment_slot', {
        p_dentist_id: selectedDentist,
        p_slot_date: selectedDate.toISOString().split('T')[0],
        p_slot_time: selectedTime + ':00',
        p_appointment_id: appointmentData.id
      });

      if (slotError) {
        await supabase.from("appointments").delete().eq("id", appointmentData.id);
        throw new Error("Ce créneau n'est plus disponible");
      }


      toast({
        title: "Rendez-vous confirmé !",
        description: `Votre rendez-vous a été pris pour le ${selectedDate.toLocaleDateString()} à ${selectedTime}`,
      });

      onComplete({
        date: selectedDate.toLocaleDateString(),
        time: selectedTime,
        reason: reason || "Consultation générale",
        dentist: dentists.find(d => d.id === selectedDentist)?.profiles.first_name + " " + dentists.find(d => d.id === selectedDentist)?.profiles.last_name
      });
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le rendez-vous",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date.getDay() === 0 || date.getDay() === 6;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="flex items-center justify-center text-2xl font-bold text-gray-800">
              <CalendarDays className="h-6 w-6 mr-3 text-blue-600" />
              Prise de rendez-vous
            </CardTitle>
            <p className="text-gray-600 mt-2">Réservez votre consultation dentaire en quelques clics</p>
          </CardHeader>
          
          <CardContent className="space-y-8 p-6 md:p-8">
            {/* Dentist Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-700 flex items-center">
                <UserIcon className="h-4 w-4 mr-2 text-blue-600" />
                Sélectionnez votre dentiste
              </Label>
              <Select value={selectedDentist} onValueChange={setSelectedDentist}>
                <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-300 transition-colors">
                  <SelectValue placeholder="Choisir un dentiste" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 shadow-lg">
                  {dentists.map((dentist) => (
                    <SelectItem key={dentist.id} value={dentist.id} className="cursor-pointer hover:bg-blue-50">
                      <div className="flex items-center py-1">
                        <UserIcon className="h-4 w-4 mr-3 text-blue-600" />
                        <div>
                          <div className="font-medium">Dr {dentist.profiles.first_name} {dentist.profiles.last_name}</div>
                          <div className="text-sm text-gray-500">{dentist.specialization}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-700">
                Choisissez une date
              </Label>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    if (date) fetchAvailability(date);
                  }}
                  disabled={isDateDisabled}
                  className="rounded-lg border-2 border-gray-200 bg-white shadow-sm"
                />
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div className="space-y-4">
                <Label className="text-base font-semibold text-gray-700 flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-blue-600" />
                  Choisissez un créneau
                </Label>
                
                {loadingTimes ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Chargement des créneaux...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Available Times Grid */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Créneaux disponibles ({availableTimes.length})
                      </h4>
                      {availableTimes.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {availableTimes.map((time) => (
                            <button
                              key={time}
                              onClick={() => setSelectedTime(time)}
                              className={`p-3 rounded-lg border-2 transition-all text-center font-medium ${
                                selectedTime === time
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">Aucun créneau disponible pour cette date</p>
                      )}
                    </div>

                    {/* All Slots Status */}
                    {allSlots.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-700 mb-3">
                          État de tous les créneaux ({allSlots.length} total)
                        </h4>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                           {allSlots.map((slot) => (
                            <div
                              key={slot.slot_time}
                              className={`p-3 rounded-lg text-sm text-center font-medium transition-all border-2 ${
                                slot.is_available
                                  ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                  : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                              }`}
                            >
                              <div className="font-bold">
                                {slot.slot_time.substring(0, 5)}
                              </div>
                              <div className="flex items-center justify-center mt-1">
                                {slot.is_available ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : (
                                  <XCircle className="h-3 w-3" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                         <div className="flex justify-center gap-8 mt-4 text-sm font-medium">
                           <div className="flex items-center bg-green-50 px-3 py-2 rounded-full border border-green-200">
                             <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                             <span className="text-green-700">Disponible ({allSlots.filter(s => s.is_available).length})</span>
                           </div>
                           <div className="flex items-center bg-red-50 px-3 py-2 rounded-full border border-red-200">
                             <XCircle className="h-4 w-4 text-red-600 mr-2" />
                             <span className="text-red-700">Occupé ({allSlots.filter(s => !s.is_available).length})</span>
                           </div>
                         </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reason */}
            <div className="space-y-3">
              <Label htmlFor="reason" className="text-base font-semibold text-gray-700">
                Motif de consultation (optionnel)
              </Label>
              <Textarea
                id="reason"
                placeholder="Ex: Douleur dentaire, nettoyage, contrôle de routine..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[80px] border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button 
                onClick={handleBookAppointment} 
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-lg" 
                disabled={isLoading || !selectedDentist || !selectedDate || !selectedTime}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Confirmation...
                  </div>
                ) : (
                  "Confirmer le rendez-vous"
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="h-12 border-2 border-gray-300 hover:bg-gray-50 font-semibold transition-colors"
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
