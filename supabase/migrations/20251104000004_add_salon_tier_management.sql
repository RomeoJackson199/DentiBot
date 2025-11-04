-- =====================================================
-- Salon Tier Management
-- =====================================================
-- Automatic tier detection based on stylist count
-- Manual upgrade to Enterprise tier
-- =====================================================

-- 1. Add salon_tier to businesses if not exists
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS salon_tier TEXT DEFAULT 'solo'
  CHECK (salon_tier IN ('solo', 'team', 'enterprise'));

CREATE INDEX IF NOT EXISTS idx_businesses_salon_tier ON businesses(salon_tier);

-- 2. Add manual_tier_override flag
-- When true, salon_tier is manually set (user chose enterprise)
-- When false, salon_tier is auto-calculated based on stylist count
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS manual_tier_override BOOLEAN DEFAULT false;

-- 3. Function to auto-calculate tier based on stylist count
CREATE OR REPLACE FUNCTION calculate_salon_tier(business_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  stylist_count INTEGER;
  location_count INTEGER;
  current_manual_override BOOLEAN;
  current_tier TEXT;
BEGIN
  -- Get current override setting
  SELECT manual_tier_override, salon_tier INTO current_manual_override, current_tier
  FROM businesses
  WHERE id = business_id_param;

  -- If manual override is set, keep current tier
  IF current_manual_override = true THEN
    RETURN current_tier;
  END IF;

  -- Count active stylists
  SELECT COUNT(*) INTO stylist_count
  FROM dentists
  WHERE business_id = business_id_param
    AND is_active = true;

  -- Count active locations
  SELECT COUNT(*) INTO location_count
  FROM locations
  WHERE parent_business_id = business_id_param
    AND is_active = true;

  -- Determine tier
  IF location_count > 1 THEN
    RETURN 'enterprise';
  ELSIF stylist_count = 1 THEN
    RETURN 'solo';
  ELSIF stylist_count >= 2 THEN
    RETURN 'team';
  ELSE
    RETURN 'solo';  -- Default to solo if 0 stylists
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Function to manually upgrade to enterprise
CREATE OR REPLACE FUNCTION upgrade_to_enterprise(business_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE businesses
  SET
    salon_tier = 'enterprise',
    manual_tier_override = true
  WHERE id = business_id_param;
END;
$$ LANGUAGE plpgsql;

-- 5. Function to reset to auto tier detection
CREATE OR REPLACE FUNCTION reset_to_auto_tier(business_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  new_tier TEXT;
BEGIN
  -- Calculate the appropriate tier
  new_tier := calculate_salon_tier(business_id_param);

  -- Update with auto-calculated tier
  UPDATE businesses
  SET
    salon_tier = new_tier,
    manual_tier_override = false
  WHERE id = business_id_param;

  RETURN new_tier;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger to auto-update tier when stylists change
CREATE OR REPLACE FUNCTION auto_update_salon_tier()
RETURNS TRIGGER AS $$
DECLARE
  new_tier TEXT;
BEGIN
  -- Only update if not manually overridden
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    new_tier := calculate_salon_tier(NEW.business_id);
  ELSIF TG_OP = 'DELETE' THEN
    new_tier := calculate_salon_tier(OLD.business_id);
  END IF;

  -- Update the business tier
  UPDATE businesses
  SET salon_tier = new_tier
  WHERE id = COALESCE(NEW.business_id, OLD.business_id)
    AND manual_tier_override = false;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to dentists table
DROP TRIGGER IF EXISTS trigger_auto_update_salon_tier ON dentists;
CREATE TRIGGER trigger_auto_update_salon_tier
  AFTER INSERT OR UPDATE OF is_active OR DELETE ON dentists
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_salon_tier();

-- 7. Trigger to auto-update tier when locations change
CREATE OR REPLACE FUNCTION auto_update_tier_on_location_change()
RETURNS TRIGGER AS $$
DECLARE
  new_tier TEXT;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    new_tier := calculate_salon_tier(NEW.parent_business_id);

    UPDATE businesses
    SET salon_tier = new_tier
    WHERE id = NEW.parent_business_id
      AND manual_tier_override = false;
  ELSIF TG_OP = 'DELETE' THEN
    new_tier := calculate_salon_tier(OLD.parent_business_id);

    UPDATE businesses
    SET salon_tier = new_tier
    WHERE id = OLD.parent_business_id
      AND manual_tier_override = false;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to locations table
DROP TRIGGER IF EXISTS trigger_auto_update_tier_on_location ON locations;
CREATE TRIGGER trigger_auto_update_tier_on_location
  AFTER INSERT OR UPDATE OF is_active OR DELETE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_tier_on_location_change();

-- 8. Initialize salon_tier for existing hairdresser businesses
UPDATE businesses
SET salon_tier = calculate_salon_tier(id)
WHERE template_id = 'hairdresser'
  AND manual_tier_override = false;

-- 9. View to get business tier info
CREATE OR REPLACE VIEW business_tier_info AS
SELECT
  b.id as business_id,
  b.name as business_name,
  b.salon_tier,
  b.manual_tier_override,
  COUNT(DISTINCT d.id) FILTER (WHERE d.is_active = true) as active_stylists,
  COUNT(DISTINCT l.id) FILTER (WHERE l.is_active = true) as active_locations,
  calculate_salon_tier(b.id) as recommended_tier
FROM businesses b
LEFT JOIN dentists d ON d.business_id = b.id
LEFT JOIN locations l ON l.parent_business_id = b.id
WHERE b.template_id = 'hairdresser'
GROUP BY b.id, b.name, b.salon_tier, b.manual_tier_override;
