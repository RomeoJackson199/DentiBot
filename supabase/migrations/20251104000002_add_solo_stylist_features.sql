-- =====================================================
-- Type A: Solo Stylist Features
-- =====================================================
-- Optimized for single-stylist salons
-- Focus: Personal earnings, breaks, returning clients
-- =====================================================

-- 1. Add appointment type for breaks/blocked time
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS appointment_type TEXT DEFAULT 'service'
  CHECK (appointment_type IN ('service', 'break', 'blocked', 'personal'));

-- 2. Add recurring appointment settings
CREATE TABLE IF NOT EXISTS recurring_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stylist_id UUID NOT NULL REFERENCES dentists(id) ON DELETE CASCADE,
  service_id UUID REFERENCES business_services(id) ON DELETE SET NULL,

  -- Recurrence pattern
  frequency_weeks INTEGER NOT NULL DEFAULT 6, -- Every N weeks
  preferred_day_of_week INTEGER, -- 0-6 (Sunday-Saturday), null = flexible
  preferred_time_slot TIME, -- Preferred time, null = flexible

  -- Auto-booking settings
  auto_book BOOLEAN DEFAULT false, -- Automatically create appointment
  send_reminder BOOLEAN DEFAULT true, -- Send reminder to rebook

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_appointment_date DATE,
  next_suggested_date DATE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT unique_recurring_appointment UNIQUE(patient_id, stylist_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_recurring_appointments_next_date
  ON recurring_appointments(next_suggested_date)
  WHERE is_active = true;

-- 3. Client preferences and notes (enhance existing profiles)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS hair_notes TEXT, -- "Loves volume, sensitive scalp"
ADD COLUMN IF NOT EXISTS color_formula TEXT, -- "6.43 + 7.1 (50/50)"
ADD COLUMN IF NOT EXISTS preferred_appointment_time TEXT, -- "Saturday mornings"
ADD COLUMN IF NOT EXISTS last_visit_date DATE,
ADD COLUMN IF NOT EXISTS next_visit_reminder DATE;

-- 4. Solo business settings
CREATE TABLE IF NOT EXISTS solo_business_settings (
  business_id UUID PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,

  -- Break defaults
  default_break_duration_minutes INTEGER DEFAULT 60,
  allow_online_booking_during_breaks BOOLEAN DEFAULT false,

  -- Rebooking settings
  suggest_rebook_after_checkout BOOLEAN DEFAULT true,
  default_rebook_weeks INTEGER DEFAULT 6,

  -- Mobile preferences
  show_client_photos BOOLEAN DEFAULT true,
  show_revenue_on_dashboard BOOLEAN DEFAULT true,

  -- Notification preferences
  notify_new_booking BOOLEAN DEFAULT true,
  notify_cancellation BOOLEAN DEFAULT true,
  remind_upcoming_appointment_hours INTEGER DEFAULT 2,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function: Get solo stylist's daily summary
CREATE OR REPLACE FUNCTION get_solo_daily_summary(
  stylist_id_param UUID,
  business_id_param UUID,
  date_param DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_clients INTEGER,
  completed_clients INTEGER,
  upcoming_clients INTEGER,
  revenue_cents INTEGER,
  tips_cents INTEGER,
  next_appointment_time TIMESTAMPTZ,
  next_client_name TEXT,
  next_client_notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_stats AS (
    SELECT
      COUNT(*)::INTEGER as total,
      COUNT(*) FILTER (WHERE a.status = 'completed')::INTEGER as completed,
      COUNT(*) FILTER (WHERE a.status = 'pending' AND a.appointment_date > NOW())::INTEGER as upcoming,
      COALESCE(SUM(bs.price_cents) FILTER (WHERE a.status = 'completed'), 0)::INTEGER as revenue,
      COALESCE(SUM(st.amount_cents), 0)::INTEGER as tips
    FROM appointments a
    LEFT JOIN business_services bs ON a.service_id = bs.id
    LEFT JOIN service_tips st ON st.appointment_id = a.id
    WHERE a.dentist_id = stylist_id_param
      AND a.business_id = business_id_param
      AND DATE(a.appointment_date AT TIME ZONE 'Europe/Brussels') = date_param
      AND a.appointment_type = 'service'
  ),
  next_apt AS (
    SELECT
      a.appointment_date,
      a.patient_name,
      p.hair_notes
    FROM appointments a
    LEFT JOIN profiles p ON a.patient_id = p.id
    WHERE a.dentist_id = stylist_id_param
      AND a.business_id = business_id_param
      AND a.appointment_date > NOW()
      AND a.status = 'pending'
      AND a.appointment_type = 'service'
    ORDER BY a.appointment_date ASC
    LIMIT 1
  )
  SELECT
    ds.total,
    ds.completed,
    ds.upcoming,
    ds.revenue,
    ds.tips,
    na.appointment_date,
    na.patient_name,
    na.hair_notes
  FROM daily_stats ds
  CROSS JOIN next_apt na;
END;
$$ LANGUAGE plpgsql;

-- Function: Get client visit history for quick rebooking
CREATE OR REPLACE FUNCTION get_client_last_service(
  patient_id_param UUID,
  business_id_param UUID
)
RETURNS TABLE (
  last_service_name TEXT,
  last_service_date DATE,
  last_service_id UUID,
  last_price_cents INTEGER,
  service_count INTEGER,
  color_formula TEXT,
  hair_notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bs.name,
    DATE(a.appointment_date AT TIME ZONE 'Europe/Brussels'),
    bs.id,
    bs.price_cents,
    COUNT(*)::INTEGER,
    p.color_formula,
    p.hair_notes
  FROM appointments a
  JOIN business_services bs ON a.service_id = bs.id
  JOIN profiles p ON a.patient_id = p.id
  WHERE a.patient_id = patient_id_param
    AND a.business_id = business_id_param
    AND a.status = 'completed'
  GROUP BY bs.name, a.appointment_date, bs.id, bs.price_cents, p.color_formula, p.hair_notes
  ORDER BY a.appointment_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: Create break/blocked time
CREATE OR REPLACE FUNCTION create_break_block(
  stylist_id_param UUID,
  business_id_param UUID,
  start_time_param TIMESTAMPTZ,
  duration_minutes_param INTEGER,
  block_type_param TEXT DEFAULT 'break',
  reason_param TEXT DEFAULT 'Break'
)
RETURNS UUID AS $$
DECLARE
  new_appointment_id UUID;
BEGIN
  INSERT INTO appointments (
    dentist_id,
    business_id,
    appointment_date,
    duration_minutes,
    appointment_type,
    reason,
    status,
    patient_name
  ) VALUES (
    stylist_id_param,
    business_id_param,
    start_time_param,
    duration_minutes_param,
    block_type_param,
    reason_param,
    'confirmed',
    'BLOCKED'
  )
  RETURNING id INTO new_appointment_id;

  RETURN new_appointment_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Recurring appointments RLS
ALTER TABLE recurring_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recurring appointments for their business"
  ON recurring_appointments FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM business_members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage recurring appointments for their business"
  ON recurring_appointments FOR ALL
  USING (
    business_id IN (
      SELECT business_id FROM business_members WHERE profile_id = auth.uid()
    )
  );

-- Solo business settings RLS
ALTER TABLE solo_business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view solo settings for their business"
  ON solo_business_settings FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM business_members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage solo settings for their business"
  ON solo_business_settings FOR ALL
  USING (
    business_id IN (
      SELECT business_id FROM business_members WHERE profile_id = auth.uid()
    )
  );

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Create default solo settings for existing hairdresser businesses with solo tier
INSERT INTO solo_business_settings (business_id)
SELECT id FROM businesses
WHERE template_id = 'hairdresser'
  AND salon_tier = 'solo'
  AND id NOT IN (SELECT business_id FROM solo_business_settings)
ON CONFLICT (business_id) DO NOTHING;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update next visit reminder after appointment completion
CREATE OR REPLACE FUNCTION update_client_last_visit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE profiles
    SET
      last_visit_date = DATE(NEW.appointment_date AT TIME ZONE 'Europe/Brussels'),
      next_visit_reminder = DATE(NEW.appointment_date AT TIME ZONE 'Europe/Brussels') + INTERVAL '6 weeks'
    WHERE id = NEW.patient_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_last_visit
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_client_last_visit();

-- Auto-update recurring appointment next date
CREATE OR REPLACE FUNCTION update_recurring_next_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE recurring_appointments
    SET
      last_appointment_date = DATE(NEW.appointment_date AT TIME ZONE 'Europe/Brussels'),
      next_suggested_date = DATE(NEW.appointment_date AT TIME ZONE 'Europe/Brussels') + (frequency_weeks || ' weeks')::INTERVAL
    WHERE patient_id = NEW.patient_id
      AND stylist_id = NEW.dentist_id
      AND business_id = NEW.business_id
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recurring_next_date
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_recurring_next_date();
