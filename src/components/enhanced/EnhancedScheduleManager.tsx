import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Coffee, Save, Eye, EyeOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { logger } from '@/lib/logger';

interface DaySchedule {
  id?: string;
  day_of_week: number;
  is_available: boolean;
  start_time: string;
  end_time: string;
  break_start_time?: string;
  break_end_time?: string;
}

interface Props {
  dentistId: string;
}

const DAYS = [
  { value: 1, label: 'monday' },
  { value: 2, label: 'tuesday' },
  { value: 3, label: 'wednesday' },
  { value: 4, label: 'thursday' },
  { value: 5, label: 'friday' },
  { value: 6, label: 'saturday' },
  { value: 0, label: 'sunday' },
];

export function EnhancedScheduleManager({ dentistId }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showBreaks, setShowBreaks] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, [dentistId]);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('dentist_availability')
        .select('*')
        .eq('dentist_id', dentistId);

      if (error) throw error;

      // Initialize with default schedules if none exist
      if (!data || data.length === 0) {
        const defaultSchedules = DAYS.map(day => ({
          day_of_week: day.value,
          is_available: day.value >= 1 && day.value <= 5, // Mon-Fri
          start_time: '09:00',
          end_time: '17:00',
          break_start_time: '12:00',
          break_end_time: '13:00',
        }));
        setSchedules(defaultSchedules);
      } else {
        setSchedules(data);
      }
    } catch (error) {
      console.error('Failed to load schedule:', error);
      toast({
        title: t.error,
        description: t.failedToLoadAvailability,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSchedule = (dayIndex: number, field: keyof DaySchedule, value: any) => {
    setSchedules(prev => {
      const newSchedules = [...prev];
      newSchedules[dayIndex] = { ...newSchedules[dayIndex], [field]: value };
      return newSchedules;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing schedules
      await supabase
        .from('dentist_availability')
        .delete()
        .eq('dentist_id', dentistId);

      // Insert new schedules
      const { error } = await supabase
        .from('dentist_availability')
        .insert(
          schedules.map(s => ({
            ...s,
            dentist_id: dentistId,
          }))
        );

      if (error) throw error;

      toast({
        title: t.success,
        description: t.availabilityUpdated,
      });
    } catch (error) {
      console.error('Failed to save schedule:', error);
      toast({
        title: t.error,
        description: t.failedToSaveAvailability,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const copyToAllDays = (sourceIndex: number) => {
    const source = schedules[sourceIndex];
    setSchedules(prev =>
      prev.map(s => ({
        ...s,
        start_time: source.start_time,
        end_time: source.end_time,
        break_start_time: source.break_start_time,
        break_end_time: source.break_end_time,
      }))
    );
    toast({
      title: t.success,
      description: "Schedule copied to all days",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">{t.loading}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t.weeklyAvailability}
              </CardTitle>
              <CardDescription>
                Configure your working hours for each day of the week
              </CardDescription>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBreaks(!showBreaks)}
                >
                  {showBreaks ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showBreaks ? 'Hide' : 'Show'} Breaks
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle break time visibility</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((day, index) => {
            const schedule = schedules.find(s => s.day_of_week === day.value) || schedules[index];
            if (!schedule) return null;

            return (
              <div key={day.value} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={schedule.is_available}
                      onCheckedChange={(checked) =>
                        updateSchedule(index, 'is_available', checked)
                      }
                    />
                    <Label className="text-base font-medium capitalize">
                      {t[day.label as keyof typeof t] as string}
                    </Label>
                    {!schedule.is_available && (
                      <Badge variant="secondary">Closed</Badge>
                    )}
                  </div>
                  {schedule.is_available && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToAllDays(index)}
                        >
                          Copy to all
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy these hours to all days</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {schedule.is_available && (
                  <div className="pl-12 space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 flex-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm">{t.workingHours}</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={schedule.start_time}
                          onChange={(e) =>
                            updateSchedule(index, 'start_time', e.target.value)
                          }
                          className="w-32"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={schedule.end_time}
                          onChange={(e) =>
                            updateSchedule(index, 'end_time', e.target.value)
                          }
                          className="w-32"
                        />
                      </div>
                    </div>

                    {showBreaks && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 flex-1">
                          <Coffee className="h-4 w-4 text-muted-foreground" />
                          <Label className="text-sm">{t.breakTime}</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={schedule.break_start_time || ''}
                            onChange={(e) =>
                              updateSchedule(index, 'break_start_time', e.target.value)
                            }
                            className="w-32"
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="time"
                            value={schedule.break_end_time || ''}
                            onChange={(e) =>
                              updateSchedule(index, 'break_end_time', e.target.value)
                            }
                            className="w-32"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {index < DAYS.length - 1 && <Separator />}
              </div>
            );
          })}

          <div className="pt-4">
            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : t.saveAvailability}
            </Button>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
