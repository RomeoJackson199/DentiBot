-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  dentist_id UUID NOT NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL DEFAULT 'General consultation',
  status TEXT NOT NULL DEFAULT 'pending',
  urgency TEXT NOT NULL DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointments_dentist FOREIGN KEY (dentist_id) REFERENCES public.dentists(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Policies: patients can manage their own appointments
CREATE POLICY "Patients can view their own appointments"
  ON public.appointments FOR SELECT
  USING (
    patient_id IN (
      SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can create their own appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can update their own appointments"
  ON public.appointments FOR UPDATE
  USING (
    patient_id IN (
      SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can delete their own appointments"
  ON public.appointments FOR DELETE
  USING (
    patient_id IN (
      SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_dentist_date ON public.appointments(dentist_id, appointment_date);

-- Trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Booking RPC to atomically reserve a slot
CREATE OR REPLACE FUNCTION public.book_appointment_slot(
  p_dentist_id UUID,
  p_slot_date DATE,
  p_slot_time TEXT,
  p_appointment_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE public.appointment_slots
  SET is_available = false,
      appointment_id = p_appointment_id,
      updated_at = now()
  WHERE dentist_id = p_dentist_id
    AND slot_date = p_slot_date
    AND slot_time = p_slot_time
    AND is_available = true;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 1 THEN
    RETURN true;
  ELSE
    RAISE EXCEPTION 'Slot not available';
  END IF;
END;
$$;

-- Ensure realtime on appointments if needed
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;