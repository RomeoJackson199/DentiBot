import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  User as UserIcon,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  reason: string;
  urgency: string;
  notes?: string;
  dentist: {
    id: string;
    profile: {
      first_name: string;
      last_name: string;
      phone?: string;
    };
  };
}

interface RealAppointmentsListProps {
  user: User;
  onBookNew?: () => void;
}

export const RealAppointmentsList = ({ user, onBookNew }: RealAppointmentsListProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user profile first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Fetch appointments with dentist information
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          reason,
          urgency,
          notes,
          dentist:dentists(
            id,
            profile:profiles(first_name, last_name, phone)
          )
        `)
        .eq('patient_id', profile.id)
        .order('appointment_date', { ascending: false });

      if (appointmentsError) {
        throw appointmentsError;
      }

      setAppointments(appointmentsData || []);
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments');
      toast({
        title: "Error",
        description: "Failed to load your appointments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="glass-card border-0">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Appointments</h3>
          <p className="text-dental-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchAppointments} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with booking button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Appointments</h2>
          <p className="text-dental-muted-foreground">
            {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} found
          </p>
        </div>
        {onBookNew && (
          <Button onClick={onBookNew} className="bg-gradient-primary hover:bg-gradient-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Book New Appointment
          </Button>
        )}
      </div>

      {appointments.length === 0 ? (
        <Card className="glass-card border-0">
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-dental-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Appointments Found</h3>
            <p className="text-dental-muted-foreground mb-4">
              You don't have any appointments scheduled yet.
            </p>
            {onBookNew && (
              <Button onClick={onBookNew} variant="outline">
                Book Your First Appointment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <Card key={apt.id} className="glass-card border-0 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(apt.status)}
                      <div className={`w-2 h-2 rounded-full ${getUrgencyColor(apt.urgency)}`}></div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{apt.reason}</h3>
                        <Badge className={getStatusColor(apt.status)}>
                          {apt.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-dental-muted-foreground mb-3">
                        <div className="flex items-center space-x-1">
                          <UserIcon className="h-4 w-4" />
                          <span>
                            Dr. {apt.dentist.profile.first_name} {apt.dentist.profile.last_name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(apt.appointment_date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(apt.appointment_date)}</span>
                        </div>
                      </div>
                      
                      {apt.notes && (
                        <p className="text-sm text-dental-muted-foreground bg-white/50 p-3 rounded-lg">
                          {apt.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <Badge variant="outline" className="capitalize">
                      {apt.urgency} priority
                    </Badge>
                    {apt.dentist.profile.phone && (
                      <Button variant="ghost" size="sm" className="text-xs">
                        Call Doctor
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RealAppointmentsList;