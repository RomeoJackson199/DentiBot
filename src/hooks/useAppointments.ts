import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Appointment {
  id: string;
  patient_id: string;
  dentist_id: string;
  appointment_date: string;
  reason?: string;
  status: string;
  urgency: string;
  patient_name?: string;
  created_at: string;
  updated_at: string;
}

interface UseAppointmentsOptions {
  patientId?: string;
  dentistId?: string;
  includeUrgencyAssessments?: boolean;
}

export const useAppointments = ({ 
  patientId, 
  dentistId, 
  includeUrgencyAssessments = false 
}: UseAppointmentsOptions) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('appointments')
        .select(`
          *,
          ${includeUrgencyAssessments ? 'urgency_assessments (*)' : ''}
        `)
        .order('appointment_date', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      if (dentistId) {
        query = query.eq('dentist_id', dentistId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setAppointments(data || []);
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError(err.message || 'Failed to fetch appointments');
      toast({
        title: "Error",
        description: err.message || "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();

    // Set up real-time subscription
    const channelName = patientId 
      ? 'patient_appointments_changes' 
      : 'dentist_appointments_changes';

    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: patientId 
            ? `patient_id=eq.${patientId}` 
            : dentistId 
            ? `dentist_id=eq.${dentistId}` 
            : undefined
        },
        (payload) => {
          console.log('Appointment change detected:', payload);
          // Refresh appointments when changes occur
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [patientId, dentistId]);

  const refreshAppointments = () => {
    fetchAppointments();
  };

  return {
    appointments,
    loading,
    error,
    refreshAppointments
  };
};