-- Add salon tier columns to businesses table for automatic tier detection
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS salon_tier text DEFAULT 'solo' CHECK (salon_tier IN ('solo', 'team', 'enterprise')),
ADD COLUMN IF NOT EXISTS manual_tier_override boolean DEFAULT false;

-- Add helpful comment
COMMENT ON COLUMN businesses.salon_tier IS 'Automatically calculated based on team size: solo (1), team (2-10), enterprise (11+)';
COMMENT ON COLUMN businesses.manual_tier_override IS 'When true, salon_tier was manually set by user';

-- Create function to calculate tier based on business members
CREATE OR REPLACE FUNCTION calculate_salon_tier(business_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stylist_count integer;
  location_count integer;
BEGIN
  -- Count active stylists (from business_members)
  SELECT COUNT(*) INTO stylist_count
  FROM business_members bm
  WHERE bm.business_id = business_id_param;
  
  -- For now, assume single location (can be extended later)
  location_count := 1;
  
  -- Determine tier
  IF location_count > 1 THEN
    RETURN 'enterprise';
  ELSIF stylist_count >= 2 THEN
    RETURN 'team';
  ELSE
    RETURN 'solo';
  END IF;
END;
$$;

-- Create function to upgrade to enterprise tier
CREATE OR REPLACE FUNCTION upgrade_to_enterprise(business_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE businesses
  SET 
    salon_tier = 'enterprise',
    manual_tier_override = true,
    updated_at = now()
  WHERE id = business_id_param;
END;
$$;

-- Create function to reset to automatic tier
CREATE OR REPLACE FUNCTION reset_to_auto_tier(business_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calculated_tier text;
BEGIN
  -- Calculate the tier
  SELECT calculate_salon_tier(business_id_param) INTO calculated_tier;
  
  -- Update business
  UPDATE businesses
  SET 
    salon_tier = calculated_tier,
    manual_tier_override = false,
    updated_at = now()
  WHERE id = business_id_param;
END;
$$;