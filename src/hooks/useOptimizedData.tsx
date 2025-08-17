import { useMemo } from 'react';

// Hook for memoized data filtering and sorting
export function useOptimizedAppointmentFiltering(
  appointments: any[],
  searchTerm: string,
  statusFilter?: string
) {
  return useMemo(() => {
    let filtered = appointments;

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(appointment =>
        appointment.patient_name?.toLowerCase().includes(search) ||
        appointment.reason?.toLowerCase().includes(search) ||
        appointment.status?.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === statusFilter);
    }

    // Sort by date
    return filtered.sort((a, b) =>
      new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
    );
  }, [appointments, searchTerm, statusFilter]);
}

// Hook for memoized statistics calculation
export function useAppointmentStats(appointments: any[]) {
  return useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    const pending = appointments.filter(a => a.status === 'pending').length;
    const cancelled = appointments.filter(a => a.status === 'cancelled').length;
    const highUrgency = appointments.filter(a => a.urgency === 'high').length;

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const todayCount = appointments.filter(a => {
      const date = new Date(a.appointment_date);
      return date >= startOfDay && date < endOfDay;
    }).length;

    const upcomingCount = appointments.filter(a => 
      new Date(a.appointment_date) > new Date() && a.status !== 'cancelled'
    ).length;

    return {
      total,
      completed,
      pending,
      cancelled,
      highUrgency,
      todayCount,
      upcomingCount
    };
  }, [appointments]);
}

// Hook for memoized inventory calculations
export function useInventoryStats(items: any[]) {
  return useMemo(() => {
    const total = items.length;
    const lowStock = items.filter(item => item.quantity < item.min_threshold).length;
    const outOfStock = items.filter(item => item.quantity === 0).length;
    const totalValue = items.reduce((sum, item) => 
      sum + (item.quantity * (item.cost_per_unit || 0)), 0
    );

    return {
      total,
      lowStock,
      outOfStock,
      totalValue
    };
  }, [items]);
}

// Hook for memoized patient data aggregation
export function usePatientAggregation(patients: any[], appointments: any[]) {
  return useMemo(() => {
    const appointmentsByPatient = new Map();
    
    appointments.forEach(appointment => {
      const patientId = appointment.patient_id;
      if (!appointmentsByPatient.has(patientId)) {
        appointmentsByPatient.set(patientId, []);
      }
      appointmentsByPatient.get(patientId).push(appointment);
    });

    return patients.map(patient => ({
      ...patient,
      appointmentCount: appointmentsByPatient.get(patient.id)?.length || 0,
      lastAppointment: appointmentsByPatient.get(patient.id)
        ?.sort((a: any, b: any) => 
          new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
        )[0]
    }));
  }, [patients, appointments]);
}