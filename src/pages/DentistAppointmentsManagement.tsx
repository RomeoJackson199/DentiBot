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
  return <div className="h-screen flex flex-col bg-gradient-to-br from-background via-primary/5 to-secondary/10 pt-3 sm:pt-6">
      {/* Enhanced Header */}
      <div className={cn("border-b bg-card/95 backdrop-blur-lg sticky top-0 z-30 transition-transform duration-300 shadow-md", headerVisible ? "translate-y-0" : "-translate-y-full")}>
        {/* Page Title */}
        <div className="px-3 sm:px-6 pt-3 sm:pt-4 pb-2">
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Calendar & Appointments
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Manage your schedule and appointments</p>
        </div>

        {/* View Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 px-3 sm:px-6 pb-3 sm:pb-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("week")}
              className={cn("flex-1 sm:flex-initial text-xs sm:text-sm", viewMode === "week" && "bg-gradient-to-r from-blue-600 to-purple-600")}
            >
              Week View
            </Button>
            <Button
              variant={viewMode === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("day")}
              className={cn("flex-1 sm:flex-initial text-xs sm:text-sm", viewMode === "day" && "bg-gradient-to-r from-blue-600 to-purple-600")}
            >
              Day View
            </Button>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate("prev")}
              className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-primary/10"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-center">
              <span className="text-sm sm:text-base font-semibold text-center bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {getDateRangeLabel()}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate("next")}
              className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-primary/10"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="border-primary/30 hover:bg-primary/10 text-xs sm:text-sm"
          >
            Today
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Calendar View */}
        <div className={cn(
          "p-4 overflow-auto transition-all duration-300",
          selectedAppointment ? "hidden md:block md:w-[22%]" : "flex-1"
        )}>
          {dentistLoading ? <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div> : !dentistId ? <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">{t.notRegisteredDentist}</p>
            </div> : viewMode === "week" ? <WeeklyCalendarView dentistId={dentistId} currentDate={currentDate} onAppointmentClick={handleAppointmentClick} selectedAppointmentId={selectedAppointment?.id} googleCalendarEvents={googleCalendarEvents} /> : <DayCalendarView dentistId={dentistId} currentDate={currentDate} onAppointmentClick={setSelectedAppointment} selectedAppointmentId={selectedAppointment?.id} googleCalendarEvents={googleCalendarEvents} />}
        </div>

        {/* Sidebar */}
        {selectedAppointment && <div className={cn("w-full md:w-[78%] border-l bg-card/95 backdrop-blur-lg transition-all duration-300 shadow-xl")}>
            <AppointmentDetailsSidebar appointment={selectedAppointment} onClose={handleBackToWeek} onStatusChange={handleStatusChange} />
          </div>}
      </div>
    </div>;
}