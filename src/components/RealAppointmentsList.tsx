import { useState, useEffect, useCallback } from 'react';
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
  Plus,
  RefreshCw
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

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user profile first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .eq('user_id', user.id)
        .single();

      console.log('User ID:', user.id);
      console.log('Profile:', profile);
      console.log('Profile error:', profileError);

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('Unable to find your profile. Please ensure you are logged in.');
      }

      if (!profile) {
        throw new Error('Profile not found. Please complete your profile setup.');
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
          dentist_id
        `)
        .eq('patient_id', profile.id)
        .order('appointment_date', { ascending: false });

      console.log('Looking for appointments with patient_id:', profile.id);
      console.log('Appointments data:', appointmentsData);
      console.log('Appointments error:', appointmentsError);

      // Also check all appointments to see if any exist
      const { data: allAppointments, error: allError } = await supabase
        .from('appointments')
        .select('*')
        .limit(5);

      console.log('All appointments sample:', allAppointments);
      console.log('All appointments error:', allError);

      if (appointmentsError) {
        console.error('Appointments error:', appointmentsError);
        throw new Error('Failed to load appointments from database.');
      }

      // Ensure appointments data is properly formatted
      const formattedAppointments = (appointmentsData || []).map(apt => ({
        id: apt.id,
        appointment_date: apt.appointment_date || new Date().toISOString(),
        status: apt.status || 'scheduled',
        reason: apt.reason || 'Dental checkup',
        urgency: apt.urgency || 'low',
        notes: apt.notes,
        dentist: {
          id: apt.dentist_id,
          profile: {
            first_name: 'Dr.',
            last_name: 'Dentist',
            phone: null
          }
        }
      }));


      
      console.log('Raw appointments data:', appointmentsData);
      console.log('Formatted appointments:', formattedAppointments);
      
      setAppointments(formattedAppointments);
      
      // Show success message if appointments were loaded
      if (formattedAppointments.length > 0) {
        toast({
          title: "Success",
          description: `Loaded ${formattedAppointments.length} appointment${formattedAppointments.length !== 1 ? 's' : ''}`,
          variant: "default",
        });
      } else {
              console.log('No appointments found for patient:', profile.id);
    }
  } catch (err: any) {
    console.error('Error fetching appointments:', err);
    setError(err.message || 'Failed to load appointments');
    toast({
      title: "Error",
      description: err.message || "Failed to load your appointments. Please try again.",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
  }, [user.id, toast]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
      case 'scheduled':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
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
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date not available';
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Date not available';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Time not available';
      }
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Time not available';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">My Appointments</h2>
            <p className="text-dental-muted-foreground">Loading your appointments...</p>
          </div>
        </div>
        <div className="flex justify-center p-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-dental-primary" />
            <p className="text-dental-muted-foreground">Loading appointments...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">My Appointments</h2>
            <p className="text-dental-muted-foreground">Unable to load appointments</p>
          </div>
        </div>
        <Card className="glass-card border-0">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Appointments</h3>
            <p className="text-dental-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchAppointments} variant="outline" className="mr-2">
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()} variant="ghost">
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  
  console.log('Rendering appointments list. Length:', appointments.length);
  console.log('Appointments data:', appointments);
  
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
        <div className="flex items-center space-x-2">
          <Button 
            onClick={fetchAppointments} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={async () => {
              try {
                // Create a test appointment
                const { data: dentists } = await supabase
                  .from('dentists')
                  .select('id')
                  .limit(1);

                if (dentists && dentists.length > 0) {
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                  if (profile) {
                    const { data: appointment, error } = await supabase
                      .from('appointments')
                      .insert({
                        patient_id: profile.id,
                        dentist_id: dentists[0].id,
                        appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
                        status: 'pending',
                        urgency: 'medium',
                        reason: 'Test appointment'
                      })
                      .select()
                      .single();

                    if (error) {
                      console.error('Error creating test appointment:', error);
                    } else {
                      console.log('Created test appointment:', appointment);
                      fetchAppointments();
                    }
                  }
                }
              } catch (error) {
                console.error('Error creating test appointment:', error);
              }
            }}
            variant="outline"
            size="sm"
          >
            Create Test Appointment
          </Button>
          {onBookNew && (
            <Button onClick={onBookNew} className="bg-gradient-primary hover:bg-gradient-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Book New Appointment
            </Button>
          )}
        </div>
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
                        <h3 className="font-semibold text-lg">{apt.reason || 'Dental Appointment'}</h3>
                        <Badge className={getStatusColor(apt.status)}>
                          {apt.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-dental-muted-foreground mb-3">
                        {apt.dentist?.profile && (
                          <div className="flex items-center space-x-1">
                            <UserIcon className="h-4 w-4" />
                            <span>
                              Dr. {apt.dentist.profile.first_name || 'Unknown'} {apt.dentist.profile.last_name || 'Dentist'}
                            </span>
                          </div>
                        )}
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
                    {apt.dentist?.profile?.phone && (
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