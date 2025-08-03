import { useEffect, useState } from 'react';
import { getAppointmentsWithRetry, MockAppointment } from '@/lib/mockApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface Props {
  user?: unknown;
}

export const MockAppointmentsList = (_props: Props) => {
  const [appointments, setAppointments] = useState<MockAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await getAppointmentsWithRetry();
      if (error || !data) {
        setError('Failed to load appointments');
        setAppointments([]);
      } else {
        setError(null);
        setAppointments(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
    );
  }

  if (error) {
    return <p className="text-center p-4 text-red-600">{error}</p>;
  }

  if (appointments.length === 0) {
    return <p className="text-center p-4 text-muted-foreground">No upcoming appointments.</p>;
  }

  return (
    <div className="space-y-4">
      {appointments.map((apt) => (
        <Card key={apt.id}>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>{apt.reason}</span>
              <Badge>{apt.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{new Date(apt.appointment_date).toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">
              Dr. {apt.dentist.profile.first_name} {apt.dentist.profile.last_name}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MockAppointmentsList;
