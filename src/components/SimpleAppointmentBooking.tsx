import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AIWritingAssistant } from "@/components/AIWritingAssistant";
import { Calendar, Plus } from "lucide-react";

interface SimpleAppointmentBookingProps {
  dentistId: string;
  patientId: string;
  patientName: string;
  onSuccess?: () => void;
}

export function SimpleAppointmentBooking({ 
  dentistId, 
  patientId, 
  patientName, 
  onSuccess 
}: SimpleAppointmentBookingProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    reason: '',
    urgency: 'medium' as 'low' | 'medium' | 'high',
    notes: ''
  });
  // AI suggestions state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSlots, setAiSlots] = useState<string[]>([]);
  const [aiDetails, setAiDetails] = useState<Record<string, { score: number; reason: string }>>({});
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.time || !formData.reason) {
      toast({
        title: "Missing information",
        description: "Please fill in date, time, and reason",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Combine date and time
      const appointmentDateTime = new Date(`${formData.date}T${formData.time}`);
      
      const { data, error } = await supabase.rpc('create_simple_appointment', {
        p_patient_id: patientId,
        p_dentist_id: dentistId,
        p_appointment_date: appointmentDateTime.toISOString(),
        p_reason: formData.reason,
        p_urgency: formData.urgency
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Appointment scheduled for ${patientName}`,
      });

      setOpen(false);
      setFormData({
        date: '',
        time: '',
        reason: '',
        urgency: 'medium',
        notes: ''
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = async (value: string) => {
    setFormData(prev => ({ ...prev, date: value }));
    if (!value) return;
    try {
      setAiLoading(true);
      setAiSlots([]);
      setAiDetails({});

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current business context (latest)
      const { data: sessionBiz, error: bizErr } = await supabase
        .from('session_business')
        .select('business_id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      const businessId = sessionBiz?.[0]?.business_id;
      if (!businessId) {
        console.warn('No business context found; skipping AI suggestions');
        return;
      }

      // Generate slots for that day
      await supabase.rpc('generate_daily_slots', { p_dentist_id: dentistId, p_date: value });

      // Fetch available slots for the day
      const { data: slots } = await supabase
        .from('appointment_slots')
        .select('slot_time, is_available, emergency_only')
        .eq('dentist_id', dentistId)
        .eq('slot_date', value)
        .eq('business_id', businessId);

      const availableTimes = (slots || [])
        .filter(s => s.is_available && !s.emergency_only)
        .map(s => s.slot_time.substring(0, 5));

      if (availableTimes.length === 0) return;

      const mapped = availableTimes.map(time => ({ time, available: true }));
      const { data, error } = await supabase.functions.invoke('ai-slot-recommendations', {
        body: {
          dentistId,
          patientId,
          date: value,
          availableSlots: mapped
        }
      });

      if (error) {
        console.warn('AI suggestions failed:', error);
        if (error.message?.includes('429')) {
          toast({ title: 'High Traffic', description: "We're getting a lot of requests right now. Please try again in a moment.", variant: 'destructive' });
        } else if (error.message?.includes('402')) {
          toast({ title: 'AI Quota Exceeded', description: 'AI quota exhausted. Please add credits to your workspace.', variant: 'destructive' });
        }
        // Fallback to first 3 available
        const fallback = availableTimes.slice(0, 3);
        setAiSlots(fallback);
        setAiDetails(Object.fromEntries(fallback.map(t => [t, { score: 75, reason: 'Good availability' }])));
        setFormData(prev => ({ ...prev, time: fallback[0] || prev.time }));
      } else {
        const show: string[] = Array.isArray(data?.showSlots) && data.showSlots.length > 0
          ? data.showSlots.slice(0, 3)
          : availableTimes.slice(0, 3);
        const detailsFromAI = data?.slotDetails || {};
        const details = Object.fromEntries(show.map(t => [t, detailsFromAI[t] || { score: 80, reason: 'Recommended time' }]));
        setAiSlots(show);
        setAiDetails(details);
        // Prefill time with first recommendation if empty
        setFormData(prev => ({ ...prev, time: prev.time || show[0] || '' }));
      }
    } catch (e) {
      console.warn('AI suggestions error:', e);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-1" />
          Book Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book Appointment for {patientName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleDateChange(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                required
              />
              {/* AI suggestions chips */}
              {aiLoading ? (
                <div className="text-sm text-gray-500">Analyzing best times…</div>
              ) : aiSlots.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {aiSlots.map(t => (
                    <Button key={t} type="button" variant="outline" size="sm" onClick={() => setFormData(prev => ({ ...prev, time: t }))}>
                      ✨ {t}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Visit *</Label>
            <Textarea
              id="reason"
              placeholder="Describe the reason for the appointment..."
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              className="min-h-[80px]"
              required
            />
            <AIWritingAssistant 
              onImprove={(improvedText) => setFormData(prev => ({ ...prev, reason: improvedText }))}
              currentText={formData.reason}
              placeholder="appointment reason"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="urgency">Urgency Level</Label>
            <Select 
              value={formData.urgency} 
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, urgency: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes or special requirements..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="min-h-[60px]"
            />
            <AIWritingAssistant 
              onImprove={(improvedText) => setFormData(prev => ({ ...prev, notes: improvedText }))}
              currentText={formData.notes}
              placeholder="appointment notes"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Booking..." : "Book Appointment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default SimpleAppointmentBooking;