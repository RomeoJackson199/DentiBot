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
      appointment_slots: {
        Row: {
          appointment_id: string | null
          created_at: string
          dentist_id: string
          emergency_only: boolean
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
          emergency_only?: boolean
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
          emergency_only?: boolean
          id?: string
          is_available?: boolean
          slot_date?: string
          slot_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_slots_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_slots_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          consultation_notes: string | null
          created_at: string
          dentist_id: string
          duration_minutes: number | null
          id: string
          notes: string | null
          patient_id: string
          patient_name: string | null
          reason: string
          status: string
          updated_at: string
          urgency: string
        }
        Insert: {
          appointment_date: string
          consultation_notes?: string | null
          created_at?: string
          dentist_id: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          patient_name?: string | null
          reason?: string
          status?: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          appointment_date?: string
          consultation_notes?: string | null
          created_at?: string
          dentist_id?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          patient_name?: string | null
          reason?: string
          status?: string
          updated_at?: string
          urgency?: string
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
            foreignKeyName: "appointments_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appointments_dentist"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appointments_dentist"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appointments_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          ai_instructions: string | null
          ai_response_length: string
          ai_tone: string
          appointment_keywords: string[]
          business_hours: Json
          created_at: string
          currency: string
          emergency_keywords: string[]
          id: string
          logo_url: string | null
          name: string
          owner_profile_id: string
          primary_color: string
          secondary_color: string
          show_branding_in_emails: boolean
          show_logo_in_chat: boolean
          slug: string
          specialty_type: string
          tagline: string | null
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          ai_instructions?: string | null
          ai_response_length?: string
          ai_tone?: string
          appointment_keywords?: string[]
          business_hours?: Json
          created_at?: string
          currency?: string
          emergency_keywords?: string[]
          id?: string
          logo_url?: string | null
          name: string
          owner_profile_id: string
          primary_color?: string
          secondary_color?: string
          show_branding_in_emails?: boolean
          show_logo_in_chat?: boolean
          slug: string
          specialty_type?: string
          tagline?: string | null
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          ai_instructions?: string | null
          ai_response_length?: string
          ai_tone?: string
          appointment_keywords?: string[]
          business_hours?: Json
          created_at?: string
          currency?: string
          emergency_keywords?: string[]
          id?: string
          logo_url?: string | null
          name?: string
          owner_profile_id?: string
          primary_color?: string
          secondary_color?: string
          show_branding_in_emails?: boolean
          show_logo_in_chat?: boolean
          slug?: string
          specialty_type?: string
          tagline?: string | null
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_settings: {
        Row: {
          clinic_name: string | null
          created_at: string
          dentist_id: string
          id: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          updated_at: string
        }
        Insert: {
          clinic_name?: string | null
          created_at?: string
          dentist_id: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          updated_at?: string
        }
        Update: {
          clinic_name?: string | null
          created_at?: string
          dentist_id?: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_settings_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: true
            referencedRelation: "providers_backup"
            referencedColumns: ["id"]
          },
        ]
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
          is_available: boolean
          start_time: string
          updated_at: string
        }
        Insert: {
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          day_of_week: number
          dentist_id: string
          end_time?: string
          id?: string
          is_available?: boolean
          start_time?: string
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
          is_available?: boolean
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
          {
            foreignKeyName: "dentist_availability_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      dentist_vacation_days: {
        Row: {
          created_at: string
          dentist_id: string
          end_date: string
          id: string
          is_approved: boolean
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
          is_approved?: boolean
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
          is_approved?: boolean
          reason?: string | null
          start_date?: string
          updated_at?: string
          vacation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dentist_vacation_days_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dentist_vacation_days_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      dentists: {
        Row: {
          average_rating: number
          communication_score: number
          created_at: string
          email: string | null
          expertise_score: number
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          license_number: string | null
          profile_id: string
          specialization: string | null
          total_ratings: number
          updated_at: string
          wait_time_score: number
        }
        Insert: {
          average_rating?: number
          communication_score?: number
          created_at?: string
          email?: string | null
          expertise_score?: number
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          license_number?: string | null
          profile_id: string
          specialization?: string | null
          total_ratings?: number
          updated_at?: string
          wait_time_score?: number
        }
        Update: {
          average_rating?: number
          communication_score?: number
          created_at?: string
          email?: string | null
          expertise_score?: number
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          license_number?: string | null
          profile_id?: string
          specialization?: string | null
          total_ratings?: number
          updated_at?: string
          wait_time_score?: number
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
          action_url: string | null
          category: string
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          category?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          category?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_items: {
        Row: {
          code: string | null
          created_at: string
          description: string
          id: string
          payment_request_id: string
          quantity: number
          tax_cents: number | null
          unit_price_cents: number
        }
        Insert: {
          code?: string | null
          created_at?: string
          description: string
          id?: string
          payment_request_id: string
          quantity?: number
          tax_cents?: number | null
          unit_price_cents: number
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string
          id?: string
          payment_request_id?: string
          quantity?: number
          tax_cents?: number | null
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_items_payment_request_id_fkey"
            columns: ["payment_request_id"]
            isOneToOne: false
            referencedRelation: "payment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_reminders: {
        Row: {
          channel: string
          created_at: string
          id: string
          metadata: Json | null
          payment_request_id: string
          sent_at: string | null
          status: string
          template_key: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          payment_request_id: string
          sent_at?: string | null
          status?: string
          template_key: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          payment_request_id?: string
          sent_at?: string | null
          status?: string
          template_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_reminders_payment_request_id_fkey"
            columns: ["payment_request_id"]
            isOneToOne: false
            referencedRelation: "payment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          amount: number
          appointment_id: string | null
          channels: string[] | null
          created_at: string
          created_by: string | null
          dentist_id: string
          description: string
          due_date: string | null
          id: string
          last_reminder_at: string | null
          paid_at: string | null
          patient_email: string
          patient_id: string
          reminder_cadence_days: number[] | null
          status: string
          stripe_session_id: string | null
          terms_due_in_days: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          channels?: string[] | null
          created_at?: string
          created_by?: string | null
          dentist_id: string
          description: string
          due_date?: string | null
          id?: string
          last_reminder_at?: string | null
          paid_at?: string | null
          patient_email: string
          patient_id: string
          reminder_cadence_days?: number[] | null
          status?: string
          stripe_session_id?: string | null
          terms_due_in_days?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          channels?: string[] | null
          created_at?: string
          created_by?: string | null
          dentist_id?: string
          description?: string
          due_date?: string | null
          id?: string
          last_reminder_at?: string | null
          paid_at?: string | null
          patient_email?: string
          patient_id?: string
          reminder_cadence_days?: number[] | null
          status?: string
          stripe_session_id?: string | null
          terms_due_in_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          ai_opt_out: boolean
          created_at: string
          date_of_birth: string | null
          email: string | null
          emergency_contact: string | null
          first_name: string | null
          id: string
          import_session_id: string | null
          last_name: string | null
          medical_history: string | null
          phone: string | null
          profile_completion_status: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          ai_opt_out?: boolean
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          first_name?: string | null
          id?: string
          import_session_id?: string | null
          last_name?: string | null
          medical_history?: string | null
          phone?: string | null
          profile_completion_status?: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          ai_opt_out?: boolean
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          first_name?: string | null
          id?: string
          import_session_id?: string | null
          last_name?: string | null
          medical_history?: string | null
          phone?: string | null
          profile_completion_status?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_business_map: {
        Row: {
          business_id: string
          created_at: string
          id: string
          provider_id: string
          role: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          provider_id: string
          role: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          provider_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_business_map_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_business_map_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      providers_backup: {
        Row: {
          average_rating: number
          communication_score: number
          created_at: string
          expertise_score: number
          id: string
          is_active: boolean
          license_number: string | null
          profile_id: string
          specialization: string | null
          total_ratings: number
          updated_at: string
          wait_time_score: number
        }
        Insert: {
          average_rating?: number
          communication_score?: number
          created_at?: string
          expertise_score?: number
          id?: string
          is_active?: boolean
          license_number?: string | null
          profile_id: string
          specialization?: string | null
          total_ratings?: number
          updated_at?: string
          wait_time_score?: number
        }
        Update: {
          average_rating?: number
          communication_score?: number
          created_at?: string
          expertise_score?: number
          id?: string
          is_active?: boolean
          license_number?: string | null
          profile_id?: string
          specialization?: string | null
          total_ratings?: number
          updated_at?: string
          wait_time_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "providers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          features: Json
          id: string
          is_active: boolean
          name: string
          price_monthly: number
          price_yearly: number
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
          stripe_product_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          price_monthly: number
          price_yearly: number
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          price_monthly?: number
          price_yearly?: number
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          dentist_id: string
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          dentist_id: string
          id?: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          dentist_id?: string
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      providers: {
        Row: {
          average_rating: number | null
          communication_score: number | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          license_number: string | null
          profile_id: string | null
          specialization: string | null
          total_ratings: number | null
          updated_at: string | null
          wait_time_score: number | null
        }
        Insert: {
          average_rating?: number | null
          communication_score?: number | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          license_number?: string | null
          profile_id?: string | null
          specialization?: string | null
          total_ratings?: number | null
          updated_at?: string | null
          wait_time_score?: number | null
        }
        Update: {
          average_rating?: number | null
          communication_score?: number | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          license_number?: string | null
          profile_id?: string | null
          specialization?: string | null
          total_ratings?: number | null
          updated_at?: string | null
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
    }
    Functions: {
      assign_provider_role: { Args: never; Returns: undefined }
      book_appointment_slot: {
        Args: {
          p_appointment_id: string
          p_dentist_id: string
          p_slot_date: string
          p_slot_time: string
        }
        Returns: boolean
      }
      check_clinic_registration: {
        Args: { business_slug: string }
        Returns: Json
      }
      ensure_daily_slots: {
        Args: { p_date: string; p_dentist_id: string }
        Returns: undefined
      }
      generate_daily_slots: {
        Args: { p_date: string; p_dentist_id: string }
        Returns: undefined
      }
      is_active_dentist_profile: {
        Args: { p_profile_id: string }
        Returns: boolean
      }
      is_dentist_patient: {
        Args: { patient_profile_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "provider" | "customer" | "staff" | "patient"
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
      app_role: ["admin", "provider", "customer", "staff", "patient"],
    },
  },
} as const
