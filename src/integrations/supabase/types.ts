export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      dentists: {
        Row: {
          id: string;
          profile_id: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      prescriptions: {
        Row: {
          id: string;
          patient_id: string;
          dentist_id: string;
          medication_name: string;
          dosage: string;
          frequency: string;
          duration: string;
          instructions?: string;
          prescribed_date: string;
          expiry_date?: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          dentist_id: string;
          medication_name: string;
          dosage: string;
          frequency: string;
          duration: string;
          instructions?: string;
          prescribed_date?: string;
          expiry_date?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          dentist_id?: string;
          medication_name?: string;
          dosage?: string;
          frequency?: string;
          duration?: string;
          instructions?: string;
          prescribed_date?: string;
          expiry_date?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      treatment_plans: {
        Row: {
          id: string;
          patient_id: string;
          dentist_id: string;
          plan_name: string;
          description?: string;
          diagnosis?: string;
          treatment_goals: string[];
          procedures: string[];
          estimated_cost?: number;
          estimated_duration?: string;
          priority: string;
          status: string;
          start_date: string;
          target_completion_date?: string;
          actual_completion_date?: string;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          dentist_id: string;
          plan_name: string;
          description?: string;
          diagnosis?: string;
          treatment_goals: string[];
          procedures: string[];
          estimated_cost?: number;
          estimated_duration?: string;
          priority?: string;
          status?: string;
          start_date?: string;
          target_completion_date?: string;
          actual_completion_date?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          dentist_id?: string;
          plan_name?: string;
          description?: string;
          diagnosis?: string;
          treatment_goals?: string[];
          procedures?: string[];
          estimated_cost?: number;
          estimated_duration?: string;
          priority?: string;
          status?: string;
          start_date?: string;
          target_completion_date?: string;
          actual_completion_date?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      patient_notes: {
        Row: {
          id: string;
          patient_id: string;
          dentist_id: string;
          note_type: string;
          title: string;
          content: string;
          is_private: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          dentist_id: string;
          note_type?: string;
          title: string;
          content: string;
          is_private?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          dentist_id?: string;
          note_type?: string;
          title?: string;
          content?: string;
          is_private?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      medical_records: {
        Row: {
          id: string;
          patient_id: string;
          dentist_id: string;
          record_type: string;
          title: string;
          description?: string;
          file_url?: string;
          record_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          dentist_id: string;
          record_type: string;
          title: string;
          description?: string;
          file_url?: string;
          record_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          dentist_id?: string;
          record_type?: string;
          title?: string;
          description?: string;
          file_url?: string;
          record_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};