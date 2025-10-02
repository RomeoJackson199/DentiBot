-- Create payment_records table for proper revenue tracking
CREATE TABLE IF NOT EXISTS public.payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dentist_id UUID NOT NULL REFERENCES public.dentists(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_status TEXT NOT NULL DEFAULT 'completed',
  transaction_id TEXT,
  notes TEXT,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- Dentists can view and manage their own payment records
CREATE POLICY "Dentists can manage their payment records"
ON public.payment_records
FOR ALL
USING (public.current_user_is_dentist_for(dentist_id));

-- Patients can view their own payment records
CREATE POLICY "Patients can view their payment records"
ON public.payment_records
FOR SELECT
USING (patient_id = public.get_current_user_profile_id());

-- Add index for better query performance
CREATE INDEX idx_payment_records_dentist_date ON public.payment_records(dentist_id, payment_date DESC);
CREATE INDEX idx_payment_records_appointment ON public.payment_records(appointment_id);

-- Create appointment_reminders table
CREATE TABLE IF NOT EXISTS public.appointment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h', '2h', '1h')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  notification_method TEXT NOT NULL DEFAULT 'email' CHECK (notification_method IN ('email', 'sms', 'both')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(appointment_id, reminder_type)
);

-- Enable RLS
ALTER TABLE public.appointment_reminders ENABLE ROW LEVEL SECURITY;

-- System can manage reminders
CREATE POLICY "System can manage appointment reminders"
ON public.appointment_reminders
FOR ALL
USING (true);

-- Create trigger to auto-create reminders when appointment is created
CREATE OR REPLACE FUNCTION public.create_appointment_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create 24h reminder
  INSERT INTO public.appointment_reminders (
    appointment_id,
    reminder_type,
    scheduled_for,
    notification_method
  ) VALUES (
    NEW.id,
    '24h',
    NEW.appointment_date - INTERVAL '24 hours',
    'email'
  ) ON CONFLICT (appointment_id, reminder_type) DO NOTHING;
  
  -- Create 2h reminder
  INSERT INTO public.appointment_reminders (
    appointment_id,
    reminder_type,
    scheduled_for,
    notification_method
  ) VALUES (
    NEW.id,
    '2h',
    NEW.appointment_date - INTERVAL '2 hours',
    'email'
  ) ON CONFLICT (appointment_id, reminder_type) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_appointment_reminders
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.create_appointment_reminders();

-- Update get_dashboard_overview function to use real payment data
CREATE OR REPLACE FUNCTION public.get_dashboard_overview(p_dentist_id uuid)
RETURNS TABLE(
  today_appointments_count bigint,
  urgent_cases_count bigint,
  patients_waiting_count bigint,
  patients_in_treatment_count bigint,
  revenue_today numeric,
  pending_tasks_count bigint,
  unread_messages_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM dentists d
    JOIN profiles p ON p.id = d.profile_id
    WHERE d.id = p_dentist_id AND p.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only the dentist can view their dashboard';
  END IF;

  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM appointments 
     WHERE dentist_id = p_dentist_id 
     AND DATE(appointment_date) = CURRENT_DATE 
     AND status != 'cancelled') as today_appointments_count,
    
    (SELECT COUNT(*) FROM appointments 
     WHERE dentist_id = p_dentist_id 
     AND urgency = 'high' 
     AND appointment_date >= now() 
     AND status != 'cancelled') as urgent_cases_count,
    
    (SELECT COUNT(*) FROM appointments 
     WHERE dentist_id = p_dentist_id 
     AND patient_status = 'checked_in' 
     AND DATE(appointment_date) = CURRENT_DATE) as patients_waiting_count,
    
    (SELECT COUNT(*) FROM appointments 
     WHERE dentist_id = p_dentist_id 
     AND patient_status = 'in_treatment' 
     AND DATE(appointment_date) = CURRENT_DATE) as patients_in_treatment_count,
    
    -- Use actual payment records for revenue
    (SELECT COALESCE(SUM(amount), 0) FROM payment_records 
     WHERE dentist_id = p_dentist_id 
     AND DATE(payment_date) = CURRENT_DATE 
     AND payment_status = 'completed') as revenue_today,
    
    (SELECT COUNT(*) FROM dentist_tasks 
     WHERE dentist_id = p_dentist_id 
     AND status = 'open') as pending_tasks_count,
    
    (SELECT COUNT(*) FROM communications 
     WHERE dentist_id = p_dentist_id 
     AND status = 'unread') as unread_messages_count;
END;
$$;