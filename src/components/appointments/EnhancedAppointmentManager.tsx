import { useState } from "react";
import { Calendar, List, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AppointmentCalendarView } from "./AppointmentCalendarView";
import { AppointmentListView } from "./AppointmentListView";
import { AppointmentFilters } from "./AppointmentFilters";
import { useLanguage } from "@/hooks/useLanguage";

interface EnhancedAppointmentManagerProps {
  dentistId: string;
}

export function EnhancedAppointmentManager({ dentistId }: EnhancedAppointmentManagerProps) {
  const { t } = useLanguage();
  const [view, setView] = useState<"day" | "week" | "month" | "list">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState({
    patient: "",
    status: "all",
    type: "all",
    dateRange: "all"
  });

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    
    switch (view) {
      case "day":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
        break;
      case "week":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const getDateRangeLabel = () => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long',
      day: view !== 'month' ? 'numeric' : undefined
    };
    
    if (view === "week") {
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${currentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString(undefined, options)}`;
    }
    
    return currentDate.toLocaleDateString(undefined, options);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{t.navAppointments}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                {t.today}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={view} onValueChange={(v) => setView(v as any)} className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="list">
                  <List className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>

              {view !== "list" && (
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateDate("prev")}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[200px] text-center">
                    {getDateRangeLabel()}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateDate("next")}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <AppointmentFilters filters={filters} setFilters={setFilters} />

            <TabsContent value="day" className="mt-0">
              <AppointmentCalendarView
                dentistId={dentistId}
                view="day"
                currentDate={currentDate}
                filters={filters}
              />
            </TabsContent>

            <TabsContent value="week" className="mt-0">
              <AppointmentCalendarView
                dentistId={dentistId}
                view="week"
                currentDate={currentDate}
                filters={filters}
              />
            </TabsContent>

            <TabsContent value="month" className="mt-0">
              <AppointmentCalendarView
                dentistId={dentistId}
                view="month"
                currentDate={currentDate}
                filters={filters}
              />
            </TabsContent>

            <TabsContent value="list" className="mt-0">
              <AppointmentListView
                dentistId={dentistId}
                filters={filters}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
