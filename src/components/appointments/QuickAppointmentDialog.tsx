import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Calendar, Clock, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface QuickAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dentistId: string;
  selectedDate: Date;
  selectedTime: string;
  // Optional: pre-fill with patient data when booking for a specific patient
  patient?: Patient;
}

export function QuickAppointmentDialog({
  open,
  onOpenChange,
  dentistId,
  selectedDate,
  selectedTime,
  patient
}: QuickAppointmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [patientEmail, setPatientEmail] = useState("");
  const [patientName, setPatientName] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("60");
  const [appointmentDate, setAppointmentDate] = useState(format(selectedDate, "yyyy-MM-dd"));
  const [appointmentTime, setAppointmentTime] = useState(selectedTime);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Pre-fill patient info when patient prop is provided
  useEffect(() => {
    if (patient) {
      setPatientName(`${patient.first_name} ${patient.last_name}`);
      setPatientEmail(patient.email);
    }
  }, [patient]);

  // Update date/time when props change
  useEffect(() => {
    setAppointmentDate(format(selectedDate, "yyyy-MM-dd"));
    setAppointmentTime(selectedTime);
  }, [selectedDate, selectedTime]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      if (!patient) {
        setPatientEmail("");
        setPatientName("");
      }
      setReason("");
      setDuration("60");
    }
  }, [open, patient]);

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
      let patientId: string;

      if (patient) {
        // Use existing patient ID
        patientId = patient.id;
      } else {
        // Find or create patient profile
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
      }

      // Create appointment with selected date and time
      const appointmentDateTime = new Date(appointmentDate);
      const [hours, minutes] = appointmentTime.split(":");
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes || "0"), 0, 0);

      const { error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          dentist_id: dentistId,
          patient_id: patientId,
          appointment_date: appointmentDateTime.toISOString(),
          duration_minutes: parseInt(duration),
          status: "pending",
          urgency: "medium",
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

  // Generate time options
  const timeOptions = [];
  for (let h = 8; h <= 18; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      timeOptions.push(time);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Book Appointment
          </DialogTitle>
          <DialogDescription>
            {patient
              ? `Schedule an appointment for ${patient.first_name} ${patient.last_name}`
              : "Create a new appointment"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Patient Info - Read-only if patient prop is provided */}
          {patient ? (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center text-primary font-semibold">
                  {patient.first_name[0]}{patient.last_name[0]}
                </div>
                <div>
                  <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                  <p className="text-sm text-muted-foreground">{patient.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointmentDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </Label>
              <Input
                id="appointmentDate"
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointmentTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time
              </Label>
              <Select value={appointmentTime} onValueChange={setAppointmentTime}>
                <SelectTrigger id="appointmentTime">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Visit</Label>
            <Textarea
              id="reason"
              placeholder="E.g., Routine checkup, tooth pain..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          {/* Duration */}
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
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreateAppointment} disabled={loading}>
            {loading ? "Creating..." : "Book Appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
