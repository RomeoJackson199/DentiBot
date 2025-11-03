// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarDays, Clock, User as UserIcon, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createMedicalRecord } from "@/lib/medicalRecords";
import { showAppointmentConfirmed } from "@/lib/successNotifications";
import { logger } from '@/lib/logger';
import { clinicTimeToUtc, createAppointmentDateTimeFromStrings } from "@/lib/timezone";
import { getCurrentBusinessId } from "@/lib/businessScopedSupabase";

interface AppointmentBookingProps {
  user: User;
  selectedDentist?: Dentist;
  prefilledReason?: string;
  onComplete: (appointmentData?: Record<string, unknown>) => void;
  onCancel: () => void;
}

interface Dentist {
  id: string;
  profile_id: string;
  specialization?: string;
  first_name: string;
  last_name: string;
}

export const AppointmentBooking = ({ user, selectedDentist: preSelectedDentist, prefilledReason, onComplete, onCancel }: AppointmentBookingProps) => {
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [selectedDentist, setSelectedDentist] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [allSlots, setAllSlots] = useState<{slot_time: string, is_available: boolean, emergency_only?: boolean}[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDentists = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('dentists')
        .select(`
          id,
          profile_id,
          specialization,
          profiles:profile_id(first_name, last_name)
        `)
        .eq('is_active', true);

      if (error) throw error;
      const normalized = (data || []).map((d: any) => ({
        id: d.id,
        profile_id: d.profile_id,
        specialization: d.specialization,
        first_name: d.profiles?.first_name || '',
        last_name: d.profiles?.last_name || ''
      }));
      setDentists(normalized);
    } catch (error) {
      console.error('Failed to fetch dentists:', error);
      toast({
        title: "Error",
        description: "Failed to load dentists",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchDentists();
    // Set prefilled reason if provided
    if (prefilledReason) {
      setReason(prefilledReason);
    }
  }, [prefilledReason, fetchDentists]);

  // Auto-select dentist when dentists are loaded
  useEffect(() => {
    if (dentists.length > 0 && !selectedDentist) {
      // Use preselected dentist if available, otherwise use first
      const dentistToSelect = preSelectedDentist?.id || dentists[0].id;
      setSelectedDentist(dentistToSelect);
    }
  }, [dentists, selectedDentist, preSelectedDentist]);

  const fetchAvailability = async (date: Date, retry = 0) => {
    if (!selectedDentist) return;
    
    setLoadingTimes(true);
    setSelectedTime("");
    setErrorMessage(null);

    try {
      // Use format to preserve Brussels date without UTC conversion
      const dateStr = format(date, 'yyyy-MM-dd');

      // Generate slots with retry logic
      const { error: slotError } = await supabase.rpc('generate_daily_slots', {
        p_dentist_id: selectedDentist,
        p_date: dateStr
      });

      if (slotError && retry < 2) {
        setTimeout(() => fetchAvailability(date, retry + 1), 1000);
        return;
      }

      const businessId = await getCurrentBusinessId();

      const { data: allSlots, error } = await supabase
        .from('appointment_slots')
        .select('slot_time, is_available, emergency_only')
        .eq('dentist_id', selectedDentist)
        .eq('slot_date', dateStr)
        .eq('business_id', businessId)
        .order('slot_time');

      if (error) throw error;

      const availableSlots = allSlots?.filter(slot => slot.is_available && !slot.emergency_only)
        .map(slot => slot.slot_time.substring(0, 5)) || [];

      setAvailableTimes(availableSlots);
      setAllSlots(allSlots || []);
      setRetryCount(0); // Reset retry count on success

    } catch (error) {
      console.error('Failed to fetch availability:', error);
      
      if (retry < 2) {
        setRetryCount(retry + 1);
        setTimeout(() => fetchAvailability(date, retry + 1), 2000);
        setErrorMessage(`Loading time slots... (attempt ${retry + 1}/3)`);
      } else {
        toast({
          title: "Error",
          description: "Unable to load available time slots after multiple attempts",
          variant: "destructive",
        });
        setErrorMessage("Failed to load time slots");
        setAvailableTimes([]);
        setAllSlots([]);
      }
    } finally {
      if (retry === 0 || retry >= 2) {
        setLoadingTimes(false);
      }
    }
  };



  const handleBookAppointment = async () => {
    if (!selectedDentist || !selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select a dentist, date, and time",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get patient profile with all information
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, date_of_birth, phone, email, address, medical_history, emergency_contact")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      // Check if profile is complete for appointment booking
      const requiredFields = ['first_name', 'last_name', 'phone', 'email'];
      const missingFields = requiredFields.filter(field => !profile[field]);
      
      if (missingFields.length > 0) {
        toast({
          title: "Incomplete Profile",
          description: "Please complete your profile in settings before booking an appointment",
          variant: "destructive",
        });
        return;
      }

      // Use format to preserve Brussels date without UTC conversion
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      // Create appointment with proper timezone handling
      // Parse date and time strings as Brussels timezone and convert to UTC
      const appointmentDateTime = createAppointmentDateTimeFromStrings(dateStr, selectedTime);

      // Try to book the slot with a temporary ID first
      const { error: slotBookingError } = await supabase.rpc('book_appointment_slot', {
        p_dentist_id: selectedDentist,
        p_slot_date: dateStr,
        p_slot_time: selectedTime,
        p_appointment_id: 'temp-id'
      });

      if (slotBookingError) {
        throw new Error("This time slot is no longer available");
      }

      // Create new appointment
      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          patient_id: profile.id,
          dentist_id: selectedDentist,
          appointment_date: appointmentDateTime.toISOString(),
          reason: reason || "General consultation",
          status: "confirmed",
          urgency: "medium"
        })
        .select()
        .single();

      if (appointmentError) {
        // If appointment creation fails, release the slot
        await supabase.rpc('release_appointment_slot', {
          p_appointment_id: 'temp-id'
        });
        throw appointmentError;
      }

      // Update slot with actual appointment ID
      await supabase.rpc('book_appointment_slot', {
        p_dentist_id: selectedDentist,
        p_slot_date: dateStr,
        p_slot_time: selectedTime,
        p_appointment_id: appointmentData.id
      });

      showAppointmentConfirmed(
        `${selectedDate.toLocaleDateString()} at ${selectedTime}`
      );

      toast({
        title: "Appointment Confirmed",
        description: `Your appointment is confirmed for ${selectedDate.toLocaleDateString()} at ${selectedTime}`,
      });

      // Create a medical record for this appointment (non-blocking)
      try {
        await createMedicalRecord({
          patientId: profile.id,
          dentistId: selectedDentist,
          title: 'Appointment booked',
          description: `Rendez-vous confirmé le ${selectedDate.toLocaleDateString()} à ${selectedTime}. Motif: ${reason || 'Consultation générale'}`,
          recordType: 'appointment',
          visitDate: dateStr
        });
      } catch (e) {
        console.warn('Medical record creation skipped:', e);
      }

      onComplete({
        date: selectedDate.toLocaleDateString(),
        time: selectedTime,
        reason: reason || "General consultation",
        dentist: dentists.find(d => d.id === selectedDentist)?.first_name + " " + dentists.find(d => d.id === selectedDentist)?.last_name
      });
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast({
        title: "Error",
        description: "Unable to create appointment. Please try again.",
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
              Book Appointment
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Schedule your dental consultation in just a few clicks
            </p>
          </CardHeader>
          
          <CardContent className="space-y-8 p-6 md:p-8">
            {/* Dentist Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-700 flex items-center">
                <UserIcon className="h-4 w-4 mr-2 text-blue-600" />
                Select Dentist
              </Label>
              <Select value={selectedDentist} onValueChange={setSelectedDentist}>
                <SelectTrigger className="h-12 border-2 border-blue-200 bg-blue-50 hover:border-blue-300 transition-colors">
                  <SelectValue placeholder="Choose a dentist" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 shadow-lg">
                  {dentists.map((dentist) => (
                    <SelectItem key={dentist.id} value={dentist.id} className="cursor-pointer hover:bg-blue-50">
                      <div className="flex items-center py-1">
                        <UserIcon className="h-4 w-4 mr-3 text-blue-600" />
                        <div>
                          <div className="font-medium">Dr {dentist?.first_name || ''} {dentist?.last_name || ''}</div>
                          <div className="text-sm text-gray-500">{dentist.specialization || 'General Dentistry'}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection - Responsive calendar */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-700">
                Choose a Date
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
                  className={cn(
                    "rounded-xl border-2 border-gray-200/50 shadow-lg bg-white/90 backdrop-blur-sm pointer-events-auto",
                    // Desktop styling
                    "hidden sm:block p-8 [&_table]:w-full [&_table]:mx-auto [&_td]:h-16 [&_td]:w-16 [&_th]:h-12 [&_th]:text-lg [&_th]:text-center [&_button]:h-14 [&_button]:w-14 [&_button]:text-lg",
                    "[&_.rdp-months]:text-xl [&_.rdp-caption]:text-xl [&_.rdp-nav_button]:h-10 [&_.rdp-nav_button]:w-10",
                    "[&_.rdp-head_cell]:text-center [&_.rdp-head_cell]:font-semibold [&_.rdp-cell]:text-center",
                    selectedDate && "border-blue-300 shadow-blue-100"
                  )}
                />
                {/* Mobile calendar - smaller */}
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    if (date) fetchAvailability(date);
                  }}
                  disabled={isDateDisabled}
                  className={cn(
                    "rounded-xl border-2 border-gray-200/50 shadow-lg bg-white/90 backdrop-blur-sm pointer-events-auto",
                    // Mobile styling - smaller
                    "block sm:hidden p-4 [&_table]:w-full [&_table]:mx-auto [&_td]:h-10 [&_td]:w-10 [&_th]:h-8 [&_th]:text-sm [&_th]:text-center [&_button]:h-8 [&_button]:w-8 [&_button]:text-sm",
                    "[&_.rdp-months]:text-base [&_.rdp-caption]:text-base [&_.rdp-nav_button]:h-8 [&_.rdp-nav_button]:w-8",
                    "[&_.rdp-head_cell]:text-center [&_.rdp-head_cell]:font-semibold [&_.rdp-cell]:text-center",
                    selectedDate && "border-blue-300 shadow-blue-100"
                  )}
                />
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div className="space-y-4">
                <Label className="text-base font-semibold text-gray-700 flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-blue-600" />
                  Choose a Time Slot
                </Label>

                {loadingTimes ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">
                      {errorMessage || "Loading time slots..."}
                      {retryCount > 0 && ` (attempt ${retryCount + 1})`}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Time Slots Grid - Clickable green/red slots */}
                    {allSlots.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-700 mb-3">
                          All Time Slots ({allSlots.length} total)
                        </h4>
                         <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1 sm:gap-2">
                           {allSlots.map((slot) => (
                            <button
                              key={slot.slot_time}
                              onClick={() => slot.is_available && !slot.emergency_only ? setSelectedTime(slot.slot_time.substring(0, 5)) : null}
                              disabled={!slot.is_available || slot.emergency_only}
                              className={`p-2 sm:p-3 rounded-lg text-xs sm:text-sm text-center font-medium transition-all border-2 ${
                                slot.is_available && !slot.emergency_only
                                  ? selectedTime === slot.slot_time.substring(0, 5)
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                    : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 cursor-pointer'
                                  : 'bg-red-50 border-red-200 text-red-700 cursor-not-allowed'
                              }`}
                            >
                              <div className="font-bold text-xs sm:text-sm">
                                {slot.slot_time.substring(0, 5)}
                              </div>
                              <div className="flex items-center justify-center mt-0.5 sm:mt-1">
                                {slot.is_available && !slot.emergency_only ? (
                                  <CheckCircle className="h-2 w-2 sm:h-3 sm:w-3" />
                                ) : (
                                  <XCircle className="h-2 w-2 sm:h-3 sm:w-3" />
                                )}
                              </div>
                            </button>
                          ))}
                         </div>
                          <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-8 mt-4 text-xs sm:text-sm font-medium">
                            <div className="flex items-center justify-center bg-green-50 px-2 sm:px-3 py-1 sm:py-2 rounded-full border border-green-200">
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mr-1 sm:mr-2" />
                              <span className="text-green-700">Available ({allSlots.filter(s => s.is_available && !s.emergency_only).length})</span>
                            </div>
                            <div className="flex items-center justify-center bg-red-50 px-2 sm:px-3 py-1 sm:py-2 rounded-full border border-red-200">
                              <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 mr-1 sm:mr-2" />
                              <span className="text-red-700">Booked ({allSlots.filter(s => !s.is_available).length})</span>
                            </div>
                          </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reason - Add preset options */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-700">
                Reason for Visit
              </Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-300 transition-colors">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 shadow-lg">
                  <SelectItem value="Routine checkup">Routine checkup</SelectItem>
                  <SelectItem value="Teeth cleaning">Teeth cleaning</SelectItem>
                  <SelectItem value="Dental pain">Dental pain</SelectItem>
                  <SelectItem value="Emergency">Dental emergency</SelectItem>
                  <SelectItem value="Cosmetic consultation">Cosmetic consultation</SelectItem>
                  <SelectItem value="Other">Other (custom)</SelectItem>
                </SelectContent>
              </Select>

              {reason === "Other" && (
                <Textarea
                  placeholder="Describe your reason for consultation..."
                  className="min-h-[80px] border-2 border-gray-200 hover:border-blue-300 transition-colors"
                  onChange={(e) => setReason(e.target.value)}
                />
              )}
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
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Confirming...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Appointment
                  </div>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={onCancel}
                className="h-12 border-2 border-gray-300 hover:bg-gray-50 font-semibold transition-colors"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
