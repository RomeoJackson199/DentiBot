import { useState, useEffect } from "react";
import { Clock, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DentistAvailability {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  break_start_time?: string;
  break_end_time?: string;
}

interface AvailabilitySettingsProps {
  dentistId: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

export function AvailabilitySettings({ dentistId }: AvailabilitySettingsProps) {
  const [availability, setAvailability] = useState<DentistAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailability();
  }, [dentistId]);

  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('dentist_availability')
        .select('*')
        .eq('dentist_id', dentistId)
        .order('day_of_week');

      if (error) throw error;

      // Initialize with default availability for all days
      const defaultAvailability = DAYS_OF_WEEK.map(day => {
        const existing = data?.find(a => a.day_of_week === day.value);
        return existing || {
          day_of_week: day.value,
          start_time: '09:00',
          end_time: '17:00',
          is_available: day.value >= 1 && day.value <= 5, // Mon-Fri by default
          break_start_time: '12:00',
          break_end_time: '13:00',
        };
      });

      setAvailability(defaultAvailability);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch availability settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = (dayIndex: number, field: keyof DentistAvailability, value: any) => {
    setAvailability(prev => 
      prev.map((day, index) => 
        index === dayIndex ? { ...day, [field]: value } : day
      )
    );
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      // Delete existing availability for this dentist
      await supabase
        .from('dentist_availability')
        .delete()
        .eq('dentist_id', dentistId);

      // Insert new availability settings
      const availabilityData = availability
        .filter(day => day.is_available)
        .map(day => ({
          dentist_id: dentistId,
          day_of_week: day.day_of_week,
          start_time: day.start_time,
          end_time: day.end_time,
          is_available: day.is_available,
          break_start_time: day.break_start_time || null,
          break_end_time: day.break_end_time || null,
        }));

      if (availabilityData.length > 0) {
        const { error } = await supabase
          .from('dentist_availability')
          .insert(availabilityData);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Availability settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save availability settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading availability settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Clock className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Availability Settings</h2>
        </div>
        <Button onClick={saveAvailability} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {DAYS_OF_WEEK.map((day, index) => {
            const dayAvailability = availability[index];
            
            return (
              <div key={day.value} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-medium">{day.label}</Label>
                  <Switch
                    checked={dayAvailability.is_available}
                    onCheckedChange={(checked) => 
                      updateAvailability(index, 'is_available', checked)
                    }
                  />
                </div>

                {dayAvailability.is_available && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor={`start-${day.value}`}>Start Time</Label>
                      <Input
                        id={`start-${day.value}`}
                        type="time"
                        value={dayAvailability.start_time}
                        onChange={(e) => 
                          updateAvailability(index, 'start_time', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`end-${day.value}`}>End Time</Label>
                      <Input
                        id={`end-${day.value}`}
                        type="time"
                        value={dayAvailability.end_time}
                        onChange={(e) => 
                          updateAvailability(index, 'end_time', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`break-start-${day.value}`}>Break Start</Label>
                      <Input
                        id={`break-start-${day.value}`}
                        type="time"
                        value={dayAvailability.break_start_time || ''}
                        onChange={(e) => 
                          updateAvailability(index, 'break_start_time', e.target.value || null)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`break-end-${day.value}`}>Break End</Label>
                      <Input
                        id={`break-end-${day.value}`}
                        type="time"
                        value={dayAvailability.break_end_time || ''}
                        onChange={(e) => 
                          updateAvailability(index, 'break_end_time', e.target.value || null)
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
