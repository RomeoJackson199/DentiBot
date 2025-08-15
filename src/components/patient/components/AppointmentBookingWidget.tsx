import React, { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addDays, setHours, setMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Calendar as CalendarIcon,
  Clock,
  User as UserIcon,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface AppointmentBookingWidgetProps {
  user: User;
  existingAppointment?: any;
  onSuccess: () => void;
}

interface Dentist {
  id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  specialization?: string;
  available_days?: string[];
  available_hours?: { start: string; end: string };
  average_rating?: number;
  communication_score?: number;
  created_at?: string;
  expertise_score?: number;
  is_active?: boolean;
  license_number?: string;
  profile_id?: string;
  total_ratings?: number;
  updated_at?: string;
  wait_time_score?: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const SERVICE_TYPES = [
  { value: 'checkup', label: 'Regular Checkup' },
  { value: 'cleaning', label: 'Teeth Cleaning' },
  { value: 'filling', label: 'Filling' },
  { value: 'extraction', label: 'Tooth Extraction' },
  { value: 'root_canal', label: 'Root Canal' },
  { value: 'crown', label: 'Crown' },
  { value: 'whitening', label: 'Teeth Whitening' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'emergency', label: 'Emergency' }
];

export const AppointmentBookingWidget: React.FC<AppointmentBookingWidgetProps> = ({ 
  user, 
  existingAppointment,
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingDentists, setLoadingDentists] = useState(true);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDentist, setSelectedDentist] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [step, setStep] = useState(1);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchDentists();
  }, []);

  useEffect(() => {
    if (selectedDate && selectedDentist) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedDentist]);

  const fetchDentists = async () => {
    try {
      setLoadingDentists(true);
      const { data, error } = await supabase
        .from('dentists')
        .select(`
          *,
          profiles:profile_id(first_name, last_name)
        `)
        .eq('is_active', true);

      if (error) throw error;
      
      const formattedDentists = (data || []).map(dentist => ({
        ...dentist,
        full_name: dentist.profiles ? `${dentist.profiles.first_name} ${dentist.profiles.last_name}` : 'Unknown',
        available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        available_hours: { start: '09:00', end: '17:00' }
      }));
      
      setDentists(formattedDentists);
    } catch (error) {
      console.error('Error fetching dentists:', error);
      toast({
        title: "Error",
        description: "Failed to load dentists",
        variant: "destructive",
      });
    } finally {
      setLoadingDentists(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !selectedDentist) return;

    // Generate time slots from 9 AM to 5 PM
    const slots: TimeSlot[] = [];
    for (let hour = 9; hour < 17; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        available: true
      });
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:30`,
        available: true
      });
    }

      // In production, check against existing appointments
      try {
        const { data: existingAppointments } = await supabase
          .from('appointments')
          .select('appointment_date')
          .eq('dentist_id', selectedDentist)
          .eq('appointment_date', format(selectedDate, 'yyyy-MM-dd'))
          .neq('status', 'cancelled');

        if (existingAppointments) {
          existingAppointments.forEach(apt => {
            const appointmentTime = new Date(apt.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const slotIndex = slots.findIndex(s => s.time === appointmentTime);
            if (slotIndex !== -1) {
              slots[slotIndex].available = false;
            }
          });
        }
      } catch (error) {
        console.error('Error checking availability:', error);
      }

    setAvailableSlots(slots);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedDentist || !selectedService || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const appointmentDateTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`);
      
      const appointmentData = {
        patient_id: user.id,
        dentist_id: selectedDentist,
        appointment_date: appointmentDateTime.toISOString(),
        reason: selectedService,
        status: 'confirmed' as const,
        notes: notes || null
      };

      if (existingAppointment) {
        // Update existing appointment (reschedule)
        const { error } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', existingAppointment.id);

        if (error) throw error;
      } else {
        // Create new appointment
        const { error } = await supabase
          .from('appointments')
          .insert(appointmentData);

        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Booking Failed",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedService && selectedDentist;
      case 2:
        return selectedDate && selectedTime;
      case 3:
        return true;
      default:
        return false;
    }
  };

  if (loadingDentists) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-medium",
              step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {step > s ? <CheckCircle className="h-5 w-5" /> : s}
            </div>
            {s < 3 && (
              <div className={cn(
                "flex-1 h-1 mx-2",
                step > s ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Service & Dentist */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium mb-3 block">Select Service Type</Label>
            <RadioGroup value={selectedService} onValueChange={setSelectedService}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SERVICE_TYPES.map((service) => (
                  <div key={service.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={service.value} id={service.value} />
                    <Label htmlFor={service.value} className="cursor-pointer flex-1">
                      {service.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-medium mb-3 block">Select Dentist</Label>
            <RadioGroup value={selectedDentist} onValueChange={setSelectedDentist}>
              <div className="space-y-3">
                {dentists.map((dentist) => (
                  <Card key={dentist.id} className="cursor-pointer hover:border-primary">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value={dentist.id} id={dentist.id} />
                        <Label htmlFor={dentist.id} className="cursor-pointer flex-1">
                          <div>
                            <span>Dr. {dentist.full_name || `${dentist.first_name || ''} ${dentist.last_name || ''}`.trim() || 'Unknown'}</span>
                            <p className="text-sm text-muted-foreground">{dentist.specialization || 'General Dentistry'}</p>
                          </div>
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          </div>
        </div>
      )}

      {/* Step 2: Date & Time */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium mb-3 block">Select Date</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date() || date > addDays(new Date(), 60)}
              className="rounded-md border"
            />
          </div>

          {selectedDate && (
            <div>
              <Label className="text-base font-medium mb-3 block">Select Time</Label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot.time}
                    variant={selectedTime === slot.time ? "default" : "outline"}
                    size="sm"
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                  >
                    {slot.time}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Review & Notes */}
      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review Appointment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>{selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{selectedTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span>Dr. {dentists.find(d => d.id === selectedDentist)?.full_name || dentists.find(d => d.id === selectedDentist)?.first_name || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span>{SERVICE_TYPES.find(s => s.value === selectedService)?.label}</span>
              </div>
            </CardContent>
          </Card>

          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special requirements or concerns..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
        >
          Previous
        </Button>
        
        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading || !canProceed()}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Booking...
              </>
            ) : (
              existingAppointment ? 'Reschedule Appointment' : 'Book Appointment'
            )}
          </Button>
        )}
      </div>
    </div>
  );
};