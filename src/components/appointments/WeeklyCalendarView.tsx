import { useState, useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WeeklyCalendarViewProps {
  dentistId: string;
  currentDate: Date;
  onAppointmentClick: (appointment: any) => void;
  selectedAppointmentId?: string;
}

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

const REASON_COLORS: Record<string, string> = {
  "General consultation": "bg-green-100 text-green-700 border-green-200",
  "Checkup": "bg-blue-100 text-blue-700 border-blue-200",
  "Cleaning": "bg-purple-100 text-purple-700 border-purple-200",
  "Emergency": "bg-red-100 text-red-700 border-red-200",
  "Root canal": "bg-orange-100 text-orange-700 border-orange-200",
  "Filling": "bg-yellow-100 text-yellow-700 border-yellow-200",
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
        .select(`
          *,
          patient:profiles!appointments_patient_id_fkey(first_name, last_name, email)
        `)
        .eq("dentist_id", dentistId)
        .gte("appointment_date", weekStart.toISOString())
        .lt("appointment_date", weekEnd.toISOString())
        .order("appointment_date", { ascending: true });

      if (error) throw error;
      return data || [];
    }
  });

  const getAppointmentsForSlot = (day: Date, timeSlot: string) => {
    return appointments.filter((apt) => {
      const aptDate = parseISO(apt.appointment_date);
      const aptTime = format(aptDate, "HH:mm");
      return isSameDay(aptDate, day) && aptTime === timeSlot;
    });
  };

  const getPatientInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  const getReasonColor = (reason: string) => {
    return REASON_COLORS[reason] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
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

                        return (
                          <Card
                            key={apt.id}
                            className={cn(
                              "p-2 cursor-pointer hover:shadow-md transition-all border-l-4",
                              getReasonColor(apt.reason),
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
                                  {format(parseISO(apt.appointment_date), "HH:mm")}
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
  );
}
