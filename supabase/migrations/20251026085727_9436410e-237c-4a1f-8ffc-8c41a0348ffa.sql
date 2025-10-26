-- Add booking_source field to track AI vs Manual bookings
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS booking_source text DEFAULT 'manual' CHECK (booking_source IN ('ai', 'manual'));