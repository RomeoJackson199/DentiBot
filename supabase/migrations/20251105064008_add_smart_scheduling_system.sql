-- Smart Scheduling System Migration
-- Adds intelligent scheduling features: appointment types, patient preferences, capacity management, and buffer times

-- ============================================================================
-- 1. APPOINTMENT TYPES
-- ============================================================================

-- Create enum for appointment types
CREATE TYPE public.appointment_type_category AS ENUM (
  'checkup',
  'cleaning',
  'filling',
  'extraction',
  'root_canal',
  'crown',
  'whitening',
  'orthodontics',
  'emergency',
  'consultation',
  'other'
);

-- Create appointment types table with duration and buffer time
CREATE TABLE public.appointment_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category appointment_type_category NOT NULL,
  description TEXT,
  default_duration_minutes INTEGER NOT NULL DEFAULT 30,
  buffer_time_after_minutes INTEGER NOT NULL DEFAULT 0,
  color TEXT, -- for UI display
  requires_followup BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, name)
);

-- Add appointment_type_id to appointments table
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS appointment_type_id UUID REFERENCES public.appointment_types(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_appointments_type ON public.appointments(appointment_type_id);
CREATE INDEX IF NOT EXISTS idx_appointment_types_business ON public.appointment_types(business_id);

-- ============================================================================
-- 2. PATIENT PREFERENCES & HISTORY
-- ============================================================================

-- Create patient preferences table to track booking patterns
CREATE TABLE public.patient_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  -- Preferred times (learned from history)
  preferred_time_of_day TEXT[], -- e.g., ['morning', 'afternoon', 'evening']
  preferred_days_of_week INTEGER[], -- 0-6
  preferred_dentist_id UUID REFERENCES public.dentists(id) ON DELETE SET NULL,

  -- Communication preferences
  preferred_reminder_hours INTEGER DEFAULT 24,

  -- Historical patterns (auto-calculated)
  total_appointments INTEGER DEFAULT 0,
  completed_appointments INTEGER DEFAULT 0,
  cancelled_appointments INTEGER DEFAULT 0,
  no_show_count INTEGER DEFAULT 0,
  no_show_rate DECIMAL(5,2) DEFAULT 0.00, -- percentage
  average_booking_lead_time_days INTEGER, -- how far in advance they book

  -- Risk scoring
  reliability_score DECIMAL(5,2) DEFAULT 100.00, -- 0-100, higher is better

  last_calculated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  UNIQUE(patient_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_patient_preferences_patient ON public.patient_preferences(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_preferences_business ON public.patient_preferences(business_id);

-- ============================================================================
-- 3. DENTIST CAPACITY MANAGEMENT
-- ============================================================================

-- Create dentist capacity settings table
CREATE TABLE public.dentist_capacity_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dentist_id UUID NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  -- Capacity limits
  max_appointments_per_day INTEGER DEFAULT 16,
  max_appointments_per_hour INTEGER DEFAULT 2,

  -- Emergency slots
  emergency_slots_per_day INTEGER DEFAULT 2,
  emergency_slot_release_hours INTEGER DEFAULT 24, -- release if unused after X hours

  -- Buffer times
  default_buffer_minutes INTEGER DEFAULT 5,
  buffer_before_lunch_minutes INTEGER DEFAULT 10,
  buffer_after_lunch_minutes INTEGER DEFAULT 10,

  -- Expertise matching (for intelligent recommendations)
  expertise_categories appointment_type_category[],

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  UNIQUE(dentist_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_capacity_dentist ON public.dentist_capacity_settings(dentist_id);
CREATE INDEX IF NOT EXISTS idx_capacity_business ON public.dentist_capacity_settings(business_id);

-- ============================================================================
-- 4. SLOT RECOMMENDATIONS TRACKING
-- ============================================================================

-- Track recommended slots shown to patients (for learning)
CREATE TABLE public.slot_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dentist_id UUID NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  recommended_slots JSONB NOT NULL, -- array of {time, score, reason}
  selected_slot TIMESTAMP WITH TIME ZONE,
  was_recommended BOOLEAN DEFAULT false, -- did they pick a recommended slot?

  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_patient ON public.slot_recommendations(patient_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_created ON public.slot_recommendations(created_at);

-- ============================================================================
-- 5. RESCHEDULE SUGGESTIONS
-- ============================================================================

-- Track rescheduling suggestions and outcomes
CREATE TABLE public.reschedule_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  reason TEXT, -- 'dentist_vacation', 'dentist_cancelled', 'patient_requested'
  suggested_slots JSONB NOT NULL, -- array of alternative slots with scores

  accepted_slot TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  was_auto_rescheduled BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reschedule_suggestions_appointment ON public.reschedule_suggestions(original_appointment_id);

-- ============================================================================
-- 6. FUNCTIONS FOR SMART SCHEDULING
-- ============================================================================

-- Function to calculate patient preferences from appointment history
CREATE OR REPLACE FUNCTION public.calculate_patient_preferences(p_patient_id UUID, p_business_id UUID)
RETURNS void AS $$
DECLARE
  v_total INTEGER;
  v_completed INTEGER;
  v_cancelled INTEGER;
  v_no_show INTEGER;
  v_no_show_rate DECIMAL(5,2);
  v_reliability_score DECIMAL(5,2);
  v_preferred_times TEXT[];
  v_preferred_days INTEGER[];
BEGIN
  -- Count appointment statistics
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'cancelled'),
    COUNT(*) FILTER (WHERE status = 'cancelled' AND notes ILIKE '%no show%' OR notes ILIKE '%no-show%')
  INTO v_total, v_completed, v_cancelled, v_no_show
  FROM public.appointments
  WHERE patient_id = p_patient_id AND business_id = p_business_id;

  -- Calculate no-show rate
  IF v_total > 0 THEN
    v_no_show_rate := (v_no_show::DECIMAL / v_total::DECIMAL) * 100;
  ELSE
    v_no_show_rate := 0;
  END IF;

  -- Calculate reliability score (100 - weighted penalty for cancellations and no-shows)
  v_reliability_score := 100 - (v_no_show_rate * 2) - ((v_cancelled - v_no_show)::DECIMAL / GREATEST(v_total, 1) * 50);
  v_reliability_score := GREATEST(0, LEAST(100, v_reliability_score));

  -- Determine preferred times of day (from appointment history)
  SELECT ARRAY_AGG(DISTINCT time_category) INTO v_preferred_times
  FROM (
    SELECT
      CASE
        WHEN EXTRACT(HOUR FROM appointment_date) < 12 THEN 'morning'
        WHEN EXTRACT(HOUR FROM appointment_date) < 17 THEN 'afternoon'
        ELSE 'evening'
      END as time_category
    FROM public.appointments
    WHERE patient_id = p_patient_id
      AND business_id = p_business_id
      AND status = 'completed'
    ORDER BY created_at DESC
    LIMIT 10
  ) recent_times;

  -- Determine preferred days of week
  SELECT ARRAY_AGG(DISTINCT day_of_week) INTO v_preferred_days
  FROM (
    SELECT EXTRACT(DOW FROM appointment_date)::INTEGER as day_of_week
    FROM public.appointments
    WHERE patient_id = p_patient_id
      AND business_id = p_business_id
      AND status = 'completed'
    ORDER BY created_at DESC
    LIMIT 10
  ) recent_days;

  -- Upsert preferences
  INSERT INTO public.patient_preferences (
    patient_id,
    business_id,
    total_appointments,
    completed_appointments,
    cancelled_appointments,
    no_show_count,
    no_show_rate,
    reliability_score,
    preferred_time_of_day,
    preferred_days_of_week,
    last_calculated_at
  ) VALUES (
    p_patient_id,
    p_business_id,
    v_total,
    v_completed,
    v_cancelled,
    v_no_show,
    v_no_show_rate,
    v_reliability_score,
    v_preferred_times,
    v_preferred_days,
    now()
  )
  ON CONFLICT (patient_id, business_id)
  DO UPDATE SET
    total_appointments = EXCLUDED.total_appointments,
    completed_appointments = EXCLUDED.completed_appointments,
    cancelled_appointments = EXCLUDED.cancelled_appointments,
    no_show_count = EXCLUDED.no_show_count,
    no_show_rate = EXCLUDED.no_show_rate,
    reliability_score = EXCLUDED.reliability_score,
    preferred_time_of_day = EXCLUDED.preferred_time_of_day,
    preferred_days_of_week = EXCLUDED.preferred_days_of_week,
    last_calculated_at = EXCLUDED.last_calculated_at,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Function to get dentist daily capacity usage
CREATE OR REPLACE FUNCTION public.get_dentist_capacity_usage(
  p_dentist_id UUID,
  p_date DATE,
  p_business_id UUID
)
RETURNS TABLE (
  total_slots INTEGER,
  booked_slots INTEGER,
  available_slots INTEGER,
  capacity_percentage DECIMAL(5,2),
  is_near_capacity BOOLEAN,
  is_overbooked BOOLEAN
) AS $$
DECLARE
  v_max_appointments INTEGER;
BEGIN
  -- Get max appointments setting
  SELECT max_appointments_per_day INTO v_max_appointments
  FROM public.dentist_capacity_settings
  WHERE dentist_id = p_dentist_id AND business_id = p_business_id;

  -- Default to 16 if not set
  v_max_appointments := COALESCE(v_max_appointments, 16);

  RETURN QUERY
  SELECT
    v_max_appointments as total_slots,
    COUNT(*)::INTEGER as booked_slots,
    (v_max_appointments - COUNT(*))::INTEGER as available_slots,
    (COUNT(*)::DECIMAL / v_max_appointments::DECIMAL * 100)::DECIMAL(5,2) as capacity_percentage,
    (COUNT(*) >= v_max_appointments * 0.8)::BOOLEAN as is_near_capacity,
    (COUNT(*) > v_max_appointments)::BOOLEAN as is_overbooked
  FROM public.appointments
  WHERE dentist_id = p_dentist_id
    AND business_id = p_business_id
    AND DATE(appointment_date) = p_date
    AND status != 'cancelled';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. DEFAULT DATA
-- ============================================================================

-- Insert default appointment types for each business
INSERT INTO public.appointment_types (business_id, name, category, default_duration_minutes, buffer_time_after_minutes, color)
SELECT
  id as business_id,
  'Routine Checkup' as name,
  'checkup' as category,
  30 as default_duration_minutes,
  5 as buffer_time_after_minutes,
  '#10B981' as color
FROM public.businesses
ON CONFLICT (business_id, name) DO NOTHING;

INSERT INTO public.appointment_types (business_id, name, category, default_duration_minutes, buffer_time_after_minutes, color)
SELECT
  id as business_id,
  'Teeth Cleaning' as name,
  'cleaning' as category,
  45 as default_duration_minutes,
  10 as buffer_time_after_minutes,
  '#3B82F6' as color
FROM public.businesses
ON CONFLICT (business_id, name) DO NOTHING;

INSERT INTO public.appointment_types (business_id, name, category, default_duration_minutes, buffer_time_after_minutes, color)
SELECT
  id as business_id,
  'Filling' as name,
  'filling' as category,
  60 as default_duration_minutes,
  15 as buffer_time_after_minutes,
  '#F59E0B' as color
FROM public.businesses
ON CONFLICT (business_id, name) DO NOTHING;

INSERT INTO public.appointment_types (business_id, name, category, default_duration_minutes, buffer_time_after_minutes, color)
SELECT
  id as business_id,
  'Emergency' as name,
  'emergency' as category,
  45 as default_duration_minutes,
  0 as buffer_time_after_minutes,
  '#EF4444' as color
FROM public.businesses
ON CONFLICT (business_id, name) DO NOTHING;

INSERT INTO public.appointment_types (business_id, name, category, default_duration_minutes, buffer_time_after_minutes, color)
SELECT
  id as business_id,
  'Consultation' as name,
  'consultation' as category,
  20 as default_duration_minutes,
  5 as buffer_time_after_minutes,
  '#8B5CF6' as color
FROM public.businesses
ON CONFLICT (business_id, name) DO NOTHING;

-- Insert default capacity settings for each dentist
INSERT INTO public.dentist_capacity_settings (dentist_id, business_id)
SELECT d.id, d.business_id
FROM public.dentists d
WHERE NOT EXISTS (
  SELECT 1 FROM public.dentist_capacity_settings dcs
  WHERE dcs.dentist_id = d.id AND dcs.business_id = d.business_id
);

-- ============================================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dentist_capacity_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reschedule_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointment_types
CREATE POLICY "Users can view appointment types for their business" ON public.appointment_types
  FOR SELECT USING (
    business_id IN (
      SELECT business_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage appointment types" ON public.appointment_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND business_id = appointment_types.business_id
    )
  );

-- RLS Policies for patient_preferences
CREATE POLICY "Patients can view their own preferences" ON public.patient_preferences
  FOR SELECT USING (
    patient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "System can manage patient preferences" ON public.patient_preferences
  FOR ALL USING (true);

-- RLS Policies for dentist_capacity_settings
CREATE POLICY "Dentists can view their capacity settings" ON public.dentist_capacity_settings
  FOR SELECT USING (
    dentist_id IN (
      SELECT d.id FROM public.dentists d
      JOIN public.profiles p ON d.profile_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage capacity settings" ON public.dentist_capacity_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND business_id = dentist_capacity_settings.business_id
    )
  );

-- RLS Policies for slot_recommendations
CREATE POLICY "Users can view their recommendations" ON public.slot_recommendations
  FOR SELECT USING (
    patient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR dentist_id IN (
      SELECT d.id FROM public.dentists d
      JOIN public.profiles p ON d.profile_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- RLS Policies for reschedule_suggestions
CREATE POLICY "Users can view their reschedule suggestions" ON public.reschedule_suggestions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = reschedule_suggestions.original_appointment_id
      AND (
        a.patient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        OR a.dentist_id IN (
          SELECT d.id FROM public.dentists d
          JOIN public.profiles p ON d.profile_id = p.id
          WHERE p.user_id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- 9. TRIGGERS
-- ============================================================================

-- Trigger to update timestamps
CREATE TRIGGER update_appointment_types_updated_at
  BEFORE UPDATE ON public.appointment_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_preferences_updated_at
  BEFORE UPDATE ON public.patient_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_capacity_settings_updated_at
  BEFORE UPDATE ON public.dentist_capacity_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-calculate patient preferences when appointments are completed/cancelled
CREATE OR REPLACE FUNCTION public.trigger_update_patient_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on status changes to completed or cancelled
  IF (TG_OP = 'UPDATE' AND NEW.status IN ('completed', 'cancelled') AND NEW.status != OLD.status)
     OR (TG_OP = 'INSERT' AND NEW.status IN ('completed', 'cancelled')) THEN
    PERFORM public.calculate_patient_preferences(NEW.patient_id, NEW.business_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_patient_preferences_on_appointment_change
  AFTER INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_patient_preferences();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add comment for documentation
COMMENT ON TABLE public.appointment_types IS 'Defines different types of appointments with specific durations and buffer times for smart scheduling';
COMMENT ON TABLE public.patient_preferences IS 'Tracks patient booking patterns and reliability for intelligent slot recommendations';
COMMENT ON TABLE public.dentist_capacity_settings IS 'Manages dentist capacity limits and buffer times for workload balancing';
COMMENT ON TABLE public.slot_recommendations IS 'Logs recommended slots shown to patients for learning and optimization';
COMMENT ON TABLE public.reschedule_suggestions IS 'Tracks auto-rescheduling suggestions and their outcomes';
