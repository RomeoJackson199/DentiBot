-- Migration: Add slot usage tracking for smart appointment distribution
-- Created: 2025-11-05
-- Purpose: Track appointment slot popularity to enable AI-driven slot recommendations

-- Table to track how often different time slots are booked
CREATE TABLE IF NOT EXISTS slot_usage_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  dentist_id UUID REFERENCES dentists(id) ON DELETE CASCADE,

  -- Time slot information
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  time_slot VARCHAR(5) NOT NULL, -- e.g., "09:00", "14:30"

  -- Usage statistics
  total_bookings INTEGER DEFAULT 0,
  total_available INTEGER DEFAULT 0,
  booking_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage (0-100)

  -- Recent trends (last 30 days)
  recent_bookings INTEGER DEFAULT 0,
  recent_available INTEGER DEFAULT 0,
  recent_booking_rate DECIMAL(5,2) DEFAULT 0.00,

  -- AI recommendations tracking
  times_recommended INTEGER DEFAULT 0,
  times_selected_when_recommended INTEGER DEFAULT 0,
  recommendation_success_rate DECIMAL(5,2) DEFAULT 0.00,

  -- Metadata
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one record per business/dentist/slot
  UNIQUE(business_id, dentist_id, day_of_week, time_slot)
);

-- Indexes for performance
CREATE INDEX idx_slot_usage_business ON slot_usage_statistics(business_id);
CREATE INDEX idx_slot_usage_dentist ON slot_usage_statistics(dentist_id);
CREATE INDEX idx_slot_usage_booking_rate ON slot_usage_statistics(booking_rate);
CREATE INDEX idx_slot_usage_recent_rate ON slot_usage_statistics(recent_booking_rate);
CREATE INDEX idx_slot_usage_day_hour ON slot_usage_statistics(day_of_week, hour_of_day);

-- Table to log AI recommendations and their outcomes
CREATE TABLE IF NOT EXISTS ai_slot_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dentist_id UUID NOT NULL REFERENCES dentists(id) ON DELETE CASCADE,

  -- AI recommendation details
  recommended_slots JSONB NOT NULL, -- Array of slots with AI scores and reasons
  ai_model_used VARCHAR(50) DEFAULT 'gemini-pro',
  ai_reasoning TEXT, -- Natural language explanation from AI

  -- User selection
  selected_slot VARCHAR(5),
  selected_date DATE,
  was_ai_recommended BOOLEAN DEFAULT FALSE, -- Did user pick an AI-recommended slot?
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,

  -- Outcome tracking
  appointment_completed BOOLEAN DEFAULT NULL, -- NULL = pending, TRUE = completed, FALSE = cancelled/no-show

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_recommendations_business ON ai_slot_recommendations(business_id);
CREATE INDEX idx_ai_recommendations_patient ON ai_slot_recommendations(patient_id);
CREATE INDEX idx_ai_recommendations_dentist ON ai_slot_recommendations(dentist_id);
CREATE INDEX idx_ai_recommendations_outcome ON ai_slot_recommendations(was_ai_recommended, appointment_completed);

-- Function to calculate and update slot usage statistics
CREATE OR REPLACE FUNCTION calculate_slot_usage_statistics(
  p_business_id UUID,
  p_dentist_id UUID DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_dentist_id UUID;
BEGIN
  -- If specific dentist provided, process only that dentist
  -- Otherwise process all dentists in the business
  FOR v_dentist_id IN
    SELECT COALESCE(p_dentist_id, d.id)
    FROM dentists d
    WHERE d.business_id = p_business_id
      AND (p_dentist_id IS NULL OR d.id = p_dentist_id)
  LOOP
    -- Calculate statistics for each time slot
    WITH slot_stats AS (
      SELECT
        EXTRACT(DOW FROM appointment_date)::INTEGER as day_of_week,
        EXTRACT(HOUR FROM appointment_date)::INTEGER as hour_of_day,
        TO_CHAR(appointment_date, 'HH24:MI') as time_slot,
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (
          WHERE appointment_date >= NOW() - INTERVAL '30 days'
        ) as recent_bookings
      FROM appointments
      WHERE dentist_id = v_dentist_id
        AND business_id = p_business_id
        AND status IN ('confirmed', 'completed')
        AND appointment_date >= NOW() - INTERVAL '6 months' -- Last 6 months of data
      GROUP BY day_of_week, hour_of_day, time_slot
    ),
    available_stats AS (
      -- Calculate how many times each slot was available (based on working hours)
      -- This is a simplified calculation - in reality you'd check availability table
      SELECT
        day_of_week,
        hour_of_day,
        time_slot,
        COUNT(*) * 26 as estimated_available, -- Rough estimate: 26 weeks in 6 months
        COUNT(*) * 4 as estimated_recent_available -- 4 weeks in 30 days
      FROM slot_stats
      GROUP BY day_of_week, hour_of_day, time_slot
    )
    INSERT INTO slot_usage_statistics (
      business_id,
      dentist_id,
      day_of_week,
      hour_of_day,
      time_slot,
      total_bookings,
      total_available,
      booking_rate,
      recent_bookings,
      recent_available,
      recent_booking_rate,
      last_calculated_at
    )
    SELECT
      p_business_id,
      v_dentist_id,
      s.day_of_week,
      s.hour_of_day,
      s.time_slot,
      COALESCE(s.total_bookings, 0),
      COALESCE(a.estimated_available, 1),
      ROUND((COALESCE(s.total_bookings, 0)::DECIMAL / GREATEST(a.estimated_available, 1)::DECIMAL) * 100, 2),
      COALESCE(s.recent_bookings, 0),
      COALESCE(a.estimated_recent_available, 1),
      ROUND((COALESCE(s.recent_bookings, 0)::DECIMAL / GREATEST(a.estimated_recent_available, 1)::DECIMAL) * 100, 2),
      NOW()
    FROM slot_stats s
    LEFT JOIN available_stats a USING (day_of_week, hour_of_day, time_slot)
    ON CONFLICT (business_id, dentist_id, day_of_week, time_slot)
    DO UPDATE SET
      total_bookings = EXCLUDED.total_bookings,
      total_available = EXCLUDED.total_available,
      booking_rate = EXCLUDED.booking_rate,
      recent_bookings = EXCLUDED.recent_bookings,
      recent_available = EXCLUDED.recent_available,
      recent_booking_rate = EXCLUDED.recent_booking_rate,
      last_calculated_at = NOW(),
      updated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get under-utilized slots for a dentist
CREATE OR REPLACE FUNCTION get_underutilized_slots(
  p_business_id UUID,
  p_dentist_id UUID,
  p_threshold DECIMAL DEFAULT 50.00 -- Slots with booking rate below this are considered under-utilized
)
RETURNS TABLE (
  time_slot VARCHAR(5),
  day_of_week INTEGER,
  booking_rate DECIMAL,
  recent_booking_rate DECIMAL,
  total_bookings INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sus.time_slot,
    sus.day_of_week,
    sus.booking_rate,
    sus.recent_booking_rate,
    sus.total_bookings
  FROM slot_usage_statistics sus
  WHERE sus.business_id = p_business_id
    AND sus.dentist_id = p_dentist_id
    AND sus.recent_booking_rate < p_threshold
  ORDER BY sus.recent_booking_rate ASC, sus.booking_rate ASC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Function to update AI recommendation outcome
CREATE OR REPLACE FUNCTION update_ai_recommendation_outcome()
RETURNS TRIGGER AS $$
BEGIN
  -- When appointment status changes, update the AI recommendation record
  UPDATE ai_slot_recommendations
  SET
    appointment_completed = CASE
      WHEN NEW.status = 'completed' THEN TRUE
      WHEN NEW.status IN ('cancelled', 'no_show') THEN FALSE
      ELSE appointment_completed
    END,
    updated_at = NOW()
  WHERE appointment_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update AI recommendation outcomes
CREATE TRIGGER update_ai_recommendation_on_appointment_change
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_ai_recommendation_outcome();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON slot_usage_statistics TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ai_slot_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_slot_usage_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_underutilized_slots TO authenticated;

-- Add helpful comment
COMMENT ON TABLE slot_usage_statistics IS 'Tracks booking frequency of time slots to identify under-utilized periods for AI-driven distribution';
COMMENT ON TABLE ai_slot_recommendations IS 'Logs AI-generated slot recommendations and tracks their success rate';
COMMENT ON FUNCTION calculate_slot_usage_statistics IS 'Calculates booking rates for all time slots to identify under-utilized periods';
COMMENT ON FUNCTION get_underutilized_slots IS 'Returns time slots with low booking rates that should be promoted';
