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
          business_id: string
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
          business_id: string
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
          business_id?: string
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
            foreignKeyName: "appointment_slots_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
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
          amount_paid_cents: number | null
          appointment_date: string
          booking_source: string | null
          business_id: string
          consultation_notes: string | null
          created_at: string
          dentist_id: string
          duration_minutes: number | null
          id: string
          notes: string | null
          patient_id: string
          patient_name: string | null
          payment_intent_id: string | null
          payment_status: string | null
          reason: string
          service_id: string | null
          status: string
          updated_at: string
          urgency: string
        }
        Insert: {
          amount_paid_cents?: number | null
          appointment_date: string
          booking_source?: string | null
          business_id: string
          consultation_notes?: string | null
          created_at?: string
          dentist_id: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          patient_name?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          reason?: string
          service_id?: string | null
          status?: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          amount_paid_cents?: number | null
          appointment_date?: string
          booking_source?: string | null
          business_id?: string
          consultation_notes?: string | null
          created_at?: string
          dentist_id?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          patient_name?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          reason?: string
          service_id?: string | null
          status?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "business_services"
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
      business_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          profile_id: string
          role: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          profile_id: string
          role: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          profile_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_services: {
        Row: {
          business_id: string
          category: string | null
          created_at: string
          currency: string
          description: string | null
          duration_minutes: number | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price_cents: number
          requires_upfront_payment: boolean
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price_cents?: number
          requires_upfront_payment?: boolean
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price_cents?: number
          requires_upfront_payment?: boolean
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      businesses: {
        Row: {
          ai_greeting: string | null
          ai_instructions: string | null
          ai_personality_traits: Json | null
          ai_response_length: string
          ai_system_behavior: string | null
          ai_tone: string
          appointment_keywords: string[]
          bio: string | null
          business_hours: Json
          created_at: string
          currency: string
          custom_features: Json | null
          custom_terminology: Json | null
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
          template_type: string
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          ai_greeting?: string | null
          ai_instructions?: string | null
          ai_personality_traits?: Json | null
          ai_response_length?: string
          ai_system_behavior?: string | null
          ai_tone?: string
          appointment_keywords?: string[]
          bio?: string | null
          business_hours?: Json
          created_at?: string
          currency?: string
          custom_features?: Json | null
          custom_terminology?: Json | null
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
          template_type?: string
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          ai_greeting?: string | null
          ai_instructions?: string | null
          ai_personality_traits?: Json | null
          ai_response_length?: string
          ai_system_behavior?: string | null
          ai_tone?: string
          appointment_keywords?: string[]
          bio?: string | null
          business_hours?: Json
          created_at?: string
          currency?: string
          custom_features?: Json | null
          custom_terminology?: Json | null
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
          template_type?: string
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
          address: string | null
          clinic_name: string | null
          created_at: string
          dentist_id: string
          id: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          tagline: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          clinic_name?: string | null
          created_at?: string
          dentist_id: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          clinic_name?: string | null
          created_at?: string
          dentist_id?: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          tagline?: string | null
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
          business_id: string
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
          business_id: string
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
          business_id?: string
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
            foreignKeyName: "dentist_availability_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
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
      dentist_invitations: {
        Row: {
          business_id: string
          created_at: string
          expires_at: string
          id: string
          invited_at: string
          invitee_email: string
          invitee_profile_id: string | null
          inviter_profile_id: string
          responded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_at?: string
          invitee_email: string
          invitee_profile_id?: string | null
          inviter_profile_id: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_at?: string
          invitee_email?: string
          invitee_profile_id?: string | null
          inviter_profile_id?: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dentist_invitations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dentist_invitations_invitee_profile_id_fkey"
            columns: ["invitee_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dentist_invitations_inviter_profile_id_fkey"
            columns: ["inviter_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dentist_vacation_days: {
        Row: {
          business_id: string
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
          business_id: string
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
          business_id?: string
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
            foreignKeyName: "dentist_vacation_days_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
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
          clinic_address: string | null
          communication_score: number
          created_at: string
          email: string | null
          expertise_score: number
          first_name: string | null
          google_calendar_connected: boolean | null
          google_calendar_last_sync: string | null
          google_calendar_refresh_token: string | null
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
          clinic_address?: string | null
          communication_score?: number
          created_at?: string
          email?: string | null
          expertise_score?: number
          first_name?: string | null
          google_calendar_connected?: boolean | null
          google_calendar_last_sync?: string | null
          google_calendar_refresh_token?: string | null
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
          clinic_address?: string | null
          communication_score?: number
          created_at?: string
          email?: string | null
          expertise_score?: number
          first_name?: string | null
          google_calendar_connected?: boolean | null
          google_calendar_last_sync?: string | null
          google_calendar_refresh_token?: string | null
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
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_settings: {
        Row: {
          about_content: string | null
          about_title: string | null
          business_id: string
          created_at: string | null
          cta_link: string | null
          cta_text: string | null
          custom_sections: Json | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          is_active: boolean | null
          show_about: boolean | null
          show_services: boolean | null
          theme_config: Json | null
          updated_at: string | null
        }
        Insert: {
          about_content?: string | null
          about_title?: string | null
          business_id: string
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          custom_sections?: Json | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_active?: boolean | null
          show_about?: boolean | null
          show_services?: boolean | null
          theme_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          about_content?: string | null
          about_title?: string | null
          business_id?: string
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          custom_sections?: Json | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_active?: boolean | null
          show_about?: boolean | null
          show_services?: boolean | null
          theme_config?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homepage_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          business_id: string
          created_at: string
          dentist_id: string
          description: string | null
          findings: string | null
          id: string
          patient_id: string
          record_date: string
          record_type: string
          title: string
          treatment_provided: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          dentist_id: string
          description?: string | null
          findings?: string | null
          id?: string
          patient_id: string
          record_date?: string
          record_type?: string
          title: string
          treatment_provided?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          dentist_id?: string
          description?: string | null
          findings?: string | null
          id?: string
          patient_id?: string
          record_date?: string
          record_type?: string
          title?: string
          treatment_provided?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          business_id: string
          created_at: string
          id: string
          is_read: boolean
          message_text: string
          recipient_profile_id: string
          sender_profile_id: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_text: string
          recipient_profile_id: string
          sender_profile_id: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_text?: string
          recipient_profile_id?: string
          sender_profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_profile_id_fkey"
            columns: ["recipient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
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
      order_items: {
        Row: {
          created_at: string
          id: string
          item_status: string
          order_id: string
          prepared_at: string | null
          quantity: number
          served_at: string | null
          service_id: string
          special_instructions: string | null
          unit_price_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_status?: string
          order_id: string
          prepared_at?: string | null
          quantity?: number
          served_at?: string | null
          service_id: string
          special_instructions?: string | null
          unit_price_cents: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_status?: string
          order_id?: string
          prepared_at?: string | null
          quantity?: number
          served_at?: string | null
          service_id?: string
          special_instructions?: string | null
          unit_price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "restaurant_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "business_services"
            referencedColumns: ["id"]
          },
        ]
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
          business_id: string
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
          business_id: string
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
          business_id?: string
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
            foreignKeyName: "payment_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
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
          bio: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          emergency_contact: string | null
          first_name: string | null
          google_calendar_connected: boolean | null
          google_calendar_refresh_token: string | null
          id: string
          import_session_id: string | null
          last_name: string | null
          medical_history: string | null
          onboarding_completed: boolean | null
          phone: string | null
          profile_completion_status: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          ai_opt_out?: boolean
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          first_name?: string | null
          google_calendar_connected?: boolean | null
          google_calendar_refresh_token?: string | null
          id?: string
          import_session_id?: string | null
          last_name?: string | null
          medical_history?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          profile_completion_status?: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          ai_opt_out?: boolean
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          first_name?: string | null
          google_calendar_connected?: boolean | null
          google_calendar_refresh_token?: string | null
          id?: string
          import_session_id?: string | null
          last_name?: string | null
          medical_history?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          profile_completion_status?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          updated_at: string
          uses_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: string
          discount_value?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string
          uses_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string
          uses_count?: number | null
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
      restaurant_orders: {
        Row: {
          business_id: string
          created_at: string
          id: string
          notes: string | null
          order_status: string
          payment_status: string
          reservation_id: string | null
          subtotal_cents: number
          table_id: string | null
          tax_cents: number
          total_cents: number
          updated_at: string
          waiter_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          notes?: string | null
          order_status?: string
          payment_status?: string
          reservation_id?: string | null
          subtotal_cents?: number
          table_id?: string | null
          tax_cents?: number
          total_cents?: number
          updated_at?: string
          waiter_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          order_status?: string
          payment_status?: string
          reservation_id?: string | null
          subtotal_cents?: number
          table_id?: string | null
          tax_cents?: number
          total_cents?: number
          updated_at?: string
          waiter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_orders_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "table_reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_orders_waiter_id_fkey"
            columns: ["waiter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_staff_codes: {
        Row: {
          business_id: string
          code: string
          created_at: string
          created_by_profile_id: string
          id: string
          is_active: boolean
          role: string
          updated_at: string
        }
        Insert: {
          business_id: string
          code: string
          created_at?: string
          created_by_profile_id: string
          id?: string
          is_active?: boolean
          role: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          code?: string
          created_at?: string
          created_by_profile_id?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_staff_codes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_staff_codes_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_staff_roles: {
        Row: {
          business_id: string
          created_at: string
          expires_at: string | null
          id: string
          invitation_email: string | null
          invitation_status: string | null
          invitation_token: string | null
          invited_at: string | null
          invited_by_profile_id: string | null
          is_active: boolean
          profile_id: string | null
          role: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          invitation_email?: string | null
          invitation_status?: string | null
          invitation_token?: string | null
          invited_at?: string | null
          invited_by_profile_id?: string | null
          is_active?: boolean
          profile_id?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          invitation_email?: string | null
          invitation_status?: string | null
          invitation_token?: string | null
          invited_at?: string | null
          invited_by_profile_id?: string | null
          is_active?: boolean
          profile_id?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_staff_roles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_staff_roles_invited_by_profile_id_fkey"
            columns: ["invited_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_staff_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          business_id: string
          capacity: number
          created_at: string
          id: string
          is_available: boolean
          location_notes: string | null
          table_number: string
          updated_at: string
        }
        Insert: {
          business_id: string
          capacity: number
          created_at?: string
          id?: string
          is_available?: boolean
          location_notes?: string | null
          table_number: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          capacity?: number
          created_at?: string
          id?: string
          is_available?: boolean
          location_notes?: string | null
          table_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      session_business: {
        Row: {
          business_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_business_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
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
      table_reservations: {
        Row: {
          appointment_id: string
          completed_at: string | null
          created_at: string
          id: string
          party_size: number
          reservation_status: string
          seated_at: string | null
          special_requests: string | null
          table_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          party_size: number
          reservation_status?: string
          seated_at?: string | null
          special_requests?: string | null
          table_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          party_size?: number
          reservation_status?: string
          seated_at?: string | null
          special_requests?: string | null
          table_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_reservations_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_reservations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      template_change_history: {
        Row: {
          business_id: string
          changed_at: string
          from_template: string | null
          id: string
          to_template: string
        }
        Insert: {
          business_id: string
          changed_at?: string
          from_template?: string | null
          id?: string
          to_template: string
        }
        Update: {
          business_id?: string
          changed_at?: string
          from_template?: string | null
          id?: string
          to_template?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_change_history_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plans: {
        Row: {
          business_id: string
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
          updated_at: string
        }
        Insert: {
          business_id: string
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
          updated_at?: string
        }
        Update: {
          business_id?: string
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
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plans_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "dentists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profile_map: {
        Row: {
          profile_id: string
          user_id: string
        }
        Insert: {
          profile_id: string
          user_id: string
        }
        Update: {
          profile_id?: string
          user_id?: string
        }
        Relationships: []
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
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_dentist_invitation: {
        Args: { p_business_id: string; p_invitation_id: string }
        Returns: Json
      }
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
      can_view_profile_in_user_business: {
        Args: { _target_profile_id: string; _viewer_user_id: string }
        Returns: boolean
      }
      can_view_profile_in_user_business_norec: {
        Args: { _target_profile_id: string; _viewer_user_id: string }
        Returns: boolean
      }
      check_clinic_registration: {
        Args: { business_slug: string }
        Returns: Json
      }
      create_restaurant_staff_invitation: {
        Args: { p_business_id: string; p_email: string; p_role: string }
        Returns: string
      }
      ensure_daily_slots: {
        Args: { p_date: string; p_dentist_id: string }
        Returns: undefined
      }
      generate_daily_slots: {
        Args: { p_date: string; p_dentist_id: string }
        Returns: undefined
      }
      get_current_business_id: { Args: never; Returns: string }
      has_restaurant_role: {
        Args: { _business_id: string; _profile_id: string; _role: string }
        Returns: boolean
      }
      increment_promo_usage: { Args: { promo_id: string }; Returns: undefined }
      is_active_dentist_profile: {
        Args: { p_profile_id: string }
        Returns: boolean
      }
      is_business_member: {
        Args: { p_business_id: string; p_profile_id: string }
        Returns: boolean
      }
      is_business_owner: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      is_clinic_patient: {
        Args: { _business_id: string; _profile_id: string }
        Returns: boolean
      }
      is_dentist_patient: {
        Args: { patient_profile_id: string }
        Returns: boolean
      }
      is_dentist_patient_norec: {
        Args: { patient_profile_id: string }
        Returns: boolean
      }
      is_user_business_member: { Args: { _user_id: string }; Returns: boolean }
      is_user_member_of_business: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
      join_restaurant_staff_with_code: {
        Args: { p_code: string }
        Returns: Json
      }
      leave_clinic: { Args: { p_business_id?: string }; Returns: Json }
      release_appointment_slot: {
        Args: { p_appointment_id: string }
        Returns: undefined
      }
      reschedule_appointment: {
        Args: {
          p_appointment_id: string
          p_slot_date: string
          p_slot_time: string
          p_user_id: string
        }
        Returns: boolean
      }
      viewer_profile_id: { Args: { _viewer_user_id: string }; Returns: string }
    }
    Enums: {
      app_role:
        | "admin"
        | "provider"
        | "customer"
        | "staff"
        | "patient"
        | "waiter"
        | "cook"
        | "host"
        | "manager"
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
      app_role: [
        "admin",
        "provider",
        "customer",
        "staff",
        "patient",
        "waiter",
        "cook",
        "host",
        "manager",
      ],
    },
  },
} as const
