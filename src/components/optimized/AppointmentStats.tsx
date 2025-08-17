import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface Appointment {
  id: string;
  status: string;
  urgency: string;
  appointment_date: string;
}

interface AppointmentStatsProps {
  appointments: Appointment[];
}

export const AppointmentStats = React.memo<AppointmentStatsProps>(({ appointments }) => {
  const stats = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    const upcoming = appointments.filter(a => 
      new Date(a.appointment_date) > new Date() && a.status !== 'cancelled'
    ).length;
    const highPriority = appointments.filter(a => a.urgency === 'high').length;

    return { total, completed, upcoming, highPriority };
  }, [appointments]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-dental-primary">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Appointments</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
          <div className="text-sm text-muted-foreground">Upcoming</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.highPriority}</div>
          <div className="text-sm text-muted-foreground">High Priority</div>
        </CardContent>
      </Card>
    </div>
  );
});

AppointmentStats.displayName = 'AppointmentStats';