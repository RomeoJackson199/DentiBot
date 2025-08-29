import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { utcToClinicTime } from '@/lib/timezone';

export interface Appointment {
  id: string;
  patient_id: string;
  dentist_id: string;
  appointment_date: string;
  reason: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  urgency: 'low' | 'medium' | 'high';
  patient_name?: string;
  duration_minutes?: number;
  created_at: string;
  updated_at: string;
  
  // Related data
  patient?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  dentist?: {
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

export interface AppointmentCounts {
  today: number;
  upcoming: number;
  completed: number;
  total: number;
}

interface UseAppointmentsParams {
  role: 'patient' | 'dentist';
  userId?: string;
  dentistId?: string;
  patientId?: string;
  status?: string[];
  fromDate?: Date;
  toDate?: Date;
  autoRefresh?: boolean;
}

interface UseAppointmentsReturn {
  appointments: Appointment[];
  counts: AppointmentCounts;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
}

export function useAppointments(params: UseAppointmentsParams): UseAppointmentsReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [counts, setCounts] = useState<AppointmentCounts>({
    today: 0,
    upcoming: 0,
    completed: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const calculateCounts = (appointmentsList: Appointment[]): AppointmentCounts => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    return {
      today: appointmentsList.filter(apt => {
        const aptDate = utcToClinicTime(new Date(apt.appointment_date));
        return aptDate >= today && aptDate < tomorrow && apt.status !== 'cancelled';
      }).length,
      upcoming: appointmentsList.filter(apt => {
        const aptDate = utcToClinicTime(new Date(apt.appointment_date));
        return aptDate >= now && apt.status !== 'cancelled' && apt.status !== 'completed';
      }).length,
      completed: appointmentsList.filter(apt => apt.status === 'completed').length,
      total: appointmentsList.length
    };
  };

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:profiles!appointments_patient_id_fkey(
            first_name,
            last_name,
            email,
            phone
          ),
          dentist:dentists!appointments_dentist_id_fkey(
            profiles(
              first_name,
              last_name
            )
          )
        `);

      // Apply filters based on role and parameters
      if (params.role === 'patient' && params.patientId) {
        query = query.eq('patient_id', params.patientId);
      } else if (params.role === 'dentist' && params.dentistId) {
        query = query.eq('dentist_id', params.dentistId);
      }

      if (params.status && params.status.length > 0) {
        query = query.in('status', params.status as ('pending' | 'confirmed' | 'cancelled' | 'completed')[]);
      }

      if (params.fromDate) {
        query = query.gte('appointment_date', params.fromDate.toISOString());
      }

      if (params.toDate) {
        query = query.lte('appointment_date', params.toDate.toISOString());
      }

      query = query.order('appointment_date', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      const appointmentsList = (data || []) as Appointment[];
      setAppointments(appointmentsList);
      setCounts(calculateCounts(appointmentsList));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch appointments';
      setError(errorMessage);
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [params]);

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Optimistically update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === id ? { ...apt, ...updates } : apt
        )
      );

      // Recalculate counts
      const updatedAppointments = appointments.map(apt => 
        apt.id === id ? { ...apt, ...updates } : apt
      );
      setCounts(calculateCounts(updatedAppointments));

      toast({
        title: "Success",
        description: "Appointment updated successfully",
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update appointment';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const refetch = useCallback(async () => {
    await fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!params.autoRefresh) return;

    const interval = setInterval(() => {
      fetchAppointments();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [params.autoRefresh, fetchAppointments]);

  // Real-time subscriptions for appointments
  useEffect(() => {
    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: params.dentistId 
            ? `dentist_id=eq.${params.dentistId}`
            : params.patientId 
            ? `patient_id=eq.${params.patientId}`
            : undefined
        },
        () => {
          // Refetch data when changes occur
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.dentistId, params.patientId, fetchAppointments]);

  return {
    appointments,
    counts,
    loading,
    error,
    refetch,
    updateAppointment
  };
}