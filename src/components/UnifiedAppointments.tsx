import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AppointmentBookingWithAuth } from '@/components/AppointmentBookingWithAuth';
import { AppointmentCompletionDialog } from '@/components/appointment/AppointmentCompletionDialog';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Plus,
  Filter,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Appointment {
  id: string;
  patient_id: string;
  dentist_id: string;
  appointment_date: string;
  reason?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  urgency: 'low' | 'medium' | 'high';
  duration_minutes?: number;
  notes?: string;
  patient_name?: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
}

interface UnifiedAppointmentsProps {
  viewMode?: 'dentist' | 'patient';
  dentistId?: string;
  patientId?: string;
  showBooking?: boolean;
}

export function UnifiedAppointments({ 
  viewMode = 'patient', 
  dentistId, 
  patientId,
  showBooking = true 
}: UnifiedAppointmentsProps) {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch appointments
  useEffect(() => {
    fetchAppointments();
  }, [viewMode, dentistId, patientId]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('appointments')
        .select(`
          *,
          profiles:patient_id (
            first_name,
            last_name,
            email,
            phone
          )
        `);

      if (viewMode === 'dentist' && dentistId) {
        query = query.eq('dentist_id', dentistId);
      } else if (viewMode === 'patient' && patientId) {
        query = query.eq('patient_id', patientId);
      }

      query = query.order('appointment_date', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      apt.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${apt.profiles?.first_name} ${apt.profiles?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const handleCompleteAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCompletionDialog(true);
  };

  const handleReschedule = async (appointmentId: string) => {
    // Implementation for rescheduling
    toast({
      title: "Reschedule",
      description: "Rescheduling feature coming soon",
    });
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Appointment Cancelled",
        description: "The appointment has been cancelled successfully.",
      });
      
      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary' as const },
      confirmed: { label: 'Confirmed', variant: 'default' as const },
      completed: { label: 'Completed', variant: 'success' as const },
      cancelled: { label: 'Cancelled', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            {viewMode === 'dentist' ? 'Patient Appointments' : 'My Appointments'}
          </h2>
          <p className="text-muted-foreground">
            {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {showBooking && (
          <Button onClick={() => setShowBookingDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Book Appointment
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Appointments</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No appointments found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Get started by booking your first appointment'}
              </p>
              {showBooking && (!searchTerm && filterStatus === 'all') && (
                <Button onClick={() => setShowBookingDialog(true)}>
                  Book Appointment
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredAppointments.map((appointment) => (
            <Card key={appointment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  {/* Main Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(appointment.appointment_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {new Date(appointment.appointment_date).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      {getStatusBadge(appointment.status)}
                      <Badge variant="outline" className={getUrgencyColor(appointment.urgency)}>
                        {appointment.urgency} priority
                      </Badge>
                    </div>

                    {viewMode === 'dentist' && appointment.profiles && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {appointment.profiles.first_name} {appointment.profiles.last_name}
                        </span>
                        {appointment.profiles.phone && (
                          <>
                            <Phone className="h-4 w-4 text-muted-foreground ml-4" />
                            <span>{appointment.profiles.phone}</span>
                          </>
                        )}
                      </div>
                    )}

                    {appointment.reason && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Reason:</strong> {appointment.reason}
                      </div>
                    )}

                    {appointment.notes && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {appointment.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {appointment.status === 'confirmed' && viewMode === 'dentist' && (
                      <Button 
                        onClick={() => handleCompleteAppointment(appointment)}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Complete
                      </Button>
                    )}
                    
                    {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleReschedule(appointment.id)}
                          className="flex items-center gap-2"
                        >
                          <Edit3 className="h-4 w-4" />
                          Reschedule
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCancel(appointment.id)}
                          className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialogs */}
      <AppointmentBookingWithAuth
        open={showBookingDialog}
        onOpenChange={setShowBookingDialog}
        onBookingComplete={fetchAppointments}
      />

      {selectedAppointment && (
        <AppointmentCompletionDialog
          open={showCompletionDialog}
          onOpenChange={setShowCompletionDialog}
          appointment={selectedAppointment}
          onCompleted={() => {
            fetchAppointments();
            setShowCompletionDialog(false);
            setSelectedAppointment(null);
          }}
        />
      )}
    </div>
  );
}
