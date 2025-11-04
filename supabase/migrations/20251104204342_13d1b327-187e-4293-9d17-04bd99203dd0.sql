-- Create trigger to automatically update salon tier when business members change
CREATE OR REPLACE FUNCTION auto_update_salon_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_count integer;
BEGIN
  -- Get the business_id (works for INSERT, UPDATE, DELETE)
  DECLARE
    target_business_id uuid;
  BEGIN
    IF TG_OP = 'DELETE' THEN
      target_business_id := OLD.business_id;
    ELSE
      target_business_id := NEW.business_id;
    END IF;

    -- Count members for this business
    SELECT COUNT(*) INTO member_count
    FROM business_members
    WHERE business_id = target_business_id;

    -- Update the business tier (only if not manually overridden)
    UPDATE businesses
    SET 
      salon_tier = CASE 
        WHEN member_count >= 2 THEN 'team'
        ELSE 'solo'
      END,
      updated_at = now()
    WHERE id = target_business_id
      AND (manual_tier_override = false OR manual_tier_override IS NULL);
  END;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_update_salon_tier ON business_members;

-- Create trigger on business_members table
CREATE TRIGGER trigger_auto_update_salon_tier
AFTER INSERT OR UPDATE OR DELETE ON business_members
FOR EACH ROW
EXECUTE FUNCTION auto_update_salon_tier();

-- Initialize salon_tier for all existing businesses based on their member count
UPDATE businesses b
SET salon_tier = COALESCE(
  (
    SELECT CASE 
      WHEN COUNT(*) >= 2 THEN 'team'
      ELSE 'solo'
    END
    FROM business_members bm
    WHERE bm.business_id = b.id
  ),
  'solo'
),
updated_at = now()
WHERE salon_tier IS NULL OR manual_tier_override IS NULL OR manual_tier_override = false;