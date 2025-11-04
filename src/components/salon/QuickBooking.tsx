/**
 * Quick Booking - Type A (Solo Stylist)
 *
 * Fast rebooking for returning clients
 * Features:
 * - Shows last service history
 * - Suggests next appointment date
 * - One-tap "book same service"
 * - Option to set up recurring appointments
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Clock, Repeat, User, StickyNote } from 'lucide-react';
import { format, addWeeks } from 'date-fns';
import { createAppointmentDateTimeFromStrings } from '@/lib/timezone';

interface QuickBookingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  stylistId: string;
  businessId: string;
  onComplete?: () => void;
}

interface ClientHistory {
  lastServiceName: string;
  lastServiceDate: string;
  lastServiceId: string;
  lastPriceCents: number;
  serviceCount: number;
  colorFormula: string | null;
  hairNotes: string | null;
}

export function QuickBooking({
  open,
  onOpenChange,
  clientId,
  clientName,
  stylistId,
  businessId,
  onComplete,
}: QuickBookingProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ClientHistory | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [makeRecurring, setMakeRecurring] = useState(false);
  const [recurringWeeks, setRecurringWeeks] = useState(6);

  useEffect(() => {
    if (open && clientId) {
      loadClientHistory();
    }
  }, [open, clientId]);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableTimes();
    }
  }, [selectedDate]);

  const loadClientHistory = async () => {
    try {
      const { data, error } = await supabase.rpc('get_client_last_service', {
        patient_id_param: clientId,
        business_id_param: businessId,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const h = data[0];
        setHistory({
          lastServiceName: h.last_service_name,
          lastServiceDate: h.last_service_date,
          lastServiceId: h.last_service_id,
          lastPriceCents: h.last_price_cents,
          serviceCount: h.service_count,
          colorFormula: h.color_formula,
          hairNotes: h.hair_notes,
        });

        // Suggest next appointment date (6 weeks from last visit)
        const suggestedDate = addWeeks(new Date(h.last_service_date), 6);
        if (suggestedDate > new Date()) {
          setSelectedDate(suggestedDate);
        }
      }
    } catch (error) {
      console.error('Error loading client history:', error);
    }
  };

  const loadAvailableTimes = async () => {
    if (!selectedDate) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      // Regenerate slots for this date
      await supabase.rpc('generate_daily_slots', {
        p_dentist_id: stylistId,
        p_date: dateStr,
      });

      // Fetch available slots
      const { data, error } = await supabase
        .from('appointment_slots')
        .select('slot_time, is_available')
        .eq('dentist_id', stylistId)
        .eq('slot_date', dateStr)
        .eq('business_id', businessId)
        .eq('is_available', true)
        .order('slot_time');

      if (!error && data) {
        setAvailableTimes(
          data.map((s) => (s.slot_time.length === 8 ? s.slot_time.slice(0, 5) : s.slot_time))
        );
      }
    } catch (error) {
      console.error('Error loading available times:', error);
    }
  };

  const handleQuickBook = async () => {
    if (!selectedDate || !selectedTime || !history) {
      toast({
        title: 'Missing Information',
        description: 'Please select a date and time',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const appointmentDateTime = createAppointmentDateTimeFromStrings(dateStr, selectedTime);

      // Create appointment
      const { error: appointmentError } = await supabase.from('appointments').insert({
        patient_id: clientId,
        dentist_id: stylistId,
        business_id: businessId,
        appointment_date: appointmentDateTime.toISOString(),
        service_id: history.lastServiceId,
        patient_name: clientName,
        status: 'pending',
        duration_minutes: 60, // Default, should come from service
      });

      if (appointmentError) throw appointmentError;

      // If recurring, create recurring appointment record
      if (makeRecurring) {
        await supabase.from('recurring_appointments').insert({
          business_id: businessId,
          patient_id: clientId,
          stylist_id: stylistId,
          service_id: history.lastServiceId,
          frequency_weeks: recurringWeeks,
          auto_book: false,
          send_reminder: true,
          is_active: true,
          last_appointment_date: dateStr,
          next_suggested_date: format(addWeeks(selectedDate, recurringWeeks), 'yyyy-MM-dd'),
        });
      }

      toast({
        title: 'Appointment Booked',
        description: `${clientName} booked for ${format(selectedDate, 'MMM d')} at ${selectedTime}`,
      });

      onComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: 'Booking Failed',
        description: 'Failed to create appointment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Quick Book: {clientName}
          </DialogTitle>
          <DialogDescription>
            Rebook this client with their last service
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Client History */}
          {history && (
            <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Last Service</div>
                  <div className="text-lg">{history.lastServiceName}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(history.lastServiceDate), 'MMM d, yyyy')}
                  </div>
                  <div className="text-lg font-semibold">
                    €{(history.lastPriceCents / 100).toFixed(2)}
                  </div>
                </div>
              </div>

              {history.colorFormula && (
                <div className="flex items-start text-sm">
                  <Badge variant="outline" className="mr-2">
                    Formula
                  </Badge>
                  <span className="font-mono">{history.colorFormula}</span>
                </div>
              )}

              {history.hairNotes && (
                <div className="flex items-start text-sm">
                  <StickyNote className="mr-2 h-4 w-4 mt-0.5 text-yellow-600" />
                  <span className="text-muted-foreground">{history.hairNotes}</span>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Total visits: {history.serviceCount}
              </div>
            </div>
          )}

          <Separator />

          {/* Date Selection */}
          <div>
            <Label className="flex items-center mb-2">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Select Date
            </Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div>
              <Label className="flex items-center mb-2">
                <Clock className="mr-2 h-4 w-4" />
                Select Time
              </Label>
              {availableTimes.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {availableTimes.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No available times for this date</p>
              )}
            </div>
          )}

          <Separator />

          {/* Recurring Option */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Repeat className="h-4 w-4" />
              <Label htmlFor="recurring" className="cursor-pointer">
                Make Recurring
              </Label>
            </div>
            <Switch
              id="recurring"
              checked={makeRecurring}
              onCheckedChange={setMakeRecurring}
            />
          </div>

          {makeRecurring && (
            <div className="bg-secondary/20 rounded-lg p-4">
              <Label>Rebook Every</Label>
              <div className="flex items-center space-x-2 mt-2">
                {[4, 6, 8, 12].map((weeks) => (
                  <Button
                    key={weeks}
                    variant={recurringWeeks === weeks ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRecurringWeeks(weeks)}
                  >
                    {weeks}w
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                You'll get a reminder to rebook this client every {recurringWeeks} weeks
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleQuickBook}
              disabled={loading || !selectedDate || !selectedTime}
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
