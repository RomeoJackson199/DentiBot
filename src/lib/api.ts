import { supabase } from '@/integrations/supabase/client';

export interface AppointmentData {
  id?: string;
  patient_id: string;
  dentist_id: string;
  appointment_date: string;
  reason?: string;
  status?: string;
  urgency?: string;
  patient_name?: string;
  duration_minutes?: number;
  notes?: string;
  consultation_notes?: string;
}

export interface AppointmentResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class AppointmentAPI {
  // Create a new appointment
  static async createAppointment(appointmentData: AppointmentData): Promise<AppointmentResponse> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      return {
        success: false,
        error: error.message || 'Failed to create appointment'
      };
    }
  }

  // Get appointments for a patient
  static async getPatientAppointments(patientId: string, dentistId?: string): Promise<AppointmentResponse> {
    try {
      let query = supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false });

      if (dentistId) {
        query = query.eq('dentist_id', dentistId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error: any) {
      console.error('Error fetching patient appointments:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch appointments'
      };
    }
  }

  // Get appointments for a dentist
  static async getDentistAppointments(dentistId: string, includeUrgencyAssessments = false): Promise<AppointmentResponse> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          ${includeUrgencyAssessments ? 'urgency_assessments (*)' : ''}
        `)
        .eq('dentist_id', dentistId)
        .order('appointment_date', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error: any) {
      console.error('Error fetching dentist appointments:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch appointments'
      };
    }
  }

  // Update appointment
  static async updateAppointment(appointmentId: string, updates: Partial<AppointmentData>): Promise<AppointmentResponse> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      return {
        success: false,
        error: error.message || 'Failed to update appointment'
      };
    }
  }

  // Delete appointment
  static async deleteAppointment(appointmentId: string): Promise<AppointmentResponse> {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      return {
        success: true
      };
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete appointment'
      };
    }
  }

  // Get appointment by ID
  static async getAppointmentById(appointmentId: string): Promise<AppointmentResponse> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error: any) {
      console.error('Error fetching appointment:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch appointment'
      };
    }
  }
}