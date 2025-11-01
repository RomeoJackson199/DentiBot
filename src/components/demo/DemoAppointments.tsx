import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";

export function DemoAppointments() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const times = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
  
  const appointments = {
    '9:00 AM-Monday': { patient: 'John Smith', type: 'Checkup' },
    '10:30 AM-Monday': { patient: 'Sarah Johnson', type: 'Cleaning' },
    '2:00 PM-Tuesday': { patient: 'Mike Davis', type: 'Filling' },
    '11:00 AM-Wednesday': { patient: 'Emma Wilson', type: 'Root Canal' },
    '3:00 PM-Thursday': { patient: 'David Brown', type: 'Consultation' },
    '9:00 AM-Friday': { patient: 'Lisa Anderson', type: 'Checkup' },
  };

  return (
    <div className="p-6 space-y-6" data-tour="appointments-section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointment Calendar</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage appointments</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Plus className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>

      {/* Calendar */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-6 gap-2 mb-4">
              <div className="p-3 font-semibold text-muted-foreground">Time</div>
              {days.map(day => (
                <div key={day} className="p-3 font-semibold text-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Time slots */}
            <div className="space-y-2">
              {times.map((time) => (
                <div key={time} className="grid grid-cols-6 gap-2">
                  <div className="p-3 text-sm text-muted-foreground bg-muted/30 rounded">
                    {time}
                  </div>
                  {days.map((day) => {
                    const key = `${time}-${day}`;
                    const apt = appointments[key as keyof typeof appointments];
                    
                    return (
                      <div
                        key={day}
                        className={`p-3 rounded border-2 border-dashed min-h-[70px] ${
                          apt
                            ? 'bg-blue-50 border-blue-300 cursor-pointer hover:bg-blue-100'
                            : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                        }`}
                      >
                        {apt && (
                          <div>
                            <div className="text-sm font-semibold text-blue-900">
                              {apt.patient}
                            </div>
                            <div className="text-xs text-blue-700">{apt.type}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
