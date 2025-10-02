import { PaymentRecorder } from "@/components/payments/PaymentRecorder";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, XCircle } from "lucide-react";

interface AppointmentActionsProps {
  appointmentId: string;
  patientId: string;
  dentistId: string;
  status: string;
  onStatusChange?: (newStatus: string) => void;
}

export function AppointmentActions({
  appointmentId,
  patientId,
  dentistId,
  status,
  onStatusChange,
}: AppointmentActionsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {status === "pending" && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => onStatusChange?.("confirmed")}
          >
            <CheckCircle className="h-4 w-4" />
            Confirm
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 text-destructive hover:text-destructive"
            onClick={() => onStatusChange?.("cancelled")}
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </Button>
        </>
      )}

      {status === "confirmed" && (
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() => onStatusChange?.("completed")}
        >
          <CheckCircle className="h-4 w-4" />
          Mark Complete
        </Button>
      )}

      {(status === "completed" || status === "confirmed") && (
        <PaymentRecorder
          appointmentId={appointmentId}
          patientId={patientId}
          dentistId={dentistId}
        />
      )}

      <Button size="sm" variant="outline" className="gap-2">
        <Calendar className="h-4 w-4" />
        Reschedule
      </Button>
    </div>
  );
}
