import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { appointmentApi, serviceApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { Service } from '../types';

interface BookingAssistantProps {
  professionalId?: string;
  onBooked?: (appointmentId: string) => void;
}

export const BookingAssistant: FC<BookingAssistantProps> = ({ professionalId: initialProfessionalId, onBooked }) => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availableSlots, setAvailableSlots] = useState<Array<{ startTime: string; endTime: string }>>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [professionalId, setProfessionalId] = useState(initialProfessionalId ?? '');

  useEffect(() => {
    setServices([]);
    setSelectedService('');
    setAvailableSlots([]);
  }, [professionalId]);

  useEffect(() => {
    if (!token || !professionalId) return;
    serviceApi
      .list(professionalId, token)
      .then(setServices)
      .catch(() => {
        toast({ title: 'Unable to load services', variant: 'destructive' });
      });
  }, [professionalId, token, toast]);

  useEffect(() => {
    if (!token || !selectedService || !selectedDate || !professionalId) return;
    setLoadingSlots(true);
    appointmentApi
      .availability(token, {
        professionalId,
        serviceId: selectedService,
        date: format(selectedDate, 'yyyy-MM-dd'),
      })
      .then((response) => setAvailableSlots(response.slots))
      .catch(() => {
        toast({ title: 'Unable to fetch availability', variant: 'destructive' });
      })
      .finally(() => setLoadingSlots(false));
  }, [token, selectedService, selectedDate, professionalId, toast]);

  const serviceOptions = useMemo(() => services.map((service) => ({ value: service.id, label: `${service.title} · ${service.duration}min` })), [services]);

  const bookSlot = async (startTime: string) => {
    if (!token || !user || !professionalId) return;
    setBooking(true);
    try {
      const response = await appointmentApi.create(token, {
        clientId: user.id,
        professionalId,
        serviceId: selectedService,
        startTime,
      });
      toast({
        title: 'Appointment confirmed',
        description: 'Checkout link is ready for payment.',
      });
      onBooked?.(response.appointment.id);
    } catch (error: any) {
      toast({
        title: 'Unable to confirm appointment',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800">Self-service booking</h3>
      <p className="mt-1 text-sm text-slate-500">Provide the professional workspace ID to fetch services and AI-curated slots.</p>

      <div className="mt-4 space-y-4">
        <Input
          value={professionalId}
          onChange={(event) => setProfessionalId(event.target.value)}
          placeholder="Professional workspace ID"
        />

        <Select value={selectedService} onValueChange={setSelectedService}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a service" />
          </SelectTrigger>
          <SelectContent>
            {serviceOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border"
        />

        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-600">
            Suggested slots {loadingSlots && <span className="text-xs text-slate-400">(refreshing...)</span>}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {availableSlots.map((slot) => (
              <Button
                key={slot.startTime}
                variant="outline"
                className="justify-start border-teal-200 text-left text-sm text-slate-700 hover:bg-teal-50"
                onClick={() => bookSlot(slot.startTime)}
                disabled={booking}
              >
                {format(parseISO(slot.startTime), 'PPpp')} — {format(parseISO(slot.endTime), 'p')}
              </Button>
            ))}
            {!loadingSlots && availableSlots.length === 0 && (
              <p className="text-sm text-slate-500">No availability on this day. Try another date.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
