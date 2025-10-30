import type { FC } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Appointment } from '../types';

interface AppointmentListProps {
  appointments: Appointment[];
  title: string;
}

export const AppointmentList: FC<AppointmentListProps> = ({ appointments, title }) => {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-slate-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {appointments.length === 0 && <p className="text-sm text-slate-500">No appointments scheduled.</p>}
        {appointments.map((appointment) => (
          <div key={appointment.id} className="flex flex-col justify-between gap-3 rounded-xl border p-4 md:flex-row md:items-center">
            <div>
              <p className="font-medium text-slate-700">{appointment.service.title}</p>
              <p className="text-sm text-slate-500">
                {format(new Date(appointment.startTime), 'PPpp')} · {format(new Date(appointment.endTime), 'p')}
              </p>
              <p className="text-xs text-slate-400">
                {appointment.client ? `Client: ${appointment.client.name}` : `Professional: ${appointment.professional?.name ?? ''}`}
              </p>
            </div>
            <Badge className="bg-teal-100 text-teal-700">{appointment.status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
