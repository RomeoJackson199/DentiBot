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
    PostgrestVersion: "13.0.4"
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
          checked_in_at: string | null
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
          patient_status: string | null
          photo_url: string | null
          reason: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          treatment_completed_at: string | null
          treatment_started_at: string | null
          updated_at: string
          urgency: Database["public"]["Enums"]["urgency_level"] | null
        }
        Insert: {
          appointment_date: string
          checked_in_at?: string | null
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
          patient_status?: string | null
          photo_url?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          treatment_completed_at?: string | null
          treatment_started_at?: string | null
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"] | null
        }
        Update: {
          appointment_date?: string
          checked_in_at?: string | null
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
          patient_status?: string | null
          photo_url?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          treatment_completed_at?: string | null
          treatment_started_at?: string | null
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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string
        }
        Relationships: []
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
      communications: {
        Row: {
          communication_type: string
          created_at: string
          dentist_id: string
          id: string
          message: string
          patient_id: string | null
          sent_at: string | null
          status: string
          subject: string | null
        }
        Insert: {
          communication_type?: string
          created_at?: string
          dentist_id: string
          id?: string
          message: string
          patient_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
        }
        Update: {
          communication_type?: string
          created_at?: string
          dentist_id?: string
          id?: string
          message?: string
          patient_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: []
      }
      consents: {
        Row: {
          consent_text: string | null
          created_at: string
          id: string
          ip_address: string | null
          patient_id: string | null
          withdrawn_at: string | null
        }
        Insert: {
          consent_text?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          patient_id?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          consent_text?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          patient_id?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      dashboard_preferences: {
        Row: {
          created_at: string
          dentist_id: string
          id: string
          layout_config: Json | null
          notifications_enabled: boolean | null
          theme: string | null
          updated_at: string
          widget_positions: Json | null
        }
        Insert: {
          created_at?: string
          dentist_id: string
          id?: string
          layout_config?: Json | null
          notifications_enabled?: boolean | null
          theme?: string | null
          updated_at?: string
          widget_positions?: Json | null
        }
        Update: {
          created_at?: string
          dentist_id?: string
          id?: string
          layout_config?: Json | null
          notifications_enabled?: boolean | null
          theme?: string | null
          updated_at?: string
          widget_positions?: Json | null
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
      dentist_ratings: {
        Row: {
          appointment_id: string | null
          communication_rating: number | null
          created_at: string
          dentist_id: string
          expertise_rating: number | null
          id: string
          patient_id: string
          rating: number
          review: string | null
          updated_at: string
          wait_time_rating: number | null
        }
        Insert: {
          appointment_id?: string | null
          communication_rating?: number | null
          created_at?: string
          dentist_id: string
          expertise_rating?: number | null
          id?: string
          patient_id: string
          rating: number
          review?: string | null
          updated_at?: string
          wait_time_rating?: number | null
        }
        Update: {
          appointment_id?: string | null
          communication_rating?: number | null
          created_at?: string
          dentist_id?: string
          expertise_rating?: number | null
          id?: string
          patient_id?: string
          rating?: number
          review?: string | null
          updated_at?: string
          wait_time_rating?: number | null
        }
        Relationships: []
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
      dentist_tasks: {
        Row: {
          appointment_id: string | null
          assigned_to: string | null
          created_at: string
          dentist_id: string
          description: string | null
          due_date: string | null
          id: string
          patient_id: string | null
          priority: string
          status: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          assigned_to?: string | null
          created_at?: string
          dentist_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          patient_id?: string | null
          priority?: string
          status?: string
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          assigned_to?: string | null
          created_at?: string
          dentist_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          patient_id?: string | null
          priority?: string
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      dentist_vacation_days: {
        Row: {
          created_at: string
          dentist_id: string
          end_date: string
          id: string
          is_approved: boolean | null
          reason: string | null
          start_date: string
          updated_at: string
          vacation_type: string
        }
        Insert: {
          created_at?: string
          dentist_id: string
          end_date: string
          id?: string
          is_approved?: boolean | null
          reason?: string | null
          start_date: string
          updated_at?: string
          vacation_type?: string
        }
        Update: {
          created_at?: string
          dentist_id?: string
          end_date?: string
          id?: string
          is_approved?: boolean | null
          reason?: string | null
          start_date?: string
          updated_at?: string
          vacation_type?: string
        }
        Relationships: []
      }
      dentists: {
        Row: {
          average_rating: number | null
          clinic_address: string | null
          communication_score: number | null
          created_at: string
          expertise_score: number | null
          id: string
          is_active: boolean | null
          languages: string[] | null
          license_number: string | null
          profile_id: string
          specialization: string | null
          total_ratings: number | null
          updated_at: string
          wait_time_score: number | null
        }
        Insert: {
          average_rating?: number | null
          clinic_address?: string | null
          communication_score?: number | null
          created_at?: string
          expertise_score?: number | null
          id?: string
          is_active?: boolean | null
          languages?: string[] | null
          license_number?: string | null
          profile_id: string
          specialization?: string | null
          total_ratings?: number | null
          updated_at?: string
          wait_time_score?: number | null
        }
        Update: {
          average_rating?: number | null
          clinic_address?: string | null
          communication_score?: number | null
          created_at?: string
          expertise_score?: number | null
          id?: string
          is_active?: boolean | null
          languages?: string[] | null
          license_number?: string | null
          profile_id?: string
          specialization?: string | null
          total_ratings?: number | null
          updated_at?: string
          wait_time_score?: number | null
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
          dentist_id: string | null
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
          dentist_id?: string | null
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
          dentist_id?: string | null
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
      notes: {
        Row: {
          content: string | null
          created_at: string
          dentist_id: string | null
          id: string
          patient_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          dentist_id?: string | null
          id?: string
          patient_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          dentist_id?: string | null
          id?: string
          patient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      patient_symptom_summaries: {
        Row: {
          appointment_id: string | null
          created_at: string
          extracted_symptoms: Json | null
          id: string
          pain_level: number | null
          patient_id: string
          summary_text: string
          updated_at: string
          urgency_level: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          extracted_symptoms?: Json | null
          id?: string
          pain_level?: number | null
          patient_id: string
          summary_text: string
          updated_at?: string
          urgency_level?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          extracted_symptoms?: Json | null
          id?: string
          pain_level?: number | null
          patient_id?: string
          summary_text?: string
          updated_at?: string
          urgency_level?: string | null
        }
        Relationships: []
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
      sms_notifications: {
        Row: {
          created_at: string
          delivered_at: string | null
          dentist_id: string
          error_message: string | null
          id: string
          message_content: string
          message_type: string
          patient_id: string
          phone_number: string
          sent_at: string | null
          status: string | null
          twilio_sid: string | null
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          dentist_id: string
          error_message?: string | null
          id?: string
          message_content: string
          message_type: string
          patient_id: string
          phone_number: string
          sent_at?: string | null
          status?: string | null
          twilio_sid?: string | null
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          dentist_id?: string
          error_message?: string | null
          id?: string
          message_content?: string
          message_type?: string
          patient_id?: string
          phone_number?: string
          sent_at?: string | null
          status?: string | null
          twilio_sid?: string | null
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
      create_simple_appointment: {
        Args: {
          p_patient_id: string
          p_dentist_id: string
          p_appointment_date: string
          p_reason?: string
          p_urgency?: Database["public"]["Enums"]["urgency_level"]
        }
        Returns: string
      }
      generate_daily_slots: {
        Args: { p_dentist_id: string; p_date: string }
        Returns: undefined
      }
      get_dashboard_overview: {
        Args: { p_dentist_id: string }
        Returns: {
          today_appointments_count: number
          urgent_cases_count: number
          patients_waiting_count: number
          patients_in_treatment_count: number
          revenue_today: number
          pending_tasks_count: number
          unread_messages_count: number
        }[]
      }
      get_patient_context_for_ai: {
        Args: { p_patient_id: string }
        Returns: Json
      }
      get_patient_stats_for_dentist: {
        Args: { p_dentist_id: string; p_patient_id: string }
        Returns: {
          total_appointments: number
          upcoming_appointments: number
          completed_appointments: number
          last_appointment_date: string
          total_notes: number
          active_treatment_plans: number
        }[]
      }
      get_upcoming_appointments_with_urgency: {
        Args: { p_dentist_id: string }
        Returns: {
          appointment_id: string
          patient_id: string
          patient_name: string
          appointment_date: string
          urgency: Database["public"]["Enums"]["urgency_level"]
          reason: string
          pain_level: number
          has_bleeding: boolean
          has_swelling: boolean
        }[]
      }
      is_dentist_for_patient: {
        Args: { patient_profile_id: string }
        Returns: boolean
      }
      release_appointment_slot: {
        Args: { p_appointment_id: string }
        Returns: boolean
      }
      send_sms_notification: {
        Args: {
          p_patient_id: string
          p_dentist_id: string
          p_phone_number: string
          p_message_type: string
          p_message_content: string
        }
        Returns: string
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
