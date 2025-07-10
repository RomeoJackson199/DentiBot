import { useState, useEffect } from "react";
import { Calendar, Clock, Plus, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CalendarEventForm } from "./CalendarEventForm";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  event_type: string;
  appointment_id?: string;
}

interface DentistCalendarViewProps {
  dentistId: string;
}

export function DentistCalendarView({ dentistId }: DentistCalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const { toast } = useToast();

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    fetchEvents();
  }, [dentistId, currentWeek]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('dentist_id', dentistId)
        .gte('start_datetime', weekStart.toISOString())
        .lte('end_datetime', weekEnd.toISOString())
        .order('start_datetime');

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch calendar events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      
      fetchEvents();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'appointment': return 'bg-primary';
      case 'blocked_time': return 'bg-destructive';
      case 'break': return 'bg-muted';
      case 'personal': return 'bg-secondary';
      default: return 'bg-primary';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading calendar...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Calendar className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Calendar</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() - 7)))}
          >
            Previous Week
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentWeek(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() + 7)))}
          >
            Next Week
          </Button>
          <Button onClick={() => setShowEventForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((day) => {
              const dayEvents = events.filter(event => 
                isSameDay(parseISO(event.start_datetime), day)
              );

              return (
                <div key={day.toISOString()} className="space-y-2">
                  <div className="text-center font-medium p-2 bg-muted rounded">
                    {format(day, 'EEE d')}
                  </div>
                  <div className="space-y-1 min-h-[200px]">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-2 rounded text-white text-xs cursor-pointer group relative ${getEventTypeColor(event.event_type)}`}
                        onClick={() => {
                          setEditingEvent(event);
                          setShowEventForm(true);
                        }}
                      >
                        <div className="font-medium">{event.title}</div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(event.start_datetime), 'HH:mm')}
                        </div>
                        {event.event_type !== 'appointment' && (
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-white hover:bg-white/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteEvent(event.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {showEventForm && (
        <CalendarEventForm
          dentistId={dentistId}
          event={editingEvent}
          onClose={() => {
            setShowEventForm(false);
            setEditingEvent(null);
          }}
          onSave={() => {
            fetchEvents();
            setShowEventForm(false);
            setEditingEvent(null);
          }}
        />
      )}
    </div>
  );
}