-- =====================================================
-- SALON TEAM FEATURES (TYPE B)
-- Small team salon support (2-5 stylists)
-- =====================================================

-- Add salon tier to businesses
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS salon_tier TEXT CHECK (salon_tier IN ('solo', 'team', 'enterprise')) DEFAULT 'team';

-- Add daily revenue goals
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS daily_revenue_goal_cents INTEGER DEFAULT 180000; -- Default €1,800

-- =====================================================
-- STYLIST ENHANCEMENTS
-- =====================================================

-- Add stylist profile enhancements
ALTER TABLE dentists
ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
ADD COLUMN IF NOT EXISTS stylist_level TEXT CHECK (stylist_level IN ('junior', 'stylist', 'senior', 'master')) DEFAULT 'stylist';

-- Create stylist portfolio table
CREATE TABLE IF NOT EXISTS stylist_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id UUID REFERENCES dentists(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  service_tag TEXT,
  is_featured BOOLEAN DEFAULT false,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for stylist_portfolio
ALTER TABLE stylist_portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their business portfolios"
  ON stylist_portfolio FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their business portfolios"
  ON stylist_portfolio FOR ALL
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- TIPS TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS service_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  stylist_id UUID REFERENCES dentists(id),
  business_id UUID REFERENCES businesses(id),
  amount_cents INTEGER NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('card', 'cash', 'split')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for tips
ALTER TABLE service_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their business tips"
  ON service_tips FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their business tips"
  ON service_tips FOR ALL
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- PRODUCT INVENTORY (RETAIL + SUPPLIES)
-- =====================================================

-- Enhance business_services for retail products
ALTER TABLE business_services
ADD COLUMN IF NOT EXISTS is_retail BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cost_cents INTEGER,  -- Track cost for profit margin
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS is_supply BOOLEAN DEFAULT false;  -- Internal supplies vs retail

-- Product sales tracking
CREATE TABLE IF NOT EXISTS product_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES business_services(id),
  appointment_id UUID REFERENCES appointments(id),
  business_id UUID REFERENCES businesses(id),
  quantity INTEGER DEFAULT 1,
  price_cents INTEGER NOT NULL,
  cost_cents INTEGER,
  sold_by_stylist_id UUID REFERENCES dentists(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for product sales
ALTER TABLE product_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their business product sales"
  ON product_sales FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their business product sales"
  ON product_sales FOR ALL
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- WALK-IN WAITLIST
-- =====================================================

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_profile_id UUID REFERENCES profiles(id),  -- If existing client
  service_requested TEXT,
  service_id UUID REFERENCES business_services(id),
  preferred_stylist_id UUID REFERENCES dentists(id),
  estimated_wait_minutes INTEGER,
  status TEXT CHECK (status IN ('waiting', 'ready', 'served', 'cancelled')) DEFAULT 'waiting',
  sms_sent BOOLEAN DEFAULT false,
  position INTEGER,  -- Position in queue
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ready_at TIMESTAMPTZ,
  served_at TIMESTAMPTZ
);

-- Enable RLS for waitlist
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their business waitlist"
  ON waitlist FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their business waitlist"
  ON waitlist FOR ALL
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- CLIENT PREFERENCES
-- =====================================================

-- Enhanced client/patient preferences
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_stylist_id UUID REFERENCES dentists(id),
ADD COLUMN IF NOT EXISTS last_service_id UUID REFERENCES business_services(id),
ADD COLUMN IF NOT EXISTS last_visit_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS hair_type TEXT,
ADD COLUMN IF NOT EXISTS hair_color_formula TEXT,
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS special_notes TEXT,
ADD COLUMN IF NOT EXISTS lifetime_value_cents INTEGER DEFAULT 0;

-- =====================================================
-- COMMISSION RATES
-- =====================================================

CREATE TABLE IF NOT EXISTS commission_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  stylist_level TEXT CHECK (stylist_level IN ('junior', 'stylist', 'senior', 'master')),
  service_commission_percent DECIMAL(5,2) NOT NULL,
  product_commission_percent DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, stylist_level)
);

-- Enable RLS for commission rates
ALTER TABLE commission_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their business commission rates"
  ON commission_rates FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their business commission rates"
  ON commission_rates FOR ALL
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Insert default commission rates for salons
INSERT INTO commission_rates (business_id, stylist_level, service_commission_percent, product_commission_percent)
SELECT
  id as business_id,
  'junior' as stylist_level,
  40.00 as service_commission_percent,
  5.00 as product_commission_percent
FROM businesses
WHERE template_type = 'hairdresser'
ON CONFLICT (business_id, stylist_level) DO NOTHING;

INSERT INTO commission_rates (business_id, stylist_level, service_commission_percent, product_commission_percent)
SELECT
  id as business_id,
  'stylist' as stylist_level,
  45.00 as service_commission_percent,
  10.00 as product_commission_percent
FROM businesses
WHERE template_type = 'hairdresser'
ON CONFLICT (business_id, stylist_level) DO NOTHING;

INSERT INTO commission_rates (business_id, stylist_level, service_commission_percent, product_commission_percent)
SELECT
  id as business_id,
  'senior' as stylist_level,
  50.00 as service_commission_percent,
  10.00 as product_commission_percent
FROM businesses
WHERE template_type = 'hairdresser'
ON CONFLICT (business_id, stylist_level) DO NOTHING;

INSERT INTO commission_rates (business_id, stylist_level, service_commission_percent, product_commission_percent)
SELECT
  id as business_id,
  'master' as stylist_level,
  55.00 as service_commission_percent,
  15.00 as product_commission_percent
FROM businesses
WHERE template_type = 'hairdresser'
ON CONFLICT (business_id, stylist_level) DO NOTHING;

-- =====================================================
-- USEFUL FUNCTIONS
-- =====================================================

-- Function to get stylist status (busy/free)
CREATE OR REPLACE FUNCTION get_stylist_status(stylist_id_param UUID, business_id_param UUID)
RETURNS TABLE (
  stylist_id UUID,
  status TEXT,
  current_client TEXT,
  finish_time TIMESTAMPTZ,
  today_revenue_cents INTEGER,
  today_clients INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH current_appointment AS (
    SELECT
      a.patient_name,
      a.appointment_date,
      a.duration_minutes,
      (a.appointment_date + (a.duration_minutes || ' minutes')::INTERVAL) as end_time
    FROM appointments a
    WHERE a.dentist_id = stylist_id_param
      AND a.business_id = business_id_param
      AND a.status IN ('confirmed', 'in_progress')
      AND a.appointment_date <= NOW()
      AND (a.appointment_date + (a.duration_minutes || ' minutes')::INTERVAL) > NOW()
    ORDER BY a.appointment_date DESC
    LIMIT 1
  ),
  today_stats AS (
    SELECT
      COALESCE(SUM(bs.price_cents), 0) as revenue,
      COUNT(*) as client_count
    FROM appointments a
    LEFT JOIN business_services bs ON a.service_id = bs.id
    WHERE a.dentist_id = stylist_id_param
      AND a.business_id = business_id_param
      AND a.appointment_date >= CURRENT_DATE
      AND a.status = 'completed'
  )
  SELECT
    stylist_id_param,
    CASE
      WHEN ca.patient_name IS NOT NULL THEN 'busy'
      ELSE 'free'
    END as status,
    ca.patient_name as current_client,
    ca.end_time as finish_time,
    ts.revenue::INTEGER as today_revenue_cents,
    ts.client_count::INTEGER as today_clients
  FROM today_stats ts
  LEFT JOIN current_appointment ca ON true;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate daily revenue for a business
CREATE OR REPLACE FUNCTION get_daily_revenue(business_id_param UUID, date_param DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  service_revenue_cents INTEGER,
  product_revenue_cents INTEGER,
  tips_cents INTEGER,
  total_revenue_cents INTEGER,
  clients_served INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH service_rev AS (
    SELECT COALESCE(SUM(bs.price_cents), 0) as amount
    FROM appointments a
    LEFT JOIN business_services bs ON a.service_id = bs.id
    WHERE a.business_id = business_id_param
      AND a.appointment_date >= date_param
      AND a.appointment_date < date_param + INTERVAL '1 day'
      AND a.status = 'completed'
  ),
  product_rev AS (
    SELECT COALESCE(SUM(ps.price_cents * ps.quantity), 0) as amount
    FROM product_sales ps
    WHERE ps.business_id = business_id_param
      AND ps.created_at >= date_param
      AND ps.created_at < date_param + INTERVAL '1 day'
  ),
  tips_rev AS (
    SELECT COALESCE(SUM(st.amount_cents), 0) as amount
    FROM service_tips st
    WHERE st.business_id = business_id_param
      AND st.created_at >= date_param
      AND st.created_at < date_param + INTERVAL '1 day'
  ),
  clients AS (
    SELECT COUNT(*) as count
    FROM appointments a
    WHERE a.business_id = business_id_param
      AND a.appointment_date >= date_param
      AND a.appointment_date < date_param + INTERVAL '1 day'
      AND a.status = 'completed'
  )
  SELECT
    sr.amount::INTEGER as service_revenue_cents,
    pr.amount::INTEGER as product_revenue_cents,
    tr.amount::INTEGER as tips_cents,
    (sr.amount + pr.amount + tr.amount)::INTEGER as total_revenue_cents,
    c.count::INTEGER as clients_served
  FROM service_rev sr, product_rev pr, tips_rev tr, clients c;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_service_tips_business ON service_tips(business_id);
CREATE INDEX IF NOT EXISTS idx_service_tips_stylist ON service_tips(stylist_id);
CREATE INDEX IF NOT EXISTS idx_service_tips_created ON service_tips(created_at);

CREATE INDEX IF NOT EXISTS idx_product_sales_business ON product_sales(business_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_stylist ON product_sales(sold_by_stylist_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_created ON product_sales(created_at);

CREATE INDEX IF NOT EXISTS idx_waitlist_business ON waitlist(business_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);

CREATE INDEX IF NOT EXISTS idx_stylist_portfolio_stylist ON stylist_portfolio(stylist_id);
CREATE INDEX IF NOT EXISTS idx_stylist_portfolio_business ON stylist_portfolio(business_id);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE service_tips IS 'Tracks tips received by stylists from clients';
COMMENT ON TABLE product_sales IS 'Tracks retail product sales (shampoo, conditioner, etc)';
COMMENT ON TABLE waitlist IS 'Manages walk-in clients waiting for available stylists';
COMMENT ON TABLE stylist_portfolio IS 'Stores portfolio images for stylists (before/after photos)';
COMMENT ON TABLE commission_rates IS 'Defines commission percentages by stylist level';

COMMENT ON COLUMN dentists.stylist_level IS 'Career level: junior, stylist, senior, or master';
COMMENT ON COLUMN dentists.specialties IS 'Array of specialties like ["balayage", "color", "cuts"]';
COMMENT ON COLUMN business_services.is_retail IS 'True if product is sold to clients (vs internal supply)';
COMMENT ON COLUMN business_services.is_supply IS 'True if internal supply (toner, foils, etc)';
