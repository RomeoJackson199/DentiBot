-- Migration: AI Conversational Intake and Dentist Matching System
-- Description: Adds tables and functions for AI-powered patient intake, symptom analysis, and intelligent dentist matching

-- =====================================================
-- ENUMS
-- =====================================================

-- Intake session status
CREATE TYPE public.intake_status AS ENUM (
  'started',
  'collecting_symptoms',
  'assessing_urgency',
  'collecting_history',
  'matching_dentist',
  'selecting_appointment',
  'completed',
  'abandoned'
);

-- Symptom categories
CREATE TYPE public.symptom_category AS ENUM (
  'pain',
  'bleeding',
  'swelling',
  'sensitivity',
  'cosmetic',
  'broken_tooth',
  'missing_tooth',
  'jaw_issues',
  'gum_issues',
  'routine_checkup',
  'other'
);

-- Dentist specialization types
CREATE TYPE public.specialization_type AS ENUM (
  'general_dentistry',
  'orthodontics',
  'endodontics',
  'periodontics',
  'oral_surgery',
  'pediatric_dentistry',
  'prosthodontics',
  'cosmetic_dentistry',
  'implantology',
  'emergency_care'
);

-- =====================================================
-- TABLE: ai_intake_sessions
-- =====================================================

CREATE TABLE public.ai_intake_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE, -- Chat session identifier

  -- Intake data
  status intake_status DEFAULT 'started' NOT NULL,
  symptoms_collected JSONB DEFAULT '[]'::jsonb, -- Array of symptom objects
  chief_complaint TEXT, -- Main reason for visit in patient's words
  pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
  duration_of_symptoms TEXT, -- "2 days", "1 week", etc.
  urgency_score INTEGER CHECK (urgency_score >= 1 AND urgency_score <= 10),
  urgency_reasoning TEXT, -- AI explanation of urgency assessment

  -- Medical context
  medical_history_notes TEXT,
  current_medications TEXT[],
  allergies TEXT[],
  previous_dental_work TEXT,
  insurance_info JSONB,

  -- Matching results
  matched_dentist_ids UUID[], -- Array of recommended dentist IDs in priority order
  matching_reasoning JSONB, -- AI explanation for each match
  selected_dentist_id UUID REFERENCES public.dentists(id),
  alternative_dentists_shown BOOLEAN DEFAULT false,

  -- Appointment details
  selected_appointment_slot TIMESTAMPTZ,
  appointment_id UUID REFERENCES public.appointments(id),

  -- Conversation tracking
  conversation_history JSONB DEFAULT '[]'::jsonb, -- Full chat transcript
  ai_questions_asked TEXT[], -- Track which questions were asked
  total_messages INTEGER DEFAULT 0,
  patient_response_count INTEGER DEFAULT 0,

  -- Analytics
  intake_duration_seconds INTEGER, -- Time from start to completion
  abandoned_at_step intake_status, -- Where user dropped off if abandoned
  conversion_score DECIMAL(5,2), -- Quality score for this intake (0-100)

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for ai_intake_sessions
CREATE INDEX idx_intake_sessions_patient ON public.ai_intake_sessions(patient_id);
CREATE INDEX idx_intake_sessions_session ON public.ai_intake_sessions(session_id);
CREATE INDEX idx_intake_sessions_business ON public.ai_intake_sessions(business_id);
CREATE INDEX idx_intake_sessions_status ON public.ai_intake_sessions(status);
CREATE INDEX idx_intake_sessions_started_at ON public.ai_intake_sessions(started_at DESC);

-- =====================================================
-- TABLE: dentist_specializations
-- =====================================================

CREATE TABLE public.dentist_specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  dentist_id UUID REFERENCES public.dentists(id) ON DELETE CASCADE NOT NULL,

  -- Specialization details
  specialization_type specialization_type NOT NULL,
  is_primary BOOLEAN DEFAULT false, -- Primary specialization
  proficiency_level INTEGER CHECK (proficiency_level >= 1 AND proficiency_level <= 5) DEFAULT 3,
  years_experience INTEGER,
  certifications TEXT[],

  -- Matching keywords
  keywords TEXT[], -- Keywords for AI matching (e.g., ["root canal", "tooth pain", "endodontic"])
  symptom_categories symptom_category[], -- Categories this specialization handles

  -- Matching weights
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 100) DEFAULT 80,
  priority_score INTEGER DEFAULT 50, -- Higher score = higher priority in matching

  -- Metadata
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  UNIQUE(dentist_id, specialization_type)
);

-- Indexes for dentist_specializations
CREATE INDEX idx_specializations_dentist ON public.dentist_specializations(dentist_id);
CREATE INDEX idx_specializations_business ON public.dentist_specializations(business_id);
CREATE INDEX idx_specializations_type ON public.dentist_specializations(specialization_type);
CREATE INDEX idx_specializations_primary ON public.dentist_specializations(is_primary) WHERE is_primary = true;

-- =====================================================
-- TABLE: intake_symptom_mapping
-- =====================================================

CREATE TABLE public.intake_symptom_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,

  -- Symptom details
  symptom_text TEXT NOT NULL, -- "Toothache", "Bleeding gums", etc.
  symptom_category symptom_category NOT NULL,
  urgency_indicator INTEGER CHECK (urgency_indicator >= 1 AND urgency_indicator <= 10) DEFAULT 5,

  -- Mapping to specializations
  recommended_specializations specialization_type[],
  keywords TEXT[], -- For AI matching

  -- Follow-up questions
  followup_questions TEXT[], -- Questions AI should ask when this symptom is mentioned

  -- Metadata
  usage_count INTEGER DEFAULT 0, -- Track how often this mapping is used
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for intake_symptom_mapping
CREATE INDEX idx_symptom_mapping_business ON public.intake_symptom_mapping(business_id);
CREATE INDEX idx_symptom_mapping_category ON public.intake_symptom_mapping(symptom_category);

-- =====================================================
-- TABLE: intake_match_results
-- =====================================================

CREATE TABLE public.intake_match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  intake_session_id UUID REFERENCES public.ai_intake_sessions(id) ON DELETE CASCADE NOT NULL,
  dentist_id UUID REFERENCES public.dentists(id) ON DELETE CASCADE NOT NULL,

  -- Matching scores
  overall_match_score DECIMAL(5,2) NOT NULL, -- 0-100
  specialization_match_score DECIMAL(5,2), -- How well specialization matches symptoms
  availability_score DECIMAL(5,2), -- Based on available appointment slots
  patient_preference_score DECIMAL(5,2), -- Based on patient history/preferences
  urgency_compatibility_score DECIMAL(5,2), -- Can handle urgency level

  -- AI reasoning
  match_reasoning TEXT, -- AI explanation of why this dentist is a good match
  match_highlights TEXT[], -- Key reasons (e.g., ["Specializes in root canals", "Available today"])

  -- Ranking
  recommendation_rank INTEGER NOT NULL, -- 1 = top recommendation, 2 = second best, etc.
  was_shown_to_patient BOOLEAN DEFAULT false,
  was_selected BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for intake_match_results
CREATE INDEX idx_match_results_intake ON public.intake_match_results(intake_session_id);
CREATE INDEX idx_match_results_dentist ON public.intake_match_results(dentist_id);
CREATE INDEX idx_match_results_business ON public.intake_match_results(business_id);
CREATE INDEX idx_match_results_rank ON public.intake_match_results(recommendation_rank);

-- =====================================================
-- TABLE: intake_analytics
-- =====================================================

CREATE TABLE public.intake_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,

  -- Time period
  date DATE NOT NULL,

  -- Intake metrics
  total_intakes_started INTEGER DEFAULT 0,
  total_intakes_completed INTEGER DEFAULT 0,
  total_intakes_abandoned INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2), -- Percentage

  -- Abandonment analysis
  abandoned_at_symptoms INTEGER DEFAULT 0,
  abandoned_at_urgency INTEGER DEFAULT 0,
  abandoned_at_history INTEGER DEFAULT 0,
  abandoned_at_matching INTEGER DEFAULT 0,
  abandoned_at_booking INTEGER DEFAULT 0,

  -- Matching metrics
  average_match_score DECIMAL(5,2),
  top_recommendation_selection_rate DECIMAL(5,2), -- How often patients pick #1 recommendation
  alternative_dentist_view_rate DECIMAL(5,2), -- How often patients view alternatives

  -- Conversion metrics
  intake_to_booking_conversion DECIMAL(5,2), -- Percentage who complete booking
  average_intake_duration_seconds INTEGER,

  -- Popular symptoms
  most_common_symptoms JSONB,
  urgency_distribution JSONB, -- Count by urgency level

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  UNIQUE(business_id, date)
);

-- Indexes for intake_analytics
CREATE INDEX idx_intake_analytics_business ON public.intake_analytics(business_id);
CREATE INDEX idx_intake_analytics_date ON public.intake_analytics(date DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.ai_intake_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dentist_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_symptom_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_analytics ENABLE ROW LEVEL SECURITY;

-- ai_intake_sessions policies
CREATE POLICY "Users can view own intake sessions"
  ON public.ai_intake_sessions FOR SELECT
  TO authenticated
  USING (
    patient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.business_id = ai_intake_sessions.business_id
      AND profiles.role IN ('dentist', 'receptionist', 'admin')
    )
  );

CREATE POLICY "Users can create own intake sessions"
  ON public.ai_intake_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id = auth.uid() OR
    patient_id IS NULL -- Anonymous intake (session_id based)
  );

CREATE POLICY "Users can update own intake sessions"
  ON public.ai_intake_sessions FOR UPDATE
  TO authenticated
  USING (
    patient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.business_id = ai_intake_sessions.business_id
      AND profiles.role IN ('dentist', 'receptionist', 'admin')
    )
  );

-- dentist_specializations policies
CREATE POLICY "Anyone can view dentist specializations"
  ON public.dentist_specializations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage dentist specializations"
  ON public.dentist_specializations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.business_id = dentist_specializations.business_id
      AND profiles.role IN ('admin', 'dentist')
    )
  );

-- intake_symptom_mapping policies
CREATE POLICY "Anyone can view symptom mappings"
  ON public.intake_symptom_mapping FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage symptom mappings"
  ON public.intake_symptom_mapping FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.business_id = intake_symptom_mapping.business_id
      AND profiles.role = 'admin'
    )
  );

-- intake_match_results policies
CREATE POLICY "Users can view own match results"
  ON public.intake_match_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_intake_sessions
      WHERE ai_intake_sessions.id = intake_match_results.intake_session_id
      AND ai_intake_sessions.patient_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.business_id = intake_match_results.business_id
      AND profiles.role IN ('dentist', 'receptionist', 'admin')
    )
  );

CREATE POLICY "System can create match results"
  ON public.intake_match_results FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- intake_analytics policies
CREATE POLICY "Staff can view analytics"
  ON public.intake_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.business_id = intake_analytics.business_id
      AND profiles.role IN ('dentist', 'receptionist', 'admin')
    )
  );

CREATE POLICY "System can manage analytics"
  ON public.intake_analytics FOR ALL
  TO authenticated
  USING (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function: Update intake session updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_intake_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ai_intake_sessions
CREATE TRIGGER update_intake_sessions_updated_at
  BEFORE UPDATE ON public.ai_intake_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_intake_session_updated_at();

-- Function: Calculate intake duration when completed
CREATE OR REPLACE FUNCTION public.calculate_intake_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
    NEW.intake_duration_seconds = EXTRACT(EPOCH FROM (now() - NEW.started_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for calculating intake duration
CREATE TRIGGER calculate_intake_duration_trigger
  BEFORE UPDATE ON public.ai_intake_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_intake_duration();

-- =====================================================
-- SEED DATA: Default Symptom Mappings
-- =====================================================

-- Note: Insert default symptom mappings (business_id should be replaced with actual business ID in application)
-- These are templates that can be used across businesses

COMMENT ON TABLE public.ai_intake_sessions IS 'Tracks AI-powered patient intake sessions with symptom collection and dentist matching';
COMMENT ON TABLE public.dentist_specializations IS 'Defines dentist specializations for intelligent patient matching';
COMMENT ON TABLE public.intake_symptom_mapping IS 'Maps symptoms to specializations and provides AI guidance';
COMMENT ON TABLE public.intake_match_results IS 'Stores dentist matching results and AI reasoning';
COMMENT ON TABLE public.intake_analytics IS 'Aggregated analytics for intake system performance';
