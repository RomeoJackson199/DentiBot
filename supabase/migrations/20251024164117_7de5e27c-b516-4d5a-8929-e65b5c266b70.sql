-- Update the first business to Caberu
UPDATE public.businesses 
SET 
  name = 'Caberu',
  slug = 'caberu',
  tagline = 'Modern dental care excellence'
WHERE id = 'b9876543-1234-5678-9abc-def012345678';

-- Verify the update
DO $$
DECLARE
  v_updated_name text;
BEGIN
  SELECT name INTO v_updated_name 
  FROM public.businesses 
  WHERE id = 'b9876543-1234-5678-9abc-def012345678';
  
  RAISE NOTICE 'Updated business name to: %', v_updated_name;
END $$;