import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Calendar, Clock, User, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface QuickAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dentistId: string;
  selectedDate: Date;
  selectedTime: string;
}

export function QuickAppointmentDialog({
  open,
  onOpenChange,
  dentistId,
  selectedDate,
  selectedTime
}: QuickAppointmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [patientEmail, setPatientEmail] = useState("");
  const [patientName, setPatientName] = useState("");
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [duration, setDuration] = useState("60");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleCreateAppointment = async () => {
    if (!patientEmail || !patientName) {
      toast({
        title: "Missing Information",
        description: "Please provide patient name and email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Find or create patient profile
      let patientId: string;
      
      // Check if patient exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", patientEmail.toLowerCase())
        .maybeSingle();

      if (existingProfile) {
        patientId = existingProfile.id;
      } else {
        // Create new profile
        const nameParts = patientName.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        const { data: newProfile, error: profileError } = await supabase
          .from("profiles")
          .insert({
            email: patientEmail.toLowerCase(),
            first_name: firstName,
            last_name: lastName,
            role: "patient",
          })
          .select()
          .single();

        if (profileError) throw profileError;
        patientId = newProfile.id;
      }

      // Create appointment
      const appointmentDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":");
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          dentist_id: dentistId,
          patient_id: patientId,
          appointment_date: appointmentDateTime.toISOString(),
          duration_minutes: parseInt(duration),
          status: "pending",
          urgency: urgency as "low" | "medium" | "high",
          reason: reason || "General consultation",
        });

      if (appointmentError) throw appointmentError;

      toast({
        title: "Appointment Created",
        description: `Successfully created appointment for ${patientName}`,
      });

      // Invalidate queries to refresh calendar
      await queryClient.invalidateQueries({ queryKey: ["appointments-calendar"] });
      await queryClient.invalidateQueries({ queryKey: ["appointments-day"] });
      await queryClient.invalidateQueries({ queryKey: ["all-appointments"] });

      // Reset form and close
      setPatientEmail("");
      setPatientName("");
      setReason("");
      setUrgency("medium");
      setDuration("60");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create appointment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Quick Appointment
          </DialogTitle>
          <DialogDescription>
            Create a new appointment for {format(selectedDate, "MMMM d, yyyy")} at {selectedTime}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Patient Name */}
          <div className="space-y-2">
            <Label htmlFor="patientName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Patient Name *
            </Label>
            <Input
              id="patientName"
              placeholder="John Doe"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </div>

          {/* Patient Email */}
          <div className="space-y-2">
            <Label htmlFor="patientEmail">Patient Email *</Label>
            <Input
              id="patientEmail"
              type="email"
              placeholder="patient@example.com"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Visit</Label>
            <Textarea
              id="reason"
              placeholder="E.g., Routine checkup, tooth pain..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Duration and Urgency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration
              </Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Urgency
              </Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger id="urgency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreateAppointment} disabled={loading}>
            {loading ? "Creating..." : "Create Appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
