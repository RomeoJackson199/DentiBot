import { useState } from "react";
import { useCurrentDentist } from "@/hooks/useCurrentDentist";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ChevronLeft, ChevronRight, Plus, LayoutGrid, List as ListIcon, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { WeeklyCalendarView } from "@/components/appointments/WeeklyCalendarView";
import { AppointmentDetailsSidebar } from "@/components/appointments/AppointmentDetailsSidebar";
import { format, addDays, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export default function DentistAppointmentsManagement() {
  const { dentistId, loading: dentistLoading } = useCurrentDentist();
  const [view, setView] = useState<"week" | "day" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const navigateDate = (direction: "prev" | "next") => {
    const days = view === "day" ? 1 : view === "week" ? 7 : 30;
    setCurrentDate(direction === "next" 
      ? addDays(currentDate, days)
      : subDays(currentDate, days)
    );
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", appointmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment status updated successfully",
      });

      // Refresh the selected appointment if it's the one being updated
      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment({ ...selectedAppointment, status: newStatus });
      }
    } catch (error) {
      console.error('Failed to update appointment status:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive",
      });
    }
  };

  const getDateRangeLabel = () => {
    if (view === "day") {
      return format(currentDate, "EEEE, MMMM d, yyyy");
    } else if (view === "week") {
      const weekEnd = addDays(currentDate, 6);
      return `${format(currentDate, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
    } else {
      return format(currentDate, "MMMM yyyy");
    }
  };

  if (dentistLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dentistId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {t.notRegisteredDentist}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Appointment</h1>
            <p className="text-sm text-muted-foreground">Manage and track your patient medical appointments.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Appointment
            </Button>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex items-center gap-2">
            {/* Date selector */}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              {format(currentDate, "MMMM yyyy")}
            </Button>

            {/* View toggles */}
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={view === "day" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("day")}
              >
                Day
              </Button>
              <Button
                variant={view === "week" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("week")}
              >
                Week
              </Button>
              <Button
                variant={view === "month" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("month")}
              >
                Month
              </Button>
            </div>
          </div>

          {/* Navigation and filters */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm font-medium min-w-[200px] text-center">
              {getDateRangeLabel()}
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>

            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button variant="ghost" size="icon">
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <ListIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Calendar View */}
        <div className={`flex-1 p-4 overflow-auto ${selectedAppointment ? 'mr-96' : ''}`}>
          {dentistLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !dentistId ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">{t.notRegisteredDentist}</p>
            </div>
          ) : (
            <WeeklyCalendarView
              dentistId={dentistId}
              currentDate={currentDate}
              onAppointmentClick={setSelectedAppointment}
              selectedAppointmentId={selectedAppointment?.id}
            />
          )}
        </div>

        {/* Sidebar */}
        {selectedAppointment && (
          <div className="w-96 border-l bg-card absolute right-0 top-[140px] bottom-0 shadow-lg">
            <AppointmentDetailsSidebar
              appointment={selectedAppointment}
              onClose={() => setSelectedAppointment(null)}
              onStatusChange={handleStatusChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}