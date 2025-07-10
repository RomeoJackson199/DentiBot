import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  event_type: string;
}

interface CalendarEventFormProps {
  dentistId: string;
  event?: CalendarEvent | null;
  onClose: () => void;
  onSave: () => void;
}

export function CalendarEventForm({ dentistId, event, onClose, onSave }: CalendarEventFormProps) {
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [startDate, setStartDate] = useState(
    event ? format(new Date(event.start_datetime), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [startTime, setStartTime] = useState(
    event ? format(new Date(event.start_datetime), "HH:mm") : "09:00"
  );
  const [endTime, setEndTime] = useState(
    event ? format(new Date(event.end_datetime), "HH:mm") : "10:00"
  );
  const [eventType, setEventType] = useState<'blocked_time' | 'break' | 'personal'>(
    event?.event_type === 'appointment' ? 'blocked_time' : (event?.event_type as any) || 'blocked_time'
  );
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${startDate}T${endTime}`);

      if (endDateTime <= startDateTime) {
        throw new Error("End time must be after start time");
      }

      const eventData = {
        dentist_id: dentistId,
        title,
        description: description || null,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        event_type: eventType,
      };

      if (event) {
        // Update existing event
        const { error } = await supabase
          .from('calendar_events')
          .update(eventData)
          .eq('id', event.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Event updated successfully",
        });
      } else {
        // Create new event
        const { error } = await supabase
          .from('calendar_events')
          .insert(eventData);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Event created successfully",
        });
      }

      onSave();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save event",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{event ? 'Edit Event' : 'Add Event'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Event description (optional)"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="eventType">Event Type</Label>
              <Select value={eventType} onValueChange={(value: any) => setEventType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blocked_time">Blocked Time</SelectItem>
                  <SelectItem value="break">Break</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Saving..." : event ? "Update Event" : "Create Event"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}