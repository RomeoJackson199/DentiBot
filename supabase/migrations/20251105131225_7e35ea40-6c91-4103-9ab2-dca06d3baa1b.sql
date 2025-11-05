-- Enable real-time updates for businesses table
ALTER TABLE public.businesses REPLICA IDENTITY FULL;

-- Add businesses table to realtime publication so template changes propagate instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.businesses;