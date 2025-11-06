import { useState, useEffect, useRef } from "react";
import { useCurrentDentist } from "@/hooks/useCurrentDentist";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { WeeklyCalendarView } from "@/components/appointments/WeeklyCalendarView";
import { DayCalendarView } from "@/components/appointments/DayCalendarView";
import { AppointmentDetailsSidebar } from "@/components/appointments/AppointmentDetailsSidebar";
import { format, addDays, subDays, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { logger } from '@/lib/logger';
export default function DentistAppointmentsManagement() {
  const {
    dentistId,
    loading: dentistLoading
  } = useCurrentDentist();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const {
    toast
  } = useToast();
  const {
    t
  } = useLanguage();
  const queryClient = useQueryClient();

  // Fetch Google Calendar events
  const { data: googleCalendarEvents } = useQuery({
    queryKey: ['google-calendar-events', dentistId, currentDate],
    queryFn: async () => {
      if (!dentistId) return [];
      
      const startDate = startOfWeek(currentDate);
      const endDate = endOfWeek(addDays(currentDate, 7));
      
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }
      });

      if (error) {
        logger.error('Error fetching Google Calendar events:', error);
        return [];
      }

      return data?.events || [];
    },
    enabled: !!dentistId,
    refetchInterval: 300000, // Refresh every 5 minutes
  });
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 10) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, {
      passive: true
    });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const navigateDate = (direction: "prev" | "next") => {
    const daysToAdd = viewMode === "week" ? 7 : 1;
    setCurrentDate(direction === "next" ? addDays(currentDate, daysToAdd) : subDays(currentDate, daysToAdd));
  };
  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setViewMode("day");
    setCurrentDate(parseISO(appointment.appointment_date));
  };
  const handleBackToWeek = () => {
    setViewMode("week");
    setSelectedAppointment(null);
  };
  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const {
        error
      } = await supabase.from("appointments").update({
        status: newStatus,
        updated_at: new Date().toISOString()
      }).eq("id", appointmentId);
      if (error) throw error;

      // Sync to Google Calendar - delete if cancelled, otherwise update
      try {
        const action = newStatus === 'cancelled' ? 'delete' : 'update';
        await supabase.functions.invoke('google-calendar-create-event', {
          body: { appointmentId, action }
        });
      } catch (calendarError) {
        logger.error('Failed to sync status change to Google Calendar:', calendarError);
      }

      toast({
        title: "Success",
        description: "Appointment status updated successfully"
      });

      // Refresh the selected appointment if it's the one being updated
      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment({
          ...selectedAppointment,
          status: newStatus
        });
      }

      // Invalidate calendar queries to refresh agenda colors/status
      await queryClient.invalidateQueries({
        queryKey: ["appointments-calendar"],
        exact: false
      });
    } catch (error) {
      logger.error('Failed to update appointment status:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive"
      });
    }
  };
  const getDateRangeLabel = () => {
    if (viewMode === "day") {
      return format(currentDate, "EEEE, MMMM d, yyyy");
    }
    const weekEnd = addDays(currentDate, 6);
    return `${format(currentDate, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
  };
  if (dentistLoading) {
    return <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  if (!dentistId) {
    return <div className="flex justify-center items-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {t.notRegisteredDentist}
            </p>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="h-screen flex flex-col bg-background">
      {/* Simplified Header */}
      <div className={cn("border-b bg-card sticky top-0 z-30 transition-transform duration-300", headerVisible ? "translate-y-0" : "-translate-y-full")}>
        {/* Page Title */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            My Calendar & Appointments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your schedule and appointments</p>
        </div>

        {/* View Controls */}
        <div className="flex items-center justify-between px-4 sm:px-6 pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate("prev")}
              className="h-9 w-9 hover:bg-muted"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-foreground min-w-[200px] text-center">
                {getDateRangeLabel()}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate("next")}
              className="h-9 w-9 hover:bg-muted"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="hover:bg-muted"
          >
            Today
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden bg-muted/10">
        {/* Calendar View */}
        <div className={cn(
          "p-4 overflow-auto transition-all duration-300",
          selectedAppointment ? "hidden md:block md:w-[65%]" : "flex-1"
        )}>
          {dentistLoading ? <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div> : !dentistId ? <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">{t.notRegisteredDentist}</p>
            </div> : viewMode === "week" ? <WeeklyCalendarView dentistId={dentistId} currentDate={currentDate} onAppointmentClick={handleAppointmentClick} selectedAppointmentId={selectedAppointment?.id} googleCalendarEvents={googleCalendarEvents} /> : <DayCalendarView dentistId={dentistId} currentDate={currentDate} onAppointmentClick={setSelectedAppointment} selectedAppointmentId={selectedAppointment?.id} googleCalendarEvents={googleCalendarEvents} />}
        </div>

        {/* Sidebar */}
        {selectedAppointment && <div className={cn("w-full md:w-[35%] border-l bg-card transition-all duration-300")}>
            <AppointmentDetailsSidebar appointment={selectedAppointment} onClose={handleBackToWeek} onStatusChange={handleStatusChange} />
          </div>}
      </div>
    </div>;
}