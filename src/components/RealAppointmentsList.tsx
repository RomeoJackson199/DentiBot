import { useState, useEffect, useCallback, useMemo } from 'react';
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
  RefreshCw,
  Phone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  reason: string;
  urgency: string;
  notes?: string;
  dentist?: {
    id: string;
    profile?: {
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
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchAppointments = useCallback(async () => {
    try {
      setError(null);

      // Get user profile first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('Unable to find your profile. Please ensure you are logged in.');
      }

      if (!profile) {
        throw new Error('Profile not found. Please complete your profile setup.');
      }

      // Fetch appointments with simplified query to avoid nested join issues
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

      if (appointmentsError) {
        console.error('Appointments error:', appointmentsError);
        throw new Error('Failed to load appointments from database.');
      }

      // Fetch dentist information separately to avoid complex joins
      const dentistIds = [...new Set((appointmentsData || []).map(apt => apt.dentist_id))];
      let dentistsData: any[] = [];
      
      if (dentistIds.length > 0) {
        const { data: dentists, error: dentistsError } = await supabase
          .from('dentists')
          .select(`
            id,
            profile:profiles(first_name, last_name, phone)
          `)
          .in('id', dentistIds);

        if (!dentistsError) {
          dentistsData = dentists || [];
        }
      }

      // Combine appointments with dentist data
      const formattedAppointments = (appointmentsData || []).map(apt => {
        const dentist = dentistsData.find(d => d.id === apt.dentist_id);
        return {
          ...apt,
          appointment_date: apt.appointment_date || new Date().toISOString(),
          status: apt.status || 'scheduled',
          reason: apt.reason || 'Dental checkup',
          urgency: apt.urgency || 'low',
          dentist: dentist || null
        };
      });

      setAppointments(formattedAppointments);
      
      // Show success message if appointments were loaded
      if (formattedAppointments.length > 0) {
        toast({
          title: "Success",
          description: `Loaded ${formattedAppointments.length} appointment${formattedAppointments.length !== 1 ? 's' : ''}`,
          variant: "default",
        });
      }
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError(err.message || 'Failed to load appointments');
      toast({
        title: "Error",
        description: err.message || "Failed to load your appointments. Please try again.",
        variant: "destructive",
      });
    }
  }, [user.id, toast]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  }, [fetchAppointments]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const getStatusIcon = useCallback((status: string) => {
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
  }, []);

  const getStatusColor = useCallback((status: string) => {
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
  }, []);

  const getUrgencyColor = useCallback((urgency: string) => {
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
  }, []);

  const formatDate = useCallback((dateString: string) => {
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
  }, []);

  const formatTime = useCallback((dateString: string) => {
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
  }, []);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const dateA = new Date(a.appointment_date).getTime();
      const dateB = new Date(b.appointment_date).getTime();
      return dateB - dateA; // Most recent first
    });
  }, [appointments]);

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
            <div className="flex justify-center space-x-2">
              <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()} variant="ghost">
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with booking button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Appointments</h2>
          <p className="text-dental-muted-foreground">
            {sortedAppointments.length} appointment{sortedAppointments.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {onBookNew && (
            <Button onClick={onBookNew} className="bg-gradient-primary hover:bg-gradient-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Book New Appointment
            </Button>
          )}
        </div>
      </div>

      {sortedAppointments.length === 0 ? (
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
          {sortedAppointments.map((apt) => (
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => window.open(`tel:${apt.dentist.profile.phone}`, '_blank')}
                      >
                        <Phone className="h-3 w-3 mr-1" />
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