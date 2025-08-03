import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AppointmentAPI } from '@/lib/api';
import { 
  Calendar, 
  User, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

interface AppointmentIntegrationTestProps {
  patientId?: string;
  dentistId?: string;
}

export const AppointmentIntegrationTest = ({ 
  patientId, 
  dentistId 
}: AppointmentIntegrationTestProps) => {
  const [testAppointments, setTestAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createTestAppointment = async () => {
    if (!patientId || !dentistId) {
      toast({
        title: "Error",
        description: "Patient ID and Dentist ID are required for testing",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create a test appointment for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0); // 10:00 AM

      const result = await AppointmentAPI.createAppointment({
        patient_id: patientId,
        dentist_id: dentistId,
        appointment_date: tomorrow.toISOString(),
        reason: "Test appointment for integration verification",
        status: "confirmed",
        urgency: "medium",
        patient_name: "Test Patient"
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Test appointment created successfully",
        });
        fetchTestAppointments();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error creating test appointment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create test appointment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTestAppointments = async () => {
    setLoading(true);
    try {
      let result;
      if (patientId) {
        result = await AppointmentAPI.getPatientAppointments(patientId, dentistId);
      } else if (dentistId) {
        result = await AppointmentAPI.getDentistAppointments(dentistId);
      } else {
        throw new Error("No patient or dentist ID provided");
      }

      if (result.success) {
        setTestAppointments(result.data || []);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error fetching test appointments:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch appointments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearTestAppointments = async () => {
    setLoading(true);
    try {
      // Delete test appointments
      for (const appointment of testAppointments) {
        if (appointment.reason?.includes('Test appointment')) {
          await AppointmentAPI.deleteAppointment(appointment.id);
        }
      }
      
      toast({
        title: "Success",
        description: "Test appointments cleared",
      });
      setTestAppointments([]);
    } catch (error: any) {
      console.error('Error clearing test appointments:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to clear test appointments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <span>Appointment Integration Test</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test appointment creation and real-time updates
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={createTestAppointment}
            disabled={loading || !patientId || !dentistId}
            className="flex items-center space-x-2"
          >
            <Calendar className="h-4 w-4" />
            <span>Create Test Appointment</span>
          </Button>
          
          <Button 
            onClick={fetchTestAppointments}
            disabled={loading}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Appointments</span>
          </Button>
          
          <Button 
            onClick={clearTestAppointments}
            disabled={loading || testAppointments.length === 0}
            variant="destructive"
            className="flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>Clear Test Data</span>
          </Button>
        </div>

        {testAppointments.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Test Appointments ({testAppointments.length})</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {testAppointments.map((appointment) => (
                <div 
                  key={appointment.id} 
                  className="p-3 border rounded-lg bg-muted/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">
                        {appointment.patient_name || 'Unknown Patient'}
                      </span>
                    </div>
                    <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                      {appointment.status}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(appointment.appointment_date), 'PPP p')}
                      </span>
                    </div>
                    {appointment.reason && (
                      <div className="mt-1">
                        <span className="font-medium">Reason:</span> {appointment.reason}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p><strong>Patient ID:</strong> {patientId || 'Not provided'}</p>
          <p><strong>Dentist ID:</strong> {dentistId || 'Not provided'}</p>
        </div>
      </CardContent>
    </Card>
  );
};