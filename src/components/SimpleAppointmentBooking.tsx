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
import { clinicTimeToUtc } from "@/lib/timezone";

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
      // Combine date and time in clinic timezone, then convert to UTC
      const appointmentDateTime = clinicTimeToUtc(
        new Date(`${formData.date}T${formData.time}:00`)
      );

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
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
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