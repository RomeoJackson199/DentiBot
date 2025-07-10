-- Create appointment slots table to manage availability
CREATE TABLE public.appointment_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dentist_id UUID NOT NULL,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  appointment_id UUID NULL, -- Reference to the booked appointment
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(dentist_id, slot_date, slot_time) -- Prevent duplicate slots
);

-- Enable RLS
ALTER TABLE public.appointment_slots ENABLE ROW LEVEL SECURITY;

-- Create policies for appointment slots
CREATE POLICY "Anyone can view available slots" 
ON public.appointment_slots 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage slots" 
ON public.appointment_slots 
FOR ALL 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_appointment_slots_updated_at
BEFORE UPDATE ON public.appointment_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate slots for a dentist for a specific date
CREATE OR REPLACE FUNCTION public.generate_daily_slots(
  p_dentist_id UUID,
  p_date DATE
) RETURNS void AS $$
DECLARE
  slot_time TIME;
BEGIN
  -- Generate slots from 9:00 AM to 5:00 PM (every 30 minutes)
  FOR slot_time IN 
    SELECT generate_series(
      '09:00'::TIME, 
      '17:00'::TIME, 
      INTERVAL '30 minutes'
    )::TIME
  LOOP
    INSERT INTO public.appointment_slots (dentist_id, slot_date, slot_time)
    VALUES (p_dentist_id, p_date, slot_time)
    ON CONFLICT (dentist_id, slot_date, slot_time) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to book a slot
CREATE OR REPLACE FUNCTION public.book_appointment_slot(
  p_dentist_id UUID,
  p_slot_date DATE,
  p_slot_time TIME,
  p_appointment_id UUID
) RETURNS boolean AS $$
BEGIN
  UPDATE public.appointment_slots 
  SET 
    is_available = false,
    appointment_id = p_appointment_id,
    updated_at = now()
  WHERE 
    dentist_id = p_dentist_id 
    AND slot_date = p_slot_date 
    AND slot_time = p_slot_time
    AND is_available = true;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to release a slot when appointment is cancelled
CREATE OR REPLACE FUNCTION public.release_appointment_slot(
  p_appointment_id UUID
) RETURNS boolean AS $$
BEGIN
  UPDATE public.appointment_slots 
  SET 
    is_available = true,
    appointment_id = NULL,
    updated_at = now()
  WHERE appointment_id = p_appointment_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;