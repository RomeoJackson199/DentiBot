import { useMemo } from "react";
import { format, parseISO, isSameDay, addHours } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DayCalendarViewProps {
  dentistId: string;
  currentDate: Date;
  onAppointmentClick: (appointment: any) => void;
  selectedAppointmentId?: string;
  googleCalendarEvents?: any[];
}

const STATUS_COLORS: Record<string, string> = {
  "completed": "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-900/40 dark:via-green-900/40 dark:to-teal-900/40 text-emerald-900 dark:text-emerald-100 border-l-emerald-500 shadow-md hover:shadow-lg",
  "cancelled": "bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-gray-800/40 dark:via-slate-800/40 dark:to-gray-800/40 text-gray-600 dark:text-gray-400 border-l-gray-400 shadow-md hover:shadow-lg",
  "confirmed": "bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-blue-900/40 dark:via-indigo-900/40 dark:to-blue-900/40 text-blue-900 dark:text-blue-100 border-l-blue-500 shadow-md hover:shadow-lg",
  "pending": "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-900/40 dark:via-yellow-900/40 dark:to-orange-900/40 text-amber-900 dark:text-amber-100 border-l-amber-500 shadow-md hover:shadow-lg",
  "google-calendar": "bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 dark:from-purple-900/40 dark:via-violet-900/40 dark:to-fuchsia-900/40 text-purple-900 dark:text-purple-100 border-l-purple-500 shadow-md hover:shadow-lg",
};

const URGENCY_BADGES: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-300 animate-pulse",
  medium: "bg-orange-100 text-orange-700 border-orange-300",
  low: "bg-gray-100 text-gray-700 border-gray-300",
};

export function DayCalendarView({
  dentistId,
  currentDate,
  onAppointmentClick,
  selectedAppointmentId,
  googleCalendarEvents = []
}: DayCalendarViewProps) {
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
  const TIME_SLOTS = useMemo(() => {
    if (!availability.length) {
      // Default to 9 AM - 6 PM if no availability set
      return Array.from({ length: 10 }, (_, i) => {
        const hour = 9 + i;
        return `${hour.toString().padStart(2, '0')}:00`;
      });
    }

    // Find earliest start and latest end across all days
    const times = availability.flatMap((avail: any) => [
      avail.start_time,
      avail.end_time
    ]);
    
    const startHour = Math.min(...times.map((time: string) => parseInt(time.split(':')[0])));
    const endHour = Math.max(...times.map((time: string) => parseInt(time.split(':')[0])));
    
    return Array.from({ length: endHour - startHour + 1 }, (_, i) => {
      const hour = startHour + i;
      return `${hour.toString().padStart(2, '0')}:00`;
    });
  }, [availability]);

  // Check if a time slot is a break time
  const isBreakTime = (timeSlot: string) => {
    const dayOfWeek = currentDate.getDay();
    const dayAvailability = availability.find((a: any) => a.day_of_week === dayOfWeek);
    
    if (!dayAvailability) return false;
    if (!dayAvailability.break_start_time || !dayAvailability.break_end_time) return false;
    
    const slotHour = parseInt(timeSlot.split(':')[0]);
    const breakStart = parseInt(dayAvailability.break_start_time.split(':')[0]);
    const breakEnd = parseInt(dayAvailability.break_end_time.split(':')[0]);
    
    return slotHour >= breakStart && slotHour < breakEnd;
  };

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments-day", dentistId, format(currentDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("dentist_id", dentistId)
        .gte("appointment_date", dayStart.toISOString())
        .lte("appointment_date", dayEnd.toISOString())
        .order("appointment_date", { ascending: true });

      if (error) throw error;

      const appointments = data || [];
      const patientIds = Array.from(new Set(appointments.map((a: any) => a.patient_id).filter(Boolean)));

      if (patientIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email, phone, date_of_birth")
          .in("id", patientIds);

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        return appointments.map((a: any) => ({
          ...a,
          patient: profileMap.get(a.patient_id) || null
        }));
      }

      return appointments;
    }
  });

  const getAppointmentsForSlot = (timeSlot: string) => {
    const regularAppts = appointments.filter((apt) => {
      const aptDate = parseISO(apt.appointment_date);
      const aptHour = format(aptDate, "HH:00");
      return aptHour === timeSlot;
    });
    
    // Add Google Calendar events for this slot
    const googleEvents = (googleCalendarEvents || []).filter((event) => {
      const eventStart = parseISO(event.start);
      const eventHour = format(eventStart, "HH:00");
      return eventHour === timeSlot;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="border-2 rounded-2xl bg-white dark:bg-gray-900 overflow-hidden shadow-xl transition-all duration-300">
      {/* Enhanced Header */}
      <div className="border-b-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 px-6 py-5">
        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">
          {format(currentDate, "EEEE")}
        </div>
        <div className="text-3xl font-bold mt-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          {format(currentDate, "MMMM d, yyyy")}
        </div>
      </div>

      {/* Time slots */}
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="divide-y-2 divide-gray-100 dark:divide-gray-800">
          {TIME_SLOTS.map((timeSlot) => {
            const slotAppointments = getAppointmentsForSlot(timeSlot);
            const isBreak = isBreakTime(timeSlot);

            return (
              <div
                key={timeSlot}
                className={cn(
                  "grid grid-cols-[110px_1fr] transition-all duration-200",
                  isBreak
                    ? "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900"
                    : "hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 dark:hover:from-blue-950/10 dark:hover:to-purple-950/10"
                )}
              >
                {/* Time label */}
                <div className="p-4 text-sm text-muted-foreground font-bold border-r-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                  {timeSlot}
                </div>

                {/* Appointment slot */}
                <div className="p-4 min-h-[90px]">
                  {isBreak ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-1">
                        <div className="text-sm text-muted-foreground font-semibold italic">Break Time</div>
                        <div className="text-xs text-muted-foreground/60">No appointments</div>
                      </div>
                    </div>
                  ) : slotAppointments.length === 0 ? (
                    <div className="flex items-center h-full">
                      <div className="text-sm text-muted-foreground italic">Available - No appointments</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {slotAppointments.map((apt) => {
                        const patientName = `${apt.patient?.first_name || ""} ${apt.patient?.last_name || ""}`.trim() || "Unknown";
                        const isSelected = apt.id === selectedAppointmentId;
                        const startTime = parseISO(apt.appointment_date);

                        return (
                          <Card
                            key={apt.id}
                            className={cn(
                              "p-4 cursor-pointer transition-all duration-300 border-l-[6px] rounded-xl backdrop-blur-sm",
                              STATUS_COLORS[apt.status],
                              isSelected && "ring-4 ring-blue-500 ring-offset-2 shadow-2xl scale-105"
                            )}
                            onClick={() => onAppointmentClick(apt)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-white dark:ring-gray-800 shadow-md">
                                <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                  {getPatientInitials(apt.patient?.first_name, apt.patient?.last_name)}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm mb-1">{patientName}</div>
                                <div className="text-xs text-muted-foreground mb-2 line-clamp-1">
                                  {apt.reason || "General consultation"}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs font-semibold">
                                    {format(startTime, "h:mm a")}
                                  </Badge>
                                  {apt.urgency !== "low" && (
                                    <Badge
                                      variant="outline"
                                      className={cn("text-xs uppercase font-bold", URGENCY_BADGES[apt.urgency])}
                                    >
                                      {apt.urgency}
                                    </Badge>
                                  )}
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs font-semibold capitalize",
                                      apt.status === "completed" && "bg-emerald-50 text-emerald-700 border-emerald-300",
                                      apt.status === "confirmed" && "bg-blue-50 text-blue-700 border-blue-300",
                                      apt.status === "pending" && "bg-amber-50 text-amber-700 border-amber-300"
                                    )}
                                  >
                                    {apt.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
