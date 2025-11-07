import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Sparkles, TrendingUp, Users, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchDentistAvailabilityWithBuffers } from "@/lib/appointmentAvailability";
import {
  getRecommendedSlots,
  RecommendedSlot,
  checkDentistCapacity,
  logSlotRecommendations,
  updateRecommendationWithSelection
} from "@/lib/smartScheduling";
import { getCurrentBusinessId } from "@/lib/businessScopedSupabase";
import { format } from "date-fns";

interface SmartAppointmentBookingProps {
  user: User;
  onComplete: () => void;
  onCancel: () => void;
}

interface AppointmentType {
  id: string;
  name: string;
  category: string;
  default_duration_minutes: number;
  buffer_time_after_minutes: number;
  color?: string;
}

export const SmartAppointmentBooking = ({ user, onComplete, onCancel }: SmartAppointmentBookingProps) => {
  const [dentists, setDentists] = useState<any[]>([]);
  const [selectedDentist, setSelectedDentist] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [recommendedSlots, setRecommendedSlots] = useState<RecommendedSlot[]>([]);
  const [capacityInfo, setCapacityInfo] = useState<any>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [recommendationId, setRecommendationId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch dentists
  useEffect(() => {
    const fetchDentists = async () => {
      const { data, error } = await supabase
        .from('dentists')
        .select(`
          id,
          profiles:profile_id (
            first_name,
            last_name
          )
        `)
        .eq('is_active', true);

      if (!error && data) {
        setDentists(data);
        if (data.length > 0) {
          setSelectedDentist(data[0].id);
        }
      }
    };

    fetchDentists();
  }, []);

  // Fetch appointment types
  useEffect(() => {
    const fetchTypes = async () => {
      const businessId = await getCurrentBusinessId();
      const { data, error } = await supabase
        .from('appointment_types')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name');

      if (!error && data) {
        setAppointmentTypes(data);
        // Auto-select first type
        if (data.length > 0) {
          setSelectedType(data[0].id);
        }
      }
    };

    fetchTypes();
  }, []);

  // Fetch slots when date/dentist/type changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDentist || !selectedDate || !selectedType) return;

      setLoadingSlots(true);
      try {
        // Get profile ID for patient preferences
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) return;

        // Get availability with buffer times
        const slots = await fetchDentistAvailabilityWithBuffers(
          selectedDentist,
          selectedDate,
          selectedType
        );

        // Get intelligent recommendations
        const recommended = await getRecommendedSlots(
          selectedDentist,
          profile.id,
          selectedDate,
          slots,
          selectedType
        );

        setRecommendedSlots(recommended);

        // Log recommendations for learning
        const recId = await logSlotRecommendations(
          profile.id,
          selectedDentist,
          recommended
        );
        setRecommendationId(recId);

        // Check capacity
        const capacity = await checkDentistCapacity(selectedDentist, selectedDate);
        setCapacityInfo(capacity);
      } catch (error) {
        console.error('Error fetching slots:', error);
        toast({
          title: "Error",
          description: "Failed to load available slots",
          variant: "destructive"
        });
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDentist, selectedDate, selectedType, user.id, toast]);

  const handleBookAppointment = async () => {
    if (!selectedDentist || !selectedDate || !selectedTime || !selectedType) {
      toast({
        title: "Missing Information",
        description: "Please select all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsBooking(true);
    try {
      const businessId = await getCurrentBusinessId();

      // Get profile ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Create appointment
      const appointmentDateTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`);

      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: profile.id,
          dentist_id: selectedDentist,
          business_id: businessId,
          appointment_date: appointmentDateTime.toISOString(),
          appointment_type_id: selectedType,
          reason: reason || null,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Update recommendation log
      if (recommendationId && appointment) {
        const selectedSlot = recommendedSlots.find(s => s.time === selectedTime);
        await updateRecommendationWithSelection(
          recommendationId,
          appointmentDateTime.toISOString(),
          appointment.id,
          selectedSlot?.isRecommended || false
        );
      }

      toast({
        title: "Success!",
        description: "Your appointment has been booked successfully",
      });

      onComplete();
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to book appointment",
        variant: "destructive"
      });
    } finally {
      setIsBooking(false);
    }
  };

  const selectedTypeDetails = appointmentTypes.find(t => t.id === selectedType);

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Smart Appointment Booking
        </CardTitle>
        <CardDescription>
          Get intelligent slot recommendations based on your preferences and availability
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dentist Selection */}
        <div className="space-y-2">
          <Label>Select Dentist</Label>
          <Select value={selectedDentist} onValueChange={setSelectedDentist}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a dentist" />
            </SelectTrigger>
            <SelectContent>
              {dentists.map((dentist) => (
                <SelectItem key={dentist.id} value={dentist.id}>
                  Dr. {dentist.profiles?.first_name} {dentist.profiles?.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Appointment Type Selection */}
        <div className="space-y-2">
          <Label>Appointment Type</Label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="Choose appointment type" />
            </SelectTrigger>
            <SelectContent>
              {appointmentTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <div className="flex items-center gap-2">
                    <span>{type.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {type.default_duration_minutes}min
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTypeDetails && (
            <p className="text-sm text-muted-foreground">
              Duration: {selectedTypeDetails.default_duration_minutes} minutes
              {selectedTypeDetails.buffer_time_after_minutes > 0 && (
                <> + {selectedTypeDetails.buffer_time_after_minutes}min buffer</>
              )}
            </p>
          )}
        </div>

        {/* Date Selection */}
        <div className="space-y-2">
          <Label>Select Date</Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date()}
            className="rounded-md border"
          />
        </div>

        {/* Capacity Indicator */}
        {capacityInfo && selectedDate && (
          <div className={cn(
            "p-4 rounded-lg border",
            capacityInfo.is_near_capacity ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200"
          )}>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="font-medium">
                {capacityInfo.available_slots} of {capacityInfo.total_slots} slots available
              </span>
              {capacityInfo.is_near_capacity && (
                <Badge variant="outline" className="ml-auto">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Limited availability
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Time Slot Selection with Recommendations */}
        {selectedDate && recommendedSlots.length > 0 && (
          <div className="space-y-2">
            <Label>Select Time</Label>
            {loadingSlots ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading available slots...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {recommendedSlots.slice(0, 12).map((slot) => {
                  const isSelected = selectedTime === slot.time;
                  const isRecommended = slot.isRecommended;

                  return (
                    <Button
                      key={slot.time}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "relative h-auto flex-col items-start p-3",
                        isRecommended && !isSelected && "border-primary border-2"
                      )}
                      onClick={() => setSelectedTime(slot.time)}
                    >
                      {isRecommended && (
                        <Badge className="absolute -top-2 -right-2 bg-primary">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-semibold">
                          {format(new Date(`2000-01-01T${slot.time}`), 'h:mm a')}
                        </span>
                      </div>
                      <div className="text-xs text-left mt-1 space-y-1">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>Score: {slot.score}/100</span>
                        </div>
                        {slot.reasons.length > 0 && (
                          <div className="text-muted-foreground">
                            {slot.reasons[0]}
                          </div>
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Reason/Notes */}
        <div className="space-y-2">
          <Label>Reason for Visit (Optional)</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe your symptoms or reason for visit..."
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleBookAppointment}
            disabled={!selectedDentist || !selectedDate || !selectedTime || !selectedType || isBooking}
            className="flex-1"
          >
            {isBooking ? "Booking..." : "Book Appointment"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
