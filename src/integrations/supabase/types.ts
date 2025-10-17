export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_name: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_name: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_name?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      appointment_reminders: {
        Row: {
          appointment_id: string
          created_at: string
          error_message: string | null
          id: string
          notification_method: string
          reminder_type: string
          scheduled_for: string
          sent_at: string | null
          status: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          notification_method?: string
          reminder_type: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          notification_method?: string
          reminder_type?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_reminders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      backup_logs: {
        Row: {
          backup_type: string
          checksum: string | null
          completed_at: string | null
          error_message: string | null
          file_path: string | null
          id: string
          size_bytes: number | null
          started_at: string
          status: Database["public"]["Enums"]["backup_status"]
        }
        Insert: {
          backup_type: string
          checksum?: string | null
          completed_at?: string | null
          error_message?: string | null
          file_path?: string | null
          id?: string
          size_bytes?: number | null
          started_at?: string
          status: Database["public"]["Enums"]["backup_status"]
        }
        Update: {
          backup_type?: string
          checksum?: string | null
          completed_at?: string | null
          error_message?: string | null
          file_path?: string | null
          id?: string
          size_bytes?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["backup_status"]
        }
        Relationships: []
      }
      breach_incidents: {
        Row: {
          affected_records_count: number | null
          assigned_to: string | null
          authority_notified_at: string | null
          contained_at: string | null
          created_at: string
          data_categories: string[] | null
          description: string | null
          discovered_at: string
          id: string
          mitigation_steps: string | null
          patients_notified_at: string | null
          reporter_id: string | null
          resolved_at: string | null
          root_cause: string | null
          severity: Database["public"]["Enums"]["breach_severity"]
          status: Database["public"]["Enums"]["breach_status"]
          title: string
          updated_at: string
        }
        Insert: {
          affected_records_count?: number | null
          assigned_to?: string | null
          authority_notified_at?: string | null
          contained_at?: string | null
          created_at?: string
          data_categories?: string[] | null
          description?: string | null
          discovered_at: string
          id?: string
          mitigation_steps?: string | null
          patients_notified_at?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          severity: Database["public"]["Enums"]["breach_severity"]
          status?: Database["public"]["Enums"]["breach_status"]
          title: string
          updated_at?: string
        }
        Update: {
          affected_records_count?: number | null
          assigned_to?: string | null
          authority_notified_at?: string | null
          contained_at?: string | null
          created_at?: string
          data_categories?: string[] | null
          description?: string | null
          discovered_at?: string
          id?: string
          mitigation_steps?: string | null
          patients_notified_at?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["breach_severity"]
          status?: Database["public"]["Enums"]["breach_status"]
          title?: string
          updated_at?: string
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
      clinic_settings: {
        Row: {
          ai_instructions: string | null
          ai_response_length: string | null
          ai_tone: string | null
          appointment_keywords: string[] | null
          business_hours: Json | null
          clinic_name: string | null
          created_at: string | null
          currency: string | null
          dentist_id: string
          emergency_keywords: string[] | null
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          show_branding_in_emails: boolean | null
          show_logo_in_chat: boolean | null
          specialty_type: string | null
          tagline: string | null
          updated_at: string | null
          welcome_message: string | null
        }
        Insert: {
          ai_instructions?: string | null
          ai_response_length?: string | null
          ai_tone?: string | null
          appointment_keywords?: string[] | null
          business_hours?: Json | null
          clinic_name?: string | null
          created_at?: string | null
          currency?: string | null
          dentist_id: string
          emergency_keywords?: string[] | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          show_branding_in_emails?: boolean | null
          show_logo_in_chat?: boolean | null
          specialty_type?: string | null
          tagline?: string | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Update: {
          ai_instructions?: string | null
          ai_response_length?: string | null
          ai_tone?: string | null
          appointment_keywords?: string[] | null
          business_hours?: Json | null
          clinic_name?: string | null
          created_at?: string | null
          currency?: string | null
          dentist_id?: string
          emergency_keywords?: string[] | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          show_branding_in_emails?: boolean | null
          show_logo_in_chat?: boolean | null
          specialty_type?: string | null
          tagline?: string | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_settings_dentist_id_fkey1"
            columns: ["dentist_id"]
            isOneToOne: true
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
        ]
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
      consent_records: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_at: string
          id: string
          ip_address: unknown | null
          legal_basis: string | null
          patient_id: string
          scope: Database["public"]["Enums"]["consent_scope"]
          status: Database["public"]["Enums"]["consent_status"]
          updated_at: string
          user_agent: string | null
          version: number | null
          withdrawn_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          id?: string
          ip_address?: unknown | null
          legal_basis?: string | null
          patient_id: string
          scope: Database["public"]["Enums"]["consent_scope"]
          status?: Database["public"]["Enums"]["consent_status"]
          updated_at?: string
          user_agent?: string | null
          version?: number | null
          withdrawn_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          id?: string
          ip_address?: unknown | null
          legal_basis?: string | null
          patient_id?: string
          scope?: Database["public"]["Enums"]["consent_scope"]
          status?: Database["public"]["Enums"]["consent_status"]
          updated_at?: string
          user_agent?: string | null
          version?: number | null
          withdrawn_at?: string | null
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
      data_minimization_settings: {
        Row: {
          auto_delete_old_images: boolean | null
          auto_delete_old_messages: boolean | null
          created_at: string
          id: string
          minimal_logging: boolean | null
          patient_id: string
          updated_at: string
        }
        Insert: {
          auto_delete_old_images?: boolean | null
          auto_delete_old_messages?: boolean | null
          created_at?: string
          id?: string
          minimal_logging?: boolean | null
          patient_id: string
          updated_at?: string
        }
        Update: {
          auto_delete_old_images?: boolean | null
          auto_delete_old_messages?: boolean | null
          created_at?: string
          id?: string
          minimal_logging?: boolean | null
          patient_id?: string
          updated_at?: string
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
          license_number: string | null
          profile_id: string
          specialization: string | null
          specialty: string | null
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
          license_number?: string | null
          profile_id: string
          specialization?: string | null
          specialty?: string | null
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
          license_number?: string | null
          profile_id?: string
          specialization?: string | null
          specialty?: string | null
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
      email_event_logs: {
        Row: {
          appointment_id: string | null
          created_at: string
          event_type: string
          id: string
          idempotency_key: string
          invoice_id: string | null
          message_id: string | null
          metadata: Json | null
          patient_id: string
          priority: string
          sent_at: string
          template_id: string
          tenant_id: string | null
          treatment_plan_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          idempotency_key: string
          invoice_id?: string | null
          message_id?: string | null
          metadata?: Json | null
          patient_id: string
          priority?: string
          sent_at?: string
          template_id: string
          tenant_id?: string | null
          treatment_plan_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          idempotency_key?: string
          invoice_id?: string | null
          message_id?: string | null
          metadata?: Json | null
          patient_id?: string
          priority?: string
          sent_at?: string
          template_id?: string
          tenant_id?: string | null
          treatment_plan_id?: string | null
        }
        Relationships: []
      }
      email_notifications: {
        Row: {
          created_at: string
          dentist_id: string
          email_address: string
          id: string
          message_content: string
          message_type: string
          patient_id: string
          resend_id: string | null
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          dentist_id: string
          email_address: string
          id?: string
          message_content: string
          message_type: string
          patient_id: string
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          dentist_id?: string
          email_address?: string
          id?: string
          message_content?: string
          message_type?: string
          patient_id?: string
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_notifications_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_notifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gdpr_audit_log: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id: string | null
          actor_role: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown | null
          patient_id: string | null
          purpose_code: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          actor_role?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          patient_id?: string | null
          purpose_code?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          actor_role?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          patient_id?: string | null
          purpose_code?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      gdpr_export_bundles: {
        Row: {
          bundle_type: string | null
          completed_at: string | null
          created_at: string
          download_count: number | null
          expires_at: string | null
          file_path: string | null
          id: string
          patient_id: string
          request_id: string | null
          signed_url: string | null
          status: Database["public"]["Enums"]["export_status"]
        }
        Insert: {
          bundle_type?: string | null
          completed_at?: string | null
          created_at?: string
          download_count?: number | null
          expires_at?: string | null
          file_path?: string | null
          id?: string
          patient_id: string
          request_id?: string | null
          signed_url?: string | null
          status?: Database["public"]["Enums"]["export_status"]
        }
        Update: {
          bundle_type?: string | null
          completed_at?: string | null
          created_at?: string
          download_count?: number | null
          expires_at?: string | null
          file_path?: string | null
          id?: string
          patient_id?: string
          request_id?: string | null
          signed_url?: string | null
          status?: Database["public"]["Enums"]["export_status"]
        }
        Relationships: [
          {
            foreignKeyName: "gdpr_export_bundles_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "gdpr_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      gdpr_requests: {
        Row: {
          actor_id: string | null
          created_at: string
          description: string | null
          due_at: string
          id: string
          legal_basis: string | null
          patient_id: string
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["gdpr_request_status"]
          submitted_at: string
          type: Database["public"]["Enums"]["gdpr_request_type"]
          updated_at: string
          urgency_level: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          description?: string | null
          due_at?: string
          id?: string
          legal_basis?: string | null
          patient_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["gdpr_request_status"]
          submitted_at?: string
          type: Database["public"]["Enums"]["gdpr_request_type"]
          updated_at?: string
          urgency_level?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          description?: string | null
          due_at?: string
          id?: string
          legal_basis?: string | null
          patient_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["gdpr_request_status"]
          submitted_at?: string
          type?: Database["public"]["Enums"]["gdpr_request_type"]
          updated_at?: string
          urgency_level?: string | null
        }
        Relationships: []
      }
      import_job_items: {
        Row: {
          created_at: string
          created_record_id: string | null
          created_record_type: string | null
          error_message: string | null
          id: string
          job_id: string
          processed_data: Json | null
          raw_data: Json
          row_number: number
          status: string
        }
        Insert: {
          created_at?: string
          created_record_id?: string | null
          created_record_type?: string | null
          error_message?: string | null
          id?: string
          job_id: string
          processed_data?: Json | null
          raw_data: Json
          row_number: number
          status?: string
        }
        Update: {
          created_at?: string
          created_record_id?: string | null
          created_record_type?: string | null
          error_message?: string | null
          id?: string
          job_id?: string
          processed_data?: Json | null
          raw_data?: Json
          row_number?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_job_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          dentist_id: string
          error_details: Json | null
          failed_rows: number | null
          file_size: number | null
          filename: string
          id: string
          import_type: string
          mapping_config: Json | null
          processed_rows: number | null
          started_at: string | null
          status: string
          successful_rows: number | null
          timezone: string | null
          total_rows: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          dentist_id: string
          error_details?: Json | null
          failed_rows?: number | null
          file_size?: number | null
          filename: string
          id?: string
          import_type?: string
          mapping_config?: Json | null
          processed_rows?: number | null
          started_at?: string | null
          status?: string
          successful_rows?: number | null
          timezone?: string | null
          total_rows?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          dentist_id?: string
          error_details?: Json | null
          failed_rows?: number | null
          file_size?: number | null
          filename?: string
          id?: string
          import_type?: string
          mapping_config?: Json | null
          processed_rows?: number | null
          started_at?: string | null
          status?: string
          successful_rows?: number | null
          timezone?: string | null
          total_rows?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      import_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by_user_id: string | null
          dentist_id: string
          error_details: Json
          failed_records: number
          field_mapping: Json
          filename: string
          id: string
          import_type: string
          status: string
          successful_records: number
          total_records: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          dentist_id: string
          error_details?: Json
          failed_records?: number
          field_mapping?: Json
          filename: string
          id?: string
          import_type?: string
          status?: string
          successful_records?: number
          total_records?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          dentist_id?: string
          error_details?: Json
          failed_records?: number
          field_mapping?: Json
          filename?: string
          id?: string
          import_type?: string
          status?: string
          successful_records?: number
          total_records?: number
        }
        Relationships: []
      }
      import_templates: {
        Row: {
          created_at: string
          dentist_id: string
          description: string | null
          id: string
          import_type: string
          is_default: boolean | null
          mapping_config: Json
          name: string
          updated_at: string
          usage_count: number | null
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string
          dentist_id: string
          description?: string | null
          id?: string
          import_type: string
          is_default?: boolean | null
          mapping_config?: Json
          name: string
          updated_at?: string
          usage_count?: number | null
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string
          dentist_id?: string
          description?: string | null
          id?: string
          import_type?: string
          is_default?: boolean | null
          mapping_config?: Json
          name?: string
          updated_at?: string
          usage_count?: number | null
          validation_rules?: Json | null
        }
        Relationships: []
      }
      insurance_pre_approvals: {
        Row: {
          coverage_percentage: number | null
          created_at: string
          decision_at: string | null
          dentist_id: string
          documents: Json
          estimated_cost: number | null
          expires_at: string | null
          id: string
          member_id: string | null
          notes: string | null
          patient_id: string
          policy_number: string | null
          provider_id: string | null
          provider_name: string
          status: Database["public"]["Enums"]["pre_approval_status"]
          submitted_at: string | null
          treatment_codes: Json | null
          updated_at: string
        }
        Insert: {
          coverage_percentage?: number | null
          created_at?: string
          decision_at?: string | null
          dentist_id: string
          documents?: Json
          estimated_cost?: number | null
          expires_at?: string | null
          id?: string
          member_id?: string | null
          notes?: string | null
          patient_id: string
          policy_number?: string | null
          provider_id?: string | null
          provider_name: string
          status?: Database["public"]["Enums"]["pre_approval_status"]
          submitted_at?: string | null
          treatment_codes?: Json | null
          updated_at?: string
        }
        Update: {
          coverage_percentage?: number | null
          created_at?: string
          decision_at?: string | null
          dentist_id?: string
          documents?: Json
          estimated_cost?: number | null
          expires_at?: string | null
          id?: string
          member_id?: string | null
          notes?: string | null
          patient_id?: string
          policy_number?: string | null
          provider_id?: string | null
          provider_name?: string
          status?: Database["public"]["Enums"]["pre_approval_status"]
          submitted_at?: string | null
          treatment_codes?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_pre_approvals_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_pre_approvals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_pre_approvals_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_providers: {
        Row: {
          api_type: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          api_type?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          api_type?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_adjustments: {
        Row: {
          adjustment_type: string
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          quantity_change: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          adjustment_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          item_id: string
          quantity_change: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          adjustment_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string
          quantity_change?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string
          cost_per_unit: number | null
          created_at: string
          dentist_id: string
          expiry_date: string | null
          id: string
          min_threshold: number
          name: string
          notes: string | null
          quantity: number
          sku: string | null
          supplier: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          category: string
          cost_per_unit?: number | null
          created_at?: string
          dentist_id: string
          expiry_date?: string | null
          id?: string
          min_threshold?: number
          name: string
          notes?: string | null
          quantity?: number
          sku?: string | null
          supplier?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          cost_per_unit?: number | null
          created_at?: string
          dentist_id?: string
          expiry_date?: string | null
          id?: string
          min_threshold?: number
          name?: string
          notes?: string | null
          quantity?: number
          sku?: string | null
          supplier?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_order_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          order_id: string
          quantity_ordered: number
          quantity_received: number | null
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          order_id: string
          quantity_ordered: number
          quantity_received?: number | null
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          order_id?: string
          quantity_ordered?: number
          quantity_received?: number | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "inventory_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_orders: {
        Row: {
          created_at: string
          dentist_id: string
          expected_delivery: string | null
          id: string
          notes: string | null
          order_date: string | null
          order_number: string | null
          status: string
          supplier: string | null
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dentist_id: string
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          order_number?: string | null
          status?: string
          supplier?: string | null
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dentist_id?: string
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          order_number?: string | null
          status?: string
          supplier?: string | null
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_orders_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_usage: {
        Row: {
          appointment_id: string | null
          created_at: string
          id: string
          item_id: string
          notes: string | null
          quantity_used: number
          treatment_plan_id: string | null
          used_by: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          item_id: string
          notes?: string | null
          quantity_used: number
          treatment_plan_id?: string | null
          used_by?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          item_id?: string
          notes?: string | null
          quantity_used?: number
          treatment_plan_id?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_usage_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_usage_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_usage_treatment_plan_id_fkey"
            columns: ["treatment_plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_usage_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          profile_id: string
          token: string
          updated_at: string
          used: boolean
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          profile_id: string
          token: string
          updated_at?: string
          used?: boolean
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          profile_id?: string
          token?: string
          updated_at?: string
          used?: boolean
          used_at?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          code: string
          created_at: string
          description: string
          id: string
          invoice_id: string
          mutuality_cents: number
          patient_cents: number
          quantity: number
          tariff_cents: number
          vat_cents: number
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          mutuality_cents?: number
          patient_cents?: number
          quantity?: number
          tariff_cents?: number
          vat_cents?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          mutuality_cents?: number
          patient_cents?: number
          quantity?: number
          tariff_cents?: number
          vat_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          appointment_id: string | null
          claim_status: string
          created_at: string
          dentist_id: string
          id: string
          mutuality_amount_cents: number
          patient_amount_cents: number
          patient_id: string
          status: string
          total_amount_cents: number
          updated_at: string
          vat_amount_cents: number
        }
        Insert: {
          appointment_id?: string | null
          claim_status?: string
          created_at?: string
          dentist_id: string
          id?: string
          mutuality_amount_cents?: number
          patient_amount_cents?: number
          patient_id: string
          status?: string
          total_amount_cents?: number
          updated_at?: string
          vat_amount_cents?: number
        }
        Update: {
          appointment_id?: string | null
          claim_status?: string
          created_at?: string
          dentist_id?: string
          id?: string
          mutuality_amount_cents?: number
          patient_amount_cents?: number
          patient_id?: string
          status?: string
          total_amount_cents?: number
          updated_at?: string
          vat_amount_cents?: number
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          created_at: string
          created_by: string | null
          entity_id: string | null
          expires_at: string | null
          file_path: string | null
          id: string
          metadata: Json | null
          signed_at: string | null
          title: string
          type: Database["public"]["Enums"]["document_type"]
          version: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          expires_at?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json | null
          signed_at?: string | null
          title: string
          type: Database["public"]["Enums"]["document_type"]
          version?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          expires_at?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json | null
          signed_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["document_type"]
          version?: number | null
        }
        Relationships: []
      }
      medical_records: {
        Row: {
          appointment_id: string | null
          attachments: Json | null
          created_at: string
          dentist_id: string | null
          description: string | null
          findings: string | null
          id: string
          patient_id: string
          recommendations: string | null
          record_date: string
          record_type: string
          title: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          attachments?: Json | null
          created_at?: string
          dentist_id?: string | null
          description?: string | null
          findings?: string | null
          id?: string
          patient_id: string
          recommendations?: string | null
          record_date?: string
          record_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          attachments?: Json | null
          created_at?: string
          dentist_id?: string | null
          description?: string | null
          findings?: string | null
          id?: string
          patient_id?: string
          recommendations?: string | null
          record_date?: string
          record_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
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
      notification_preferences: {
        Row: {
          appointment_reminders: boolean
          created_at: string
          email_enabled: boolean
          emergency_alerts: boolean
          id: string
          in_app_enabled: boolean
          prescription_updates: boolean
          push_enabled: boolean
          quiet_hours_end: string
          quiet_hours_start: string
          sms_enabled: boolean
          system_notifications: boolean
          treatment_plan_updates: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_reminders?: boolean
          created_at?: string
          email_enabled?: boolean
          emergency_alerts?: boolean
          id?: string
          in_app_enabled?: boolean
          prescription_updates?: boolean
          push_enabled?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          sms_enabled?: boolean
          system_notifications?: boolean
          treatment_plan_updates?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_reminders?: boolean
          created_at?: string
          email_enabled?: boolean
          emergency_alerts?: boolean
          id?: string
          in_app_enabled?: boolean
          prescription_updates?: boolean
          push_enabled?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          sms_enabled?: boolean
          system_notifications?: boolean
          treatment_plan_updates?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string | null
          dentist_id: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          patient_id: string | null
          priority: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          dentist_id?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          patient_id?: string | null
          priority?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          dentist_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          patient_id?: string | null
          priority?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_at: string
          joined_at: string | null
          organization_id: string
          profile_id: string
          role: Database["public"]["Enums"]["member_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string
          joined_at?: string | null
          organization_id: string
          profile_id: string
          role?: Database["public"]["Enums"]["member_role"]
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string
          joined_at?: string | null
          organization_id?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["member_role"]
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          business_hours_end: string
          business_hours_start: string
          business_name: string | null
          clinic_name: string | null
          created_at: string
          currency: string
          dentist_id: string
          id: string
          industry_type: Database["public"]["Enums"]["industry_type"] | null
          language: string
          logo_url: string | null
          organization_id: string | null
          primary_color: string | null
          secondary_color: string | null
          tagline: string | null
          terminology: Json | null
          timezone: string
          updated_at: string
        }
        Insert: {
          business_hours_end?: string
          business_hours_start?: string
          business_name?: string | null
          clinic_name?: string | null
          created_at?: string
          currency?: string
          dentist_id: string
          id?: string
          industry_type?: Database["public"]["Enums"]["industry_type"] | null
          language?: string
          logo_url?: string | null
          organization_id?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tagline?: string | null
          terminology?: Json | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          business_hours_end?: string
          business_hours_start?: string
          business_name?: string | null
          clinic_name?: string | null
          created_at?: string
          currency?: string
          dentist_id?: string
          id?: string
          industry_type?: Database["public"]["Enums"]["industry_type"] | null
          language?: string
          logo_url?: string | null
          organization_id?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tagline?: string | null
          terminology?: Json | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_settings_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: true
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          current_period_end: string | null
          demo_data_generated: boolean
          demo_expires_at: string | null
          id: string
          industry_type: Database["public"]["Enums"]["industry_type"]
          is_demo: boolean
          last_payment_date: string | null
          name: string
          slug: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          demo_data_generated?: boolean
          demo_expires_at?: string | null
          id?: string
          industry_type?: Database["public"]["Enums"]["industry_type"]
          is_demo?: boolean
          last_payment_date?: string | null
          name: string
          slug?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          demo_data_generated?: boolean
          demo_expires_at?: string | null
          id?: string
          industry_type?: Database["public"]["Enums"]["industry_type"]
          is_demo?: boolean
          last_payment_date?: string | null
          name?: string
          slug?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at?: string | null
          updated_at?: string
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
      patient_notes: {
        Row: {
          content: string
          created_at: string
          dentist_id: string
          id: string
          is_private: boolean
          note_type: string
          patient_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          dentist_id: string
          id?: string
          is_private?: boolean
          note_type?: string
          patient_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          dentist_id?: string
          id?: string
          is_private?: boolean
          note_type?: string
          patient_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      payment_records: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string
          dentist_id: string
          id: string
          notes: string | null
          organization_id: string | null
          patient_id: string
          payment_date: string
          payment_method: string
          payment_status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string
          dentist_id: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          patient_id: string
          payment_date?: string
          payment_method?: string
          payment_status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string
          dentist_id?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          patient_id?: string
          payment_date?: string
          payment_method?: string
          payment_status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          dentist_id: string
          description: string
          id: string
          organization_id: string | null
          paid_at: string | null
          patient_email: string
          patient_id: string
          status: string
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          dentist_id: string
          description: string
          id?: string
          organization_id?: string | null
          paid_at?: string | null
          patient_email: string
          patient_id: string
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          dentist_id?: string
          description?: string
          id?: string
          organization_id?: string | null
          paid_at?: string | null
          patient_email?: string
          patient_id?: string
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          ai_opt_out: boolean | null
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          emergency_contact: string | null
          first_name: string
          id: string
          import_session_id: string | null
          language_preference: string | null
          last_name: string
          medical_history: string | null
          organization_id: string | null
          phone: string | null
          preferred_language: string | null
          profile_completion_status: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          ai_opt_out?: boolean | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          emergency_contact?: string | null
          first_name: string
          id?: string
          import_session_id?: string | null
          language_preference?: string | null
          last_name: string
          medical_history?: string | null
          organization_id?: string | null
          phone?: string | null
          preferred_language?: string | null
          profile_completion_status?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          ai_opt_out?: boolean | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          emergency_contact?: string | null
          first_name?: string
          id?: string
          import_session_id?: string | null
          language_preference?: string | null
          last_name?: string
          medical_history?: string | null
          organization_id?: string | null
          phone?: string | null
          preferred_language?: string | null
          profile_completion_status?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_import_session_id_fkey"
            columns: ["import_session_id"]
            isOneToOne: false
            referencedRelation: "import_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recalls: {
        Row: {
          appointment_id: string | null
          booked_appointment_id: string | null
          created_at: string
          dentist_id: string
          due_date: string
          id: string
          patient_id: string
          status: string
          suggested_slots: Json | null
          treatment_key: string
          treatment_label: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          booked_appointment_id?: string | null
          created_at?: string
          dentist_id: string
          due_date: string
          id?: string
          patient_id: string
          status?: string
          suggested_slots?: Json | null
          treatment_key: string
          treatment_label: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          booked_appointment_id?: string | null
          created_at?: string
          dentist_id?: string
          due_date?: string
          id?: string
          patient_id?: string
          status?: string
          suggested_slots?: Json | null
          treatment_key?: string
          treatment_label?: string
          updated_at?: string
        }
        Relationships: []
      }
      retention_policies: {
        Row: {
          created_at: string
          entity_type: string
          grace_period_days: number | null
          id: string
          is_locked: boolean | null
          legal_basis: string
          retention_period_months: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_type: string
          grace_period_days?: number | null
          id?: string
          is_locked?: boolean | null
          legal_basis: string
          retention_period_months: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          grace_period_days?: number | null
          id?: string
          is_locked?: boolean | null
          legal_basis?: string
          retention_period_months?: number
          updated_at?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
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
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          features: Json
          id: string
          is_active: boolean
          limits: Json
          name: string
          price_monthly: number | null
          price_yearly: number | null
          sort_order: number
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
          stripe_product_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name: string
          price_monthly?: number | null
          price_yearly?: number | null
          sort_order?: number
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name?: string
          price_monthly?: number | null
          price_yearly?: number | null
          sort_order?: number
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          stripe_product_id?: string | null
          updated_at?: string
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
      treatment_supply_mappings: {
        Row: {
          created_at: string
          id: string
          is_optional: boolean | null
          item_id: string
          notes: string | null
          quantity_per_treatment: number
          treatment_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_optional?: boolean | null
          item_id: string
          notes?: string | null
          quantity_per_treatment?: number
          treatment_type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_optional?: boolean | null
          item_id?: string
          notes?: string | null
          quantity_per_treatment?: number
          treatment_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_supply_mappings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
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
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_registry: {
        Row: {
          contact_email: string | null
          created_at: string
          data_categories: string[] | null
          dpa_expires_at: string | null
          dpa_signed_at: string | null
          has_dpa: boolean | null
          has_scc: boolean | null
          id: string
          is_active: boolean | null
          name: string
          purpose: string
          region: string
          scc_signed_at: string | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          data_categories?: string[] | null
          dpa_expires_at?: string | null
          dpa_signed_at?: string | null
          has_dpa?: boolean | null
          has_scc?: boolean | null
          id?: string
          is_active?: boolean | null
          name: string
          purpose: string
          region: string
          scc_signed_at?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          data_categories?: string[] | null
          dpa_expires_at?: string | null
          dpa_signed_at?: string | null
          has_dpa?: boolean | null
          has_scc?: boolean | null
          id?: string
          is_active?: boolean | null
          name?: string
          purpose?: string
          region?: string
          scc_signed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          updated_at: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          updated_at?: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          updated_at?: string
          used?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_appointment_slot: {
        Args: {
          p_appointment_id: string
          p_dentist_id: string
          p_slot_date: string
          p_slot_time: string
        }
        Returns: boolean
      }
      can_current_dentist_view_patient: {
        Args: { p_patient_profile_id: string }
        Returns: boolean
      }
      cancel_appointment: {
        Args: { appointment_id: string; user_id: string }
        Returns: boolean
      }
      check_booking_limit: {
        Args: { org_id: string }
        Returns: boolean
      }
      create_invitation_token: {
        Args: {
          p_email: string
          p_expires_hours?: number
          p_profile_id: string
        }
        Returns: string
      }
      create_invitation_token_with_cleanup: {
        Args: {
          p_email: string
          p_expires_hours?: number
          p_profile_id: string
        }
        Returns: string
      }
      create_prescription_notification: {
        Args: {
          p_dentist_id: string
          p_medication_name: string
          p_patient_id: string
          p_prescription_id: string
        }
        Returns: string
      }
      create_simple_appointment: {
        Args: {
          p_appointment_date: string
          p_dentist_id: string
          p_patient_id: string
          p_reason?: string
          p_urgency?: Database["public"]["Enums"]["urgency_level"]
        }
        Returns: string
      }
      current_user_is_dentist_for: {
        Args: { p_dentist_id: string }
        Returns: boolean
      }
      generate_daily_slots: {
        Args: { p_date: string; p_dentist_id: string }
        Returns: undefined
      }
      get_current_user_profile_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_dashboard_overview: {
        Args: { p_dentist_id: string }
        Returns: {
          patients_in_treatment_count: number
          patients_waiting_count: number
          pending_tasks_count: number
          revenue_today: number
          today_appointments_count: number
          unread_messages_count: number
          urgent_cases_count: number
        }[]
      }
      get_patient_context_for_ai: {
        Args: { p_patient_id: string }
        Returns: Json
      }
      get_patient_stats_for_dentist: {
        Args: { p_dentist_id: string; p_patient_id: string }
        Returns: {
          active_treatment_plans: number
          completed_appointments: number
          last_appointment_date: string
          total_appointments: number
          total_notes: number
          upcoming_appointments: number
        }[]
      }
      get_upcoming_appointments_with_urgency: {
        Args: { p_dentist_id: string }
        Returns: {
          appointment_date: string
          appointment_id: string
          has_bleeding: boolean
          has_swelling: boolean
          pain_level: number
          patient_id: string
          patient_name: string
          reason: string
          urgency: Database["public"]["Enums"]["urgency_level"]
        }[]
      }
      get_user_organizations: {
        Args: Record<PropertyKey, never>
        Returns: {
          organization_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_current_user_dentist_owner: {
        Args: { p_dentist_id: string }
        Returns: boolean
      }
      is_dentist_for_patient: {
        Args: { patient_profile_id: string }
        Returns: boolean
      }
      is_organization_admin: {
        Args: { org_id: string }
        Returns: boolean
      }
      is_organization_member: {
        Args: { org_id: string }
        Returns: boolean
      }
      link_profile_to_user: {
        Args: { profile_id: string; user_id: string }
        Returns: undefined
      }
      mark_invitation_used: {
        Args: { invitation_token: string }
        Returns: undefined
      }
      process_csv_data_import: {
        Args: {
          p_csv_content: string
          p_dentist_id: string
          p_filename: string
        }
        Returns: Json
      }
      release_appointment_slot: {
        Args: { p_appointment_id: string }
        Returns: boolean
      }
      send_sms_notification: {
        Args: {
          p_dentist_id: string
          p_message_content: string
          p_message_type: string
          p_patient_id: string
          p_phone_number: string
        }
        Returns: string
      }
      update_import_job_progress: {
        Args: { p_job_id: string }
        Returns: undefined
      }
      update_import_session_progress: {
        Args: {
          p_failed?: number
          p_session_id: string
          p_status?: string
          p_successful?: number
        }
        Returns: undefined
      }
      user_is_in_organization: {
        Args: { org_id: string }
        Returns: boolean
      }
      user_is_org_admin: {
        Args: { org_id: string }
        Returns: boolean
      }
      validate_invitation_token: {
        Args: { invitation_token: string }
        Returns: {
          email: string
          expires_at: string
          first_name: string
          id: string
          last_name: string
          phone: string
          profile_id: string
        }[]
      }
    }
    Enums: {
      appointment_status: "pending" | "confirmed" | "completed" | "cancelled"
      audit_action:
        | "login"
        | "logout"
        | "view_phi"
        | "create"
        | "update"
        | "delete"
        | "export"
        | "consent_change"
        | "gdpr_request"
        | "price_override"
        | "backup"
        | "restore"
      backup_status: "running" | "completed" | "failed"
      breach_severity: "low" | "medium" | "high" | "critical"
      breach_status:
        | "reported"
        | "investigating"
        | "contained"
        | "resolved"
        | "closed"
      consent_scope:
        | "health_data_processing"
        | "ai_intake"
        | "notifications"
        | "marketing"
        | "analytics"
      consent_status: "granted" | "withdrawn" | "expired"
      document_type:
        | "dpa"
        | "dpia"
        | "ropa"
        | "scc"
        | "breach_report"
        | "gdpr_monthly"
      export_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "expired"
      gdpr_request_status:
        | "submitted"
        | "in_progress"
        | "approved"
        | "rejected"
        | "completed"
        | "expired"
      gdpr_request_type:
        | "access"
        | "rectification"
        | "erasure"
        | "restriction"
        | "portability"
        | "objection"
      industry_type:
        | "healthcare"
        | "beauty"
        | "fitness"
        | "consulting"
        | "education"
        | "legal"
        | "other"
      member_role: "owner" | "admin" | "staff" | "viewer"
      pre_approval_status:
        | "draft"
        | "pending"
        | "submitted"
        | "needs_info"
        | "approved"
        | "rejected"
        | "cancelled"
        | "expired"
      subscription_status:
        | "active"
        | "inactive"
        | "trial"
        | "past_due"
        | "canceled"
        | "demo"
      subscription_tier:
        | "free_trial"
        | "basic"
        | "professional"
        | "enterprise"
        | "demo"
      urgency_level: "low" | "medium" | "high" | "emergency"
      user_role: "patient" | "dentist" | "admin" | "staff"
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
      audit_action: [
        "login",
        "logout",
        "view_phi",
        "create",
        "update",
        "delete",
        "export",
        "consent_change",
        "gdpr_request",
        "price_override",
        "backup",
        "restore",
      ],
      backup_status: ["running", "completed", "failed"],
      breach_severity: ["low", "medium", "high", "critical"],
      breach_status: [
        "reported",
        "investigating",
        "contained",
        "resolved",
        "closed",
      ],
      consent_scope: [
        "health_data_processing",
        "ai_intake",
        "notifications",
        "marketing",
        "analytics",
      ],
      consent_status: ["granted", "withdrawn", "expired"],
      document_type: [
        "dpa",
        "dpia",
        "ropa",
        "scc",
        "breach_report",
        "gdpr_monthly",
      ],
      export_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "expired",
      ],
      gdpr_request_status: [
        "submitted",
        "in_progress",
        "approved",
        "rejected",
        "completed",
        "expired",
      ],
      gdpr_request_type: [
        "access",
        "rectification",
        "erasure",
        "restriction",
        "portability",
        "objection",
      ],
      industry_type: [
        "healthcare",
        "beauty",
        "fitness",
        "consulting",
        "education",
        "legal",
        "other",
      ],
      member_role: ["owner", "admin", "staff", "viewer"],
      pre_approval_status: [
        "draft",
        "pending",
        "submitted",
        "needs_info",
        "approved",
        "rejected",
        "cancelled",
        "expired",
      ],
      subscription_status: [
        "active",
        "inactive",
        "trial",
        "past_due",
        "canceled",
        "demo",
      ],
      subscription_tier: [
        "free_trial",
        "basic",
        "professional",
        "enterprise",
        "demo",
      ],
      urgency_level: ["low", "medium", "high", "emergency"],
      user_role: ["patient", "dentist", "admin", "staff"],
    },
  },
} as const
