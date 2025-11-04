-- =====================================================
-- Type C: Enterprise Multi-Location Features
-- =====================================================
-- For salon chains and franchises with 2+ locations
-- Focus: Network reporting, central inventory, standardized services
-- =====================================================

-- 1. Locations table (each physical salon location)
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Location details
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Belgium',
  phone TEXT,
  email TEXT,

  -- Management
  manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,
  opening_date DATE,

  -- Settings (can override parent business settings)
  timezone TEXT DEFAULT 'Europe/Brussels',
  currency TEXT DEFAULT 'EUR',

  -- Goals
  daily_revenue_goal_cents INTEGER DEFAULT 150000,
  monthly_revenue_goal_cents INTEGER DEFAULT 4500000,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT location_name_unique UNIQUE(parent_business_id, name)
);

CREATE INDEX IF NOT EXISTS idx_locations_parent ON locations(parent_business_id);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active) WHERE is_active = true;

-- 2. Link stylists to specific locations
ALTER TABLE dentists
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_dentists_location ON dentists(location_id);

-- 3. Link appointments to locations
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_location ON appointments(location_id);

-- 4. Central inventory (warehouse/headquarters)
CREATE TABLE IF NOT EXISTS central_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES business_services(id) ON DELETE CASCADE,

  -- Stock levels
  quantity_on_hand INTEGER DEFAULT 0,
  reorder_threshold INTEGER DEFAULT 10,
  reorder_quantity INTEGER DEFAULT 50,

  -- Cost tracking
  average_cost_cents INTEGER DEFAULT 0,
  last_reorder_date DATE,
  last_reorder_quantity INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_central_product UNIQUE(parent_business_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_central_inventory_business ON central_inventory(parent_business_id);

-- 5. Location-specific inventory
CREATE TABLE IF NOT EXISTS location_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES business_services(id) ON DELETE CASCADE,

  -- Stock levels
  quantity_on_hand INTEGER DEFAULT 0,
  reorder_threshold INTEGER DEFAULT 5,

  -- Last restock
  last_restock_date DATE,
  last_restock_quantity INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_location_product UNIQUE(location_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_location_inventory_location ON location_inventory(location_id);

-- 6. Inventory transfers (warehouse → location or location → location)
CREATE TABLE IF NOT EXISTS inventory_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Transfer details
  from_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,  -- NULL = central warehouse
  to_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES business_services(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Dates
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfers_from ON inventory_transfers(from_location_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to ON inventory_transfers(to_location_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON inventory_transfers(status);

-- 7. Service pricing overrides per location
CREATE TABLE IF NOT EXISTS location_service_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES business_services(id) ON DELETE CASCADE,

  -- Overrides (NULL = use default from business_services)
  price_cents INTEGER,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_location_service UNIQUE(location_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_location_service_overrides ON location_service_overrides(location_id);

-- 8. Network-wide goals and targets
CREATE TABLE IF NOT EXISTS network_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Period
  goal_period TEXT NOT NULL CHECK (goal_period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Targets
  revenue_goal_cents INTEGER NOT NULL,
  client_goal INTEGER,
  new_client_goal INTEGER,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_network_goals_business ON network_goals(parent_business_id);
CREATE INDEX IF NOT EXISTS idx_network_goals_period ON network_goals(start_date, end_date);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function: Get network-wide summary
CREATE OR REPLACE FUNCTION get_network_summary(
  parent_business_id_param UUID,
  date_param DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_locations INTEGER,
  active_locations INTEGER,
  total_stylists INTEGER,
  total_revenue_cents INTEGER,
  total_clients INTEGER,
  total_tips_cents INTEGER,
  top_location_id UUID,
  top_location_name TEXT,
  top_location_revenue_cents INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH location_stats AS (
    SELECT
      l.id as loc_id,
      l.name as loc_name,
      COUNT(DISTINCT a.id) as clients,
      COALESCE(SUM(bs.price_cents), 0) as revenue,
      COALESCE(SUM(st.amount_cents), 0) as tips
    FROM locations l
    LEFT JOIN appointments a ON a.location_id = l.id
      AND a.status = 'completed'
      AND DATE(a.appointment_date AT TIME ZONE 'Europe/Brussels') = date_param
    LEFT JOIN business_services bs ON a.service_id = bs.id
    LEFT JOIN service_tips st ON st.appointment_id = a.id
    WHERE l.parent_business_id = parent_business_id_param
    GROUP BY l.id, l.name
  ),
  top_loc AS (
    SELECT loc_id, loc_name, revenue
    FROM location_stats
    ORDER BY revenue DESC
    LIMIT 1
  )
  SELECT
    COUNT(DISTINCT l.id)::INTEGER as total_locations,
    COUNT(DISTINCT l.id) FILTER (WHERE l.is_active = true)::INTEGER as active_locations,
    COUNT(DISTINCT d.id)::INTEGER as total_stylists,
    COALESCE(SUM(ls.revenue), 0)::INTEGER as total_revenue_cents,
    COALESCE(SUM(ls.clients), 0)::INTEGER as total_clients,
    COALESCE(SUM(ls.tips), 0)::INTEGER as total_tips_cents,
    tl.loc_id,
    tl.loc_name,
    tl.revenue::INTEGER
  FROM locations l
  LEFT JOIN dentists d ON d.location_id = l.id AND d.is_active = true
  LEFT JOIN location_stats ls ON ls.loc_id = l.id
  CROSS JOIN top_loc tl
  WHERE l.parent_business_id = parent_business_id_param
  GROUP BY tl.loc_id, tl.loc_name, tl.revenue;
END;
$$ LANGUAGE plpgsql;

-- Function: Get location performance comparison
CREATE OR REPLACE FUNCTION compare_location_performance(
  parent_business_id_param UUID,
  start_date_param DATE,
  end_date_param DATE
)
RETURNS TABLE (
  location_id UUID,
  location_name TEXT,
  total_revenue_cents INTEGER,
  total_clients INTEGER,
  stylist_count INTEGER,
  avg_revenue_per_client_cents INTEGER,
  avg_revenue_per_stylist_cents INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.name,
    COALESCE(SUM(bs.price_cents), 0)::INTEGER as revenue,
    COUNT(DISTINCT a.id)::INTEGER as clients,
    COUNT(DISTINCT d.id)::INTEGER as stylists,
    CASE
      WHEN COUNT(DISTINCT a.id) > 0
      THEN (COALESCE(SUM(bs.price_cents), 0) / COUNT(DISTINCT a.id))::INTEGER
      ELSE 0
    END as avg_per_client,
    CASE
      WHEN COUNT(DISTINCT d.id) > 0
      THEN (COALESCE(SUM(bs.price_cents), 0) / COUNT(DISTINCT d.id))::INTEGER
      ELSE 0
    END as avg_per_stylist
  FROM locations l
  LEFT JOIN dentists d ON d.location_id = l.id AND d.is_active = true
  LEFT JOIN appointments a ON a.location_id = l.id
    AND a.status = 'completed'
    AND DATE(a.appointment_date AT TIME ZONE 'Europe/Brussels') BETWEEN start_date_param AND end_date_param
  LEFT JOIN business_services bs ON a.service_id = bs.id
  WHERE l.parent_business_id = parent_business_id_param
    AND l.is_active = true
  GROUP BY l.id, l.name
  ORDER BY revenue DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get network leaderboard (top stylists across all locations)
CREATE OR REPLACE FUNCTION get_network_leaderboard(
  parent_business_id_param UUID,
  start_date_param DATE,
  end_date_param DATE,
  limit_param INTEGER DEFAULT 10
)
RETURNS TABLE (
  stylist_id UUID,
  stylist_name TEXT,
  location_name TEXT,
  total_revenue_cents INTEGER,
  total_clients INTEGER,
  total_tips_cents INTEGER,
  ranking INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH stylist_stats AS (
    SELECT
      d.id as s_id,
      p.first_name || ' ' || p.last_name as s_name,
      l.name as l_name,
      COALESCE(SUM(bs.price_cents), 0) as revenue,
      COUNT(DISTINCT a.id) as clients,
      COALESCE(SUM(st.amount_cents), 0) as tips,
      ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(bs.price_cents), 0) DESC) as rank
    FROM dentists d
    JOIN profiles p ON d.profile_id = p.id
    JOIN locations l ON d.location_id = l.id
    LEFT JOIN appointments a ON a.dentist_id = d.id
      AND a.status = 'completed'
      AND DATE(a.appointment_date AT TIME ZONE 'Europe/Brussels') BETWEEN start_date_param AND end_date_param
    LEFT JOIN business_services bs ON a.service_id = bs.id
    LEFT JOIN service_tips st ON st.appointment_id = a.id
    WHERE l.parent_business_id = parent_business_id_param
      AND d.is_active = true
    GROUP BY d.id, p.first_name, p.last_name, l.name
  )
  SELECT
    s_id,
    s_name,
    l_name,
    revenue::INTEGER,
    clients::INTEGER,
    tips::INTEGER,
    rank::INTEGER
  FROM stylist_stats
  WHERE rank <= limit_param
  ORDER BY rank;
END;
$$ LANGUAGE plpgsql;

-- Function: Process inventory transfer
CREATE OR REPLACE FUNCTION complete_inventory_transfer(
  transfer_id_param UUID
)
RETURNS VOID AS $$
DECLARE
  transfer_record RECORD;
BEGIN
  -- Get transfer details
  SELECT * INTO transfer_record
  FROM inventory_transfers
  WHERE id = transfer_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer not found';
  END IF;

  IF transfer_record.status != 'in_transit' THEN
    RAISE EXCEPTION 'Transfer must be in_transit status to complete';
  END IF;

  -- Deduct from source (if not central warehouse)
  IF transfer_record.from_location_id IS NOT NULL THEN
    UPDATE location_inventory
    SET quantity_on_hand = quantity_on_hand - transfer_record.quantity
    WHERE location_id = transfer_record.from_location_id
      AND product_id = transfer_record.product_id;
  ELSE
    -- Deduct from central inventory
    UPDATE central_inventory
    SET quantity_on_hand = quantity_on_hand - transfer_record.quantity
    WHERE parent_business_id = transfer_record.parent_business_id
      AND product_id = transfer_record.product_id;
  END IF;

  -- Add to destination
  INSERT INTO location_inventory (location_id, product_id, quantity_on_hand, last_restock_date, last_restock_quantity)
  VALUES (
    transfer_record.to_location_id,
    transfer_record.product_id,
    transfer_record.quantity,
    CURRENT_DATE,
    transfer_record.quantity
  )
  ON CONFLICT (location_id, product_id)
  DO UPDATE SET
    quantity_on_hand = location_inventory.quantity_on_hand + transfer_record.quantity,
    last_restock_date = CURRENT_DATE,
    last_restock_quantity = transfer_record.quantity;

  -- Mark transfer as completed
  UPDATE inventory_transfers
  SET
    status = 'completed',
    completed_at = NOW()
  WHERE id = transfer_id_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Locations RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view locations for their business"
  ON locations FOR SELECT
  USING (
    parent_business_id IN (
      SELECT business_id FROM business_members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage locations for their business"
  ON locations FOR ALL
  USING (
    parent_business_id IN (
      SELECT business_id FROM business_members WHERE profile_id = auth.uid()
    )
  );

-- Central inventory RLS
ALTER TABLE central_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view central inventory for their business"
  ON central_inventory FOR SELECT
  USING (
    parent_business_id IN (
      SELECT business_id FROM business_members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage central inventory for their business"
  ON central_inventory FOR ALL
  USING (
    parent_business_id IN (
      SELECT business_id FROM business_members WHERE profile_id = auth.uid()
    )
  );

-- Location inventory RLS
ALTER TABLE location_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view location inventory"
  ON location_inventory FOR SELECT
  USING (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN business_members bm ON bm.business_id = l.parent_business_id
      WHERE bm.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage location inventory"
  ON location_inventory FOR ALL
  USING (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN business_members bm ON bm.business_id = l.parent_business_id
      WHERE bm.profile_id = auth.uid()
    )
  );

-- Inventory transfers RLS
ALTER TABLE inventory_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transfers for their business"
  ON inventory_transfers FOR SELECT
  USING (
    parent_business_id IN (
      SELECT business_id FROM business_members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage transfers for their business"
  ON inventory_transfers FOR ALL
  USING (
    parent_business_id IN (
      SELECT business_id FROM business_members WHERE profile_id = auth.uid()
    )
  );

-- Location service overrides RLS
ALTER TABLE location_service_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view service overrides"
  ON location_service_overrides FOR SELECT
  USING (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN business_members bm ON bm.business_id = l.parent_business_id
      WHERE bm.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage service overrides"
  ON location_service_overrides FOR ALL
  USING (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN business_members bm ON bm.business_id = l.parent_business_id
      WHERE bm.profile_id = auth.uid()
    )
  );

-- Network goals RLS
ALTER TABLE network_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view network goals for their business"
  ON network_goals FOR SELECT
  USING (
    parent_business_id IN (
      SELECT business_id FROM business_members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage network goals for their business"
  ON network_goals FOR ALL
  USING (
    parent_business_id IN (
      SELECT business_id FROM business_members WHERE profile_id = auth.uid()
    )
  );
