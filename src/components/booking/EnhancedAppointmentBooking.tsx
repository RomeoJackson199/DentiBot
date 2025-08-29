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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CalendarDays, Clock, User as UserIcon, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { clinicTimeToUtc, utcToClinicTime, getClinicTimeSlots, formatClinicTime } from "@/lib/timezone";

interface EnhancedAppointmentBookingProps {
  user: User;
  selectedDentist?: Dentist;
  prefilledReason?: string;
  chatNotes?: string;
  onComplete: (appointmentData?: Record<string, unknown>) => void;
  onCancel: () => void;
}

interface Dentist {
  id: string;
  profile_id: string;
  specialization?: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
  emergency_only?: boolean;
}

export const EnhancedAppointmentBooking = ({ 
  user, 
  selectedDentist: preSelectedDentist, 
  prefilledReason, 
  chatNotes,
  onComplete, 
  onCancel 
}: EnhancedAppointmentBookingProps) => {
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [selectedDentist, setSelectedDentist] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [allSlots, setAllSlots] = useState<TimeSlot[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const { toast } = useToast();

  // Initialize form data
  useEffect(() => {
    if (prefilledReason) {
      setReason(prefilledReason);
    }
    if (chatNotes) {
      setNotes(chatNotes);
    }
    // Generate idempotency key for this booking session
    setIdempotencyKey(`booking_${user.id}_${Date.now()}`);
  }, [prefilledReason, chatNotes, user.id]);

  const fetchDentists = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('dentists')
        .select(`
          id,
          profile_id,
          specialization,
          profiles (
            first_name,
            last_name
          )
        `)
        .eq('is_active', true);

      if (error) throw error;
      setDentists(data || []);
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
  }, [fetchDentists]);

  // Auto-select dentist
  useEffect(() => {
    if (dentists.length > 0 && !selectedDentist) {
      const dentistToSelect = preSelectedDentist?.id || dentists[0].id;
      setSelectedDentist(dentistToSelect);
    }
  }, [dentists, selectedDentist, preSelectedDentist]);

  const fetchAvailability = async (date: Date) => {
    if (!selectedDentist) return;
    
    setLoadingTimes(true);
    setSelectedTime("");
    
    try {
      // Generate slots for the date
      await supabase.rpc('generate_daily_slots', {
        p_dentist_id: selectedDentist,
        p_date: date.toISOString().split('T')[0]
      });

      // Fetch ALL slots for comprehensive view
      const { data: slots, error } = await supabase
        .from('appointment_slots')
        .select('slot_time, is_available, emergency_only')
        .eq('dentist_id', selectedDentist)
        .eq('slot_date', date.toISOString().split('T')[0])
        .order('slot_time');

      if (error) throw error;

      const allSlotsData = (slots || []).map(slot => ({
        time: slot.slot_time.substring(0, 5),
        available: slot.is_available,
        emergency_only: slot.emergency_only || false
      }));

      // Filter available non-emergency slots
      const availableSlotsData = allSlotsData.filter(slot => 
        slot.available && !slot.emergency_only
      );

      setAllSlots(allSlotsData);
      setAvailableSlots(availableSlotsData);
      
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      toast({
        title: "Error",
        description: "Failed to load available time slots",
        variant: "destructive",
      });
      setAvailableSlots([]);
      setAllSlots([]);
    } finally {
      setLoadingTimes(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDentist || !selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select a dentist, date and time",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get patient profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, date_of_birth, phone, email")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      // Validate required fields
      const requiredFields = ['first_name', 'last_name', 'phone', 'email'];
      const missingFields = requiredFields.filter(field => !profile[field]);
      
      if (missingFields.length > 0) {
        toast({
          title: "Incomplete Profile",
          description: "Please complete your profile before booking an appointment",
          variant: "destructive",
        });
        return;
      }

      // Create appointment datetime in clinic timezone, then convert to UTC
      const appointmentDateTime = clinicTimeToUtc(
        new Date(`${selectedDate.toISOString().split('T')[0]}T${selectedTime}:00`)
      );

      // Book the slot first
      const { error: slotBookingError } = await supabase.rpc('book_appointment_slot', {
        p_dentist_id: selectedDentist,
        p_slot_date: selectedDate.toISOString().split('T')[0],
        p_slot_time: selectedTime + ':00',
        p_appointment_id: idempotencyKey // Use as temp ID
      });

      if (slotBookingError) {
        throw new Error("This time slot is no longer available");
      }

      // Create the appointment with full metadata
      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          patient_id: profile.id,
          dentist_id: selectedDentist,
          appointment_date: appointmentDateTime.toISOString(),
          reason: reason || "General consultation",
          notes: notes || chatNotes || "",
          status: "confirmed",
          urgency: "medium",
          patient_name: `${profile.first_name} ${profile.last_name}`,
          duration_minutes: 60
        })
        .select()
        .single();

      if (appointmentError) {
        // Release slot if appointment creation fails
        await supabase.rpc('release_appointment_slot', {
          p_appointment_id: idempotencyKey
        });
        throw appointmentError;
      }

      // Update slot with actual appointment ID
      await supabase.rpc('book_appointment_slot', {
        p_dentist_id: selectedDentist,
        p_slot_date: selectedDate.toISOString().split('T')[0],
        p_slot_time: selectedTime + ':00',
        p_appointment_id: appointmentData.id
      });

      const clinicDateTime = utcToClinicTime(new Date(appointmentData.appointment_date));
      
      toast({
        title: "Appointment Confirmed!",
        description: `Your appointment is scheduled for ${formatClinicTime(clinicDateTime, 'PPP')} at ${formatClinicTime(clinicDateTime, 'HH:mm')}`,
      });

      onComplete({
        id: appointmentData.id,
        date: formatClinicTime(clinicDateTime, 'PPP'),
        time: formatClinicTime(clinicDateTime, 'HH:mm'),
        reason: reason || "General consultation",
        notes: notes || chatNotes || "",
        dentist: dentists.find(d => d.id === selectedDentist)?.profiles.first_name + " " + 
                dentists.find(d => d.id === selectedDentist)?.profiles.last_name
      });
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Unable to book appointment",
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

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setShowConfirmDialog(true);
  };

  const confirmBooking = () => {
    setShowConfirmDialog(false);
    handleBookAppointment();
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-subtle p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center justify-center text-2xl font-bold text-gray-800">
                <CalendarDays className="h-6 w-6 mr-3 text-dental-primary" />
                Book Your Appointment
              </CardTitle>
              <p className="text-dental-muted-foreground mt-2">Schedule your dental consultation</p>
            </CardHeader>
            
            <CardContent className="space-y-8 p-6 md:p-8">
              {/* Dentist Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-gray-700 flex items-center">
                  <UserIcon className="h-4 w-4 mr-2 text-dental-primary" />
                  Selected Dentist
                </Label>
                <Select value={selectedDentist} onValueChange={setSelectedDentist}>
                  <SelectTrigger className="h-12 border-2 border-dental-primary/20 bg-dental-primary/5 hover:border-dental-primary/40 transition-colors">
                    <SelectValue placeholder="Choose a dentist" />
                  </SelectTrigger>
                  <SelectContent>
                    {dentists.map((dentist) => (
                      <SelectItem key={dentist.id} value={dentist.id}>
                        <div className="flex items-center py-1">
                          <UserIcon className="h-4 w-4 mr-3 text-dental-primary" />
                          <div>
                            <div className="font-medium">Dr {dentist.profiles.first_name} {dentist.profiles.last_name}</div>
                            <div className="text-sm text-gray-500">{dentist.specialization || 'General Dentistry'}</div>
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
                    className="rounded-xl border-2 border-gray-200/50 shadow-lg bg-white/90 backdrop-blur-sm p-6"
                  />
                </div>
              </div>

              {/* Time Selection with Enhanced UX */}
              {selectedDate && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-700 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-dental-primary" />
                    Choose a Time Slot
                  </Label>
                  
                  {loadingTimes ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-dental-primary" />
                      <span className="ml-3 text-gray-600">Loading available slots...</span>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Available Slots - Scrollable */}
                      <Card className="bg-green-50 border-green-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg text-green-800">
                            Available Slots ({availableSlots.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {availableSlots.length > 0 ? (
                            <div 
                              className="max-h-48 overflow-y-auto scrollbar-visible space-y-2 p-2"
                              style={{ scrollbarWidth: 'thin' }}
                            >
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {availableSlots.map((slot) => (
                                  <Button
                                    key={slot.time}
                                    onClick={() => handleTimeSelect(slot.time)}
                                    variant={selectedTime === slot.time ? "default" : "outline"}
                                    className={cn(
                                      "h-12 text-sm font-medium transition-all",
                                      "hover:bg-dental-primary hover:text-white",
                                      "focus:ring-2 focus:ring-dental-primary focus:ring-offset-2",
                                      selectedTime === slot.time && "bg-dental-primary text-white"
                                    )}
                                  >
                                    {slot.time}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-center text-gray-500 py-4">
                              No slots available for this date. 
                              <br />
                              <span className="text-sm">Next available: Check other dates</span>
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      {/* All Slots Status */}
                      <Card className="bg-gray-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">
                            Daily Schedule Overview ({allSlots.length} total)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1">
                            {allSlots.map((slot) => (
                              <div
                                key={`status-${slot.time}`}
                                className={cn(
                                  "h-14 flex flex-col items-center justify-center rounded text-xs font-medium border-2",
                                  slot.available 
                                    ? "bg-green-50 border-green-200 text-green-700" 
                                    : "bg-red-50 border-red-200 text-red-600"
                                )}
                                title={slot.available ? "Available" : "Occupied"}
                              >
                                {slot.available ? (
                                  <CheckCircle className="h-3 w-3 mb-1" />
                                ) : (
                                  <XCircle className="h-3 w-3 mb-1" />
                                )}
                                <span>{slot.time}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}

              {/* Reason and Notes */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Visit</Label>
                  <Textarea
                    id="reason"
                    placeholder="Describe your symptoms or reason for the appointment"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                
                {chatNotes && (
                  <div className="space-y-2">
                    <Label>AI Chat Summary</Label>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">{chatNotes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  className="flex-1"
                  disabled={!selectedDentist || !selectedDate || !selectedTime || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    'Book Appointment'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Appointment</DialogTitle>
            <DialogDescription>
              Please confirm the details of your appointment booking.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Date:</span>
                <p>{selectedDate?.toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium">Time:</span>
                <p>{selectedTime}</p>
              </div>
              <div className="col-span-2">
                <span className="font-medium">Dentist:</span>
                <p>Dr {dentists.find(d => d.id === selectedDentist)?.profiles.first_name} {dentists.find(d => d.id === selectedDentist)?.profiles.last_name}</p>
              </div>
              <div className="col-span-2">
                <span className="font-medium">Reason:</span>
                <p>{reason || "General consultation"}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Back
            </Button>
            <Button 
              onClick={confirmBooking}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};