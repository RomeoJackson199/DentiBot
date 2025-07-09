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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const availableTimes = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30"
  ];

  useEffect(() => {
    fetchDentists();
  }, []);

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

      const { error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          patient_id: profile.id,
          dentist_id: selectedDentist,
          appointment_date: appointmentDateTime.toISOString(),
          reason: reason || "Consultation générale",
          status: "pending",
          urgency: "medium"
        });

      if (appointmentError) throw appointmentError;

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
            onSelect={setSelectedDate}
            disabled={isDateDisabled}
            className="rounded-md border mt-2"
          />
        </div>

        {selectedDate && (
          <div>
            <Label>Sélectionnez une heure :</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choisir un créneau" />
              </SelectTrigger>
              <SelectContent>
                {availableTimes.map((time) => (
                  <SelectItem key={time} value={time}>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {time}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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