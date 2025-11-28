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
  "completed": "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 text-emerald-900 border-l-emerald-500 shadow-md hover:shadow-lg",
  "cancelled": "bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 text-gray-600 border-l-gray-400 shadow-md hover:shadow-lg",
  "confirmed": "bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 text-blue-900 border-l-blue-500 shadow-md hover:shadow-lg",
  "pending": "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 text-amber-900 border-l-amber-500 shadow-md hover:shadow-lg",
  "google-calendar": "bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 text-purple-900 border-l-purple-500 shadow-md hover:shadow-lg",
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
      <div className="border-2 rounded-2xl bg-white overflow-hidden shadow-xl min-h-[calc(100vh-140px)] transition-all duration-300">
        {/* Mobile day navigation */}
        {isMobile && (
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousDay}
              disabled={mobileCurrentDay === 0}
              className="h-9 w-9 rounded-xl border-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {format(displayDays[0], "EEEE")}
              </div>
              <div className={cn(
                "text-lg font-bold",
                isSameDay(displayDays[0], new Date()) && "text-blue-600"
              )}>
                {format(displayDays[0], "d MMMM yyyy")}
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextDay}
              disabled={mobileCurrentDay === 6}
              className="h-9 w-9 rounded-xl border-2"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Header with days (desktop only) - Enhanced layout */}
        {!isMobile && (
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-b-2 border-gray-200">
            <div className="grid grid-cols-[100px_repeat(7,1fr)]">
              <div className="px-4 py-4"></div>
              {weekDays.map((day) => {
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={day.toISOString()}
                    className="px-2 py-4 text-center"
                  >
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                        {format(day, "EEE")}
                      </div>
                      <div
                        className={cn(
                          "text-2xl font-bold inline-flex items-center justify-center transition-all duration-300",
                          isToday
                            ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl w-12 h-12 shadow-lg scale-110"
                            : "text-foreground hover:bg-gray-100:bg-gray-800 rounded-2xl w-12 h-12"
                        )}
                      >
                        {format(day, "dd")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Time slots and appointments */}
      <div className="pt-2">
        <div className={cn(
          "grid",
          isMobile ? "grid-cols-[100px_1fr]" : "grid-cols-[100px_repeat(7,1fr)]"
        )}>
          {TIME_SLOTS.map((timeSlot) => (
            <>
              {/* Time label */}
              <div
                key={`time-${timeSlot}`}
                className="px-4 py-3 border-r-2 border-b text-sm text-muted-foreground font-semibold bg-gradient-to-r from-gray-50 to-gray-100"
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
                      "p-3 border-r border-b last:border-r-0 min-h-[110px] transition-all duration-200",
                      isBreak
                        ? "bg-gradient-to-br from-gray-100 to-gray-200 pattern-dots pattern-gray-300 pattern-bg-transparent pattern-size-2 pattern-opacity-30"
                        : isToday
                          ? "bg-gradient-to-br from-blue-50/50 to-purple-50/50 hover:from-blue-100/50 hover:to-purple-100/50"
                          : "bg-white hover:bg-gray-50:bg-gray-800/50"
                    )}
                  >
                    {isBreak ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-1">
                          <div className="text-xs text-muted-foreground font-semibold italic">Break Time</div>
                          <div className="text-[10px] text-muted-foreground/60">No appointments</div>
                        </div>
                      </div>
                    ) : slotAppointments.length === 0 ? (
                      <div
                        className="flex items-center justify-center h-full group cursor-pointer hover:bg-blue-50/50:bg-blue-950/20 rounded-lg transition-all duration-200"
                        onClick={() => handleEmptySlotClick(day, timeSlot)}
                      >
                        <div className="text-center space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <div className="text-[10px] text-muted-foreground font-medium">Add Appointment</div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
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
                                  "p-3 cursor-pointer transition-all duration-300 border-l-[6px] rounded-xl backdrop-blur-sm",
                                  getStatusColor(apt.status),
                                  isSelected && "ring-4 ring-blue-500 ring-offset-2 shadow-2xl scale-105 z-10"
                                )}
                                onClick={() => onAppointmentClick(apt)}
                              >
                                <div className="flex items-start gap-2">
                                  <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-white shadow-sm">
                                    <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                      {getPatientInitials(apt.patient?.first_name, apt.patient?.last_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-xs truncate mb-1">
                                      {patientName}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground font-medium">
                                      {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                                    </div>
                                  </div>
                                  {apt.urgency !== "low" && (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-[10px] px-2 h-5 font-bold",
                                        apt.urgency === "high" && "bg-red-100 text-red-700 border-red-300 animate-pulse"
                                      )}
                                    >
                                      {URGENCY_LABELS[apt.urgency]}
                                    </Badge>
                                  )}
                                </div>
                              </Card>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="w-[340px] p-0 border-l-[6px] border-l-blue-500 shadow-2xl rounded-xl">
                              <div className="p-5 space-y-4 bg-gradient-to-br from-white to-gray-50">
                                <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200">
                                  <Avatar className="h-14 w-14 ring-4 ring-blue-100 shadow-lg">
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                                      {getPatientInitials(apt.patient?.first_name, apt.patient?.last_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-lg">{patientName}</p>
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
                                  <div className="flex gap-2 pt-4 border-t-2 border-gray-200">
                                    <Button
                                      size="sm"
                                      className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-md rounded-xl font-semibold"
                                      onClick={(e) => handleCompleteAppointment(apt, e)}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-1" />
                                      Complete
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 border-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700:bg-red-950 rounded-xl font-semibold"
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
