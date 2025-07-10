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
import { CalendarDays, Clock, User as UserIcon } from "lucide-react";

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
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDentists();
  }, []);

  const fetchAvailability = async (date: Date) => {
    if (!selectedDentist) return;
    
    setLoadingTimes(true);
    setSelectedTime(""); // Reset selected time when date changes
    
    try {
      console.log('Fetching availability for:', date.toISOString().split('T')[0]);
      
      // First, generate slots for the selected date and dentist
      await supabase.rpc('generate_daily_slots', {
        p_dentist_id: selectedDentist,
        p_date: date.toISOString().split('T')[0]
      });

      // Then fetch available slots
      const { data: slots, error } = await supabase
        .from('appointment_slots')
        .select('slot_time')
        .eq('dentist_id', selectedDentist)
        .eq('slot_date', date.toISOString().split('T')[0])
        .eq('is_available', true)
        .order('slot_time');

      if (error) throw error;

      const availableSlots = slots?.map(slot => 
        slot.slot_time.substring(0, 5) // Format HH:MM
      ) || [];
      
      setAvailableTimes(availableSlots);
      
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
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      // Create appointment
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

      // Book the slot
      const { error: slotError } = await supabase.rpc('book_appointment_slot', {
        p_dentist_id: selectedDentist,
        p_slot_date: selectedDate.toISOString().split('T')[0],
        p_slot_time: selectedTime + ':00', // Add seconds for TIME format
        p_appointment_id: appointmentData.id
      });

      if (slotError) {
        // If slot booking fails, delete the appointment
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
    return date < today || date.getDay() === 0 || date.getDay() === 6; // Disable past dates and weekends
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarDays className="h-5 w-5 mr-2 text-blue-500" />
          Prise de rendez-vous
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Sélectionnez un dentiste :</Label>
          <Select value={selectedDentist} onValueChange={setSelectedDentist}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Choisir un dentiste" />
            </SelectTrigger>
            <SelectContent>
              {dentists.map((dentist) => (
                <SelectItem key={dentist.id} value={dentist.id}>
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2" />
                    Dr {dentist.profiles.first_name} {dentist.profiles.last_name}
                    <span className="text-sm text-muted-foreground ml-2">
                      ({dentist.specialization})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Sélectionnez une date :</Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              setSelectedDate(date);
              if (date) {
                fetchAvailability(date);
              }
            }}
            disabled={isDateDisabled}
            className="rounded-md border mt-2"
          />
        </div>

        {selectedDate && (
          <div>
            <Label>Sélectionnez une heure :</Label>
            {loadingTimes ? (
              <div className="mt-2 py-4 text-center text-muted-foreground">
                Chargement des créneaux disponibles...
              </div>
            ) : (
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={availableTimes.length > 0 ? "Choisir un créneau" : "Aucun créneau disponible"} />
                </SelectTrigger>
                <SelectContent>
                  {availableTimes.length > 0 ? (
                    availableTimes.map((time) => (
                      <SelectItem key={time} value={time}>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {time}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      Aucun créneau disponible pour cette date
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="reason">Motif de consultation (optionnel) :</Label>
          <Textarea
            id="reason"
            placeholder="Ex: Douleur dentaire, nettoyage, contrôle..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-2"
          />
        </div>

        <div className="flex space-x-3">
          <Button 
            onClick={handleBookAppointment} 
            className="flex-1" 
            disabled={isLoading || !selectedDentist || !selectedDate || !selectedTime}
          >
            {isLoading ? "Confirmation..." : "Confirmer le rendez-vous"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};