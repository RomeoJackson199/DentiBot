import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentCard } from "./AppointmentCard";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth } from "date-fns";

interface AppointmentCalendarViewProps {
  dentistId: string;
  view: "day" | "week" | "month";
  currentDate: Date;
  filters: any;
}

export function AppointmentCalendarView({
  dentistId,
  view,
  currentDate,
  filters
}: AppointmentCalendarViewProps) {
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments", dentistId, view, currentDate, filters],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select(`
          *,
          profiles(first_name, last_name, email)
        `)
        .eq("dentist_id", dentistId)
        .order("appointment_date", { ascending: true });

      // Apply date range filter
      if (view === "day") {
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);
        query = query.gte("appointment_date", dayStart.toISOString())
                    .lte("appointment_date", dayEnd.toISOString());
      } else if (view === "week") {
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        query = query.gte("appointment_date", weekStart.toISOString())
                    .lte("appointment_date", weekEnd.toISOString());
      } else if (view === "month") {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        query = query.gte("appointment_date", monthStart.toISOString())
                    .lte("appointment_date", monthEnd.toISOString());
      }

      // Apply status filter
      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      // Apply type filter
      if (filters.type !== "all") {
        query = query.eq("reason", filters.type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  const getDaysToDisplay = () => {
    if (view === "day") return [currentDate];
    if (view === "week") return eachDayOfInterval({
      start: startOfWeek(currentDate),
      end: endOfWeek(currentDate)
    });
    return eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    });
  };

  const days = getDaysToDisplay();

  return (
    <div className={`grid ${view === "month" ? "grid-cols-7" : view === "week" ? "grid-cols-7" : "grid-cols-1"} gap-4`}>
      {days.map((day) => {
        const dayAppointments = appointments?.filter((apt) =>
          isSameDay(new Date(apt.appointment_date), day)
        ) || [];

        return (
          <div key={day.toISOString()} className="border rounded-lg p-4 min-h-[150px]">
            <h3 className="font-semibold mb-2">
              {format(day, view === "month" ? "d" : "EEE, MMM d")}
            </h3>
            <div className="space-y-2">
              {dayAppointments.map((apt) => (
                <AppointmentCard key={apt.id} appointment={apt} compact={view === "month"} />
              ))}
              {dayAppointments.length === 0 && (
                <p className="text-sm text-muted-foreground">No appointments</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
