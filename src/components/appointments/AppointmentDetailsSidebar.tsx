import { useState } from "react";
import { format, parseISO } from "date-fns";
import { X, Calendar, Clock, User, FileText, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppointmentCompletionDialog } from "@/components/appointment/AppointmentCompletionDialog";

interface AppointmentDetailsSidebarProps {
  appointment: any;
  onClose: () => void;
  onStatusChange: (appointmentId: string, status: string) => void;
}

const STATUS_CONFIG = {
  pending: { label: "Pending", icon: Clock, className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  confirmed: { label: "Confirmed", icon: CheckCircle, className: "bg-green-100 text-green-800 border-green-200" },
  completed: { label: "Completed", icon: CheckCircle, className: "bg-blue-100 text-blue-800 border-blue-200" },
  cancelled: { label: "Cancelled", icon: XCircle, className: "bg-red-100 text-red-800 border-red-200" },
};

export function AppointmentDetailsSidebar({ 
  appointment, 
  onClose,
  onStatusChange 
}: AppointmentDetailsSidebarProps) {
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const patientName = `${appointment.patient?.first_name || ""} ${appointment.patient?.last_name || ""}`.trim() || "Unknown Patient";
  const appointmentDate = parseISO(appointment.appointment_date);
  const statusConfig = STATUS_CONFIG[appointment.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = statusConfig?.icon || Clock;

  return (
    <Card className="h-full border-l-4 border-l-primary">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Appointment Details</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <CardContent className="space-y-6">
          {/* Patient Info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {appointment.patient?.first_name?.[0]}{appointment.patient?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{patientName}</h3>
              {appointment.patient?.email && (
                <p className="text-sm text-muted-foreground">{appointment.patient.email}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Date & Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{format(appointmentDate, "EEEE, MMMM d, yyyy")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">{format(appointmentDate, "h:mm a")}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Appointment Info */}
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Appointment ID</p>
              <p className="text-xs font-mono bg-muted px-2 py-1 rounded">
                #{appointment.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Status</p>
              <Badge className={cn("gap-1", statusConfig?.className)}>
                <StatusIcon className="h-3 w-3" />
                {statusConfig?.label}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Urgency</p>
              <Badge variant="outline" className={cn(
                appointment.urgency === "high" && "bg-red-100 text-red-800 border-red-200",
                appointment.urgency === "medium" && "bg-orange-100 text-orange-800 border-orange-200",
                appointment.urgency === "low" && "bg-gray-100 text-gray-800 border-gray-200"
              )}>
                {appointment.urgency.toUpperCase()}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Reason</p>
              <p className="font-medium">{appointment.reason || "General consultation"}</p>
            </div>

            {appointment.notes && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Notes</p>
                </div>
                <p className="text-sm bg-muted p-3 rounded-md">{appointment.notes}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <p className="text-sm font-medium mb-3">Actions</p>
            
            {appointment.status === "pending" && (
              <Button
                className="w-full gap-2"
                onClick={() => onStatusChange(appointment.id, "confirmed")}
              >
                <CheckCircle className="h-4 w-4" />
                Confirm Appointment
              </Button>
            )}

            {appointment.status === "confirmed" && (
              <Button
                className="w-full gap-2"
                onClick={() => setShowCompletionDialog(true)}
              >
                <CheckCircle className="h-4 w-4" />
                Mark as Completed
              </Button>
            )}

            {(appointment.status === "pending" || appointment.status === "confirmed") && (
              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={() => onStatusChange(appointment.id, "cancelled")}
              >
                <XCircle className="h-4 w-4" />
                Cancel Appointment
              </Button>
            )}

            <Button variant="outline" className="w-full gap-2">
              <User className="h-4 w-4" />
              View Patient Profile
            </Button>
          </div>
        </CardContent>
      </ScrollArea>

      <AppointmentCompletionDialog
        open={showCompletionDialog}
        onOpenChange={setShowCompletionDialog}
        appointment={appointment}
        onCompleted={() => {
          onStatusChange(appointment.id, "completed");
          setShowCompletionDialog(false);
        }}
      />
    </Card>
  );
}
