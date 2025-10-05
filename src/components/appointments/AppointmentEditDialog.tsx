import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AppointmentEditDialogProps {
  appointment: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppointmentEditDialog({ appointment, open, onOpenChange }: AppointmentEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(appointment.status);
  const [notes, setNotes] = useState(appointment.consultation_notes || "");
  const [treatmentNotes, setTreatmentNotes] = useState(appointment.notes || "");

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("appointments")
        .update(data)
        .eq("id", appointment.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Appointment updated successfully" });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ 
        title: "Error updating appointment",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleComplete = () => {
    updateMutation.mutate({
      status: "completed",
      consultation_notes: notes,
      notes: treatmentNotes,
      treatment_completed_at: new Date().toISOString()
    });
  };

  const handleUpdate = () => {
    updateMutation.mutate({
      status,
      consultation_notes: notes,
      notes: treatmentNotes
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Appointment Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Patient</Label>
              <p className="font-medium">
                {appointment.patient?.first_name} {appointment.patient?.last_name}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Date & Time</Label>
              <p className="font-medium">
                {format(new Date(appointment.appointment_date), "PPp")}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Reason</Label>
              <p className="font-medium">{appointment.reason || "Not specified"}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Urgency</Label>
              <p className="font-medium capitalize">{appointment.urgency || "Normal"}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Consultation Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add consultation notes..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Treatment Notes</Label>
            <Textarea
              value={treatmentNotes}
              onChange={(e) => setTreatmentNotes(e.target.value)}
              placeholder="Add treatment notes..."
              rows={4}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              Save Changes
            </Button>
            {appointment.status !== "completed" && (
              <Button onClick={handleComplete} disabled={updateMutation.isPending}>
                Mark as Completed
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
