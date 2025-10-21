import { useState, useMemo } from "react";
import { format, startOfWeek, addDays, addHours, isSameDay, parseISO } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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
        {/* Header with days */}
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

      {/* Time slots and appointments */}
      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-[80px_repeat(7,1fr)]">
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
              {weekDays.map((day) => {
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
                            <TooltipContent side="right" className="w-80">
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-12 w-12">
                                    <AvatarFallback>
                                      {getPatientInitials(apt.patient?.first_name, apt.patient?.last_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-semibold">{patientName}</p>
                                    <p className="text-sm text-muted-foreground">{apt.reason}</p>
                                  </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Appointment ID:</span>
                                    <span className="font-mono text-xs">#{apt.id.slice(0, 8)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status:</span>
                                    <Badge variant="outline" className="capitalize">{apt.status}</Badge>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Time:</span>
                                    <span>{format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Urgency:</span>
                                    <Badge variant="secondary">{URGENCY_LABELS[apt.urgency] || apt.urgency}</Badge>
                                  </div>
                                  {apt.notes && (
                                    <div className="pt-2 border-t">
                                      <span className="text-muted-foreground font-medium">Notes:</span>
                                      <p className="mt-1">{apt.notes}</p>
                                    </div>
                                  )}
                                </div>
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
    </TooltipProvider>
  );
}
