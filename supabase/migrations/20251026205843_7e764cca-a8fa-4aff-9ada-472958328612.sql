-- Add bio column to businesses table
ALTER TABLE public.businesses 
ADD COLUMN bio text;

COMMENT ON COLUMN public.businesses.bio IS 'Business description and about information';