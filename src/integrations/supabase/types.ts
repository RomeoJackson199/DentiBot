export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      appointment_slots: {
        Row: {
          appointment_id: string | null
          created_at: string
          dentist_id: string
          emergency_only: boolean | null
          id: string
          is_available: boolean
          slot_date: string
          slot_time: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          dentist_id: string
          emergency_only?: boolean | null
          id?: string
          is_available?: boolean
          slot_date: string
          slot_time: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          dentist_id?: string
          emergency_only?: boolean | null
          id?: string
          is_available?: boolean
          slot_date?: string
          slot_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          consultation_notes: string | null
          created_at: string
          dentist_id: string
          duration_minutes: number | null
          id: string
          is_for_user: boolean | null
          notes: string | null
          patient_age: number | null
          patient_id: string
          patient_name: string | null
          patient_relationship: string | null
          photo_url: string | null
          reason: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          updated_at: string
          urgency: Database["public"]["Enums"]["urgency_level"] | null
        }
        Insert: {
          appointment_date: string
          consultation_notes?: string | null
          created_at?: string
          dentist_id: string
          duration_minutes?: number | null
          id?: string
          is_for_user?: boolean | null
          notes?: string | null
          patient_age?: number | null
          patient_id: string
          patient_name?: string | null
          patient_relationship?: string | null
          photo_url?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"] | null
        }
        Update: {
          appointment_date?: string
          consultation_notes?: string | null
          created_at?: string
          dentist_id?: string
          duration_minutes?: number | null
          id?: string
          is_for_user?: boolean | null
          notes?: string | null
          patient_age?: number | null
          patient_id?: string
          patient_name?: string | null
          patient_relationship?: string | null
          photo_url?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"] | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          appointment_id: string | null
          created_at: string
          dentist_id: string
          description: string | null
          end_datetime: string
          event_type: string
          id: string
          is_recurring: boolean | null
          recurrence_pattern: Json | null
          start_datetime: string
          title: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          dentist_id: string
          description?: string | null
          end_datetime: string
          event_type?: string
          id?: string
          is_recurring?: boolean | null
          recurrence_pattern?: Json | null
          start_datetime: string
          title: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          dentist_id?: string
          description?: string | null
          end_datetime?: string
          event_type?: string
          id?: string
          is_recurring?: boolean | null
          recurrence_pattern?: Json | null
          start_datetime?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          is_bot: boolean | null
          message: string
          message_type: string | null
          metadata: Json | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_bot?: boolean | null
          message: string
          message_type?: string | null
          metadata?: Json | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_bot?: boolean | null
          message?: string
          message_type?: string | null
          metadata?: Json | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      dentist_availability: {
        Row: {
          break_end_time: string | null
          break_start_time: string | null
          created_at: string
          day_of_week: number
          dentist_id: string
          end_time: string
          id: string
          is_available: boolean | null
          start_time: string
          updated_at: string
        }
        Insert: {
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          day_of_week: number
          dentist_id: string
          end_time: string
          id?: string
          is_available?: boolean | null
          start_time: string
          updated_at?: string
        }
        Update: {
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          day_of_week?: number
          dentist_id?: string
          end_time?: string
          id?: string
          is_available?: boolean | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dentist_availability_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
        ]
      }
      dentist_schedules: {
        Row: {
          created_at: string
          day_of_week: number | null
          dentist_id: string
          end_time: string
          id: string
          is_available: boolean | null
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          dentist_id: string
          end_time: string
          id?: string
          is_available?: boolean | null
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          dentist_id?: string
          end_time?: string
          id?: string
          is_available?: boolean | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "dentist_schedules_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
        ]
      }
      dentists: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          license_number: string | null
          profile_id: string
          specialization: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          license_number?: string | null
          profile_id: string
          specialization?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          license_number?: string | null
          profile_id?: string
          specialization?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dentists_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          attachments: Json | null
          created_at: string
          dentist_id: string
          description: string | null
          findings: string | null
          id: string
          patient_id: string
          recommendations: string | null
          record_type: string
          title: string
          updated_at: string
          visit_date: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          dentist_id: string
          description?: string | null
          findings?: string | null
          id?: string
          patient_id: string
          recommendations?: string | null
          record_type?: string
          title: string
          updated_at?: string
          visit_date: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          dentist_id?: string
          description?: string | null
          findings?: string | null
          id?: string
          patient_id?: string
          recommendations?: string | null
          record_type?: string
          title?: string
          updated_at?: string
          visit_date?: string
        }
        Relationships: []
      }
      patient_documents: {
        Row: {
          created_at: string
          dentist_id: string
          document_name: string
          document_type: string
          file_size: number | null
          google_drive_file_id: string | null
          google_drive_url: string | null
          id: string
          is_synced: boolean | null
          last_synced_at: string | null
          medical_record_id: string | null
          mime_type: string | null
          patient_id: string
          treatment_plan_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dentist_id: string
          document_name: string
          document_type: string
          file_size?: number | null
          google_drive_file_id?: string | null
          google_drive_url?: string | null
          id?: string
          is_synced?: boolean | null
          last_synced_at?: string | null
          medical_record_id?: string | null
          mime_type?: string | null
          patient_id: string
          treatment_plan_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dentist_id?: string
          document_name?: string
          document_type?: string
          file_size?: number | null
          google_drive_file_id?: string | null
          google_drive_url?: string | null
          id?: string
          is_synced?: boolean | null
          last_synced_at?: string | null
          medical_record_id?: string | null
          mime_type?: string | null
          patient_id?: string
          treatment_plan_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          dentist_id: string
          dosage: string
          duration_days: number | null
          frequency: string
          id: string
          instructions: string | null
          medical_record_id: string | null
          medication_name: string
          patient_id: string
          prescribed_date: string
          status: string
          treatment_plan_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dentist_id: string
          dosage: string
          duration_days?: number | null
          frequency: string
          id?: string
          instructions?: string | null
          medical_record_id?: string | null
          medication_name: string
          patient_id: string
          prescribed_date?: string
          status?: string
          treatment_plan_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dentist_id?: string
          dosage?: string
          duration_days?: number | null
          frequency?: string
          id?: string
          instructions?: string | null
          medical_record_id?: string | null
          medication_name?: string
          patient_id?: string
          prescribed_date?: string
          status?: string
          treatment_plan_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          emergency_contact: string | null
          first_name: string
          id: string
          last_name: string
          medical_history: string | null
          phone: string | null
          preferred_language: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          emergency_contact?: string | null
          first_name: string
          id?: string
          last_name: string
          medical_history?: string | null
          phone?: string | null
          preferred_language?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          emergency_contact?: string | null
          first_name?: string
          id?: string
          last_name?: string
          medical_history?: string | null
          phone?: string | null
          preferred_language?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      treatment_plans: {
        Row: {
          created_at: string
          dentist_id: string
          description: string | null
          diagnosis: string | null
          end_date: string | null
          estimated_cost: number | null
          estimated_duration_weeks: number | null
          id: string
          notes: string | null
          patient_id: string
          priority: string
          start_date: string | null
          status: string
          title: string
          treatment_steps: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dentist_id: string
          description?: string | null
          diagnosis?: string | null
          end_date?: string | null
          estimated_cost?: number | null
          estimated_duration_weeks?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          priority?: string
          start_date?: string | null
          status?: string
          title: string
          treatment_steps?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dentist_id?: string
          description?: string | null
          diagnosis?: string | null
          end_date?: string | null
          estimated_cost?: number | null
          estimated_duration_weeks?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          priority?: string
          start_date?: string | null
          status?: string
          title?: string
          treatment_steps?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      urgency_assessments: {
        Row: {
          appointment_id: string
          assessment_score: number | null
          calculated_urgency:
            | Database["public"]["Enums"]["urgency_level"]
            | null
          created_at: string
          duration_symptoms: string | null
          has_bleeding: boolean | null
          has_swelling: boolean | null
          id: string
          pain_level: number | null
        }
        Insert: {
          appointment_id: string
          assessment_score?: number | null
          calculated_urgency?:
            | Database["public"]["Enums"]["urgency_level"]
            | null
          created_at?: string
          duration_symptoms?: string | null
          has_bleeding?: boolean | null
          has_swelling?: boolean | null
          id?: string
          pain_level?: number | null
        }
        Update: {
          appointment_id?: string
          assessment_score?: number | null
          calculated_urgency?:
            | Database["public"]["Enums"]["urgency_level"]
            | null
          created_at?: string
          duration_symptoms?: string | null
          has_bleeding?: boolean | null
          has_swelling?: boolean | null
          id?: string
          pain_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "urgency_assessments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_appointment_slot: {
        Args: {
          p_dentist_id: string
          p_slot_date: string
          p_slot_time: string
          p_appointment_id: string
        }
        Returns: boolean
      }
      cancel_appointment: {
        Args: { appointment_id: string; user_id: string }
        Returns: boolean
      }
      generate_daily_slots: {
        Args: { p_dentist_id: string; p_date: string }
        Returns: undefined
      }
      release_appointment_slot: {
        Args: { p_appointment_id: string }
        Returns: boolean
      }
    }
    Enums: {
      appointment_status: "pending" | "confirmed" | "completed" | "cancelled"
      urgency_level: "low" | "medium" | "high" | "emergency"
      user_role: "patient" | "dentist" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_status: ["pending", "confirmed", "completed", "cancelled"],
      urgency_level: ["low", "medium", "high", "emergency"],
      user_role: ["patient", "dentist", "admin"],
    },
  },
} as const
