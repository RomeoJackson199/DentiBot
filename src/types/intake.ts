/**
 * TypeScript types for AI Conversational Intake and Dentist Matching System
 */

// =====================================================
// ENUMS
// =====================================================

export type IntakeStatus =
  | 'started'
  | 'collecting_symptoms'
  | 'assessing_urgency'
  | 'collecting_history'
  | 'matching_dentist'
  | 'selecting_appointment'
  | 'completed'
  | 'abandoned';

export type SymptomCategory =
  | 'pain'
  | 'bleeding'
  | 'swelling'
  | 'sensitivity'
  | 'cosmetic'
  | 'broken_tooth'
  | 'missing_tooth'
  | 'jaw_issues'
  | 'gum_issues'
  | 'routine_checkup'
  | 'other';

export type SpecializationType =
  | 'general_dentistry'
  | 'orthodontics'
  | 'endodontics'
  | 'periodontics'
  | 'oral_surgery'
  | 'pediatric_dentistry'
  | 'prosthodontics'
  | 'cosmetic_dentistry'
  | 'implantology'
  | 'emergency_care';

// =====================================================
// CORE INTAKE INTERFACES
// =====================================================

export interface Symptom {
  text: string;
  category: SymptomCategory;
  severity?: number; // 1-10
  duration?: string;
  triggers?: string[];
  notes?: string;
}

export interface IntakeSession {
  id: string;
  business_id: string;
  patient_id?: string;
  session_id: string;

  // Intake data
  status: IntakeStatus;
  symptoms_collected: Symptom[];
  chief_complaint?: string;
  pain_level?: number; // 0-10
  duration_of_symptoms?: string;
  urgency_score?: number; // 1-10
  urgency_reasoning?: string;

  // Medical context
  medical_history_notes?: string;
  current_medications?: string[];
  allergies?: string[];
  previous_dental_work?: string;
  insurance_info?: InsuranceInfo;

  // Matching results
  matched_dentist_ids?: string[];
  matching_reasoning?: DentistMatchReasoning[];
  selected_dentist_id?: string;
  alternative_dentists_shown: boolean;

  // Appointment details
  selected_appointment_slot?: string;
  appointment_id?: string;

  // Conversation tracking
  conversation_history: ChatMessage[];
  ai_questions_asked: string[];
  total_messages: number;
  patient_response_count: number;

  // Analytics
  intake_duration_seconds?: number;
  abandoned_at_step?: IntakeStatus;
  conversion_score?: number;

  // Timestamps
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    symptom_extracted?: Symptom;
    urgency_detected?: number;
    widget_triggered?: string;
    [key: string]: unknown;
  };
}

export interface InsuranceInfo {
  provider?: string;
  policy_number?: string;
  group_number?: string;
  has_insurance: boolean;
}

// =====================================================
// DENTIST MATCHING INTERFACES
// =====================================================

export interface DentistSpecialization {
  id: string;
  business_id: string;
  dentist_id: string;

  // Specialization details
  specialization_type: SpecializationType;
  is_primary: boolean;
  proficiency_level: number; // 1-5
  years_experience?: number;
  certifications?: string[];

  // Matching keywords
  keywords: string[];
  symptom_categories: SymptomCategory[];

  // Matching weights
  confidence_level: number; // 1-100
  priority_score: number; // Higher = higher priority

  // Metadata
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DentistMatchResult {
  dentist_id: string;
  dentist_info: DentistInfo;

  // Matching scores
  overall_match_score: number; // 0-100
  specialization_match_score: number;
  availability_score: number;
  patient_preference_score: number;
  urgency_compatibility_score: number;

  // AI reasoning
  match_reasoning: string;
  match_highlights: string[];

  // Ranking
  recommendation_rank: number;
  was_shown_to_patient: boolean;
  was_selected: boolean;
}

export interface DentistInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  specializations: DentistSpecialization[];
  experience_years?: number;
  languages?: string[];
  rating?: number;
  review_count?: number;
  next_available_slot?: string;
  clinic_address?: string;
}

export interface DentistMatchReasoning {
  dentist_id: string;
  score: number;
  reasoning: string;
  highlights: string[];
  specialization_match: {
    matched_categories: SymptomCategory[];
    matched_keywords: string[];
    confidence: number;
  };
  availability: {
    earliest_slot: string;
    total_available_slots: number;
  };
}

// =====================================================
// SYMPTOM MAPPING INTERFACES
// =====================================================

export interface SymptomMapping {
  id: string;
  business_id: string;

  // Symptom details
  symptom_text: string;
  symptom_category: SymptomCategory;
  urgency_indicator: number; // 1-10

  // Mapping to specializations
  recommended_specializations: SpecializationType[];
  keywords: string[];

  // Follow-up questions
  followup_questions: string[];

  // Metadata
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// =====================================================
// AI CONVERSATION INTERFACES
// =====================================================

export interface IntakeConversationContext {
  sessionId: string;
  currentStep: IntakeStatus;
  collectedData: {
    symptoms: Symptom[];
    painLevel?: number;
    urgencyScore?: number;
    medicalHistory?: string[];
    allergies?: string[];
    medications?: string[];
  };
  nextQuestion?: string;
  widgetToShow?: IntakeWidget;
}

export interface IntakeWidget {
  type: IntakeWidgetType;
  data: Record<string, unknown>;
  title?: string;
  description?: string;
}

export type IntakeWidgetType =
  | 'symptom-selector'
  | 'pain-scale'
  | 'urgency-assessment'
  | 'medical-history'
  | 'dentist-recommendation'
  | 'appointment-calendar'
  | 'time-slot-selector'
  | 'confirmation';

// =====================================================
// AI REQUEST/RESPONSE INTERFACES
// =====================================================

export interface IntakeAIRequest {
  session_id: string;
  patient_message: string;
  conversation_history: ChatMessage[];
  current_step: IntakeStatus;
  collected_symptoms: Symptom[];
  business_id: string;
}

export interface IntakeAIResponse {
  response_message: string;
  extracted_symptoms?: Symptom[];
  urgency_assessment?: UrgencyAssessment;
  next_step: IntakeStatus;
  next_question?: string;
  widget?: IntakeWidget;
  should_match_dentist: boolean;
  metadata?: {
    confidence: number;
    reasoning: string;
  };
}

export interface UrgencyAssessment {
  score: number; // 1-10
  level: 'low' | 'medium' | 'high' | 'urgent' | 'emergency';
  reasoning: string;
  requires_immediate_care: boolean;
  recommended_timeframe: string; // "within 24 hours", "within a week", etc.
}

export interface DentistMatchingRequest {
  session_id: string;
  symptoms: Symptom[];
  urgency_score: number;
  patient_preferences?: PatientPreferences;
  available_dentists: DentistInfo[];
  business_id: string;
}

export interface DentistMatchingResponse {
  matched_dentists: DentistMatchResult[];
  top_recommendation: DentistMatchResult;
  matching_summary: string;
  alternative_recommendations: DentistMatchResult[];
  reasoning: string;
}

export interface PatientPreferences {
  preferred_dentist_id?: string;
  preferred_language?: string;
  preferred_time_of_day?: string[]; // ["morning", "afternoon", "evening"]
  preferred_days?: number[]; // [0-6, 0 = Sunday]
  gender_preference?: 'male' | 'female' | 'no_preference';
}

// =====================================================
// ANALYTICS INTERFACES
// =====================================================

export interface IntakeAnalytics {
  id: string;
  business_id: string;
  date: string;

  // Intake metrics
  total_intakes_started: number;
  total_intakes_completed: number;
  total_intakes_abandoned: number;
  completion_rate: number;

  // Abandonment analysis
  abandoned_at_symptoms: number;
  abandoned_at_urgency: number;
  abandoned_at_history: number;
  abandoned_at_matching: number;
  abandoned_at_booking: number;

  // Matching metrics
  average_match_score: number;
  top_recommendation_selection_rate: number;
  alternative_dentist_view_rate: number;

  // Conversion metrics
  intake_to_booking_conversion: number;
  average_intake_duration_seconds: number;

  // Popular symptoms
  most_common_symptoms: Record<string, number>;
  urgency_distribution: Record<number, number>;

  created_at: string;
  updated_at: string;
}

// =====================================================
// HELPER TYPES
// =====================================================

export interface IntakeFlowStep {
  step: IntakeStatus;
  title: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface IntakeProgress {
  currentStep: IntakeStatus;
  completedSteps: IntakeStatus[];
  totalSteps: number;
  progressPercentage: number;
}

export interface DentistRecommendationDisplay {
  dentist: DentistInfo;
  matchResult: DentistMatchResult;
  highlightedFeatures: string[];
  availableSlots: AppointmentSlot[];
  isTopRecommendation: boolean;
}

export interface AppointmentSlot {
  date: string;
  time: string;
  duration_minutes: number;
  is_available: boolean;
  is_recommended?: boolean;
  recommendation_reason?: string;
}

// =====================================================
// FORM INTERFACES
// =====================================================

export interface IntakeSymptomForm {
  symptom_text: string;
  category: SymptomCategory;
  severity: number;
  duration: string;
  additional_notes?: string;
}

export interface IntakeMedicalHistoryForm {
  allergies: string[];
  current_medications: string[];
  medical_conditions: string[];
  previous_dental_work?: string;
  last_dental_visit?: string;
}

export interface IntakeInsuranceForm {
  has_insurance: boolean;
  provider?: string;
  policy_number?: string;
  group_number?: string;
}

// =====================================================
// EVENT TYPES
// =====================================================

export interface IntakeEvent {
  type: IntakeEventType;
  session_id: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export type IntakeEventType =
  | 'intake_started'
  | 'symptom_collected'
  | 'urgency_assessed'
  | 'medical_history_collected'
  | 'dentist_matched'
  | 'dentist_selected'
  | 'appointment_scheduled'
  | 'intake_completed'
  | 'intake_abandoned';

// =====================================================
// UTILITY TYPES
// =====================================================

export type PartialIntakeSession = Partial<IntakeSession> & {
  session_id: string;
};

export type IntakeSessionUpdate = {
  session_id: string;
  updates: Partial<IntakeSession>;
};

export type DentistWithMatch = DentistInfo & {
  match_result?: DentistMatchResult;
};
