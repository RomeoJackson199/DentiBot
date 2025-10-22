import { useState, useMemo } from "react";
import { format, startOfWeek, addDays, addHours, isSameDay, parseISO } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppointmentCompletionDialog } from "../appointment/AppointmentCompletionDialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface WeeklyCalendarViewProps {
  dentistId: string;
  currentDate: Date;
  onAppointmentClick: (appointment: any) => void;
  selectedAppointmentId?: string;
}

const TIME_SLOTS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

const STATUS_COLORS: Record<string, string> = {
  "completed": "bg-green-50 text-green-900 border-l-green-500",
  "cancelled": "bg-gray-50 text-gray-600 border-l-gray-400",
  "confirmed": "bg-blue-50 text-blue-900 border-l-blue-500",
  "pending": "bg-yellow-50 text-yellow-900 border-l-yellow-500",
};

const URGENCY_LABELS: Record<string, string> = {
  high: "URG",
  medium: "MED",
  low: "LOW",
};

export function WeeklyCalendarView({ 
  dentistId, 
  currentDate, 
  onAppointmentClick,
  selectedAppointmentId 
}: WeeklyCalendarViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [mobileCurrentDay, setMobileCurrentDay] = useState(0); // Index of current day (0-6)
  
  // On mobile, only show one day
  const displayDays = isMobile ? [weekDays[mobileCurrentDay]] : weekDays;
  
  const handlePreviousDay = () => {
    if (mobileCurrentDay > 0) {
      setMobileCurrentDay(mobileCurrentDay - 1);
    }
  };
  
  const handleNextDay = () => {
    if (mobileCurrentDay < 6) {
      setMobileCurrentDay(mobileCurrentDay + 1);
    }
  };

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments-calendar", dentistId, format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const weekEnd = addDays(weekStart, 7);
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("dentist_id", dentistId)
        .gte("appointment_date", weekStart.toISOString())
        .lt("appointment_date", weekEnd.toISOString())
        .order("appointment_date", { ascending: true });

      if (error) throw error;
      const appointments = data || [];
      const patientIds = Array.from(new Set(appointments.map((a: any) => a.patient_id).filter(Boolean)));
      if (patientIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", patientIds);
        const map = new Map((profiles || []).map((p: any) => [p.id, p]));
        const enriched = appointments.map((a: any) => ({ ...a, patient: map.get(a.patient_id) || null }));
        return enriched;
      }
      return appointments;
    }
  });

  const getAppointmentsForSlot = (day: Date, timeSlot: string) => {
    return appointments.filter((apt) => {
      const aptDate = parseISO(apt.appointment_date);
      const aptHour = format(aptDate, "HH:00");
      return isSameDay(aptDate, day) && aptHour === timeSlot;
    });
  };

  const getPatientInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status] || "bg-gray-50 text-gray-900 border-l-gray-400";
  };

  const handleCancelAppointment = async (appointmentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointmentId);
      
      queryClient.invalidateQueries({ queryKey: ["appointments-calendar"] });
      toast({
        title: "Appointment cancelled",
        description: "The appointment has been cancelled successfully.",
      });
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteAppointment = (apt: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAppointment(apt);
    setCompletionDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="border rounded-lg bg-background overflow-hidden">
        {/* Mobile day navigation */}
        {isMobile && (
          <div className="flex items-center justify-between p-3 border-b bg-muted/30">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousDay}
              disabled={mobileCurrentDay === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <div className="text-xs text-muted-foreground font-medium uppercase">
                {format(displayDays[0], "EEEE")}
              </div>
              <div className={cn(
                "text-lg font-semibold mt-1",
                isSameDay(displayDays[0], new Date()) && "text-primary"
              )}>
                {format(displayDays[0], "MMMM dd, yyyy")}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextDay}
              disabled={mobileCurrentDay === 6}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Header with days (desktop only) */}
        {!isMobile && (
          <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b bg-muted/30">
            <div className="p-3 border-r"></div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className="p-3 text-center border-r last:border-r-0"
              >
                <div className="text-xs text-muted-foreground font-medium uppercase">
                  {format(day, "EEE")}
                </div>
                <div
                  className={cn(
                    "text-lg font-semibold mt-1",
                    isSameDay(day, new Date()) &&
                      "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto"
                  )}
                >
                  {format(day, "dd")}
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Time slots and appointments */}
      <ScrollArea className="h-[600px]">
        <div className={cn(
          "grid",
          isMobile ? "grid-cols-[80px_1fr]" : "grid-cols-[80px_repeat(7,1fr)]"
        )}>
          {TIME_SLOTS.map((timeSlot) => (
            <>
              {/* Time label */}
              <div
                key={`time-${timeSlot}`}
                className="p-3 border-r border-b text-sm text-muted-foreground font-medium bg-muted/10"
              >
                {timeSlot}
              </div>

              {/* Slots for each day */}
              {displayDays.map((day) => {
                const slotAppointments = getAppointmentsForSlot(day, timeSlot);
                
                return (
                  <div
                    key={`${day.toISOString()}-${timeSlot}`}
                    className="p-2 border-r border-b last:border-r-0 min-h-[80px] bg-background hover:bg-muted/5 transition-colors"
                  >
                    <div className="space-y-1">
                      {slotAppointments.map((apt) => {
                        const patientName = `${apt.patient?.first_name || ""} ${apt.patient?.last_name || ""}`.trim() || "Unknown";
                        const isSelected = apt.id === selectedAppointmentId;
                        const startTime = parseISO(apt.appointment_date);
                        const endTime = addHours(startTime, 1);

                        return (
                          <Tooltip key={apt.id}>
                            <TooltipTrigger asChild>
                              <Card
                                className={cn(
                                  "p-2 cursor-pointer hover:shadow-md transition-all border-l-4",
                                  getStatusColor(apt.status),
                                  isSelected && "ring-2 ring-primary shadow-lg scale-105"
                                )}
                                onClick={() => onAppointmentClick(apt)}
                              >
                                <div className="flex items-start gap-2">
                                  <Avatar className="h-6 w-6 flex-shrink-0">
                                    <AvatarFallback className="text-xs">
                                      {getPatientInitials(apt.patient?.first_name, apt.patient?.last_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-xs truncate">
                                      {patientName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {format(startTime, "h a")} - {format(endTime, "h a")}
                                    </div>
                                  </div>
                                  {apt.urgency !== "low" && (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-xs px-1 h-5",
                                        apt.urgency === "high" && "bg-red-100 text-red-700 border-red-300"
                                      )}
                                    >
                                      {URGENCY_LABELS[apt.urgency]}
                                    </Badge>
                                  )}
                                </div>
                              </Card>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="w-[320px] p-0 border-l-4 border-l-primary shadow-lg">
                              <div className="p-4 space-y-4">
                                <div className="flex items-center gap-3 pb-3 border-b">
                                  <Avatar className="h-12 w-12 bg-primary text-primary-foreground">
                                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                      {getPatientInitials(apt.patient?.first_name, apt.patient?.last_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-base">{patientName}</p>
                                    <p className="text-sm text-muted-foreground truncate">{apt.patient?.email}</p>
                                  </div>
                                </div>
                                
                                <div className="space-y-3 text-sm">
                                  <div className="flex items-start gap-3 py-2">
                                    <div className="w-8 h-8 rounded flex items-center justify-center bg-muted">
                                      <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-muted-foreground text-xs mb-1">Date</p>
                                      <p className="font-medium">{format(startTime, "EEEE, MMMM d, yyyy")}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-start gap-3 py-2">
                                    <div className="w-8 h-8 rounded flex items-center justify-center bg-muted">
                                      <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-muted-foreground text-xs mb-1">Time</p>
                                      <p className="font-medium">{format(startTime, "h:mm a")}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-2 pt-2 border-t">
                                  <div>
                                    <p className="text-muted-foreground text-xs mb-1">Status</p>
                                    <Badge 
                                      variant={apt.status === "completed" ? "success" : apt.status === "confirmed" ? "default" : "secondary"} 
                                      className="capitalize"
                                    >
                                      ✓ {apt.status}
                                    </Badge>
                                  </div>
                                  
                                  {apt.urgency !== "low" && (
                                    <div>
                                      <p className="text-muted-foreground text-xs mb-1">Urgency</p>
                                      <Badge 
                                        variant={apt.urgency === "high" ? "destructive" : "outline"}
                                        className="uppercase text-xs font-semibold"
                                      >
                                        {URGENCY_LABELS[apt.urgency] || apt.urgency}
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  {apt.reason && (
                                    <div>
                                      <p className="text-muted-foreground text-xs mb-1">Reason</p>
                                      <p className="text-sm">{apt.reason}</p>
                                    </div>
                                  )}
                                </div>

                                {apt.status !== "completed" && apt.status !== "cancelled" && (
                                  <div className="flex gap-2 pt-3 border-t">
                                    <Button
                                      size="sm"
                                      className="flex-1"
                                      onClick={(e) => handleCompleteAppointment(apt, e)}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-1" />
                                      Complete
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1"
                                      onClick={(e) => handleCancelAppointment(apt.id, e)}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Cancel
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          ))}
        </div>
        </ScrollArea>
      </div>

      {selectedAppointment && (
        <AppointmentCompletionDialog
          appointment={selectedAppointment}
          open={completionDialogOpen}
          onOpenChange={setCompletionDialogOpen}
          onCompleted={() => {
            setCompletionDialogOpen(false);
            setSelectedAppointment(null);
            queryClient.invalidateQueries({ queryKey: ["appointments-calendar"] });
          }}
        />
      )}
    </TooltipProvider>
  );
}
