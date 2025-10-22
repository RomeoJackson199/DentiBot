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
import { format, addDays, subDays, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
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
      console.error('Failed to update appointment status:', error);
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
  return <div className="h-screen flex flex-col bg-background pt-6">
      {/* Header */}
      <div className={cn("border-b bg-card sticky top-0 z-30 transition-transform duration-300", headerVisible ? "translate-y-0" : "-translate-y-full")}>
        

        {/* View Controls */}
        <div className="flex items-center justify-center px-6 pb-4 gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigateDate("prev")} className="h-9 w-9">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <span className="text-base font-semibold min-w-[240px] text-center">
            {getDateRangeLabel()}
          </span>
          
          <Button variant="ghost" size="icon" onClick={() => navigateDate("next")} className="h-9 w-9">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Calendar View */}
        <div className={`flex-1 p-4 overflow-auto ${selectedAppointment ? 'mr-96' : ''}`}>
          {dentistLoading ? <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div> : !dentistId ? <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">{t.notRegisteredDentist}</p>
            </div> : viewMode === "week" ? <WeeklyCalendarView dentistId={dentistId} currentDate={currentDate} onAppointmentClick={handleAppointmentClick} selectedAppointmentId={selectedAppointment?.id} /> : <DayCalendarView dentistId={dentistId} currentDate={currentDate} onAppointmentClick={setSelectedAppointment} selectedAppointmentId={selectedAppointment?.id} />}
        </div>

        {/* Sidebar */}
        {selectedAppointment && <div className={cn("w-96 border-l bg-card absolute right-0 bottom-0 shadow-lg transition-all duration-300", headerVisible ? "top-[170px]" : "top-0")}>
            <AppointmentDetailsSidebar appointment={selectedAppointment} onClose={() => setSelectedAppointment(null)} onStatusChange={handleStatusChange} />
          </div>}
      </div>
    </div>;
}