import { useState, useMemo } from "react";
import { format, startOfWeek, addDays, addHours, isSameDay, parseISO } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
// ScrollArea removed to avoid double scroll
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppointmentCompletionDialog } from "../appointment/AppointmentCompletionDialog";
import { QuickAppointmentDialog } from "./QuickAppointmentDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { logger } from '@/lib/logger';

interface WeeklyCalendarViewProps {
  dentistId: string;
  currentDate: Date;
  onAppointmentClick: (appointment: any) => void;
  selectedAppointmentId?: string;
  googleCalendarEvents?: any[];
}

const STATUS_COLORS: Record<string, string> = {
  "completed": "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100 border-l-4 border-l-emerald-500",
  "cancelled": "bg-gray-50 dark:bg-gray-800/20 text-gray-600 dark:text-gray-400 border-l-4 border-l-gray-400",
  "confirmed": "bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 border-l-4 border-l-blue-500",
  "pending": "bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 border-l-4 border-l-amber-500",
  "google-calendar": "bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100 border-l-4 border-l-purple-500",
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
  selectedAppointmentId,
  googleCalendarEvents = []
}: WeeklyCalendarViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [mobileCurrentDay, setMobileCurrentDay] = useState(0); // Index of current day (0-6)
  const [quickAppointmentOpen, setQuickAppointmentOpen] = useState(false);
  const [quickAppointmentDate, setQuickAppointmentDate] = useState<Date>(new Date());
  const [quickAppointmentTime, setQuickAppointmentTime] = useState<string>("");
  
  // Fetch dentist availability
  const { data: availability = [] } = useQuery({
    queryKey: ["dentist-availability", dentistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dentist_availability")
        .select("*")
        .eq("dentist_id", dentistId)
        .eq("is_available", true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!dentistId
  });

  // Generate time slots based on availability
  const generateTimeSlots = () => {
    if (!availability.length) {
      // Default to 9 AM - 6 PM if no availability set
      return Array.from({ length: 10 }, (_, i) => {
        const hour = 9 + i;
        return `${hour.toString().padStart(2, '0')}:00`;
      });
    }

    // Find earliest start and latest end across all days
    const times = availability.flatMap(avail => [
      avail.start_time,
      avail.end_time
    ]);
    
    const startHour = Math.min(...times.map((time: string) => parseInt(time.split(':')[0])));
    const endHour = Math.max(...times.map((time: string) => parseInt(time.split(':')[0])));
    
    return Array.from({ length: endHour - startHour + 1 }, (_, i) => {
      const hour = startHour + i;
      return `${hour.toString().padStart(2, '0')}:00`;
    });
  };

  const TIME_SLOTS = generateTimeSlots();

  // Check if a time slot is a break time for a specific day
  const isBreakTime = (day: Date, timeSlot: string) => {
    const dayOfWeek = day.getDay();
    const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek);
    
    if (!dayAvailability) return false;
    if (!dayAvailability.break_start_time || !dayAvailability.break_end_time) return false;
    
    const slotHour = parseInt(timeSlot.split(':')[0]);
    const breakStart = parseInt(dayAvailability.break_start_time.split(':')[0]);
    const breakEnd = parseInt(dayAvailability.break_end_time.split(':')[0]);
    
    return slotHour >= breakStart && slotHour < breakEnd;
  };
  
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
    const regularAppts = appointments.filter((apt) => {
      const aptDate = parseISO(apt.appointment_date);
      const aptHour = format(aptDate, "HH:00");
      return isSameDay(aptDate, day) && aptHour === timeSlot;
    });
    
    // Add Google Calendar events for this slot
    const googleEvents = (googleCalendarEvents || []).filter((event) => {
      const eventStart = parseISO(event.start);
      const eventHour = format(eventStart, "HH:00");
      return isSameDay(eventStart, day) && eventHour === timeSlot;
    }).map(event => ({
      ...event,
      id: event.id,
      patient: { first_name: '', last_name: '', email: '' },
      reason: event.summary,
      status: 'google-calendar',
      isGoogleCalendarEvent: true,
      appointment_date: event.start
    }));
    
    return [...regularAppts, ...googleEvents];
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

  const handleEmptySlotClick = (day: Date, timeSlot: string) => {
    setQuickAppointmentDate(day);
    setQuickAppointmentTime(timeSlot);
    setQuickAppointmentOpen(true);
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
      <div className="border rounded-lg bg-background overflow-hidden shadow-sm">
        {/* Mobile day navigation */}
        {isMobile && (
          <div className="flex items-center justify-between px-4 py-4 border-b bg-muted/30">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousDay}
              disabled={mobileCurrentDay === 0}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <div className="text-xs text-muted-foreground font-medium">
                {format(displayDays[0], "EEEE")}
              </div>
              <div className={cn(
                "text-base font-semibold mt-0.5",
                isSameDay(displayDays[0], new Date()) && "text-primary"
              )}>
                {format(displayDays[0], "MMM d, yyyy")}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextDay}
              disabled={mobileCurrentDay === 6}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Header with days (desktop only) */}
        {!isMobile && (
          <div className="sticky top-0 z-10 bg-muted/30 border-b">
            <div className="grid grid-cols-[80px_repeat(7,1fr)]">
              <div className="px-3 py-3"></div>
              {weekDays.map((day) => {
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={day.toISOString()}
                    className="px-2 py-3 text-center"
                  >
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      {format(day, "EEE")}
                    </div>
                    <div
                      className={cn(
                        "text-lg font-semibold inline-flex items-center justify-center w-9 h-9 rounded-lg",
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Time slots and appointments */}
      <div>
        <div className={cn(
          "grid",
          isMobile ? "grid-cols-[80px_1fr]" : "grid-cols-[80px_repeat(7,1fr)]"
        )}>
          {TIME_SLOTS.map((timeSlot) => (
            <>
              {/* Time label */}
              <div
                key={`time-${timeSlot}`}
                className="px-3 py-3 border-r border-b text-xs text-muted-foreground font-medium bg-muted/20"
              >
                {timeSlot}
              </div>

              {/* Slots for each day */}
              {displayDays.map((day) => {
                const slotAppointments = getAppointmentsForSlot(day, timeSlot);
                const isBreak = isBreakTime(day, timeSlot);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={`${day.toISOString()}-${timeSlot}`}
                    className={cn(
                      "p-2 border-r border-b last:border-r-0 min-h-[100px] transition-colors",
                      isBreak
                        ? "bg-muted/40"
                        : isToday
                          ? "bg-primary/5 hover:bg-primary/10"
                          : "bg-background hover:bg-muted/20"
                    )}
                  >
                    {isBreak ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground italic">Break</div>
                        </div>
                      </div>
                    ) : slotAppointments.length === 0 ? (
                      <div
                        className="flex items-center justify-center h-full group cursor-pointer rounded-md hover:bg-muted/40"
                        onClick={() => handleEmptySlotClick(day, timeSlot)}
                      >
                        <div className="text-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 rounded-full"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
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
                                  "p-2.5 cursor-pointer transition-all rounded-md border",
                                  getStatusColor(apt.status),
                                  isSelected && "ring-2 ring-primary ring-offset-1"
                                )}
                                onClick={() => onAppointmentClick(apt)}
                              >
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-7 w-7 flex-shrink-0">
                                    <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
                                      {getPatientInitials(apt.patient?.first_name, apt.patient?.last_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-xs truncate">
                                      {patientName}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                      {format(startTime, "h:mm a")}
                                    </div>
                                  </div>
                                  {apt.urgency === "high" && (
                                    <Badge
                                      variant="destructive"
                                      className="text-[9px] px-1.5 h-4 font-semibold"
                                    >
                                      !
                                    </Badge>
                                  )}
                                </div>
                              </Card>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="w-80 p-4">
                              <div className="space-y-3">
                                <div className="flex items-center gap-3 pb-3 border-b">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                      {getPatientInitials(apt.patient?.first_name, apt.patient?.last_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm">{patientName}</p>
                                    <p className="text-xs text-muted-foreground truncate">{apt.patient?.email}</p>
                                  </div>
                                </div>

                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Date</span>
                                    <span className="font-medium">{format(startTime, "MMM d, yyyy")}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Time</span>
                                    <span className="font-medium">{format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge variant="outline" className="text-[10px] capitalize">
                                      {apt.status}
                                    </Badge>
                                  </div>
                                  {apt.reason && (
                                    <div className="pt-1">
                                      <span className="text-muted-foreground">Reason:</span>
                                      <p className="mt-1 text-foreground">{apt.reason}</p>
                                    </div>
                                  )}
                                </div>

                                {apt.status !== "completed" && apt.status !== "cancelled" && (
                                  <div className="flex gap-2 pt-2 border-t">
                                    <Button
                                      size="sm"
                                      className="flex-1"
                                      onClick={(e) => handleCompleteAppointment(apt, e)}
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Complete
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1"
                                      onClick={(e) => handleCancelAppointment(apt.id, e)}
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />
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
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
        </div>
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

      <QuickAppointmentDialog
        open={quickAppointmentOpen}
        onOpenChange={setQuickAppointmentOpen}
        dentistId={dentistId}
        selectedDate={quickAppointmentDate}
        selectedTime={quickAppointmentTime}
      />
    </TooltipProvider>
  );
}
