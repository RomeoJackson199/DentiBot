export interface Prescription {
  id: string;
  patient_id: string;
  dentist_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions?: string;
  prescribed_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  dentist?: {
    profile: {
      first_name: string;
      last_name: string;
    };
  };
}

export interface TreatmentPlan {
  id: string;
  patient_id: string;
  dentist_id: string;
  title?: string;
  description?: string;
  diagnosis?: string;
  estimated_cost?: number;
  estimated_duration?: string; // Make optional
  estimated_duration_weeks?: number;
  priority: string;
  status: string;
  start_date: string;
  end_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  dentist?: {
    profile: {
      first_name: string;
      last_name: string;
    };
  };
}

export interface TreatmentProcedure {
  id: string;
  treatment_plan_id: string;
  procedure_name: string;
  description?: string;
  cost?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date?: string;
  completed_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  dentist_id: string;
  record_type: string;
  title: string;
  description?: string;
  findings?: string;
  recommendations?: string;
  record_date: string;
  visit_date?: string; // Make optional to match database
  created_at: string;
  updated_at: string;
  dentist?: {
    profile: {
      first_name: string;
      last_name: string;
    };
  };
}

export interface PatientNote {
  id: string;
  patient_id: string;
  dentist_id: string;
  note_type: string;
  title: string;
  content: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppointmentFollowUp {
  id: string;
  appointment_id: string;
  follow_up_type: 'phone_call' | 'email' | 'sms' | 'in_person';
  status: 'pending' | 'completed' | 'cancelled';
  scheduled_date?: string;
  completed_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EnhancedPatient extends Patient {
  prescriptions: Prescription[];
  treatment_plans: TreatmentPlan[];
  medical_records: MedicalRecord[];
  patient_notes: PatientNote[];
  follow_ups: AppointmentFollowUp[];
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  medical_history?: string;
  address?: string;
  last_appointment?: string;
  total_appointments: number;
  upcoming_appointments: number;
}

export interface AppointmentWithSummary {
  id: string;
  appointment_date: string;
  status: string;
  reason?: string;
  consultation_notes?: string;
  ai_summary?: string;
  urgency?: string;
  patient_name?: string;
  follow_ups?: AppointmentFollowUp[];
}

export interface DentistProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialization?: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  dentist_id: string;
  appointment_date: string;
  duration: number;
  duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  urgency: string;
  urgency_level: string;
  reason?: string;
  notes?: string;
  patient_name?: string;
  created_at: string;
  updated_at: string;
  dentists?: {
    profile: {
      first_name: string;
      last_name: string;
    };
  };
}

export interface User {
  id: string;
  email: string;
}

export interface Dentist {
  id: string;
  specialization: string;
  profile: {
    first_name: string;
    last_name: string;
  };
}

export interface DentistRecommendation {
  id: string;
  name: string;
  rating: number;
}

export interface NewPrescriptionForm {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  expiry_date?: string;
}

export interface NewTreatmentPlanForm {
  title: string;
  description?: string;
  diagnosis?: string;
  treatment_goals: string[];
  procedures: string[];
  estimated_cost?: number;
  estimated_duration?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  target_completion_date?: string;
  notes?: string;
}

export interface NewMedicalRecordForm {
  record_type: 'examination' | 'xray' | 'lab_result' | 'consultation' | 'surgery' | 'other';
  title: string;
  description?: string;
  file_url?: string;
  record_date?: string;
}

export interface NewPatientNoteForm {
  note_type: 'general' | 'clinical' | 'billing' | 'follow_up' | 'emergency';
  title: string;
  content: string;
  is_private: boolean;
}

export interface NewFollowUpForm {
  follow_up_type: 'phone_call' | 'email' | 'sms' | 'in_person';
  scheduled_date?: string;
  notes?: string;
}