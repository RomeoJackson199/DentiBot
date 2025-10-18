// Generic platform types for multi-business appointment booking

export type AppRole = 'admin' | 'provider' | 'customer' | 'staff';

export interface Business {
  id: string;
  owner_profile_id: string;
  name: string;
  slug: string;
  tagline?: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  business_hours: Record<string, any>;
  currency: string;
  specialty_type: string;
  ai_instructions?: string;
  ai_tone: string;
  ai_response_length: string;
  welcome_message?: string;
  appointment_keywords: string[];
  emergency_keywords: string[];
  show_logo_in_chat: boolean;
  show_branding_in_emails: boolean;
  created_at: string;
  updated_at: string;
}

export interface Provider {
  id: string;
  profile_id: string;
  specialization?: string;
  license_number?: string;
  is_active: boolean;
  average_rating: number;
  total_ratings: number;
  expertise_score: number;
  communication_score: number;
  wait_time_score: number;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  duration_minutes: number;
  price_cents?: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProviderBusinessMap {
  id: string;
  provider_id: string;
  business_id: string;
  role: 'owner' | 'member';
  created_at: string;
}
