import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, User, MapPin } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  appointment?: {
    patientName: string;
    reason: string;
  };
}

interface DaySchedule {
  date: Date;
  slots: TimeSlot[];
}

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate time slots for a day
  const generateTimeSlots = (date: Date): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const isAvailable = Math.random() > 0.3; // 70% chance of being available
        
        slots.push({
          id: `${date.toISOString()}-${time}`,
          time,
          available: isAvailable,
          appointment: isAvailable ? undefined : {
            patientName: "John Doe",
            reason: "Regular checkup"
          }
        });
      }
    }
    
    return slots;
  };

  // Generate schedule for the current week
  useEffect(() => {
    const generateWeekSchedule = () => {
      const start = startOfWeek(selectedDate);
      const end = endOfWeek(selectedDate);
      const days = eachDayOfInterval({ start, end });
      
      const weekSchedule = days.map(date => ({
        date,
        slots: generateTimeSlots(date)
      }));
      
      setSchedule(weekSchedule);
      setLoading(false);
    };

    generateWeekSchedule();
  }, [selectedDate]);

  const getDayName = (date: Date) => {
    return format(date, 'EEEE');
  };

  const getFormattedDate = (date: Date) => {
    return format(date, 'MMM d');
  };

  const getTimeSlotsForDate = (date: Date) => {
    return schedule.find(day => 
      format(day.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    )?.slots || [];
  };

  return (
    <div className="p-3 md:p-4 max-w-7xl mx-auto">
      <PageHeader
        title="Schedule"
        subtitle="Manage your appointments and availability"
        breadcrumbs={[{ label: "Clinical", href: "/clinical" }, { label: "Schedule" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Schedule for selected date */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Schedule for {getDayName(selectedDate)}, {getFormattedDate(selectedDate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {getTimeSlotsForDate(selectedDate).map((slot) => (
                  <div
                    key={slot.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      slot.available
                        ? 'bg-green-50 border-green-200 hover:bg-green-100'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={slot.available ? "default" : "secondary"}>
                          {slot.time}
                        </Badge>
                        {slot.available ? (
                          <span className="text-sm text-green-700">Available</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {slot.appointment?.patientName}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              - {slot.appointment?.reason}
                            </span>
                          </div>
                        )}
                      </div>
                      {slot.available && (
                        <Button size="sm" variant="outline">
                          Book
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Set Availability
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Block Time
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Schedule;
