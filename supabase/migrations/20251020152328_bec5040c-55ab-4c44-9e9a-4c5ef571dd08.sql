-- Create appointment_slots table
CREATE TABLE IF NOT EXISTS public.appointment_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dentist_id UUID NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  slot_time TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  emergency_only BOOLEAN NOT NULL DEFAULT false,
  appointment_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dentist_id, slot_date, slot_time)
);

-- Enable RLS
ALTER TABLE public.appointment_slots ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  -- Public can view available slots
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'appointment_slots' AND policyname = 'Anyone can view appointment slots'
  ) THEN
    CREATE POLICY "Anyone can view appointment slots"
    ON public.appointment_slots
    FOR SELECT
    USING (true);
  END IF;

  -- Authenticated users can reserve available slots (mark unavailable and attach appointment_id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'appointment_slots' AND policyname = 'Authenticated users can reserve available slots'
  ) THEN
    CREATE POLICY "Authenticated users can reserve available slots"
    ON public.appointment_slots
    FOR UPDATE TO authenticated
    USING (is_available = true)
    WITH CHECK (true);
  END IF;
END $$;

-- Trigger to keep updated_at current
DROP TRIGGER IF EXISTS update_appointment_slots_updated_at ON public.appointment_slots;
CREATE TRIGGER update_appointment_slots_updated_at
BEFORE UPDATE ON public.appointment_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: generate_daily_slots(dentist_id, date)
CREATE OR REPLACE FUNCTION public.generate_daily_slots(p_dentist_id uuid, p_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_time TIME := TIME '09:00';
  end_time   TIME := TIME '17:00';
  interval_min INTEGER := 30;
  t TIME;
BEGIN
  -- Generate 30-min slots from 09:00 to 17:00
  t := start_time;
  WHILE t < end_time LOOP
    INSERT INTO public.appointment_slots (dentist_id, slot_date, slot_time, is_available, emergency_only)
    VALUES (p_dentist_id, p_date, to_char(t, 'HH24:MI'), true, false)
    ON CONFLICT (dentist_id, slot_date, slot_time) DO NOTHING;

    t := (t + make_interval(mins => interval_min));
  END LOOP;
END;
$$;