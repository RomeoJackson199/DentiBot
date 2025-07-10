-- Add indexes for better performance on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_appointment_slots_dentist_date 
ON public.appointment_slots (dentist_id, slot_date, slot_time);

CREATE INDEX IF NOT EXISTS idx_appointment_slots_available 
ON public.appointment_slots (is_available, emergency_only) 
WHERE is_available = true;

CREATE INDEX IF NOT EXISTS idx_appointments_patient_status 
ON public.appointments (patient_id, status, appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointments_dentist_date 
ON public.appointments (dentist_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created 
ON public.chat_messages (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_user_role 
ON public.profiles (user_id, role);

-- Add constraint to prevent overlapping appointment slots
ALTER TABLE public.appointment_slots 
ADD CONSTRAINT unique_slot_per_dentist_time 
UNIQUE (dentist_id, slot_date, slot_time);

-- Add trigger to automatically update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to relevant tables if not already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_appointment_slots_updated_at'
  ) THEN
    CREATE TRIGGER update_appointment_slots_updated_at
      BEFORE UPDATE ON public.appointment_slots
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_appointments_updated_at'
  ) THEN
    CREATE TRIGGER update_appointments_updated_at
      BEFORE UPDATE ON public.appointments
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;