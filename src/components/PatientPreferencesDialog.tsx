import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Clock, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PatientPreferencesDialogProps {
  children: React.ReactNode;
}

export function PatientPreferencesDialog({ children }: PatientPreferencesDialogProps) {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState({
    preferredDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    },
    preferredTimes: {
      morning: true, // 8-12
      afternoon: true, // 12-17
      evening: false, // 17-20
    },
    reminderSettings: {
      emailReminders: true,
      smsReminders: true,
      reminderTiming: "24h", // 24h, 48h, 1week
    },
    appointmentPreferences: {
      preferredDentist: "",
      maxTravelDistance: "10", // km
      preferConsecutiveSlots: false,
    }
  });

  const handleSavePreferences = () => {
    // Here you would save preferences to the database
    console.log("Saving patient preferences:", preferences);
    
    toast({
      title: "Preferences Updated",
      description: "Your appointment preferences have been saved successfully.",
    });
  };

  const updateDayPreference = (day: keyof typeof preferences.preferredDays, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      preferredDays: {
        ...prev.preferredDays,
        [day]: value
      }
    }));
  };

  const updateTimePreference = (time: keyof typeof preferences.preferredTimes, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      preferredTimes: {
        ...prev.preferredTimes,
        [time]: value
      }
    }));
  };

  const updateReminderSetting = (setting: keyof typeof preferences.reminderSettings, value: any) => {
    setPreferences(prev => ({
      ...prev,
      reminderSettings: {
        ...prev.reminderSettings,
        [setting]: value
      }
    }));
  };

  const updateAppointmentPreference = (setting: keyof typeof preferences.appointmentPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      appointmentPreferences: {
        ...prev.appointmentPreferences,
        [setting]: value
      }
    }));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Patient Preferences
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Preferred Days */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Preferred Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(preferences.preferredDays).map(([day, enabled]) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Switch
                      id={day}
                      checked={enabled}
                      onCheckedChange={(checked) => updateDayPreference(day as keyof typeof preferences.preferredDays, checked)}
                    />
                    <Label htmlFor={day} className="capitalize">
                      {day}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preferred Times */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Preferred Times
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="morning">Morning (8:00 - 12:00)</Label>
                    <p className="text-sm text-muted-foreground">Early appointments</p>
                  </div>
                  <Switch
                    id="morning"
                    checked={preferences.preferredTimes.morning}
                    onCheckedChange={(checked) => updateTimePreference('morning', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="afternoon">Afternoon (12:00 - 17:00)</Label>
                    <p className="text-sm text-muted-foreground">Standard business hours</p>
                  </div>
                  <Switch
                    id="afternoon"
                    checked={preferences.preferredTimes.afternoon}
                    onCheckedChange={(checked) => updateTimePreference('afternoon', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="evening">Evening (17:00 - 20:00)</Label>
                    <p className="text-sm text-muted-foreground">After work hours</p>
                  </div>
                  <Switch
                    id="evening"
                    checked={preferences.preferredTimes.evening}
                    onCheckedChange={(checked) => updateTimePreference('evening', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reminder Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reminder Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-reminders">Email Reminders</Label>
                  <Switch
                    id="email-reminders"
                    checked={preferences.reminderSettings.emailReminders}
                    onCheckedChange={(checked) => updateReminderSetting('emailReminders', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-reminders">SMS Reminders</Label>
                  <Switch
                    id="sms-reminders"
                    checked={preferences.reminderSettings.smsReminders}
                    onCheckedChange={(checked) => updateReminderSetting('smsReminders', checked)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="reminder-timing">Reminder Timing</Label>
                  <Select
                    value={preferences.reminderSettings.reminderTiming}
                    onValueChange={(value) => updateReminderSetting('reminderTiming', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 hours before</SelectItem>
                      <SelectItem value="48h">48 hours before</SelectItem>
                      <SelectItem value="1week">1 week before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointment Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appointment Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="preferred-dentist">Preferred Dentist</Label>
                  <Select
                    value={preferences.appointmentPreferences.preferredDentist}
                    onValueChange={(value) => updateAppointmentPreference('preferredDentist', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select preferred dentist" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No preference</SelectItem>
                      <SelectItem value="dr-smith">Dr. Smith</SelectItem>
                      <SelectItem value="dr-johnson">Dr. Johnson</SelectItem>
                      <SelectItem value="dr-brown">Dr. Brown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="travel-distance">Maximum Travel Distance</Label>
                  <Select
                    value={preferences.appointmentPreferences.maxTravelDistance}
                    onValueChange={(value) => updateAppointmentPreference('maxTravelDistance', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 km</SelectItem>
                      <SelectItem value="10">10 km</SelectItem>
                      <SelectItem value="20">20 km</SelectItem>
                      <SelectItem value="50">50 km</SelectItem>
                      <SelectItem value="unlimited">No limit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="consecutive-slots">Prefer Consecutive Slots</Label>
                    <p className="text-sm text-muted-foreground">For multiple treatments</p>
                  </div>
                  <Switch
                    id="consecutive-slots"
                    checked={preferences.appointmentPreferences.preferConsecutiveSlots}
                    onCheckedChange={(checked) => updateAppointmentPreference('preferConsecutiveSlots', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />
          
          <div className="flex justify-end gap-3">
            <Button variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSavePreferences}>
              Save Preferences
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}